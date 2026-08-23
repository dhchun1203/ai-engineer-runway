import Link from "next/link";
import type { Step, StepId } from "@/content/modules";
import { getModulesByStep, getLessonCounts } from "@/content/curriculum-helpers";

// Step 상징 색 좌측 강조선 — Step 1 #3B82F6/#60A5FA, Step 2 #8B5CF6/#A78BFA, Step 3 #F59E0B/#FBBF24 (D-04).
const STEP_BORDER_CLASSES: Record<StepId, string> = {
  1: "border-step-1 dark:border-step-1-dark",
  2: "border-step-2 dark:border-step-2-dark",
  3: "border-step-3 dark:border-step-3-dark",
};

export function StepCard({ step }: { step: Step }) {
  const moduleCount = getModulesByStep(step.id).length;
  const { total: lessonCount } = getLessonCounts(step.id);
  // Phase 1은 진행률 바를 실제 컴포넌트로 렌더하되 값은 항상 0 — Phase 2가 Supabase 진도 데이터를 이 자리에 연결한다.
  const progressPercent = 0;

  return (
    <Link
      href={`/step/${step.id}`}
      className={`flex min-h-11 flex-col gap-3 rounded-lg border-l-4 bg-surface p-4 dark:bg-surface-dark ${STEP_BORDER_CLASSES[step.id]}`}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-[14px] font-semibold leading-[1.4]">Step {step.id}</span>
        <h2 className="text-[20px] font-semibold leading-[1.3]">{step.shortTitle}</h2>
      </div>
      <p className="text-[14px] font-normal leading-[1.4] text-badge-neutral-text dark:text-badge-neutral-text-dark">
        {step.keywords.join(" · ")}
      </p>
      <p className="text-[14px] font-normal leading-[1.4]">
        모듈 {moduleCount}개 · 레슨 {lessonCount}개 · 원 {step.courseHours}시간
      </p>
      <div
        className="mt-1 h-2 w-full overflow-hidden rounded-full bg-badge-neutral-bg dark:bg-badge-neutral-bg-dark"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-accent dark:bg-accent-dark"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <span className="text-[14px] font-normal leading-[1.4]">{progressPercent}% 완료</span>
    </Link>
  );
}
