#!/usr/bin/env node
// src/lib/progress-math.ts의 순수 집계 함수 11개 케이스 + 입력 불변성을 node:assert로
// 직접 실행 검증하는 게이트. 외부 의존성 0, 새 devDependency 추가 없음.
// progress-math.ts는 import를 쓰지 않으므로 Node가 별도 러너 없이 그대로 로드한다
// (Node 22.6+ 타입 스트리핑, check-progress-gates.mjs G11과 같은 원리).

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PROGRESS_MATH_PATH = path.join(ROOT, 'src', 'lib', 'progress-math.ts');

const failures = [];

function runCase(name, fn) {
  try {
    fn();
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function main() {
  const { aggregate, firstIncompleteSlug } = await import(pathToFileURL(PROGRESS_MATH_PATH).href);

  runCase('aggregate(빈 Set, 빈 배열)', () => {
    assert.deepStrictEqual(aggregate(new Set(), []), { completed: 0, total: 0, percent: 0 });
  });

  runCase('aggregate(빈 Set, 3개)', () => {
    assert.deepStrictEqual(aggregate(new Set(), ['a', 'b', 'c']), { completed: 0, total: 3, percent: 0 });
  });

  runCase('aggregate(1/3 완료, 반올림)', () => {
    assert.deepStrictEqual(aggregate(new Set(['a']), ['a', 'b', 'c']), { completed: 1, total: 3, percent: 33 });
  });

  runCase('aggregate(2/3 완료, 반올림)', () => {
    assert.deepStrictEqual(aggregate(new Set(['a', 'b']), ['a', 'b', 'c']), { completed: 2, total: 3, percent: 67 });
  });

  runCase('aggregate(3/3 완료)', () => {
    assert.deepStrictEqual(aggregate(new Set(['a', 'b', 'c']), ['a', 'b', 'c']), { completed: 3, total: 3, percent: 100 });
  });

  runCase('aggregate(목록 밖 slug는 계산에 들어오지 않음)', () => {
    assert.deepStrictEqual(aggregate(new Set(['zzz']), ['a', 'b']), { completed: 0, total: 2, percent: 0 });
  });

  runCase('firstIncompleteSlug(빈 Set, 3개) -> 첫 slug', () => {
    assert.strictEqual(firstIncompleteSlug(new Set(), ['a', 'b', 'c']), 'a');
  });

  runCase('firstIncompleteSlug(a 완료, 3개) -> b (완료 건너뜀)', () => {
    assert.strictEqual(firstIncompleteSlug(new Set(['a']), ['a', 'b', 'c']), 'b');
  });

  runCase('firstIncompleteSlug(전부 완료) -> null', () => {
    assert.strictEqual(firstIncompleteSlug(new Set(['a', 'b', 'c']), ['a', 'b', 'c']), null);
  });

  runCase('firstIncompleteSlug(빈 Set, 빈 배열) -> null', () => {
    assert.strictEqual(firstIncompleteSlug(new Set(), []), null);
  });

  runCase('두 함수 모두 입력 Set·배열을 변형하지 않는다', () => {
    const inputSet = new Set(['a']);
    const inputArr = ['a', 'b', 'c'];
    const setSnapshot = new Set(inputSet);
    const arrSnapshot = [...inputArr];

    aggregate(inputSet, inputArr);
    firstIncompleteSlug(inputSet, inputArr);

    assert.deepStrictEqual(inputSet, setSnapshot, 'aggregate/firstIncompleteSlug가 입력 Set을 변형했습니다');
    assert.deepStrictEqual(inputArr, arrSnapshot, 'aggregate/firstIncompleteSlug가 입력 배열을 변형했습니다');
  });

  if (failures.length > 0) {
    console.error(`check-progress-math: ${failures.length}개 케이스 실패:\n`);
    for (const f of failures) {
      console.error(`  - ${f}`);
    }
    process.exit(1);
  }

  console.log('check-progress-math: 11개 케이스 모두 통과');
  process.exit(0);
}

main().catch((e) => {
  console.error(`check-progress-math: 실행 중 오류 — ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
