import { notFound } from "next/navigation";
import { getStep, getModulesByStep } from "@/content/curriculum-helpers";
import { ModuleAccordion } from "@/components/module-accordion";
import type { StepId } from "@/content/modules";

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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-[28px] font-semibold leading-[1.2]">
          Step {step.id}. {step.title}
        </h1>
        <p className="text-[16px] font-normal leading-[1.6]">{step.goal}</p>
        <p className="text-[14px] font-normal leading-[1.4] text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {step.keywords.join(" · ")} · 커리큘럼 원 {step.courseHours}시간
        </p>
      </header>
      <section className="flex flex-col gap-4">
        {modules.map((module, index) => (
          <ModuleAccordion
            key={module.id}
            module={module}
            stepId={step.id}
            defaultOpen={index === 0}
          />
        ))}
      </section>
    </main>
  );
}
