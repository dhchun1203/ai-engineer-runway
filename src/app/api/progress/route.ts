// GET /api/progress — 진도 아일랜드의 유일한 데이터 소스. 이 저장소 최초의
// app/api/**/route.ts. src/app/unlock/route.ts의 규율을 그대로 따른다: 응답·
// 로그 어디에도 쿠키 원문 값이나 시크릿을 남기지 않는다.
//
// 본문 순서 자체가 보안 계약이다 — hasUnlockCookie()를 무조건, 그리고 어떤
// 조회보다도 먼저 호출한다(src/app/page.tsx 23~25행과 같은 게이트 순서). 잠금
// 해제 전이면 완료 데이터를 담은 필드는 전부 null로 고정하고 unlocked만
// 노출한다 — 완료 여부를 추론할 수 있는 어떤 파생값도 새어나가지 않는다.
//
// 이 핸들러에 route segment config `dynamic` 선언을 붙이지 않는다 — cookies()를
// 호출하므로 기본적으로 동적이고, 정적 캐싱을 강제하면 한 사용자의 진도가 다른
// 요청자에게 응답되는 캐시 오염이 생긴다. 대신 모든 응답에 명시적으로
// `Cache-Control: private, no-store`를 설정한다(check-progress-gates.mjs G21).

import { NextResponse } from "next/server";
import { hasUnlockCookie } from "@/lib/auth";
import { readCompletedLessonIds } from "@/lib/progress-store";
import { overallProgress, stepProgress, moduleProgress, nextIncompleteLesson } from "@/lib/progress";
import { getModulesByStep, getLessonBySlug } from "@/content/curriculum-helpers";
import type { StepId } from "@/content/modules";
import type { ProgressCounts } from "@/lib/progress-math";

const STEP_IDS: readonly StepId[] = [1, 2, 3];

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

type ProgressLesson = { slug: string; done: boolean };

export type ProgressApiResponse = {
  unlocked: boolean;
  ok: boolean;
  overall: ProgressCounts | null;
  steps: Record<StepId, ProgressCounts> | null;
  modules: Record<string, ProgressCounts> | null;
  completedSlugs: string[] | null;
  nextLessonSlug: string | null;
  // 08-03이 이 자리에 note 필드를 덧붙인다 — 지금은 만들지 않는다.
  lesson: ProgressLesson | null;
};

function emptyBody(unlocked: boolean, ok: boolean): ProgressApiResponse {
  return {
    unlocked,
    ok,
    overall: null,
    steps: null,
    modules: null,
    completedSlugs: null,
    nextLessonSlug: null,
    lesson: null,
  };
}

export async function GET(request: Request) {
  // 무조건, 그리고 어떤 조회보다도 먼저 호출한다 (T-08-02-01).
  const unlocked = await hasUnlockCookie();

  if (!unlocked) {
    return NextResponse.json(emptyBody(false, false), { status: 200, headers: NO_STORE_HEADERS });
  }

  const progressRead = await readCompletedLessonIds();
  if (!progressRead.ok) {
    return NextResponse.json(emptyBody(true, false), { status: 502, headers: NO_STORE_HEADERS });
  }

  const { completedIds } = progressRead;

  const steps = {} as Record<StepId, ProgressCounts>;
  const modules: Record<string, ProgressCounts> = {};
  for (const stepId of STEP_IDS) {
    steps[stepId] = stepProgress(stepId, completedIds);
    for (const module of getModulesByStep(stepId)) {
      modules[module.id] = moduleProgress(module.id, completedIds);
    }
  }

  // ?lesson=<slug> — 존재 여부를 먼저 검증한다(actions.ts 23~27행과 같은 방어).
  // 미존재 슬러그는 오류가 아니라 lesson: null로 처리한다 — 존재 여부를 되묻는
  // 탐침이 되지 않게 한다 (T-08-02-04).
  const lessonSlug = new URL(request.url).searchParams.get("lesson");
  let lesson: ProgressLesson | null = null;
  if (lessonSlug) {
    const found = getLessonBySlug(lessonSlug);
    if (found) {
      lesson = { slug: found.slug, done: completedIds.has(found.slug) };
    }
  }

  const body: ProgressApiResponse = {
    unlocked: true,
    ok: true,
    overall: overallProgress(completedIds),
    steps,
    modules,
    completedSlugs: [...completedIds].sort(),
    nextLessonSlug: nextIncompleteLesson(completedIds)?.slug ?? null,
    lesson,
  };

  return NextResponse.json(body, { status: 200, headers: NO_STORE_HEADERS });
}
