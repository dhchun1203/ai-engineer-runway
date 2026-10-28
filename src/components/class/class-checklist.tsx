'use client';

// 수업 복습 회차의 복습 체크리스트. 완료 토글은 베이스캠프 보강 체크리스트
// (basecamp-prep-checklist.tsx)와 같은 낙관적 규칙과 toggleBasecampItem 액션을 쓴다
// (진도는 bc: 접두사로 저장, class-sessions.ts 주석 참고). 항목은 링크 없이 할 일 한 줄이다.

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { toggleBasecampItem } from '@/app/basecamp/actions';
import { writeOrQueue } from '@/lib/offline/sync';
import { withToggled, withAdded, withRemoved } from '@/components/basecamp/toggle-set';
import type { ClassChecklistItem } from '@/content/class-sessions';

export function ClassChecklist({
  items,
  initialDoneIds,
  unlocked,
  showHeader = true,
  onProgress,
}: {
  items: readonly ClassChecklistItem[];
  /** 완료된 항목 id(접두사 없는 item.id). unlocked일 때만 의미가 있다. */
  initialDoneIds: readonly string[];
  unlocked: boolean;
  /** 위의 "n/m 완료" 줄. 바깥에서 개수를 이미 보여 주면(지난 수업 줄) false */
  showHeader?: boolean;
  /** 완료 수가 바뀔 때마다 알린다(지난 수업 줄의 "체크 n/m"을 함께 바꾸려고) */
  onProgress?: (done: number) => void;
}) {
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(() => new Set(initialDoneIds));
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const [errorIds, setErrorIds] = useState<ReadonlySet<string>>(new Set());

  const doneCount = items.filter((item) => doneIds.has(item.id)).length;

  useEffect(() => {
    onProgress?.(doneCount);
  }, [doneCount, onProgress]);

  async function handleToggle(id: string) {
    if (pendingIds.has(id)) return;
    const wasDone = doneIds.has(id);

    setDoneIds((prev) => withToggled(prev, id, !wasDone));
    setPendingIds((prev) => withAdded(prev, id));
    setErrorIds((prev) => withRemoved(prev, id));

    try {
      await writeOrQueue(
        { kind: 'basecampItem', key: id, value: !wasDone },
        () => toggleBasecampItem(id, wasDone),
      );
    } catch {
      setDoneIds((prev) => withToggled(prev, id, wasDone));
      setErrorIds((prev) => withAdded(prev, id));
    } finally {
      setPendingIds((prev) => withRemoved(prev, id));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {!showHeader ? null : unlocked ? (
        <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {doneCount}/{items.length} 완료
        </span>
      ) : (
        <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          로그인하면 체크한 항목이 저장돼요.
        </span>
      )}
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const done = doneIds.has(item.id);
          const error = errorIds.has(item.id);
          return (
            <li key={item.id} className="panel flex items-center gap-3 p-4">
              {unlocked ? (
                <button
                  type="button"
                  onClick={() => handleToggle(item.id)}
                  disabled={pendingIds.has(item.id)}
                  aria-pressed={done}
                  aria-label={done ? `${item.label} 완료 취소` : `${item.label} 완료로 표시`}
                  className={`tap-feedback hit-44 flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-colors ${
                    done
                      ? 'border-ok bg-ok text-background dark:border-ok-dark dark:bg-ok-dark dark:text-background-dark'
                      : error
                        ? 'border-destructive dark:border-destructive-dark'
                        : 'border-foreground bg-background dark:border-foreground-dark dark:bg-background-dark'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                </button>
              ) : (
                <span className="h-6 w-6 shrink-0 border-2 border-line dark:border-line-dark" aria-hidden="true" />
              )}
              <span className={`break-keep text-body font-semibold ${done ? 'text-muted dark:text-muted-dark' : ''}`}>
                {item.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
