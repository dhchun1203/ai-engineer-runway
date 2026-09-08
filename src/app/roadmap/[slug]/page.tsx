import type { Metadata } from "next";
import type { ComponentType } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MDXContent } from "@/components/mdx-content";
import { TermPanelProvider, Term } from "@/components/roadmap/term-panel";
import {
  getRoadmapLessonBySlug,
  getOrderedRoadmapLessons,
} from "@/content/roadmap-lesson-helpers";
import { roadmapStages } from "@/content/channeltalk-roadmap";

// 채널톡 로드맵 별도 심화 레슨 리더 — 완전 정적. concepts 리더와 같은 셸이되
// 진도·완료·복습·북마크가 전혀 없다. 콘텐츠는 roadmapLessons 컬렉션에서 온다.

export function generateStaticParams() {
  return getOrderedRoadmapLessons().map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata(
  props: PageProps<"/roadmap/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const lesson = getRoadmapLessonBySlug(slug);
  if (!lesson) return {};
  return {
    title: `${lesson.title} · 채널톡 로드맵`,
    description: lesson.summary,
  };
}

export default async function RoadmapLessonPage(
  props: PageProps<"/roadmap/[slug]">,
) {
  const { slug } = await props.params;
  const lesson = getRoadmapLessonBySlug(slug);

  if (!lesson) {
    notFound();
  }

  // 이 레슨이 어느 로드맵 단계에 속하는지 — 헤더에 단계 이름을 보여 준다.
  const stage = roadmapStages.find((s) => s.id === lesson.stageId);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link
            href="/roadmap"
            className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            채널톡 로드맵
          </Link>
          <h1 className="text-display font-black break-keep">{lesson.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip text-label font-bold">별도 심화</span>
            {stage ? (
              <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {String(stage.order).padStart(2, "0")} {stage.title}
              </span>
            ) : null}
            <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
              약 {lesson.readingMinutes}분 읽기
            </span>
          </div>
        </header>

        {/* 용어 패널 프로바이더로 본문을 감싼다. 본문 안 <Term>이 우측 설명
            패널을 연다. Term은 MDX 컴포넌트 매핑으로 주입한다. */}
        <TermPanelProvider>
          <div className="prose dark:prose-invert max-w-none">
            <MDXContent
              code={lesson.code}
              components={{ Term: Term as ComponentType }}
            />
          </div>
        </TermPanelProvider>

        <nav aria-label="로드맵으로 돌아가기" className="hairline pt-6">
          <Link
            href="/roadmap"
            className="card-interactive panel flex min-h-11 items-center gap-2 p-4 text-body font-bold"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            로드맵 전체 보기
          </Link>
        </nav>
      </article>
    </main>
  );
}
