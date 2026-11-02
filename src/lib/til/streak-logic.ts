// TIL 잔디의 순수 계산. 날짜는 전부 서울 기준 'YYYY-MM-DD' 문자열로 받는다.
// 하루에 몇 편을 썼는지는 따지지 않고, 그날 썼는지만 본다.
// 검사는 scripts/check-til-streak.mjs(import가 없어 Node 타입 스트리핑으로 그대로 로드한다).

export type StreakDay = {
  date: string;
  written: boolean;
  future: boolean;
};

export type StreakStats = {
  current: number;
  longest: number;
  monthDays: number;
  totalDays: number;
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

// 월요일에 시작하는 주 단위 달력. 마지막 열이 오늘이 든 주이고, 오늘 뒤의 칸은 future로 표시한다.
export function buildWeeks(dates: readonly string[], today: string, weekCount: number): StreakDay[][] {
  const written = new Set(dates);
  const sinceMonday = (toUtc(today).getUTCDay() + 6) % 7;
  const start = addDays(today, -sinceMonday - (weekCount - 1) * 7);
  return Array.from({ length: weekCount }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(start, w * 7 + d);
      return { date, written: written.has(date), future: date > today };
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

export type MonthCell = {
  date: string;
  day: number;
  written: boolean;
  /** 안 쓴 주말이지만 앞뒤로 쓴 날이 있어 연속이 이어지는 날 */
  bridged: boolean;
  /** 왼쪽, 오른쪽 날과 띠가 이어지는지 */
  linkLeft: boolean;
  linkRight: boolean;
  future: boolean;
};

export type MonthGrid = {
  /** 'YYYY-MM' */
  month: string;
  label: string;
  /** 월요일 시작. 1일 앞의 빈칸은 null */
  cells: (MonthCell | null)[];
};

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

// 한 달 달력. 연속 기록과 같은 규칙으로, 안 쓴 주말은 앞뒤에 쓴 날이 있을 때만 이어진 것으로 본다.
export function buildMonth(dates: readonly string[], today: string, month: string): MonthGrid {
  const written = new Set(dates);
  const isBridged = (d: string) => {
    if (written.has(d) || !isWeekend(d)) return false;
    let before = addDays(d, -1);
    while (isWeekend(before) && !written.has(before)) before = addDays(before, -1);
    let after = addDays(d, 1);
    while (isWeekend(after) && !written.has(after)) after = addDays(after, 1);
    return written.has(before) && written.has(after);
  };
  const isLinked = (d: string) => written.has(d) || isBridged(d);

  const first = `${month}-01`;
  const cells: (MonthCell | null)[] = Array.from({ length: (toUtc(first).getUTCDay() + 6) % 7 }, () => null);
  for (let d = first; d.startsWith(month); d = addDays(d, 1)) {
    const linked = isLinked(d);
    cells.push({
      date: d,
      day: Number(d.slice(8)),
      written: written.has(d),
      bridged: isBridged(d),
      linkLeft: linked && isLinked(addDays(d, -1)),
      linkRight: linked && isLinked(addDays(d, 1)),
      future: d > today,
    });
  }
  return { month, label: `${Number(month.slice(5))}월`, cells };
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
    totalDays: days.length,
  };
}
