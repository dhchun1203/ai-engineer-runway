import type { StepId } from "@/content/modules";

// 심화 배지: 레슨이 속한 Step의 상징 색(10% 배경 틴트 + 색 텍스트/테두리)을 그대로 쓴다 (D-04).
// Step 1 light #3B82F6 / dark #60A5FA, Step 2 light #8B5CF6 / dark #A78BFA, Step 3 light #F59E0B / dark #FBBF24.
// Tailwind JIT은 리터럴 클래스명만 스캔하므로 stepId별 클래스를 동적으로 조합하지 않고 맵으로 고정한다.
const STEP_ACCENT_CLASSES: Record<StepId, string> = {
  1: "bg-surface text-step-1 border-step-1 dark:bg-surface-dark dark:text-step-1-dark dark:border-step-1-dark",
  2: "bg-surface text-step-2 border-step-2 dark:bg-surface-dark dark:text-step-2-dark dark:border-step-2-dark",
  3: "bg-surface text-step-3 border-step-3 dark:bg-surface-dark dark:text-step-3-dark dark:border-step-3-dark",
};

// 개요 배지: 중성 슬레이트 색(light 텍스트 #64748B/배경 #F1F5F9, dark 텍스트 #94A3B8/배경 #1E293B) —
// 어떤 Step 색과도 무관하게 고정되어, 깊이와 Step 정체성이 시각적으로 섞이지 않는다.
const NEUTRAL_CLASSES =
  "bg-surface text-muted border-line dark:bg-surface-dark dark:text-muted-dark dark:border-line-dark";

export function DepthBadge({
  depth,
  stepId,
}: {
  depth: "심화" | "개요";
  stepId: StepId;
}) {
  const colorClasses = depth === "심화" ? STEP_ACCENT_CLASSES[stepId] : NEUTRAL_CLASSES;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap border px-2 py-0.5 text-label font-bold ${colorClasses}`}
    >
      {depth}
    </span>
  );
}
