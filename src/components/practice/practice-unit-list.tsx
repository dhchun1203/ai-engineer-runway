'use client';

// 파이썬 손풀기 목록의 단원 카드와 완료 토글. 토글은 낙관적으로 뒤집고 togglePracticeUnit을
// 부른다. 실패하면 그 단원만 되돌리고 "실패"를 보인다. 오프라인 대기열은 쓰지 않는다(목록은
// 개인 화면이라 오프라인 캐시 대상이 아니다, 베이스캠프 허브와 같은 판단).

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { togglePracticeUnit } from '@/app/practice/actions';
import { withToggled, withAdded, withRemoved } from '@/components/basecamp/toggle-set';

export type PracticeUnitCard = {
  slug: string;
  unit: number;
  title: string;
  feature: string;
  minutes: number;
  permalink: string;
};

export function PracticeUnitList({
  units,
  initialDone,
  unlocked,
}: {
  units: readonly PracticeUnitCard[];
  /** 완료된 단원 slug(접두사 없음). unlocked일 때만 의미가 있다. */
  initialDone: readonly string[];
  unlocked: boolean;
}) {
  const [done, setDone] = useState<ReadonlySet<string>>(() => new Set(initialDone));
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const doneCount = units.filter((u) => done.has(u.slug)).length;

  async function toggle(slug: string) {
    if (pending.has(slug)) return;
    const wasDone = done.has(slug);
    setDone((prev) => withToggled(prev, slug, !wasDone));
    setPending((prev) => withAdded(prev, slug));
    setFailed((prev) => withRemoved(prev, slug));
    try {
      await togglePracticeUnit(slug, wasDone);
    } catch {
      setDone((prev) => withToggled(prev, slug, wasDone));
      setFailed((prev) => withAdded(prev, slug));
    } finally {
      setPending((prev) => withRemoved(prev, slug));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {unlocked && units.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-label font-bold">
            {doneCount}/{units.length} 단원 완료
          </span>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${units.length}, minmax(0, 1fr))` }}
            aria-hidden="true"
          >
            {units.map((u) => (
              <span
                key={u.slug}
                className={`h-2 ${done.has(u.slug) ? 'bg-foreground dark:bg-foreground-dark' : 'bg-line dark:bg-line-dark'}`}
              />
            ))}
          </div>
        </div>
      ) : null}
      <ol className="flex flex-col gap-3">
        {units.map((u) => {
          const isDone = done.has(u.slug);
          return (
            <li key={u.slug} className="flex items-stretch gap-2">
              <Link
                href={u.permalink}
                className="card-interactive panel flex min-h-11 min-w-0 flex-1 flex-col gap-1 p-4"
              >
                <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  {u.unit}단원, 약 {Math.round((u.minutes / 60) * 10) / 10}시간
                </span>
                <span className="text-heading font-extrabold break-keep">{u.title}</span>
                <span className="text-body font-normal break-keep">{u.feature}</span>
              </Link>
              {unlocked ? (
                <button
                  type="button"
                  onClick={() => toggle(u.slug)}
                  aria-pressed={isDone}
                  aria-label={`${u.unit}단원 ${isDone ? '완료 취소' : '완료 체크'}`}
                  className={`tap-feedback panel flex w-16 shrink-0 flex-col items-center justify-center gap-1 text-label font-bold ${
                    isDone
                      ? 'bg-foreground text-background dark:bg-foreground-dark dark:text-background-dark'
                      : ''
                  }`}
                >
                  <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {failed.has(u.slug) ? '실패' : isDone ? '완료' : '체크'}
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
