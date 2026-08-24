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
  const { buildSchedule, scheduleTotalDays } = await import(pathToFileURL(SCHEDULE_PATH).href);
  const { todayInSeoul, daysUntil } = await import(pathToFileURL(TODAY_PATH).href);

  // --- buildSchedule ---

  runCase('buildSchedule(빈 slug 배열, totalDays 1) -> 버퍼 1행만', () => {
    const rows = buildSchedule([], '2026-08-25', 1);
    assert.strictEqual(rows.length, 1);
    assert.deepStrictEqual(rows[0], { date: '2026-08-25', lessonSlug: null, isBuffer: true });
  });

  runCase('buildSchedule(35개 slug, scheduleTotalDays(35)) -> 정확히 36행', () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(slugs, '2026-08-25', scheduleTotalDays(35));
    assert.strictEqual(rows.length, 36);
  });

  runCase('buildSchedule 첫 행 date가 2026-08-25', () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(slugs, '2026-08-25', scheduleTotalDays(35));
    assert.strictEqual(rows[0].date, '2026-08-25');
  });

  runCase('buildSchedule 인덱스 34행(35번째) date가 2026-09-28이고 lessonSlug가 입력 35번째 원소', () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(slugs, '2026-08-25', scheduleTotalDays(35));
    assert.strictEqual(rows[34].date, '2026-09-28');
    assert.strictEqual(rows[34].lessonSlug, slugs[34]);
    assert.strictEqual(rows[34].isBuffer, false);
  });

  runCase('buildSchedule 인덱스 35행(36번째) date가 2026-09-29이고 lessonSlug null, isBuffer true', () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(slugs, '2026-08-25', scheduleTotalDays(35));
    assert.strictEqual(rows[35].date, '2026-09-29');
    assert.strictEqual(rows[35].lessonSlug, null);
    assert.strictEqual(rows[35].isBuffer, true);
  });

  runCase('buildSchedule 36개 date가 전부 유일하고 문자열 오름차순', () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(slugs, '2026-08-25', scheduleTotalDays(35));
    const dates = rows.map((r) => r.date);
    assert.strictEqual(new Set(dates).size, dates.length, 'date 중복 발견');
    const sorted = [...dates].sort();
    assert.deepStrictEqual(dates, sorted, 'date가 오름차순이 아님');
  });

  runCase('buildSchedule 2026-08-25보다 작은 date가 0건이고 2026-09-29보다 큰 date가 0건', () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(slugs, '2026-08-25', scheduleTotalDays(35));
    const belowStart = rows.filter((r) => r.date < '2026-08-25');
    const aboveEnd = rows.filter((r) => r.date > '2026-09-29');
    assert.strictEqual(belowStart.length, 0);
    assert.strictEqual(aboveEnd.length, 0);
  });

  runCase('buildSchedule 월 경계: 2026-08-31 바로 다음 행이 2026-09-01', () => {
    const slugs = makeSlugs(35);
    const rows = buildSchedule(slugs, '2026-08-25', scheduleTotalDays(35));
    const idx = rows.findIndex((r) => r.date === '2026-08-31');
    assert.notStrictEqual(idx, -1, '2026-08-31 행을 찾지 못함');
    assert.strictEqual(rows[idx + 1].date, '2026-09-01');
  });

  runCase('buildSchedule 호출 후 입력 배열이 변형되지 않음', () => {
    const slugs = makeSlugs(35);
    const snapshot = [...slugs];
    buildSchedule(slugs, '2026-08-25', scheduleTotalDays(35));
    assert.deepStrictEqual(slugs, snapshot);
  });

  // --- scheduleTotalDays ---

  runCase('scheduleTotalDays(35) -> 36', () => {
    assert.strictEqual(scheduleTotalDays(35), 36);
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
