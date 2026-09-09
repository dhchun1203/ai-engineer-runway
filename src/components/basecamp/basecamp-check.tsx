'use client';

// 베이스캠프 항목 완료 체크박스. complete-button.tsx의 낙관적 토글 원리를 따르되,
// 이 페이지는 ProgressProvider 아일랜드가 아니라 서버 렌더 값이 진실이므로 더
// 단순하게 둔다: 로컬 상태를 서버 값으로 초기화하고, 누르면 즉시 뒤집어 보이며
// 저장을 부른다. 저장이 실패하면 되돌리고 메시지를 보여 준다.

import { useState } from 'react';
import { Check } from 'lucide-react';
import { toggleBasecampItem } from '@/app/basecamp/actions';

export function BasecampCheck({
  itemId,
  initialDone,
  label,
}: {
  itemId: string;
  initialDone: boolean;
  label: string;
}) {
  const [done, setDone] = useState(initialDone);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function handleToggle() {
    if (pending) return;
    const next = !done;
    setDone(next);
    setPending(true);
    setError(false);
    try {
      await toggleBasecampItem(itemId, done);
    } catch {
      setDone(!next); // 되돌린다
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      aria-pressed={done}
      aria-label={done ? `${label} 완료 취소` : `${label} 완료로 표시`}
      className={`tap-feedback flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-colors ${
        done
          ? 'border-ok bg-ok text-background dark:border-ok-dark dark:bg-ok-dark dark:text-background-dark'
          : error
            ? 'border-destructive dark:border-destructive-dark'
            : 'border-foreground bg-background dark:border-foreground-dark dark:bg-background-dark'
      }`}
    >
      {done ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
    </button>
  );
}
