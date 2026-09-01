"use client";

// /review 세션의 O(맞음)·△(맞았지만 불안)·X(틀림) 3단 판정 버튼(quick
// 260901-w04). review-done-button.tsx와 같은 규약(use client + useTransition +
// 실패를 조용히 삼키지 않는 재시도 안내)이지만, 이 컴포넌트는 문항 하나당
// missed_q 배열을 갱신하는 recordReviewJudgment를 호출한다는 점이 다르다.
//
// 판정 정확도는 중요하지 않다 — 회상을 시도했다는 사실 자체가 효과의 대부분을
// 만든다(review.ts 원칙 승계). △ 기준은 "한 군데라도 머뭇거렸으면 △"로 낮게
// 잡아 후하게 매기도록 유도한다.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ReviewJudgment } from "@/lib/review";
import { recordReviewJudgment } from "@/app/review-actions";

const JUDGMENTS: { value: ReviewJudgment; symbol: string; label: string }[] = [
  { value: "correct", symbol: "O", label: "맞음" },
  { value: "shaky", symbol: "△", label: "맞았지만 불안" },
  { value: "wrong", symbol: "X", label: "틀림" },
];

export function ReviewJudgmentButtons({
  lessonSlug,
  questionIndex,
}: {
  lessonSlug: string;
  questionIndex: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [recorded, setRecorded] = useState<ReviewJudgment | null>(null);
  const [failed, setFailed] = useState(false);

  function handleClick(judgment: ReviewJudgment) {
    setFailed(false);
    startTransition(async () => {
      try {
        await recordReviewJudgment(lessonSlug, questionIndex, judgment);
        setRecorded(judgment);
        router.refresh();
      } catch {
        // 저장 실패는 조용히 삼키지 않는다 — missed_q가 갱신됐다고 오인하면
        // 오답 모아보기가 실제 상태와 어긋난다.
        setFailed(true);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="판정">
        {JUDGMENTS.map(({ value, symbol, label }) => (
          <button
            key={value}
            type="button"
            disabled={pending}
            onClick={() => handleClick(value)}
            aria-pressed={recorded === value}
            aria-label={label}
            className={`btn tap-feedback flex min-h-11 min-w-11 items-center justify-center px-3 text-body font-bold ${
              recorded === value ? "chip-solid" : ""
            }`}
          >
            {symbol}
          </button>
        ))}
        {recorded ? (
          <span
            role="status"
            className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark"
          >
            기록됨
          </span>
        ) : null}
      </div>
      {failed ? (
        <span
          role="status"
          className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark"
        >
          저장하지 못했어요. 다시 눌러 주세요.
        </span>
      ) : null}
      <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
        한 군데라도 머뭇거렸으면 △
      </p>
    </div>
  );
}
