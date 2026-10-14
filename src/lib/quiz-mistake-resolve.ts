import 'server-only';

// 오답 노트 키를 실제 문항으로 푼다(서버 전용 — 레슨 데이터가 커서 브라우저로 보내지 않는다).
// 저장 전에 키가 진짜 문항을 가리키는지 확인하는 데도 쓴다(위조 POST로 아무 키나 쌓이지
// 않게). 풀리지 않는 키(문항이 바뀌거나 지워진 경우)는 null이라 오답 노트에서 조용히 빠진다.

import { basecampReviewSteps } from '@/content/basecamp-review';
import { getReviewQuiz } from '@/content/review-quiz';
import { getLessonBySlug } from '@/content/curriculum-helpers';
import { parseQuizKey } from './quiz-mistake-key';

export type ResolvedQuizQuestion = {
  key: string;
  source: 'basecamp' | 'review';
  /** 묶음 id(STEP id 또는 레슨 slug) — 오답 노트가 같은 묶음끼리 모은다 */
  groupId: string;
  /** 묶음 이름(STEP 이름 또는 레슨 제목) */
  groupLabel: string;
  /** 다시 공부할 곳 */
  studyHref: string;
  studyLabel: string;
  question: { q: string; code?: string; options: string[]; answer: number; explain: string };
};

export function resolveQuizKey(key: string): ResolvedQuizQuestion | null {
  const parsed = parseQuizKey(key);
  if (!parsed) return null;

  if (parsed.source === 'basecamp') {
    const step = basecampReviewSteps.find((s) => s.id === parsed.stepId);
    const q = step?.quiz[parsed.index];
    if (!step || !q) return null;
    return {
      key,
      source: 'basecamp',
      groupId: step.id,
      groupLabel: `${step.label} ${step.title}`,
      studyHref: `/basecamp/review#${step.id}`,
      studyLabel: `${step.label} 복습 카드`,
      question: { q: q.q, code: q.code, options: [...q.options], answer: q.answer, explain: q.explain },
    };
  }

  const lesson = getLessonBySlug(parsed.lessonSlug);
  const q = getReviewQuiz(parsed.lessonSlug, parsed.questionIndex)[parsed.index];
  if (!lesson || !q) return null;
  return {
    key,
    source: 'review',
    groupId: lesson.slug,
    groupLabel: lesson.title,
    studyHref: `/lesson/${lesson.slug}`,
    studyLabel: '레슨 다시 보기',
    question: { q: q.q, options: [...q.options], answer: q.answer, explain: q.explain },
  };
}
