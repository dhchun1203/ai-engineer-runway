"use client";

// "복습 완료" 버튼 — today-review-card 안의 유일한 클라이언트 조각. 홈이
// force-dynamic 서버 렌더이므로 액션 성공 후 router.refresh() 한 번이면 카드가
// 갱신된다(만기 목록에서 빠지거나 다음 만기일로 바뀜).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeReview } from "@/app/review-actions";

export function ReviewDoneButton({ lessonSlug }: { lessonSlug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        className="btn tap-feedback text-label"
        disabled={pending}
        onClick={() => {
          setFailed(false);
          startTransition(async () => {
            try {
              await completeReview(lessonSlug);
              router.refresh();
            } catch {
              // 저장 실패는 조용히 삼키지 않는다 — 사다리가 전진했다고 오인하면
              // 다음 만기 계산이 어긋난다.
              setFailed(true);
            }
          });
        }}
      >
        {pending ? "저장 중…" : "복습 완료"}
      </button>
      {failed ? (
        <span role="status" className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          저장하지 못했어요. 다시 눌러 주세요.
        </span>
      ) : null}
    </span>
  );
}
