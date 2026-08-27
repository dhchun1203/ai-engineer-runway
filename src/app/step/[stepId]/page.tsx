import { notFound } from "next/navigation";
import { getStep, getModulesByStep, getLessonsByModule } from "@/content/curriculum-helpers";
import { ModuleAccordion } from "@/components/module-accordion";
import { ProgressProvider } from "@/components/progress-provider";
import { StepBadgeSlot, ProgressErrorSlot } from "@/components/progress-slots";
import type { StepId } from "@/content/modules";

// 08-02부터 완전 정적 셸이다 — 이 페이지는 쿠키·진도를 전혀 읽지 않는다.
// 진도 표시는 <ProgressProvider>가 마운트 후 GET /api/progress를 호출해
// 클라이언트에서 가져온다(check-progress-gates.mjs G9 STATIC_SHELL_PAGES).

export function generateStaticParams() {
  return [1, 2, 3].map((stepId) => ({ stepId: String(stepId) }));
}

export default async function StepPage(props: PageProps<"/step/[stepId]">) {
  const { stepId: stepIdParam } = await props.params;
  const stepId = Number(stepIdParam) as StepId;
  const step = getStep(stepId);

  if (!step) {
    notFound();
  }

  const modules = getModulesByStep(stepId);

  return (
    <ProgressProvider>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-display font-bold">
              Step {step.id}. {step.title}
            </h1>
            <StepBadgeSlot stepId={step.id} />
          </div>
          <p className="text-body font-normal">{step.goal}</p>
          <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            {step.keywords.join(" · ")} · 커리큘럼 원 {step.courseHours}시간
          </p>
        </header>
        <ProgressErrorSlot />
        <section className="flex flex-col gap-4">
          {modules.map((module, index) => (
            <ModuleAccordion
              key={module.id}
              module={module}
              stepId={step.id}
              lessons={getLessonsByModule(module.id)}
              defaultOpen={index === 0}
            />
          ))}
        </section>
      </main>
    </ProgressProvider>
  );
}
