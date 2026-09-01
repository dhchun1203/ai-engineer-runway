#!/usr/bin/env node
// src/lib/schedule.ts(buildSchedule, scheduleTotalDays)와 src/lib/today.ts(todayInSeoul,
// daysUntil)의 경계값을 node:assert로 직접 실행 검증하는 게이트. 외부 의존성 0,
// 새 devDependency 추가 없음. 두 파일 모두 import를 쓰지 않으므로 Node가 별도 러너
// 없이 그대로 로드한다(Node 22.6+ 타입 스트리핑, check-progress-math.mjs와 같은 원리).

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCHEDULE_PATH = path.join(ROOT, 'src', 'lib', 'schedule.ts');
const TODAY_PATH = path.join(ROOT, 'src', 'lib', 'today.ts');

const failures = [];
let caseCount = 0;

function runCase(name, fn) {
  caseCount++;
  try {
    fn();
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function makeSlugs(n) {
  return Array.from({ length: n }, (_, i) => `lesson-${i + 1}`);
}

async function main() {
  const {
    buildSchedule,
    scheduleTotalDays,
    SCHEDULE_START,
    DOUBLE_LESSON_DATES,
    SCHEDULE_SPAN_DAYS,
    rowsForDate,
    firstRowAfter,
  } = await import(pathToFileURL(SCHEDULE_PATH).href);
  const { todayInSeoul, daysUntil } = await import(pathToFileURL(TODAY_PATH).href);

  // --- 상수·산식 ---

  runCase("SCHEDULE_START 값이 '2026-08-28'이다", () => {
    assert.strictEqual(SCHEDULE_START, '2026-08-28');
  });

  runCase('DOUBLE_LESSON_DATES가 B안(2026-09-01 사용자 결정) 5일과 순서까지 일치한다', () => {
    assert.deepStrictEqual(DOUBLE_LESSON_DATES, [
      '2026-08-29',
      '2026-09-05',
      '2026-09-06',
      '2026-09-12',
      '2026-09-19',
    ]);
  });

  runCase('SCHEDULE_SPAN_DAYS === 33 (8/28~9/29 고정 달력 — 레슨 수에서 파생하지 않는다)', () => {
    assert.strictEqual(SCHEDULE_SPAN_DAYS, 33);
  });

  runCase('scheduleTotalDays(35, 3) === 33', () => {
    assert.strictEqual(scheduleTotalDays(35, 3), 33);
  });

  runCase('scheduleTotalDays(35, 0) === 36 (2레슨 날이 없으면 종전 산식과 같다)', () => {
    assert.strictEqual(scheduleTotalDays(35, 0), 36);
  });

  // --- 실제 일정 ---

  runCase('실제 일정: rows.length === 38 (레슨 35 + 복습·버퍼 3)', () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(
      slugs,
      SCHEDULE_START,
      SCHEDULE_SPAN_DAYS,
      DOUBLE_LESSON_DATES,
    );
    assert.strictEqual(rows.length, 38);
  });

  runCase('실제 일정: 서로 다른 날짜 수가 33이다', () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(
      slugs,
      SCHEDULE_START,
      SCHEDULE_SPAN_DAYS,
      DOUBLE_LESSON_DATES,
    );
    const dates = new Set(rows.map((r) => r.date));
    assert.strictEqual(dates.size, 33);
  });

  runCase(
    '실제 일정: lessonSlug가 null이 아닌 행이 35개이고 그 slug 배열이 입력 makeSlugs(35)와 순서까지 일치한다',
    () => {
      const slugs = makeSlugs(35);
      const rows = buildSchedule(
        slugs,
        SCHEDULE_START,
        SCHEDULE_SPAN_DAYS,
        DOUBLE_LESSON_DATES,
      );
      const assignedSlugs = rows.filter((r) => r.lessonSlug !== null).map((r) => r.lessonSlug);
      assert.strictEqual(assignedSlugs.length, 35);
      assert.deepStrictEqual(assignedSlugs, slugs);
    },
  );

  runCase('실제 일정: 날짜 배열이 비내림차순이다(중복은 허용, 역행은 실패)', () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(
      slugs,
      SCHEDULE_START,
      SCHEDULE_SPAN_DAYS,
      DOUBLE_LESSON_DATES,
    );
    const dates = rows.map((r) => r.date);
    for (let i = 1; i < dates.length; i++) {
      assert.ok(dates[i] >= dates[i - 1], `날짜가 역행함: ${dates[i - 1]} -> ${dates[i]}`);
    }
  });

  runCase(
    '실제 일정: 같은 날짜 2행 갖는 날짜 목록이 DOUBLE_LESSON_DATES와 일치하고 3행 이상인 날짜는 0건',
    () => {
      const slugs = makeSlugs(35);
      const rows = buildSchedule(
        slugs,
        SCHEDULE_START,
        SCHEDULE_SPAN_DAYS,
        DOUBLE_LESSON_DATES,
      );
      const countByDate = new Map();
      for (const r of rows) {
        countByDate.set(r.date, (countByDate.get(r.date) ?? 0) + 1);
      }
      const doubleDates = [...countByDate.entries()]
        .filter(([, count]) => count === 2)
        .map(([date]) => date)
        .sort();
      assert.deepStrictEqual(doubleDates, [...DOUBLE_LESSON_DATES].sort());
      const tripleOrMore = [...countByDate.values()].filter((count) => count >= 3);
      assert.strictEqual(tripleOrMore.length, 0);
    },
  );

  runCase("실제 일정: 마지막 레슨 행(lessonSlug가 null이 아닌 마지막 행)의 date가 '2026-09-26'이다 (B안)", () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(
      slugs,
      SCHEDULE_START,
      SCHEDULE_SPAN_DAYS,
      DOUBLE_LESSON_DATES,
    );
    const lessonRows = rows.filter((r) => r.lessonSlug !== null);
    assert.strictEqual(lessonRows[lessonRows.length - 1].date, '2026-09-26');
  });

  runCase("실제 일정: 마지막 3행이 9/27·9/28·9/29 복습·버퍼 행이다 (B안)", () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(
      slugs,
      SCHEDULE_START,
      SCHEDULE_SPAN_DAYS,
      DOUBLE_LESSON_DATES,
    );
    assert.deepStrictEqual(rows.slice(35), [
      { date: '2026-09-27', lessonSlug: null, isBuffer: true },
      { date: '2026-09-28', lessonSlug: null, isBuffer: true },
      { date: '2026-09-29', lessonSlug: null, isBuffer: true },
    ]);
  });

  runCase("실제 일정: date < SCHEDULE_START인 행 0건, date > '2026-09-29'인 행 0건", () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(
      slugs,
      SCHEDULE_START,
      SCHEDULE_SPAN_DAYS,
      DOUBLE_LESSON_DATES,
    );
    const belowStart = rows.filter((r) => r.date < SCHEDULE_START);
    const aboveEnd = rows.filter((r) => r.date > '2026-09-29');
    assert.strictEqual(belowStart.length, 0);
    assert.strictEqual(aboveEnd.length, 0);
  });

  runCase('실제 일정: DOUBLE_LESSON_DATES의 어떤 날짜도 isBuffer: true 행을 갖지 않는다', () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(
      slugs,
      SCHEDULE_START,
      SCHEDULE_SPAN_DAYS,
      DOUBLE_LESSON_DATES,
    );
    for (const doubleDate of DOUBLE_LESSON_DATES) {
      const bufferRows = rows.filter((r) => r.date === doubleDate && r.isBuffer);
      assert.strictEqual(bufferRows.length, 0, `${doubleDate}에 버퍼 행이 존재함`);
    }
  });

  runCase("월 경계: '2026-08-31'을 갖는 행 다음에 나오는 서로 다른 첫 날짜가 '2026-09-01'이다", () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(
      slugs,
      SCHEDULE_START,
      SCHEDULE_SPAN_DAYS,
      DOUBLE_LESSON_DATES,
    );
    const idx = rows.findIndex((r) => r.date === '2026-08-31');
    assert.notStrictEqual(idx, -1, '2026-08-31 행을 찾지 못함');
    const nextDifferentDate = rows.slice(idx).find((r) => r.date !== '2026-08-31')?.date;
    assert.strictEqual(nextDifferentDate, '2026-09-01');
  });

  runCase('buildSchedule 호출 후 입력 slug 배열과 doubleDates 배열이 변형되지 않았다', () => {
    const slugs = makeSlugs(35);
    const slugsSnapshot = [...slugs];
    const doubleDatesSnapshot = [...DOUBLE_LESSON_DATES];
    buildSchedule(slugs, SCHEDULE_START, SCHEDULE_SPAN_DAYS, DOUBLE_LESSON_DATES);
    assert.deepStrictEqual(slugs, slugsSnapshot);
    assert.deepStrictEqual(DOUBLE_LESSON_DATES, doubleDatesSnapshot);
  });

  // --- 경계 ---

  runCase("buildSchedule([], '2026-08-28', 1, []) -> 버퍼 1행만", () => {
    const rows = buildSchedule([], '2026-08-28', 1, []);
    assert.strictEqual(rows.length, 1);
    assert.deepStrictEqual(rows[0], { date: '2026-08-28', lessonSlug: null, isBuffer: true });
  });

  runCase("buildSchedule(makeSlugs(2), '2026-08-28', 2, ['2026-08-28']) -> 8/28에 2행, 8/29는 버퍼 1행", () => {
    const rows = buildSchedule(makeSlugs(2), '2026-08-28', 2, ['2026-08-28']);
    assert.strictEqual(rows.length, 3);
    assert.strictEqual(rows[0].date, '2026-08-28');
    assert.strictEqual(rows[1].date, '2026-08-28');
    assert.strictEqual(rows[0].isBuffer, false);
    assert.strictEqual(rows[1].isBuffer, false);
    assert.strictEqual(rows[2].date, '2026-08-29');
    assert.strictEqual(rows[2].isBuffer, true);
  });

  runCase(
    "buildSchedule(makeSlugs(1), '2026-08-28', 2, ['2026-08-28']) -> slug가 모자라면 8/28은 1행만 갖고 예외를 던지지 않는다",
    () => {
      const rows = buildSchedule(makeSlugs(1), '2026-08-28', 2, ['2026-08-28']);
      const day1Rows = rows.filter((r) => r.date === '2026-08-28');
      assert.strictEqual(day1Rows.length, 1);
      assert.strictEqual(day1Rows[0].lessonSlug, 'lesson-1');
    },
  );

  runCase('doubleDates에 일정 범위 밖 날짜가 들어와도 예외 없이 무시된다', () => {
    const rows = buildSchedule(makeSlugs(2), '2026-08-28', 2, ['2099-01-01']);
    assert.strictEqual(rows.length, 2);
  });

  // --- 선택 헬퍼 ---

  runCase("rowsForDate(rows, '2026-08-28').length === 1", () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(
      slugs,
      SCHEDULE_START,
      SCHEDULE_SPAN_DAYS,
      DOUBLE_LESSON_DATES,
    );
    assert.strictEqual(rowsForDate(rows, '2026-08-28').length, 1);
  });

  runCase(
    "rowsForDate(rows, '2026-08-29').length === 2이고 두 행의 slug가 서로 다르며 입력 순서상 연속한 2개다",
    () => {
      const slugs = makeSlugs(35);
      const rows = buildSchedule(
        slugs,
        SCHEDULE_START,
        SCHEDULE_SPAN_DAYS,
        DOUBLE_LESSON_DATES,
      );
      const dayRows = rowsForDate(rows, '2026-08-29');
      assert.strictEqual(dayRows.length, 2);
      assert.notStrictEqual(dayRows[0].lessonSlug, dayRows[1].lessonSlug);
      const idx0 = slugs.indexOf(dayRows[0].lessonSlug);
      const idx1 = slugs.indexOf(dayRows[1].lessonSlug);
      assert.strictEqual(idx1, idx0 + 1);
    },
  );

  runCase("rowsForDate(rows, '2026-08-01')은 빈 배열이다", () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(
      slugs,
      SCHEDULE_START,
      SCHEDULE_SPAN_DAYS,
      DOUBLE_LESSON_DATES,
    );
    assert.deepStrictEqual(rowsForDate(rows, '2026-08-01'), []);
  });

  runCase(
    "firstRowAfter(rows, '2026-08-29').date === '2026-08-30' — 같은 날짜의 두 번째 행이 아니라 다음 날짜의 첫 행을 돌려준다",
    () => {
      const slugs = makeSlugs(35);
      const rows = buildSchedule(
        slugs,
        SCHEDULE_START,
        SCHEDULE_SPAN_DAYS,
        DOUBLE_LESSON_DATES,
      );
      const result = firstRowAfter(rows, '2026-08-29');
      assert.strictEqual(result.date, '2026-08-30');
    },
  );

  runCase("firstRowAfter(rows, '2026-09-28')가 9/29 버퍼 행이다", () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(
      slugs,
      SCHEDULE_START,
      SCHEDULE_SPAN_DAYS,
      DOUBLE_LESSON_DATES,
    );
    const result = firstRowAfter(rows, '2026-09-28');
    assert.strictEqual(result.date, '2026-09-29');
    assert.strictEqual(result.isBuffer, true);
  });

  runCase("firstRowAfter(rows, '2026-09-29')가 null이다", () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(
      slugs,
      SCHEDULE_START,
      SCHEDULE_SPAN_DAYS,
      DOUBLE_LESSON_DATES,
    );
    assert.strictEqual(firstRowAfter(rows, '2026-09-29'), null);
  });

  // --- daysUntil (schedule 관련) ---

  runCase('daysUntil(2026-09-30, SCHEDULE_START) === 33', () => {
    assert.strictEqual(daysUntil('2026-09-30', SCHEDULE_START), 33);
  });

  // --- todayInSeoul ---

  runCase('todayInSeoul(2026-08-24T14:59:59Z) -> 2026-08-24', () => {
    assert.strictEqual(todayInSeoul(new Date('2026-08-24T14:59:59Z')), '2026-08-24');
  });

  runCase('todayInSeoul(2026-08-24T15:00:00Z) -> 2026-08-25 (KST 자정 경계)', () => {
    assert.strictEqual(todayInSeoul(new Date('2026-08-24T15:00:00Z')), '2026-08-25');
  });

  runCase('todayInSeoul(2026-12-31T15:00:00Z) -> 2027-01-01 (연 경계)', () => {
    assert.strictEqual(todayInSeoul(new Date('2026-12-31T15:00:00Z')), '2027-01-01');
  });

  runCase('todayInSeoul(인자 생략) -> 예외 없이 YYYY-MM-DD 형태', () => {
    const result = todayInSeoul();
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  // --- daysUntil ---

  runCase('daysUntil(2026-09-30, 2026-08-25) -> 36', () => {
    assert.strictEqual(daysUntil('2026-09-30', '2026-08-25'), 36);
  });

  runCase('daysUntil(2026-09-30, 2026-09-29) -> 1', () => {
    assert.strictEqual(daysUntil('2026-09-30', '2026-09-29'), 1);
  });

  runCase('daysUntil(같은 날) -> 0', () => {
    assert.strictEqual(daysUntil('2026-09-30', '2026-09-30'), 0);
  });

  runCase('daysUntil(2026-09-30, 2026-10-01) -> -1', () => {
    assert.strictEqual(daysUntil('2026-09-30', '2026-10-01'), -1);
  });

  if (failures.length > 0) {
    console.error(`check-schedule: ${failures.length}/${caseCount}개 케이스 실패:\n`);
    for (const f of failures) {
      console.error(`  - ${f}`);
    }
    process.exit(1);
  }

  console.log(`check-schedule: ${caseCount}개 케이스 모두 통과`);
  process.exit(0);
}

main().catch((e) => {
  console.error(`check-schedule: 실행 중 오류 — ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
