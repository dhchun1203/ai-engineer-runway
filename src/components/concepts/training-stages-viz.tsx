"use client";

// 번외 "AI 뜯어보기" — 사전학습·파인튜닝·RLHF 3단계 스테퍼.
// 한 스텝씩 넘기며 각 단계에서 모델이 '무엇을 얻는지'를 카드로 보여준다.
// 핵심 메시지: 우리가 쓰는 '말 잘 듣는 AI'는 이 3단계를 거친 결과이며,
// 똑똑함(1단계)과 고분고분함(3단계)은 서로 다른 단계에서 온다.
//
// 색·셸·컨트롤은 viz-kit에서 가져와 9편이 한 벌처럼 보이게 한다. 단계마다 강조색을
// 바꿔(사전학습=ACCENT[1], 파인튜닝=ACCENT[2], RLHF=ACCENT[3]) 지금 어느 단계인지
// 색으로도 읽히게 한다. 인라인 색 하드코딩 없이 ACCENT 리터럴 클래스 맵만 쓴다.

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ACCENT,
  ConceptFigure,
  StepControls,
  type Accent,
} from "@/components/concepts/viz-kit";

// 3단계 각각: 강조색, 이름, 한 줄 비유, 이 단계에서 모델이 '얻는 것', 부작용/한계.
type Stage = {
  accent: Accent;
  name: string;
  eyebrow: string;
  analogy: string;
  gains: string;
  caveat: string;
};

const STAGES: readonly Stage[] = [
  {
    accent: 1,
    name: "사전학습",
    eyebrow: "pretraining",
    analogy: "책을 엄청 많이 읽은 사람",
    gains:
      "인터넷의 방대한 글로 '말의 패턴' 자체를 통째로 익힌다. 세상 지식과 문장을 잇는 감각이 여기서 생긴다.",
    caveat:
      "아직 지시를 잘 못 따른다 — 아는 건 많아도 '질문에 답하기' 같은 형식은 배우기 전이다.",
  },
  {
    accent: 2,
    name: "파인튜닝",
    eyebrow: "fine-tuning",
    analogy: "특정 시험을 과외로 준비하는 사람",
    gains:
      "질문에 답하기 같은 특정 형식·과제에 맞게 다듬는다. '이렇게 물으면 이렇게 답한다'는 틀을 익힌다.",
    caveat:
      "이제 말은 통하지만, 무엇이 더 정중하고 안전하고 유용한 답인지까지는 아직 조율되지 않았다.",
  },
  {
    accent: 3,
    name: "RLHF",
    eyebrow: "사람 피드백 강화학습",
    analogy: "눈치와 매너를 익히는 사람",
    gains:
      "사람이 선호하는 답을 고르도록 조율한다. 정중함·안전함·유용함이 여기서 자리 잡는다.",
    caveat:
      "우리가 '말 잘 듣는다'고 느끼는 고분고분함은 대부분 이 단계의 결과다 — 똑똑함(1단계)과는 다른 데서 온다.",
  },
];

export function TrainingStagesViz() {
  const [i, setI] = useState<number>(0);
  const reduce = useReducedMotion();
  const stage = STAGES[i];
  const accent = ACCENT[stage.accent];

  return (
    <ConceptFigure label="3단계 · 한 단계씩 눌러보기">
      {/* 단계 칩 줄 — 활성 단계만 그 단계의 색으로 채운다. 좁아지면 줄바꿈. */}
      <ol className="flex flex-wrap items-stretch gap-2" aria-label="학습 3단계">
        {STAGES.map((s, idx) => {
          const active = idx === i;
          const sAccent = ACCENT[s.accent];
          return (
            <li key={s.name} className="flex-1 basis-24">
              <div
                className={`flex h-full min-h-11 flex-col items-center justify-center gap-0.5 border-2 px-2 py-2 text-center transition-colors duration-200 ${
                  active ? sAccent.solid : "border-line dark:border-line-dark"
                }`}
                aria-current={active ? "step" : undefined}
              >
                <span className="text-label font-bold leading-none opacity-70">
                  {idx + 1}
                </span>
                <span className="break-keep text-label font-bold leading-tight">
                  {s.name}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* 현재 단계 상세 — 단계가 바뀔 때만 카드가 부드럽게 교체된다. */}
      <div className="min-h-56 sm:min-h-48">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className={`flex flex-col gap-3 border-l-4 bg-surface-2 p-4 dark:bg-surface-2-dark ${accent.border}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`w-fit px-2 py-0.5 text-label font-bold ${accent.badge}`}
              >
                {i + 1}단계 · {stage.name}
              </span>
              <span className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {stage.eyebrow}
              </span>
            </div>

            <p className="break-keep text-body font-normal leading-relaxed">
              <span className={`font-bold ${accent.text}`}>비유</span> — 마치{" "}
              {stage.analogy}.
            </p>

            <div className="flex flex-col gap-1">
              <span className="text-label font-bold tracking-wide text-badge-neutral-text dark:text-badge-neutral-text-dark">
                이 단계에서 얻는 것
              </span>
              <p className="break-keep text-body font-normal leading-relaxed">
                {stage.gains}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-label font-bold tracking-wide text-badge-neutral-text dark:text-badge-neutral-text-dark">
                아직 남은 것
              </span>
              <p className="break-keep text-body font-normal leading-relaxed">
                {stage.caveat}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 컨트롤 — 활성 점 색을 현재 단계에 맞춘다(accent를 단계별로 바꾼다). */}
      <StepControls
        i={i}
        count={STAGES.length}
        setI={setI}
        accent={stage.accent}
        unit="단계"
      />
    </ConceptFigure>
  );
}
