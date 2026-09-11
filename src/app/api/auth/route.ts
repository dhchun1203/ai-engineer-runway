// GET /api/auth — 내비가 "로그인"/"프로필" 라벨을 고르기 위한 최소 인증 상태 조회.
// 진도 데이터를 읽지 않고 게이트 판정(hasUnlockCookie)만 반환한다 — /api/progress보다
// 가볍다. 클라이언트 내비가 마운트 시 한 번 부른다. 캐시 금지(사용자별·상태별 응답).

import { NextResponse } from 'next/server';
import { hasUnlockCookie } from '@/lib/auth';
import { isOwnerSession } from '@/lib/owner';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0, must-revalidate' };

export async function GET() {
  // loggedIn: 아무 사용자 로그인 여부(내비 라벨용). isOwner: 소유자 전용 항목(슬랙 피드)
  // 노출 여부 — 내비가 이 값으로 "슬랙" 링크를 소유자에게만 보인다.
  const [loggedIn, isOwner] = await Promise.all([hasUnlockCookie(), isOwnerSession()]);
  return NextResponse.json({ loggedIn, isOwner }, { status: 200, headers: NO_STORE_HEADERS });
}
