import { practiceLessons } from "#site/content";

// 번외 실습 "파이썬 손풀기"(practiceLessons) 데이터 접근. unit 오름차순이 곧 진행 순서다.
// 정규 레슨과 분리된 격리 컬렉션이라 진도, 일정, 복습 계산이 이 함수들을 참조하지 않는다.

export type PracticeUnit = (typeof practiceLessons)[number];

/** 완료 체크를 progress 테이블에 저장할 때 붙이는 접두사. 커리큘럼 slug, 베이스캠프 bc:와 분리한다. */
export const PRACTICE_PROGRESS_PREFIX = "pr:";

export function practiceProgressId(slug: string): string {
  return `${PRACTICE_PROGRESS_PREFIX}${slug}`;
}

export function getOrderedPracticeUnits(): PracticeUnit[] {
  return [...practiceLessons].sort((a, b) => a.unit - b.unit);
}

export function getPracticeUnitBySlug(slug: string): PracticeUnit | undefined {
  return practiceLessons.find((u) => u.slug === slug);
}

// 단원 리더 하단의 이전/다음 이동.
export function getAdjacentPracticeUnits(slug: string): {
  prev: PracticeUnit | null;
  next: PracticeUnit | null;
} {
  const ordered = getOrderedPracticeUnits();
  const idx = ordered.findIndex((u) => u.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? ordered[idx - 1] : null,
    next: idx < ordered.length - 1 ? ordered[idx + 1] : null,
  };
}
