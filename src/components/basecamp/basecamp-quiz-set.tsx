"use client";

import { useEffect, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import type { BasecampQuizQuestion } from "@/content/basecamp-review";
import { ReviewCode } from "@/components/basecamp/review-code";
import { QuizAnswerPanel } from "@/components/quiz-answer-panel";
import { recordQuizAnswer } from "@/app/quiz-mistake-actions";
import type { QuizAnswerOutcome } from "@/lib/quiz-mistake-store";
import { attemptLabel, loadQuizAttempts, type QuizAttempt } from "@/lib/quiz-attempts-client";

// 객관식 퀴즈 한 묶음. 베이스캠프 복습 퀴즈와 오답 노트가 함께 쓴다. 고르는 즉시 채점하고
// 해설을 보여 주며, 문항 위에 "맞힌 수 / 푼 수"와 전체 다시 풀기가 있다.
//
// 오답 노트(2026-10-14): keys를 넘기면 답을 고를 때마다 서버에 기록한다. 틀리면 오답 노트에
// 담기고, 오답 노트에 있던 문제를 연속으로 맞히면 빠진다(규칙은 quiz-mistake-store.ts).
// 채점 표시는 기록을 기다리지 않고 바로 보여 주고, 기록 결과는 해설 아래 한 줄로 알린다.
//
// 풀이 기록(2026-10-15): keys가 있으면 계정의 지난 풀이 결과를 받아, 문항마다 "지난번 맞힘/틀림"을
// 붙이고 묶음 위에 "몇 문항 풀었고 몇 문항 맞혔는지"를 보여 준다. 고른 보기는 되살리지 않는다
// (다시 열었을 때 답이 미리 보이면 꺼내 보는 연습이 안 된다). "안 푼 문제만 보기"로 이어 푼다.

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
  // 계정의 지난 풀이 기록(로그인 안 했거나 keys가 없으면 null).
  const [past, setPast] = useState<Map<string, QuizAttempt> | null>(null);
  // 화면을 연 순간 이미 풀어 본 문항 키 — "안 푼 문제만 보기"는 이 기준으로 거른다. 이번에
  // 푼 문항이 눈앞에서 사라지지 않게, 열었을 때의 상태로 고정한다.
  const [solvedAtOpen, setSolvedAtOpen] = useState<Set<string>>(() => new Set());
  const [onlyUnsolved, setOnlyUnsolved] = useState(false);

  useEffect(() => {
    if (!keys || keys.length === 0) return;
    let alive = true;
    loadQuizAttempts().then((map) => {
      if (!alive || !map) return;
      setPast(map);
      setSolvedAtOpen(new Set(keys.filter((key) => map.has(key))));
    });
    return () => {
      alive = false;
    };
    // keys는 서버가 그린 고정 배열이라 처음 한 번만 받으면 된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // 문항별 최신 결과: 이번에 풀었으면 그 결과, 아니면 계정의 지난 기록.
  const latest = questions.map((q, qi) => {
    if (selected[qi] !== null) return selected[qi] === q.answer;
    const key = keys?.[qi];
    const attempt = key ? past?.get(key) : undefined;
    return attempt ? attempt.lastCorrect : null;
  });
  const everSolved = latest.filter((v) => v !== null).length;
  const everCorrect = latest.filter((v) => v === true).length;
  const unsolvedAtOpen = keys ? keys.filter((key) => !solvedAtOpen.has(key)).length : 0;

  let summary: string;
  if (past) {
    summary =
      everSolved === 0
        ? `${questions.length}문항, 아직 안 풀었어요`
        : `${questions.length}문항 중 ${everSolved}문항 풀었고 ${everCorrect}문항 맞혔어요`;
  } else {
    summary =
      solved === 0
        ? `${questions.length}문항`
        : `${solved}문항 풀고 ${correct}문항 맞혔어요 (전체 ${questions.length}문항)`;
  }

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
          {summary}
        </p>
        <div className="flex flex-wrap items-center gap-2">
        {past && solvedAtOpen.size > 0 && unsolvedAtOpen > 0 ? (
          <button
            type="button"
            onClick={() => setOnlyUnsolved((v) => !v)}
            aria-pressed={onlyUnsolved}
            className="btn tap-feedback text-label"
          >
            {`안 푼 문제만 보기 (${unsolvedAtOpen})`}
          </button>
        ) : null}
        {solved > 0 ? (
          <button
            type="button"
            onClick={resetAll}
            className="btn tap-feedback text-label"
          >
            <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
            모두 다시 풀기
          </button>
        ) : null}
        </div>
      </div>

      {/* 문제 목록 — 문항 사이에 구분선을 두고, 문항마다 "문제 N" 꼬리표를 단다. 답을 고르면
          그 아래에 색 띠가 있는 정답지 상자(QuizAnswerPanel)가 따로 열린다. */}
      <ol className="flex flex-col divide-y divide-line dark:divide-line-dark">
      {questions.map((q, qi) => {
        const sel = selected[qi];
        const answered = sel !== null;
        const isRight = answered && sel === q.answer;
        const save = saves[qi];
        const outcomeText = save.kind === "done" ? OUTCOME_TEXT[save.outcome] : null;
        const key = keys?.[qi];
        if (onlyUnsolved && key && solvedAtOpen.has(key)) return null;
        const attempt = !answered && key ? past?.get(key) : undefined;
        return (
          <li key={qi} className="flex flex-col gap-2.5 py-6 first:pt-0 last:pb-0">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 bg-foreground px-1.5 text-label font-bold text-surface dark:bg-foreground-dark dark:text-surface-dark">
                문제 {qi + 1}
              </span>
              <p className="text-body font-semibold break-keep">{q.q}</p>
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
              <QuizAnswerPanel
                isRight={isRight}
                correctOption={q.options[q.answer]}
                explain={q.explain}
                saveFailed={save.kind === "failed"}
                outcomeText={outcomeText}
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
