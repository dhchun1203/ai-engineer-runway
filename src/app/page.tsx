import { steps } from "@/content/modules";
import { StepCard } from "@/components/step-card";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold leading-[1.2]">AI Engineer Runway</h1>
        <p className="text-[14px] font-normal leading-[1.4] text-badge-neutral-text dark:text-badge-neutral-text-dark">
          AI Engineer 교육과정 사전학습 · 2026-09-30 개강
        </p>
      </header>
      <section className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {steps.map((step) => (
          <StepCard key={step.id} step={step} />
        ))}
      </section>
    </main>
  );
}
