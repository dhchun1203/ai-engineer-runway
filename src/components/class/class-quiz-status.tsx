import { Check } from "lucide-react";

// 수업 회차의 퀴즈 상태 글자. 모든 문항을 한 번 이상 풀면 "완료", 그 전에는 푼 문항 수를 보여 준다.

export function ClassQuizStatus({ done, total }: { done: number; total: number }) {
  if (total === 0) return null;
  if (done === total) {
    return (
      <span className="inline-flex items-center gap-1 text-label font-bold text-ok dark:text-ok-dark">
        <Check className="size-4 shrink-0" strokeWidth={3} aria-hidden="true" />
        완료
      </span>
    );
  }
  return (
    <span className="text-label font-normal tabular-nums text-badge-neutral-text dark:text-badge-neutral-text-dark">
      퀴즈 {done}/{total}
    </span>
  );
}
