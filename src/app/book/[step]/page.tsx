import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXContent } from "@/components/mdx-content";
import { ReadingProgress } from "@/components/reading-progress";
import { BookBookmark } from "@/components/book-bookmark";
import { ScrollToTop } from "@/components/scroll-to-top";
import { formatEstimatedTime } from "@/components/estimated-time";
import { getBookStep, getBookSteps } from "@/content/book-scopes";
import { getModuleTitle } from "@/content/print-scopes";
import type { StepId } from "@/content/modules";

// 책으로 읽기(book reader, quick 260904-a1o) — 스텝 하나를 표지 → 여는 글 →
// 챕터(레슨)들로 이어 읽는 한 화면. 레슨 페이지가 학습(체크·퀴즈·코드 실행)이라면
// 이 화면은 "이동하며 술술 읽는" 독서다.
//
// print/[scope]와 같은 계약: 진도·쿠키를 전혀 읽지 않는 순수 콘텐츠 문서라 완전
// 정적 프리렌더된다. 다른 점은 종이가 아니라 화면 읽기에 맞춘 레이아웃과, 학습
// 장치를 걷어낸 bookCode를 쓴다는 것이다.

// Step 상징 색 좌측 강조선 (D-04) — step-card.tsx·print과 같은 이유로 문자열
// 조합이 아니라 리터럴 클래스 맵으로 고정한다(Tailwind JIT).
const STEP_BORDER_CLASSES: Record<StepId, string> = {
  1: "border-step-1 dark:border-step-1-dark",
  2: "border-step-2 dark:border-step-2-dark",
  3: "border-step-3 dark:border-step-3-dark",
};

export function generateStaticParams() {
  return getBookSteps().map((book) => ({ step: String(book.step.id) }));
}

export async function generateMetadata(
  props: PageProps<"/book/[step]">,
): Promise<Metadata> {
  const { step: stepParam } = await props.params;
  const book = getBookStep(Number(stepParam) as StepId);
  if (!book) return {};
  return {
    title: `${book.step.title} · 책으로 읽기`,
    description: `Step ${book.step.id}을 한 편의 이야기처럼 이어 읽습니다 — ${book.step.goal}`,
  };
}

export default async function BookStepPage(props: PageProps<"/book/[step]">) {
  const { step: stepParam } = await props.params;
  const stepId = Number(stepParam) as StepId;
  const book = getBookStep(stepId);

  if (!book) {
    notFound();
  }

  const { step, opening, chapters, totalMinutes } = book;
  const accentBorder = STEP_BORDER_CLASSES[step.id];

  return (
    <>
      <ReadingProgress />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8">
        {/* -- 표지 --------------------------------------------------------- */}
        <section className={`flex flex-col gap-4 border-l-4 pl-4 ${accentBorder}`}>
          <p className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
            AI Engineer 교육과정 · 이어읽기
          </p>
          <h1 className="text-display font-black">
            Step {step.id}. {step.title}
          </h1>
          <p className="text-subhead font-normal">{step.goal}</p>
          <p className="text-label font-normal font-mono text-badge-neutral-text dark:text-badge-neutral-text-dark">
            총 {chapters.length}장 · {formatEstimatedTime(totalMinutes)} 읽기
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={`/step/${step.id}`}
              className="tap-feedback inline-flex min-h-11 items-center text-label font-semibold text-accent dark:text-accent-dark"
            >
              ← 스텝 목차로
            </Link>
          </div>
        </section>

        {/* -- 여는 글 ------------------------------------------------------ */}
        <section className="flex flex-col gap-3">
          {opening.map((para, i) => (
            <p key={i} className="text-body font-normal leading-loose">
              {para}
            </p>
          ))}
        </section>

        {/* -- 챕터(레슨) -------------------------------------------------- */}
        {chapters.map(({ lesson, chapterNumber }) => (
          <article key={lesson.slug} data-book-chapter={lesson.slug} className="flex flex-col gap-5">
            {/* 챕터 사이 구분 — 첫 장 앞에는 두지 않는다. */}
            {chapterNumber > 1 && (
              <div aria-hidden="true" className="flex items-center justify-center pt-2 text-badge-neutral-text dark:text-badge-neutral-text-dark">
                ❧
              </div>
            )}
            <header className="flex flex-col gap-1.5">
              <p className="text-label font-normal font-mono text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {chapterNumber}장 · {getModuleTitle(lesson.moduleId)}
              </p>
              <h2 className="text-heading font-extrabold">{lesson.title}</h2>
            </header>
            {/* 책 본문 — 학습 장치를 걷어낸 bookCode. leading을 조금 더 풀어
                이동 중에도 눈이 편하게 한다. */}
            <div className="prose dark:prose-invert max-w-none">
              <MDXContent code={lesson.bookCode} />
            </div>
          </article>
        ))}

        {/* -- 닫는 글 ------------------------------------------------------ */}
        <section className="flex flex-col gap-3 border-t border-line pt-8 dark:border-line-dark">
          <p className="text-body font-normal leading-loose">
            여기까지가 Step {step.id}의 이야기입니다. 이제 각 장을 직접 손으로
            익힐 차례예요 — 레슨에서 코드를 실행하고, 스스로 점검 문항을 풀어
            보세요.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <Link
              href={`/step/${step.id}`}
              className="tap-feedback inline-flex min-h-11 items-center text-label font-semibold text-accent dark:text-accent-dark"
            >
              Step {step.id} 레슨으로 →
            </Link>
            <Link
              href="/curriculum"
              className="tap-feedback inline-flex min-h-11 items-center text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark"
            >
              커리큘럼 전체 보기
            </Link>
          </div>
        </section>
      </main>
      <BookBookmark stepId={step.id} />
      <ScrollToTop />
    </>
  );
}
