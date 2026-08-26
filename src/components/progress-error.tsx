// 진행률 조회 실패 안내 (D-31) — 레슨/모듈·Step/홈 세 표면 공용의 서버 렌더
// 가능한 순수 표현 컴포넌트. 진행률 수치나 0%를 함께 보여주지 않는다 — 조회
// 실패를 "아직 아무것도 안 했음"으로 오인시키지 않는 것이 이 컴포넌트의 목적
// 전부다. 색은 기존 neutral 배지 토큰을 쓴다 — destructive 토큰은 계속
// 미사용 예약 상태로 둔다(UI-SPEC Color).

export function ProgressReadError({ className }: { className?: string }) {
  return (
    <div
      data-progress-ui="read-error"
      className={`flex min-h-11 items-center rounded-lg bg-badge-neutral-bg px-4 text-body font-normal text-badge-neutral-text dark:bg-badge-neutral-bg-dark dark:text-badge-neutral-text-dark${
        className ? ` ${className}` : ""
      }`}
    >
      진행률을 불러오지 못했어요. 새로고침 후 다시 확인해주세요.
    </div>
  );
}
