'use server';

// 북마크 지정·해제 Server Action. note-actions.ts와 같은 보안 계약을 따른다 —
// hasUnlockCookie() 재검증을 무조건 먼저, 그다음 getLessonBySlug() 존재 검증,
// 그 뒤에만 저장소를 건드린다.
//
// revalidatePath를 호출하지 않는다 — 레슨 페이지는 정적 셸이고 북마크 상태는
// 클라이언트(bookmark-button.tsx)가 자체 fetch로 관리한다. 관리 페이지(/bookmarks)는
// force-dynamic이라 다음 방문 때 자동으로 최신을 읽는다.

import { hasUnlockCookie } from '@/lib/auth';
import { getLessonBySlug } from '@/content/curriculum-helpers';
import { addBookmark, removeBookmark } from '@/lib/bookmark-store';

export async function addBookmarkAction(
  lessonId: string,
  sectionIndex: number,
  sectionTitle: string,
): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!getLessonBySlug(lessonId)) {
    throw new Error('invalid lesson');
  }

  await addBookmark(lessonId, sectionIndex, sectionTitle);
}

export async function removeBookmarkAction(lessonId: string, sectionIndex: number): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!getLessonBySlug(lessonId)) {
    throw new Error('invalid lesson');
  }

  await removeBookmark(lessonId, sectionIndex);
}
