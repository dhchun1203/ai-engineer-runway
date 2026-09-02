// GET /api/bookmarks?lesson=<slug> — 레슨 페이지 플로팅 북마크 버튼의 상태 소스.
// /api/progress/route.ts의 규율을 그대로 따른다: hasUnlockCookie()를 무조건, 그리고
// 어떤 조회보다도 먼저 호출한다. 잠금 해제 전이면 bookmarks를 null로 고정한다 —
// 북마크 유무를 추론할 수 있는 어떤 값도 새어나가지 않는다.
//
// 진도(/api/progress)와 분리한 새 엔드포인트인 이유: 진도 라우트는 게이트 순서 검사
// (check-progress-gates.mjs)가 응답 형태를 계약으로 고정하고 있어 필드를 덧붙이면
// 그 검사가 흔들린다. 북마크는 독립 관심사라 자체 라우트를 둔다.
//
// cookies()를 호출하므로 기본적으로 동적이다 — 정적 캐싱을 강제하지 않고 대신 모든
// 응답에 Cache-Control: private, no-store를 명시한다(한 사용자의 북마크가 캐시로
// 다른 요청자에게 새는 것을 막는다).

import { NextResponse } from 'next/server';
import { hasUnlockCookie } from '@/lib/auth';
import { getLessonBySlug } from '@/content/curriculum-helpers';
import { readLessonBookmarks, type Bookmark } from '@/lib/bookmark-store';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' } as const;

export type BookmarksApiResponse = {
  unlocked: boolean;
  ok: boolean;
  bookmarks: Bookmark[] | null;
};

function emptyBody(unlocked: boolean, ok: boolean): BookmarksApiResponse {
  return { unlocked, ok, bookmarks: null };
}

export async function GET(request: Request) {
  // 무조건, 그리고 어떤 조회보다도 먼저 호출한다.
  const unlocked = await hasUnlockCookie();

  if (!unlocked) {
    return NextResponse.json(emptyBody(false, false), { status: 200, headers: NO_STORE_HEADERS });
  }

  // ?lesson=<slug> — 존재 여부를 먼저 검증한다. 미존재 슬러그는 오류가 아니라 빈
  // 목록으로 처리한다(존재 여부를 되묻는 탐침이 되지 않게 한다).
  const lessonSlug = new URL(request.url).searchParams.get('lesson');
  if (!lessonSlug || !getLessonBySlug(lessonSlug)) {
    return NextResponse.json({ unlocked: true, ok: true, bookmarks: [] }, { status: 200, headers: NO_STORE_HEADERS });
  }

  const read = await readLessonBookmarks(lessonSlug);
  if (!read.ok) {
    return NextResponse.json(emptyBody(true, false), { status: 502, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json(
    { unlocked: true, ok: true, bookmarks: read.bookmarks },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
