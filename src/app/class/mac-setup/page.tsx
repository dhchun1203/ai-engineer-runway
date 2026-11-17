import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { guides } from "#site/content";
import { MDXContent } from "@/components/mdx-content";
import { PrintButton } from "@/components/print-button";
import { StageChips } from "@/components/stage-chips";
import { lessonFigureComponents } from "@/components/lesson-figures/lesson-figure-components";

// 맥 실습 환경 안내(2026-11-17) — 완전 정적. 회차 레슨과 같은 읽기 셸(위에 따라오는 목차 막대,
// 그림 부품)을 쓰지만 퀴즈와 진도는 없다. 본문은 src/content/guides/mac-setup.mdx.

const GUIDE_SLUG = "mac-setup";
const ARTICLE_ID = "guide-article";

function getGuide() {
  return guides.find((g) => g.slug === GUIDE_SLUG);
}

export function generateMetadata(): Metadata {
  const guide = getGuide();
  if (!guide) return {};
  return { title: `${guide.title} | 수업 복습`, description: guide.summary };
}

export default function MacSetupPage() {
  const guide = getGuide();
  if (!guide) notFound();
  const [, month, day] = guide.updated.split("-").map(Number);

  return (
    <main className="relative mx-auto flex w-full max-w-3xl min-[1800px]:max-w-4xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link
            href="/class"
            data-print-hide
            className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            수업 복습
          </Link>
          <h1 className="text-display font-black break-keep">{guide.title}</h1>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip text-label font-bold">실습 환경</span>
              <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {month}월 {day}일 기준, 약 {guide.readingMinutes}분 읽기
              </span>
            </div>
            <PrintButton />
          </div>
        </header>

        <StageChips contentId={ARTICLE_ID} compact />

        <div id={ARTICLE_ID} className="prose dark:prose-invert max-w-none">
          <MDXContent code={guide.code} components={lessonFigureComponents} />
        </div>
      </article>
    </main>
  );
}
