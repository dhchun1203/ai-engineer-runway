import { concepts } from "#site/content";

// 번외 "AI 뜯어보기"(concepts) 데이터 접근 — order 오름차순이 곧 번외 커리큘럼의
// 읽기 순서다. 레슨(curriculum-helpers)과 완전히 분리된 별도 컬렉션이라 진도·일정·
// 복습 계산이 이 함수들을 절대 참조하지 않는다(설계: 격리 근거).

export type Concept = (typeof concepts)[number];

export function getOrderedConcepts(): Concept[] {
  return [...concepts].sort((a, b) => a.order - b.order);
}

export function getConceptBySlug(slug: string): Concept | undefined {
  return concepts.find((c) => c.slug === slug);
}

// 개념 리더 하단의 이전/다음 이동 — 번외 순서 안에서만 이어진다.
export function getAdjacentConcepts(slug: string): {
  prev: Concept | null;
  next: Concept | null;
} {
  const ordered = getOrderedConcepts();
  const idx = ordered.findIndex((c) => c.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? ordered[idx - 1] : null,
    next: idx < ordered.length - 1 ? ordered[idx + 1] : null,
  };
}
