import 'server-only';

// 관리자 승인제 가입의 핵심 로직을 한곳에 모은다. 회원가입 액션 / 로그인 액션 / 관리자
// 페이지가 각자 auth.admin을 직접 만지지 않고 이 모듈만 부른다(게이트를 빠뜨릴 경로를 줄인다).
//
// 상태 모델: 가입 요청이 들어오면 auth.users에 "차단(ban)"된 유저를 만들고(요청자가 정한
// 비밀번호 보존, Supabase 확인 메일은 email_confirm으로 억제), access_requests에 pending으로
// 기록한다. 소유자가 승인하면 차단을 풀고 approved로, 거절하면 rejected로(차단 유지) 바꾼다.
// 차단된 유저는 Supabase가 로그인을 자동 거부하므로 "승인 전엔 로그인 불가"가 보장된다.

import { timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from './supabase/admin';

// 100년 차단 = 사실상 무기한. 승인 시 'none'으로 풀어 준다.
const BAN_FOREVER = '876000h';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export type SignupResult =
  | { kind: 'created'; autoApproved: boolean }
  | { kind: 'duplicate'; status: RequestStatus }
  | { kind: 'error' };

/**
 * 수업 초대 코드 검증. env INVITE_CODE와 상수 시간으로 비교한다 — 맞으면 가입이 즉시
 * 승인된다(수동 승인 대기 없이 바로 로그인). 코드는 서버에서만 다루며 클라이언트로
 * 절대 내보내지 않는다(NEXT_PUBLIC_ 접두사 금지). INVITE_CODE가 비어 있으면(미설정)
 * 항상 false를 돌려 자동 승인 경로가 꺼진다 — 그 경우 모든 가입은 기존 수동 승인으로
 * 안전하게 흐른다(안전한 기본값). 길이가 다르면 timingSafeEqual이 던지므로 먼저 거른다.
 */
export function isValidInviteCode(input: string): boolean {
  const expected = process.env.INVITE_CODE?.trim();
  if (!expected || !input) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type PendingRequest = {
  userId: string;
  email: string;
  createdAt: string;
};

/** 이메일로 기존 가입 요청의 상태를 조회한다. 없으면 null. */
async function findRequestByEmail(email: string): Promise<RequestStatus | null> {
  const { data, error } = await supabaseAdmin
    .from('access_requests')
    .select('status')
    .eq('email', email)
    .maybeSingle();
  if (error || !data) return null;
  return data.status as RequestStatus;
}

/**
 * 가입 요청을 접수한다.
 * - autoApprove=false(기본): 유저를 차단 상태로 만들고 pending으로 기록한다(수동 승인 대기).
 * - autoApprove=true(초대 코드 일치): 차단하지 않고 곧바로 approved로 기록한다 — 바로 로그인
 *   할 수 있다. 초대 코드 검증(isValidInviteCode)은 호출부(signUpAction)가 이미 끝냈다.
 * 이미 있는 이메일이면 그 상태(pending/approved/rejected)를 담아 'duplicate'를 돌려준다.
 */
export async function createAccessRequest(
  email: string,
  password: string,
  autoApprove = false,
): Promise<SignupResult> {
  // 먼저 우리 테이블에서 중복을 본다 — 이 흐름으로 들어온 요청이면 여기서 잡힌다.
  const existing = await findRequestByEmail(email);
  if (existing) return { kind: 'duplicate', status: existing };

  // 유저 생성. email_confirm: true 로 Supabase 확인 메일을 억제한다(우리가 승인 흐름을 대신
  // 책임진다). autoApprove가 아니면 차단 상태로 만든다(ban_duration을 생성 시 함께 넣되,
  // 버전에 따라 무시될 수 있어 아래에서 한 번 더 확실히 차단한다). autoApprove면 차단하지
  // 않아 곧바로 로그인할 수 있다.
  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    ...(autoApprove ? {} : { ban_duration: BAN_FOREVER }),
  });

  if (created.error || !created.data.user) {
    // 이미 등록된 이메일인데 우리 테이블엔 없다 = 이 승인 흐름 이전에 만들어진 계정
    // (기존 소유자/테스터 등). 이미 쓸 수 있는 계정이므로 approved로 취급해 로그인으로 안내한다.
    if (/registered|already|exist/i.test(created.error?.message ?? '')) {
      return { kind: 'duplicate', status: 'approved' };
    }
    console.error('createAccessRequest: createUser 실패:', created.error);
    return { kind: 'error' };
  }

  const userId = created.data.user.id;

  // 수동 승인 경로에서만 확실히 차단한다(생성 시 무시된 경우 대비).
  if (!autoApprove) {
    await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: BAN_FOREVER });
  }

  const inserted = await supabaseAdmin.from('access_requests').insert({
    user_id: userId,
    email,
    status: autoApprove ? 'approved' : 'pending',
    ...(autoApprove ? { decided_at: new Date().toISOString() } : {}),
  });
  if (inserted.error) {
    // 테이블 기록에 실패하면 방금 만든 유저를 되돌려 고아 계정을 남기지 않는다.
    await supabaseAdmin.auth.admin.deleteUser(userId);
    console.error('createAccessRequest: access_requests insert 실패:', inserted.error);
    return { kind: 'error' };
  }

  return { kind: 'created', autoApproved: autoApprove };
}

/** 로그인 실패 문구 분기를 위해 이메일의 요청 상태를 조회한다. 없으면 null. */
export async function getStatusForEmail(email: string): Promise<RequestStatus | null> {
  return findRequestByEmail(email);
}

/** 대기 중인 요청을 생성 시간 순으로 돌려준다(관리자 목록). */
export async function listPendingRequests(): Promise<PendingRequest[]> {
  const { data, error } = await supabaseAdmin
    .from('access_requests')
    .select('user_id, email, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map((r) => ({ userId: r.user_id as string, email: r.email as string, createdAt: r.created_at as string }));
}

/** 이미 처리된 요청(승인/거절) 이력. 처리 시각 최신순. 초대 코드로 자동 승인된
 *  가입도 status=approved라 여기에 함께 포함된다(처리 시각=가입 시각). */
export type DecidedRequest = {
  userId: string;
  email: string;
  status: 'approved' | 'rejected';
  decidedAt: string | null;
};

export async function listDecidedRequests(): Promise<DecidedRequest[]> {
  const { data, error } = await supabaseAdmin
    .from('access_requests')
    .select('user_id, email, status, decided_at')
    .in('status', ['approved', 'rejected'])
    .order('decided_at', { ascending: false, nullsFirst: false });
  if (error || !data) return [];
  return data.map((r) => ({
    userId: r.user_id as string,
    email: r.email as string,
    status: r.status as 'approved' | 'rejected',
    decidedAt: (r.decided_at as string | null) ?? null,
  }));
}

/** 요청 승인: 차단 해제 + status=approved. 성공 시 요청자 이메일을 돌려준다(승인 메일 발송용). */
export async function approveRequest(userId: string): Promise<{ email: string } | null> {
  const { data, error } = await supabaseAdmin
    .from('access_requests')
    .select('email, status')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data || data.status !== 'pending') return null;

  const unban = await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: 'none' });
  if (unban.error) {
    console.error('approveRequest: 차단 해제 실패:', unban.error);
    return null;
  }

  const updated = await supabaseAdmin
    .from('access_requests')
    .update({ status: 'approved', decided_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (updated.error) {
    console.error('approveRequest: status 갱신 실패:', updated.error);
    return null;
  }
  return { email: data.email as string };
}

/** 요청 거절: status=rejected(차단은 유지). 성공 시 true. */
export async function rejectRequest(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('access_requests')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data || data.status !== 'pending') return false;

  const updated = await supabaseAdmin
    .from('access_requests')
    .update({ status: 'rejected', decided_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (updated.error) {
    console.error('rejectRequest: status 갱신 실패:', updated.error);
    return false;
  }
  return true;
}
