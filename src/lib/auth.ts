// 접근 게이트 판정 — 모든 게이트 지점(페이지 · Server Action · Route Handler)이 이
// 함수 하나만 호출한다. 각자 cookies()/세션을 직접 다루지 않게 해서 게이트를 빠뜨릴
// 경로를 줄인다 (RESEARCH Pattern 1, D-17/D-18/D-20).
//
// quick-260902-kau: "새 기기마다 시크릿 키를 찾는 불편"을 없애려고 이메일+비밀번호
// 로그인(Supabase Auth)을 도입했다. 이 게이트는 두 방식을 additive하게 허용한다:
//   1) 유효한 소유자(OWNER_EMAIL) 로그인 세션  ← 새 기본 경로(사용자가 실제로 쓰는 것)
//   2) 기존 공유 시크릿 쿠키(runway_unlock)      ← 폴백 + e2e 하네스(scripts/e2e-*.mjs)용
// 둘 중 하나라도 참이면 통과다. 시크릿 경로를 제거하지 않는 이유: e2e 스크립트 7종과
// /unlock 라우트가 이 쿠키에 의존한다 — 제거하면 검증 하네스가 전면 파손된다. 함수명·
// 시그니처(hasUnlockCookie / Promise<boolean>)는 그대로 둔다 — 16개 호출부와 게이트 순서
// 검사(check-progress-gates.mjs G4/G14/G17)가 이 이름·순서에 고정돼 있다.
//
// middleware는 접근 차단용으로 만들지 않는다(D-18: 콘텐츠는 공개). 세션 리프레시만 하는
// src/proxy.ts는 리다이렉트/차단을 하지 않으므로 D-18과 충돌하지 않는다.

import { cookies } from 'next/headers';
import { UNLOCK_COOKIE_NAME, isValidUnlockValue } from './unlock-secret';
import { createSupabaseServerClient } from './supabase/server';

/** OWNER_EMAIL을 정규화해 반환한다. 미설정이면 null — 그때는 세션 경로가 비활성이고
 * 시크릿 폴백만 남는다(안전한 기본값: 화이트리스트 없이는 세션으로 통과시키지 않는다). */
function ownerEmail(): string | null {
  const raw = process.env.OWNER_EMAIL;
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/** 기존 공유 시크릿 쿠키 판정 — 로컬 함수라 값이 변해도 게이트 순서 검사에 영향 없다. */
async function hasLegacyUnlockCookie(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(UNLOCK_COOKIE_NAME)?.value;
  return isValidUnlockValue(value, process.env.UNLOCK_SECRET);
}

/** 유효한 소유자 로그인 세션이 있는지. getUser()는 토큰을 Auth 서버로 검증하므로
 * 위조 쿠키로는 통과할 수 없다. 이메일이 OWNER_EMAIL과 일치할 때만 참이다 — 이 프로젝트가
 * 다른 앱(ai-news-briefing)과 같은 Supabase 프로젝트를 공유해 auth.users에 타 앱 계정이
 * 있을 수 있으므로, 화이트리스트 일치는 게이트의 필수 조건이다. */
async function hasOwnerSession(): Promise<boolean> {
  const owner = ownerEmail();
  if (!owner) return false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email) return false;
    return data.user.email.trim().toLowerCase() === owner;
  } catch {
    // 세션 검증 중 오류(네트워크 등)는 "미인가"로 강등한다 — 실패를 통과로 오인하지 않는다.
    return false;
  }
}

export async function hasUnlockCookie(): Promise<boolean> {
  // 시크릿 쿠키(로컬·즉시 판정)를 먼저 본다 — 있으면 세션 네트워크 왕복을 생략한다
  // (e2e 하네스는 이 경로만 쓴다). 없으면 로그인 세션을 검증한다(사용자의 실제 경로).
  if (await hasLegacyUnlockCookie()) return true;
  return hasOwnerSession();
}
