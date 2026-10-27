"use client";

import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import type { BasecampQuizQuestion } from "@/content/basecamp-review";
import { ReviewCode } from "@/components/basecamp/review-code";
import { QuizAnswerPanel } from "@/components/quiz-answer-panel";
import { shuffledOrder } from "@/components/basecamp/basecamp-quiz-set";
import { recordQuizAnswer } from "@/app/quiz-mistake-actions";

// 수업 종합 퀴즈의 시험 모드(2026-10-27). 연습 모드(BasecampQuizSet)와 달리 고르는 동안에는
// 정답을 보여 주지 않고, "채점하기"를 누르면 점수와 문항별 해설을 한 번에 보여 준다.
// 채점할 때 고른 문항마다 기존 기록 액션을 불러 풀이 기록과 오답 노트에 그대로 쌓는다
// (안 고른 문항은 기록하지 않는다). 보기 순서는 연습 모드와 같은 고정 순열로 섞는다.

export function ClassExamQuiz({
  questions: source,
  keys,
  labels,
  canRecord,
}: {
  questions: readonly BasecampQuizQuestion[];
  /** 문항마다 오답 키(원본 순서) */
  keys: readonly string[];
  /** 문항 위 출처 꼬리표("N회차 제목") */
  labels: readonly string[];
  /** 로그인한 때만 true. 아니면 채점만 하고 기록하지 않는다 */
  canRecord: boolean;
}) {
  const questions = source.map((q) => {
    const order = shuffledOrder(q);
    return { ...q, order, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
  });
  const [selected, setSelected] = useState<(number | null)[]>(() => questions.map(() => null));
  const [graded, setGraded] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const chosen = selected.filter((s) => s !== null).length;
  const correct = selected.filter((s, i) => s !== null && s === questions[i].answer).length;

  function choose(qi: number, oi: number) {
    if (graded) return;
    setSelected((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });
  }

  function grade() {
    setGraded(true);
    setSaveFailed(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!canRecord) return;
    Promise.allSettled(
      selected.flatMap((sel, qi) => (sel === null ? [] : [recordQuizAnswer(keys[qi], questions[qi].order[sel])])),
    ).then((results) => {
      if (results.some((r) => r.status === "rejected")) setSaveFailed(true);
    });
  }

  function restart() {
    setSelected(questions.map(() => null));
    setGraded(false);
    setSaveFailed(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {graded ? (
        <div className="panel flex flex-col gap-3 border-l-4 border-l-accent p-5 dark:border-l-accent-dark" role="status">
          <p className="text-heading font-extrabold break-keep">
            {questions.length}문항 중 {correct}문항 맞혔어요
          </p>
          <p className="break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
            {chosen < questions.length ? `고르지 않은 ${questions.length - chosen}문항은 틀린 것으로 셌어요. ` : ""}
            {canRecord ? "틀린 문제는 오답 노트에 담겼어요. " : "로그인하면 틀린 문제가 오답 노트에 담겨요. "}
            아래에서 해설을 확인해 보세요.
            {saveFailed ? " 일부 문항은 기록하지 못했어요. 연결을 확인해 주세요." : ""}
          </p>
          <button type="button" onClick={restart} className="btn tap-feedback min-h-11 w-fit text-label">
            <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
            처음부터 다시 풀기
          </button>
        </div>
      ) : (
        <p className="border-b border-line pb-3 text-label font-semibold text-badge-neutral-text dark:border-line-dark dark:text-badge-neutral-text-dark" aria-live="polite">
          {questions.length}문항 중 {chosen}문항 골랐어요. 다 고른 뒤 맨 아래에서 채점해요.
        </p>
      )}

      <ol className="flex flex-col divide-y divide-line dark:divide-line-dark">
        {questions.map((q, qi) => {
          const sel = selected[qi];
          const isRight = sel !== null && sel === q.answer;
          return (
            <li key={keys[qi]} className="flex flex-col gap-2.5 py-6 first:pt-0 last:pb-0">
              <p className="text-label font-semibold break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {labels[qi]}
              </p>
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0 bg-foreground px-1.5 text-label font-bold text-surface dark:bg-foreground-dark dark:text-surface-dark">
                  문제 {qi + 1}
                </span>
                <p className="text-body font-semibold break-keep">{q.q}</p>
              </div>
              {q.code ? <ReviewCode code={q.code} /> : null}
              <div className="flex flex-col gap-1.5" role="group" aria-label={`${qi + 1}번 보기`}>
                {q.options.map((opt, oi) => {
                  const isChosen = sel === oi;
                  const isCorrect = oi === q.answer;
                  let tone = isChosen
                    ? "border-foreground bg-badge-neutral-bg font-semibold dark:border-foreground-dark dark:bg-badge-neutral-bg-dark"
                    : "border-line dark:border-line-dark";
                  if (graded && isCorrect) {
                    tone = "border-ok text-ok font-semibold dark:border-ok-dark dark:text-ok-dark";
                  } else if (graded && isChosen) {
                    tone = "border-destructive text-destructive dark:border-destructive-dark dark:text-destructive-dark";
                  } else if (graded) {
                    tone = "border-line text-badge-neutral-text dark:border-line-dark dark:text-badge-neutral-text-dark";
                  }
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={graded}
                      onClick={() => choose(qi, oi)}
                      aria-pressed={isChosen}
                      className={`quiz-option tap-feedback flex min-h-11 w-full items-center gap-2 border px-3 py-2 text-left text-body break-keep ${tone}`}
                    >
                      <span className="flex-1">{opt}</span>
                      {graded && isCorrect ? <Check className="size-4 shrink-0" aria-hidden="true" /> : null}
                      {graded && isChosen && !isCorrect ? <X className="size-4 shrink-0" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
              {graded ? (
                <QuizAnswerPanel isRight={isRight} correctOption={q.options[q.answer]} explain={q.explain} />
              ) : null}
            </li>
          );
        })}
      </ol>

      {!graded ? (
        <button
          type="button"
          onClick={grade}
          disabled={chosen === 0}
          className="btn-action tap-feedback min-h-11 w-fit px-5 text-label"
        >
          채점하기 ({chosen}/{questions.length})
        </button>
      ) : null}
    </div>
  );
}
