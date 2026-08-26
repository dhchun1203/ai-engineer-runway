// 일정 생성의 심장 — 의존성 0 순수 모듈. import 문을 하나도 쓰지 않는다. 그래야
// Node가 이 파일을 별도 트랜스파일러 없이 그대로 로드할 수 있다(scripts/check-schedule.mjs,
// Node 22.6+ 타입 스트리핑) — today.ts/progress-math.ts와 같은 이유.

// 35개 날짜→레슨 매핑을 상수로 하드코딩하지 않는다 — 배정은 항상 buildSchedule의
// orderedSlugs 인자 순서에서 파생된다(D-32/D-33). SCHEDULE_START·DOUBLE_LESSON_DATES만
// 상수로 고정한다.
export const SCHEDULE_START = '2026-08-28';
export const COURSE_START_DATE = '2026-09-30';

// 사용자가 2026-08-26에 학습 시작일을 8/25 → 8/28로 옮기기로 결정했다. 8/28~9/29는
// 33일뿐이고 9/29를 복습·버퍼일로 남기면 학습일이 32일이라, 35레슨을 그 안에 담으려면
// 정확히 3일이 레슨 2개를 져야 한다(scheduleTotalDays(35, 3) === 33). 그 3일을 토요일로,
// 그리고 앞쪽 2주에 몰아 두면 밀린 3일치가 초반에 청산되고 개강 직전 2.5주는 하루
// 1레슨의 평탄한 속도로 남는다.
//
// 이 상수는 **어느 날이 2레슨인지**만 말하고 **어느 레슨이 어느 날인지**는 말하지
// 않는다 — 배정은 여전히 buildSchedule의 orderedSlugs 인자 순서에서만 파생된다.
export const DOUBLE_LESSON_DATES = ['2026-08-29', '2026-09-05', '2026-09-12'] as const;

/**
 * 레슨 수 + 1(9/29 복습·버퍼일, D-34) - 2레슨 날 수만큼의 총 일정 일수.
 * doubleDayCount는 기본값 0 — 인자 1개 호출은 종전(lessonCount + 1)과 같은 결과를 낸다.
 */
export function scheduleTotalDays(lessonCount: number, doubleDayCount: number = 0): number {
  return lessonCount - doubleDayCount + 1;
}

export type ScheduleRow = {
  date: string; // YYYY-MM-DD
  lessonSlug: string | null; // null = 배정 없음(버퍼일)
  isBuffer: boolean;
};

/**
 * orderedSlugs 순서를 startDateISO부터 배정한다. doubleDates에 포함된 날짜는 하루에
 * 2개, 그 외에는 하루에 1개를 배정한다. totalDays일을 순회하며 그날 배정할 개수만큼
 * orderedSlugs에서 앞에서부터 꺼내 행을 만든다 — 남은 slug가 모자라면 배정 가능한
 * 만큼만 행을 만들고 예외를 던지지 않는다. 그날 한 개도 배정하지 못했으면
 * lessonSlug: null / isBuffer: true 행 하나를 넣는다. 입력 배열은 변형하지 않는다.
 * 날짜 산술은 전 구간 Date.UTC(y, m-1, d+i) + toISOString().slice(0,10)만 쓴다 —
 * 로컬 타임존 getter는 한 번도 쓰지 않는다(Pitfall 1).
 */
export function buildSchedule(
  orderedSlugs: readonly string[],
  startDateISO: string,
  totalDays: number,
  doubleDates: readonly string[] = [],
): ScheduleRow[] {
  const doubleDateSet = new Set(doubleDates);
  const [y, m, d] = startDateISO.split('-').map(Number);
  const rows: ScheduleRow[] = [];
  let cursor = 0;
  for (let i = 0; i < totalDays; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const dateStr = dt.toISOString().slice(0, 10);
    const slotsToday = doubleDateSet.has(dateStr) ? 2 : 1;
    let assignedAny = false;
    for (let slot = 0; slot < slotsToday && cursor < orderedSlugs.length; slot++) {
      rows.push({ date: dateStr, lessonSlug: orderedSlugs[cursor], isBuffer: false });
      cursor++;
      assignedAny = true;
    }
    if (!assignedAny) {
      rows.push({ date: dateStr, lessonSlug: null, isBuffer: true });
    }
  }
  return rows;
}

/** 그 날짜의 행 전부를 순서대로 돌려주는 순수 함수. */
export function rowsForDate(rows: readonly ScheduleRow[], dateISO: string): ScheduleRow[] {
  return rows.filter((r) => r.date === dateISO);
}

/**
 * date > dateISO인 첫 행을 돌려주고 없으면 null. rows.indexOf(...) + 1 같은 인덱스
 * 산술을 쓰지 않는 이유 — 같은 날짜에 행이 2개면 +1이 같은 날의 두 번째 레슨을
 * 가리켜 "내일"이 오늘이 되어 버린다. date 비교로 다음 날짜의 첫 행을 직접 찾는다.
 */
export function firstRowAfter(rows: readonly ScheduleRow[], dateISO: string): ScheduleRow | null {
  return rows.find((r) => r.date > dateISO) ?? null;
}
