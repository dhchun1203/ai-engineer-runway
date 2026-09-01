#!/usr/bin/env node
// src/lib/review.ts(computeDueLessons, nextDueDate, addDays)의 경계값을
// node:assert로 직접 실행 검증하는 게이트 — check-pace.mjs와 같은 형식(의존성 0,
// review.ts는 import가 없어 Node 타입 스트리핑으로 그대로 로드).
//
// 추가로 SELF_CHECK_ANCHOR가 빌드 산출물의 실제 헤딩 id와 일치하는지 대조한다 —
// rehype-slug 설정이나 헤딩 문구가 바뀌어 앵커가 조용히 깨지는 회귀를 잡는다
// (.velite가 없으면 이 검사만 skip — 정적 검사는 항상 돈다).

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REVIEW_PATH = path.join(ROOT, 'src', 'lib', 'review.ts');
const VELITE_LESSONS = path.join(ROOT, '.velite', 'lessons.json');

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
  const { computeDueLessons, nextDueDate, addDays, REVIEW_INTERVALS_DAYS, GRADUATE_COUNT, SELF_CHECK_ANCHOR } =
    await import(pathToFileURL(REVIEW_PATH).href);

  // --- addDays: 월말·연말 경계 ---
  runCase('addDays 월말 경계 (8/31 +1 = 9/1)', () => {
    assert.equal(addDays('2026-08-31', 1), '2026-09-01');
  });
  runCase('addDays 연말 경계 (12/31 +3 = 1/3)', () => {
    assert.equal(addDays('2026-12-31', 3), '2027-01-03');
  });

  // --- computeDueLessons ---
  runCase('완료 당일은 만기 아님 (간격 1일)', () => {
    const completed = new Map([['l1', '2026-09-01']]);
    const due = computeDueLessons(completed, new Map(), '2026-09-01');
    assert.deepStrictEqual(due, []);
  });
  runCase('완료 +1일이 첫 만기', () => {
    const completed = new Map([['l1', '2026-09-01']]);
    const due = computeDueLessons(completed, new Map(), '2026-09-02');
    assert.deepStrictEqual(due, [{ lessonSlug: 'l1', rung: 1, dueDate: '2026-09-02' }]);
  });
  runCase('만기 지난 것도 계속 만기 (밀린 복습)', () => {
    const completed = new Map([['l1', '2026-09-01']]);
    const due = computeDueLessons(completed, new Map(), '2026-09-05');
    assert.equal(due.length, 1);
    assert.equal(due[0].dueDate, '2026-09-02');
  });
  runCase('1회 복습 후에는 직전 복습일 +3일이 만기 (완료일 고정 오프셋 아님)', () => {
    const completed = new Map([['l1', '2026-09-01']]);
    const states = new Map([['l1', { reviewCount: 1, lastReviewedDate: '2026-09-05' }]]);
    assert.deepStrictEqual(computeDueLessons(completed, states, '2026-09-07'), []);
    assert.deepStrictEqual(computeDueLessons(completed, states, '2026-09-08'), [
      { lessonSlug: 'l1', rung: 2, dueDate: '2026-09-08' },
    ]);
  });
  runCase(`졸업(${GRADUATE_COUNT}회)한 레슨은 다시 안 나옴`, () => {
    const completed = new Map([['l1', '2026-09-01']]);
    const states = new Map([['l1', { reviewCount: GRADUATE_COUNT, lastReviewedDate: '2026-09-10' }]]);
    assert.deepStrictEqual(computeDueLessons(completed, states, '2026-12-31'), []);
  });
  runCase('완료 취소된 레슨(completed 맵에 없음)은 복습 이력이 있어도 안 나옴', () => {
    const states = new Map([['gone', { reviewCount: 1, lastReviewedDate: '2026-09-01' }]]);
    assert.deepStrictEqual(computeDueLessons(new Map(), states, '2026-09-30'), []);
  });
  runCase('정렬: 만기 오래된 순 → slug 순 (결정적)', () => {
    const completed = new Map([
      ['b', '2026-09-01'],
      ['a', '2026-09-01'],
      ['c', '2026-08-30'],
    ]);
    const due = computeDueLessons(completed, new Map(), '2026-09-03');
    assert.deepStrictEqual(
      due.map((d) => d.lessonSlug),
      ['c', 'a', 'b'],
    );
  });

  // --- nextDueDate ---
  runCase('만기 0건일 때 다음 만기일', () => {
    const completed = new Map([['l1', '2026-09-01']]);
    assert.equal(nextDueDate(completed, new Map()), '2026-09-02');
  });
  runCase('전부 졸업이면 null', () => {
    const completed = new Map([['l1', '2026-09-01']]);
    const states = new Map([['l1', { reviewCount: GRADUATE_COUNT, lastReviewedDate: '2026-09-10' }]]);
    assert.equal(nextDueDate(completed, states), null);
  });

  // --- 상수 자체의 계약 ---
  runCase('간격 사다리는 오름차순이고 졸업 횟수만큼의 간격이 존재', () => {
    for (let i = 1; i < REVIEW_INTERVALS_DAYS.length; i++) {
      assert.ok(REVIEW_INTERVALS_DAYS[i] > REVIEW_INTERVALS_DAYS[i - 1]);
    }
    assert.ok(REVIEW_INTERVALS_DAYS.length >= GRADUATE_COUNT);
  });

  // --- SELF_CHECK_ANCHOR가 빌드 산출물의 실제 heading id와 일치 ---
  if (fs.existsSync(VELITE_LESSONS)) {
    runCase('SELF_CHECK_ANCHOR가 컴파일된 레슨의 실제 id와 일치', () => {
      const lessons = JSON.parse(fs.readFileSync(VELITE_LESSONS, 'utf8'));
      const withContent = lessons.filter((l) => l.hasContent);
      assert.ok(withContent.length > 0, 'hasContent 레슨이 없음');
      const missing = withContent.filter((l) => !l.code.includes(`"${SELF_CHECK_ANCHOR}"`));
      assert.equal(
        missing.length,
        0,
        `앵커 "${SELF_CHECK_ANCHOR}" 미포함 레슨: ${missing
          .slice(0, 5)
          .map((l) => l.slug)
          .join(', ')}`,
      );
    });
  } else {
    console.log('check-review: .velite 산출물이 없어 앵커 대조는 skip (velite build 후 다시 실행)');
  }

  if (failures.length > 0) {
    console.error(`check-review: ${failures.length}건 실패:\n`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`check-review: ${caseCount}개 경계 케이스 통과`);
}

main().catch((e) => {
  console.error(`check-review: 실행 실패 — ${e instanceof Error ? e.stack : String(e)}`);
  process.exit(1);
});
