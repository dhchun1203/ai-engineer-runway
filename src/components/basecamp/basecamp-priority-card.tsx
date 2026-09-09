import Link from "next/link";
import { ArrowRight } from "lucide-react";

// 홈 대시보드 맨 위의 베이스캠프 최우선 카드. 베이스캠프 진도가 커리큘럼보다
// 우선이라는 결정을 화면에서 드러낸다. 서버 컴포넌트(표시 전용)로, 홈이 계산한
// 값을 props로 받는다. showProgress는 잠금 해제(진도 조회 가능) 때만 true.

export function BasecampPriorityCard({
  weekLabel,
  stepTitle,
  done,
  total,
  showProgress,
  daysLeft,
}: {
  weekLabel: string;
  stepTitle: string;
  done: number;
  total: number;
  showProgress: boolean;
  daysLeft: number;
}) {
  const allDone = showProgress && total > 0 && done === total;
  return (
    <Link
      href="/basecamp"
      className="card-interactive panel flex flex-col gap-3 border-2 border-foreground p-5 dark:border-foreground-dark sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip-solid text-label font-bold">최우선</span>
        <span className="text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
          베이스캠프 선행 과제
        </span>
        {daysLeft > 0 ? (
          <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
            마감 D-{daysLeft}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-2 text-heading font-extrabold break-keep">
          {weekLabel} {stepTitle}
        </span>
        {showProgress ? (
          <span className="text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            {allDone ? "이번 주 준비 완료" : `이번 주 준비 ${done}/${total}`}
          </span>
        ) : (
          <span className="text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            이번 주 선행 과제를 준비하세요
          </span>
        )}
      </div>

      <span className="mt-auto inline-flex items-center gap-1.5 text-label font-bold text-accent dark:text-accent-dark">
        베이스캠프로 가기
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </span>
    </Link>
  );
}
