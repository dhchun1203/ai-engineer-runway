import { steps } from "@/content/modules";
import { StepCard } from "@/components/step-card";
import { hasUnlockCookie } from "@/lib/auth";
import { readCompletedLessonIds } from "@/lib/progress-store";
import { stepProgress } from "@/lib/progress";

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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold leading-[1.2]">커리큘럼</h1>
      </header>
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
