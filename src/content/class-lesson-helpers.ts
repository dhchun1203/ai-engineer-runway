import { classLessons } from "#site/content";

// 수업 복습 레슨(classLessons) 데이터 접근 — session 오름차순이 수업 순서다.
// 정규 레슨(curriculum-helpers)과 분리된 격리 컬렉션이라 진도율·일정·복습 계산이
// 이 함수들을 참조하지 않는다(basecamp-lesson-helpers와 같은 근거).

export type ClassLesson = (typeof classLessons)[number];

export function getOrderedClassLessons(): ClassLesson[] {
  return [...classLessons].sort((a, b) => a.session - b.session);
}

export function getClassLessonBySlug(slug: string): ClassLesson | undefined {
  return classLessons.find((l) => l.slug === slug);
}

/** 가장 최근 수업(회차가 가장 큰 것). 아직 없으면 undefined. */
export function latestClassLesson(): ClassLesson | undefined {
  const ordered = getOrderedClassLessons();
  return ordered[ordered.length - 1];
}
