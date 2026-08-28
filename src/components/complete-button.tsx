'use client';

// 완료 토글 버튼.
//
// 표시값은 `pendingDone ?? initialDone`이다 — 서버 값(initialDone)이 진실이고,
// 저장이 진행 중인 동안만 사용자가 방금 고른 값(pendingDone)이 그 위를 덮는다.
//
// 예전에는 useOptimistic을 썼는데, 이 화면의 "서버 값"은 트랜지션이 아니라 별도
// fetch(GET /api/progress)로 도착한다. useOptimistic의 낙관적 값은 트랜지션이
// 끝나는 순간 prop으로 되돌아가므로, 그 시점에 재조회가 아직 도착하지 않았으면
// 방금 누른 완료가 잠깐 취소된 것처럼 보인다. 아이패드에서 "완료했어요 ✓ → 회색
// → 레슨 완료하기"로 보이던 깜빡임의 절반이 여기였고, 나머지 절반은 재조회가
// 아일랜드를 스켈레톤으로 비우면서 이 버튼을 통째로 언마운트한 것이었다
// (progress-provider.tsx에서 함께 고쳤다, quick 260828-w2r).
//
// pendingDone은 저장과 재조회가 **둘 다** 끝난 뒤에 푼다. 그래서 버튼이 그동안
// 계속 같은 자리에 같은 모습으로 남아 있고, 그 사이의 추가 탭은 전부 무시된다 —
// 사라졌다 돌아온 버튼을 다시 눌러 완료가 취소되는 경로가 없어진다.

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { toggleLessonComplete } from '@/app/lesson/[lessonId]/actions';

const SAVE_ERROR_MESSAGE = '저장하지 못했습니다. 다시 시도해주세요.';

export function CompleteButton({
  lessonId,
  initialDone,
  onToggled,
}: {
  lessonId: string;
  initialDone: boolean;
  // 저장이 성공한 뒤에만 호출된다. <ProgressProvider>의 refresh()가 연결되며,
  // 재조회가 끝나면 resolve되는 Promise를 돌려준다 — 이 버튼은 그 Promise를
  // 기다렸다가 자기 임시 상태를 푼다.
  onToggled?: () => void | Promise<void>;
}) {
  // null = 저장 중이 아님(서버 값을 그대로 보여준다).
  const [pendingDone, setPendingDone] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPending = pendingDone !== null;
  const shownDone = pendingDone ?? initialDone;

  async function handleToggle() {
    // 저장·재조회가 도는 동안의 추가 탭은 삼킨다.
    if (isPending) return;

    const next = !shownDone;
    setPendingDone(next);
    setError(null);
    try {
      await toggleLessonComplete(lessonId, initialDone);
      // 재조회까지 기다린 뒤에 임시 상태를 푼다 — 여기서 먼저 풀면 아직 옛
      // 값인 initialDone이 한 프레임 드러난다(그게 바로 되돌아가 보이던 증상).
      await onToggled?.();
    } catch {
      setError(SAVE_ERROR_MESSAGE);
    } finally {
      setPendingDone(null);
    }
  }

  return (
    <div
      data-progress-ui="complete-button"
      data-complete-state={shownDone ? 'done' : 'todo'}
      className="flex flex-col gap-2"
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-busy={isPending}
        aria-pressed={shownDone}
        aria-label={shownDone ? '완료 취소하기' : '레슨 완료하기'}
        className={`tap-feedback text-body ${
          shownDone ? 'btn complete-ring-glow text-ok dark:text-ok-dark' : 'btn-action'
        }`}
      >
        {shownDone ? (
          <>
            <CheckCircle2 className="complete-check-icon h-4 w-4 shrink-0" aria-hidden="true" />
            완료했어요 ✓
          </>
        ) : (
          '레슨 완료하기'
        )}
      </button>
      {error ? (
        <div className="flex items-center gap-2 text-label font-normal">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleToggle}
            className="btn tap-feedback text-label"
          >
            다시 시도
          </button>
        </div>
      ) : null}
    </div>
  );
}
