'use client';

// "이 레슨은 더 공부해야 함" 표시 토글. 완료 버튼과 같은 수렴 방식이다 —
// 표시값은 `pending ?? initialNeedsReview`이고, 서버 값(initialNeedsReview)이
// 진실이며 저장이 도는 동안만 방금 고른 값이 그 위를 덮는다(complete-button.tsx 참고).
//
// 저장 성공 뒤 onToggled(=진도 재조회)를 기다렸다가 임시 상태를 푼다 — 이 재조회가
// 같은 페이지의 "클로드에 물어보기" 버튼이 읽는 needsReview까지 갱신해, 표시하자마자
// 그 버튼이 강조되고 질문 틀에 블록이 반영된다(둘 다 useProgress 한 소스를 본다).
//
// 완료 여부와는 완전히 독립이다 — 완료하지 않은 레슨도 표시할 수 있다.

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { setLessonNeedsReviewAction } from '@/app/lesson/[lessonId]/needs-review-actions';

const SAVE_ERROR_MESSAGE = '저장하지 못했어요. 다시 시도해주세요.';

export function LessonNeedsReview({
  lessonId,
  initialNeedsReview,
  onToggled,
}: {
  lessonId: string;
  initialNeedsReview: boolean;
  // 저장이 성공한 뒤에만 호출된다(complete-button.tsx와 동일). <ProgressProvider>의
  // refresh()가 연결되며, 재조회가 끝나면 resolve되는 Promise를 돌려준다.
  onToggled?: () => void | Promise<void>;
}) {
  // null = 저장 중이 아님(서버 값을 그대로 보여준다).
  const [pending, setPending] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPending = pending !== null;
  const shown = pending ?? initialNeedsReview;

  async function handleToggle() {
    if (isPending) return;
    const next = !shown;
    setPending(next);
    setError(null);
    try {
      await setLessonNeedsReviewAction(lessonId, next);
      // 재조회까지 기다린 뒤에 임시 상태를 푼다 — 먼저 풀면 옛 값이 한 프레임 드러난다.
      await onToggled?.();
    } catch {
      setError(SAVE_ERROR_MESSAGE);
    } finally {
      setPending(null);
    }
  }

  return (
    <div
      data-needs-review
      data-needs-review-state={shown ? 'on' : 'off'}
      className="flex flex-col gap-2"
    >
      <button
        type="button"
        data-print-hide
        onClick={handleToggle}
        disabled={isPending}
        aria-busy={isPending}
        aria-pressed={shown}
        aria-label={shown ? '더 공부할 레슨 표시 해제하기' : '더 공부할 레슨으로 표시하기'}
        className={`tap-feedback text-label ${
          shown ? 'btn-action' : 'btn'
        }`}
      >
        <Flag className={`h-4 w-4 shrink-0 ${shown ? 'fill-current' : ''}`} aria-hidden="true" />
        {shown ? '더 공부할 레슨으로 표시됨 ✓' : '더 공부할 레슨으로 표시'}
      </button>
      {shown ? (
        <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          이 레슨은 “클로드에 물어보기”가 강조되고, 복사되는 질문 틀에 “더 공부해야 하는 부분”이라는 안내가 함께 담겨요.
        </p>
      ) : null}
      {error ? (
        <div className="flex items-center gap-2 text-label font-normal">
          <span role="status" aria-live="polite">{error}</span>
          <button type="button" onClick={handleToggle} className="btn tap-feedback text-label">
            다시 시도
          </button>
        </div>
      ) : null}
    </div>
  );
}
