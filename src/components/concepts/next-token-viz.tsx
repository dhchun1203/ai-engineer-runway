"use client";

// 번외 "AI 뜯어보기" — 개념 "다음 단어 맞히기"의 대표 시각화.
// 온도(temperature) 슬라이더를 움직이면 후보 단어 5개의 확률 분포가 실시간으로
// 뾰족해졌다(낮은 온도) 평평해졌다(높은 온도) 한다. "AI는 다음 토큰을 확률로 고른다"는
// 개념을, 글이 아니라 손잡이를 직접 돌려 붙잡게 하는 것이 목적.
//
// prose 안(개념 리더)에서 렌더되므로 ConceptFigure가 not-prose로 타이포 상속을 끊는다.
// 애니메이션은 motion 하나만 쓰고, prefers-reduced-motion이면 막대 이동을 끈다.
// 외부 데이터 없이 로짓 상수만 두고 softmax는 이 파일 안에서 직접 계산한다(라이브러리 금지).

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ACCENT, ConceptFigure, type Accent } from "@/components/concepts/viz-kit";

// 온도 강조색: 열(熱)을 연상시키는 앰버 = ACCENT[3]. 인라인 색은 쓰지 않는다.
const ACC: Accent = 3;

// 프롬프트 뒤에 올 후보 5개의 '기본 점수(logit, 각 단어가 얼마나 그럴듯한지 매긴 원점수)'.
// 외부 데이터 없이 상수로 고정한다 — 김치찌개가 가장 그럴듯하고 샐러드가 가장 안 그럴듯하다.
const CANDIDATES: readonly { word: string; logit: number }[] = [
  { word: "김치찌개", logit: 3.0 },
  { word: "라면", logit: 2.2 },
  { word: "떡볶이", logit: 1.5 },
  { word: "초밥", logit: 1.0 },
  { word: "샐러드", logit: 0.3 },
];

// softmax를 직접 계산한다. 각 로짓을 온도로 나눈 뒤 지수를 취해 전체 합이 1이 되게
// 정규화한다. 온도가 낮으면(÷작은 수) 점수 차이가 벌어져 1등이 뾰족해지고, 높으면
// (÷큰 수) 차이가 눌려 모두 평평해진다. max를 빼는 건 지수 오버플로를 막는 안정화.
function softmax(logits: readonly number[], temperature: number): number[] {
  const scaled = logits.map((l) => l / temperature);
  const max = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function TemperatureViz() {
  const [temp, setTemp] = useState(0.7);
  const reduce = useReducedMotion();

  const probs = softmax(
    CANDIDATES.map((c) => c.logit),
    temp,
  );
  const topIndex = probs.indexOf(Math.max(...probs));

  // 현재 온도가 낮은지 높은지에 따라 한 줄 해설을 바꿔 핵심 메시지를 못 박는다.
  const mood =
    temp <= 0.6
      ? "낮은 온도 — 1등만 뾰족합니다. 거의 매번 같은 답이 나와요(안전·일관)."
      : temp >= 1.4
        ? "높은 온도 — 여러 후보가 평평합니다. 답이 매번 과감하게 달라져요(다양·모험)."
        : "중간 온도 — 1등이 유력하지만 가끔 다른 답도 튀어나옵니다.";

  return (
    <ConceptFigure label="온도 슬라이더 · 다음 단어 확률 바꾸기">
      {/* 프롬프트와 현재 '고른 다음 단어'. 온도에 따라 argmax가 바뀌면 여기 채워진 말도 바뀐다. */}
      <div className="flex flex-wrap items-center gap-2 text-body">
        <span className="break-keep font-bold">오늘 점심 뭐 먹지? →</span>
        <span
          className={`inline-flex min-h-8 items-center px-3 py-1 font-bold ${ACCENT[ACC].badge}`}
        >
          {CANDIDATES[topIndex].word}
        </span>
      </div>

      {/* 후보별 확률 막대. 길이 = 확률. 온도를 낮추면 1등 막대만 길어지고, 높이면 고르게 퍼진다. */}
      <ul className="flex flex-col gap-2.5">
        {CANDIDATES.map((c, idx) => {
          const pct = Math.round(probs[idx] * 100);
          const isTop = idx === topIndex;
          return (
            <li
              key={c.word}
              className="grid grid-cols-[4.5rem_1fr_2.75rem] items-center gap-2 sm:grid-cols-[5.5rem_1fr_3rem] sm:gap-3"
            >
              <span className="flex items-center gap-1 break-keep text-label font-bold sm:text-body">
                {isTop && (
                  <span aria-hidden="true" className="leading-none">
                    👑
                  </span>
                )}
                {c.word}
              </span>

              <div className="h-7 w-full overflow-hidden border-2 border-line bg-surface-2 dark:border-line-dark dark:bg-surface-2-dark">
                <motion.div
                  className={`h-full ${ACCENT[ACC].badge}`}
                  animate={{ width: `${probs[idx] * 100}%` }}
                  transition={reduce ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
                />
              </div>

              <span
                className={`text-right text-label font-bold tabular-nums ${
                  isTop ? ACCENT[ACC].text : "text-badge-neutral-text dark:text-badge-neutral-text-dark"
                }`}
              >
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>

      {/* 온도 손잡이 — 접근성 라벨 + 44px 터치 높이 + 값 표시. accent-*로 트랙/썸에 강조색을 준다. */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="next-token-temp" className="text-label font-bold">
            온도(temperature) 손잡이
          </label>
          <span className={`text-body font-bold tabular-nums ${ACCENT[ACC].text}`}>
            {temp.toFixed(1)}
          </span>
        </div>
        <input
          id="next-token-temp"
          type="range"
          min={0.1}
          max={2}
          step={0.1}
          value={temp}
          onChange={(e) => setTemp(Number(e.target.value))}
          aria-valuetext={`온도 ${temp.toFixed(1)}`}
          className="h-11 w-full cursor-pointer touch-manipulation accent-step-3 dark:accent-step-3-dark"
        />
        <div
          className="flex justify-between text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark"
          aria-hidden="true"
        >
          <span>← 낮음 · 뾰족 · 안전</span>
          <span>높음 · 평평 · 과감 →</span>
        </div>
      </div>

      <p className="break-keep text-label font-bold leading-relaxed">{mood}</p>
    </ConceptFigure>
  );
}
