import { existsSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { defineConfig, s } from "velite";
import {
  ARTICLE_OPTIONAL_SECTIONS,
  ARTICLE_SECTIONS,
  ARTICLE_TAGS,
  isArticleTag,
} from "./src/content/article-tags";
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
// 책 표지에 "약 N분 읽기"를 정직하게 찍기 위한 대략 읽기 시간(분). 잘라낸
// 마크다운에서 SVG 다이어그램·HTML 태그·코드펜스·마크다운 기호를 걷어내 순수
// 읽는 글자 수만 세고, 한국어 읽기 속도(대략 분당 500자)로 나눈다. 최소 1분.
function estimateBookMinutes(md: string): number {
  if (!md) return 0;
  const text = md
    .replace(/<svg[\s\S]*?<\/svg>/gi, "") // 다이어그램은 읽는 시간이 아니다
    .replace(/```[\s\S]*?```/g, "") // 코드펜스 제거
    .replace(/<[^>]+>/g, "") // 남은 HTML/JSX 태그
    .replace(/[#>*_`|~\-]/g, ""); // 마크다운 기호
  const chars = text.replace(/\s+/g, "").length;
  return Math.max(1, Math.round(chars / 500));
}

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

// 아티클 본문 h2 검사 — ARTICLE_SECTIONS 순서와 같아야 하고, 선택 h2
// (ARTICLE_OPTIONAL_SECTIONS)만 빠질 수 있다. 모르는 h2나 중복은 실패.
// 코드펜스 안의 "## "는 헤딩이 아니므로 건너뛴다(parseSelfCheck와 같은 방어).
function assertArticleSections(content: string, file: string): void {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const headings: string[] = [];
  let inFence = false;
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && /^## /.test(line)) headings.push(line.slice(3).trim());
  }
  const expected = ARTICLE_SECTIONS.filter(
    (s) => headings.includes(s) || !ARTICLE_OPTIONAL_SECTIONS.includes(s),
  );
  const ok =
    headings.length === expected.length && headings.every((h, i) => h === expected[i]);
  if (!ok) {
    throw new Error(
      `articles: ${file}의 h2는 [${ARTICLE_SECTIONS.join(" / ")}] 순서여야 합니다(선택: ${ARTICLE_OPTIONAL_SECTIONS.join(", ")}). 실제: [${headings.join(" / ")}]`,
    );
  }
}

// 원문 url 중복 판별 키 — 호스트(소문자) + 끝 슬래시 뗀 경로. 쿼리와 해시는 무시한다.
function articleUrlKey(raw: string): string {
  const u = new URL(raw);
  return `${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, "")}`;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

// articles 파일 목록을 디스크에서 직접 훑는다(velite의 pattern glob과 별개 구현).
// 이유: velite는 non-strict 모드에서 필드 하나가 "타입 자체"를 못 맞추면(예: enum에
// 없는 값) 이슈만 콘솔에 찍고 그 문서를 조용히 컬렉션에서 통째로 제외한다 —
// .transform()도 돌지 않으므로 위 tags/summary 재검사(prepare 안)조차 그 문서를
// 못 본다. 파일 수와 실제 articles.length를 대조해 "빠진 문서가 있다"를 잡아내는
// 마지막 방어선이다.
function listArticleMdxFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listArticleMdxFiles(full));
    else if (entry.isFile() && extname(entry.name) === ".mdx") out.push(full);
  }
  return out;
}

const ARTICLES_DIR = "src/content/articles";

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
          bookMinutes: data.hasContent
            ? estimateBookMinutes(sliceBookContent(meta.content ?? ""))
            : 0,
          // hasContent:false 스텁은 파싱하지 않는다(terms: []) — L5 게이트가
          // hasContent:true인 레슨만 검사하는 것과 정확히 대칭이다(round2-j
          // 권장 경로 1). 현재 스텁 0편이지만 미래 방어로 남긴다.
          terms: data.hasContent ? parseTermTable(meta.content ?? "") : [],
          // /review 세션(quick 260901-w04)이 소비하는 문항 배열 — 인덱스가 곧
          // questionIndex다. terms와 정확히 같은 hasContent 게이트 패턴.
          selfCheck: data.hasContent ? parseSelfCheck(meta.content ?? "") : [],
        })),
    },
    // 번외 커리큘럼 "AI 뜯어보기"(concepts) — Step 1~3 정규 레슨과 완전히 별개다.
    // 진행률(progress-math)·일정(schedule-data)·복습(review)·용어집(glossary)은
    // 전부 lessons 컬렉션만 소비하므로, 이 컬렉션은 구조적으로 그 어디에도 집계되지
    // 않는다(2026-09-07 사용자 요구: 진도·일정에 영향 없음). 레슨의 6단 게이트·용어표·
    // 자가진단 파서도 타지 않는 자유 형식이다 — parseTermTable/parseSelfCheck를 부르지
    // 않는다. 읽기 시간만 책 리더와 같은 estimateBookMinutes로 정직하게 찍는다.
    concepts: {
      name: "Concept",
      pattern: "src/content/concepts/**/*.mdx",
      schema: s
        .object({
          title: s.string(),
          order: s.number(), // 번외 내 순서(1..N) — 인접 이동·인덱스 정렬 기준
          icon: s.string(), // 카드·헤더용 이모지
          summary: s.string(), // 인덱스 카드 한 줄 훅
          slug: s.slug("concepts"),
          code: s.mdx(),
        })
        .transform((data, { meta }) => ({
          ...data,
          permalink: `/concepts/${data.slug}`,
          readingMinutes: estimateBookMinutes(meta.content ?? ""),
        })),
    },
    // 취업 목표 트랙 "채널톡 AI Engineer 로드맵"의 별도 심화 레슨(roadmapLessons).
    // concepts와 같은 자유 형식 MDX이고, 정규 레슨의 6단 게이트·용어표·자가진단을
    // 타지 않는다. 다만 concepts(선행 개념 이해)와 목적이 다르다 — 여기는 채널톡이
    // 실제 요구하는 실무/프로덕션 깊이의 별도 학습 콘텐츠다. 진행률·일정·복습은
    // lessons 컬렉션만 소비하므로 이 컬렉션도 그 어디에도 집계되지 않는다(격리).
    roadmapLessons: {
      name: "RoadmapLesson",
      pattern: "src/content/roadmap-lessons/**/*.mdx",
      schema: s
        .object({
          title: s.string(),
          stageId: s.string(), // 로드맵 단계 id(예: "evals") — 단계와 잇는 열쇠
          order: s.number(), // 트랙 내 순서
          summary: s.string(), // 로드맵/헤더용 한 줄 훅
          slug: s.slug("roadmap-lessons"),
          code: s.mdx(),
        })
        .transform((data, { meta }) => ({
          ...data,
          permalink: `/roadmap/${data.slug}`,
          readingMinutes: estimateBookMinutes(meta.content ?? ""),
        })),
    },
    // 베이스캠프(개강 전 공식 선행 과제) 전용 학습 레슨(basecampLessons). concepts·
    // roadmapLessons와 같은 자유 형식 MDX이고, 정규 레슨의 6단 게이트·용어표·자가진단을
    // 타지 않는다. 목적은 공식 과제 주제를 우리 말(eli5)로 풀어 학습시키는 것 — 진행률·
    // 일정·복습은 lessons 컬렉션만 소비하므로 이 컬렉션도 어디에도 집계되지 않는다(격리).
    basecampLessons: {
      name: "BasecampLesson",
      pattern: "src/content/basecamp-lessons/**/*.mdx",
      schema: s
        .object({
          title: s.string(),
          order: s.number(), // 베이스캠프 레슨 내 순서
          summary: s.string(), // 헤더·연결용 한 줄 훅
          slug: s.slug("basecampLessons"),
          code: s.mdx(),
        })
        .transform((data, { meta }) => ({
          ...data,
          permalink: `/basecamp/${data.slug}`,
          readingMinutes: estimateBookMinutes(meta.content ?? ""),
        })),
    },
    // 아티클(현업 엔지니어링 기사를 우리 말로 푼 요약) — 격리 컬렉션. 진도·일정·
    // 복습은 lessons만 소비하므로 어디에도 집계되지 않는다. 설계:
    // docs/superpowers/specs/2026-09-23-articles-section-design.md
    articles: {
      name: "Article",
      pattern: "src/content/articles/**/*.mdx",
      schema: s
        .object({
          title: s.string(),
          originalTitle: s.string(),
          source: s.string(),
          author: s.string().optional(),
          publishedAt: s.string().regex(ISO_DAY),
          addedAt: s.string().regex(ISO_DAY),
          url: s.string().url(),
          tags: s.array(s.enum(ARTICLE_TAGS)).min(1).max(3),
          summary: s.array(s.string().min(1)).length(3),
          related: s
            .array(s.object({ label: s.string(), href: s.string().regex(/^\/(?!\/)/) }))
            .default([]),
          origin: s.enum(["manual", "auto"]),
          slug: s.slug("articles"),
          code: s.mdx(),
        })
        .transform((data, { meta }) => {
          assertArticleSections(meta.content ?? "", String(meta.path));
          return {
            ...data,
            permalink: `/articles/${data.slug}`,
            readingMinutes: estimateBookMinutes(meta.content ?? ""),
          };
        }),
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
  // 컬렉션 전체를 봐야 하는 검사 — 원문 url 중복은 항목 단위 transform으로는 못 잡는다.
  //
  // tags/summary 재검사(일부러 스키마와 중복): velite는 기본(non-strict) 모드에서
  // zod 스키마 위반(.min/.max/.length 등)을 빌드 실패로 이어가지 않고 콘솔에
  // info/warning으로만 찍고 넘어간다(config.strict를 true로 켜야 throw하는데,
  // 이 프로젝트는 전역 strict를 켜지 않기로 함). Spec 3.2가 "summary 개수, tags
  // 범위 위반은 velite 빌드 실패로 막는다"를 명시하므로, 여기서 같은 규칙을
  // 다시 한 번 명시적으로 검사해 throw한다. **articles 스키마의 tags/summary
  // 제약을 바꾸면 이 블록도 반드시 함께 바꿀 것.**
  prepare: ({ articles }) => {
    const problems: string[] = [];

    for (const article of articles) {
      const where = `${article.slug} (${article.url})`;

      if (
        !Array.isArray(article.tags) ||
        article.tags.length < 1 ||
        article.tags.length > 3 ||
        article.tags.some((t) => !isArticleTag(t))
      ) {
        problems.push(
          `articles: ${where}의 tags는 ARTICLE_TAGS 안에서 1~3개여야 합니다. 실제: [${(article.tags ?? []).join(" / ")}]`,
        );
      }

      if (
        !Array.isArray(article.summary) ||
        article.summary.length !== 3 ||
        article.summary.some((line) => typeof line !== "string" || line.trim() === "")
      ) {
        problems.push(
          `articles: ${where}의 summary는 빈 줄 없이 정확히 3줄이어야 합니다. 실제: ${article.summary?.length ?? 0}줄`,
        );
      }
    }

    const seen = new Map<string, string>();
    for (const article of articles) {
      const key = articleUrlKey(article.url);
      const prev = seen.get(key);
      if (prev) {
        problems.push(`articles: 원문 url 중복 ${article.url} (${prev}, ${article.slug})`);
      } else {
        seen.set(key, article.slug);
      }
    }

    // 마지막 방어선: 위 tags/summary 재검사는 "문서가 articles 배열에 있다"를
    // 전제한다. enum에 없는 값처럼 타입 자체가 안 맞는 위반은 velite가 문서를
    // 통째로 배열에서 빼버려 위 검사가 아예 못 본다 — 그래서 디스크의 .mdx 파일
    // 수와 실제 articles.length를 대조해 조용히 빠진 문서가 있는지 확인한다.
    const onDisk = listArticleMdxFiles(ARTICLES_DIR);
    if (onDisk.length !== articles.length) {
      const presentSlugs = new Set(articles.map((a) => a.slug));
      const missing = onDisk.filter((f) => !presentSlugs.has(basename(f, ".mdx")));
      problems.push(
        `articles: ${ARTICLES_DIR}에 .mdx 파일이 ${onDisk.length}개인데 컬렉션에는 ${articles.length}개만 있습니다 — 스키마 검증에 실패해 조용히 제외된 문서가 있습니다(바로 위 velite issues 로그 참고). 의심 파일: ${missing.length > 0 ? missing.join(", ") : "(파일명으로 특정 불가, 위 issues 로그 참고)"}`,
      );
    }

    if (problems.length > 0) {
      throw new Error(problems.join("\n"));
    }
  },
});
