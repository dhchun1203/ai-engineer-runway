import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MDXContent } from "@/components/mdx-content";
import { getAdjacentClassLessons, getClassLessonBySlug, getOrderedClassLessons } from "@/content/class-lesson-helpers";
import { getLessonBySlug } from "@/content/curriculum-helpers";
import { getClassSession } from "@/content/class-sessions";
import { BasecampQuizSet } from "@/components/basecamp/basecamp-quiz-set";
import { BasecampCopyPrompt } from "@/components/lesson-copy-prompt";
import { MistakeNoteLink } from "@/components/mistake-note-link";
import { PrintButton } from "@/components/print-button";
import { ReadingAssistant } from "@/components/reading-assistant/reading-assistant";
import { LessonToc } from "@/components/roadmap/lesson-toc";
import { classQuizKey } from "@/lib/quiz-mistake-key";

// 수업 복습 레슨 리더 — 완전 정적(베이스캠프 레슨 리더와 같은 셸). 본문 아래 확인 퀴즈는
// 클라이언트에서 채점하고 Server Action으로 오답 노트에 기록한다(cl: 키). 복습 체크리스트는
// 개인 진도를 읽어야 해서 동적 허브(/class)에 둔다.

const CLASS_ARTICLE_ID = "class-article";

export function generateStaticParams() {
  return getOrderedClassLessons().map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getClassLessonBySlug(slug);
  if (!lesson) return {};
  return { title: `${lesson.title} | 수업 복습`, description: lesson.summary };
}

export default async function ClassLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getClassLessonBySlug(slug);
  if (!lesson) {
    notFound();
  }
  const quiz = getClassSession(slug)?.quiz ?? [];
  const [, month, day] = lesson.date.split("-").map(Number);
  const { prev, next } = getAdjacentClassLessons(slug);
  // 개강 전에 읽은 관련 레슨. 같은 모듈이라도 내용이 다른 레슨은 잇지 않도록 회차마다
  // frontmatter preStudy에 직접 고른 것만 보여 준다(velite prepare가 slug를 검사).
  const preStudy = lesson.preStudy.flatMap((s) => {
    const found = getLessonBySlug(s);
    return found ? [found] : [];
  });

  return (
    <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      {/* 스크롤을 따라다니는 목차(로드맵 레슨과 같은 것). 넓은 화면의 왼쪽 여백에만 뜬다. */}
      <LessonToc contentId={CLASS_ARTICLE_ID} />
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
          <h1 className="text-display font-black break-keep">{lesson.title}</h1>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip text-label font-bold">{lesson.session}회차</span>
              <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {month}월 {day}일 수업, 약 {lesson.readingMinutes}분 읽기
              </span>
            </div>
            <span className="flex flex-wrap items-start gap-2">
              <BasecampCopyPrompt lessonTitle={lesson.title} articleId={CLASS_ARTICLE_ID} />
              <PrintButton />
              <PrintButton annotate label="필기 여백으로 저장" />
            </span>
          </div>
        </header>

        <div id={CLASS_ARTICLE_ID} className="prose dark:prose-invert max-w-none">
          <MDXContent code={lesson.code} />
        </div>

        {quiz.length > 0 ? (
          <section data-print-hide className="panel flex flex-col gap-4 p-5">
            <header className="flex flex-col gap-1.5">
              <span className="text-label font-bold text-accent dark:text-accent-dark">확인 퀴즈</span>
              <h2 className="text-heading font-extrabold break-keep">오늘 수업, 꺼내 보기</h2>
              <p className="break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {quiz.length}문항이에요. 고르는 즉시 정답과 해설이 나오고, 틀린 문제는 오답 노트에 모여요.
              </p>
            </header>
            <BasecampQuizSet questions={quiz} keys={quiz.map((q) => classQuizKey(lesson.slug, q.id))} />
            <MistakeNoteLink prefix={`cl:${lesson.slug}:`} variant="step" scope="이 수업" />
          </section>
        ) : null}

        <nav aria-label="이어지는 수업" data-print-hide className="hairline flex flex-col gap-3 pt-6">
          {prev || next ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link href={prev.permalink} className="card-interactive panel flex min-h-11 flex-col gap-1 p-4">
                  <span className="inline-flex items-center gap-1.5 text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                    <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                    이전 수업, {prev.session}회차
                  </span>
                  <span className="text-body font-bold break-keep">{prev.title}</span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {next ? (
                <Link href={next.permalink} className="card-interactive panel flex min-h-11 flex-col gap-1 p-4 sm:items-end sm:text-right">
                  <span className="inline-flex items-center gap-1.5 text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                    다음 수업, {next.session}회차
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                  <span className="text-body font-bold break-keep">{next.title}</span>
                </Link>
              ) : null}
            </div>
          ) : null}
          {preStudy.length > 0 ? (
            <div className="panel flex flex-col gap-3 p-4">
              <span className="text-label font-bold break-keep">개강 전에 읽은 관련 레슨</span>
              <span className="flex flex-wrap gap-2">
                {preStudy.map((l) => (
                  <Link key={l.slug} href={l.permalink} className="chip tap-feedback min-h-11 items-center break-keep">
                    {l.title}
                  </Link>
                ))}
              </span>
            </div>
          ) : null}
          <Link
            href="/class"
            className="card-interactive panel flex min-h-11 items-center justify-between gap-2 p-4 text-body font-bold"
          >
            복습 체크리스트 채우러 가기
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </nav>
      </article>

      <ReadingAssistant articleId={CLASS_ARTICLE_ID} />
    </main>
  );
}
