// 요청 쿠키 기반 잠금 해제 판정 — 모든 게이트 지점(페이지 · Server Action)이
// 이 함수 하나만 호출한다. 각자 cookies()를 직접 다루지 않게 해서 게이트를
// 빠뜨릴 경로를 줄인다 (RESEARCH Pattern 1, D-17/D-18/D-20).
//
// middleware.ts는 만들지 않는다 — 콘텐츠는 공개여야 하므로(D-18) 미들웨어로
// 요청을 사전 차단하면 오히려 D-18과 충돌하고, Server Action 내부 재검증이
// 어차피 필수라 중복 대비 이득이 작다 (RESEARCH Anti-Patterns, A4 재검토 채택).

import { cookies } from 'next/headers';
import { UNLOCK_COOKIE_NAME, isValidUnlockValue } from './unlock-secret';

export async function hasUnlockCookie(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(UNLOCK_COOKIE_NAME)?.value;
  return isValidUnlockValue(value, process.env.UNLOCK_SECRET);
}
