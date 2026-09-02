// GET /api/auth — 내비가 "로그인"/"프로필" 라벨을 고르기 위한 최소 인증 상태 조회.
// 진도 데이터를 읽지 않고 게이트 판정(hasUnlockCookie)만 반환한다 — /api/progress보다
// 가볍다. 클라이언트 내비가 마운트 시 한 번 부른다. 캐시 금지(사용자별·상태별 응답).

import { NextResponse } from 'next/server';
import { hasUnlockCookie } from '@/lib/auth';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0, must-revalidate' };

export async function GET() {
  const loggedIn = await hasUnlockCookie();
  return NextResponse.json({ loggedIn }, { status: 200, headers: NO_STORE_HEADERS });
}
