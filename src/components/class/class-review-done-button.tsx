"use client";

// 수업 회차 간격 복습의 "복습 완료" 버튼(2026-10-27). ReviewDoneButton과 같은 형태로,
// 서버 렌더 화면이라 저장 뒤 router.refresh() 한 번이면 만기 목록이 갱신된다.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeClassReview } from "@/app/review-actions";

export function ClassReviewDoneButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  return (
    <span className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="btn tap-feedback min-h-11 text-label"
        disabled={pending}
        onClick={() => {
          setFailed(false);
          startTransition(async () => {
            try {
              await completeClassReview(slug);
              router.refresh();
            } catch {
              // 사다리가 전진했다고 오인하면 다음 만기가 어긋나니 실패를 알린다.
              setFailed(true);
            }
          });
        }}
      >
        {pending ? "저장 중..." : "이 회차 복습 완료"}
      </button>
      {failed ? (
        <span role="status" className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          저장하지 못했어요. 다시 눌러 주세요.
        </span>
      ) : null}
    </span>
  );
}
