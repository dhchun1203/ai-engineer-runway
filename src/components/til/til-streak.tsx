import { todayInSeoul } from '@/lib/today';
import { buildWeeks, computeStats, formatDayKo, monthLabels } from '@/lib/til/streak-logic';
import { levelClass } from './streak-level';

// 홈 카드 안의 작은 잔디(최근 12주). 카드 전체가 링크라 칸은 누를 수 없는 표시 전용이고,
// 날짜별 글은 /til의 큰 달력(TilCalendar)에서 본다. dates는 YYYY-MM-DD 발행 날짜들(중복 가능).
const WEEK_COUNT = 12;

export function TilStreak({ dates }: { dates: readonly string[] }) {
  // 발행글이 하나도 없으면 빈 격자를 보여줄 이유가 없다 — 아무것도 렌더하지 않는다.
  // (첫 글을 쓰기 전까지 회색 박스 밭이 뜨는 것을 막는다.)
  if (dates.length === 0) return null;

  const today = todayInSeoul(); // 'YYYY-MM-DD'
  const weeks = buildWeeks(dates, today, WEEK_COUNT);
  const labels = monthLabels(weeks);
  const stats = computeStats(dates, today);

  return (
    <section aria-label="학습기록 잔디" className="flex flex-col gap-2">
      {/* 맨 오른쪽 달 이름이 칸보다 살짝 길어 잘리지 않도록 오른쪽에 여백을 둔다. */}
      <div className="flex w-max max-w-full gap-1 overflow-x-auto pr-1">
        {weeks.map((week, w) => (
          <div key={week[0].date} className="flex flex-col gap-1">
            <span
              aria-hidden="true"
              className="h-4 w-5 whitespace-nowrap text-[0.75rem] leading-4 text-badge-neutral-text dark:text-badge-neutral-text-dark"
            >
              {labels[w]}
            </span>
            {week.map((day) =>
              day.future ? (
                <span key={day.date} aria-hidden="true" className="h-5 w-5" />
              ) : (
                <span
                  key={day.date}
                  title={`${formatDayKo(day.date)}: ${day.count}편`}
                  className={`h-5 w-5 rounded-sm ${levelClass(day.count)} ${
                    day.date === today ? 'ring-2 ring-inset ring-accent dark:ring-accent-dark' : ''
                  }`}
                />
              ),
            )}
          </div>
        ))}
      </div>
      <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
        연속 {stats.current}일, 최장 {stats.longest}일
      </p>
    </section>
  );
}
