import { basecampLessons } from "#site/content";

// 베이스캠프 전용 학습 레슨(basecampLessons) 데이터 접근 — order 오름차순이 읽기
// 순서다. 정규 레슨(curriculum-helpers)과 완전히 분리된 격리 컬렉션이라 진도·일정·
// 복습 계산이 이 함수들을 절대 참조하지 않는다(concepts·roadmap 레슨과 동일 근거).

export type BasecampLesson = (typeof basecampLessons)[number];

export function getOrderedBasecampLessons(): BasecampLesson[] {
  return [...basecampLessons].sort((a, b) => a.order - b.order);
}

export function getBasecampLessonBySlug(slug: string): BasecampLesson | undefined {
  return basecampLessons.find((l) => l.slug === slug);
}
