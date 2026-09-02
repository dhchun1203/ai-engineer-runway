import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXContent } from "@/components/mdx-content";
import { DepthBadge } from "@/components/depth-badge";
import { EstimatedTime } from "@/components/estimated-time";
import { LessonBreadcrumb, LessonPager } from "@/components/lesson-nav";
import { SectionTape } from "@/components/section-tape";
import { ProgressProvider } from "@/components/progress-provider";
import { PrintButton } from "@/components/print-button";
import { CopyLessonPrompt } from "@/components/lesson-copy-prompt";
import { CompleteButtonSlot, LessonNoteSlot, LessonTilSlot } from "@/components/progress-slots";
import { LastLessonRecorder } from "@/components/last-lesson-recorder";
import {
  getLessonBySlug,
  getOrderedLessons,
  getAdjacentLessons,
} from "@/content/curriculum-helpers";
import { getLessonNumber } from "@/content/print-scopes";
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

// 레슨마다 고유한 문서 제목을 준다. 브라우저 탭 구분도 되지만 진짜 이유는 인쇄다 —
// Safari는 인쇄로 만든 PDF의 기본 파일명을 문서 제목에서 가져오므로, 제목이 없으면
// 모든 레슨 PDF가 사이트 이름 하나로 저장된다. 끝에 커리큘럼 번호를 붙여 Notability
// 파일 목록에서 제목만 보고 커리큘럼 어디인지 알 수 있게 한다.
export async function generateMetadata(
  props: PageProps<"/lesson/[lessonId]">,
): Promise<Metadata> {
  const { lessonId } = await props.params;
  const lesson = getLessonBySlug(lessonId);
  if (!lesson) return {};
  return { title: `${lesson.title} · ${getLessonNumber(lesson)}` };
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

  // "클로드에 물어보기"에 넘길 커리큘럼 순서표. 클라이언트는 완료 슬러그만 알고
  // 제목·순서는 모르므로 여기(서버)서 {slug, title}만 추려 내려준다 — 레슨 전체
  // 매니페스트(#site/content)에는 컴파일된 MDX가 들어 있어 클라이언트에서 직접
  // import하면 안 된다 (lesson-copy-prompt.tsx의 prop 주석 참고).
  const curriculum = getOrderedLessons().map(({ slug, title }) => ({ slug, title }));

  return (
    <main
      // note-page-spacer를 항상 붙인다 — 서버는 이제 메모장 표시 여부를 모른다
      // (잠금 여부는 마운트 후 클라이언트 fetch가 확정한다). 잠금 상태에서
      // 하단 여백이 조금 남는 것이 레이아웃 시프트보다 낫고, 이 클래스는 하단
      // 패딩만 준다(globals.css의 .note-page-spacer).
      className="note-page-spacer mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8"
    >
      <ProgressProvider lessonId={lesson.slug}>
        {/* "이어서 읽기"(quick 260901-v4u) 기록기 — 화면에 아무것도 그리지
            않고 useEffect에서만 동작하므로 이 페이지의 정적 셸 계약(레슨 =
            완전 정적)을 깨지 않는다. */}
        <LastLessonRecorder slug={lesson.slug} title={lesson.title} />
        <article className="flex flex-col gap-8">
          <LessonBreadcrumb lesson={lesson} />
          <header className="flex flex-col gap-3">
            <h1 className="text-display font-black">{lesson.title}</h1>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <DepthBadge depth={lesson.depth} stepId={lesson.stepId as StepId} />
                <EstimatedTime minutes={lesson.estimatedMinutes} />
              </div>
              {/* 이 레슨 한 편만 PDF로 뽑는 입구. 여러 편을 한 파일로 묶는 것은
                  /print가 맡는다. 콘텐츠가 없는 자리표시 레슨에는 뽑을 것이
                  없으므로 버튼도 내지 않는다. */}
              {lesson.hasContent ? (
                <span className="flex flex-wrap items-start gap-2">
                  {/* 레슨 본문 + 질문 틀을 클립보드에 담는다 — 클로드 탭에 붙여넣기
                      한 번이면 과외가 시작된다. 사이트 안에 대화창을 두는 대신
                      이 방식을 고른 이유는 lesson-copy-prompt.tsx 머리 주석 참고. */}
                  <CopyLessonPrompt
                    lessonTitle={lesson.title}
                    articleId={LESSON_ARTICLE_ID}
                    curriculum={curriculum}
                  />
                  <PrintButton />
                  <PrintButton annotate label="필기 여백으로 저장" />
                </span>
              ) : null}
            </div>
          </header>
          {lesson.hasContent ? (
            <>
              <SectionTape articleId={LESSON_ARTICLE_ID} stepId={lesson.stepId as StepId} />
              {/* data-step: 본문 그림(`[data-diagram]`)의 강조색이 이 레슨의 Step 색을
                  따라가게 하는 유일한 연결 고리다 — globals.css의 `.prose[data-step=...]`
                  규칙이 이 값을 읽는다. 없으면 모든 그림이 Step 1 파랑으로 굳는다. */}
              <div
                id={LESSON_ARTICLE_ID}
                data-step={lesson.stepId}
                className="prose dark:prose-invert max-w-none"
              >
                <MDXContent code={lesson.code} />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <h2 className="text-heading font-extrabold">콘텐츠 준비 중입니다</h2>
              <p className="text-body font-normal">
                이 레슨은 아직 작성되지 않았습니다. 커리큘럼 목록에서 다른 레슨을 먼저
                골라 학습해보세요.
              </p>
            </div>
          )}
          <div data-progress-controls className="flex flex-col gap-6">
            <CompleteButtonSlot lessonId={lesson.slug} />
            <LessonTilSlot lessonId={lesson.slug} />
            <LessonPager prev={prev} next={next} />
          </div>
        </article>
        <LessonNoteSlot lessonId={lesson.slug} />
      </ProgressProvider>
    </main>
  );
}
