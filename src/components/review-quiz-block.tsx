"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { ReviewQuizQuestion } from "@/content/review-quiz";
import { recordQuizAnswer } from "@/app/quiz-mistake-actions";
import type { QuizAnswerOutcome } from "@/lib/quiz-mistake-store";

// 복습 객관식 블록(review quiz, quick 260906) — "스스로 점검" 카드 안에서 자가진단
// (O/△/X) 옆에 나란히 붙는 3지선다. 능동적 문제풀이와 자가 복습을 한 화면에서
// 동시에 한다("병렬"). 채점 서버 저장은 없다(파일럿) — 고른 즉시 정답·해설을 보여
// 회상 효과만 노린다. review.ts의 "복습은 채점 없는 회상 시도" 철학과 결이 같다.

// 오답 노트(2026-10-14): keys를 넘기면 고를 때마다 서버에 기록한다. 틀린 문항은 계정의
// 오답 노트(/review/mistakes)에 담기고, 연속으로 맞히면 빠진다(quiz-mistake-store.ts).
const OUTCOME_TEXT: Record<QuizAnswerOutcome, string | null> = {
  added: "오답 노트에 담았어요",
  "still-wrong": "오답 노트에 그대로 있어요",
  streak: "한 번 더 맞히면 오답 노트에서 빠져요",
  cleared: "오답 노트에서 뺐어요",
  ignored: null,
};

export function ReviewQuizBlock({
  questions,
  keys,
}: {
  questions: ReviewQuizQuestion[];
  /** 문항마다 오답 노트 키. 없으면 기록하지 않는다. */
  keys?: readonly string[];
}) {
  // 문항별 고른 보기 인덱스(아직이면 null). 한 번 고르면 잠기고 "다시 풀기"로 초기화.
  const [selected, setSelected] = useState<(number | null)[]>(() => questions.map(() => null));
  // 문항별 기록 결과 — null(아직/기록 안 함), 결과 문구, 또는 "failed".
  const [saved, setSaved] = useState<(QuizAnswerOutcome | "failed" | null)[]>(() => questions.map(() => null));

  if (questions.length === 0) return null;

  function setSave(qi: number, value: QuizAnswerOutcome | "failed" | null) {
    setSaved((prev) => {
      const next = [...prev];
      next[qi] = value;
      return next;
    });
  }

  function choose(qi: number, oi: number) {
    if (selected[qi] !== null) return; // 이미 고름 — 유지(잠금)
    setSelected((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });
    const key = keys?.[qi];
    if (!key) return;
    setSave(qi, null);
    recordQuizAnswer(key, oi)
      .then((outcome) => setSave(qi, outcome))
      .catch(() => setSave(qi, "failed"));
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
                    className={`quiz-option tap-feedback flex min-h-11 w-full items-center gap-2 border px-3 py-2 text-left text-body ${tone}`}
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
                {saved[qi] === "failed" ? (
                  <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                    오답 노트에 기록하지 못했어요. 연결을 확인한 뒤 다시 풀어 보세요.
                  </p>
                ) : saved[qi] && OUTCOME_TEXT[saved[qi] as QuizAnswerOutcome] ? (
                  <p className="text-label font-semibold text-accent dark:text-accent-dark">
                    {OUTCOME_TEXT[saved[qi] as QuizAnswerOutcome]}
                  </p>
                ) : null}
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
