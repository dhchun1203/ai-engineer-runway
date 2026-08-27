import { notFound } from "next/navigation";
import { MDXContent } from "@/components/mdx-content";
import { DepthBadge } from "@/components/depth-badge";
import { EstimatedTime } from "@/components/estimated-time";
import { LessonBreadcrumb, LessonPager } from "@/components/lesson-nav";
import { SectionTape } from "@/components/section-tape";
import { ProgressProvider } from "@/components/progress-provider";
import { CompleteButtonSlot, LessonNoteSlot } from "@/components/progress-slots";
import {
  getLessonBySlug,
  getOrderedLessons,
  getAdjacentLessons,
} from "@/content/curriculum-helpers";
import type { StepId } from "@/content/modules";

// 구간 테이프가 측정할 prose 컨테이너의 id — 페이지당 하나뿐이라 레슨 슬러그와
// 무관한 상수로 둔다.
const LESSON_ARTICLE_ID = "lesson-article";

// 08-03부터 완전 정적 셸이다 — 이 페이지는 쿠키·진도·메모를 전혀 읽지 않는다.
// 완료 상태와 메모 본문은 <ProgressProvider lessonId>가 마운트 후
// GET /api/progress?lesson=<slug>를 호출해 클라이언트에서 가져온다
// (check-progress-gates.mjs G9 STATIC_SHELL_PAGES).

export function generateStaticParams() {
  return getOrderedLessons().map((lesson) => ({ lessonId: lesson.slug }));
}

export default async function LessonPage(
  props: PageProps<"/lesson/[lessonId]">,
) {
  const { lessonId } = await props.params;
  const lesson = getLessonBySlug(lessonId);

  if (!lesson) {
    notFound();
  }

  const { prev, next } = getAdjacentLessons(lesson.slug);

  return (
    <main
      // note-page-spacer를 항상 붙인다 — 서버는 이제 메모장 표시 여부를 모른다
      // (잠금 여부는 마운트 후 클라이언트 fetch가 확정한다). 잠금 상태에서
      // 하단 여백이 조금 남는 것이 레이아웃 시프트보다 낫고, 이 클래스는 하단
      // 패딩만 준다(globals.css의 .note-page-spacer).
      className="note-page-spacer mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8"
    >
      <ProgressProvider lessonId={lesson.slug}>
        <article className="flex flex-col gap-8">
          <LessonBreadcrumb lesson={lesson} />
          <header className="flex flex-col gap-3">
            <h1 className="text-display font-bold">{lesson.title}</h1>
            <div className="flex items-center gap-2">
              <DepthBadge depth={lesson.depth} stepId={lesson.stepId as StepId} />
              <EstimatedTime minutes={lesson.estimatedMinutes} />
            </div>
          </header>
          {lesson.hasContent ? (
            <>
              <SectionTape articleId={LESSON_ARTICLE_ID} stepId={lesson.stepId as StepId} />
              <div id={LESSON_ARTICLE_ID} className="prose dark:prose-invert max-w-none">
                <MDXContent code={lesson.code} />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <h2 className="text-heading font-bold">콘텐츠 준비 중입니다</h2>
              <p className="text-body font-normal">
                이 레슨은 아직 작성되지 않았습니다. 커리큘럼 목록에서 다른 레슨을 먼저
                골라 학습해보세요.
              </p>
            </div>
          )}
          <div data-progress-controls className="flex flex-col gap-6">
            <CompleteButtonSlot lessonId={lesson.slug} />
            <LessonPager prev={prev} next={next} />
          </div>
        </article>
        <LessonNoteSlot lessonId={lesson.slug} />
      </ProgressProvider>
    </main>
  );
}
