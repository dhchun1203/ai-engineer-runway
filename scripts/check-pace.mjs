#!/usr/bin/env node
// src/lib/pace.ts(computePace, catchUpDays)의 3분기 경계값을 node:assert로 직접
// 실행 검증하는 게이트. 외부 의존성 0, 새 devDependency 추가 없음. pace.ts는
// import를 쓰지 않으므로 Node가 별도 러너 없이 그대로 로드한다(Node 22.6+ 타입
// 스트리핑, check-progress-math.mjs/check-schedule.mjs와 같은 원리). 실제
// 매니페스트를 읽지 않는다 — 전부 더미 데이터.

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PACE_PATH = path.join(ROOT, 'src', 'lib', 'pace.ts');

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

async function main() {
  const { computePace, catchUpDays } = await import(pathToFileURL(PACE_PATH).href);

  // --- computePace ---

  runCase('첫날(오늘=2026-08-25), 완료 0건 -> on-track (어제까지 배정분이 0)', () => {
    const rows = [{ date: '2026-08-25', lessonSlug: 'l1' }];
    const minutesBySlug = new Map([['l1', 60]]);
    const result = computePace(rows, minutesBySlug, new Set(), '2026-08-25');
    assert.deepStrictEqual(result, { status: 'on-track', gapMinutes: 0, missedSlugs: [] });
  });

  runCase('어제까지 배정 3건 전부 완료 -> on-track, gapMinutes 0, missedSlugs 빈 배열', () => {
    const rows = [
      { date: '2026-08-25', lessonSlug: 'l1' },
      { date: '2026-08-26', lessonSlug: 'l2' },
      { date: '2026-08-27', lessonSlug: 'l3' },
    ];
    const minutesBySlug = new Map([
      ['l1', 60],
      ['l2', 90],
      ['l3', 150],
    ]);
    const completedIds = new Set(['l1', 'l2', 'l3']);
    const result = computePace(rows, minutesBySlug, completedIds, '2026-08-28');
    assert.deepStrictEqual(result, { status: 'on-track', gapMinutes: 0, missedSlugs: [] });
  });

  runCase('어제까지 배정 3건 중 1건만 완료 -> behind, gapMinutes=미완료 2건 합, missedSlugs=날짜 오름차순', () => {
    const rows = [
      { date: '2026-08-25', lessonSlug: 'l1' },
      { date: '2026-08-26', lessonSlug: 'l2' },
      { date: '2026-08-27', lessonSlug: 'l3' },
    ];
    const minutesBySlug = new Map([
      ['l1', 60],
      ['l2', 90],
      ['l3', 150],
    ]);
    const completedIds = new Set(['l1']);
    const result = computePace(rows, minutesBySlug, completedIds, '2026-08-28');
    assert.deepStrictEqual(result, { status: 'behind', gapMinutes: 240, missedSlugs: ['l2', 'l3'] });
  });

  runCase('어제까지 배정 전부 완료 + 오늘 배정도 완료 -> ahead, gapMinutes 0, missedSlugs 빈 배열', () => {
    const rows = [
      { date: '2026-08-25', lessonSlug: 'l1' },
      { date: '2026-08-26', lessonSlug: 'l2' },
      { date: '2026-08-27', lessonSlug: 'l3' },
      { date: '2026-08-28', lessonSlug: 'l4' }, // 오늘 배정
    ];
    const minutesBySlug = new Map([
      ['l1', 60],
      ['l2', 60],
      ['l3', 60],
      ['l4', 60],
    ]);
    const completedIds = new Set(['l1', 'l2', 'l3', 'l4']);
    const result = computePace(rows, minutesBySlug, completedIds, '2026-08-28');
    assert.deepStrictEqual(result, { status: 'ahead', gapMinutes: 0, missedSlugs: [] });
  });

  runCase('미래 레슨 선완료 + 어제까지 미완료 -> behind (Pitfall 3 오판 경로)', () => {
    const rows = [
      { date: '2026-08-25', lessonSlug: 'l1' }, // 어제까지 배정, 미완료
      { date: '2026-08-27', lessonSlug: 'l2' }, // 미래 배정, 미리 완료
    ];
    const minutesBySlug = new Map([
      ['l1', 60],
      ['l2', 150],
    ]);
    const completedIds = new Set(['l2']); // l1(어제까지 배정)은 미완료, l2(미래)만 완료
    const result = computePace(rows, minutesBySlug, completedIds, '2026-08-26');
    assert.deepStrictEqual(result, { status: 'behind', gapMinutes: 60, missedSlugs: ['l1'] });
  });

  runCase('버퍼일(lessonSlug=null) 행은 배정 합계·완료 합계·missedSlugs 어디에도 들어가지 않는다', () => {
    const rows = [
      { date: '2026-08-25', lessonSlug: 'l1' },
      { date: '2026-08-26', lessonSlug: null }, // 버퍼일
      { date: '2026-08-27', lessonSlug: 'l2' },
    ];
    const minutesBySlug = new Map([
      ['l1', 60],
      ['l2', 90],
    ]);
    const completedIds = new Set(['l1']);
    const result = computePace(rows, minutesBySlug, completedIds, '2026-08-28');
    assert.deepStrictEqual(result, { status: 'behind', gapMinutes: 90, missedSlugs: ['l2'] });
  });

  runCase('minutesBySlug에 없는 slug는 0분 취급, 예외를 던지지 않는다', () => {
    const rows = [{ date: '2026-08-25', lessonSlug: 'unknown-slug' }];
    const minutesBySlug = new Map();
    const result = computePace(rows, minutesBySlug, new Set(), '2026-08-26');
    assert.deepStrictEqual(result, { status: 'on-track', gapMinutes: 0, missedSlugs: [] });
  });

  runCase('minutesBySlug에 없는 slug가 미완료여도 0분이라 behind를 만들지 않는다', () => {
    const rows = [{ date: '2026-08-25', lessonSlug: 'unknown-slug' }];
    const minutesBySlug = new Map();
    const result = computePace(rows, minutesBySlug, new Set(), '2026-08-27');
    assert.strictEqual(result.status, 'on-track');
    assert.strictEqual(result.gapMinutes, 0);
  });

  runCase('오늘이 2026-09-30 이후(모든 행이 과거)여도 정상 동작 — 전부 완료', () => {
    const rows = [
      { date: '2026-08-25', lessonSlug: 'l1' },
      { date: '2026-09-28', lessonSlug: 'l2' },
      { date: '2026-09-29', lessonSlug: null }, // 버퍼일
    ];
    const minutesBySlug = new Map([
      ['l1', 60],
      ['l2', 90],
    ]);
    const completedIds = new Set(['l1', 'l2']);
    const result = computePace(rows, minutesBySlug, completedIds, '2026-10-15');
    assert.deepStrictEqual(result, { status: 'on-track', gapMinutes: 0, missedSlugs: [] });
  });

  runCase('오늘이 2026-09-30 이후여도 미완료가 있으면 behind로 정상 판정', () => {
    const rows = [
      { date: '2026-08-25', lessonSlug: 'l1' },
      { date: '2026-09-28', lessonSlug: 'l2' },
    ];
    const minutesBySlug = new Map([
      ['l1', 60],
      ['l2', 90],
    ]);
    const completedIds = new Set(['l1']);
    const result = computePace(rows, minutesBySlug, completedIds, '2026-10-15');
    assert.deepStrictEqual(result, { status: 'behind', gapMinutes: 90, missedSlugs: ['l2'] });
  });

  runCase('완료 집합이 비어 있고 배정도 없는 빈 rows -> on-track', () => {
    const result = computePace([], new Map(), new Set(), '2026-08-25');
    assert.deepStrictEqual(result, { status: 'on-track', gapMinutes: 0, missedSlugs: [] });
  });

  runCase('호출 후 입력 rows 배열·minutesBySlug Map·completedIds Set이 변형되지 않는다', () => {
    const rows = [
      { date: '2026-08-25', lessonSlug: 'l1' },
      { date: '2026-08-26', lessonSlug: 'l2' },
    ];
    const minutesBySlug = new Map([
      ['l1', 60],
      ['l2', 90],
    ]);
    const completedIds = new Set(['l1']);

    const rowsSnapshot = rows.map((r) => ({ ...r }));
    const minutesSnapshot = new Map(minutesBySlug);
    const completedSnapshot = new Set(completedIds);

    computePace(rows, minutesBySlug, completedIds, '2026-08-27');

    assert.deepStrictEqual(rows, rowsSnapshot, 'computePace가 입력 rows 배열을 변형했습니다');
    assert.deepStrictEqual(minutesBySlug, minutesSnapshot, 'computePace가 입력 minutesBySlug Map을 변형했습니다');
    assert.deepStrictEqual(completedIds, completedSnapshot, 'computePace가 입력 completedIds Set을 변형했습니다');
  });

  // --- catchUpDays ---

  runCase('catchUpDays(0) -> 0', () => {
    assert.strictEqual(catchUpDays(0), 0);
  });

  runCase('catchUpDays(음수) -> 0', () => {
    assert.strictEqual(catchUpDays(-30), 0);
  });

  runCase('catchUpDays(1) -> 1', () => {
    assert.strictEqual(catchUpDays(1), 1);
  });

  runCase('catchUpDays(30) -> 1', () => {
    assert.strictEqual(catchUpDays(30), 1);
  });

  runCase('catchUpDays(150) -> 5', () => {
    assert.strictEqual(catchUpDays(150), 5);
  });

  runCase('catchUpDays(151) -> 6', () => {
    assert.strictEqual(catchUpDays(151), 6);
  });

  if (failures.length > 0) {
    console.error(`check-pace: ${failures.length}/${caseCount}개 케이스 실패:\n`);
    for (const f of failures) {
      console.error(`  - ${f}`);
    }
    process.exit(1);
  }

  console.log(`check-pace: ${caseCount}개 케이스 모두 통과`);
  process.exit(0);
}

main().catch((e) => {
  console.error(`check-pace: 실행 중 오류 — ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
