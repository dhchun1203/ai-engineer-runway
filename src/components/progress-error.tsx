// 진행률 조회 실패 안내 (D-31) — 레슨/모듈·Step/홈 세 표면 공용의 서버 렌더
// 가능한 순수 표현 컴포넌트. 진행률 수치나 0%를 함께 보여주지 않는다 — 조회
// 실패를 "아직 아무것도 안 했음"으로 오인시키지 않는 것이 이 컴포넌트의 목적
// 전부다. 색은 기존 neutral 배지 토큰을 쓴다 — destructive 토큰은 계속
// 미사용 예약 상태로 둔다(UI-SPEC Color).
//
// 08-07: optional onRetry prop — 정적 전환 이후 실패는 페이지 전체가 아니라
// fetch 하나의 실패이므로, 페이지를 새로고침하지 않고 그 fetch만 다시 하면
// 된다. onRetry가 없으면(홈처럼 서버 렌더라 재시도할 대상이 없는 경우) 지금과
// 완전히 같은 마크업을 낸다 — data-progress-ui="read-error" 마커와 문구는
// 게이트가 의존하므로 그대로 둔다. 버튼 문구·클래스 구성은
// complete-button.tsx의 기존 "다시 시도" 버튼을 그대로 따른다.

export function ProgressReadError({
  className,
  onRetry,
}: {
  className?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      data-progress-ui="read-error"
      className={`flex min-h-11 items-center gap-2 rounded-lg bg-badge-neutral-bg px-4 text-body font-normal text-badge-neutral-text dark:bg-badge-neutral-bg-dark dark:text-badge-neutral-text-dark${
        className ? ` ${className}` : ""
      }`}
    >
      <span>진행률을 불러오지 못했어요. 새로고침 후 다시 확인해주세요.</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="tap-feedback flex min-h-11 items-center justify-center rounded-lg border border-badge-neutral-bg px-3 dark:border-badge-neutral-bg-dark"
        >
          다시 시도
        </button>
      ) : null}
    </div>
  );
}
