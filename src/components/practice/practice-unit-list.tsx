'use client';

// 파이썬 손풀기 목록의 단원 카드와 완료 토글. 토글은 낙관적으로 뒤집고 togglePracticeUnit을
// 부른다. 실패하면 그 단원만 되돌리고 "실패"를 보인다. 오프라인 대기열은 쓰지 않는다(목록은
// 개인 화면이라 오프라인 캐시 대상이 아니다, 베이스캠프 허브와 같은 판단).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { togglePracticeUnit } from '@/app/practice/actions';
import { practiceUnitAnchor } from '@/lib/practice-anchor';
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
  const [arrived, setArrived] = useState<string | null>(null);
  const doneCount = units.filter((u) => done.has(u.slug)).length;

  // 단원 페이지에서 /practice#unit-<slug>로 오면 그 카드를 화면 가운데로 올리고 잠깐 테를 두른다.
  // 라우터의 해시 스크롤은 카드를 위 끝(고정 헤더 밑)에 붙이므로, 그다음 프레임에 가운데로 다시 맞춘다.
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const target = units.find((u) => practiceUnitAnchor(u.slug) === hash);
    if (!target) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ block: 'center' });
        setArrived(target.slug);
      });
    });
    const clear = window.setTimeout(() => setArrived(null), 2200);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(clear);
    };
  }, [units]);

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
            <li
              key={u.slug}
              id={practiceUnitAnchor(u.slug)}
              className={`flex scroll-mt-24 items-stretch gap-2 outline-2 outline-offset-4 transition-[outline-color] duration-500 ${
                arrived === u.slug ? 'outline-accent dark:outline-accent-dark' : 'outline-transparent'
              } outline`}
            >
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
