// TIL 잔디의 순수 계산. 날짜는 전부 서울 기준 'YYYY-MM-DD' 문자열로 받는다.
// 검사는 scripts/check-til-streak.mjs(import가 없어 Node 타입 스트리핑으로 그대로 로드한다).

export type StreakDay = {
  date: string;
  count: number;
  future: boolean;
};

export type StreakStats = {
  current: number;
  longest: number;
  monthDays: number;
  total: number;
};

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

function toUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function addDays(iso: string, n: number): string {
  const d = toUtc(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function isWeekend(iso: string): boolean {
  const day = toUtc(iso).getUTCDay();
  return day === 0 || day === 6;
}

export function formatDayKo(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(m)}월 ${Number(d)}일 ${WEEKDAY_KO[toUtc(iso).getUTCDay()]}요일`;
}

export function countByDate(dates: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const d of dates) counts.set(d, (counts.get(d) ?? 0) + 1);
  return counts;
}

// 월요일에 시작하는 주 단위 달력. 마지막 열이 오늘이 든 주이고, 오늘 뒤의 칸은 future로 표시한다.
export function buildWeeks(dates: readonly string[], today: string, weekCount: number): StreakDay[][] {
  const counts = countByDate(dates);
  const sinceMonday = (toUtc(today).getUTCDay() + 6) % 7;
  const start = addDays(today, -sinceMonday - (weekCount - 1) * 7);
  return Array.from({ length: weekCount }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(start, w * 7 + d);
      return { date, count: counts.get(date) ?? 0, future: date > today };
    }),
  );
}

// 열 위에 찍을 달 이름. 첫 열과, 월요일의 달이 앞 열과 달라지는 열에만 찍는다.
export function monthLabels(weeks: readonly StreakDay[][]): string[] {
  return weeks.map((week, i) => {
    const month = week[0].date.slice(5, 7);
    if (i > 0 && weeks[i - 1][0].date.slice(5, 7) === month) return '';
    return `${Number(month)}월`;
  });
}

// 연속 기록은 평일을 기준으로 센다. 수업이 평일에 있어 주말을 쉬어도 끊지 않고, 주말에 쓴 날은 더한다.
// 오늘 아직 안 썼어도 끊지 않는다(오늘이 끝나야 비로소 빠진 날이다).
export function computeStats(dates: readonly string[], today: string): StreakStats {
  const days = [...new Set(dates)].filter((d) => d <= today).sort();
  const written = new Set(days);

  let longest = 0;
  let run = 0;
  if (days.length > 0) {
    for (let d = days[0]; d <= today; d = addDays(d, 1)) {
      if (written.has(d)) {
        run++;
        longest = Math.max(longest, run);
      } else if (!isWeekend(d) && d !== today) {
        run = 0;
      }
    }
  }

  return {
    current: run,
    longest,
    monthDays: days.filter((d) => d.startsWith(today.slice(0, 7))).length,
    total: dates.length,
  };
}
