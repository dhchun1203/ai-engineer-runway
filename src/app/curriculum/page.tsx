import { steps } from "@/content/modules";
import { StepCard } from "@/components/step-card";
import { ProgressSummary } from "@/components/progress-summary";
import { ProgressReadError } from "@/components/progress-error";
import { DDayCountdown } from "@/components/dday-countdown";
import { hasUnlockCookie } from "@/lib/auth";
import { readCompletedLessonIds } from "@/lib/progress-store";
import { stepProgress, overallProgress, nextIncompleteLesson } from "@/lib/progress";
import { todayInSeoul, daysUntil } from "@/lib/today";
import { COURSE_START_DATE } from "@/lib/schedule";

// 이 페이지도 쿠키를 읽으므로 동적 렌더링이 필요하다. /의 게이트는 이 라우트에
// 상속되지 않는다 — 이 파일에 직접 force-dynamic 선언과 hasUnlockCookie() 선호출을
// 복제해야 한다(RESEARCH Pitfall 4). 빠뜨리면 completedIds가 영구히 null이 되어
// Step 진행률 바가 쿠키 상태와 무관하게 사라진다.
export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  // 무조건, 그리고 어떤 조회보다도 먼저 호출한다 — 다른 게이트 라우트와 동일한 순서.
  const unlocked = await hasUnlockCookie();

  const progressRead = unlocked ? await readCompletedLessonIds() : null;
  const completedIds = progressRead?.ok ? progressRead.completedIds : null;

  // D-day는 홈과 동일하게 정적 공개 정보라 쿠키 여부와 무관하게 항상 계산한다(D-37).
  const today = todayInSeoul();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-display font-bold">커리큘럼</h1>
      </header>
      <DDayCountdown daysUntil={daysUntil(COURSE_START_DATE, today)} />
      {completedIds ? (
        <ProgressSummary
          counts={overallProgress(completedIds)}
          nextLessonSlug={nextIncompleteLesson(completedIds)?.slug ?? null}
        />
      ) : progressRead && !progressRead.ok ? (
        <ProgressReadError />
      ) : null}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {steps.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            progress={completedIds ? stepProgress(step.id, completedIds) : undefined}
          />
        ))}
      </section>
    </main>
  );
}
