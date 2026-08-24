'use client';

// 낙관적 완료 토글 클라이언트 아일랜드. initialDone은 서버가 매 렌더마다 새로
// 내려주는 prop이다 — 완료 여부를 담는 별도의 로컬 useState를 두지 않는다.
// Server Action이 revalidatePath를 부르면 서버가 새 initialDone을 내려주고
// useOptimistic이 그 값으로 수렴하는 것이 React 19의 정상 흐름이다. RESEARCH의
// 예시 코드는 useState(initialDone)을 함께 두는데, 그러면 다른 기기에서 바뀐
// 상태가 이 화면에 반영되지 않는 정합성 구멍이 생긴다 — 이 컴포넌트는 prop
// 수렴 방식을 채택한다.

import { useOptimistic, useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { toggleLessonComplete } from '@/app/lesson/[lessonId]/actions';

const SAVE_ERROR_MESSAGE = '저장하지 못했습니다. 다시 시도해주세요.';

export function CompleteButton({
  lessonId,
  initialDone,
}: {
  lessonId: string;
  initialDone: boolean;
}) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(initialDone);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    startTransition(async () => {
      setOptimisticDone(!optimisticDone);
      setError(null);
      try {
        await toggleLessonComplete(lessonId, initialDone);
      } catch {
        // 낙관적 값은 트랜지션 종료와 함께 initialDone(서버가 갱신하지 못한
        // 이전 값)으로 자동 수렴하므로 별도 롤백 코드가 필요 없다 (D-28).
        setError(SAVE_ERROR_MESSAGE);
      }
    });
  }

  return (
    <div
      data-progress-ui="complete-button"
      data-complete-state={optimisticDone ? 'done' : 'todo'}
      className="flex flex-col gap-2"
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={optimisticDone}
        aria-label={optimisticDone ? '완료 취소하기' : '레슨 완료하기'}
        className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-[16px] font-semibold leading-[1.6] ${
          optimisticDone
            ? 'border-accent text-accent dark:border-accent-dark dark:text-accent-dark'
            : 'border-badge-neutral-bg dark:border-badge-neutral-bg-dark'
        }`}
      >
        {optimisticDone ? (
          <>
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            완료했어요 ✓
          </>
        ) : (
          '레슨 완료하기'
        )}
      </button>
      {error ? (
        <div className="flex items-center gap-2 text-[14px] font-normal leading-[1.4]">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleToggle}
            className="flex min-h-11 items-center justify-center rounded-lg border border-badge-neutral-bg px-3 dark:border-badge-neutral-bg-dark"
          >
            다시 시도
          </button>
        </div>
      ) : null}
    </div>
  );
}
