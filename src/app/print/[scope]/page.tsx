import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXContent } from "@/components/mdx-content";
import { PrintButton } from "@/components/print-button";
import { formatEstimatedTime } from "@/components/estimated-time";
import {
  getPrintScope,
  getPrintScopes,
  getModuleTitle,
  getLessonNumber,
} from "@/content/print-scopes";
import type { StepId } from "@/content/modules";

// 범위 하나를 한 파일로 묶어 인쇄하는 페이지 (quick 260828-k4t).
// 표지 → 목차 → 레슨 본문(레슨마다 새 쪽) 순서로 흐르는 한 장짜리 문서다.
//
// 이 페이지는 진도·쿠키를 전혀 읽지 않는다 — 순수 콘텐츠 문서라 완전 정적
// 프리렌더된다(레슨 페이지와 같은 계약).
//
// 표지의 안내문과 버튼은 전부 data-print-hide라 종이에는 찍히지 않는다.

// Step 상징 색 좌측 강조선 (D-04). step-card.tsx와 같은 이유로 문자열 조합이
// 아니라 리터럴 클래스 맵으로 고정한다 — Tailwind JIT은 동적 조합 클래스를
// 스캔하지 못한다.
const STEP_BORDER_CLASSES: Record<StepId, string> = {
  1: "border-step-1 dark:border-step-1-dark",
  2: "border-step-2 dark:border-step-2-dark",
  3: "border-step-3 dark:border-step-3-dark",
};

export function generateStaticParams() {
  return getPrintScopes().map((scope) => ({ scope: scope.slug }));
}

// Safari는 인쇄로 만든 PDF의 기본 파일명을 문서 제목에서 가져온다 —
// 이 제목이 곧 Notability에 들어갈 파일 이름이 된다. 끝에 커리큘럼 번호를
// 붙여 파일 목록에서 제목만 보고 커리큘럼 어디인지 알 수 있게 한다.
export async function generateMetadata(
  props: PageProps<"/print/[scope]">,
): Promise<Metadata> {
  const { scope: slug } = await props.params;
  const scope = getPrintScope(slug);
  if (!scope) return {};
  return { title: `${scope.title} (인쇄용) · ${scope.number}` };
}

export default async function PrintScopePage(props: PageProps<"/print/[scope]">) {
  const { scope: slug } = await props.params;
  const scope = getPrintScope(slug);

  if (!scope) {
    notFound();
  }

  const accentBorder =
    scope.stepId === null
      ? "border-accent dark:border-accent-dark"
      : STEP_BORDER_CLASSES[scope.stepId];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      {/* -- 표지 --------------------------------------------------------- */}
      <section className={`flex flex-col gap-4 border-l-4 pl-4 ${accentBorder}`}>
        <p className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
          AI Engineer 교육과정 사전학습 노트
        </p>
        <h1 className="text-display font-black">{scope.title}</h1>
        <p className="text-subhead font-normal">{scope.subtitle}</p>
        <p className="text-label font-normal font-mono text-badge-neutral-text dark:text-badge-neutral-text-dark">
          레슨 {scope.lessons.length}편 · {formatEstimatedTime(scope.totalMinutes)}
        </p>
        <div data-print-hide className="flex flex-wrap items-center gap-3 pt-2">
          <PrintButton label="이 묶음 PDF로 저장" />
          <PrintButton annotate label="필기 여백으로 저장" />
          <Link
            href="/print"
            className="tap-feedback inline-flex min-h-11 items-center text-label font-semibold text-accent dark:text-accent-dark"
          >
            다른 범위 고르기
          </Link>
        </div>
        <p
          data-print-hide
          className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark"
        >
          버튼을 누르면 인쇄 미리보기가 열립니다. 미리보기 화면의 공유 버튼 →
          Notability를 고르면 그대로 필기용 PDF가 됩니다.
        </p>
      </section>

      {/* -- 목차 --------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <h2 className="text-heading font-extrabold">목차</h2>
        <ol className="flex flex-col gap-2">
          {scope.lessons.map((lesson) => (
            <li key={lesson.slug} className="flex gap-3 text-body font-normal">
              {/* 일련번호가 아니라 커리큘럼 번호를 찍는다 — 묶음마다 달라지는
                  01/02보다 커리큘럼 어디인지가 인쇄본에서 더 쓸모 있다. */}
              <span className="shrink-0 font-mono text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {getLessonNumber(lesson)}
              </span>
              <span className="flex flex-col">
                <span className="font-semibold">{lesson.title}</span>
                <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {getModuleTitle(lesson.moduleId)} · {formatEstimatedTime(lesson.estimatedMinutes)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* -- 본문 --------------------------------------------------------- */}
      {scope.lessons.map((lesson) => (
        // data-print-break: 레슨마다 새 쪽에서 시작한다(globals.css @media print).
        <article key={lesson.slug} data-print-break className="flex flex-col gap-4">
          <header className="flex flex-col gap-2">
            <p className="text-label font-normal font-mono text-badge-neutral-text dark:text-badge-neutral-text-dark">
              {getLessonNumber(lesson)} · Step {lesson.stepId} ·{" "}
              {getModuleTitle(lesson.moduleId)} · {formatEstimatedTime(lesson.estimatedMinutes)}
            </p>
            <h2 className="text-display font-black">{lesson.title}</h2>
          </header>
          <div className="prose dark:prose-invert max-w-none">
            <MDXContent code={lesson.code} />
          </div>
        </article>
      ))}
    </main>
  );
}
