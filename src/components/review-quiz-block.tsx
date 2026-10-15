"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { ReviewQuizQuestion } from "@/content/review-quiz";
import { QuizAnswerPanel } from "@/components/quiz-answer-panel";
import { recordQuizAnswer } from "@/app/quiz-mistake-actions";
import type { QuizAnswerOutcome } from "@/lib/quiz-mistake-store";
import { attemptLabel, loadQuizAttempts, type QuizAttempt } from "@/lib/quiz-attempts-client";

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
  // 계정의 지난 풀이 기록(2026-10-15). 문항마다 "지난번 맞힘/틀림"만 붙이고 고른 보기는
  // 되살리지 않는다. 한 화면의 여러 블록이 요청 하나를 나눠 쓴다(quiz-attempts-client).
  const [past, setPast] = useState<Map<string, QuizAttempt> | null>(null);

  useEffect(() => {
    if (!keys || keys.length === 0) return;
    let alive = true;
    loadQuizAttempts().then((map) => {
      if (alive && map) setPast(map);
    });
    return () => {
      alive = false;
    };
    // keys는 서버가 그린 고정 배열이라 처음 한 번만 받으면 된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        객관식으로 확인 ({questions.length}문항)
      </p>
      <ol className="flex flex-col divide-y divide-line dark:divide-line-dark">
      {questions.map((q, qi) => {
        const sel = selected[qi];
        const answered = sel !== null;
        const isRight = answered && sel === q.answer;
        const key = keys?.[qi];
        const attempt = !answered && key ? past?.get(key) : undefined;
        const save = saved[qi];
        return (
          <li key={qi} className="flex flex-col gap-2 py-5 first:pt-0 last:pb-0">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 bg-foreground px-1.5 text-label font-bold text-surface dark:bg-foreground-dark dark:text-surface-dark">
                문제 {qi + 1}
              </span>
              <p className="text-body font-normal break-keep">{q.q}</p>
            </div>
            {attempt ? (
              <p
                className={`text-label font-semibold ${
                  attempt.lastCorrect ? "text-ok dark:text-ok-dark" : "text-destructive dark:text-destructive-dark"
                }`}
              >
                {attemptLabel(attempt)}
              </p>
            ) : null}
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
              <QuizAnswerPanel
                isRight={isRight}
                correctOption={q.options[q.answer]}
                explain={q.explain}
                saveFailed={save === "failed"}
                outcomeText={save && save !== "failed" ? OUTCOME_TEXT[save] : null}
                onRetry={() => reset(qi)}
              />
            ) : null}
          </li>
        );
      })}
      </ol>
    </div>
  );
}
