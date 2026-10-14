"use client";

import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import type { BasecampQuizQuestion } from "@/content/basecamp-review";
import { ReviewCode } from "@/components/basecamp/review-code";
import { recordQuizAnswer } from "@/app/quiz-mistake-actions";
import type { QuizAnswerOutcome } from "@/lib/quiz-mistake-store";

// 객관식 퀴즈 한 묶음. 베이스캠프 복습 퀴즈와 오답 노트가 함께 쓴다. 고르는 즉시 채점하고
// 해설을 보여 주며, 문항 위에 "맞힌 수 / 푼 수"와 전체 다시 풀기가 있다.
//
// 오답 노트(2026-10-14): keys를 넘기면 답을 고를 때마다 서버에 기록한다. 틀리면 오답 노트에
// 담기고, 오답 노트에 있던 문제를 연속으로 맞히면 빠진다(규칙은 quiz-mistake-store.ts).
// 채점 표시는 기록을 기다리지 않고 바로 보여 주고, 기록 결과는 해설 아래 한 줄로 알린다.

/** 문항 글자로 정해지는 고정 순열. 데이터에는 정답이 두 번째 보기에 몰려 있어 "2번만
 *  찍기"가 통하므로, 보여 줄 때 보기 순서를 섞어 정답 위치를 퍼뜨린다. 무작위가 아니라
 *  문항 글자에서 나온 값이라 서버와 브라우저가 같은 순서를 그린다(하이드레이션 일치). */
function shuffledOrder(q: BasecampQuizQuestion): number[] {
  let seed = 0;
  for (const ch of q.q + (q.code ?? "")) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const order = q.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const j = seed % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

const OUTCOME_TEXT: Record<QuizAnswerOutcome, string | null> = {
  added: "오답 노트에 담았어요",
  "still-wrong": "오답 노트에 그대로 있어요",
  streak: "한 번 더 맞히면 오답 노트에서 빠져요",
  cleared: "오답 노트에서 뺐어요",
  ignored: null,
};

type SaveState = { kind: "idle" } | { kind: "done"; outcome: QuizAnswerOutcome } | { kind: "failed" };

export function BasecampQuizSet({
  questions: source,
  keys,
  notes,
}: {
  questions: readonly BasecampQuizQuestion[];
  /** 문항마다 오답 노트 키(원본 순서). 없으면 기록하지 않는다. */
  keys?: readonly string[];
  /** 문항 위에 붙일 작은 안내(오답 노트의 틀린 횟수 등) */
  notes?: readonly (string | undefined)[];
}) {
  // 보기 순서를 섞은 문항(정답 인덱스도 따라 옮긴다). order는 화면 순서 → 원본 순서 표.
  const questions = source.map((q) => {
    const order = shuffledOrder(q);
    return { ...q, order, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
  });
  const [selected, setSelected] = useState<(number | null)[]>(() => questions.map(() => null));
  const [saves, setSaves] = useState<SaveState[]>(() => questions.map(() => ({ kind: "idle" })));

  function setSave(qi: number, state: SaveState) {
    setSaves((prev) => {
      const next = [...prev];
      next[qi] = state;
      return next;
    });
  }

  function record(qi: number, oi: number) {
    const key = keys?.[qi];
    if (!key) return;
    setSave(qi, { kind: "idle" });
    // 서버에는 원본 순서의 보기 번호를 보낸다(채점은 서버가 원본 데이터로 직접 한다).
    recordQuizAnswer(key, questions[qi].order[oi])
      .then((outcome) => setSave(qi, { kind: "done", outcome }))
      .catch(() => setSave(qi, { kind: "failed" }));
  }

  const solved = selected.filter((s) => s !== null).length;
  const correct = selected.filter((s, i) => s !== null && s === questions[i].answer).length;

  function choose(qi: number, oi: number) {
    if (selected[qi] !== null) return;
    setSelected((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });
    record(qi, oi);
  }
  function reset(qi: number) {
    setSelected((prev) => {
      const next = [...prev];
      next[qi] = null;
      return next;
    });
  }
  function resetAll() {
    setSelected(questions.map(() => null));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line-dark">
        <p className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark" aria-live="polite">
          {solved === 0
            ? `${questions.length}문항`
            : `${solved}문항 풀고 ${correct}문항 맞혔어요 (전체 ${questions.length}문항)`}
        </p>
        {solved > 0 ? (
          <button
            type="button"
            onClick={resetAll}
            className="tap-feedback inline-flex min-h-11 items-center gap-1.5 text-label font-semibold text-accent dark:text-accent-dark"
          >
            <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
            모두 다시 풀기
          </button>
        ) : null}
      </div>

      {questions.map((q, qi) => {
        const sel = selected[qi];
        const answered = sel !== null;
        const isRight = answered && sel === q.answer;
        const save = saves[qi];
        const outcomeText = save.kind === "done" ? OUTCOME_TEXT[save.outcome] : null;
        return (
          <div key={qi} className="flex flex-col gap-2.5">
            <p className="text-body font-semibold break-keep">
              {qi + 1}. {q.q}
            </p>
            {notes?.[qi] ? (
              <p className="text-label font-semibold text-destructive dark:text-destructive-dark">{notes[qi]}</p>
            ) : null}
            {q.code ? <ReviewCode code={q.code} /> : null}
            <div className="flex flex-col gap-1.5" role="group" aria-label={`${qi + 1}번 보기`}>
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
                    className={`quiz-option tap-feedback flex min-h-11 w-full items-center gap-2 border px-3 py-2 text-left text-body break-keep ${tone}`}
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
                <p className="text-label font-normal leading-relaxed break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {q.explain}
                </p>
                {save.kind === "failed" ? (
                  <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                    오답 노트에 기록하지 못했어요. 연결을 확인한 뒤 다시 풀어 보세요.
                  </p>
                ) : null}
                {outcomeText ? (
                  <p className="text-label font-semibold text-accent dark:text-accent-dark">{outcomeText}</p>
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
