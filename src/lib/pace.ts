// 페이스 판정의 심장 — 의존성 0 순수 모듈. import 문을 하나도 쓰지 않는다.
// 그래야 Node가 이 파일을 별도 트랜스파일러 없이 그대로 로드할 수 있고
// (scripts/check-pace.mjs), 화면 작업이 판정 정확성을 다시 의심하지
// 않아도 된다 — today.ts/schedule.ts와 같은 이유.

export type PaceStatus = 'ahead' | 'on-track' | 'behind';

export type PaceResult = {
  status: PaceStatus;
  gapMinutes: number; // behind일 때만 > 0
  missedSlugs: string[]; // behind일 때 밀린 레슨 slug 목록(rows 순서를 따르므로 날짜 오름차순)
};

/**
 * rows·minutesBySlug·completedIds·todayStr로부터 3단계 페이스(ahead/on-track/behind)를
 * 판정한다. ScheduleRow를 import하지 않고 구조적 타입으로만 받는다 — 의존성 0을
 * 지키기 위해서다. date 비교는 문자열 사전순으로 충분하다: rows.date와 todayStr
 * 모두 YYYY-MM-DD 포맷 규칙으로 생성되므로 Date 객체 왕복이 필요 없다(today.ts/
 * schedule.ts와 같은 전제).
 *
 * 두 스코프의 완료 분 합계는 반드시 이름을 분리해서 유지한다 — "어제까지 배정분
 * 중 완료"(completedThroughYesterday)와 "전체 배정분(오늘·미래 포함) 중 완료"
 * (completedAllAssignedMinutes)를 하나의 변수로 합치면, 사용자가 미래 레슨을
 * 미리 완료했을 때 어제까지 배정분의 미완료를 가려 behind를 ahead로 오판하는
 * Pitfall 3의 실패 모드가 그대로 재현된다.
 *
 * lessonSlug가 null인 행(버퍼일)은 어느 합계·missedSlugs에도 들어가지 않는다.
 * minutesBySlug에 없는 slug는 0분으로 취급하고 예외를 던지지 않는다.
 * 입력 rows 배열·minutesBySlug Map·completedIds Set은 변형하지 않는다.
 */
export function computePace(
  rows: readonly { date: string; lessonSlug: string | null }[],
  minutesBySlug: ReadonlyMap<string, number>,
  completedIds: ReadonlySet<string>,
  todayStr: string,
): PaceResult {
  const pastRows = rows.filter((r) => r.lessonSlug !== null && r.date < todayStr);

  const assignedThroughYesterday = pastRows.reduce(
    (sum, r) => sum + (minutesBySlug.get(r.lessonSlug as string) ?? 0),
    0,
  );
  const completedThroughYesterday = pastRows
    .filter((r) => completedIds.has(r.lessonSlug as string))
    .reduce((sum, r) => sum + (minutesBySlug.get(r.lessonSlug as string) ?? 0), 0);

  const missedSlugs = pastRows
    .filter((r) => !completedIds.has(r.lessonSlug as string))
    .map((r) => r.lessonSlug as string);

  if (completedThroughYesterday < assignedThroughYesterday) {
    return {
      status: 'behind',
      gapMinutes: assignedThroughYesterday - completedThroughYesterday,
      missedSlugs,
    };
  }

  // 여기 도달했다는 것은 어제까지 배정분을 전부 완료했다는 뜻이다(D-41).
  // ahead 여부는 오늘·미래 배정분까지 포함한 전체 완료 합계를 별도로 다시
  // 계산해서 가른다 — 위 completedThroughYesterday를 재사용하지 않는다.
  const completedAllAssignedMinutes = rows
    .filter((r) => r.lessonSlug !== null && completedIds.has(r.lessonSlug))
    .reduce((sum, r) => sum + (minutesBySlug.get(r.lessonSlug as string) ?? 0), 0);

  if (completedAllAssignedMinutes > assignedThroughYesterday) {
    return { status: 'ahead', gapMinutes: 0, missedSlugs: [] };
  }
  return { status: 'on-track', gapMinutes: 0, missedSlugs: [] };
}

/**
 * 앞서간 정도를 수치로 만든다 — "앞서가고 있어요"만으로는 얼마나인지 알 수 없다.
 *
 * computePace()의 반환 타입을 건드리지 않고 별도 함수로 두는 이유: 그 함수의
 * 판정은 22개 케이스 게이트(scripts/check-pace.mjs)가 반환 객체 전체를
 * deepStrictEqual로 고정하고 있다. 필드를 하나 더하면 22개가 전부 깨진다.
 * 여기서 재는 것은 판정이 아니라 "얼마나"이므로 분리하는 편이 맞기도 하다.
 *
 * 세는 대상은 **오늘 이후(오늘 포함) 배정분 중 이미 완료한 것**이다. 어제까지의
 * 배정분은 앞선 것이 아니라 원래 했어야 하는 몫이므로 제외한다.
 *
 * daysAhead는 **오늘보다 뒤**에 배정된 날짜 중 완료한 것의 개수다(오늘 몫을
 * 끝낸 것은 0일 앞선 것 — 예정대로 한 것이지 앞선 게 아니다). 날짜는 문자열
 * 사전순 비교로 충분하다(computePace와 같은 전제).
 */
export type AheadDetail = {
  lessonCount: number; // 오늘 이후 배정분 중 미리 끝낸 레슨 수
  minutes: number; // 그 레슨들의 예상 소요 합계
  throughDate: string | null; // 완료한 것 중 가장 늦은 배정일 (없으면 null)
  daysAhead: number; // 오늘보다 뒤 날짜를 며칠치 끝냈는지
};

export function computeAheadDetail(
  rows: readonly { date: string; lessonSlug: string | null }[],
  minutesBySlug: ReadonlyMap<string, number>,
  completedIds: ReadonlySet<string>,
  todayStr: string,
): AheadDetail {
  const doneFromToday = rows.filter(
    (r) => r.lessonSlug !== null && r.date >= todayStr && completedIds.has(r.lessonSlug),
  );

  const minutes = doneFromToday.reduce(
    (sum, r) => sum + (minutesBySlug.get(r.lessonSlug as string) ?? 0),
    0,
  );

  let throughDate: string | null = null;
  const futureDates = new Set<string>();
  for (const r of doneFromToday) {
    if (throughDate === null || r.date > throughDate) throughDate = r.date;
    if (r.date > todayStr) futureDates.add(r.date);
  }

  return {
    lessonCount: doneFromToday.length,
    minutes,
    throughDate,
    daysAhead: futureDates.size,
  };
}

/**
 * 밀린 분량(gapMinutes)을 하루 30분씩 추가 투입하면 며칠 만에 따라잡는지 계산한다
 * (D-43, RESEARCH.md Assumption A1). 하루 추가 30분 상수는 이 함수 안에만 두고
 * UI 문구 층이 같은 계산을 다시 하지 않게 한다.
 */
export function catchUpDays(gapMinutes: number): number {
  const EXTRA_MINUTES_PER_DAY = 30;
  if (gapMinutes <= 0) return 0;
  return Math.ceil(gapMinutes / EXTRA_MINUTES_PER_DAY);
}

// 두 순수 날짜 헬퍼 — 이 파일 로컬 전용(export 안 함). schedule.ts와 동일한
// UTC 산술 패턴(Date.UTC + toISOString().slice(0,10))만 쓴다. 로컬 타임존
// getter(getDate 등)를 쓰면 서버 실행 환경의 타임존에 따라 날짜가 하루씩
// 밀릴 수 있다(Pitfall 1) — 이 패턴은 그 실패 모드를 원천 차단한다. Date는
// 전역 객체라 이 파일의 무-import 규약을 깨지 않는다.
function daysBetween(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split('-').map(Number);
  const [ty, tm, td] = toISO.split('-').map(Number);
  const fromMs = Date.UTC(fy, fm - 1, fd);
  const toMs = Date.UTC(ty, tm - 1, td);
  return Math.round((toMs - fromMs) / 86400000);
}

function addDays(baseISO: string, n: number): string {
  const [y, m, d] = baseISO.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/**
 * show(boolean) · projectedFinish(YYYY-MM-DD | null) · remainingCount(number) 세
 * 필드만 갖는다.
 */
export type Projection = {
  show: boolean;
  projectedFinish: string | null;
  remainingCount: number;
};

/**
 * 지금 속도로 남은 레슨을 전부 끝내면 언제 끝나는지 예측한다(round2-완료예측일).
 *
 * (1) 이 함수는 분 단위 behind를 모른다 — 권위 있는 판정(behind/on-track/ahead)은
 * computePace 소관이다. 여기서 쓰는 pastDueIncomplete는 카운트(레슨 개수) 기반
 * 프록시일 뿐이다. (2) behind일 때 예측 줄을 숨기는 최종 보장은 이 함수의 show
 * 플래그와 호출부(page.tsx/pace-status.tsx의 isBehind 분기 부재) 양쪽에 있다 —
 * 어느 한쪽이 흔들려도 나머지가 막는 두 겹 방어다(리서치 2단 경고: 늦은 완주일이
 * 격려를 낙담으로 반전시킨다). (3) 완료 0개·경과일 2일 미만은 속도 추정이
 * 통계적으로 불안정해 예측을 아예 숨긴다.
 *
 * 집계는 레슨 "개수" 기준이다(computePace의 "분" 기준과 다르다) — 예측은
 * "며칠 걸리는지"를 묻는 것이라 개수가 더 직접적인 단위다. minutesBySlug는
 * 받지 않는다. lessonSlug가 null인 버퍼 행은 어느 집계에도 들어가지 않는다.
 * 입력 rows 배열·completedIds Set은 변형하지 않는다(filter만 사용).
 */
export function computeProjection(
  rows: readonly { date: string; lessonSlug: string | null }[],
  completedIds: ReadonlySet<string>,
  todayStr: string,
  scheduleStart: string,
): Projection {
  const assigned = rows.filter((r) => r.lessonSlug !== null);
  const total = assigned.length;
  const completedCount = assigned.filter((r) => completedIds.has(r.lessonSlug as string)).length;
  const remaining = total - completedCount;

  // 카운트기반 behind 프록시 — 밀린 상태에서 예측 줄을 숨기는 두 겹 방어의
  // 함수 쪽 절반. 권위 있는 분 단위 판정은 computePace가 한다.
  const pastDueIncomplete = assigned.filter(
    (r) => r.date < todayStr && !completedIds.has(r.lessonSlug as string),
  ).length;

  const elapsedDays = daysBetween(scheduleStart, todayStr) + 1;

  if (completedCount < 1 || elapsedDays < 2 || pastDueIncomplete > 0 || remaining < 1) {
    return { show: false, projectedFinish: null, remainingCount: remaining };
  }

  const daysNeeded = Math.ceil((remaining * elapsedDays) / completedCount);
  return {
    show: true,
    projectedFinish: addDays(todayStr, daysNeeded),
    remainingCount: remaining,
  };
}
