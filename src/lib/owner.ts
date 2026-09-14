import 'server-only';

// 소유자(사이트 주인) 세션 판정 — 다중 사용자 전환 이후에도 "나만 보는" 기능을 위한
// 게이트다. OWNER_EMAIL과 일치하는 로그인 세션일 때만 참. 슬랙 피드(/slack)처럼 소유자
// 전용 화면이 이 함수 하나로 접근을 가른다. 요청당 1회만 세션을 검증하도록 캐시한다.

import { cache } from 'react';
import { getSessionClaims } from './current-user';

function ownerEmail(): string | null {
  const raw = process.env.OWNER_EMAIL;
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export const isOwnerSession = cache(async (): Promise<boolean> => {
  const owner = ownerEmail();
  if (!owner) return false;
  // getSessionClaims는 JWT를 로컬에서 서명 검증하며(비대칭 키, 왕복 없음) 게이트·데이터
  // 스토어와 결과를 공유한다(current-user.ts 주석 참고). email 클레임으로 소유자를 가른다.
  const claims = await getSessionClaims();
  const email = claims?.email;
  if (!email) return false;
  return email.trim().toLowerCase() === owner;
});
