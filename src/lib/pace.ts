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
 * 밀린 분량(gapMinutes)을 하루 30분씩 추가 투입하면 며칠 만에 따라잡는지 계산한다
 * (D-43, RESEARCH.md Assumption A1). 하루 추가 30분 상수는 이 함수 안에만 두고
 * UI 문구 층이 같은 계산을 다시 하지 않게 한다.
 */
export function catchUpDays(gapMinutes: number): number {
  const EXTRA_MINUTES_PER_DAY = 30;
  if (gapMinutes <= 0) return 0;
  return Math.ceil(gapMinutes / EXTRA_MINUTES_PER_DAY);
}
