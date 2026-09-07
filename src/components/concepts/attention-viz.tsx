"use client";

// 번외 "AI 뜯어보기" — 개념 "어텐션" 편의 대표 시각화.
// 한 문장을 단어 토큰 버튼으로 늘어놓고, 사용자가 한 단어를 누르면 그 단어가
// '주목'하는 다른 단어들이 배경 진하기(=어텐션 가중치)로 밝아진다. "그것이"를
// 누르면 대명사가 가리키는 "동물이"가 가장 강하게 빛나 — 어텐션이 곧 "각 단어가
// 문맥의 어느 단어를 얼마나 볼지" 정하는 일임을 글이 아니라 조작으로 붙잡게 한다.
//
// 가중치는 실제 모델 값이 아니라 직관을 위한 "예시" 상수다(외부 데이터 없음).
// prose 안(개념 리더)에서 렌더되므로 ConceptFigure가 not-prose로 타이포를 끊는다.
// 색은 viz-kit ACCENT의 solid/badge/border만 쓰고(테마 안전), 강조 세기는 색이
// 아니라 opacity로만 준다 — 인라인 색 하드코딩 금지 규칙을 지킨다.

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ACCENT,
  ConceptFigure,
  type Accent,
} from "@/components/concepts/viz-kit";

// 강조에 쓰는 팔레트 고정. 눌린 단어(질의)는 3색으로 또렷하게, 그 단어가 보는
// 다른 단어들의 하이라이트는 1색 배경 + opacity로 세기를 표현한다.
const QUERY: Accent = 3;
const FOCUS: Accent = 1;

// 예문 — 대명사 해소가 드러나는 문장. "그것이"가 무엇을 가리키는지가 어텐션의
// 고전적 예시다("The animal didn't cross the street because it was too tired").
const TOKENS: readonly string[] = [
  "그", // 0
  "동물이", // 1
  "길을", // 2
  "건너지", // 3
  "못한", // 4
  "건", // 5
  "그것이", // 6
  "너무", // 7
  "지쳤기", // 8
  "때문이다", // 9
];

// 각 단어(질의)가 다른 단어를 "얼마나 볼지"의 가중치(0~1). 실제 모델이 계산한
// 값이 아니라, 문맥 관계를 눈으로 느끼게 하려고 손으로 넣은 직관용 예시다.
// 표기: WEIGHTS[질의 인덱스][대상 인덱스] = 가중치. 없는 대상은 0(강조 안 함).
const WEIGHTS: Record<number, Record<number, number>> = {
  0: { 1: 0.9 }, // 그 → 동물이
  1: { 0: 0.35, 2: 0.45, 3: 0.6, 8: 0.35 }, // 동물이 → 건너지·길을…
  2: { 1: 0.45, 3: 0.85 }, // 길을 → 건너지
  3: { 1: 0.45, 2: 0.85, 4: 0.5 }, // 건너지 → 길을
  4: { 3: 0.75, 5: 0.4 }, // 못한 → 건너지
  5: { 3: 0.55, 4: 0.55 }, // 건 → 못한
  6: { 1: 0.95, 7: 0.35, 8: 0.55 }, // 그것이 → 동물이(가장 강하게)
  7: { 6: 0.4, 8: 0.85 }, // 너무 → 지쳤기
  8: { 1: 0.5, 6: 0.65, 7: 0.45 }, // 지쳤기 → 그것이·동물이
  9: { 4: 0.45, 8: 0.7 }, // 때문이다 → 지쳤기
};

export function AttentionViz() {
  const [selected, setSelected] = useState<number | null>(null);
  const reduce = useReducedMotion();

  const weights = selected === null ? null : (WEIGHTS[selected] ?? {});

  // 눌린 단어가 "가장 강하게 본" 단어 — 캡션에서 한 줄로 짚어준다.
  let topIdx: number | null = null;
  if (weights) {
    let best = 0;
    for (const [k, w] of Object.entries(weights)) {
      if (w > best) {
        best = w;
        topIdx = Number(k);
      }
    }
  }

  return (
    <ConceptFigure label="어텐션 · 단어를 눌러 '어디를 보는지' 켜보기">
      <p className="break-keep text-body font-normal leading-relaxed">
        아래 문장에서 단어 하나를 눌러보세요. 그 단어가{" "}
        <strong>지금 문맥에서 주목하는 다른 단어</strong>일수록 배경이 진하게
        밝아집니다.
      </p>

      {/* 문장 = 단어 토큰 버튼 한 줄(좁아지면 줄바꿈). 하나를 누르면 질의가 되고,
          나머지는 가중치만큼 배경이 진해진다. */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="문장의 단어들 — 하나를 눌러 어텐션을 확인하세요"
      >
        {TOKENS.map((tok, idx) => {
          const isQuery = selected === idx;
          const w = weights ? (weights[idx] ?? 0) : 0;
          const isFocused = !isQuery && w > 0;
          // 가중치를 배경 진하기로: 최소 0.18에서 시작해 가중치만큼 짙어진다.
          const opacity = isFocused ? 0.18 + w * 0.82 : 0;

          return (
            <button
              key={idx}
              type="button"
              aria-pressed={isQuery}
              onClick={() => setSelected(isQuery ? null : idx)}
              className={`relative min-h-11 overflow-hidden border-2 px-3 py-2 text-body font-bold break-keep transition-colors ${
                isQuery
                  ? ACCENT[QUERY].solid
                  : isFocused
                    ? ACCENT[FOCUS].border
                    : "border-line dark:border-line-dark"
              }`}
            >
              {/* 하이라이트 배경 층 — 색은 ACCENT 고정, 세기는 opacity로만.
                  글자는 이 층 위(relative)라 흐려지지 않는다. */}
              {isFocused && (
                <motion.span
                  aria-hidden="true"
                  className={`absolute inset-0 ${ACCENT[FOCUS].badge}`}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity }}
                  transition={reduce ? { duration: 0 } : { duration: 0.3 }}
                />
              )}
              <span className="relative">{tok}</span>
            </button>
          );
        })}
      </div>

      {/* 캡션 — 무엇을 눌렀고 그 단어가 무엇을 가장 강하게 봤는지 한 줄로. */}
      <div className="min-h-6" aria-live="polite">
        {selected === null ? (
          <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            아직 아무 단어도 고르지 않았어요. 위에서 <strong>“그것이”</strong>를
            눌러보면 무엇을 가리키는지 드러납니다.
          </p>
        ) : (
          <p className="break-keep text-label font-bold">
            <span className={ACCENT[QUERY].text}>“{TOKENS[selected]}”</span>
            {topIdx === null ? (
              <> 는 특별히 볼 단어가 없어요.</>
            ) : (
              <>
                {" "}가 가장 강하게 본 단어:{" "}
                <span className={ACCENT[FOCUS].text}>“{TOKENS[topIdx]}”</span>
              </>
            )}
          </p>
        )}
      </div>

      <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
        ※ 여기 가중치는 실제 모델이 계산한 값이 아니라, 관계를 눈으로 느끼게 하려고
        넣은 <strong>예시</strong>입니다. 진짜 모델은 이 "얼마나 볼지"를 문장마다
        스스로 계산합니다.
      </p>
    </ConceptFigure>
  );
}
