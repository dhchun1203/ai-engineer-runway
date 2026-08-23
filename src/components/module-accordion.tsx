import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Module, StepId } from "@/content/modules";
import { getLessonsByModule } from "@/content/curriculum-helpers";
import { DepthBadge } from "@/components/depth-badge";
import { EstimatedTime } from "@/components/estimated-time";

// 아코디언 헤더 배경에 그 모듈이 속한 Step의 상징 색을 쓴다 (D-04).
const STEP_HEADER_CLASSES: Record<StepId, string> = {
  1: "bg-step-1/10 dark:bg-step-1-dark/10",
  2: "bg-step-2/10 dark:bg-step-2-dark/10",
  3: "bg-step-3/10 dark:bg-step-3-dark/10",
};

export function ModuleAccordion({
  module,
  stepId,
  defaultOpen = false,
}: {
  module: Module;
  stepId: StepId;
  defaultOpen?: boolean;
}) {
  const lessons = getLessonsByModule(module.id);

  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-lg border border-badge-neutral-bg dark:border-badge-neutral-bg-dark"
    >
      <summary
        className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 ${STEP_HEADER_CLASSES[stepId]}`}
      >
        <span className="text-[20px] font-semibold leading-[1.3]">{module.title}</span>
        <span className="flex shrink-0 items-center gap-2 text-[14px] font-normal leading-[1.4]">
          레슨 {lessons.length}개
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </span>
      </summary>
      <ul className="flex flex-col divide-y divide-badge-neutral-bg px-4 dark:divide-badge-neutral-bg-dark">
        {lessons.map((lesson) => (
          <li key={lesson.slug}>
            <Link
              href={`/lesson/${lesson.slug}`}
              className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-3"
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-[16px] font-normal leading-[1.6]">{lesson.title}</span>
                <span className="text-[14px] font-semibold leading-[1.4] text-accent dark:text-accent-dark">
                  레슨 시작하기
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <DepthBadge depth={lesson.depth} stepId={stepId} />
                <EstimatedTime minutes={lesson.estimatedMinutes} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
