"use client";

// 번외 "AI 뜯어보기" 개념편 "가중치" 시각화 — 학습 = 손잡이 맞추기.
// 목표는 하나로 고정한다: 입력 x=2에 대해 정답 y=6을 맞히기(정답 규칙은 y=3·x).
// 모델은 y = w·x라는 손잡이(w) 하나짜리 아주 단순한 기계다. 사용자가 슬라이더로
// w를 움직이면 예측(w·x)과 정답의 차이(오차)가 실시간 미터로 줄고 늘어난다.
// "한 걸음 자동 조정" 버튼은 오차를 줄이는 방향으로 w를 조금씩 미는 경사하강 직관.
// 핵심 메시지: 학습이란 정답에 가까워지도록 손잡이 값을 조금씩 맞추는 일이고,
// 진짜 모델은 이 손잡이가 수십억~수천억 개다.
//
// prose 안(개념 리더)에서 렌더되므로 ConceptFigure가 not-prose로 타이포 상속을 끊는다.
// 색은 viz-kit의 ACCENT[1|2|3]만 쓰고, 인라인 색 하드코딩은 하지 않는다.
// 애니메이션은 motion 하나만, prefers-reduced-motion이면 이동/전환을 끈다.

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ACCENT,
  ConceptFigure,
  type Accent,
} from "@/components/concepts/viz-kit";

// 고정 목표. x는 입력, TARGET_W는 정답 손잡이 값(정답 규칙 y = TARGET_W·x).
const X = 2;
const TARGET_W = 3;
const TARGET_Y = TARGET_W * X; // 정답 6

// 슬라이더 손잡이 범위. 정답(3)을 넉넉히 감싼다.
const W_MIN = 0;
const W_MAX = 6;
const STEP = 0.1;

// "한 걸음" 크기 — 오차를 줄이는 방향으로 이 폭만큼 w를 민다(경사하강 직관).
const NUDGE = 0.4;

// 오차 미터의 최대 기준값(막대 100% 기준). w가 양 끝(0 또는 6)일 때의 최대 오차.
const MAX_ERROR = Math.abs(TARGET_W * X - W_MIN * X); // |6 - 0| = 6

export function WeightsViz() {
  const [w, setW] = useState(1); // 일부러 정답에서 떨어진 값에서 출발
  const reduce = useReducedMotion();

  const predicted = w * X; // 모델의 예측 y = w·x
  const error = Math.abs(TARGET_Y - predicted); // 정답과의 차이(오차)
  const errorPct = Math.min(100, (error / MAX_ERROR) * 100);
  const close = error < 0.05; // 사실상 정답에 도달

  // 오차 크기에 따라 미터 색을 바꾼다: 크면 러스트(2), 가까우면 블루(1).
  const meterAccent: Accent = close ? 1 : 2;

  // 오차를 줄이는 방향으로 한 걸음. predicted가 정답보다 작으면 w를 키우고,
  // 크면 줄인다. 목표를 지나치지 않게 남은 거리보다 크면 딱 맞춰 세운다.
  function nudge() {
    setW((prev) => {
      const gap = TARGET_W - prev; // 손잡이 기준 남은 거리
      if (Math.abs(gap) <= NUDGE) return TARGET_W;
      const next = prev + Math.sign(gap) * NUDGE;
      return Math.round(next * 10) / 10;
    });
  }

  return (
    <ConceptFigure label="학습 = 손잡이 맞추기 · 직접 돌려보기">
      {/* 목표 안내 — 이 기계가 뭘 맞히려는지 한 줄로 못 박는다. */}
      <p className="break-keep text-body leading-relaxed">
        목표: 입력 <b>x = {X}</b> 를 넣으면 <b>정답 {TARGET_Y}</b> 이 나오게 하기.
        <br className="hidden sm:block" /> 이 기계는 손잡이 하나짜리다 —{" "}
        <b>예측 = w × x</b>. 손잡이 <b>w</b> 만 잘 맞추면 된다.
      </p>

      {/* 손잡이 슬라이더 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label
            htmlFor="weights-w"
            className="text-label font-bold tracking-wide"
          >
            손잡이 w
          </label>
          <span className={`text-body font-bold ${ACCENT[3].text}`}>
            w = {w.toFixed(1)}
          </span>
        </div>
        <input
          id="weights-w"
          type="range"
          min={W_MIN}
          max={W_MAX}
          step={STEP}
          value={w}
          onChange={(e) => setW(Number(e.target.value))}
          className="min-h-11 w-full cursor-pointer accent-step-3 dark:accent-step-3-dark"
          aria-describedby="weights-error"
        />
      </div>

      {/* 예측 vs 정답 — 지금 이 손잡이로 기계가 내놓는 답과 정답을 나란히 */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className={`flex flex-col items-center gap-1 border-2 p-3 ${ACCENT[3].border}`}
        >
          <span className="text-label font-bold tracking-wide text-badge-neutral-text dark:text-badge-neutral-text-dark">
            내 예측 (w × x)
          </span>
          <span className={`text-2xl font-bold ${ACCENT[3].text}`}>
            {predicted.toFixed(1)}
          </span>
        </div>
        <div
          className={`flex flex-col items-center gap-1 border-2 p-3 ${ACCENT[1].border}`}
        >
          <span className="text-label font-bold tracking-wide text-badge-neutral-text dark:text-badge-neutral-text-dark">
            정답
          </span>
          <span className={`text-2xl font-bold ${ACCENT[1].text}`}>
            {TARGET_Y}
          </span>
        </div>
      </div>

      {/* 오차 미터 — 예측과 정답의 차이. 손잡이가 정답에 가까울수록 0으로 수렴. */}
      <div className="flex flex-col gap-2" id="weights-error">
        <div className="flex items-baseline justify-between">
          <span className="text-label font-bold tracking-wide">
            오차 (정답과의 차이)
          </span>
          <span className={`text-body font-bold ${ACCENT[meterAccent].text}`}>
            {error.toFixed(1)}
          </span>
        </div>
        <div
          className="h-4 w-full overflow-hidden border-2 border-line bg-surface-2 dark:border-line-dark dark:bg-surface-2-dark"
          role="img"
          aria-label={`오차 ${error.toFixed(1)}`}
        >
          <motion.div
            className={`h-full ${ACCENT[meterAccent].dot}`}
            initial={false}
            animate={{ width: `${errorPct}%` }}
            transition={reduce ? { duration: 0 } : { duration: 0.25 }}
          />
        </div>
        <p className="break-keep text-label leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {close
            ? "오차 0 — 손잡이가 정답에 딱 맞았다. 이 값이 '학습된 가중치'다."
            : "손잡이를 움직여 이 막대를 0까지 줄여보세요."}
        </p>
      </div>

      {/* 자동 한 걸음 — 경사하강 직관. 오차를 줄이는 방향으로 조금씩 민다. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={nudge}
          disabled={close}
          className="btn-action tap-feedback min-h-11 px-4 text-label disabled:cursor-not-allowed disabled:opacity-40"
        >
          한 걸음 자동 조정 →
        </button>
        <button
          type="button"
          onClick={() => setW(1)}
          className="btn tap-feedback min-h-11 px-4 text-label"
        >
          ↺ 처음부터
        </button>
      </div>

      <p className="break-keep text-label leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
        &lsquo;한 걸음 자동 조정&rsquo;은 진짜 학습이 하는 일과 같다 — 오차를 보고
        손잡이를 줄어드는 쪽으로 조금씩 민다. 여긴 손잡이가 하나뿐이지만, 진짜
        모델은 이 손잡이가 수십억~수천억 개다.
      </p>
    </ConceptFigure>
  );
}
