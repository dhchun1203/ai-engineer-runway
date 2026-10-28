'use server';

// 책갈피 꽂기·옮기기·빼기 Server Action. note-actions.ts와 같은 보안 계약을 따른다 —
// hasUnlockCookie() 재검증을 무조건 먼저, 그다음 isBookmarkablePage() 존재 검증,
// 그 뒤에만 저장소를 건드린다. 정규 레슨뿐 아니라 베이스캠프·로드맵·수업 레슨의
// 책갈피(page-bookmark.tsx)도 이 액션을 쓴다.
//
// revalidatePath를 호출하지 않는다 — 레슨 페이지는 정적 셸이고 책갈피 상태는
// 클라이언트(page-bookmark.tsx)가 자체 fetch로 관리한다. 관리 페이지(/bookmarks)는
// force-dynamic이라 다음 방문 때 자동으로 최신을 읽는다.

import { hasUnlockCookie } from '@/lib/auth';
import { isBookmarkablePage } from '@/lib/bookmark-pages';
import { removeBookmark, setPageBookmark } from '@/lib/bookmark-store';

export async function setPageBookmarkAction(
  pageKey: string,
  sectionIndex: number,
  sectionTitle: string,
): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!(await isBookmarkablePage(pageKey))) {
    throw new Error('invalid lesson');
  }

  await setPageBookmark(pageKey, sectionIndex, sectionTitle);
}

export async function removeBookmarkAction(pageKey: string, sectionIndex: number): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!(await isBookmarkablePage(pageKey))) {
    throw new Error('invalid lesson');
  }

  await removeBookmark(pageKey, sectionIndex);
}
