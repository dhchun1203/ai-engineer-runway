'use server';

// "복습 완료" 자기 신고 Server Action. 본문 순서가 곧 보안 계약이다 —
// hasUnlockCookie() 재검증 → getLessonBySlug() 존재 검증 다음에만 저장을
// 호출한다. lesson/[lessonId]/actions.ts의 완료 토글과 동일한 패턴이며, 같은
// 이유로 렌더 여부와 무관하게 이 함수가 스스로 재검증한다(Server Action은
// 컴파일된 POST 엔드포인트라 캡처된 요청이 재전송될 수 있다).
// scripts/check-review.mjs가 이 호출 순서를 문자 위치로 고정한다.

import { hasUnlockCookie } from '@/lib/auth';
import { getLessonBySlug } from '@/content/curriculum-helpers';
import { markLessonReviewed, recordReviewJudgment as storeRecordReviewJudgment } from '@/lib/review-store';
import { REVIEW_JUDGMENTS, type ReviewJudgment } from '@/lib/review';

export async function completeReview(lessonId: string): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!getLessonBySlug(lessonId)) {
    throw new Error('invalid lesson');
  }

  await markLessonReviewed(lessonId);
}

/** /review 세션의 O(맞음)/△(맞았지만 불안)/X(틀림) 판정 Server Action(quick
 * 260901-w04). completeReview와 동일한 순서로 스스로 재검증한다 — hasUnlockCookie
 * 실패 → throw, getLessonBySlug 없으면 → throw, questionIndex가 그 레슨
 * selfCheck 길이 범위를 벗어나면 → throw(위조 POST 방어), judgment도 화이트리스트로
 * 검증한다. 이 순서를 모두 통과한 다음에만 store를 호출한다. */
export async function recordReviewJudgment(
  lessonId: string,
  questionIndex: number,
  judgment: ReviewJudgment,
): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  const lesson = getLessonBySlug(lessonId);
  if (!lesson) {
    throw new Error('invalid lesson');
  }

  if (
    !Number.isInteger(questionIndex) ||
    questionIndex < 0 ||
    questionIndex >= lesson.selfCheck.length
  ) {
    throw new Error('invalid question index');
  }

  if (!REVIEW_JUDGMENTS.includes(judgment)) {
    throw new Error('invalid judgment');
  }

  await storeRecordReviewJudgment(lessonId, questionIndex, judgment);
}
