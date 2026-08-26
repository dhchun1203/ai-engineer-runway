// D-day 카운트다운 배지 — progress-badge.tsx와 같은 형태의 서버 렌더 가능한 순수
// 표현 컴포넌트다: 상태 없음, 클라이언트 지시자 없음, 리터럴 클래스만 쓴다
// (Tailwind JIT 제약). daysUntil > 0이면 "개강까지"/"D-{n}", 0 이하면 "D-DAY"/
// "(개강일)"로 표시한다 — 개강 당일·이후에 음수를 보여주지 않는다(SCHED-04 경계).
// 마감 압박 장치가 아니다 — destructive 색·경고 아이콘·재촉 문구를 쓰지 않는다(D-43).

export function DDayCountdown({ daysUntil }: { daysUntil: number }) {
  const isBeforeStart = daysUntil > 0;

  return (
    <div data-schedule-ui="dday" className="flex flex-col gap-1">
      <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
        {isBeforeStart ? '개강까지' : '9/30 개강'}
      </span>
      {isBeforeStart ? (
        <span className="whitespace-nowrap text-display font-bold text-accent dark:text-accent-dark">
          D-{daysUntil}
        </span>
      ) : (
        <span className="flex flex-wrap items-baseline gap-2">
          <span className="whitespace-nowrap text-display font-bold text-accent dark:text-accent-dark">
            D-DAY
          </span>
          <span className="whitespace-nowrap text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            (개강일)
          </span>
        </span>
      )}
    </div>
  );
}
