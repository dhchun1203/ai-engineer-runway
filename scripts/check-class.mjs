#!/usr/bin/env node
// src/lib/class-logic.ts(수업 복습 순수 계산)의 경계값을 node:assert로 직접 실행 검증하는
// 게이트 — check-review.mjs와 같은 형식(의존성 0, class-logic.ts는 import가 없어 Node 타입
// 스트리핑으로 그대로 로드). 설계: docs/superpowers/specs/2026-10-27-class-data-structure-design.md

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGIC_PATH = path.join(__dirname, '..', 'src', 'lib', 'class-logic.ts');

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

const { seoulWeekRange, pickQuizRefs, matchesQuery, monthGrid, classReviewId, weekdayIndex } = await import(
  pathToFileURL(LOGIC_PATH).href
);

// --- seoulWeekRange: 월요일 시작, 일요일 끝 ---
runCase('주 범위: 화요일', () => {
  assert.deepEqual(seoulWeekRange('2026-10-27', 0), { start: '2026-10-26', end: '2026-11-01' });
});
runCase('주 범위: 월요일은 그 주의 시작', () => {
  assert.deepEqual(seoulWeekRange('2026-10-26', 0), { start: '2026-10-26', end: '2026-11-01' });
});
runCase('주 범위: 일요일은 그 주의 끝', () => {
  assert.deepEqual(seoulWeekRange('2026-11-01', 0), { start: '2026-10-26', end: '2026-11-01' });
});
runCase('주 범위: 지난주(-1), 월 경계', () => {
  assert.deepEqual(seoulWeekRange('2026-11-02', -1), { start: '2026-10-26', end: '2026-11-01' });
});
runCase('요일 번호: 월=0, 일=6', () => {
  assert.equal(weekdayIndex('2026-10-26'), 0);
  assert.equal(weekdayIndex('2026-11-01'), 6);
});

// --- pickQuizRefs: 틀림 → 안 푼 것 → 맞힘, 같은 seed면 같은 결과 ---
const refs = [
  { slug: 'a', id: 'q1' },
  { slug: 'a', id: 'q2' },
  { slug: 'a', id: 'q3' },
  { slug: 'b', id: 'q1' },
  { slug: 'b', id: 'q2' },
];
const attempts = new Map([
  ['cl:a:q1', 'right'],
  ['cl:b:q2', 'wrong'],
  ['cl:a:q3', 'right'],
]);
runCase('문항 고르기: 우선순위', () => {
  const picked = pickQuizRefs(refs, attempts, '2026-10-27', 10);
  assert.equal(picked.length, 5);
  assert.deepEqual(picked[0], { slug: 'b', id: 'q2' }); // 틀림이 맨 앞
  const unsolved = picked.slice(1, 3).map((r) => `${r.slug}:${r.id}`).sort();
  assert.deepEqual(unsolved, ['a:q2', 'b:q1']); // 다음은 안 푼 것
  const right = picked.slice(3).map((r) => `${r.slug}:${r.id}`).sort();
  assert.deepEqual(right, ['a:q1', 'a:q3']);
});
runCase('문항 고르기: 상한', () => {
  assert.equal(pickQuizRefs(refs, attempts, '2026-10-27', 2).length, 2);
});
runCase('문항 고르기: 결정성', () => {
  assert.deepEqual(pickQuizRefs(refs, new Map(), 's', 5), pickQuizRefs(refs, new Map(), 's', 5));
});
runCase('문항 고르기: 원본을 바꾸지 않음', () => {
  const copy = refs.map((r) => ({ ...r }));
  pickQuizRefs(refs, attempts, 'x', 3);
  assert.deepEqual(refs, copy);
});

// --- matchesQuery ---
runCase('검색: 빈 질의는 모두 통과', () => {
  assert.equal(matchesQuery('아무 글', ''), true);
  assert.equal(matchesQuery('아무 글', '   '), true);
});
runCase('검색: 낱말이 모두 있어야', () => {
  assert.equal(matchesQuery('git checkout 으로 HEAD 옮기기', 'checkout head'), true);
  assert.equal(matchesQuery('git checkout 으로 HEAD 옮기기', 'checkout vim'), false);
});
runCase('검색: 대소문자 무시', () => {
  assert.equal(matchesQuery('Detached HEAD', 'detached'), true);
});

// --- monthGrid: 월요일 시작, 주 단위 ---
runCase('달력: 2026년 10월', () => {
  const grid = monthGrid(2026, 10);
  assert.equal(grid[0][0].date, '2026-09-28'); // 10/1은 목요일 → 그 주 월요일
  assert.equal(grid[0][0].inMonth, false);
  assert.equal(grid[0][3].date, '2026-10-01');
  assert.equal(grid[0][3].inMonth, true);
  assert.ok(grid.every((week) => week.length === 7));
  const last = grid[grid.length - 1];
  assert.equal(last[6].date, '2026-11-01'); // 10/31 토요일 → 그 주 일요일까지
  assert.equal(grid.length, 5);
});
runCase('달력: 2026년 2월(1일이 일요일)', () => {
  const grid = monthGrid(2026, 2);
  assert.equal(grid[0][0].date, '2026-01-26');
  assert.equal(grid[0][6].date, '2026-02-01');
  assert.equal(grid.flat().filter((c) => c.inMonth).length, 28);
  assert.equal(grid[grid.length - 1][6].date, '2026-03-01');
});

runCase('복습 상태 id', () => {
  assert.equal(classReviewId('02-git-setup-remote'), 'class:02-git-setup-remote');
});

if (failures.length > 0) {
  console.error(`check-class: ${failures.length}/${caseCount} 실패`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`check-class: ${caseCount}개 모두 통과`);
