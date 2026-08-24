import Link from "next/link";
import type { ProgressCounts } from "@/lib/progress-math";
import { ProgressBadge } from "@/components/progress-badge";

// 홈 전체 진행률 요약 블록 — 서버 렌더 가능한 순수 표현 컴포넌트. 클라이언트
// 지시자를 붙이지 않는다. 데이터 조회는 스스로 하지 않고 홈 페이지가 계산한
// counts/nextLessonSlug만 받는다(02-04 Task 1). Phase 3에서 '오늘의 학습' 뷰가
// 이 블록을 그대로 흡수할 예정이라(D-25) 독립 컴포넌트로 둔다.

export function ProgressSummary({
  counts,
  nextLessonSlug,
}: {
  counts: ProgressCounts;
  nextLessonSlug: string | null;
}) {
  const { completed, total, percent } = counts;
  const isEmpty = completed === 0;
  const isAllComplete = completed === total && total > 0;

  let heading: string;
  let body: string;
  if (isAllComplete) {
    heading = "커리큘럼을 모두 완료했어요!";
    body = "축하합니다. 처음부터 다시 볼 수도 있어요.";
  } else if (isEmpty) {
    heading = "학습을 시작해볼까요?";
    body = "완료한 레슨이 아직 없어요.";
  } else {
    heading = "전체 진행률";
    body = `${completed}/${total} 레슨 완료 · ${percent}%`;
  }

  // CTA: 전건 완료면 항상 "커리큘럼 처음으로" → /step/1. 그 외에는 다음 미완료
  // 레슨이 있을 때만 "이어서 학습하기" → /lesson/{slug}. total===0 같은 경계에서는
  // CTA를 렌더하지 않는다(링크할 대상이 없다).
  const cta = isAllComplete
    ? { href: "/step/1", label: "커리큘럼 처음으로" }
    : nextLessonSlug
      ? { href: `/lesson/${nextLessonSlug}`, label: "이어서 학습하기" }
      : null;

  return (
    <section
      data-progress-ui="summary"
      data-progress-percent={percent}
      className="flex flex-col gap-4 rounded-lg bg-surface p-6 dark:bg-surface-dark"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-[20px] font-semibold leading-[1.3]">{heading}</h2>
        {!isEmpty ? (
          <p className="text-[28px] font-semibold leading-[1.2] text-accent dark:text-accent-dark">{percent}%</p>
        ) : null}
        <p className="text-[16px] font-normal leading-[1.6]">{body}</p>
        <ProgressBadge completed={completed} total={total} percent={percent} />
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-badge-neutral-bg dark:bg-badge-neutral-bg-dark"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-accent dark:bg-accent-dark"
          style={{ width: `${percent}%` }}
        />
      </div>
      {cta ? (
        <Link
          href={cta.href}
          className="flex min-h-11 w-fit items-center justify-center rounded-lg bg-accent px-4 py-2 text-[16px] font-semibold leading-[1.6] text-white dark:bg-accent-dark dark:text-background-dark"
        >
          {cta.label}
        </Link>
      ) : null}
    </section>
  );
}
