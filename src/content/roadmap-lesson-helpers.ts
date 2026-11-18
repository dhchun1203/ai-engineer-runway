import { roadmapLessons } from "#site/content";
import { roadmapStages } from "@/content/channeltalk-roadmap";

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

/** 세션 노트(kind: session)만, 최신(order 큰 것)부터. 로드맵 첫 화면의 "세션 노트" 칸이 쓴다. */
export function getRoadmapSessionNotes(): RoadmapLesson[] {
  return getOrderedRoadmapLessons()
    .filter((l) => l.kind === "session")
    .sort((a, b) => b.order - a.order);
}

/** AX Consultant 트랙 편(kind: ax)만, 읽을 순서(order 작은 것)부터. 로드맵 첫 화면의 "AX Consultant 트랙" 칸이 쓴다. */
export function getRoadmapAxNotes(): RoadmapLesson[] {
  return getOrderedRoadmapLessons().filter((l) => l.kind === "ax");
}

/**
 * 이 레슨이 여러 편 묶음(로드맵 역량의 lessonSlugs)에 들어 있으면 그 묶음을 돌려준다.
 * 리더 아래 "묶음 안 이동" 막대가 쓴다. 묶음이 아니면 null.
 */
export function getRoadmapLessonSeries(
  slug: string,
): { skillTitle: string; lessons: RoadmapLesson[]; index: number } | null {
  for (const stage of roadmapStages) {
    for (const skill of stage.skills) {
      const slugs = skill.lessonSlugs;
      if (!slugs || !slugs.includes(slug)) continue;
      const lessons = slugs
        .map((s) => getRoadmapLessonBySlug(s))
        .filter((l): l is RoadmapLesson => l !== undefined);
      const index = lessons.findIndex((l) => l.slug === slug);
      if (index === -1) return null;
      return { skillTitle: skill.title, lessons, index };
    }
  }
  return null;
}
