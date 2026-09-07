"use client";

// 번외 "AI 뜯어보기" — 임베딩 검색과 RAG 편의 대표 시각화. 질문 하나가 RAG
// 파이프라인 5단계를 한 스텝씩 통과하는 과정을 보여준다. 추상적 화살표만 두면
// 와닿지 않으므로 "환불은 며칠 안에 돼?"라는 진짜 질문 하나를 끝까지 따라간다.
// 핵심 메시지: 모델은 세상 모든 최신·내부 자료를 외우지 못한다 — 질문에 맞는
// 자료를 찾아 근거로 쥐여주면(참고서 펴주기) 더 정확하고 출처 있는 답을 한다.
//
// 색·셸·컨트롤은 viz-kit에서 공유해 9편이 한 벌처럼 보이게 한다. 스텝마다 accent를
// 바꿔 진행감을 준다(인라인 색 하드코딩 금지, ACCENT[1|2|3]만 사용).
// 애니메이션은 motion 하나만 쓰고 prefers-reduced-motion이면 이동/페이드를 끈다.

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ACCENT,
  ConceptFigure,
  StepControls,
  type Accent,
} from "@/components/concepts/viz-kit";

// RAG 파이프라인의 5개 무대. accent를 1→2→3→1→2로 굴려 스텝마다 색이 바뀌게 한다.
type RagStep = {
  icon: string;
  stage: string; // 무대 라벨(짧게)
  role: string; // 상세 카드의 역할 배지
  text: string; // 그 단계에서 실제로 일어나는 내용
  accent: Accent;
};

const STEPS: readonly RagStep[] = [
  {
    icon: "🙋",
    stage: "질문 입력",
    role: "질문",
    text: '사용자가 묻는다 — "환불은 며칠 안에 돼?"',
    accent: 1,
  },
  {
    icon: "🧭",
    stage: "뜻 좌표로",
    role: "임베딩(embedding)",
    text: "질문을 '뜻 좌표'로 바꾼다. 글자가 아니라 의미로 비교하려는 준비 단계 — 가까운 뜻끼리 좌표도 가깝다.",
    accent: 2,
  },
  {
    icon: "🔎",
    stage: "근거 검색",
    role: "검색(retrieval)",
    text: '문서 조각들 중 좌표가 가장 가까운 근거를 찾는다 → 찾은 문단: "환불은 상품 수령 후 7일 이내 신청 시 가능합니다."',
    accent: 3,
  },
  {
    icon: "📎",
    stage: "근거 붙이기",
    role: "프롬프트 조립",
    text: "찾은 근거를 질문과 함께 프롬프트에 붙여 모델에 건넨다. 모델은 이제 외운 지식이 아니라 '지금 쥐여준 자료'를 근거로 삼는다.",
    accent: 1,
  },
  {
    icon: "✅",
    stage: "답변 + 출처",
    role: "답변 생성",
    text: '근거를 바탕으로 답한다 — "상품을 받은 날로부터 7일 이내에 신청하면 환불돼요. (출처: 환불 정책 문서)"',
    accent: 2,
  },
];

export function RagFlowViz() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const step = STEPS[i];
  const accent = ACCENT[step.accent];

  return (
    <ConceptFigure label="RAG 파이프라인 · 한 스텝씩 눌러보기">
      {/* 5개 무대 띠 — 가로로 흐르다 좁아지면 줄바꿈. 지나온 단계와 지금 단계를
          색으로 채워, 질문이 어디까지 흘러왔는지 한눈에 보이게 한다. */}
      <ol className="flex flex-wrap items-stretch gap-2" aria-label="RAG 단계">
        {STEPS.map((s, idx) => {
          const done = idx <= i;
          const stageAccent = ACCENT[s.accent];
          return (
            <li key={s.stage} className="flex-1 basis-24">
              <div
                className={`flex h-full min-h-11 flex-col items-center justify-center gap-1 border-2 px-2 py-2 text-center transition-colors duration-200 ${
                  done ? stageAccent.solid : "border-line dark:border-line-dark"
                }`}
                aria-current={idx === i ? "step" : undefined}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {s.icon}
                </span>
                <span className="break-keep text-label font-bold leading-tight">
                  {s.stage}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* 현재 스텝 상세 — 역할 배지 + 그 단계에서 실제로 오간 내용. 스텝이 바뀔
          때만 부드럽게 교체한다. */}
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
            <span
              className={`w-fit px-2 py-0.5 text-label font-bold ${accent.badge}`}
            >
              {step.icon} {i + 1}. {step.role}
            </span>
            <p className="break-keep text-body font-normal leading-relaxed">
              {step.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <StepControls i={i} count={STEPS.length} setI={setI} accent={step.accent} />
    </ConceptFigure>
  );
}
