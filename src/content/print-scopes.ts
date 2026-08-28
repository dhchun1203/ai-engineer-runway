// PDF로 뽑을 수 있는 "범위" 정의 (quick 260828-k4t).
//
// 사용자는 35편을 한 파일로 받고 싶을 때도, 오늘 공부할 모듈 한 덩어리만 받고
// 싶을 때도 있다. 범위를 하나의 슬러그 네임스페이스로 통일해 두면
// /print/[scope] 라우트 하나가 셋을 전부 처리하고, generateStaticParams가
// 그대로 프리렌더 목록이 된다.
//
// 슬러그 규칙: 'all' | 'step-<N>' | 'module-<stepId>-<order>'
// 모듈 슬러그에 'module-' 접두사를 붙이는 이유는 모듈 id가 '1-3' 형태라
// 접두사 없이는 'step-1'과 같은 평면에서 구분이 흐려지기 때문이다.
//
// 콘텐츠가 없는 자리표시 레슨(hasContent: false)은 어느 범위에도 넣지 않는다 —
// 종이에 "준비 중입니다" 한 줄만 찍힌 쪽이 끼어드는 것을 막는다.

import type { Lesson } from '#site/content';
import { modules, steps, type StepId } from './modules';
import { getOrderedLessons } from './curriculum-helpers';

export type PrintScopeKind = 'all' | 'step' | 'module';

export interface PrintScope {
  slug: string;
  kind: PrintScopeKind;
  /** 표지 제목 */
  title: string;
  /** 표지 부제 — 범위의 위치를 한 줄로 설명한다 */
  subtitle: string;
  /** 이 범위에 속한 Step (kind가 'all'이면 없음) — 표지 색 강조에 쓴다 */
  stepId: StepId | null;
  lessons: Lesson[];
  totalMinutes: number;
}

function buildScope(
  slug: string,
  kind: PrintScopeKind,
  title: string,
  subtitle: string,
  stepId: StepId | null,
  scopeLessons: Lesson[],
): PrintScope {
  return {
    slug,
    kind,
    title,
    subtitle,
    stepId,
    lessons: scopeLessons,
    totalMinutes: scopeLessons.reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0),
  };
}

/** 전역 정렬(Step → 모듈 → 레슨)을 그대로 물려받은, 콘텐츠 있는 레슨만. */
function printableLessons(): Lesson[] {
  return getOrderedLessons().filter((lesson) => lesson.hasContent);
}

/**
 * 뽑을 수 있는 모든 범위. 레슨이 한 편도 없는 모듈은 목록에 넣지 않는다 —
 * 빈 PDF로 가는 링크를 만들지 않기 위해서다.
 */
export function getPrintScopes(): PrintScope[] {
  const all = printableLessons();
  const result: PrintScope[] = [
    buildScope('all', 'all', '전체 사전학습 노트', 'Step 1~3 전 과정', null, all),
  ];

  for (const step of steps) {
    const stepLessons = all.filter((lesson) => lesson.stepId === step.id);
    if (stepLessons.length === 0) continue;
    result.push(
      buildScope(
        `step-${step.id}`,
        'step',
        step.title,
        `Step ${step.id} · ${step.shortTitle}`,
        step.id,
        stepLessons,
      ),
    );
  }

  for (const mod of modules) {
    const moduleLessons = all.filter((lesson) => lesson.moduleId === mod.id);
    if (moduleLessons.length === 0) continue;
    result.push(
      buildScope(
        `module-${mod.id}`,
        'module',
        mod.title,
        `Step ${mod.stepId} · 모듈 ${mod.id}`,
        mod.stepId,
        moduleLessons,
      ),
    );
  }

  return result;
}

export function getPrintScope(slug: string): PrintScope | undefined {
  return getPrintScopes().find((scope) => scope.slug === slug);
}

/** 표지·목차에서 레슨 한 편의 소속을 한 줄로 보여주기 위한 조회. */
export function getModuleTitle(moduleId: string): string {
  return modules.find((m) => m.id === moduleId)?.title ?? moduleId;
}
