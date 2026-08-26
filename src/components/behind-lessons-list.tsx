import Link from "next/link";
import type { StepId } from "@/content/modules";
import { DepthBadge } from "@/components/depth-badge";
import { EstimatedTime } from "@/components/estimated-time";

// 밀린 레슨 섹션(D-39) — step-card.tsx처럼 행 전체가 하나의 링크인 목록 항목
// 형태를 그대로 따르는 서버 렌더 순수 표현 컴포넌트. 매니페스트를 스스로
// 조회하지 않는다 — page.tsx가 computePace().missedSlugs를 getLessonBySlug/rows와
// 조합해 만든 이미 조립된 평범한 데이터만 받는다(밀린 목록을 별도로 재계산하지
// 않는다). 개수 상한이나 접기(<details>) UI를 두지 않는다 — 길어지면 스크롤로
// 해결한다(RESEARCH Open Question 2 권장안).

export type BehindLessonRow = {
  date: string;
  slug: string;
  title: string;
  depth: "심화" | "개요";
  stepId: StepId;
  estimatedMinutes: number;
};

export function BehindLessonsList({ rows }: { rows: readonly BehindLessonRow[] }) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section data-schedule-ui="behind-list" className="flex flex-col gap-3">
      <h2 className="text-heading font-bold">밀린 레슨 {rows.length}개</h2>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.slug}>
            <Link
              href={`/lesson/${row.slug}`}
              className="flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-lg bg-surface p-4 dark:bg-surface-dark"
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {row.date}
                </span>
                <span className="text-body font-normal">{row.title}</span>
                <span className="text-label font-semibold text-accent dark:text-accent-dark">
                  레슨 시작하기
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <DepthBadge depth={row.depth} stepId={row.stepId} />
                <EstimatedTime minutes={row.estimatedMinutes} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
