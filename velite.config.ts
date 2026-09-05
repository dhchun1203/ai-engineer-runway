import { defineConfig, s } from "velite";
import rehypePrettyCode from "rehype-pretty-code";
// 헤딩 id 생성 (quick 260901-etq). 복습 카드가 레슨의 "6. 핵심 정리 및 스스로 점검"
// 섹션으로 직행하는 앵커가 필요해 들였다. 35편이 같은 헤딩을 쓰므로(게이트 L1이
// 강제) 앵커는 전 레슨 공통 상수 하나다 — src/lib/review.ts의 SELF_CHECK_ANCHOR.
// section-tape.tsx의 "플러그인 없이 간다" 주석은 테이프 스크롤 문제에 국한된
// 결정이었다 — 이번엔 서버 렌더 링크의 착지점이 필요하므로 사유가 다르다.
import rehypeSlug from "rehype-slug";

// 복사 버튼은 여기서 만들지 않는다. @rehype-pretty/transformers의
// transformerCopyButton은 인라인 onclick을 *문자열*로 내보내는데, 컴파일된 MDX가
// React 엘리먼트로 렌더되는 이 프로젝트에서는 React가 문자열 핸들러를 거부해
// 버튼이 아무 일도 하지 않았다 (04-UI-REVIEW Priority Fix 1).
// 대신 src/components/code-block.tsx가 <pre>를 감싸 실제 핸들러를 붙인다.
const rehypePrettyCodeOptions = {
  theme: { dark: "github-dark-dimmed", light: "github-light" },
};

// 용어 표 파서 (round2-j 권장 경로 1) — scripts/check-lesson-structure.mjs의
// checkTermTable(L5, ~186줄)을 이식한 것이다. L5는 형식을 "검사"만 하고,
// 이 함수는 같은 형식에서 { word, definition }을 "추출"한다. 둘은 같은
// 표 문법(라벨 → 헤더 → 구분행 → 데이터 행)을 각각 구현하는 이중 구현이므로
// (round2-j 함정 d) **한쪽을 고치면 반드시 다른 쪽도 함께 고칠 것**.
//
// meta.content는 frontmatter를 포함한 레슨 원문 전체이지만, 라벨 문자열을
// 찾아 그 다음부터 파싱하는 방식이라 frontmatter가 섞여 있어도 무관하다
// (round2-j 함정 e). CRLF 체크아웃 대비 정규화도 L5(302줄)와 동일하게 처리한다.
function parseTermTable(content: string): { word: string; definition: string }[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const label = "**이 레슨의 단어**";
  const header = "| 단어 | 뜻 |";

  const labelIdx = lines.indexOf(label);
  if (labelIdx === -1) {
    throw new Error(`parseTermTable: label "${label}" not found — expected exactly once`);
  }

  let i = labelIdx + 1;
  while (i < lines.length && lines[i].trim() === "") i += 1;
  if (i >= lines.length || lines[i].trim() !== header) {
    throw new Error(
      `parseTermTable: expected table header "${header}" right after the term label, got "${lines[i]}"`,
    );
  }

  const separatorIdx = i + 1;
  if (separatorIdx >= lines.length || !/^\|[\s:-]+\|/.test(lines[separatorIdx].trim())) {
    throw new Error(
      `parseTermTable: expected a markdown table separator row after the header (line ${separatorIdx + 1})`,
    );
  }

  const terms: { word: string; definition: string }[] = [];
  let j = separatorIdx + 1;
  while (j < lines.length && lines[j].trim().startsWith("|")) {
    const cells = lines[j]
      .trim()
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    const [word, definition] = cells;
    if (word && definition) {
      terms.push({ word, definition });
    }
    j += 1;
  }

  // 파싱 0개는 L5가 이미 통과시킨 표가 이 파서의 가정과 어긋난다는 뜻 —
  // 조용히 넘어가지 않고 빌드를 실패시킨다(round2-j 권장 경로 1의 방어).
  if (terms.length === 0) {
    throw new Error("parseTermTable: parsed 0 terms from a term table — malformed table or parser/gate drift");
  }

  return terms;
}

// 스스로 점검 문항 파서 (quick 260901-w04, 설계는
// .planning/research/edu-sites/round2-h-review-design.md V2절) — parseTermTable과
// 같은 "라벨 찾기 → 그 뒤만 파싱 → 0개면(여기선 !=2개면) throw" 방어 구조를
// 그대로 이식했다. parseTermTable과 parseSelfCheck는 같은 "라벨 이후 파싱" 문법의
// 이중 구현이므로(round2-j 함정 d와 동형) **한쪽 파서/게이트가 바뀌면 다른 쪽도
// 함께 볼 것**.
//
// 코드펜스(삼중 백틱 토글)와 <details>…</details>(깊이 카운터) 내부는 건너뛴다 —
// 힌트 보기·정답 보기 접기 안의 텍스트(코드 예시 포함)가 문항으로 오인되지 않게
// 막는 것이 이 파서의 핵심 방어다(quick 260901-etq가 힌트 접기를 정답 접기 앞에
// 추가했으므로, 두 접기 모두 스킵 대상이다).
const DETAILS_OPEN_LINE = "<details>";
const DETAILS_CLOSE_LINE = "</details>";

function parseSelfCheck(content: string): string[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const label = "**스스로 점검**";

  const labelCount = lines.filter((l) => l === label).length;
  if (labelCount !== 1) {
    throw new Error(`parseSelfCheck: label "${label}" appears ${labelCount} time(s), expected exactly 1`);
  }
  const labelIdx = lines.indexOf(label);

  const questions: string[] = [];
  let inFence = false;
  let detailsDepth = 0;

  for (let i = labelIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    if (trimmed.includes(DETAILS_OPEN_LINE)) {
      detailsDepth += 1;
      continue;
    }
    if (trimmed.includes(DETAILS_CLOSE_LINE)) {
      detailsDepth = Math.max(0, detailsDepth - 1);
      continue;
    }
    if (detailsDepth > 0) continue;

    const match = /^\d+\.\s+(.+)/.exec(trimmed);
    if (match) {
      questions.push(match[1].trim());
    }
  }

  // 정확히 2개가 아니면(0개 포함) throw해 velite build를 실패시킨다 — F7(레슨당
  // 정확히 2문항)을 런타임 빈 세션으로 새는 대신 빌드에서 멈춘다(round2-h V2절).
  if (questions.length !== 2) {
    throw new Error(
      `parseSelfCheck: parsed ${questions.length} self-check question(s), expected exactly 2 — malformed section or parser/gate drift`,
    );
  }

  return questions;
}

export default defineConfig({
  root: ".",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  mdx: {
    rehypePlugins: [rehypeSlug, [rehypePrettyCode, rehypePrettyCodeOptions]],
  },
  collections: {
    lessons: {
      name: "Lesson",
      pattern: "src/content/lessons/**/*.mdx",
      schema: s
        .object({
          title: s.string(),
          stepId: s.number().min(1).max(3),
          moduleId: s.string(), // e.g. "1-3", cross-checked against modules.ts
          order: s.number(),
          depth: s.enum(["심화", "개요"]), // CONT-04 depth badge
          estimatedMinutes: s.number().min(1), // D-13, Phase 3 schedule input
          slug: s.slug("lessons"),
          hasContent: s.boolean().default(true), // false for placeholder lessons
          code: s.mdx(),
        })
        .transform((data, { meta }) => ({
          ...data,
          permalink: `/lesson/${data.slug}`,
          // hasContent:false 스텁은 파싱하지 않는다(terms: []) — L5 게이트가
          // hasContent:true인 레슨만 검사하는 것과 정확히 대칭이다(round2-j
          // 권장 경로 1). 현재 스텁 0편이지만 미래 방어로 남긴다.
          terms: data.hasContent ? parseTermTable(meta.content ?? "") : [],
          // /review 세션(quick 260901-w04)이 소비하는 문항 배열 — 인덱스가 곧
          // questionIndex다. terms와 정확히 같은 hasContent 게이트 패턴.
          selfCheck: data.hasContent ? parseSelfCheck(meta.content ?? "") : [],
        })),
    },
    // /about (Making-of) 소개 페이지 소스 — docs/making-of.md 단일 파일만 대상으로 한다.
    // 글로브를 넓혀 GSD 계획 산출물 디렉터리를 빨아들이지 않는다 (PLAT-03 threat T-01-14).
    pages: {
      name: "Page",
      pattern: "docs/making-of.md",
      schema: s
        .object({
          title: s.string(),
          slug: s.slug("pages"),
          code: s.mdx(),
        })
        .transform((data) => ({ ...data, permalink: `/${data.slug}` })),
    },
  },
});
