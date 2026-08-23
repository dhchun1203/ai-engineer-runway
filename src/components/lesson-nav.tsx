import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Lesson } from "#site/content";
import type { StepId } from "@/content/modules";
import { modules } from "@/content/modules";

/** 브레드크럼: Step {n} > {모듈 제목} — 두 세그먼트 모두 해당 Step 페이지로 링크한다 (D-08). */
export function LessonBreadcrumb({ lesson }: { lesson: Pick<Lesson, "stepId" | "moduleId"> }) {
  const stepHref = `/step/${lesson.stepId}`;
  const module = modules.find((m) => m.id === lesson.moduleId);

  return (
    <nav aria-label="브레드크럼" className="flex flex-wrap items-center gap-2 text-[14px] font-normal leading-[1.4]">
      <Link href={stepHref} className="flex min-h-11 items-center underline-offset-2 hover:underline">
        Step {lesson.stepId}
      </Link>
      <span aria-hidden="true">&gt;</span>
      <Link href={stepHref} className="flex min-h-11 items-center underline-offset-2 hover:underline">
        {module?.title ?? ""}
      </Link>
    </nav>
  );
}

type PagerLesson = Pick<Lesson, "slug" | "title">;

function PagerButton({
  lesson,
  direction,
}: {
  lesson: PagerLesson | null;
  direction: "prev" | "next";
}) {
  const isPrev = direction === "prev";
  const label = isPrev ? "← 이전 레슨" : "다음 레슨 →";
  const alignClass = isPrev ? "sm:justify-start" : "sm:justify-end";
  const baseClass = `flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-badge-neutral-bg px-4 py-2 text-[16px] font-normal leading-[1.6] dark:border-badge-neutral-bg-dark ${alignClass}`;

  const content = isPrev ? (
    <>
      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </>
  ) : (
    <>
      {label}
      <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </>
  );

  if (!lesson) {
    return (
      <span
        data-pager={direction}
        data-pager-disabled="true"
        aria-disabled="true"
        className={`${baseClass} cursor-not-allowed text-badge-neutral-text opacity-50 dark:text-badge-neutral-text-dark`}
      >
        {content}
      </span>
    );
  }

  return (
    <Link href={`/lesson/${lesson.slug}`} data-pager={direction} className={baseClass}>
      {content}
    </Link>
  );
}

/** 페이저: 본문 끝의 큰 이전/다음 버튼. 경계(전역 첫/마지막 레슨)에서는 숨기지 않고 비활성 렌더한다. */
export function LessonPager({
  prev,
  next,
}: {
  prev: PagerLesson | null;
  next: PagerLesson | null;
}) {
  return (
    <nav
      aria-label="레슨 페이저"
      className="mt-8 flex flex-col gap-3 border-t border-badge-neutral-bg pt-6 dark:border-badge-neutral-bg-dark sm:flex-row sm:justify-between"
    >
      <PagerButton lesson={prev} direction="prev" />
      <PagerButton lesson={next} direction="next" />
    </nav>
  );
}
