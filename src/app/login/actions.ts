'use server';

// 로그인/회원가입/로그아웃 Server Action. 본문 순서가 곧 보안 계약이다 — 소유자 화이트리스트
// 검증(OWNER_EMAIL 일치)을 먼저 한 다음에만 Supabase Auth를 호출한다. 화이트리스트에 없는
// 이메일이면 인증/가입 시도조차 하지 않는다(데이터 전역 공유 상황에서 타 계정 봉쇄).
//
// 회원가입은 "본인 이메일만" 허용한다(1인용 개인 사이트). 계정이 이미 있으면 "이미 가입됨"으로
// 안내한다. 이메일 확인이 켜진 프로젝트라면 확인 메일 안내를 반환한다.

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, PERSIST_COOKIE } from '@/lib/supabase/server';
import { UNLOCK_COOKIE_NAME } from '@/lib/unlock-secret';

// error: 빨간 오류 문구. notice: 중립 안내(예: 확인 메일 발송). 성공 시엔 redirect한다.
export type LoginState = { error: string | null; notice: string | null };

// sb-persist='1'을 지속 쿠키로 둘 기간(약 400일 — 브라우저 허용 최대치에 근접).
const PERSIST_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

function ownerEmail(): string | null {
  const raw = process.env.OWNER_EMAIL;
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

// "로그인 정보 저장" 여부를 동반 쿠키에 기록한다 — proxy가 리프레시 때 이 값을 보고 세션 쿠키
// 유지 여부를 결정한다. 해제 시 이 쿠키 자체도 세션 쿠키(브라우저 닫으면 사라짐).
function writePersistCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  remember: boolean,
): void {
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
}

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
    remember: formData.get('remember') === 'on',
  };
}

async function doSignIn(formData: FormData): Promise<LoginState> {
  const { email, password, remember } = readCredentials(formData);

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 모두 입력해 주세요.', notice: null };
  }
  const owner = ownerEmail();
  if (!owner || email.toLowerCase() !== owner) {
    return { error: '허용된 계정이 아닙니다.', notice: null };
  }

  const supabase = await createSupabaseServerClient({ persist: remember });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.', notice: null };
  }

  const cookieStore = await cookies();
  writePersistCookie(cookieStore, remember);
  redirect('/');
}

async function doSignUp(formData: FormData): Promise<LoginState> {
  const { email, password, remember } = readCredentials(formData);

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 모두 입력해 주세요.', notice: null };
  }
  if (password.length < 6) {
    return { error: '비밀번호는 6자 이상이어야 해요.', notice: null };
  }
  const owner = ownerEmail();
  if (!owner || email.toLowerCase() !== owner) {
    // 1인용 개인 사이트 — 본인 이메일만 가입할 수 있다.
    return { error: '이 사이트는 지정된 이메일만 가입할 수 있어요.', notice: null };
  }

  const supabase = await createSupabaseServerClient({ persist: remember });
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (/registered|already|exist/i.test(error.message)) {
      return { error: '이미 가입된 계정이에요. 아래 "로그인"으로 들어와 주세요.', notice: null };
    }
    return { error: '회원가입에 실패했어요. 잠시 후 다시 시도해 주세요.', notice: null };
  }

  // 이메일 확인이 꺼진 프로젝트면 세션이 바로 발급된다 → 로그인 완료로 처리.
  if (data.session) {
    const cookieStore = await cookies();
    writePersistCookie(cookieStore, remember);
    redirect('/');
  }

  // 이메일 확인이 켜진 경우 — 확인 메일 안내.
  return {
    error: null,
    notice: '확인 이메일을 보냈어요. 메일의 링크로 인증한 뒤 "로그인"으로 들어와 주세요.',
  };
}

// 폼의 hidden "mode" 필드로 로그인/회원가입을 가른다(useActionState 하나로 두 모드 처리).
export async function authAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (formData.get('mode') === 'signup') {
    return doSignUp(formData);
  }
  return doSignIn(formData);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  // 지속성 마커 + 옛 시크릿 쿠키(runway_unlock)까지 함께 정리한다 — 시크릿 쿠키가 남아 있으면
  // Supabase 세션을 지워도 게이트(hasUnlockCookie)가 계속 통과해 "로그인됨"으로 보인다.
  cookieStore.delete(PERSIST_COOKIE);
  cookieStore.delete(UNLOCK_COOKIE_NAME);

  // 홈으로 보낸다(로그아웃 전 위치가 /login이면 /login→/login 동일 경로라 내비의 로그인 상태
  // 재조회 effect가 안 돌아 "프로필"이 남는다 — 경로를 바꿔 갱신을 유도).
  redirect('/');
}
