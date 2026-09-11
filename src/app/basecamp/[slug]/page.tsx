import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MDXContent } from "@/components/mdx-content";
import {
  getBasecampLessonBySlug,
  getOrderedBasecampLessons,
} from "@/content/basecamp-lesson-helpers";

// 베이스캠프 전용 학습 레슨 리더 — 완전 정적. concepts·roadmap 리더와 같은 셸이되
// 진도·완료·복습·북마크가 전혀 없다(격리 컬렉션). 콘텐츠는 basecampLessons에서 온다.

export function generateStaticParams() {
  return getOrderedBasecampLessons().map((lesson) => ({ slug: lesson.slug }));
}

// 새 라우트라 Next의 타입드 라우트(PageProps<"/basecamp/[slug]">)에 아직 없으므로
// params를 직접 타이핑한다(빌드 전 tsc에서도 통과). App Router 표준 형태다.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getBasecampLessonBySlug(slug);
  if (!lesson) return {};
  return { title: `${lesson.title} · 베이스캠프`, description: lesson.summary };
}

export default async function BasecampLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getBasecampLessonBySlug(slug);

  if (!lesson) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link
            href="/basecamp"
            className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            베이스캠프
          </Link>
          <h1 className="text-display font-black break-keep">{lesson.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip text-label font-bold">베이스캠프 학습</span>
            <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
              약 {lesson.readingMinutes}분 읽기
            </span>
          </div>
        </header>

        <div className="prose dark:prose-invert max-w-none">
          <MDXContent code={lesson.code} />
        </div>

        <nav aria-label="베이스캠프로 돌아가기" className="hairline pt-6">
          <Link
            href="/basecamp"
            className="card-interactive panel flex min-h-11 items-center gap-2 p-4 text-body font-bold"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            베이스캠프 전체 보기
          </Link>
        </nav>
      </article>
    </main>
  );
}
