"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { ReviewQuizQuestion } from "@/content/review-quiz";

// 복습 객관식 블록(review quiz, quick 260906) — "스스로 점검" 카드 안에서 자가진단
// (O/△/X) 옆에 나란히 붙는 3지선다. 능동적 문제풀이와 자가 복습을 한 화면에서
// 동시에 한다("병렬"). 채점 서버 저장은 없다(파일럿) — 고른 즉시 정답·해설을 보여
// 회상 효과만 노린다. review.ts의 "복습은 채점 없는 회상 시도" 철학과 결이 같다.

export function ReviewQuizBlock({ questions }: { questions: ReviewQuizQuestion[] }) {
  // 문항별 고른 보기 인덱스(아직이면 null). 한 번 고르면 잠기고 "다시 풀기"로 초기화.
  const [selected, setSelected] = useState<(number | null)[]>(() => questions.map(() => null));

  if (questions.length === 0) return null;

  function choose(qi: number, oi: number) {
    setSelected((prev) => {
      if (prev[qi] !== null) return prev; // 이미 고름 — 유지(잠금)
      const next = [...prev];
      next[qi] = oi;
      return next;
    });
  }
  function reset(qi: number) {
    setSelected((prev) => {
      const next = [...prev];
      next[qi] = null;
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4 border-t border-line pt-3 dark:border-line-dark">
      <p className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
        객관식으로 확인 · {questions.length}문항
      </p>
      {questions.map((q, qi) => {
        const sel = selected[qi];
        const answered = sel !== null;
        const isRight = answered && sel === q.answer;
        return (
          <div key={qi} className="flex flex-col gap-2">
            <p className="text-body font-normal">
              {qi + 1}. {q.q}
            </p>
            <div className="flex flex-col gap-1.5" role="group" aria-label={`객관식 ${qi + 1}`}>
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.answer;
                const isChosen = sel === oi;
                let tone = "border-line dark:border-line-dark";
                if (answered && isCorrect) {
                  tone = "border-ok text-ok font-semibold dark:border-ok-dark dark:text-ok-dark";
                } else if (answered && isChosen) {
                  tone = "border-destructive text-destructive dark:border-destructive-dark dark:text-destructive-dark";
                } else if (answered) {
                  tone = "border-line text-badge-neutral-text dark:border-line-dark dark:text-badge-neutral-text-dark";
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={answered}
                    onClick={() => choose(qi, oi)}
                    aria-pressed={isChosen}
                    className={`tap-feedback flex min-h-11 w-full items-center gap-2 border px-3 py-2 text-left text-body ${tone}`}
                  >
                    <span className="flex-1">{opt}</span>
                    {answered && isCorrect ? <Check className="size-4 shrink-0" aria-hidden="true" /> : null}
                    {answered && isChosen && !isCorrect ? <X className="size-4 shrink-0" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
            {answered ? (
              <div className="flex flex-col gap-1.5">
                <p
                  role="status"
                  className={`text-label font-semibold ${
                    isRight ? "text-ok dark:text-ok-dark" : "text-destructive dark:text-destructive-dark"
                  }`}
                >
                  {isRight ? "정답이에요" : "정답을 확인해 보세요"}
                </p>
                <p className="text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {q.explain}
                </p>
                <button
                  type="button"
                  onClick={() => reset(qi)}
                  className="tap-feedback inline-flex min-h-11 w-fit items-center text-label font-semibold text-accent dark:text-accent-dark"
                >
                  다시 풀기
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
