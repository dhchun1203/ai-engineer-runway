"use client";

import { Check, RotateCcw, X } from "lucide-react";

// 객관식 정답지 상자(2026-10-15) — 베이스캠프 복습 퀴즈와 /review 객관식이 함께 쓴다.
// 보기를 고른 뒤에만 나타나고, 문제 영역과 확실히 구분되도록 색 띠와 옅은 바탕을 가진
// 별도 상자로 그린다(맞힘은 초록, 틀림은 빨강). 머리글에서 정답 여부와 정답 보기를 먼저
// 말하고, 그 아래에 "해설"을 읽기 좋은 본문 크기로 둔다. 색 규칙은 globals.css의 .quiz-answer.

export function QuizAnswerPanel({
  isRight,
  correctOption,
  explain,
  saveFailed,
  outcomeText,
  onRetry,
}: {
  isRight: boolean;
  /** 정답 보기의 글자(틀렸을 때 머리글에 보여 준다) */
  correctOption: string;
  explain: string;
  saveFailed?: boolean;
  outcomeText?: string | null;
  onRetry: () => void;
}) {
  return (
    <div
      className={`quiz-answer ${isRight ? "quiz-answer-right" : "quiz-answer-wrong"} flex flex-col gap-2.5 px-4 py-3.5`}
      role="region"
      aria-label="정답과 해설"
    >
      <p
        role="status"
        className={`flex items-start gap-1.5 text-body font-extrabold break-keep ${
          isRight ? "text-ok dark:text-ok-dark" : "text-destructive dark:text-destructive-dark"
        }`}
      >
        {isRight ? (
          <Check className="mt-1 size-4 shrink-0" aria-hidden="true" />
        ) : (
          <X className="mt-1 size-4 shrink-0" aria-hidden="true" />
        )}
        <span>{isRight ? "정답이에요" : `오답이에요. 정답은 "${correctOption}"`}</span>
      </p>
      <div className="flex flex-col gap-1">
        <span className="text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">해설</span>
        <p className="text-body leading-relaxed break-keep">{explain}</p>
      </div>
      {saveFailed ? (
        <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          오답 노트에 기록하지 못했어요. 연결을 확인한 뒤 다시 풀어 보세요.
        </p>
      ) : null}
      {outcomeText ? (
        <p className="text-label font-semibold text-accent dark:text-accent-dark">{outcomeText}</p>
      ) : null}
      <button
        type="button"
        onClick={onRetry}
        className="tap-feedback inline-flex min-h-11 w-fit items-center gap-1.5 text-label font-semibold text-accent dark:text-accent-dark"
      >
        <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
        이 문제 다시 풀기
      </button>
    </div>
  );
}
