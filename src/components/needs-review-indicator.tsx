// "더 공부할 레슨으로 표시"(needs_review) 커리큘럼 목록 표시자 — progress-badge.tsx와
// 같은 순수 표현 컴포넌트다: 상태 없음, 클라이언트 지시자 없음, 조건별 클래스는
// 리터럴로 미리 적어 둔다(Tailwind JIT 대응). 색은 action(브랜드 강조색)을 써서
// 완료(accent) 표시와 눈에 띄게 구분한다 — 한 레슨이 완료이면서 동시에 표시될 수 있어
// 두 표식이 같은 색이면 헷갈린다.

import { Flag } from "lucide-react";

const FLAG_COLOR = "text-action dark:text-action-dark";

/** 레슨 줄 옆 한 개짜리 표식(완료 ✓와 공존). 완료 체크와 같은 크기·정렬. */
export function NeedsReviewMark() {
  return (
    <Flag
      className={`mt-1 h-4 w-4 shrink-0 self-start fill-current ${FLAG_COLOR}`}
      aria-label="더 공부할 레슨으로 표시함"
    />
  );
}

/** 모듈·Step 헤더의 "🚩 N" 개수 배지 — count가 0이면 아무것도 렌더하지 않는다. */
export function NeedsReviewCount({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;

  return (
    <span
      data-needs-review-count={count}
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-label font-semibold ${FLAG_COLOR}${
        className ? ` ${className}` : ""
      }`}
    >
      <Flag className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
      더 공부 {count}
    </span>
  );
}
