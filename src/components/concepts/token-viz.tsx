"use client";

// 번외 "AI 뜯어보기" 개념 1편 "토큰"의 대표 시각화 — 토크나이저 체험.
// 예문을 칩으로 고르면 그 문장이 토큰 칩들로 쪼개져 stagger로 등장하고, 총 개수를
// 배지로 보여준다. 핵심 메시지: AI는 글자·단어가 아니라 '토큰 조각' 단위로 읽으며,
// 같은 뜻이라도 한국어가 영어보다 더 잘게 쪼개져 토큰 수가 많아진다(→ 비용도 늘 수 있음).
// 주의: 여기 토큰 분해는 실제 토크나이저가 아니라 감을 잡기 위한 정직한 "예시" 분해다.
//
// prose 안(개념 리더)에서 렌더되므로 ConceptFigure(not-prose)로 감싸 타이포 상속을 끊고,
// 색·컨트롤은 viz-kit 공용 키트만 쓴다. 애니메이션은 motion 하나만, reduced-motion이면 끈다.

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ACCENT, ConceptFigure, type Accent } from "@/components/concepts/viz-kit";

// 한 예문 = 원문 + 예시 토큰 배열 + 강조색. 토큰 배열은 실제 토크나이저가 아니라
// "이 정도 조각으로 쪼개진다"는 감을 주기 위한 손으로 고른 예시다(컴포넌트 안 상수).
// 영어는 대체로 단어·접두접미 단위, 한국어는 조사·어미가 붙어 더 잘게 쪼개지는 경향을
// 보여주도록 짝지었다.
type Example = {
  id: string;
  lang: "en" | "ko";
  label: string; // 칩에 보일 짧은 라벨
  text: string; // 원문
  tokens: string[]; // 예시 토큰 조각들
  accent: Accent;
};

// 같은 뜻의 영어↔한국어 쌍을 두 세트 둔다. 같은 의미인데 한국어 토큰 수가 더 많다는
// 대비가 한눈에 보이도록, 뜻이 짝이 되는 예문을 위아래로 붙여 배치한다.
const EXAMPLES: readonly Example[] = [
  {
    id: "en-smart",
    lang: "en",
    label: "영어 · AI is smart",
    text: "AI is smart",
    tokens: ["AI", " is", " smart"],
    accent: 1,
  },
  {
    id: "ko-smart",
    lang: "ko",
    label: "한국어 · AI는 똑똑해",
    text: "AI는 똑똑해",
    tokens: ["AI", "는", " 똑", "똑", "해"],
    accent: 2,
  },
  {
    id: "en-cat",
    lang: "en",
    label: "영어 · unbelievable",
    text: "unbelievable",
    tokens: ["un", "believ", "able"],
    accent: 1,
  },
  {
    id: "ko-cat",
    lang: "ko",
    label: "한국어 · 믿을 수 없어",
    text: "믿을 수 없어",
    tokens: ["믿", "을", " 수", " 없", "어"],
    accent: 2,
  },
];

// 공백 토큰은 화면에서 안 보이니 시각적으로 드러나게 치환한다. 토큰 경계 앞에 붙는
// 공백을 밑줄 기호(␣)로 바꿔 "이 조각은 앞에 띄어쓰기를 포함한다"를 그림처럼 보여준다.
function renderTokenText(token: string): string {
  return token.replace(/ /g, "␣");
}

export function TokenViz() {
  const [selectedId, setSelectedId] = useState<string>(EXAMPLES[0].id);
  const reduce = useReducedMotion();
  const current = EXAMPLES.find((e) => e.id === selectedId) ?? EXAMPLES[0];
  const accent = ACCENT[current.accent];

  return (
    <ConceptFigure label="토크나이저 체험 · 예문을 눌러 쪼개보기">
      {/* 예문 칩 — 고르면 그 문장이 아래에서 토큰으로 쪼개진다. 44px+ 터치 타깃. */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="예문 고르기">
        {EXAMPLES.map((ex) => {
          const active = ex.id === selectedId;
          const exAccent = ACCENT[ex.accent];
          return (
            <button
              key={ex.id}
              type="button"
              onClick={() => setSelectedId(ex.id)}
              aria-pressed={active}
              className={`chip tap-feedback min-h-11 break-keep px-3 text-label font-bold ${
                active
                  ? exAccent.solid
                  : "border-line dark:border-line-dark"
              }`}
            >
              {ex.label}
            </button>
          );
        })}
      </div>

      {/* 원문 그대로 — 사람이 읽는 문장. 이걸 AI는 아래처럼 조각으로 바꿔 읽는다. */}
      <div className="flex flex-col gap-1">
        <span className="text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
          사람이 보는 문장
        </span>
        <p className="break-keep text-body font-normal leading-relaxed">
          &ldquo;{current.text}&rdquo;
        </p>
      </div>

      {/* 토큰 조각 — 예문이 바뀔 때마다 stagger로 하나씩 등장한다. */}
      <div className="flex flex-col gap-2">
        <span className="text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
          AI가 읽는 조각(토큰)
        </span>
        <div className="min-h-14">
          <AnimatePresence mode="wait">
            <motion.ol
              key={current.id}
              className="flex flex-wrap items-center gap-2"
              aria-label={`${current.label} 토큰 ${current.tokens.length}개`}
              initial={reduce ? false : "hidden"}
              animate="show"
              exit={reduce ? undefined : { opacity: 0 }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06 } },
              }}
            >
              {current.tokens.map((token, idx) => (
                <motion.li
                  key={`${current.id}-${idx}`}
                  variants={{
                    hidden: reduce ? {} : { opacity: 0, y: 8, scale: 0.9 },
                    show: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ duration: 0.2 }}
                  className={`inline-flex min-h-11 items-center border-2 px-3 py-1 font-mono text-body font-bold ${accent.border} ${accent.text}`}
                >
                  {renderTokenText(token)}
                </motion.li>
              ))}
            </motion.ol>
          </AnimatePresence>
        </div>
      </div>

      {/* 총 토큰 수 배지 + 한 줄 해석. 한국어 쪽이 대체로 더 큰 수가 나온다. */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex min-h-11 items-center px-3 py-1 text-label font-bold ${accent.badge}`}
        >
          토큰 {current.tokens.length}개
        </span>
        <span className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {current.lang === "ko"
            ? "한국어는 조사·어미가 붙어 더 잘게 쪼개지는 편이에요."
            : "영어는 대체로 단어 단위라 조각이 적은 편이에요."}
        </span>
      </div>

      <p className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
        ※ 실제 토크나이저 결과가 아니라 감을 잡기 위한 예시 분해예요. 모델·버전마다 조각을
        나누는 방식은 다릅니다.
      </p>
    </ConceptFigure>
  );
}
