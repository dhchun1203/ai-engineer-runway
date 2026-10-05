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
// 세 줄 요약, 함께 보기를 얹는다. 진도와 복습은 없다(격리 컬렉션).
// 지면은 목록(/articles)과 같은 신문 컨셉이다: 이중 괘선 아래 꼬리표와 명조 제목,
// 바이라인 줄, 요약 상자, 굵은 괘선으로 나뉜 소제목, 끝 표시. 본문은 읽기 편하도록
// 한 단으로 둔다. 형태 규칙은 globals.css의 .news-* 클래스에 있다.

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

          {/* 신문 기사 머리: 이중 괘선 아래 분야 꼬리표, 명조 제목, 원제(부제), 바이라인 줄. */}
          <div className="news-sheet flex flex-col gap-4 pt-5">
            <div className="flex flex-wrap items-center gap-x-4">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/articles?tag=${encodeURIComponent(tag)}`}
                  className="news-kicker-link tap-feedback inline-flex min-h-11 items-center text-label font-bold text-action dark:text-action-dark"
                >
                  {tag}
                </Link>
              ))}
            </div>
            <h1 className="news-serif -mt-2 text-display font-black break-keep">{article.title}</h1>
            {/* 기울임은 영어 원제에만 — 한글은 기울임 자형이 없어 억지로 비스듬해진다. */}
            <p className="news-serif break-words text-subhead font-normal text-muted dark:text-muted-dark">
              원제:{" "}
              <span lang="en" className="italic">
                {article.originalTitle}
              </span>
            </p>
            {/* 바이라인은 두 줄로 고정한다. 한 줄에 몰면 좁은 화면에서 "| 약 10분 읽기"처럼
                구분선을 단 채 다음 줄로 넘어간다. */}
            <div className="flex flex-col gap-0.5 border-y border-line py-3 text-label dark:border-line-dark">
              <span className="font-bold break-keep">
                {article.author ? `${article.source}, ${article.author}` : article.source}
              </span>
              <span className="font-semibold text-muted dark:text-muted-dark">
                {formatKoreanDate(article.publishedAt)}
                <span className="mx-2" aria-hidden="true">
                  |
                </span>
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
            연다(로드맵 레슨과 같은 부품, 공용 용어 사전). news-article은 신문 지면용
            본문 덧칠(globals.css)이다. */}
        <TermPanelProvider>
        <div id={ARTICLE_BODY_ID} className="news-article prose dark:prose-invert max-w-none">
          <div className="news-summary not-prose flex flex-col gap-3 py-5">
            <p className="text-label font-bold">세 줄 요약</p>
            <ol className="news-serif flex list-decimal flex-col gap-2 pl-6 text-subhead leading-relaxed break-keep">
              {article.summary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </div>
          <MDXContent code={article.code} components={{ Term: Term as ComponentType }} />
          <span className="news-endmark not-prose" aria-hidden="true" />
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
