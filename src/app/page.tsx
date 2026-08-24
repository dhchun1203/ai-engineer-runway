import { steps } from "@/content/modules";
import { StepCard } from "@/components/step-card";
import { ProgressSummary } from "@/components/progress-summary";
import { ProgressReadError } from "@/components/progress-error";
import { hasUnlockCookie } from "@/lib/auth";
import { readCompletedLessonIds } from "@/lib/progress-store";
import { overallProgress, stepProgress, nextIncompleteLesson } from "@/lib/progress";

// 홈도 쿠키를 읽으므로 동적 렌더링이 필요하다 — 조건부 쿠키 접근이 캐시된
// 응답을 내보내는 문제(RESEARCH Pitfall 4)를 원천 차단한다. `/unlock` 직후
// 리다이렉트로 도착했을 때 방금 켠 진도가 안 보이는 것을 막는 바로 그 화면이다.
export const dynamic = "force-dynamic";

export default async function Home() {
  // 무조건, 그리고 어떤 조회보다도 먼저 호출한다 — 레슨/Step 페이지와 동일한
  // 게이트 순서를 지켜 조건부 호출이 만드는 캐시 문제를 피한다.
  const unlocked = await hasUnlockCookie();

  const progressRead = unlocked ? await readCompletedLessonIds() : null;
  const completedIds = progressRead?.ok ? progressRead.completedIds : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold leading-[1.2]">AI Engineer Runway</h1>
        <p className="text-[14px] font-normal leading-[1.4] text-badge-neutral-text dark:text-badge-neutral-text-dark">
          AI Engineer 교육과정 사전학습 · 2026-09-30 개강
        </p>
      </header>
      {completedIds ? (
        <ProgressSummary
          counts={overallProgress(completedIds)}
          nextLessonSlug={nextIncompleteLesson(completedIds)?.slug ?? null}
        />
      ) : progressRead && !progressRead.ok ? (
        <ProgressReadError />
      ) : null}
      <section className="grid grid-cols-1 gap-8 sm:grid-cols-3">
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
