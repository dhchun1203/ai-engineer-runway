"use client";

import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import type { BasecampQuizQuestion } from "@/content/basecamp-review";
import { ReviewCode } from "@/components/basecamp/review-code";

// 베이스캠프 복습 퀴즈 한 STEP 묶음. 복습 객관식(review-quiz-block)과 같은 규칙을 따른다:
// 고르는 즉시 채점하고 해설을 보여 주며, 서버에 저장하지 않는다(꺼내 보는 연습이 목적).
// 다른 점은 문항에 코드 상자가 붙고, 묶음 위에 "맞힌 수 / 푼 수"와 전체 다시 풀기가 있다.

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

export function BasecampQuizSet({ questions: source }: { questions: readonly BasecampQuizQuestion[] }) {
  // 보기 순서를 섞은 문항(정답 인덱스도 따라 옮긴다).
  const questions = source.map((q) => {
    const order = shuffledOrder(q);
    return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
  });
  const [selected, setSelected] = useState<(number | null)[]>(() => questions.map(() => null));

  const solved = selected.filter((s) => s !== null).length;
  const correct = selected.filter((s, i) => s !== null && s === questions[i].answer).length;

  function choose(qi: number, oi: number) {
    setSelected((prev) => {
      if (prev[qi] !== null) return prev;
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
        return (
          <div key={qi} className="flex flex-col gap-2.5">
            <p className="text-body font-semibold break-keep">
              {qi + 1}. {q.q}
            </p>
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
