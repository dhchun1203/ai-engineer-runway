"use client";

// 번외 "AI 뜯어보기" 인터랙티브 시각화 공용 키트. 개념마다 시각화를 새로 만들되,
// 색·셸·컨트롤은 여기서 공유해 9편이 한 벌처럼 보이게 하고 테마 대비 규칙을 한 곳에
// 못 박는다. 각 viz 컴포넌트는 이 키트를 얇게 감싸 자기 개념 로직만 담는다.

import type { ReactNode } from "react";

// 사이트 Step 팔레트(블루·러스트·앰버) 3색을 강조색으로 재사용한다. step-card와 같은
// 이유로 문자열 조립이 아니라 리터럴 클래스 맵으로 고정한다 — Tailwind JIT이 동적 조합
// 클래스를 스캔하지 못하는 문제를 피한다. on-accent 텍스트는 라이트=흰색(text-surface),
// 다크=어두운색(text-background-dark)으로 뒤집는다 — 다크 Step색(#6f8dff·#ffb020 등)이
// 밝아 흰 글씨는 대비가 깨지기 때문(globals.css --diagram-on-accent와 같은 원리).
export type Accent = 1 | 2 | 3;

export const ACCENT: Record<
  Accent,
  { solid: string; border: string; badge: string; dot: string; text: string }
> = {
  1: {
    solid:
      "border-step-1 bg-step-1 text-surface dark:border-step-1-dark dark:bg-step-1-dark dark:text-background-dark",
    border: "border-step-1 dark:border-step-1-dark",
    badge: "bg-step-1 text-surface dark:bg-step-1-dark dark:text-background-dark",
    dot: "bg-step-1 dark:bg-step-1-dark",
    text: "text-step-1 dark:text-step-1-dark",
  },
  2: {
    solid:
      "border-step-2 bg-step-2 text-surface dark:border-step-2-dark dark:bg-step-2-dark dark:text-background-dark",
    border: "border-step-2 dark:border-step-2-dark",
    badge: "bg-step-2 text-surface dark:bg-step-2-dark dark:text-background-dark",
    dot: "bg-step-2 dark:bg-step-2-dark",
    text: "text-step-2 dark:text-step-2-dark",
  },
  3: {
    solid:
      "border-step-3 bg-step-3 text-surface dark:border-step-3-dark dark:bg-step-3-dark dark:text-background-dark",
    border: "border-step-3 dark:border-step-3-dark",
    badge: "bg-step-3 text-surface dark:bg-step-3-dark dark:text-background-dark",
    dot: "bg-step-3 dark:bg-step-3-dark",
    text: "text-step-3 dark:text-step-3-dark",
  },
};

// 시각화 바깥 셸 — prose 안(개념 리더)에서 렌더되므로 not-prose로 타이포 상속을 끊고,
// 사이트의 굵은 잉크 테두리 + 오프셋 그림자 문법으로 감싼다. label은 위 작은 안내 문구.
export function ConceptFigure({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="not-prose my-8 flex flex-col gap-5 border-2 border-foreground bg-surface p-4 shadow-[4px_4px_0_0_var(--color-foreground)] dark:border-foreground-dark dark:bg-surface-dark dark:shadow-[4px_4px_0_0_var(--color-foreground-dark)] sm:p-6">
      <p className="text-label font-bold tracking-wide text-badge-neutral-text dark:text-badge-neutral-text-dark">
        {label}
      </p>
      {children}
    </div>
  );
}

// 스텝형 시각화 공용 컨트롤 — 진행 점 + 이전/다음(끝에선 처음부터). 자동재생 없이
// 사용자가 직접 넘긴다(접근성·아이패드 터치, 44px+). accent는 활성 점 색.
export function StepControls({
  i,
  count,
  setI,
  accent,
  unit = "단계",
}: {
  i: number;
  count: number;
  setI: (updater: (v: number) => number) => void;
  accent: Accent;
  unit?: string;
}) {
  const atEnd = i === count - 1;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: count }).map((_, dot) => (
            <span
              key={dot}
              className={`h-2 w-2 rounded-full transition-colors ${
                dot === i ? ACCENT[accent].dot : "bg-line dark:bg-line-dark"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setI((v) => Math.max(0, v - 1))}
            disabled={i === 0}
            className="btn tap-feedback min-h-11 px-4 text-label disabled:cursor-not-allowed disabled:opacity-40"
          >
            이전
          </button>
          {atEnd ? (
            <button
              type="button"
              onClick={() => setI(() => 0)}
              className="btn tap-feedback min-h-11 px-4 text-label"
            >
              ↺ 처음부터
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setI((v) => Math.min(count - 1, v + 1))}
              className="btn-action tap-feedback min-h-11 px-4 text-label"
            >
              다음 →
            </button>
          )}
        </div>
      </div>
      <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
        {i + 1} / {count} {unit}
      </p>
    </div>
  );
}
