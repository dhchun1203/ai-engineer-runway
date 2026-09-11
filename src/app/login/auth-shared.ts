import 'server-only';

// 로그인·회원가입 Server Action이 공유하는 헬퍼. 두 액션이 같은 규칙(지속성 쿠키 기간,
// 폼 필드 읽기)을 각자 복제하지 않게 한 곳에 둔다 — 이 코드베이스가 반복해서 겪은
// "합의해야 하는 값을 두 파일에 따로 적어 어긋나는" 결함(globals.css의 단일 소스
// 주석들)을 회원가입 분리에서 되풀이하지 않으려는 것.
//
// 다중 사용자 전환(2026-09-12) 이후 소유자 이메일 화이트리스트는 없앴다 — 누구나 가입·
// 로그인할 수 있으므로 ownerEmail 헬퍼도 제거했다.
//
// 'use server'를 붙이지 않는다 — 이 모듈은 액션이 아니라 유틸이고, 액션이 아닌
// 값(타입·상수·동기 함수)을 내보내야 하기 때문이다('use server' 모듈은 async 함수만
// 내보낼 수 있다). 대신 'server-only'로 클라이언트 번들 유입을 막는다.

import { cookies } from 'next/headers';
import { PERSIST_COOKIE } from '@/lib/supabase/server';

// error: 빨간 오류 문구. notice: 중립 안내(예: 확인 메일 발송). 성공 시엔 액션이 redirect한다.
export type AuthState = { error: string | null; notice: string | null };

// sb-persist='1'을 지속 쿠키로 둘 기간(약 400일 — 브라우저 허용 최대치에 근접).
const PERSIST_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

// "로그인 정보 저장" 여부를 동반 쿠키에 기록한다 — proxy가 리프레시 때 이 값을 보고 세션
// 쿠키 유지 여부를 결정한다. 해제 시 이 쿠키 자체도 세션 쿠키(브라우저 닫으면 사라짐).
export function writePersistCookie(
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

/** 폼에서 이메일·비밀번호·저장 여부를 읽어 정규화한다. 회원가입의 비밀번호 재입력
 *  (confirm)은 액션에서 따로 읽는다 — 로그인엔 없는 필드라 공유 리더에 넣지 않는다. */
export function readCredentials(formData: FormData) {
  return {
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
    remember: formData.get('remember') === 'on',
  };
}
