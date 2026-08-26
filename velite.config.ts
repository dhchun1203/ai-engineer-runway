import { defineConfig, s } from "velite";
import rehypePrettyCode from "rehype-pretty-code";

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
