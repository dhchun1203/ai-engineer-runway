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

  // 열(주) 단위 월 라벨 — GitHub 잔디처럼 각 열의 맨 위 칸이 새 달로 넘어가면 "N월"을 찍는다.
  // 격자는 grid-flow-col grid-rows-7이라 days[c*7]이 c번째 열의 top 칸이다.
  const columnCount = days.length / 7;
  const monthLabels: string[] = [];
  let prevMonth = '';
  for (let c = 0; c < columnCount; c++) {
    const month = days[c * 7].date.slice(5, 7); // 'MM'
    monthLabels.push(month !== prevMonth ? `${Number(month)}월` : '');
    prevMonth = month;
  }

  // 마지막(오늘) 칸의 날짜 — 캡션으로 범위를 알려 준다(아이패드엔 hover 툴팁이 없으므로).
  const firstDate = days[0].date;
  const lastDate = days[days.length - 1].date;
  const fmtKo = (iso: string) => {
    const [, m, d] = iso.split('-');
    return `${Number(m)}월 ${Number(d)}일`;
  };

  return (
    <section aria-label="학습기록 잔디" className="flex flex-col gap-1.5">
      {/* 바깥은 좁은 화면에서만 가로 스크롤. 안쪽 격자는 내용 폭으로 왼쪽에 촘촘히
          모인다(inline-grid + 고정 열폭) — 전체 폭으로 늘어나 성글어지는 것을 막는다. */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          {/* 월 라벨 행 — 각 열과 같은 열폭. 라벨은 시작 열에만 찍고 오른쪽으로 흘려
              넘긴다(빈 열 위로 겹쳐 보이게, whitespace-nowrap). GitHub 잔디와 같은 방식. */}
          <div className="grid grid-flow-col auto-cols-[0.7rem] gap-1">
            {monthLabels.map((label, i) => (
              <span
                key={i}
                className="h-3 overflow-visible whitespace-nowrap text-[0.6rem] leading-3 text-badge-neutral-text dark:text-badge-neutral-text-dark"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="grid grid-flow-col grid-rows-7 auto-cols-[0.7rem] gap-1">
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
      </div>
      <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
        {fmtKo(firstDate)} ~ {fmtKo(lastDate)} (지난 12주)
      </p>
    </section>
  );
}
