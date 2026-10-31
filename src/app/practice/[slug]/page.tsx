import type { Metadata } from "next";
import type { ComponentType } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MDXContent } from "@/components/mdx-content";
import { ReadingAssistant } from "@/components/reading-assistant/reading-assistant";
import { PageBookmark } from "@/components/page-bookmark";
import { StageChips } from "@/components/practice/stage-chips";
import { TypeAlong } from "@/components/practice/type-along";
import { Hints, Hint } from "@/components/practice/hints";
import {
  getAdjacentPracticeUnits,
  getOrderedPracticeUnits,
  getPracticeUnitBySlug,
} from "@/content/practice-helpers";

// 파이썬 손풀기 단원 리더. 완전 정적이다(수업 복습 레슨 리더와 같은 셸). 완료 체크는 개인
// 진도를 읽어야 해서 목록(/practice)에 둔다.

const PRACTICE_ARTICLE_ID = "practice-article";

const practiceComponents: Record<string, ComponentType> = {
  TypeAlong: TypeAlong as ComponentType,
  Hints: Hints as ComponentType,
  Hint: Hint as ComponentType,
};

export function generateStaticParams() {
  return getOrderedPracticeUnits().map((unit) => ({ slug: unit.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const unit = getPracticeUnitBySlug(slug);
  if (!unit) return {};
  return { title: `${unit.title} | 파이썬 손풀기`, description: unit.summary };
}

export default async function PracticeUnitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const unit = getPracticeUnitBySlug(slug);
  if (!unit) {
    notFound();
  }
  const { prev, next } = getAdjacentPracticeUnits(slug);
  const hours = Math.round((unit.minutes / 60) * 10) / 10;

  return (
    <main className="relative mx-auto flex w-full max-w-3xl min-[1800px]:max-w-4xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <PageBookmark pageKey={`practice:${unit.slug}`} pageTitle={unit.title} articleId={PRACTICE_ARTICLE_ID} />
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link
            href="/practice"
            data-print-hide
            className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            파이썬 손풀기
          </Link>
          <h1 className="text-display font-black break-keep">{unit.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip text-label font-bold">{unit.unit}단원</span>
            <span className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
              약 {hours}시간, 오늘 붙는 기능: {unit.feature}
            </span>
          </div>
        </header>

        {/* 단계 막대는 모든 폭에서 위에 붙어 따라온다. 그래서 왼쪽 목차(LessonToc)는 두지 않는다. */}
        <StageChips contentId={PRACTICE_ARTICLE_ID} />

        <div id={PRACTICE_ARTICLE_ID} className="prose dark:prose-invert max-w-none">
          <MDXContent code={unit.code} components={practiceComponents} />
        </div>

        <nav aria-label="이어지는 단원" data-print-hide className="hairline flex flex-col gap-3 pt-6">
          {prev || next ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link href={prev.permalink} className="card-interactive panel flex min-h-11 flex-col gap-1 p-4">
                  <span className="inline-flex items-center gap-1.5 text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                    <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                    이전 단원, {prev.unit}단원
                  </span>
                  <span className="text-body font-bold break-keep">{prev.title}</span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {next ? (
                <Link href={next.permalink} className="card-interactive panel flex min-h-11 flex-col gap-1 p-4 sm:items-end sm:text-right">
                  <span className="inline-flex items-center gap-1.5 text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                    다음 단원, {next.unit}단원
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                  <span className="text-body font-bold break-keep">{next.title}</span>
                </Link>
              ) : null}
            </div>
          ) : null}
          <Link
            href="/practice"
            className="card-interactive panel flex min-h-11 items-center justify-between gap-2 p-4 text-body font-bold"
          >
            목록에서 완료 체크하기
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </nav>
      </article>

      {/* 독서 도우미 — 본문을 문장 단위로 확대하며 읽어 준다. */}
      <ReadingAssistant articleId={PRACTICE_ARTICLE_ID} />
    </main>
  );
}
