// 독서 도우미의 문장 분리 순수 로직. DOM·React에 의존하지 않는 의존성 0 모듈이라
// scripts/check-reading-sentence-split.mjs가 Node 타입 스트리핑으로 그대로 로드해
// 검증한다(G11 unlock-secret과 같은 규율). import 문을 두지 않는다.
//
// 한 텍스트 노드를 "문장 조각"들로 나눈다. 문장은 여러 DOM 노드(텍스트 + <strong>
// 같은 인라인 요소)에 걸쳐 있으므로, 여기서는 텍스트 한 덩어리를 종결 부호 기준으로
// 자르되 "이 조각이 문장을 끝냈는가(endsSentence)"만 표시한다. 실제 문장 그룹핑은
// reading-engine.ts가 여러 노드에 걸쳐 이 신호를 이어 붙여 수행한다.
//
// 불변식(가장 중요): 조각들의 text를 순서대로 이어 붙이면 원문과 정확히 같아야 한다.
// 글자가 빠지거나 겹치면 본문 DOM 재조립이 깨진다.

export type SentencePiece = { text: string; endsSentence: boolean };

// 문장 종결 부호. 라틴 마침표·물음표·느낌표 + 말줄임표 + 전각(CJK) 종결 부호.
const TERMINATORS = new Set(['.', '!', '?', '…', '。', '！', '？']);

// 종결 부호 바로 뒤에 올 수 있는 닫는 부호 — 이들까지 삼킨 다음의 문자가 공백/끝일
// 때만 문장 경계로 인정한다. 닫는 따옴표 뒤에 곧바로 다른 글자가 이어지면(예:
// "그래."라고) 문장이 계속되는 것이므로 경계가 아니다.
const CLOSERS = new Set(['"', "'", '”', '’', '」', '』', ')', ']', '»', '》']);

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch >= '0' && ch <= '9';
}

function isWhitespace(ch: string | undefined): boolean {
  return ch !== undefined && /\s/.test(ch);
}

export function splitIntoSentencePieces(text: string): SentencePiece[] {
  if (text.length === 0) return [{ text: '', endsSentence: false }];

  const pieces: SentencePiece[] = [];
  const n = text.length;
  let start = 0;
  let i = 0;

  while (i < n) {
    const ch = text[i];
    if (!TERMINATORS.has(ch)) {
      i++;
      continue;
    }

    // 소수점 방어 — 숫자.숫자 사이의 마침표는 문장 경계가 아니다(3.14).
    if (ch === '.' && isDigit(text[i - 1]) && isDigit(text[i + 1])) {
      i++;
      continue;
    }

    // 연속 종결 부호(?!, …, ...)를 한 경계로 묶는다.
    let j = i + 1;
    while (j < n && TERMINATORS.has(text[j])) j++;
    // 닫는 따옴표·괄호를 삼킨다.
    while (j < n && CLOSERS.has(text[j])) j++;

    // 문장 경계는 뒤가 공백이거나 문자열 끝일 때만 인정한다.
    if (j >= n || isWhitespace(text[j])) {
      // 종결 뒤 공백은 이 조각에 붙여, 다음 조각이 공백으로 시작하지 않게 한다.
      let k = j;
      while (k < n && isWhitespace(text[k])) k++;
      pieces.push({ text: text.slice(start, k), endsSentence: true });
      start = k;
      i = k;
    } else {
      // 진짜 경계가 아니다(닫는 부호 뒤에 글자가 이어짐) — 계속 스캔한다.
      i = j;
    }
  }

  if (start < n) pieces.push({ text: text.slice(start), endsSentence: false });
  if (pieces.length === 0) pieces.push({ text, endsSentence: false });

  return pieces;
}
