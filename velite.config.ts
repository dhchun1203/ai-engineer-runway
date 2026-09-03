import { defineConfig, s } from "velite";
import rehypePrettyCode from "rehype-pretty-code";
// 헤딩 id 생성 (quick 260901-etq). 복습 카드가 레슨의 "6. 핵심 정리 및 스스로 점검"
// 섹션으로 직행하는 앵커가 필요해 들였다. 35편이 같은 헤딩을 쓰므로(게이트 L1이
// 강제) 앵커는 전 레슨 공통 상수 하나다 — src/lib/review.ts의 SELF_CHECK_ANCHOR.
// section-tape.tsx의 "플러그인 없이 간다" 주석은 테이프 스크롤 문제에 국한된
// 결정이었다 — 이번엔 서버 렌더 링크의 착지점이 필요하므로 사유가 다르다.
import rehypeSlug from "rehype-slug";
// 책으로 읽기(book reader, quick 260904-a1o) 본문 컴파일용. 레슨 개념 섹션에
// GFM 표(자료형 4종 등)가 있어 remark-gfm이 필요하다 — velite의 s.mdx()도
// 내부에서 같은 플러그인을 켠다(gfm 기본 on). @mdx-js/mdx의 compile은 아래
// compileBookMdx에서 동적 import한다(velite 자신도 같은 방식으로 부른다).
import remarkGfm from "remark-gfm";

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

// ── 책으로 읽기(book reader, quick 260904-a1o) ──────────────────────────
// 레슨을 "레슨 모음"이 아니라 한 권의 책처럼 이어 읽게 하는 전용 본문(bookCode)을
// 빌드 타임에 만든다. 레슨 헤딩 구조는 게이트 L1이 전 레슨 동일하게 강제하므로
// (## 1.학습목표 / 2.왜 배우나 / 3.개념 설명 / 4.실무 예제 / 5.실무 팁 /
// 6.핵심 정리·스스로 점검), 고정된 "## N." 헤딩으로 안전하게 잘라낼 수 있다.
//
// 남기는 것: "## 2"(왜 배우나) + "## 3"(개념 설명 — 비유·SVG 다이어그램·TwistBox)
//           본문 + 끝의 <NextTeaser>(다음 챕터로 넘어가는 다리).
// 걷어내는 것: "## 2"/"## 3" 라벨 헤딩 자체(챕터 제목은 페이지가 레슨 title로
//           찍는다), 1·4·5·6 섹션과 RunPython/RunSQL/PredictPrompt 학습 장치.
function sliceBookContent(raw: string): string {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const findIdx = (re: RegExp) => lines.findIndex((l) => re.test(l));
  const i2 = findIdx(/^##\s*2\.\s/);
  const i4 = findIdx(/^##\s*4\.\s/);
  // 구조가 어긋나면(게이트가 이미 막지만 방어) 빈 문자열 — 페이지가 폴백한다.
  if (i2 === -1 || i4 === -1 || i4 <= i2) return "";
  const body = lines
    .slice(i2, i4)
    .filter((l) => !/^##\s*[23]\.\s/.test(l)); // "## 2." / "## 3." 라벨 헤딩 제거

  // <NextTeaser>…</NextTeaser> 블록은 6장 뒤(잘라낸 범위 밖)에 있으므로 따로
  // 찾아 이어 붙인다. 없는 레슨(예: 마지막 런칭 프로젝트)도 있어 선택적이다.
  const open = lines.findIndex((l) => l.trim() === "<NextTeaser>");
  const close = lines.findIndex((l) => l.trim() === "</NextTeaser>");
  const teaser = open !== -1 && close !== -1 && close > open ? lines.slice(open, close + 1) : [];

  return [body.join("\n").trim(), teaser.join("\n").trim()].filter(Boolean).join("\n\n");
}

// 잘라낸 마크다운을 렌더 런타임(mdx-content.tsx의 new Function(code))이 그대로
// 소비할 수 있는 function-body 문자열로 컴파일한다. velite의 s.mdx()가 쓰는 것과
// 같은 @mdx-js/mdx compile을 직접 부른다 — 앵커 중복을 피하려 rehypeSlug는 빼고
// (책은 앵커가 필요 없다), 표·코드 하이라이트를 위해 remarkGfm·rehypePrettyCode는
// 켠다. 축약(terser)은 하지 않는다 — new Function은 비축약 function-body도 그대로 돈다.
async function compileBookMdx(md: string): Promise<string> {
  if (!md) return "";
  const { compile } = await import("@mdx-js/mdx");
  const compiled = await compile(
    { value: md },
    {
      outputFormat: "function-body",
      remarkPlugins: [remarkGfm],
      rehypePlugins: [[rehypePrettyCode, rehypePrettyCodeOptions]],
    },
  );
  return String(compiled);
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
        .transform(async (data, { meta }) => ({
          ...data,
          permalink: `/lesson/${data.slug}`,
          // 책으로 읽기 전용 본문(quick 260904-a1o). hasContent=false 스텁은
          // terms/selfCheck와 같은 게이트 패턴으로 빈 문자열이다.
          bookCode: data.hasContent
            ? await compileBookMdx(sliceBookContent(meta.content ?? ""))
            : "",
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
