import { notFound } from "next/navigation";
import { MDXContent } from "@/components/mdx-content";
import { DepthBadge } from "@/components/depth-badge";
import { EstimatedTime } from "@/components/estimated-time";
import { LessonBreadcrumb, LessonPager } from "@/components/lesson-nav";
import { CompleteButton } from "@/components/complete-button";
import { ProgressReadError } from "@/components/progress-error";
import { SectionTape } from "@/components/section-tape";
import { hasUnlockCookie } from "@/lib/auth";
import { readCompletedLessonIds } from "@/lib/progress-store";
import {
  getLessonBySlug,
  getOrderedLessons,
  getAdjacentLessons,
} from "@/content/curriculum-helpers";
import type { StepId } from "@/content/modules";

// 구간 테이프가 측정할 prose 컨테이너의 id — 페이지당 하나뿐이라 레슨 슬러그와
// 무관한 상수로 둔다.
const LESSON_ARTICLE_ID = "lesson-article";

// 이 페이지는 쿠키를 읽으므로 어차피 동적 렌더링으로 전환되지만, 명시 선언이
// 조건부 쿠키 접근 때문에 캐시된 응답이 나가는 문제(RESEARCH Pitfall 4)를
// 원천 차단한다. generateStaticParams는 라우트 목록 정의용으로 그대로 둔다 —
// force-dynamic과 공존한다.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getOrderedLessons().map((lesson) => ({ lessonId: lesson.slug }));
}

export default async function LessonPage(
  props: PageProps<"/lesson/[lessonId]">,
) {
  const { lessonId } = await props.params;
  const lesson = getLessonBySlug(lessonId);

  // 무조건, 그리고 notFound() 분기보다 먼저 호출한다 — 조건부 호출은 Next가
  // 이 페이지의 동적 요구를 감지하지 못하는 원인이 된다(RESEARCH Pitfall 4).
  const unlocked = await hasUnlockCookie();

  if (!lesson) {
    notFound();
  }

  const { prev, next } = getAdjacentLessons(lesson.slug);
  const progressRead = unlocked ? await readCompletedLessonIds() : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
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
        {progressRead ? (
          <div data-progress-controls className="flex flex-col gap-6">
            {progressRead.ok ? (
              <CompleteButton
                lessonId={lesson.slug}
                initialDone={progressRead.completedIds.has(lesson.slug)}
              />
            ) : (
              <ProgressReadError />
            )}
            <LessonPager prev={prev} next={next} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* 잠금 상태 문구 (D-R4K-8) — 완료 체크와 진행률 기록이 잠금 해제 후
                사용 가능하다는 사실만 말한다. /unlock은 ?key= 시크릿이 필요한
                route.ts라 링크를 걸지 않는다(unlock/route.ts:16). 상수 문자열이라
                길이가 변하지 않고, truncate/고정폭 없이 375px에서도 줄바꿈으로
                흡수된다. */}
            <p
              data-locked-notice
              className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark"
            >
              완료 체크와 진행률 기록은 잠금 해제 후에 사용할 수 있습니다.
            </p>
            <LessonPager prev={prev} next={next} />
          </div>
        )}
      </article>
    </main>
  );
}
