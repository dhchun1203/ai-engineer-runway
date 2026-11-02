#!/usr/bin/env node
// src/lib/til/streak-logic.ts(TIL 잔디 순수 계산)의 경계값을 node:assert로 직접 실행 검증하는
// 게이트. check-class.mjs와 같은 형식(의존성 0, Node 타입 스트리핑으로 그대로 로드).

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGIC_PATH = path.join(__dirname, '..', 'src', 'lib', 'til', 'streak-logic.ts');

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

const { addDays, buildWeeks, computeStats, formatDayKo, monthLabels } = await import(pathToFileURL(LOGIC_PATH).href);

// 2026-11-02는 월요일, 2026-10-26도 월요일이다.
const RECORDS = ['2026-09-10', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-11-02'];

// --- buildWeeks ---
runCase('달력: 모든 열이 월요일에 시작', () => {
  for (const today of ['2026-11-02', '2026-11-04', '2026-11-08']) {
    for (const week of buildWeeks([], today, 14)) {
      assert.equal(new Date(`${week[0].date}T00:00:00Z`).getUTCDay(), 1);
      assert.equal(week.length, 7);
    }
  }
});
runCase('달력: 월요일이 오늘이면 마지막 열은 월요일만 지난 날', () => {
  const last = buildWeeks([], '2026-11-02', 14).at(-1);
  assert.equal(last[0].date, '2026-11-02');
  assert.equal(last[0].future, false);
  assert.ok(last.slice(1).every((d) => d.future));
});
runCase('달력: 일요일이 오늘이면 앞날이 없음', () => {
  const last = buildWeeks([], '2026-11-08', 14).at(-1);
  assert.equal(last[6].date, '2026-11-08');
  assert.ok(last.every((d) => !d.future));
});
runCase('달력: 같은 날 여러 편을 센다', () => {
  const week = buildWeeks(['2026-11-02', '2026-11-02'], '2026-11-02', 1)[0];
  assert.equal(week[0].count, 2);
});
runCase('달력: 달이 바뀌어도 날짜가 이어짐', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
});

// --- monthLabels ---
runCase('달 이름: 첫 열과 달이 바뀌는 열에만', () => {
  const labels = monthLabels(buildWeeks([], '2026-11-02', 14));
  assert.equal(labels[0], '8월');
  assert.deepEqual(labels.filter(Boolean), ['8월', '9월', '10월', '11월']);
  assert.equal(labels.at(-1), '11월');
});

// --- computeStats ---
runCase('연속: 주말을 건너 이어짐', () => {
  const s = computeStats(RECORDS, '2026-11-02');
  assert.equal(s.current, 6);
  assert.equal(s.longest, 6);
});
runCase('연속: 오늘 아직 안 써도 끊기지 않음', () => {
  assert.equal(computeStats(RECORDS, '2026-11-03').current, 6);
});
runCase('연속: 평일을 하루 비우면 끊김', () => {
  const s = computeStats(RECORDS, '2026-11-04');
  assert.equal(s.current, 0);
  assert.equal(s.longest, 6);
});
runCase('연속: 주말에 쓰면 더함', () => {
  assert.equal(computeStats(['2026-10-30', '2026-10-31', '2026-11-02'], '2026-11-02').current, 3);
});
runCase('연속: 토요일이 오늘이고 금요일까지 썼으면 유지', () => {
  assert.equal(computeStats(['2026-10-29', '2026-10-30'], '2026-10-31').current, 2);
});
runCase('연속: 기록이 없으면 0', () => {
  assert.deepEqual(computeStats([], '2026-11-02'), { current: 0, longest: 0, monthDays: 0, total: 0 });
});
runCase('집계: 이번 달은 날 수, 전체는 글 수', () => {
  const s = computeStats(['2026-11-02', '2026-11-02', '2026-10-30'], '2026-11-02');
  assert.equal(s.monthDays, 1);
  assert.equal(s.total, 3);
});
runCase('날짜 글자: 요일까지', () => {
  assert.equal(formatDayKo('2026-11-02'), '11월 2일 월요일');
});

if (failures.length > 0) {
  console.error(`check-til-streak: ${failures.length}/${caseCount}건 실패`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`check-til-streak: ${caseCount}건 통과`);
