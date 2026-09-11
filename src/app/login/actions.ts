'use server';

// 로그인/로그아웃 Server Action. 본문 순서가 곧 보안 계약이다 — 소유자 화이트리스트
// 검증(OWNER_EMAIL 일치)을 먼저 한 다음에만 Supabase Auth를 호출한다. 화이트리스트에 없는
// 이메일이면 인증 시도조차 하지 않는다(데이터 전역 공유 상황에서 타 계정 봉쇄).
//
// 회원가입은 별도 페이지(/signup)로 분리했다 — 그 액션은 src/app/signup/actions.ts에 있고,
// 소유자/지속성/폼 읽기 헬퍼는 auth-shared.ts에서 함께 쓴다.

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, PERSIST_COOKIE } from '@/lib/supabase/server';
import { UNLOCK_COOKIE_NAME } from '@/lib/unlock-secret';
import {
  type AuthState,
  readCredentials,
  writePersistCookie,
} from './auth-shared';

// 로그인 폼(useActionState)이 참조하는 상태 타입. auth-shared의 공용 타입을 그대로 쓴다.
export type LoginState = AuthState;

// 폼의 useActionState 시그니처(prev, formData). 로그인만 처리한다.
export async function authAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const { email, password, remember } = readCredentials(formData);

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 모두 입력해 주세요.', notice: null };
  }

  // 다중 사용자 전환: 이메일 화이트리스트는 없앴다 — 가입한 누구나 로그인할 수 있다.
  const supabase = await createSupabaseServerClient({ persist: remember });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.', notice: null };
  }

  const cookieStore = await cookies();
  writePersistCookie(cookieStore, remember);
  redirect('/');
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
