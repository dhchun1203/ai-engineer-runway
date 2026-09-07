"use client";

// 번외 "AI 뜯어보기" 개념 7편 "컨텍스트 윈도우"의 대표 시각화 — 미끄러지는 기억의 창.
// 대화 메시지가 순서대로 쌓이고, 고정 크기의 '창(window)'이 늘 '최근 N개'만 감싼다.
// 사용자가 메시지를 더할수록 창이 아래로 미끄러지며, 창 밖으로 밀려난 가장 오래된
// 메시지는 흐려진다(= AI가 '잊음'). "AI는 무한히 기억하지 못하고 창 크기만큼만 한 번에
// 본다"를 글이 아니라 조작으로 붙잡게 하는 것이 목적.
//
// 실제 창은 토큰 단위로 훨씬 크지만, 여기선 감을 잡으라고 메시지 몇 개로 줄인 그림이다.
// prose 안(개념 리더)에서 렌더되므로 ConceptFigure가 not-prose로 타이포 상속을 끊는다.
// 애니메이션은 motion 하나만 쓰고, prefers-reduced-motion이면 이동/페이드를 끈다.

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ACCENT,
  ConceptFigure,
  type Accent,
} from "@/components/concepts/viz-kit";

// 창 크기(한 번에 기억하는 메시지 수)와 강조색. 창 안=기억 중은 이 accent 하나로 통일하고,
// 창 밖=잊음은 색이 아니라 중립 회색 톤(border-line·surface-2)+투명도로 물러나게 한다.
const WINDOW = 4;
const ACC: Accent = 1;

// 한 편의 대화 흐름. 첫 메시지에서 이름을 알려주고, 마지막 메시지에서 그 이름을 되묻는다 —
// 대화가 길어지면 초반 내용이 창 밖으로 밀려나 AI가 다시 물어야 하는 상황을 그대로 보여준다.
const MESSAGES: readonly { who: "나" | "AI"; text: string }[] = [
  { who: "나", text: "내 이름은 지훈이야. 기억해 줘." },
  { who: "나", text: "나 요즘 파이썬(Python)을 배우고 있어." },
  { who: "나", text: "오늘 리스트(list)를 공부했어." },
  { who: "나", text: "예제 코드 하나만 보여줄래?" },
  { who: "나", text: "이번엔 딕셔너리(dictionary)도 알려줘." },
  { who: "나", text: "함수(function) 예제도 궁금해." },
  { who: "나", text: "에러가 하나 나는데 같이 봐줄래?" },
  { who: "나", text: "그런데… 내 이름이 뭐였지?" },
];

export function ContextWindowViz() {
  // count = 지금까지 나눈 메시지 수. 창은 항상 이 중 '최근 WINDOW개'만 감싼다.
  const [count, setCount] = useState(WINDOW);
  const reduce = useReducedMotion();

  const full = count >= MESSAGES.length;
  const windowStart = Math.max(0, count - WINDOW); // 이 인덱스부터가 '창 안'
  const forgotten = windowStart; // 창 밖(잊은) 메시지 수
  // 마지막 '이름 되묻기' 메시지가 등장했는데, 정작 이름을 알려준 첫 메시지가 창 밖일 때 강조.
  const askedButForgot = full && windowStart > 0;

  return (
    <ConceptFigure label="컨텍스트 윈도우 · 미끄러지는 기억의 창">
      <div className="flex flex-col gap-4">
        {/* 현황 요약 — 대화 길이 / 창 크기 / 창 밖으로 밀려난 개수 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label font-bold">
          <span>
            대화 메시지 <span className={ACCENT[ACC].text}>{count}개</span>
          </span>
          <span className="text-badge-neutral-text dark:text-badge-neutral-text-dark">
            창 크기 {WINDOW}개
          </span>
          <span className="text-badge-neutral-text dark:text-badge-neutral-text-dark">
            창 밖(잊음) {forgotten}개
          </span>
        </div>

        {/* 메시지 목록 — 위(오래됨) → 아래(최근). 창 안은 accent solid로 '기억 중',
            창 밖은 회색+흐림으로 '잊음'. 메시지가 늘면 layout으로 자연스럽게 미끄러진다. */}
        <ol className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {MESSAGES.slice(0, count).map((m, idx) => {
              const inWindow = idx >= windowStart;
              return (
                <motion.li
                  key={idx}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex items-start gap-3 border-2 px-3 py-2 transition-colors duration-300 ${
                    inWindow
                      ? ACCENT[ACC].solid
                      : "border-line bg-surface-2 opacity-45 dark:border-line-dark dark:bg-surface-2-dark"
                  }`}
                >
                  <span
                    className="shrink-0 text-lg leading-tight"
                    aria-hidden="true"
                  >
                    {inWindow ? "🪟" : "🫥"}
                  </span>
                  <span className="break-keep text-body font-medium leading-snug">
                    {m.text}
                  </span>
                  <span className="ml-auto shrink-0 self-center break-keep text-label font-bold">
                    {inWindow ? "기억 중" : "잊음"}
                  </span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>

        {/* 창 밖으로 밀려난 게 생기면 '왜 회색인가'를 한 줄로 못 박는다. */}
        <div className="min-h-6">
          {askedButForgot ? (
            <span className={`inline-block px-2 py-1 text-label font-bold ${ACCENT[ACC].badge}`}>
              ↩ 이름을 알려준 첫 메시지가 창 밖으로 밀려났어요 — 그래서 AI가 다시 되묻습니다
            </span>
          ) : forgotten > 0 ? (
            <span className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
              회색 메시지는 창 밖으로 밀려나 AI가 더는 보지 못합니다.
            </span>
          ) : (
            <span className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
              지금은 모든 메시지가 창 안에 있어요. 메시지를 더 넣어 보세요.
            </span>
          )}
        </div>

        {/* 컨트롤 — 메시지 추가 / 처음부터. 자동재생 없이 직접 넘긴다(접근성·아이패드 터치). */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCount((v) => Math.min(MESSAGES.length, v + 1))}
            disabled={full}
            className="btn-action tap-feedback min-h-11 px-4 text-label disabled:cursor-not-allowed disabled:opacity-40"
          >
            + 메시지 추가
          </button>
          <button
            type="button"
            onClick={() => setCount(WINDOW)}
            className="btn tap-feedback min-h-11 px-4 text-label"
          >
            ↺ 처음부터
          </button>
          {full && (
            <span className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
              대화가 끝까지 찼어요.
            </span>
          )}
        </div>

        <p className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          실제 창은 메시지가 아니라 토큰 단위로 훨씬 크지만, 여기선 감을 잡으라고 메시지 몇 개로 줄여 그린 그림입니다.
        </p>
      </div>
    </ConceptFigure>
  );
}
