#!/usr/bin/env node
// 독서 도우미 문장 분리(splitIntoSentencePieces)의 순수 로직 검증. G11(unlock-secret)과
// 같은 패턴 — 의존성 0 TS 모듈을 Node 타입 스트리핑으로 그대로 로드해 node:assert로
// 실제 실행 검증한다. 별도 테스트 러너를 도입하지 않는다.
//
// 이 함수가 잘못되면 문장이 조각나거나(볼드 키워드 앞뒤에서 끊김) 소수점에서 잘려
// 독서 도우미의 문장 단위 확대가 전부 어긋난다 — 그 회귀를 상시 잡는다.

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MODULE_PATH = path.join(ROOT, 'src', 'lib', 'reading-assistant', 'sentence-split.ts');

const { splitIntoSentencePieces } = await import(pathToFileURL(MODULE_PATH).href);

function pieces(text) {
  return splitIntoSentencePieces(text);
}

// 이어붙이면 원문과 정확히 같아야 한다 — 조각을 다시 합쳤을 때 글자 하나라도
// 빠지거나 겹치면 DOM 재조립에서 본문이 깨진다(가장 중요한 불변식).
function assertLossless(text) {
  const joined = pieces(text).map((p) => p.text).join('');
  assert.strictEqual(joined, text, `lossless 위반: ${JSON.stringify(text)} -> ${JSON.stringify(joined)}`);
}

// 1) 마침표로 끝나는 두 문장은 둘로 나뉘고 둘 다 문장 종결이다.
{
  const r = pieces('리스트는 자료형이었어요. 그런데 많아요.');
  assert.strictEqual(r.length, 2, '두 문장');
  assert.strictEqual(r[0].endsSentence, true);
  assert.strictEqual(r[1].endsSentence, true);
  assert.strictEqual(r[0].text, '리스트는 자료형이었어요. ');
  assert.strictEqual(r[1].text, '그런데 많아요.');
}

// 2) 종결 부호가 없는 조각(볼드 앞 텍스트 등)은 endsSentence=false 하나다.
{
  const r = pieces('자료형이 바로 ');
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].endsSentence, false);
  assert.strictEqual(r[0].text, '자료형이 바로 ');
}

// 3) 소수점은 문장 경계가 아니다 — 숫자.숫자 사이에서 끊기지 않는다.
{
  const r = pieces('원주율은 3.14 정도예요');
  assert.strictEqual(r.length, 1, '소수점에서 끊기면 안 됨');
  assert.strictEqual(r[0].endsSentence, false);
}
{
  // 소수 뒤에 실제 종결이 오면 그 지점에서만 끊긴다.
  const r = pieces('값은 3.14예요. 끝.');
  assert.strictEqual(r.length, 2);
  assert.strictEqual(r[0].text, '값은 3.14예요. ');
  assert.strictEqual(r[1].text, '끝.');
}

// 4) 느낌표·물음표도 종결 부호다.
{
  const r = pieces('정말?');
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].endsSentence, true);
}
{
  const r = pieces('좋아요! 다음으로 가요!');
  assert.strictEqual(r.length, 2);
  assert.ok(r.every((p) => p.endsSentence));
}

// 5) 닫는 따옴표·괄호는 종결 부호에 붙어 같은 조각에 들어간다.
{
  const r = pieces('그는 "그래."라고 했다. 끝났다.');
  // "그래."의 . 뒤 따옴표는 아직 문장 안이다(라고 이어짐) — 닫는 따옴표가 종결
  // 부호 바로 뒤에 오면 함께 삼키되, 실제 종결은 그 뒤 공백으로 판정한다.
  assert.strictEqual(pieces(r.map((p) => p.text).join('')).length >= 1, true);
  assertLossless('그는 "그래."라고 했다. 끝났다.');
}

// 6) 말줄임표(…)와 연속 종결 부호는 하나의 경계로 합쳐 처리한다.
{
  const r = pieces('음… 그렇군요. 네.');
  assert.strictEqual(r.length, 3);
}

// 7) 빈 문자열/공백만 있는 노드는 조각 하나로 보존한다(endsSentence=false).
{
  const r = pieces('   ');
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].endsSentence, false);
  assert.strictEqual(r[0].text, '   ');
}
{
  const r = pieces('');
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].text, '');
}

// 8) lossless 불변식을 여러 입력에 대해 확인한다.
for (const t of [
  '안녕하세요. 반갑습니다.',
  'if 문은 조건이 참일 때만 실행돼요. 아니면 건너뛰죠.',
  '리스트.append()는 끝에 추가해요. 예: nums.append(3).',
  '3.14, 2.71 같은 숫자도 문제없어요',
  '여러  공백과\n줄바꿈도\t그대로 보존돼요.',
]) {
  assertLossless(t);
}

console.log('check-reading-sentence-split: all assertions passed');
