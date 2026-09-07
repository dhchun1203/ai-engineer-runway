"use client";

// 번외 "에이전트와 하네스" 파일럿의 대표 시각화 — 하네스 루프 스테퍼.
// 사용자 요청 → 모델 생각 → 도구 호출 → 관찰 → (필요하면 다시 생각) → 답변까지
// 한 스텝씩 눌러 넘기며, 지금 어느 단계인지와 그 단계에서 실제로 오간 내용을 보여준다.
// "AI가 도구를 쥐고 스스로 도는 고리"라는 개념을 글이 아니라 조작으로 붙잡게 하는 것이 목적.
//
// prose 안(개념 리더)에서 렌더되므로 바깥을 not-prose로 감싸 타이포그래피 상속을 끊는다.
// 애니메이션은 motion 하나만 쓰고, prefers-reduced-motion이면 이동/페이드를 끈다.

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// 루프의 4개 고정 무대 + 마지막 답변. id로 현재 스텝이 어느 무대를 밝히는지 잇는다.
type StageId = "user" | "think" | "act" | "observe" | "answer";

const STAGES: readonly { id: StageId; icon: string; label: string }[] = [
  { id: "user", icon: "🧑", label: "사용자" },
  { id: "think", icon: "🧠", label: "모델 생각" },
  { id: "act", icon: "🔧", label: "도구 호출" },
  { id: "observe", icon: "👁️", label: "관찰" },
  { id: "answer", icon: "✅", label: "답변" },
];

// 무대별 강조는 사이트의 Step 팔레트(블루·러스트·앰버) 3색을 재사용한다. 5개 무대에
// 3색이라 사용자↔답변(사람이 닿는 양 끝)은 블루, 생각↔관찰(모델 내부 고리)은 러스트로
// 자연스럽게 짝지어진다. step-card와 같은 이유로 문자열 조립이 아니라 리터럴 클래스
// 맵으로 고정한다 — Tailwind JIT이 동적 조합 클래스를 스캔하지 못하는 문제를 피한다.
// on-accent 텍스트는 라이트에서 흰색(text-surface), 다크에선 어두운색(text-background-dark)
// 으로 뒤집는다 — 다크 Step색(#6f8dff·#ffb020 등)이 밝아 흰 글씨는 대비가 깨지기 때문
// (globals.css의 --diagram-on-accent 규칙과 같은 원리).
type Accent = 1 | 2 | 3;

const ACCENT_CLASSES: Record<
  Accent,
  { chipActive: string; border: string; badge: string; dot: string }
> = {
  1: {
    chipActive:
      "border-step-1 bg-step-1 text-surface dark:border-step-1-dark dark:bg-step-1-dark dark:text-background-dark",
    border: "border-step-1 dark:border-step-1-dark",
    badge:
      "bg-step-1 text-surface dark:bg-step-1-dark dark:text-background-dark",
    dot: "bg-step-1 dark:bg-step-1-dark",
  },
  2: {
    chipActive:
      "border-step-2 bg-step-2 text-surface dark:border-step-2-dark dark:bg-step-2-dark dark:text-background-dark",
    border: "border-step-2 dark:border-step-2-dark",
    badge:
      "bg-step-2 text-surface dark:bg-step-2-dark dark:text-background-dark",
    dot: "bg-step-2 dark:bg-step-2-dark",
  },
  3: {
    chipActive:
      "border-step-3 bg-step-3 text-surface dark:border-step-3-dark dark:bg-step-3-dark dark:text-background-dark",
    border: "border-step-3 dark:border-step-3-dark",
    badge:
      "bg-step-3 text-surface dark:bg-step-3-dark dark:text-background-dark",
    dot: "bg-step-3 dark:bg-step-3-dark",
  },
};

const STAGE_ACCENT: Record<StageId, Accent> = {
  user: 1,
  think: 2,
  act: 3,
  observe: 2,
  answer: 1,
};

// 구체적인 한 편의 대화 흐름(trace). 추상적인 화살표만 두면 와닿지 않으므로,
// "우산 챙길까?"라는 진짜 요청 하나가 고리를 한 바퀴 도는 과정을 따라간다.
type Step = { stage: StageId; role: string; text: string };

const TRACE: readonly Step[] = [
  {
    stage: "user",
    role: "요청",
    text: "이번 주에 비 와? 우산 챙겨야 할지 알려줘.",
  },
  {
    stage: "think",
    role: "생각",
    text: "지금 날씨는 내가 모른다. 날씨를 알아보는 도구를 불러야겠다.",
  },
  {
    stage: "act",
    role: "행동",
    text: "get_weather(\"이번 주\") — 날씨 도구를 호출한다.",
  },
  {
    stage: "observe",
    role: "관찰",
    text: "도구가 돌려준 결과: \"수요일 비 올 확률 80%\".",
  },
  {
    stage: "think",
    role: "생각",
    text: "이제 답할 수 있다. 도구를 더 부를 필요는 없다 — 고리를 빠져나가자.",
  },
  {
    stage: "answer",
    role: "답변",
    text: "수요일에 비 소식이 있어요(80%). 우산 챙기시는 걸 추천해요.",
  },
];

export function AgentHarnessLoop() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const step = TRACE[i];
  const activeStage = step.stage;
  const accent = ACCENT_CLASSES[STAGE_ACCENT[activeStage]];
  const atEnd = i === TRACE.length - 1;

  // 이 스텝이 고리를 "다시 도는" 지점인지(관찰 → 생각으로 되돌아가는 순간) 표시해,
  // 루프라는 핵심을 놓치지 않게 한다. TRACE에서 두 번째 think가 그 지점이다.
  const isLoopBack = activeStage === "think" && i > 1;

  return (
    <div className="not-prose my-8 flex flex-col gap-5 border-2 border-foreground bg-surface p-4 shadow-[4px_4px_0_0_var(--color-foreground)] dark:border-foreground-dark dark:bg-surface-dark dark:shadow-[4px_4px_0_0_var(--color-foreground-dark)] sm:p-6">
      <p className="text-label font-bold tracking-wide text-badge-neutral-text dark:text-badge-neutral-text-dark">
        하네스 루프 · 한 스텝씩 눌러보기
      </p>

      {/* 루프 무대 — 가로로 흐르다 좁아지면 줄바꿈. 사용자 → 생각 → 도구 → 관찰,
          그리고 생각에서 답변으로 빠져나가는 고리. 활성 무대만 색으로 채운다. */}
      <ol className="flex flex-wrap items-stretch gap-2" aria-label="하네스 단계">
        {STAGES.map((stage) => {
          const active = stage.id === activeStage;
          const stageAccent = ACCENT_CLASSES[STAGE_ACCENT[stage.id]];
          return (
            <li key={stage.id} className="flex-1 basis-24">
              <div
                className={`flex h-full min-h-11 flex-col items-center justify-center gap-1 border-2 px-2 py-2 text-center transition-colors duration-200 ${
                  active
                    ? stageAccent.chipActive
                    : "border-line dark:border-line-dark"
                }`}
                aria-current={active ? "step" : undefined}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {stage.icon}
                </span>
                <span className="break-keep text-label font-bold leading-tight">
                  {stage.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* 고리를 다시 도는 순간엔 안내를 띄운다 — "도구가 더 필요하면 관찰에서 생각으로
          돌아가 고리를 다시 돈다"는 점이 이 시각화의 핵심 메시지다. */}
      <div className="min-h-6 text-center">
        {isLoopBack && (
          <span className="chip text-label font-bold">
            ↩ 관찰한 걸 들고 다시 생각으로 — 이게 &lsquo;고리&rsquo;다
          </span>
        )}
      </div>

      {/* 현재 스텝 상세 — 역할 라벨 + 실제 오간 내용. 스텝이 바뀔 때만 부드럽게 교체. */}
      <div className="min-h-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className={`flex flex-col gap-2 border-l-4 bg-surface-2 p-4 dark:bg-surface-2-dark ${accent.border}`}
          >
            <span className={`w-fit px-2 py-0.5 text-label font-bold ${accent.badge}`}>
              {STAGES.find((s) => s.id === activeStage)?.icon} {step.role}
            </span>
            <p className="break-keep text-body font-normal leading-relaxed">{step.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 진행 점 + 컨트롤. 자동재생 없이 사용자가 직접 넘긴다(접근성·아이패드 터치). */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {TRACE.map((_, dot) => (
            <span
              key={dot}
              className={`h-2 w-2 rounded-full transition-colors ${
                dot === i ? accent.dot : "bg-line dark:bg-line-dark"
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
              onClick={() => setI(0)}
              className="btn tap-feedback min-h-11 px-4 text-label"
            >
              ↺ 처음부터
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setI((v) => Math.min(TRACE.length - 1, v + 1))}
              className="btn-action tap-feedback min-h-11 px-4 text-label"
            >
              다음 단계 →
            </button>
          )}
        </div>
      </div>

      <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
        {i + 1} / {TRACE.length} 단계
      </p>
    </div>
  );
}
