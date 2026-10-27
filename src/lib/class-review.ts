import 'server-only';

// 수업 회차의 간격 복습(2026-10-27). 기준일은 수업 날짜이고, 사다리와 졸업 규칙은 정규 레슨과
// 같은 review.ts의 computeDueLessons를 그대로 쓴다(수업 다음 날, 3일 뒤, 7일 뒤, 세 번이면 졸업).
// 상태는 lesson_review 표에 classReviewId(slug) = "class:<slug>" 행으로 저장한다.
// 설계: docs/superpowers/specs/2026-10-27-class-data-structure-design.md 3.1

import { computeDueLessons, nextDueDate, type ReviewState } from './review';
import { classReviewId, pickQuizRefs, type AttemptState } from './class-logic';
import { getOrderedClassLessons, type ClassLesson } from '@/content/class-lesson-helpers';
import { getClassSession, type ClassQuizQuestion } from '@/content/class-sessions';
import type { QuizAttemptRow } from './quiz-attempt-store';

export type DueClassSession = { lesson: ClassLesson; rung: number; dueDate: string };

/** 오늘까지 열린(수업 날짜가 지난) 회차 slug → 수업 날짜, 회차 slug → 복습 상태. */
function classLadderInputs(states: ReadonlyMap<string, ReviewState>, today: string) {
  const dateBySlug = new Map<string, string>();
  const classStates = new Map<string, ReviewState>();
  for (const lesson of getOrderedClassLessons()) {
    if (lesson.date > today) continue;
    dateBySlug.set(lesson.slug, lesson.date);
    const state = states.get(classReviewId(lesson.slug));
    if (state) classStates.set(lesson.slug, state);
  }
  return { dateBySlug, classStates };
}

/** 오늘 간격 복습 차례인 회차(만기가 오래된 것 먼저). */
export function computeDueClassSessions(states: ReadonlyMap<string, ReviewState>, today: string): DueClassSession[] {
  const { dateBySlug, classStates } = classLadderInputs(states, today);
  return computeDueLessons(dateBySlug, classStates, today).flatMap(({ lessonSlug, rung, dueDate }) => {
    const lesson = getOrderedClassLessons().find((l) => l.slug === lessonSlug);
    return lesson ? [{ lesson, rung, dueDate }] : [];
  });
}

/** 다음 수업 복습 만기일(만기 0건일 때 안내용). 전부 졸업이면 null. */
export function nextClassDueDate(states: ReadonlyMap<string, ReviewState>, today: string): string | null {
  const { dateBySlug, classStates } = classLadderInputs(states, today);
  return nextDueDate(dateBySlug, classStates);
}

/** 풀이 기록 행 → 오답 키별 지난 결과(cl: 키만). */
export function classAttemptStates(rows: readonly QuizAttemptRow[]): Map<string, AttemptState> {
  const map = new Map<string, AttemptState>();
  for (const row of rows) {
    if (row.key.startsWith('cl:')) map.set(row.key, row.lastCorrect ? 'right' : 'wrong');
  }
  return map;
}

/** 회차 하나에서 복습할 문항을 고른다(틀림 → 안 푼 것 → 맞힘, 오늘 날짜로 고정). */
export function pickSessionQuestions(
  slug: string,
  attempts: ReadonlyMap<string, AttemptState>,
  today: string,
  limit: number,
): ClassQuizQuestion[] {
  const quiz = getClassSession(slug)?.quiz ?? [];
  const picked = pickQuizRefs(
    quiz.map((q) => ({ slug, id: q.id })),
    attempts,
    `${today}:${slug}`,
    limit,
  );
  return picked.flatMap((ref) => quiz.filter((q) => q.id === ref.id));
}
