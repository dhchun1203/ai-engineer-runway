// 매니페스트 조회(curriculum-helpers.ts)와 순수 집계(progress-math.ts)를 조합하는
// 얇은 층. Velite 콘텐츠 매니페스트 모듈을 직접 import하지 않는다 — 매니페스트
// 접근은 curriculum-helpers.ts의 공개 함수를 통한다(PATTERNS의 import 관례).
// Supabase 관련 모듈도 import하지 않는다 — 이 파일은 완료 집합을 인자로 받을
// 뿐 스스로 읽지 않는다(ARCHITECTURE 책임 맵의 계층 분리).

import type { StepId } from '@/content/modules';
import {
  getModulesByStep,
  getLessonsByModule,
  getOrderedLessons,
  getLessonBySlug,
} from '@/content/curriculum-helpers';
import { aggregate, firstIncompleteSlug, type ProgressCounts } from './progress-math';

// Velite 콘텐츠 매니페스트 모듈을 직접 import하지 않는다 — 매니페스트 접근은
// curriculum-helpers.ts의 공개 함수를 통해서만 이뤄진다. 타입은 getLessonBySlug의
// 반환 타입에서 파생한다.
type Lesson = NonNullable<ReturnType<typeof getLessonBySlug>>;

export function overallProgress(completedIds: ReadonlySet<string>): ProgressCounts {
  const slugs = getOrderedLessons().map((lesson) => lesson.slug);
  return aggregate(completedIds, slugs);
}

export function stepProgress(stepId: StepId, completedIds: ReadonlySet<string>): ProgressCounts {
  const modules = getModulesByStep(stepId);
  const slugs = modules.flatMap((module) => getLessonsByModule(module.id).map((lesson) => lesson.slug));
  return aggregate(completedIds, slugs);
}

export function moduleProgress(moduleId: string, completedIds: ReadonlySet<string>): ProgressCounts {
  const slugs = getLessonsByModule(moduleId).map((lesson) => lesson.slug);
  return aggregate(completedIds, slugs);
}

export function nextIncompleteLesson(completedIds: ReadonlySet<string>): Lesson | null {
  const orderedSlugs = getOrderedLessons().map((lesson) => lesson.slug);
  const slug = firstIncompleteSlug(completedIds, orderedSlugs);
  if (slug === null) return null;
  return getLessonBySlug(slug) ?? null;
}
