"use client";

// /bookmarks 관리 페이지의 해제 버튼 — review-done-button.tsx와 같은 최소 패턴이다.
// 페이지가 force-dynamic 서버 렌더이므로 액션 성공 후 router.refresh() 한 번이면
// 그 항목이 목록에서 사라진다.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { removeBookmarkAction } from "@/app/lesson/[lessonId]/bookmark-actions";

export function BookmarkRemoveButton({
  lessonId,
  sectionIndex,
}: {
  lessonId: string;
  sectionIndex: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        className="btn tap-feedback text-label"
        disabled={pending}
        aria-label="북마크 해제"
        onClick={() => {
          setFailed(false);
          startTransition(async () => {
            try {
              await removeBookmarkAction(lessonId, sectionIndex);
              router.refresh();
            } catch {
              setFailed(true);
            }
          });
        }}
      >
        <X className="size-4" aria-hidden="true" />
        {pending ? "해제 중…" : "해제"}
      </button>
      {failed ? (
        <span role="status" className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          해제하지 못했어요. 다시 눌러 주세요.
        </span>
      ) : null}
    </span>
  );
}
