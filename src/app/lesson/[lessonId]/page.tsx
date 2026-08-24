import { notFound } from "next/navigation";
import { MDXContent } from "@/components/mdx-content";
import { DepthBadge } from "@/components/depth-badge";
import { EstimatedTime } from "@/components/estimated-time";
import { LessonBreadcrumb, LessonPager } from "@/components/lesson-nav";
import { CompleteButton } from "@/components/complete-button";
import { hasUnlockCookie } from "@/lib/auth";
import { readCompletedLessonIds } from "@/lib/progress-store";
import {
  getLessonBySlug,
  getOrderedLessons,
  getAdjacentLessons,
} from "@/content/curriculum-helpers";
import type { StepId } from "@/content/modules";

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
    <article className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <LessonBreadcrumb lesson={lesson} />
      <header className="flex flex-col gap-3">
        <h1 className="text-[28px] font-semibold leading-[1.2]">{lesson.title}</h1>
        <div className="flex items-center gap-2">
          <DepthBadge depth={lesson.depth} stepId={lesson.stepId as StepId} />
          <EstimatedTime minutes={lesson.estimatedMinutes} />
        </div>
      </header>
      {lesson.hasContent ? (
        <div className="prose dark:prose-invert max-w-none">
          <MDXContent code={lesson.code} />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h2 className="text-[20px] font-semibold leading-[1.3]">콘텐츠 준비 중입니다</h2>
          <p className="text-[16px] font-normal leading-[1.6]">
            이 레슨은 아직 작성되지 않았습니다. Step 1 &quot;Python 변수·자료형&quot; 또는 Step
            2 &quot;React 컴포넌트&quot; 파일럿 레슨에서 먼저 학습 형식을 확인해보세요.
          </p>
        </div>
      )}
      {progressRead && progressRead.ok ? (
        <CompleteButton
          lessonId={lesson.slug}
          initialDone={progressRead.completedIds.has(lesson.slug)}
        />
      ) : null}
      <LessonPager prev={prev} next={next} />
    </article>
  );
}
