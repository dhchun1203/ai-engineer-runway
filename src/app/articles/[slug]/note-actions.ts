'use server';

// 아티클 메모 저장 Server Action. basecamp/[slug]/note-actions.ts와 같은 보안 계약
// (본문 순서가 계약이다): hasUnlockCookie() 재검증 → 슬러그 존재 검증 → 저장.

import { hasUnlockCookie } from '@/lib/auth';
import { getArticleBySlug } from '@/content/article-helpers';
import { saveLessonNote } from '@/lib/note-store';
import { articleNoteId } from '@/lib/article-note';

export async function saveArticleNoteAction(slug: string, body: string): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!getArticleBySlug(slug)) {
    throw new Error('invalid article');
  }

  await saveLessonNote(articleNoteId(slug), body);
}
