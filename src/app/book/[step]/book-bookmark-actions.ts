'use server';

// 책으로 읽기 책갈피 저장 Server Action. bookmark-actions.ts와 같은 보안 계약을
// 따른다 — hasUnlockCookie() 재검증을 무조건 먼저, 그다음 입력(step) 검증, 그 뒤에만
// 저장소를 건드린다.
//
// revalidatePath를 호출하지 않는다 — 책 페이지는 정적 셸이고 책갈피 상태는 클라이언트
// (book-bookmark.tsx)가 자체 fetch로 관리한다.

import { hasUnlockCookie } from '@/lib/auth';
import { setBookBookmark, type BookBookmark } from '@/lib/book-bookmark-store';

export async function setBookBookmarkAction(stepId: number, mark: BookBookmark): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!Number.isInteger(stepId) || stepId < 1 || stepId > 3) {
    throw new Error('invalid step');
  }

  // 좌표 범위·슬러그 길이 방어는 store(setBookBookmark)가 저장 직전에 한다.
  await setBookBookmark(stepId, {
    chapter: typeof mark?.chapter === 'string' ? mark.chapter : null,
    within: Number(mark?.within) || 0,
    y: Number(mark?.y) || 0,
  });
}
