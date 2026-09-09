import { todayInSeoul } from '@/lib/today';

// 최근 12주(84일) 잔디. dates는 YYYY-MM-DD 발행 날짜들(중복 가능 → 카운트).
export function TilStreak({ dates }: { dates: readonly string[] }) {
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
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
        {days.map((d) => (
          <span
            key={d.date}
            title={`${d.date}: ${d.count}편`}
            className={`h-3 w-3 rounded-sm ${
              d.count === 0
                ? 'bg-badge-neutral-bg dark:bg-badge-neutral-bg-dark'
                : d.count === 1
                  ? 'bg-ok/60 dark:bg-ok-dark/60'
                  : 'bg-ok dark:bg-ok-dark'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
