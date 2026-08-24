// 일정 생성의 심장 — 의존성 0 순수 모듈. import 문을 하나도 쓰지 않는다. 그래야
// Node가 이 파일을 별도 트랜스파일러 없이 그대로 로드할 수 있다(scripts/check-schedule.mjs,
// Node 22.6+ 타입 스트리핑) — today.ts/progress-math.ts와 같은 이유.

// 35개 날짜→레슨 매핑을 상수로 하드코딩하지 않는다 — 배정은 항상 buildSchedule의
// orderedSlugs 인자 순서에서 파생된다(D-32/D-33). SCHEDULE_START만 상수로 고정한다.
export const SCHEDULE_START = '2026-08-25';
export const COURSE_START_DATE = '2026-09-30';

/** 레슨 수 + 1(9/29 복습·버퍼일, D-34)만큼의 총 일정 일수. */
export function scheduleTotalDays(lessonCount: number): number {
  return lessonCount + 1;
}

export type ScheduleRow = {
  date: string; // YYYY-MM-DD
  lessonSlug: string | null; // null = 배정 없음(버퍼일)
  isBuffer: boolean;
};

/**
 * orderedSlugs 순서를 startDateISO부터 하루 1개씩 배정한다. totalDays가
 * orderedSlugs.length보다 크면 남는 날은 lessonSlug: null, isBuffer: true가 된다.
 * 날짜 산술은 전 구간 Date.UTC(y, m-1, d+i) + toISOString().slice(0,10)만 쓴다 —
 * 로컬 타임존 getter는 한 번도 쓰지 않는다(Pitfall 1). 입력 배열을 변형하지 않는다.
 */
export function buildSchedule(
  orderedSlugs: readonly string[],
  startDateISO: string,
  totalDays: number,
): ScheduleRow[] {
  const [y, m, d] = startDateISO.split('-').map(Number);
  const rows: ScheduleRow[] = [];
  for (let i = 0; i < totalDays; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const dateStr = dt.toISOString().slice(0, 10);
    const lessonSlug = i < orderedSlugs.length ? orderedSlugs[i] : null;
    rows.push({ date: dateStr, lessonSlug, isBuffer: lessonSlug === null });
  }
  return rows;
}
