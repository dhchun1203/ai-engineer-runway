// 빌드타임 클로즈(빈칸 채우기) 추출 remark 플러그인.
//
// 레슨 .mdx를 한 글자도 수정하지 않는 이유: 저자가 이미 강조(**굵게**/`인라인
// 코드`/괄호 글로스)해 둔 용어를 빌드 시점에 자동으로 빈칸 컴포넌트로
// "치환"만 한다 — 원본 파일에는 아무 것도 쓰지 않는다(DD-4). 이 파일은
// `## 3. 개념 설명` 구간의 직계 문단만 대상으로 하고, 문단당 최대 1개의
// 빈칸만 만든다.
//
// DD-6(플러그인은 레슨 slug를 모른다): 이 플러그인은 VFile 경로에서 slug를
// 추론하지 않는다. 내보내는 것은 `index`(개념 설명 구간 내 1-based 순번)와
// `answer`(정답 원문), `hash`(빌드 타임 sha256 앞 16자)뿐이다. blankId
// (`${lessonId}#${index}`)는 런타임에 lessonId를 이미 아는 페이지가
// ClozeProvider를 통해 조합한다 — Velite의 frontmatter slug와 어긋날 수
// 있는 경로를 플러그인에 만들지 않기 위함이다.
//
// 게이트(scripts/e2e-cloze.mjs)가 이 파일을 `pathToFileURL` 동적 import로
// 직접 로드해 합성 픽스처를 돌린다 — enum/namespace를 쓰지 않고, 타입만
// 가져오는 import는 `import type`으로 쓴다. `server-only`를 import하지
// 않는다(velite.config.ts가 esbuild로 이 파일을 번들하는데, server-only는
// Next.js 번들러 밖에서 로드되면 아무 효과가 없고 오히려 게이트의 동적
// import를 방해할 수 있다).

import { visit } from 'unist-util-visit';
import { toString as mdastToString } from 'mdast-util-to-string';
import { createHash } from 'node:crypto';
import type { Root, Heading, Paragraph, PhrasingContent, Text } from 'mdast';
// 명시적 `.ts` 확장자로 import한다 — Node의 네이티브 타입 스트리핑(ESM 리졸버)은
// 상대 경로 지정자에 확장자를 요구한다. TypeScript(번들러 moduleResolution)와
// Node 직접 실행(게이트의 pathToFileURL 동적 import) 양쪽에서 이 파일이 그대로
// 로드되려면 이 확장자가 반드시 필요하다.
import { normalizeAnswer } from './cloze-key.ts';

const CONCEPT_HEADING_PREFIX_RE = /^3\./;
const CONCEPT_HEADING_TEXT = '개념 설명';
const MIN_PARAGRAPH_LENGTH = 20;
const MIN_ANSWER_LENGTH = 1;
const MAX_ANSWER_LENGTH = 12;
// 정답이 한글·영문·숫자를 하나도 포함하지 않으면(구두점뿐이면) 버린다.
const HAS_ALNUM_RE = /[\p{Script=Hangul}A-Za-z0-9]/u;
// 괄호 글로스: `용어(term)` / `용어(term, 설명)`의 괄호 앞 한국어 용어(1~12자).
const PAREN_GLOSS_RE = /([가-힣]{1,12})\(/;

function computeHash(answer: string): string {
  return createHash('sha256').update(normalizeAnswer(answer)).digest('hex').slice(0, 16);
}

function isValidAnswer(raw: string): boolean {
  const normalized = normalizeAnswer(raw);
  if (normalized.length < MIN_ANSWER_LENGTH || normalized.length > MAX_ANSWER_LENGTH) return false;
  if (!HAS_ALNUM_RE.test(normalized)) return false;
  return true;
}

// mdxJsxTextElement 형태의 빈칸 노드. mdast-util-mdx-jsx의 타입을 import하지
// 않는다 — 이 플러그인이 명시 의존하는 패키지는 unist-util-visit과
// mdast-util-to-string 둘뿐이다(package.json). 직렬화기는 이 노드를 타입
// 식별자가 아니라 `type`/`name` 문자열로만 판별하므로 로컬 타입 정의로도
// 런타임 동작에는 차이가 없다.
function makeClozeBlankNode(answer: string, index: number): PhrasingContent {
  const node = {
    type: 'mdxJsxTextElement',
    name: 'ClozeBlank',
    attributes: [
      { type: 'mdxJsxAttribute', name: 'answer', value: answer },
      { type: 'mdxJsxAttribute', name: 'index', value: String(index) },
      { type: 'mdxJsxAttribute', name: 'hash', value: computeHash(answer) },
    ],
    children: [],
  };
  return node as unknown as PhrasingContent;
}

function isConceptHeading(node: Heading): boolean {
  const text = mdastToString(node);
  return CONCEPT_HEADING_PREFIX_RE.test(text) && text.includes(CONCEPT_HEADING_TEXT);
}

// `## 3. 개념 설명`부터 다음 depth-2 heading 직전까지의 root 직계 자식 인덱스
// 범위를 찾는다. 그런 heading이 없으면 null(/about 등 — 정상 폴백).
function findConceptSectionBounds(tree: Root): { start: number; end: number } | null {
  const depth2Indexes: number[] = [];
  visit(tree, 'heading', (node, index, parent) => {
    if (parent !== tree || typeof index !== 'number') return;
    if ((node as Heading).depth !== 2) return;
    depth2Indexes.push(index);
  });

  let sectionHeadingIndex = -1;
  for (const idx of depth2Indexes) {
    if (isConceptHeading(tree.children[idx] as Heading)) {
      sectionHeadingIndex = idx;
      break;
    }
  }
  if (sectionHeadingIndex === -1) return null;

  const nextHeadingIndex = depth2Indexes.find((idx) => idx > sectionHeadingIndex);
  return {
    start: sectionHeadingIndex + 1,
    end: nextHeadingIndex ?? tree.children.length,
  };
}

// 문단의 인라인 자식 중 주어진 type(strong 또는 inlineCode)의 첫 후보를 찾는다.
function findEmphasisCandidate(
  children: PhrasingContent[],
  type: 'strong' | 'inlineCode',
): { index: number; answer: string } | null {
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type !== type) continue;
    const answer = mdastToString(child);
    if (!isValidAnswer(answer)) continue;
    return { index: i, answer };
  }
  return null;
}

// 문단의 인라인 text 자식들 중 첫 괄호 글로스 후보를 찾는다.
function findParenGlossCandidate(
  children: PhrasingContent[],
): { index: number; answer: string; matchStart: number } | null {
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type !== 'text') continue;
    const textNode = child as Text;
    const match = PAREN_GLOSS_RE.exec(textNode.value);
    if (!match) continue;
    const term = match[1];
    if (!isValidAnswer(term)) continue;
    return { index: i, answer: term, matchStart: match.index };
  }
  return null;
}

// DD-4 우선순위로 후보를 골라 문단 children을 제자리에서 치환한다.
// 빈칸을 만들었으면 true, 못 만들었으면(그대로 평문) false를 돌려준다.
function processParagraph(paragraph: Paragraph, blankIndex: number): boolean {
  const children = paragraph.children as PhrasingContent[];

  const strongCandidate = findEmphasisCandidate(children, 'strong');
  if (strongCandidate) {
    children.splice(strongCandidate.index, 1, makeClozeBlankNode(strongCandidate.answer, blankIndex));
    return true;
  }

  const codeCandidate = findEmphasisCandidate(children, 'inlineCode');
  if (codeCandidate) {
    children.splice(codeCandidate.index, 1, makeClozeBlankNode(codeCandidate.answer, blankIndex));
    return true;
  }

  const glossCandidate = findParenGlossCandidate(children);
  if (glossCandidate) {
    const textNode = children[glossCandidate.index] as Text;
    const before = textNode.value.slice(0, glossCandidate.matchStart);
    const after = textNode.value.slice(glossCandidate.matchStart + glossCandidate.answer.length);
    const replacement: PhrasingContent[] = [];
    if (before) replacement.push({ type: 'text', value: before } as Text);
    replacement.push(makeClozeBlankNode(glossCandidate.answer, blankIndex));
    if (after) replacement.push({ type: 'text', value: after } as Text);
    children.splice(glossCandidate.index, 1, ...replacement);
    return true;
  }

  return false;
}

export default function remarkClozeBlanks() {
  return (tree: Root) => {
    const bounds = findConceptSectionBounds(tree);
    if (!bounds) return; // 개념 설명 헤딩이 없다 — 아무것도 하지 않는다(/about 등, 정상 폴백)

    let blankCount = 0;
    for (let i = bounds.start; i < bounds.end; i++) {
      const node = tree.children[i];
      if (node.type !== 'paragraph') continue;

      // 어떤 문단에서 예외가 나도 그 문단만 건너뛰고 계속 진행한다.
      // 빌드를 절대 깨지 않는다(T-uig-05).
      try {
        const paragraph = node as Paragraph;
        const plainText = mdastToString(paragraph).trim();
        if (plainText.length < MIN_PARAGRAPH_LENGTH) continue;

        const inserted = processParagraph(paragraph, blankCount + 1);
        if (inserted) blankCount += 1;
      } catch {
        continue;
      }
    }
  };
}
