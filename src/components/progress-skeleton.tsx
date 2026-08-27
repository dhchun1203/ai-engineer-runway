// 진도 아일랜드 로딩 상태 스켈레톤 3종 — 스피너를 쓰지 않는다
// (design-taste-frontend 4.5). 최종 레이아웃과 같은 자리를 차지하는 회색
// 블록으로 레이아웃 시프트를 막는다. 펄스는 Tailwind animate-pulse가 아니라
// globals.css의 .progress-skeleton 클래스를 쓴다 — 유틸리티 클래스는
// prefers-reduced-motion 미디어 쿼리로 끌 수 없기 때문이다.

/** ProgressBadge와 같은 인라인 높이 — Step/모듈 헤더 배지 자리에 쓴다. */
export function BadgeSkeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`progress-skeleton inline-block h-5 w-24 shrink-0 rounded-full bg-badge-neutral-bg dark:bg-badge-neutral-bg-dark${
        className ? ` ${className}` : ""
      }`}
    />
  );
}

/** 진행률 바 자리 — 최종 바와 같은 h-2 w-full 크기. */
export function BarSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`progress-skeleton h-2 w-full rounded-full bg-badge-neutral-bg dark:bg-badge-neutral-bg-dark${
        className ? ` ${className}` : ""
      }`}
    />
  );
}

/** 진행률 요약 블록(제목 한 줄 + 바 한 줄) 자리. */
export function SummarySkeleton({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-2${className ? ` ${className}` : ""}`} aria-hidden="true">
      <div className="progress-skeleton h-5 w-32 rounded bg-badge-neutral-bg dark:bg-badge-neutral-bg-dark" />
      <BarSkeleton />
    </div>
  );
}
