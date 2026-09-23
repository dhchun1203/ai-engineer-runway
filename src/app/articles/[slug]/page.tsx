import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { MDXContent } from "@/components/mdx-content";
import {
  formatKoreanDate,
  getArticleBySlug,
  getSortedArticles,
} from "@/content/article-helpers";
import { ArticleNote } from "@/components/article-note";
import { BasecampCopyPrompt } from "@/components/lesson-copy-prompt";
import { PrintButton } from "@/components/print-button";
import { ReadingAssistant } from "@/components/reading-assistant/reading-assistant";
import { TermPanelProvider, Term } from "@/components/roadmap/term-panel";
import type { ComponentType } from "react";

// 아티클 상세 — 완전 정적. basecamp/[slug] 리더와 같은 셸에 출처, 원문 열기,
// 세 줄 요약 카드, 함께 보기를 얹는다. 진도와 복습은 없다(격리 컬렉션).

const ARTICLE_BODY_ID = "article-body";

export function generateStaticParams() {
  return getSortedArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return { title: `${article.title} · 아티클`, description: article.summary[0] };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="note-page-spacer mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link
            href="/articles"
            data-print-hide
            className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            아티클
          </Link>
          <h1 className="text-display font-black break-keep">{article.title}</h1>
          <p className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            <span>{article.source}</span>
            {article.author ? <span>, {article.author}</span> : null}
            <span className="mx-2" aria-hidden="true">|</span>
            <span>{formatKoreanDate(article.publishedAt)}</span>
          </p>
          <p lang="en" className="break-words text-label font-normal text-muted dark:text-muted-dark">
            원제: {article.originalTitle}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip text-label font-bold">아티클</span>
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/articles?tag=${encodeURIComponent(tag)}`}
                  className="tap-feedback inline-flex min-h-11 items-center"
                >
                  <span className="chip text-label font-semibold">{tag}</span>
                </Link>
              ))}
              <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                약 {article.readingMinutes}분 읽기
              </span>
            </div>
            <span className="flex flex-wrap items-start gap-2" data-print-hide>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card-interactive panel inline-flex min-h-11 items-center gap-1.5 px-4 text-label font-bold"
              >
                원문 열기
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>
              <BasecampCopyPrompt lessonTitle={article.title} articleId={ARTICLE_BODY_ID} />
              <PrintButton />
              <PrintButton annotate label="필기 여백으로 저장" />
            </span>
          </div>
        </header>

        {/* 용어 패널 프로바이더로 본문을 감싼다. 본문 안 <Term>이 우측 설명 패널을
            연다(로드맵 레슨과 같은 부품, 공용 용어 사전). */}
        <TermPanelProvider>
        <div id={ARTICLE_BODY_ID} className="prose dark:prose-invert max-w-none">
          <div className="not-prose panel flex flex-col gap-2 p-5">
            <p className="text-label font-bold text-accent dark:text-accent-dark">세 줄 요약</p>
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-body leading-relaxed break-keep">
              {article.summary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </div>
          <MDXContent code={article.code} components={{ Term: Term as ComponentType }} />
        </div>
        </TermPanelProvider>

        {article.related.length > 0 ? (
          <nav aria-label="함께 보기" data-print-hide className="hairline flex flex-col gap-3 pt-6">
            <span className="text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
              함께 보기
            </span>
            {article.related.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="card-interactive panel flex min-h-11 items-center p-4 text-body font-bold break-keep"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <nav aria-label="아티클 목록으로" data-print-hide className="hairline pt-6">
          <Link
            href="/articles"
            className="card-interactive panel flex min-h-11 items-center gap-2 p-4 text-body font-bold"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            아티클 전체 보기
          </Link>
        </nav>
      </article>

      <ArticleNote slug={article.slug} />

      <ReadingAssistant articleId={ARTICLE_BODY_ID} />
    </main>
  );
}
