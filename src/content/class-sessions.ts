import { classReviews } from "#site/content";
import type { BasecampQuizQuestion } from "@/content/basecamp-review";

// 수업 복습 회차 데이터 접근 계층(2026-10-26 신설, 2026-10-27 회차 폴더로 이전). 데이터 원본은
// 회차 폴더의 review.yml(velite classReviews)이고, 본문은 같은 폴더의 index.mdx(classLessons)다.
// 설계: docs/superpowers/specs/2026-10-27-class-data-structure-design.md
//
// 퀴즈 풀이는 cl:<slug>:<문항 id> 키로 풀이 기록과 오답 노트에 쌓이고, 모든 문항을 한 번 이상
// 풀면 그 회차가 완료다(2026-11-02 사용자 결정, 복습 체크리스트는 없앴다. class-logic.ts).
//
// 퀴즈의 명령 출력은 실제로 실행해 확인한 값이다.

export type ClassQuizQuestion = BasecampQuizQuestion & {
  /** 회차 안에서 유일한 이름표. 오답 기록 키라 한 번 정하면 바꾸지 않는다. */
  id: string;
};

export type ClassCommand = {
  cmd: string;
  desc: string;
  /** 명령어 모음의 묶음 이름. review.yml에서 비우면 회차 topic */
  group?: string;
};

export type ClassTerm = { word: string; definition: string };

export type ClassSession = {
  /** classLessons의 slug와 같은 값 */
  slug: string;
  quiz: readonly ClassQuizQuestion[];
  commands: readonly ClassCommand[];
  terms: readonly ClassTerm[];
};

export const classSessions: readonly ClassSession[] = classReviews;

export function getClassSession(slug: string): ClassSession | undefined {
  return classSessions.find((session) => session.slug === slug);
}

export function getClassQuizQuestion(slug: string, questionId: string): ClassQuizQuestion | undefined {
  return getClassSession(slug)?.quiz.find((q) => q.id === questionId);
}
