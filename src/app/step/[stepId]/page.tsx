import { notFound } from "next/navigation";
import { getStep, getModulesByStep } from "@/content/curriculum-helpers";
import { ModuleAccordion } from "@/components/module-accordion";
import { ProgressBadge } from "@/components/progress-badge";
import { ProgressReadError } from "@/components/progress-error";
import { hasUnlockCookie } from "@/lib/auth";
import { readCompletedLessonIds } from "@/lib/progress-store";
import { stepProgress, moduleProgress } from "@/lib/progress";
import type { StepId } from "@/content/modules";

// 이 페이지도 쿠키를 읽으므로 동적 렌더링이 필요하다 — 조건부 쿠키 접근이
// 캐시된 응답을 내보내는 문제(RESEARCH Pitfall 4)를 원천 차단한다.
// generateStaticParams는 라우트 목록 정의용으로 그대로 두고 force-dynamic과
// 공존시킨다 (레슨 페이지에서 검증된 패턴을 그대로 적용).
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [1, 2, 3].map((stepId) => ({ stepId: String(stepId) }));
}

export default async function StepPage(props: PageProps<"/step/[stepId]">) {
  const { stepId: stepIdParam } = await props.params;
  const stepId = Number(stepIdParam) as StepId;
  const step = getStep(stepId);

  // 무조건, 그리고 notFound() 분기보다 먼저 호출한다 — 레슨 페이지와 동일한
  // 게이트 순서를 지켜 조건부 호출이 만드는 캐시 문제를 피한다.
  const unlocked = await hasUnlockCookie();

  if (!step) {
    notFound();
  }

  const modules = getModulesByStep(stepId);
  // 완료 집합은 요청당 한 번만 읽고 모든 모듈이 이 결과를 공유한다 — 모듈마다
  // DB를 다시 읽지 않는다 (T-02-21).
  const progressRead = unlocked ? await readCompletedLessonIds() : null;
  const completedIds = progressRead?.ok ? progressRead.completedIds : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] font-semibold leading-[1.2]">
            Step {step.id}. {step.title}
          </h1>
          {completedIds ? (
            <ProgressBadge {...stepProgress(stepId, completedIds)} />
          ) : null}
        </div>
        <p className="text-[16px] font-normal leading-[1.6]">{step.goal}</p>
        <p className="text-[14px] font-normal leading-[1.4] text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {step.keywords.join(" · ")} · 커리큘럼 원 {step.courseHours}시간
        </p>
      </header>
      {progressRead && !progressRead.ok ? <ProgressReadError /> : null}
      <section className="flex flex-col gap-4">
        {modules.map((module, index) => (
          <ModuleAccordion
            key={module.id}
            module={module}
            stepId={step.id}
            defaultOpen={index === 0}
            completedSlugs={completedIds ?? undefined}
            progress={completedIds ? moduleProgress(module.id, completedIds) : undefined}
          />
        ))}
      </section>
    </main>
  );
}
