// 브라우저에서 객관식 풀이 기록을 한 번만 받아 나눠 쓰는 작은 로더(2026-10-15). 한 화면에
// 퀴즈 묶음이 여러 개(/review는 수십 개) 붙어도 /api/quiz-attempts 요청은 한 번만 나간다.
// 로그인하지 않았거나 읽기에 실패하면 null — 화면은 기록 없이 예전처럼 동작한다.

import type { QuizAttemptsResponse } from "@/app/api/quiz-attempts/route";

export type QuizAttempt = { lastCorrect: boolean; lastAnsweredAt: string };

let pending: Promise<Map<string, QuizAttempt> | null> | null = null;

export function loadQuizAttempts(): Promise<Map<string, QuizAttempt> | null> {
  if (!pending) {
    pending = fetch("/api/quiz-attempts", { cache: "no-store" })
      .then((res) => res.json() as Promise<QuizAttemptsResponse>)
      .then((data) =>
        data.unlocked && data.ok
          ? new Map(data.attempts.map((row) => [row.key, { lastCorrect: row.lastCorrect, lastAnsweredAt: row.lastAnsweredAt }]))
          : null,
      )
      .catch(() => null)
      .finally(() => {
        // 다른 페이지로 갔다 오면 새로 받도록 잠시 뒤 비운다.
        setTimeout(() => {
          pending = null;
        }, 1000);
      });
  }
  return pending;
}

const dayFormat = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" });

/** "지난번 맞힘 (10월 15일)" 같은 짧은 표시. */
export function attemptLabel(attempt: QuizAttempt): string {
  return `지난번 ${attempt.lastCorrect ? "맞힘" : "틀림"} (${dayFormat.format(new Date(attempt.lastAnsweredAt))})`;
}
