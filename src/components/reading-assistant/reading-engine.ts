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

// 텍스트로 취급해 문장 단위로 감싸는 블록 태그.
const TEXT_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE']);

// 내부를 절대 건드리지 않고 통째로 "확대 후 대기"시키는 원자 블록 태그
// (코드·표·그림·미디어·폼).
const ATOMIC_TAGS = new Set([
  'PRE',
  'TABLE',
  'FIGURE',
  'IMG',
  'SVG',
  'CANVAS',
  'VIDEO',
  'AUDIO',
  'IFRAME',
  'FORM',
]);

// 무조건 자식으로 파고드는 구조적 시맨틱 태그. 책으로 읽기 페이지처럼 본문이
// section/article/header로 여러 겹 감싸인 구조를 문장 단위까지 파고든다. MDX
// 인터랙티브 컴포넌트는 이 태그들로 렌더되지 않으므로(전부 div 루트) 안전하다.
const RECURSE_TAGS = new Set(['SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN']);

// 인터랙티브 위젯(시각화 컴포넌트·코드 실행기·프레젠터 등)을 가려낸다. 이런
// 컨테이너는 재귀로 파고들지 않고 통째로 대기 블록으로 둔다 — 내부를 문장 span으로
// 재구성하면 React 이벤트 핸들러가 붙은 원본이 클론으로 대체돼 조작이 깨진다.
//
// 실제 위젯을 이루는 구체 요소만 본다. [tabindex]·[role]은 넣지 않는다 —
// rehype-pretty-code가 스크롤용으로 코드 블록(pre)에 tabindex를 달기 때문이다.
// 코드 블록의 "복사" 버튼(button)이 자손에 있어도, 시맨틱 태그·prose 래퍼는 이
// 검사를 건너뛰고 무조건 재귀하므로(아래 processNode) 챕터 전체가 블록으로 뭉치지
// 않는다 — 위젯 검사는 그 밖의 div에만 적용한다.
const INTERACTIVE_SELECTOR =
  'button,input,select,textarea,canvas,svg,video,audio,iframe,[data-run-output],[contenteditable="true"]';

function isInteractiveWidget(el: HTMLElement): boolean {
  return el.matches(INTERACTIVE_SELECTOR) || el.querySelector(INTERACTIVE_SELECTOR) !== null;
}

// prose 래퍼(@tailwindcss/typography)인지 — 코드 블록의 복사 버튼을 품고 있어도
// 무조건 재귀해야 하는 본문 컨테이너다.
function isProseWrapper(el: HTMLElement): boolean {
  return typeof el.className === 'string' && el.className.split(/\s+/).includes('prose');
}

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
  // 접힌 details의 원래 열림 상태를 기록해 해제 시 되돌린다(읽는 동안 자동으로
  // 펼쳤어도 원래 접혀 있던 것은 다시 접어 페이지를 원상복구한다).
  const detailsStates = [...container.querySelectorAll('details')].map((d) => ({
    el: d as HTMLDetailsElement,
    wasOpen: (d as HTMLDetailsElement).open,
  }));

  const markBlock = (el: HTMLElement) => {
    el.setAttribute(RA_BLOCK_ATTR, '');
    blockEls.push(el);
    steps.push({ el, kind: 'block' });
  };

  const processNode = (el: HTMLElement) => {
    // 장식·숨김 요소(챕터 구분 기호 등)는 스텝으로 만들지 않는다.
    if (el.getAttribute('aria-hidden') === 'true') return;

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

    // 코드·표·그림·미디어 — 통째로 대기 블록.
    if (ATOMIC_TAGS.has(tag)) {
      markBlock(el);
      return;
    }

    // 접힌 details(정답 확인 등) — 통째로 대기 블록으로 두고, 포커스되면 펼친다
    // (applyFocus). 재귀로 파고들지 않는다: 접힌 내용은 감춰져 있어 문장 분리가
    // 의미 없다. 원래 열림 상태는 아래에서 기록해 해제 시 되돌린다.
    if (tag === 'DETAILS') {
      markBlock(el);
      return;
    }

    // 시맨틱 구조 태그와 prose 래퍼는 위젯 검사를 건너뛰고 무조건 자식으로 파고든다
    // (코드 블록의 복사 버튼 때문에 본문 컨테이너가 통째로 블록이 되는 것을 막는다).
    const recurse = () => {
      for (const child of Array.from(el.children)) {
        if (isElement(child)) processNode(child);
      }
    };

    if (RECURSE_TAGS.has(tag) || isProseWrapper(el)) {
      recurse();
      return;
    }

    // 그 밖의 요소: 인터랙티브 위젯(시각화 컴포넌트·코드 실행기 등)이면 내부를
    // 건드리지 않도록 통째로 대기 블록. 위젯이 아니면(표 래퍼·링크 등 순수 구조)
    // 투명하게 자식으로 통과한다 — 인라인·링크만 든 요소는 스텝을 만들지 않는다.
    if (isInteractiveWidget(el)) {
      markBlock(el);
      return;
    }

    recurse();
  };

  for (const child of Array.from(container.children)) {
    if (isElement(child)) processNode(child);
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
    // details: 원래 열림 상태로 되돌린다.
    for (const { el, wasOpen } of detailsStates) {
      el.open = wasOpen;
    }
  };

  return { steps, restore };
}

// 초점 이동 — 이전 초점을 지우고 새 스텝에 초점 클래스를 얹는다. 반환은 없다.
// 블록이 접힌 details(또는 그것을 품은 요소)면 펼쳐, 다음으로 넘어올 때 내용이
// 바로 보이게 한다(스크롤 정렬은 focusStep이 펼친 뒤 측정하므로 확장 높이를 반영한다).
export function applyFocus(step: Step): void {
  if (step.kind === 'sentence') {
    step.el.classList.add(RA_FOCUS_CLASS);
    return;
  }
  step.el.classList.add(RA_BLOCK_FOCUS_CLASS);
  const details =
    step.el instanceof HTMLDetailsElement
      ? step.el
      : step.el.querySelector<HTMLDetailsElement>('details');
  if (details) details.open = true;
}

export function clearFocus(step: Step): void {
  step.el.classList.remove(RA_FOCUS_CLASS, RA_BLOCK_FOCUS_CLASS);
}

// 스텝을 화면 세로 중앙으로 부드럽게 옮긴다. reduced-motion이면 즉시 이동.
export function scrollStepIntoView(step: Step, smooth: boolean): void {
  step.el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
}

// 지금 화면(뷰포트)에 보이는 첫 문장 스텝의 인덱스를 찾는다. 독서 도우미를 켤 때 맨
// 처음(0)이 아니라 "사용자가 지금 보고 있는 문장"부터 시작하기 위한 것이다.
//
// 스티키 헤더(--site-header-height)에 가린 문장은 보이는 것으로 치지 않는다 — 헤더
// 아래로 실제 노출된 첫 문장을 고른다. 문장(sentence)을 우선하되, 보이는 문장이 없으면
// (표·코드 같은 블록만 보이거나, 본문을 아래로 다 지나친 경우) 보이는 첫 스텝을, 그것도
// 없으면 0을 돌려준다. buildSteps로 문장 span을 만든 직후에 호출해야 위치가 정확하다
// (span이 원래 텍스트 자리를 그대로 차지하므로 레이아웃은 보존된다).
export function firstVisibleStepIndex(steps: Step[]): number {
  if (typeof window === 'undefined' || steps.length === 0) return 0;

  const headerVar = getComputedStyle(document.documentElement).getPropertyValue(
    '--site-header-height',
  );
  const top = Number.parseFloat(headerVar) || 0; // "56px" -> 56, 없으면 0
  const bottom = window.innerHeight;

  const isVisible = (el: HTMLElement): boolean => {
    const r = el.getBoundingClientRect();
    // 헤더 아래로 얼마라도 보이고(bottom이 헤더선 아래), 뷰포트 안(top이 아래끝 위)이면 보임.
    return r.bottom > top + 4 && r.top < bottom;
  };

  let firstVisibleAny = -1;
  for (let i = 0; i < steps.length; i += 1) {
    if (!isVisible(steps[i].el)) continue;
    if (firstVisibleAny === -1) firstVisibleAny = i;
    if (steps[i].kind === 'sentence') return i;
  }
  return firstVisibleAny === -1 ? 0 : firstVisibleAny;
}
