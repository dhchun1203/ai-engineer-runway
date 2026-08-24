// 진행률 배지 — 모듈·Step 공용. depth-badge.tsx와 같은 형태의 서버 렌더 가능한
// 순수 표현 컴포넌트다: 상태 없음, 클라이언트 지시자 없음, 단일 <span>, 조건별
// 클래스는 리터럴로 미리 적어 둔다(Tailwind JIT이 동적 조합 클래스를 스캔하지
// 못한다). Step 상징 색은 쓰지 않는다 — 모듈·Step 양쪽 공용이고 Step 정체성은
// 이미 아코디언 헤더 틴트가 전달한다.

const PERCENT_ACCENT_CLASS = "text-accent dark:text-accent-dark";
const PERCENT_NEUTRAL_CLASS = "text-badge-neutral-text dark:text-badge-neutral-text-dark";

export function ProgressBadge({
  completed,
  total,
  percent,
  className,
}: {
  completed: number;
  total: number;
  percent: number;
  className?: string;
}) {
  const percentClass = percent > 0 ? PERCENT_ACCENT_CLASS : PERCENT_NEUTRAL_CLASS;

  return (
    <span
      data-progress-ui="badge"
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[14px] font-normal leading-[1.4] text-badge-neutral-text dark:text-badge-neutral-text-dark${
        className ? ` ${className}` : ""
      }`}
    >
      완료 {completed}/{total} ·{" "}
      <span className={`text-[14px] font-semibold leading-[1.4] ${percentClass}`}>{percent}%</span>
    </span>
  );
}
