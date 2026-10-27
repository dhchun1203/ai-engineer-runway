import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";

// 홈 대시보드 맨 위의 수업 복습 최우선 카드(2026-10-26 개강과 함께 베이스캠프 카드를 대신함).
// 가장 최근 수업과 그 회차의 복습 체크 진도를 보여 준다. 서버 컴포넌트(표시 전용)로, 홈이
// 계산한 값을 props로 받는다. showProgress는 진도 조회가 된 때만 true.
// reviewDue(2026-10-27)는 오늘 간격 복습 차례인 회차 수로, 있으면 카드 바로 아래에 /review
// 바로가기를 붙인다(카드 전체가 /class 링크라 그 안에 다른 링크를 넣지 않는다).

export function ClassPriorityCard({
  session,
  title,
  done,
  total,
  showProgress,
  reviewDue = 0,
}: {
  session: number;
  title: string;
  done: number;
  total: number;
  showProgress: boolean;
  reviewDue?: number;
}) {
  const allDone = showProgress && total > 0 && done === total;
  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/class"
        className="card-interactive panel flex flex-col gap-3 border-2 border-foreground p-5 dark:border-foreground-dark sm:p-6"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip-solid text-label font-bold">최우선</span>
          <span className="text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
            수업 복습
          </span>
        </div>
  
        <div className="flex flex-col gap-1">
          <span className="text-heading font-extrabold break-keep">
            {session}회차 {title}
          </span>
          <span className="text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            {!showProgress
              ? "최근 수업을 복습하세요"
              : allDone
                ? "복습 체크 완료"
                : `복습 체크 ${done}/${total}`}
          </span>
        </div>
  
        <span className="mt-auto inline-flex items-center gap-1.5 text-label font-bold text-accent dark:text-accent-dark">
          수업 복습으로 가기
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </span>
      </Link>
      {reviewDue > 0 ? (
        <Link
          href="/review"
          className="card-interactive panel flex min-h-11 items-center justify-between gap-3 px-5 py-3"
        >
          <span className="flex items-center gap-2 text-body font-bold break-keep">
            <RotateCcw className="h-4 w-4 shrink-0 text-accent dark:text-accent-dark" aria-hidden="true" />
            지난 수업 {reviewDue}개, 다시 꺼내 볼 차례예요
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
