import 'server-only';

// 채널톡 로드맵(/roadmap)은 소유자 개인용 페이지다 — 아래 허용 목록의 이메일만 메뉴와
// 페이지에 접근할 수 있고, 그 외 로그인 계정에는 메뉴도 페이지도 보이지 않는다(사용자 요청).
//
// 허용 = OWNER_EMAIL(소유자, 환경 변수) + 명시적으로 허용한 테스터 계정. 테스터 계정은
// 비밀이 아니라 이 파일에 직접 적는다(교육기관명 같은 브랜딩 제약과 무관). 허용 계정을
// 바꾸려면 EXTRA_ALLOWED를 고치거나 OWNER_EMAIL을 조정하면 된다.
//
// 판정은 getSessionClaims(로컬 서명 검증)로 얻은 email 클레임으로 한다 — auth.ts·owner.ts와
// 같은 근거이며 요청당 한 번만 검증하고 그 결과를 공유한다(current-user.ts 주석 참고).

import { cache } from 'react';
import { getSessionClaims } from './current-user';

const EXTRA_ALLOWED = ['test@test.com'];

function allowedEmails(): ReadonlySet<string> {
  const set = new Set(EXTRA_ALLOWED.map((e) => e.trim().toLowerCase()));
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (owner) set.add(owner);
  return set;
}

/** 현재 세션이 채널톡 로드맵을 볼 수 있는 계정인지. 비로그인/미허용이면 false. 요청 단위 캐시. */
export const isRoadmapViewer = cache(async (): Promise<boolean> => {
  const claims = await getSessionClaims();
  const email = claims?.email?.trim().toLowerCase();
  if (!email) return false;
  return allowedEmails().has(email);
});
