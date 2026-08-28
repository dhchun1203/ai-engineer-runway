"use client";

// 08-06부터 'use client' — /curriculum이 완전 정적 셸로 전환되면서 진행률
// 표시는 서버가 계산해 넘기는 것이 아니라 useProgress() 컨텍스트에서 직접
// 읽는다. getModulesByStep/getLessonCounts는 Velite 매니페스트를 참조하므로
// 이 컴포넌트 안에서 부르지 않는다 — 클라이언트 번들에 매니페스트가 끌려오는
// 것을 막기 위해 페이지가 미리 계산해 moduleCount/lessonCount prop으로 넘긴다.

import Link from "next/link";
import type { CSSProperties } from "react";
import type { Step, StepId } from "@/content/modules";
import { ProgressBadge } from "@/components/progress-badge";
import { BarSkeleton, BadgeSkeleton } from "@/components/progress-skeleton";
import { useProgress } from "@/components/progress-provider";

// Step 상징 색 좌측 강조선 — Step 1 #3B82F6/#60A5FA, Step 2 #8B5CF6/#A78BFA, Step 3 #F59E0B/#FBBF24 (D-04).
const STEP_BORDER_CLASSES: Record<StepId, string> = {
  1: "border-l-step-1 dark:border-l-step-1-dark",
  2: "border-l-step-2 dark:border-l-step-2-dark",
  3: "border-l-step-3 dark:border-l-step-3-dark",
};

// 진행률 바 채움색도 Step 상징 색을 쓴다(UI-SPEC #20) — 문자열 조립이 아니라
// 리터럴 클래스 맵으로 고정해 Tailwind JIT이 동적 조합 클래스를 스캔하지
// 못하는 문제를 피한다(depth-badge.tsx와 같은 이유).
const STEP_FILL_CLASSES: Record<StepId, string> = {
  1: "bg-step-1 dark:bg-step-1-dark",
  2: "bg-step-2 dark:bg-step-2-dark",
  3: "bg-step-3 dark:bg-step-3-dark",
};

export function StepCard({
  step,
  moduleCount,
  lessonCount,
  revealIndex,
}: {
  step: Step;
  moduleCount: number;
  lessonCount: number;
  // 08-07 — 있으면 .step-card-reveal 순차 등장을 적용한다(커리큘럼 페이지
  // 전용). 없으면 클래스도 인라인 스타일도 붙이지 않는다 — 이 카드가 다른
  // 화면에 재사용될 때 등장 연출이 딸려오지 않게 한다.
  revealIndex?: number;
}) {
  const { status, data } = useProgress();
  const progress = status === "ready" ? (data.steps?.[step.id] ?? null) : null;

  return (
    <Link
      href={`/step/${step.id}`}
      className={`card-interactive panel flex min-h-11 flex-col gap-3 border-l-4 p-4 transition-colors duration-150 ${STEP_BORDER_CLASSES[step.id]} ${revealIndex !== undefined ? "step-card-reveal" : ""}`}
      style={revealIndex !== undefined ? ({ "--reveal-index": revealIndex } as CSSProperties) : undefined}
    >
      <div className="flex items-baseline gap-2">
        <span className="shrink-0 whitespace-nowrap text-label font-semibold">Step {step.id}</span>
        <h2 className="min-w-0 break-keep text-heading font-extrabold">{step.shortTitle}</h2>
      </div>
      <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
        {step.keywords.join(" · ")}
      </p>
      <p className="text-label font-normal">
        모듈 {moduleCount}개 · 레슨 {lessonCount}개 · 원 {step.courseHours}시간
      </p>
      {status === "loading" ? (
        <>
          <BarSkeleton className="mt-1" />
          <BadgeSkeleton />
        </>
      ) : progress ? (
        <>
          <div
            data-progress-ui="step-bar"
            data-step-percent={progress.percent}
            className="mt-1 h-2 w-full overflow-hidden border border-line bg-surface-2 dark:border-line-dark dark:bg-surface-2-dark"
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full ${STEP_FILL_CLASSES[step.id]}`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <ProgressBadge completed={progress.completed} total={progress.total} percent={progress.percent} />
        </>
      ) : null}
    </Link>
  );
}
