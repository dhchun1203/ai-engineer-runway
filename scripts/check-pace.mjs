#!/usr/bin/env node
// src/lib/pace.ts(computePace, computeAheadDetail, catchUpDays)의 경계값을 node:assert로 직접
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
  const { computePace, catchUpDays, computeAheadDetail, computeProjection } = await import(
    pathToFileURL(PACE_PATH).href
  );

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

  // --- 중복 날짜(2레슨 날) 케이스 — DD-1의 "pace.ts는 중복 날짜를 이미 견딘다"는
  // 주장을 실행 증거로 못박는다. 날짜 문자열은 SCHEDULE_START를 읽지 않는 자기완결
  // 픽스처이므로 기존 케이스와 무관한 값을 자유롭게 쓴다. ---

  runCase(
    '같은 날짜 2행이 모두 과거이고 둘 다 미완료 -> behind, gapMinutes=두 레슨 분의 합, missedSlugs=두 slug를 rows 순서대로',
    () => {
      const rows = [
        { date: '2026-08-29', lessonSlug: 'l1' },
        { date: '2026-08-29', lessonSlug: 'l2' },
      ];
      const minutesBySlug = new Map([
        ['l1', 60],
        ['l2', 90],
      ]);
      const result = computePace(rows, minutesBySlug, new Set(), '2026-08-30');
      assert.deepStrictEqual(result, { status: 'behind', gapMinutes: 150, missedSlugs: ['l1', 'l2'] });
    },
  );

  runCase(
    '같은 날짜 2행이 모두 과거이고 하나만 완료 -> behind, gapMinutes=미완료 1건의 분, missedSlugs=그 1건만(완료한 쪽이 미완료를 가리지 않는다)',
    () => {
      const rows = [
        { date: '2026-08-29', lessonSlug: 'l1' },
        { date: '2026-08-29', lessonSlug: 'l2' },
      ];
      const minutesBySlug = new Map([
        ['l1', 60],
        ['l2', 90],
      ]);
      const completedIds = new Set(['l1']);
      const result = computePace(rows, minutesBySlug, completedIds, '2026-08-30');
      assert.deepStrictEqual(result, { status: 'behind', gapMinutes: 90, missedSlugs: ['l2'] });
    },
  );

  runCase(
    '같은 날짜 2행이 오늘 날짜이고 둘 다 미완료 -> on-track(어제까지 배정분 0), missedSlugs 빈 배열(오늘 배정분이 밀린 것으로 잡히지 않는다)',
    () => {
      const rows = [
        { date: '2026-08-29', lessonSlug: 'l1' },
        { date: '2026-08-29', lessonSlug: 'l2' },
      ];
      const minutesBySlug = new Map([
        ['l1', 60],
        ['l2', 90],
      ]);
      const result = computePace(rows, minutesBySlug, new Set(), '2026-08-29');
      assert.deepStrictEqual(result, { status: 'on-track', gapMinutes: 0, missedSlugs: [] });
    },
  );

  runCase(
    '같은 날짜 2행 중 하나가 오늘·미래 배정인데 미리 완료 -> 어제까지 배정분의 미완료를 가리지 않고 behind로 판정된다(Pitfall 3, 중복 날짜에서도 재현 안 됨)',
    () => {
      const rows = [
        { date: '2026-08-27', lessonSlug: 'l0' }, // 어제까지 배정, 미완료
        { date: '2026-08-29', lessonSlug: 'l1' }, // 오늘 배정
        { date: '2026-08-29', lessonSlug: 'l2' }, // 오늘 배정, 미리 완료
      ];
      const minutesBySlug = new Map([
        ['l0', 60],
        ['l1', 90],
        ['l2', 120],
      ]);
      const completedIds = new Set(['l2']);
      const result = computePace(rows, minutesBySlug, completedIds, '2026-08-29');
      assert.deepStrictEqual(result, { status: 'behind', gapMinutes: 60, missedSlugs: ['l0'] });
    },
  );

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

  // --- computeAheadDetail (앞선 정도의 "얼마나") ---

  runCase('앞선 것 없음 -> 전부 0/null', () => {
    const rows = [
      { date: '2026-08-28', lessonSlug: 'l1' },
      { date: '2026-08-29', lessonSlug: 'l2' },
    ];
    const m = new Map([['l1', 60], ['l2', 90]]);
    const r = computeAheadDetail(rows, m, new Set(['l1']), '2026-08-29');
    assert.deepStrictEqual(r, { lessonCount: 0, minutes: 0, throughDate: null, daysAhead: 0 });
  });

  runCase('오늘 몫만 완료 -> lessonCount 1, daysAhead 0 (예정대로 한 것은 앞선 것이 아니다)', () => {
    const rows = [
      { date: '2026-08-28', lessonSlug: 'l1' },
      { date: '2026-08-29', lessonSlug: 'l2' },
    ];
    const m = new Map([['l1', 60], ['l2', 90]]);
    const r = computeAheadDetail(rows, m, new Set(['l1', 'l2']), '2026-08-29');
    assert.deepStrictEqual(r, {
      lessonCount: 1,
      minutes: 90,
      throughDate: '2026-08-29',
      daysAhead: 0,
    });
  });

  runCase('내일·모레 몫까지 완료 -> daysAhead 2, 분 합계 누적', () => {
    const rows = [
      { date: '2026-08-29', lessonSlug: 'l1' },
      { date: '2026-08-30', lessonSlug: 'l2' },
      { date: '2026-08-31', lessonSlug: 'l3' },
    ];
    const m = new Map([['l1', 60], ['l2', 90], ['l3', 150]]);
    const r = computeAheadDetail(rows, m, new Set(['l1', 'l2', 'l3']), '2026-08-29');
    assert.deepStrictEqual(r, {
      lessonCount: 3,
      minutes: 300,
      throughDate: '2026-08-31',
      daysAhead: 2,
    });
  });

  runCase('같은 날 2레슨을 미리 완료 -> daysAhead는 날짜 기준이라 1', () => {
    const rows = [
      { date: '2026-08-29', lessonSlug: 'l1' },
      { date: '2026-08-30', lessonSlug: 'l2' },
      { date: '2026-08-30', lessonSlug: 'l3' },
    ];
    const m = new Map([['l1', 60], ['l2', 90], ['l3', 90]]);
    const r = computeAheadDetail(rows, m, new Set(['l2', 'l3']), '2026-08-29');
    assert.strictEqual(r.lessonCount, 2);
    assert.strictEqual(r.minutes, 180);
    assert.strictEqual(r.daysAhead, 1);
    assert.strictEqual(r.throughDate, '2026-08-30');
  });

  runCase('버퍼일(lessonSlug null)은 어느 집계에도 들어가지 않는다', () => {
    const rows = [
      { date: '2026-08-29', lessonSlug: null },
      { date: '2026-08-30', lessonSlug: 'l1' },
    ];
    const m = new Map([['l1', 60]]);
    const r = computeAheadDetail(rows, m, new Set(['l1']), '2026-08-29');
    assert.deepStrictEqual(r, {
      lessonCount: 1,
      minutes: 60,
      throughDate: '2026-08-30',
      daysAhead: 1,
    });
  });

  runCase('minutesBySlug에 없는 slug는 0분으로 취급하고 던지지 않는다', () => {
    const rows = [{ date: '2026-08-30', lessonSlug: 'unknown' }];
    const r = computeAheadDetail(rows, new Map(), new Set(['unknown']), '2026-08-29');
    assert.strictEqual(r.lessonCount, 1);
    assert.strictEqual(r.minutes, 0);
    assert.strictEqual(r.daysAhead, 1);
  });

  runCase('어제 완료분은 앞선 것으로 세지 않는다', () => {
    const rows = [
      { date: '2026-08-27', lessonSlug: 'l1' },
      { date: '2026-08-28', lessonSlug: 'l2' },
    ];
    const m = new Map([['l1', 60], ['l2', 60]]);
    const r = computeAheadDetail(rows, m, new Set(['l1', 'l2']), '2026-08-29');
    assert.deepStrictEqual(r, { lessonCount: 0, minutes: 0, throughDate: null, daysAhead: 0 });
  });

  // --- computeProjection (완료 예측일) ---

  runCase('완료 0개 -> show:false, remainingCount만 채워진다', () => {
    const rows = [
      { date: '2026-08-30', lessonSlug: 'l1' },
      { date: '2026-08-31', lessonSlug: 'l2' },
      { date: '2026-09-01', lessonSlug: 'l3' },
    ];
    const r = computeProjection(rows, new Set(), '2026-08-30', '2026-08-28');
    assert.deepStrictEqual(r, { show: false, projectedFinish: null, remainingCount: 3 });
  });

  runCase('경과일 부족(elapsedDays=1) -> show:false', () => {
    const rows = [
      { date: '2026-08-28', lessonSlug: 'l1' },
      { date: '2026-08-29', lessonSlug: 'l2' },
    ];
    const r = computeProjection(rows, new Set(['l1']), '2026-08-28', '2026-08-28');
    assert.deepStrictEqual(r, { show: false, projectedFinish: null, remainingCount: 1 });
  });

  runCase('시작 전(today < scheduleStart, elapsedDays=0) -> show:false', () => {
    const rows = [
      { date: '2026-08-28', lessonSlug: 'l1' },
      { date: '2026-08-29', lessonSlug: 'l2' },
    ];
    const r = computeProjection(rows, new Set(['l1']), '2026-08-27', '2026-08-28');
    assert.deepStrictEqual(r, { show: false, projectedFinish: null, remainingCount: 1 });
  });

  runCase('behind 프록시(pastDueIncomplete>0) -> show:false', () => {
    const rows = [
      { date: '2026-08-28', lessonSlug: 'l1' },
      { date: '2026-08-29', lessonSlug: 'l2' },
      { date: '2026-09-01', lessonSlug: 'l3' },
    ];
    const r = computeProjection(rows, new Set(['l2']), '2026-08-31', '2026-08-28');
    assert.deepStrictEqual(r, { show: false, projectedFinish: null, remainingCount: 2 });
  });

  runCase('정상 예측 A(딱 떨어짐) -> show:true, projectedFinish 2026-09-06', () => {
    const rows = [
      { date: '2026-08-28', lessonSlug: 'l1' },
      { date: '2026-08-29', lessonSlug: 'l2' },
      { date: '2026-08-30', lessonSlug: 'l3' },
      { date: '2026-08-31', lessonSlug: 'l4' },
      { date: '2026-09-01', lessonSlug: 'l5' },
      { date: '2026-09-02', lessonSlug: 'l6' },
      { date: '2026-09-03', lessonSlug: 'l7' },
      { date: '2026-09-04', lessonSlug: 'l8' },
      { date: '2026-09-05', lessonSlug: 'l9' },
      { date: '2026-09-06', lessonSlug: 'l10' },
    ];
    const completedIds = new Set(['l1', 'l2', 'l3', 'l4', 'l5']);
    const r = computeProjection(rows, completedIds, '2026-09-01', '2026-08-28');
    assert.deepStrictEqual(r, { show: true, projectedFinish: '2026-09-06', remainingCount: 5 });
  });

  runCase('정상 예측 B(ceil 올림) -> show:true, projectedFinish 2026-09-04', () => {
    const rows = [
      { date: '2026-08-28', lessonSlug: 'l1' },
      { date: '2026-08-29', lessonSlug: 'l2' },
      { date: '2026-08-30', lessonSlug: 'l3' },
      { date: '2026-08-31', lessonSlug: 'l4' },
      { date: '2026-09-01', lessonSlug: 'l5' },
    ];
    const completedIds = new Set(['l1', 'l2']);
    const r = computeProjection(rows, completedIds, '2026-08-30', '2026-08-28');
    assert.deepStrictEqual(r, { show: true, projectedFinish: '2026-09-04', remainingCount: 3 });
  });

  runCase('남은 0개(전부 완료) -> show:false, remainingCount 0', () => {
    const rows = [
      { date: '2026-08-28', lessonSlug: 'l1' },
      { date: '2026-08-29', lessonSlug: 'l2' },
      { date: '2026-08-30', lessonSlug: 'l3' },
    ];
    const completedIds = new Set(['l1', 'l2', 'l3']);
    const r = computeProjection(rows, completedIds, '2026-08-31', '2026-08-28');
    assert.deepStrictEqual(r, { show: false, projectedFinish: null, remainingCount: 0 });
  });

  runCase('개강 훨씬 이후 today, 미완료가 밀려 있음 -> show:false(늦은 예측 안 냄)', () => {
    const rows = [
      { date: '2026-08-28', lessonSlug: 'l1' },
      { date: '2026-09-28', lessonSlug: 'l2' },
    ];
    const r = computeProjection(rows, new Set(['l1']), '2026-10-15', '2026-08-28');
    assert.deepStrictEqual(r, { show: false, projectedFinish: null, remainingCount: 1 });
  });

  runCase('호출 후 입력 rows 배열·completedIds Set이 변형되지 않는다', () => {
    const rows = [
      { date: '2026-08-28', lessonSlug: 'l1' },
      { date: '2026-08-29', lessonSlug: 'l2' },
      { date: '2026-08-30', lessonSlug: 'l3' },
      { date: '2026-08-31', lessonSlug: 'l4' },
      { date: '2026-09-01', lessonSlug: 'l5' },
      { date: '2026-09-02', lessonSlug: 'l6' },
      { date: '2026-09-03', lessonSlug: 'l7' },
      { date: '2026-09-04', lessonSlug: 'l8' },
      { date: '2026-09-05', lessonSlug: 'l9' },
      { date: '2026-09-06', lessonSlug: 'l10' },
    ];
    const completedIds = new Set(['l1', 'l2', 'l3', 'l4', 'l5']);

    const rowsSnapshot = rows.map((r) => ({ ...r }));
    const completedSnapshot = new Set(completedIds);

    computeProjection(rows, completedIds, '2026-09-01', '2026-08-28');

    assert.deepStrictEqual(rows, rowsSnapshot, 'computeProjection이 입력 rows 배열을 변형했습니다');
    assert.deepStrictEqual(
      completedIds,
      completedSnapshot,
      'computeProjection이 입력 completedIds Set을 변형했습니다',
    );
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
