'use server';

// 로그인/로그아웃 Server Action. 본문 순서가 곧 보안 계약이다 — 소유자 화이트리스트
// 검증(OWNER_EMAIL 일치)을 먼저 한 다음에만 signInWithPassword를 호출한다. 화이트리스트에
// 없는 이메일이면 인증 시도조차 하지 않는다(존재 여부를 되묻는 탐침 차단, 데이터 전역
// 공유 상황에서 타 계정 접근 봉쇄).
//
// signInWithPassword가 성공하면 @supabase/ssr의 서버 클라이언트가 세션 쿠키를 발급한다
// (Server Action은 쿠키 쓰기가 가능한 컨텍스트다). 그 뒤 redirect('/')로 홈으로 보낸다 —
// hasUnlockCookie() 게이트가 이제 이 세션을 통과시킨다.

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, PERSIST_COOKIE } from '@/lib/supabase/server';

export type LoginState = { error: string | null };

// sb-persist='1'을 지속 쿠키로 둘 기간(약 400일 — 브라우저가 허용하는 최대치에 근접).
const PERSIST_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

function ownerEmail(): string | null {
  const raw = process.env.OWNER_EMAIL;
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export async function signInAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  // "로그인 정보 저장" 체크박스 — 체크 시 지속 로그인(재시작해도 유지), 해제 시 세션 전용.
  const remember = formData.get('remember') === 'on';

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 모두 입력해 주세요.' };
  }

  const owner = ownerEmail();
  if (!owner || email.toLowerCase() !== owner) {
    // 허용 목록에 없는 계정 — 인증을 시도하지 않는다.
    return { error: '허용된 계정이 아닙니다.' };
  }

  // persist=remember로 클라이언트를 만들어 signInWithPassword가 발급하는 인증 쿠키의
  // 지속성을 결정한다(해제 시 세션 쿠키).
  const supabase = await createSupabaseServerClient({ persist: remember });
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  }

  // 지속 여부를 동반 쿠키에 기록한다 — proxy가 매 요청 리프레시 때 이 값을 보고 세션 쿠키
  // 유지 여부를 결정한다. remember 해제 시 이 쿠키 자체도 세션 쿠키(브라우저 닫으면 사라짐).
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  if (remember) {
    cookieStore.set(PERSIST_COOKIE, '1', {
      maxAge: PERSIST_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
      secure,
    });
  } else {
    cookieStore.set(PERSIST_COOKIE, '0', { path: '/', sameSite: 'lax', secure });
  }

  // 성공 — redirect는 예외를 던져 흐름을 종료하므로 이 아래로는 도달하지 않는다.
  redirect('/');
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  // 지속성 마커도 함께 정리한다.
  const cookieStore = await cookies();
  cookieStore.delete(PERSIST_COOKIE);
  // 홈으로 보낸다(로그아웃 전 위치가 /login이면 /login→/login 동일 경로라 내비의
  // 로그인 상태 재조회 effect가 안 돌아 "프로필"이 남는다 — 경로를 바꿔 갱신을 유도).
  redirect('/');
}
