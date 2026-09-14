// 독서 도우미의 DOM 계층. 정적으로 렌더된 레슨 본문(.prose 컨테이너)을 "스텝"들로
// 나눈다. 스텝은 두 종류다:
//   - sentence: 문단·제목·목록 항목의 텍스트를 문장 단위로 감싼 <span class="ra-sentence">.
//   - block: 문장으로 쪼개지 않고 통째로 확대·대기시키는 블록(표·코드·이미지·시각화
//     컴포넌트). 이 요소들은 React가 관리하는 인터랙티브 컴포넌트일 수 있어 내부를
//     절대 건드리지 않고, 루트에 클래스만 얹었다 뗀다.
//
// 안전 계약(중요): 문장 감싸기는 원본 자식 노드를 "클론해서" 보여주고, 원본 노드는
// 분리해 보관했다가 해제 시 그대로 되돌린다. 이렇게 하면 React가 붙들고 있는 실제
// DOM 노드가 그대로 살아 있어(문서에서 잠시 빠져 있을 뿐), 해제 후 React가 언제
// 참조하더라도 유효하다. innerHTML로 되돌리면 노드가 새로 생겨 이 보장이 깨진다.
//
// 이 파일은 브라우저에서만 동작한다(document 사용). 순수 문자열 로직은
// sentence-split.ts로 분리되어 별도 검증된다.

import { splitIntoSentencePieces } from '@/lib/reading-assistant/sentence-split';

export type StepKind = 'sentence' | 'block';
export type Step = { el: HTMLElement; kind: StepKind };

export type BuiltSteps = {
  steps: Step[];
  // 모든 변형을 되돌린다(문장 span 제거 + 원본 노드 복귀 + 블록 클래스 제거).
  restore: () => void;
};

// 텍스트로 취급해 문장 단위로 감싸는 블록 태그. 나머지는 전부 block 스텝이다.
const TEXT_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE']);

// 문장 span·블록 포커스에 쓰는 클래스/속성 이름 상수(엔진과 CSS의 유일한 접점).
export const RA_SENTENCE_CLASS = 'ra-sentence';
export const RA_FOCUS_CLASS = 'ra-focus';
export const RA_BLOCK_ATTR = 'data-ra-block';
export const RA_BLOCK_FOCUS_CLASS = 'ra-block-focus';
export const RA_READING_CLASS = 'ra-reading';

type ModifiedBlock = { block: HTMLElement; originalNodes: ChildNode[] };

function isElement(node: ChildNode): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE;
}

// 한 텍스트 블록(p·hN·li 등)의 내용을 문장 span들로 재구성한다. 원본 자식 노드는
// modified에 보관하고, 화면에는 클론을 감싼 span을 붙인다. 반환값은 실제 초점 대상이
// 되는(내용이 있는) 문장 span 목록이다.
function wrapBlockSentences(block: HTMLElement, modified: ModifiedBlock[]): HTMLElement[] {
  const originalNodes = Array.from(block.childNodes);
  modified.push({ block, originalNodes });

  // 여러 노드에 걸친 문장을 이어 붙인다 — 종결 부호가 나올 때까지 현재 그룹에 쌓는다.
  const groups: ChildNode[][] = [];
  let current: ChildNode[] = [];
  const flush = () => {
    if (current.length > 0) {
      groups.push(current);
      current = [];
    }
  };

  for (const node of originalNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const pieces = splitIntoSentencePieces(node.textContent ?? '');
      for (const piece of pieces) {
        current.push(document.createTextNode(piece.text));
        if (piece.endsSentence) flush();
      }
    } else {
      // 인라인 요소(strong·em·code·a 등)는 원자적으로 현재 문장에 속한다 — 내부에서
      // 문장을 쪼개지 않는다(볼드 키워드는 거의 항상 한 문장 안이다). 클론해서 넣는다.
      current.push(node.cloneNode(true) as ChildNode);
    }
  }
  flush();

  // 원본 자식을 문서에서 걷어낸다(참조는 originalNodes에 살아 있다).
  while (block.firstChild) block.removeChild(block.firstChild);

  const spans: HTMLElement[] = [];
  for (const group of groups) {
    const span = document.createElement('span');
    span.className = RA_SENTENCE_CLASS;
    for (const gn of group) span.appendChild(gn);
    block.appendChild(span);
    // 공백만인 그룹(문단 사이 들여쓰기 등)은 초점 대상이 아니다 — DOM에는 남겨
    // 간격을 보존하되 스텝 목록에는 넣지 않는다.
    if ((span.textContent ?? '').trim().length > 0) spans.push(span);
  }

  return spans;
}

export function buildSteps(container: HTMLElement): BuiltSteps {
  const steps: Step[] = [];
  const modified: ModifiedBlock[] = [];
  const blockEls: HTMLElement[] = [];

  const processBlock = (el: HTMLElement) => {
    const tag = el.tagName;

    if (tag === 'UL' || tag === 'OL') {
      for (const child of Array.from(el.children)) {
        if (child.tagName === 'LI') {
          const spans = wrapBlockSentences(child as HTMLElement, modified);
          for (const s of spans) steps.push({ el: s, kind: 'sentence' });
        }
      }
      return;
    }

    if (TEXT_TAGS.has(tag)) {
      const spans = wrapBlockSentences(el, modified);
      for (const s of spans) steps.push({ el: s, kind: 'sentence' });
      return;
    }

    // 그 외(pre·표 래퍼·figure·img·시각화 컴포넌트 루트) — 통째로 대기 블록.
    el.setAttribute(RA_BLOCK_ATTR, '');
    blockEls.push(el);
    steps.push({ el, kind: 'block' });
  };

  for (const child of Array.from(container.children)) {
    if (isElement(child)) processBlock(child);
  }

  const restore = () => {
    // 문장 블록: 내 span들을 걷어내고 원본 노드를 순서대로 되돌린다.
    for (const { block, originalNodes } of modified) {
      while (block.firstChild) block.removeChild(block.firstChild);
      for (const n of originalNodes) block.appendChild(n);
    }
    // 대기 블록: 얹었던 표식·클래스를 뗀다.
    for (const el of blockEls) {
      el.removeAttribute(RA_BLOCK_ATTR);
      el.classList.remove(RA_BLOCK_FOCUS_CLASS);
    }
  };

  return { steps, restore };
}

// 초점 이동 — 이전 초점을 지우고 새 스텝에 초점 클래스를 얹는다. 반환은 없다.
export function applyFocus(step: Step): void {
  if (step.kind === 'sentence') step.el.classList.add(RA_FOCUS_CLASS);
  else step.el.classList.add(RA_BLOCK_FOCUS_CLASS);
}

export function clearFocus(step: Step): void {
  step.el.classList.remove(RA_FOCUS_CLASS, RA_BLOCK_FOCUS_CLASS);
}

// 스텝을 화면 세로 중앙으로 부드럽게 옮긴다. reduced-motion이면 즉시 이동.
export function scrollStepIntoView(step: Step, smooth: boolean): void {
  step.el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
}
