import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { pages } from "#site/content";
import { MDXContent } from "@/components/mdx-content";

const GITHUB_REPO_URL = "https://github.com/dhchun1203/ai-engineer-runway";

export const metadata: Metadata = {
  title: "소개",
};

// Making-of 소개 페이지 — 콘텐츠 소스는 docs/making-of.md 단 하나다 (PLAT-03).
// GSD 계획 산출물(개인 메모·과정 문서)은 여기서 렌더하지 않는다.
export default function AboutPage() {
  const page = pages.find((p) => p.slug === "making-of");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-[28px] font-semibold leading-[1.2]">{page?.title ?? "소개"}</h1>

      {page ? (
        <div
          className="prose prose-slate max-w-none dark:prose-invert
            [&_h3]:relative [&_h3]:mt-10 [&_h3]:pl-6 [&_h3]:before:absolute [&_h3]:before:left-0
            [&_h3]:before:top-[0.4em] [&_h3]:before:h-3 [&_h3]:before:w-3 [&_h3]:before:rounded-full
            [&_h3]:before:bg-accent [&_h3]:before:content-[''] dark:[&_h3]:before:bg-accent-dark
            [&_h3]:border-l-2 [&_h3]:border-badge-neutral-bg [&_h3]:pb-2 dark:[&_h3]:border-badge-neutral-bg-dark"
        >
          <MDXContent code={page.code} />
        </div>
      ) : null}

      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-11 w-fit items-center gap-2 rounded-lg border border-badge-neutral-bg px-4 text-[16px] font-normal leading-[1.6] text-accent hover:bg-badge-neutral-bg dark:border-badge-neutral-bg-dark dark:text-accent-dark dark:hover:bg-badge-neutral-bg-dark"
      >
        GitHub에서 코드 보기
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
      </a>
    </main>
  );
}
