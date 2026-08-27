"use client";

// 08-02부터 클라이언트 컴포넌트다 — 진도 표시가 useProgress() context에서
// 오기 때문이다. getLessonsByModule(module.id) 호출은 더 이상 이 컴포넌트가
// 하지 않는다: 호출한다면 Velite 콘텐츠 매니페스트 전체를 클라이언트
// 번들에 끌고 오게 된다(SC2와 충돌). 대신 페이지가 계산해 lessons prop으로
// 넘긴다. completedSlugs/progress prop도 없앴다 — 진도는 context에서 직접
// 읽는다(ModuleProgressSlot, useProgress().data.completedSlugs).

import Link from "next/link";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import type { Module, StepId } from "@/content/modules";
import type { getLessonBySlug } from "@/content/curriculum-helpers";
import { DepthBadge } from "@/components/depth-badge";
import { EstimatedTime } from "@/components/estimated-time";
import { ModuleProgressSlot } from "@/components/progress-slots";
import { useProgress } from "@/components/progress-provider";

// Velite 콘텐츠 매니페스트 모듈을 직접 import하지 않는다 — 타입은
// getLessonBySlug의 반환 타입에서 파생한다(today-lesson-card.tsx/progress.ts와
// 같은 경계).
type Lesson = NonNullable<ReturnType<typeof getLessonBySlug>>;

// 아코디언 헤더 배경에 그 모듈이 속한 Step의 상징 색을 쓴다 (D-04).
const STEP_HEADER_CLASSES: Record<StepId, string> = {
  1: "bg-step-1/10 dark:bg-step-1-dark/10",
  2: "bg-step-2/10 dark:bg-step-2-dark/10",
  3: "bg-step-3/10 dark:bg-step-3-dark/10",
};

export function ModuleAccordion({
  module,
  stepId,
  lessons,
  defaultOpen = false,
}: {
  module: Module;
  stepId: StepId;
  lessons: Lesson[];
  defaultOpen?: boolean;
}) {
  const { status, data } = useProgress();
  const completedSlugs = status === "ready" ? data.completedSlugs : null;

  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-lg border border-badge-neutral-bg dark:border-badge-neutral-bg-dark"
    >
      {/* 폰(375px 미만)에서는 제목 줄과 레슨수/진행률/화살표 줄을 세로로 쌓아
          제목에 전체 폭을 준다(08-05 M2 게이트) — 640px 이상(sm:)에서는
          flex-row로 되돌아가 원래의 한 줄 배치를 그대로 유지한다. 자식
          엘리먼트 구성은 그대로 두고 summary 자체의 방향만 바꿔, 새 leaf
          텍스트 요소를 만들지 않는다(hidden/inline 토글은 오히려 "레슨 N개"를
          독립 leaf로 만들어 768/1024에서 새 M3 위반을 유발했다 — 대신 이 방식을 쓴다). */}
      <summary
        className={`flex min-h-11 cursor-pointer list-none flex-col items-start gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${STEP_HEADER_CLASSES[stepId]}`}
      >
        <span className="min-w-0 text-heading font-bold">{module.title}</span>
        <span className="flex shrink-0 items-center gap-2 text-label font-normal">
          레슨 {lessons.length}개
          <ModuleProgressSlot moduleId={module.id} />
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </span>
      </summary>
      <ul className="flex flex-col divide-y divide-badge-neutral-bg px-4 dark:divide-badge-neutral-bg-dark">
        {lessons.map((lesson) => {
          const isDone = completedSlugs?.includes(lesson.slug) ?? false;

          return (
            <li key={lesson.slug} {...(isDone ? { "data-progress-ui": "lesson-done" } : {})}>
              <Link
                href={`/lesson/${lesson.slug}`}
                className="card-interactive flex min-h-11 flex-wrap items-center justify-between gap-2 py-3 transition-colors duration-150"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-start gap-1.5">
                    {isDone ? (
                      <CheckCircle2
                        className="mt-1 h-4 w-4 shrink-0 self-start text-accent dark:text-accent-dark"
                        aria-hidden="true"
                      />
                    ) : null}
                    <span
                      className={`text-body font-normal ${
                        isDone ? "text-badge-neutral-text dark:text-badge-neutral-text-dark" : ""
                      }`}
                    >
                      {lesson.title}
                    </span>
                  </span>
                  <span className="text-label font-semibold text-accent dark:text-accent-dark">
                    {isDone ? "다시 보기" : "레슨 시작하기"}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <DepthBadge depth={lesson.depth} stepId={stepId} />
                  <EstimatedTime minutes={lesson.estimatedMinutes} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
