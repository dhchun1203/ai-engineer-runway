import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Lesson } from "#site/content";
import { modules } from "@/content/modules";

/** 브레드크럼: Step {n} > {모듈 제목} — 두 세그먼트 모두 해당 Step 페이지로 링크한다 (D-08). */
export function LessonBreadcrumb({ lesson }: { lesson: Pick<Lesson, "stepId" | "moduleId"> }) {
  const stepHref = `/step/${lesson.stepId}`;
  const lessonModule = modules.find((m) => m.id === lesson.moduleId);

  return (
    <nav aria-label="브레드크럼" className="flex flex-wrap items-center gap-2 text-label font-normal font-mono">
      <Link href={stepHref} className="tap-feedback flex min-h-11 items-center underline-offset-2 hover:underline">
        Step {lesson.stepId}
      </Link>
      <span aria-hidden="true">&gt;</span>
      <Link href={stepHref} className="tap-feedback flex min-h-11 items-center underline-offset-2 hover:underline">
        {lessonModule?.title ?? ""}
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
  const label = isPrev ? "이전 레슨" : "다음 레슨";
  const alignClass = isPrev ? "sm:justify-start" : "sm:justify-end";
  const baseClass = `btn flex-1 text-body ${alignClass}`;

  // 방향 라벨만 있던 버튼에 실제 레슨 제목을 함께 보여준다(quick 260901-etq).
  // title은 처음부터 props로 오고 있었는데 렌더만 안 하고 있었다 — "다음에 뭐가
  // 오는지"는 하루 1레슨 페이스에서 내일 돌아올 이유가 된다(react.dev의 다음 장
  // 연결과 같은 원리, 리서치 round1-d). 텍스트는 세로로 쌓는다: 위에 작은 방향
  // 라벨, 아래에 제목.
  const text = (
    <span className={`flex min-w-0 flex-col ${isPrev ? "items-start" : "items-end"}`}>
      <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
        {label}
      </span>
      {lesson ? <span className="truncate">{lesson.title}</span> : null}
    </span>
  );

  const content = isPrev ? (
    <>
      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      {text}
    </>
  ) : (
    <>
      {text}
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
    <Link href={`/lesson/${lesson.slug}`} data-pager={direction} className={`tap-feedback ${baseClass}`}>
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
      className="hairline mt-8 flex flex-col gap-3 pt-6 sm:flex-row sm:justify-between"
    >
      <PagerButton lesson={prev} direction="prev" />
      <PagerButton lesson={next} direction="next" />
    </nav>
  );
}
