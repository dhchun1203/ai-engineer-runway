import { defineConfig, s } from "velite";
import rehypePrettyCode from "rehype-pretty-code";
import { transformerCopyButton } from "@rehype-pretty/transformers";

const rehypePrettyCodeOptions = {
  theme: { dark: "github-dark-dimmed", light: "github-light" },
  transformers: [
    transformerCopyButton({ visibility: "always", feedbackDuration: 3_000 }),
  ],
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
  },
});
