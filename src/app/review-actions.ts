'use server';

// "복습 완료" 자기 신고 Server Action. 본문 순서가 곧 보안 계약이다 —
// hasUnlockCookie() 재검증 → getLessonBySlug() 존재 검증 다음에만 저장을
// 호출한다. lesson/[lessonId]/actions.ts의 완료 토글과 동일한 패턴이며, 같은
// 이유로 렌더 여부와 무관하게 이 함수가 스스로 재검증한다(Server Action은
// 컴파일된 POST 엔드포인트라 캡처된 요청이 재전송될 수 있다).
// scripts/check-review.mjs가 이 호출 순서를 문자 위치로 고정한다.

import { hasUnlockCookie } from '@/lib/auth';
import { getLessonBySlug } from '@/content/curriculum-helpers';
import { markLessonReviewed } from '@/lib/review-store';

export async function completeReview(lessonId: string): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!getLessonBySlug(lessonId)) {
    throw new Error('invalid lesson');
  }

  await markLessonReviewed(lessonId);
}
