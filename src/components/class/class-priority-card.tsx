import Link from "next/link";
import { ArrowRight } from "lucide-react";

// 홈 대시보드 맨 위의 수업 복습 최우선 카드(2026-10-26 개강과 함께 베이스캠프 카드를 대신함).
// 가장 최근 수업과 그 회차의 복습 체크 진도를 보여 준다. 서버 컴포넌트(표시 전용)로, 홈이
// 계산한 값을 props로 받는다. showProgress는 진도 조회가 된 때만 true.

export function ClassPriorityCard({
  session,
  title,
  done,
  total,
  showProgress,
}: {
  session: number;
  title: string;
  done: number;
  total: number;
  showProgress: boolean;
}) {
  const allDone = showProgress && total > 0 && done === total;
  return (
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
  );
}
