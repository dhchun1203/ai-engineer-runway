// 접근 게이트 판정 — 모든 게이트 지점(페이지 · Server Action · Route Handler)이 이
// 함수 하나만 호출한다. 각자 cookies()/세션을 직접 다루지 않게 해서 게이트를 빠뜨릴
// 경로를 줄인다 (RESEARCH Pattern 1, D-17/D-18/D-20).
//
// 다중 사용자 전환(2026-09-12): 이 사이트는 이제 누구나 가입할 수 있고, 각 사용자는
// 자기 데이터만 갖는다. 그래서 이 게이트는 "특정 소유자(OWNER_EMAIL)인지"가 아니라
// "로그인한 아무 사용자인지"만 본다. 게이트는 두 방식을 additive하게 허용한다:
//   1) 유효한 로그인 세션(아무 사용자)          ← 사용자의 실제 경로
//   2) 기존 공유 시크릿 쿠키(runway_unlock)      ← 폴백 + e2e 하네스(scripts/e2e-*.mjs)용
// 둘 중 하나라도 참이면 통과다. 시크릿 경로를 제거하지 않는 이유: e2e 스크립트와
// /unlock 라우트가 이 쿠키에 의존한다 — 제거하면 검증 하네스가 파손된다. 함수명·
// 시그니처(hasUnlockCookie / Promise<boolean>)는 그대로 둔다 — 16개 호출부와 게이트 순서
// 검사(check-progress-gates.mjs G4/G14/G17)가 이 이름·순서에 고정돼 있다.
//
// 주의: 시크릿 쿠키 경로는 콘텐츠 접근(게이트)만 통과시키고 Supabase 세션 user_id는 없다.
// 개인 데이터(진도·메모 등)는 current-user.ts의 user_id가 있어야 읽고 쓰므로, 시크릿
// 쿠키만으로는 개인 데이터가 비어 보인다(로그인해야 자기 데이터가 붙는다).
//
// middleware는 접근 차단용으로 만들지 않는다(D-18: 콘텐츠는 공개). 세션 리프레시만 하는
// src/proxy.ts는 리다이렉트/차단을 하지 않으므로 D-18과 충돌하지 않는다.

import { cookies } from 'next/headers';
import { UNLOCK_COOKIE_NAME, isValidUnlockValue } from './unlock-secret';
import { createSupabaseServerClient } from './supabase/server';

/** 기존 공유 시크릿 쿠키 판정 — 로컬 함수라 값이 변해도 게이트 순서 검사에 영향 없다. */
async function hasLegacyUnlockCookie(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(UNLOCK_COOKIE_NAME)?.value;
  return isValidUnlockValue(value, process.env.UNLOCK_SECRET);
}

/** 유효한 로그인 세션(아무 사용자)이 있는지. getUser()는 토큰을 Auth 서버로 검증하므로
 * 위조 쿠키로는 통과할 수 없다. 이제 이메일 화이트리스트는 보지 않는다 — 로그인한
 * 사용자는 누구든 자기 데이터에 접근할 자격이 있다(격리는 user_id가 담당). */
async function hasAuthenticatedSession(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return false;
    return true;
  } catch {
    // 세션 검증 중 오류(네트워크 등)는 "미인가"로 강등한다 — 실패를 통과로 오인하지 않는다.
    return false;
  }
}

export async function hasUnlockCookie(): Promise<boolean> {
  // 시크릿 쿠키(로컬·즉시 판정)를 먼저 본다 — 있으면 세션 네트워크 왕복을 생략한다
  // (e2e 하네스는 이 경로만 쓴다). 없으면 로그인 세션을 검증한다(사용자의 실제 경로).
  if (await hasLegacyUnlockCookie()) return true;
  return hasAuthenticatedSession();
}
