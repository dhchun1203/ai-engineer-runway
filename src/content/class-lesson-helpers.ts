import { classLessons } from "#site/content";
import { modules, steps, type Module, type Step } from "@/content/modules";

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

/** 앞뒤 회차(회차 번호 순). 없으면 null. */
export function getAdjacentClassLessons(slug: string): { prev: ClassLesson | null; next: ClassLesson | null } {
  const ordered = getOrderedClassLessons();
  const index = ordered.findIndex((l) => l.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return { prev: ordered[index - 1] ?? null, next: ordered[index + 1] ?? null };
}

export type ClassModuleGroup = { module: Module; step: Step; lessons: ClassLesson[] };

/** 회차를 커리큘럼 모듈별로 묶는다. 묶음은 커리큘럼 순서(Step, 모듈 order), 묶음 안은 회차 순.
 *  module id는 velite prepare가 modules.ts와 대조해 두었다. */
export function groupClassLessonsByModule(lessons: readonly ClassLesson[] = getOrderedClassLessons()): ClassModuleGroup[] {
  const groups: ClassModuleGroup[] = [];
  for (const mod of [...modules].sort((a, b) => a.stepId - b.stepId || a.order - b.order)) {
    const inModule = lessons.filter((l) => l.module === mod.id).sort((a, b) => a.session - b.session);
    const step = steps.find((s) => s.id === mod.stepId);
    if (inModule.length > 0 && step) groups.push({ module: mod, step, lessons: inModule });
  }
  return groups;
}

/** 가장 최근 수업(회차가 가장 큰 것). 아직 없으면 undefined. */
export function latestClassLesson(): ClassLesson | undefined {
  const ordered = getOrderedClassLessons();
  return ordered[ordered.length - 1];
}
