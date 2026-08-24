import Link from "next/link";
import type { Step, StepId } from "@/content/modules";
import { getModulesByStep, getLessonCounts } from "@/content/curriculum-helpers";
import { ProgressBadge } from "@/components/progress-badge";
import type { ProgressCounts } from "@/lib/progress-math";

// Step 상징 색 좌측 강조선 — Step 1 #3B82F6/#60A5FA, Step 2 #8B5CF6/#A78BFA, Step 3 #F59E0B/#FBBF24 (D-04).
const STEP_BORDER_CLASSES: Record<StepId, string> = {
  1: "border-step-1 dark:border-step-1-dark",
  2: "border-step-2 dark:border-step-2-dark",
  3: "border-step-3 dark:border-step-3-dark",
};

// 진행률 바 채움색도 Step 상징 색을 쓴다(UI-SPEC #20) — 문자열 조립이 아니라
// 리터럴 클래스 맵으로 고정해 Tailwind JIT이 동적 조합 클래스를 스캔하지
// 못하는 문제를 피한다(depth-badge.tsx와 같은 이유).
const STEP_FILL_CLASSES: Record<StepId, string> = {
  1: "bg-step-1 dark:bg-step-1-dark",
  2: "bg-step-2 dark:bg-step-2-dark",
  3: "bg-step-3 dark:bg-step-3-dark",
};

export function StepCard({ step, progress }: { step: Step; progress?: ProgressCounts | null }) {
  const moduleCount = getModulesByStep(step.id).length;
  const { total: lessonCount } = getLessonCounts(step.id);

  return (
    <Link
      href={`/step/${step.id}`}
      className={`flex min-h-11 flex-col gap-3 rounded-lg border-l-4 bg-surface p-4 dark:bg-surface-dark ${STEP_BORDER_CLASSES[step.id]}`}
    >
      <div className="flex items-baseline gap-2">
        <span className="shrink-0 whitespace-nowrap text-[14px] font-semibold leading-[1.4]">
          Step {step.id}
        </span>
        <h2 className="min-w-0 break-keep text-[20px] font-semibold leading-[1.3]">{step.shortTitle}</h2>
      </div>
      <p className="text-[14px] font-normal leading-[1.4] text-badge-neutral-text dark:text-badge-neutral-text-dark">
        {step.keywords.join(" · ")}
      </p>
      <p className="text-[14px] font-normal leading-[1.4]">
        모듈 {moduleCount}개 · 레슨 {lessonCount}개 · 원 {step.courseHours}시간
      </p>
      {progress ? (
        <>
          <div
            data-progress-ui="step-bar"
            data-step-percent={progress.percent}
            className="mt-1 h-2 w-full overflow-hidden rounded-full bg-badge-neutral-bg dark:bg-badge-neutral-bg-dark"
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full rounded-full ${STEP_FILL_CLASSES[step.id]}`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <ProgressBadge completed={progress.completed} total={progress.total} percent={progress.percent} />
        </>
      ) : null}
    </Link>
  );
}
