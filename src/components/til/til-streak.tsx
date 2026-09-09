import { todayInSeoul } from '@/lib/today';

// 최근 12주(84일) 잔디. dates는 YYYY-MM-DD 발행 날짜들(중복 가능 → 카운트).
export function TilStreak({ dates }: { dates: readonly string[] }) {
  // 발행글이 하나도 없으면 빈 격자를 보여줄 이유가 없다 — 아무것도 렌더하지 않는다.
  // (첫 글을 쓰기 전까지 회색 박스 밭이 뜨는 것을 막는다.)
  if (dates.length === 0) return null;

  const counts = new Map<string, number>();
  for (const d of dates) counts.set(d, (counts.get(d) ?? 0) + 1);

  const today = todayInSeoul(); // 'YYYY-MM-DD'
  const days: { date: string; count: number }[] = [];
  const base = new Date(`${today}T00:00:00+09:00`);
  for (let i = 83; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const iso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(d);
    days.push({ date: iso, count: counts.get(iso) ?? 0 });
  }

  return (
    <section aria-label="학습기록 잔디" className="flex flex-col gap-2">
      {/* 바깥은 좁은 화면에서만 가로 스크롤. 안쪽 격자는 내용 폭으로 왼쪽에 촘촘히
          모인다(inline-grid + 고정 열폭) — 전체 폭으로 늘어나 성글어지는 것을 막는다. */}
      <div className="overflow-x-auto">
        <div className="inline-grid grid-flow-col grid-rows-7 auto-cols-[0.7rem] gap-1">
          {days.map((d) => (
            <span
              key={d.date}
              title={`${d.date}: ${d.count}편`}
              className={`h-[0.7rem] w-[0.7rem] rounded-sm ${
                d.count === 0
                  ? 'bg-badge-neutral-bg dark:bg-badge-neutral-bg-dark'
                  : d.count === 1
                    ? 'bg-ok/60 dark:bg-ok-dark/60'
                    : 'bg-ok dark:bg-ok-dark'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
