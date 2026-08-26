import { defineConfig, s } from "velite";
import rehypePrettyCode from "rehype-pretty-code";
// 상대 경로로 import한다 — Velite는 이 설정 파일을 esbuild로 번들하므로
// tsconfig의 `@/*` 별칭(paths)이 적용되지 않는다. 별칭으로 바꾸면 플러그인이
// 조용히 아예 실행되지 않아(모듈을 못 찾아 빌드 자체가 실패하거나, 최악의
// 경우 오번들로 무동작) 이후의 모든 어설션이 공허해진다(plan-check 지적).
import remarkClozeBlanks from "./src/lib/remark-cloze-blanks";

// 복사 버튼은 여기서 만들지 않는다. @rehype-pretty/transformers의
// transformerCopyButton은 인라인 onclick을 *문자열*로 내보내는데, 컴파일된 MDX가
// React 엘리먼트로 렌더되는 이 프로젝트에서는 React가 문자열 핸들러를 거부해
// 버튼이 아무 일도 하지 않았다 (04-UI-REVIEW Priority Fix 1).
// 대신 src/components/code-block.tsx가 <pre>를 감싸 실제 핸들러를 붙인다.
const rehypePrettyCodeOptions = {
  theme: { dark: "github-dark-dimmed", light: "github-light" },
};

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
    // 클로즈 빈칸 추출(CONT-07) — 개념 설명 구간의 문단에서 저자가 이미
    // 강조해 둔 용어 하나를 ClozeBlank로 치환한다. rehypePlugins보다 먼저
    // mdast 단계에서 실행되어야 <strong>/<code>로 변환되기 전에 원본
    // 강조 노드를 볼 수 있다.
    remarkPlugins: [remarkClozeBlanks],
    rehypePlugins: [[rehypePrettyCode, rehypePrettyCodeOptions]],
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
        .transform((data) => ({ ...data, permalink: `/lesson/${data.slug}` })),
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
