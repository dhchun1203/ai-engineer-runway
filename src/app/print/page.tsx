import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { formatEstimatedTime } from "@/components/estimated-time";
import { getPrintScopes } from "@/content/print-scopes";
import { steps, type StepId } from "@/content/modules";

// PDF 내보내기 허브 (quick 260828-k4t) — 뽑을 범위를 고르는 화면.
// 진도·쿠키를 읽지 않으므로 완전 정적 프리렌더된다.

export const metadata: Metadata = {
  title: "PDF 내보내기",
  description: "레슨을 범위별로 묶어 PDF로 저장합니다 — 전체, Step별, 모듈별.",
};

const STEP_BORDER_CLASSES: Record<StepId, string> = {
  1: "border-step-1 dark:border-step-1-dark",
  2: "border-step-2 dark:border-step-2-dark",
  3: "border-step-3 dark:border-step-3-dark",
};

const CARD_CLASS =
  "card-interactive panel flex flex-col gap-1 p-4";

export default function PrintHubPage() {
  const scopes = getPrintScopes();
  const allScope = scopes.find((scope) => scope.slug === "all");
  const stepScopes = scopes.filter((scope) => scope.kind === "step");
  const moduleScopes = scopes.filter((scope) => scope.kind === "module");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-black">PDF 내보내기</h1>
        <p className="text-body font-normal">
          레슨을 원하는 범위로 묶어 PDF로 저장합니다. 아이패드에서 저장한 PDF를
          Notability로 넘기면 애플펜슬로 바로 필기할 수 있습니다.
        </p>
      </header>

      {/* 실제로 손이 어디로 가야 하는지 단계로 적는다 — "인쇄하세요" 한 줄로는
          공유 시트까지 도달하지 못한다. */}
      <section className="panel flex flex-col gap-3 p-4">
        <h2 className="text-subhead font-bold">아이패드에서 Notability로 넘기는 법</h2>
        <ol className="flex flex-col gap-2 text-label font-normal">
          <li>1. 아래에서 범위를 고르고, 열린 화면에서 &ldquo;이 묶음 PDF로 저장&rdquo;을 누릅니다.</li>
          <li>2. 인쇄 미리보기가 뜨면 우상단 공유 버튼을 누릅니다.</li>
          <li>3. 공유 시트에서 Notability를 고르면 필기 가능한 PDF로 들어갑니다.</li>
        </ol>
        <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          레슨 한 편만 필요하면 그 레슨 화면 위쪽의 &ldquo;PDF로 저장&rdquo; 버튼을 쓰면 됩니다.
          인쇄본은 화면이 다크 모드여도 항상 흰 종이로 나오고, 접어둔 정답 상자는 펼쳐진 채로 찍힙니다.
        </p>
      </section>

      {allScope ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-heading font-extrabold">한 번에 전부</h2>
          <Link
            href={`/print/${allScope.slug}`}
            className={`${CARD_CLASS} border-l-4 border-l-accent dark:border-l-accent-dark`}
          >
            <span className="flex items-center gap-2 text-subhead font-bold">
              <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
              {allScope.title}
            </span>
            <span className="text-label font-normal font-mono text-badge-neutral-text dark:text-badge-neutral-text-dark">
              레슨 {allScope.lessons.length}편 · {formatEstimatedTime(allScope.totalMinutes)}
            </span>
          </Link>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-heading font-extrabold">Step별</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stepScopes.map((scope) => (
            <Link
              key={scope.slug}
              href={`/print/${scope.slug}`}
              className={`${CARD_CLASS} border-l-4 ${
                scope.stepId ? STEP_BORDER_CLASSES[scope.stepId] : ""
              }`}
            >
              <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {scope.subtitle}
              </span>
              <span className="text-subhead font-bold">{scope.title}</span>
              <span className="text-label font-normal font-mono text-badge-neutral-text dark:text-badge-neutral-text-dark">
                레슨 {scope.lessons.length}편 · {formatEstimatedTime(scope.totalMinutes)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-heading font-extrabold">모듈별</h2>
        {steps.map((step) => {
          const scoped = moduleScopes.filter((scope) => scope.stepId === step.id);
          if (scoped.length === 0) return null;
          return (
            <div key={step.id} className="flex flex-col gap-3">
              <h3 className="text-subhead font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                Step {step.id} · {step.shortTitle}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {scoped.map((scope) => (
                  <Link
                    key={scope.slug}
                    href={`/print/${scope.slug}`}
                    className={`${CARD_CLASS} border-l-4 ${STEP_BORDER_CLASSES[step.id]}`}
                  >
                    <span className="text-subhead font-bold">{scope.title}</span>
                    <span className="text-label font-normal font-mono text-badge-neutral-text dark:text-badge-neutral-text-dark">
                      레슨 {scope.lessons.length}편 · {formatEstimatedTime(scope.totalMinutes)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
