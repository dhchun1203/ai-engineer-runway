// GET /api/book-bookmark?step=<N> — 책으로 읽기 책갈피(스텝당 한 개)의 상태 소스.
// /api/bookmarks·/api/progress와 같은 규율: hasUnlockCookie()를 무조건, 그리고 어떤
// 조회보다도 먼저 호출한다. 잠금 해제 전이면 bookmark를 null로 고정한다 — 책갈피
// 유무를 추론할 수 있는 어떤 값도 새어나가지 않는다.
//
// cookies()를 호출하므로 기본 동적이고, 모든 응답에 Cache-Control: private, no-store를
// 명시한다(한 사용자의 책갈피가 캐시로 다른 요청자에게 새는 것을 막는다).

import { NextResponse } from 'next/server';
import { hasUnlockCookie } from '@/lib/auth';
import { readBookBookmark, type BookBookmark } from '@/lib/book-bookmark-store';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' } as const;

export type BookBookmarkApiResponse = {
  unlocked: boolean;
  ok: boolean;
  bookmark: BookBookmark | null;
};

export async function GET(request: Request) {
  // 무조건, 그리고 어떤 조회보다도 먼저 호출한다.
  const unlocked = await hasUnlockCookie();

  if (!unlocked) {
    return NextResponse.json(
      { unlocked: false, ok: false, bookmark: null },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  }

  const stepRaw = new URL(request.url).searchParams.get('step');
  const stepId = Number(stepRaw);
  // 범위 밖 step은 오류가 아니라 "책갈피 없음"으로 처리한다(탐침 방지).
  if (!Number.isInteger(stepId) || stepId < 1 || stepId > 3) {
    return NextResponse.json(
      { unlocked: true, ok: true, bookmark: null },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  }

  const read = await readBookBookmark(stepId);
  if (!read.ok) {
    return NextResponse.json(
      { unlocked: true, ok: false, bookmark: null },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json(
    { unlocked: true, ok: true, bookmark: read.bookmark },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
