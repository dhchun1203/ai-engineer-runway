import { roadmapLessons } from "#site/content";

// 채널톡 로드맵 별도 심화 레슨(roadmapLessons) 데이터 접근. concepts와 마찬가지로
// 정규 레슨(curriculum-helpers)과 완전히 분리된 별도 컬렉션이라, 진도·일정·복습
// 계산이 이 함수들을 절대 참조하지 않는다(격리).

export type RoadmapLesson = (typeof roadmapLessons)[number];

export function getOrderedRoadmapLessons(): RoadmapLesson[] {
  return [...roadmapLessons].sort((a, b) => a.order - b.order);
}

export function getRoadmapLessonBySlug(slug: string): RoadmapLesson | undefined {
  return roadmapLessons.find((l) => l.slug === slug);
}

// 로드맵 인덱스에서 특정 단계에 걸린 레슨을 찾을 때 쓴다(스킬 항목의 lessonSlug와
// 짝). 지금은 slug로 직접 잇지만, 단계별 목록이 필요할 때를 위해 남겨 둔다.
export function getRoadmapLessonsByStage(stageId: string): RoadmapLesson[] {
  return getOrderedRoadmapLessons().filter((l) => l.stageId === stageId);
}
