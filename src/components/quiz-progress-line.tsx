"use client";

import { useEffect, useState } from "react";
import { loadQuizAttempts } from "@/lib/quiz-attempts-client";

// 복습 카드의 STEP마다 붙는 퀴즈 진행 상황 한 줄(2026-10-15). 계정의 풀이 기록을 받아
// keys 중 몇 문항을 풀었고 몇 문항을 맞혔는지 센다. 로그인하지 않았으면 아무것도 그리지 않는다.

export function QuizProgressLine({ keys }: { keys: readonly string[] }) {
  const [counts, setCounts] = useState<{ solved: number; correct: number } | null>(null);

  useEffect(() => {
    let alive = true;
    loadQuizAttempts().then((map) => {
      if (!alive || !map) return;
      let solved = 0;
      let correct = 0;
      for (const key of keys) {
        const attempt = map.get(key);
        if (!attempt) continue;
        solved += 1;
        if (attempt.lastCorrect) correct += 1;
      }
      setCounts({ solved, correct });
    });
    return () => {
      alive = false;
    };
  }, [keys]);

  if (!counts) return null;
  return (
    <p className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
      {counts.solved === 0
        ? `퀴즈 ${keys.length}문항, 아직 안 풀었어요`
        : `퀴즈 ${keys.length}문항 중 ${counts.solved}문항 풀었고 ${counts.correct}문항 맞혔어요`}
    </p>
  );
}
