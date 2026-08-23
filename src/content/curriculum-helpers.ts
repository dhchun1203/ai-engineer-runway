// 매니페스트 조회 · 전역 정렬 · 인접 레슨 계산 헬퍼.
// #site/content(Velite 빌드 산출물)의 lessons를 modules.ts의 Step/Module과 조인한다.

import { lessons, type Lesson } from '#site/content';
import { modules, steps, type Module, type Step, type StepId } from './modules';

function findModule(moduleId: string): Module {
  const found = modules.find((m) => m.id === moduleId);
  if (!found) {
    // 고아 레슨(모듈을 찾지 못함)은 조용히 건너뛰지 않고 빌드를 실패시킨다.
    throw new Error(
      `curriculum-helpers: lesson references unknown moduleId "${moduleId}" — no matching entry in src/content/modules.ts`,
    );
  }
  return found;
}

/** 전역 정렬 키: (stepId, 모듈 order, 레슨 order) 3단 — 값 조합이 유일해 동률이 없다. */
function sortKey(lesson: Lesson): [number, number, number] {
  const mod = findModule(lesson.moduleId);
  return [lesson.stepId, mod.order, lesson.order];
}

function compareLessons(a: Lesson, b: Lesson): number {
  const [as, am, al] = sortKey(a);
  const [bs, bm, bl] = sortKey(b);
  if (as !== bs) return as - bs;
  if (am !== bm) return am - bm;
  return al - bl;
}

export function getStep(stepId: StepId): Step | undefined {
  return steps.find((s) => s.id === stepId);
}

export function getModulesByStep(stepId: StepId): Module[] {
  return modules.filter((m) => m.stepId === stepId).sort((a, b) => a.order - b.order);
}

export function getLessonsByModule(moduleId: string): Lesson[] {
  return lessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order);
}

export function getOrderedLessons(): Lesson[] {
  return [...lessons].sort(compareLessons);
}

export function getLessonBySlug(slug: string): Lesson | undefined {
  return lessons.find((l) => l.slug === slug);
}

export function getAdjacentLessons(slug: string): { prev: Lesson | null; next: Lesson | null } {
  const ordered = getOrderedLessons();
  const index = ordered.findIndex((l) => l.slug === slug);
  if (index === -1) {
    return { prev: null, next: null };
  }
  return {
    prev: index > 0 ? ordered[index - 1] : null,
    next: index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}

export function getLessonCounts(stepId?: StepId): { total: number; withContent: number } {
  const scoped = stepId === undefined ? lessons : lessons.filter((l) => l.stepId === stepId);
  return {
    total: scoped.length,
    withContent: scoped.filter((l) => l.hasContent).length,
  };
}
