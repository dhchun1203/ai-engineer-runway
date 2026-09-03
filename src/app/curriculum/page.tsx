import Link from "next/link";
import { FileText } from "lucide-react";
import { steps } from "@/content/modules";
import { getModulesByStep, getLessonCounts, getOrderedLessons } from "@/content/curriculum-helpers";
import { StepCard } from "@/components/step-card";
import { ProgressProvider } from "@/components/progress-provider";
import { ProgressSummarySlot } from "@/components/progress-slots";
import { DDayCountdownLive } from "@/components/dday-countdown-live";
import { todayInSeoul, daysUntil } from "@/lib/today";
import { COURSE_START_DATE } from "@/lib/schedule";

// 08-06부터 완전 정적 셸이다 — 이 페이지는 쿠키·진도를 전혀 읽지 않는다.
// 진도 표시는 <ProgressProvider>가 마운트 후 GET /api/progress를 호출해
// 클라이언트에서 가져온다(check-progress-gates.mjs G9 STATIC_SHELL_PAGES).
//
// D8-O: todayInSeoul() 호출은 여기서 빌드 시점 초기값을 산출하는 용도로만
// 남긴다 — 이 값은 빌드 시점에 굳는다(정적 셸의 마크업 형태를 확정하기
// 위해서다). <DDayCountdownLive>가 마운트 후 브라우저의 오늘로 다시
// 계산해 정정한다 — ISR 없이도 D-day가 항상 정확한 이유다.

export default function CurriculumPage() {
  const buildTimeToday = todayInSeoul();
  const initialDaysUntil = daysUntil(COURSE_START_DATE, buildTimeToday);

  // 각 StepCard에 그 Step의 레슨 슬러그를 넘긴다 — StepCard는 'use client'라
  // 매니페스트를 직접 부를 수 없으므로 서버에서 계산해 prop으로 준다. StepCard가
  // needsReviewSlugs(진도 API)와 교집합해 "더 공부 N"을 센다. (G9: getOrderedLessons는
  // 쿠키·진도 식별자가 아니라 정적 콘텐츠 조회다.)
  const orderedLessons = getOrderedLessons();
  const stepLessonSlugs = new Map<number, string[]>();
  for (const lesson of orderedLessons) {
    const list = stepLessonSlugs.get(lesson.stepId) ?? [];
    list.push(lesson.slug);
    stepLessonSlugs.set(lesson.stepId, list);
  }

  return (
    <ProgressProvider>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-display font-black">커리큘럼</h1>
          {/* PDF 내보내기 입구. 레슨 한 편은 레슨 화면의 버튼이, 여러 편 묶음은
              /print 허브가 맡는다(quick 260828-k4t). */}
          <Link
            href="/print"
            className="btn tap-feedback text-label"
          >
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
            PDF 내보내기
          </Link>
        </header>
        <DDayCountdownLive initialDaysUntil={initialDaysUntil} />
        <ProgressSummarySlot />
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              moduleCount={getModulesByStep(step.id).length}
              lessonCount={getLessonCounts(step.id).total}
              stepLessonSlugs={stepLessonSlugs.get(step.id) ?? []}
              revealIndex={index}
            />
          ))}
        </section>
      </main>
    </ProgressProvider>
  );
}
