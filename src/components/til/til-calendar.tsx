'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  buildMonth,
  computeStats,
  formatDayKo,
  shiftMonth,
  type MonthCell,
  type MonthGrid,
} from '@/lib/til/streak-logic';

// TIL 목록 머리의 잉크 띠 달력. 매일 쓰는지가 한눈에 보이도록 안 쓴 날은 숫자만 두고,
// 연속으로 쓴 날을 하나의 띠로 잇는다. 쉬어도 끊기지 않는 주말은 속이 빈 띠로 그린다.
// 누르면 그날 쓴 글이 아래에 나온다(아이패드에는 hover 툴팁이 없으므로 누르는 것을 기본으로 삼는다).
// 넓은 화면은 세 달, 태블릿 세로는 두 달, 좁은 화면은 한 달을 보여 주고 화살표로 달을 옮긴다.

export type TilCalendarPost = { date: string; title: string; slug: string };

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
// 맨 오른쪽 달부터의 표시 범위. 화면이 넓어질수록 왼쪽 달이 더 드러난다.
const MONTH_VISIBILITY = ['hidden lg:flex', 'hidden md:flex', 'flex'];

// 지금 화면에 보이는 달 수(MONTH_VISIBILITY와 같은 기준). 첫 기록 달이 보이면 더 뒤로 가지 않게 쓴다.
const LG_QUERY = '(min-width: 64rem)';
const MD_QUERY = '(min-width: 48rem)';

function subscribeVisibleMonths(onChange: () => void) {
  const queries = [window.matchMedia(LG_QUERY), window.matchMedia(MD_QUERY)];
  queries.forEach((q) => q.addEventListener('change', onChange));
  return () => queries.forEach((q) => q.removeEventListener('change', onChange));
}

function getVisibleMonths(): number {
  if (window.matchMedia(LG_QUERY).matches) return 3;
  return window.matchMedia(MD_QUERY).matches ? 2 : 1;
}

function dayBandClass(cell: MonthCell, isToday: boolean): string {
  if (cell.written) {
    return isToday
      ? 'bg-accent font-bold text-white dark:bg-accent-dark dark:text-background-dark'
      : 'bg-foreground font-bold text-surface dark:bg-foreground-dark dark:text-background-dark';
  }
  if (cell.bridged) return 'border-y-2 border-foreground dark:border-foreground-dark';
  if (isToday) return 'font-bold text-accent dark:text-accent-dark';
  return 'text-badge-neutral-text dark:text-badge-neutral-text-dark';
}

function DayButton({
  cell,
  today,
  selected,
  onSelect,
}: {
  cell: MonthCell;
  today: string;
  selected: boolean;
  onSelect: (date: string) => void;
}) {
  const isToday = cell.date === today;
  return (
    <button
      type="button"
      onClick={() => onSelect(cell.date)}
      disabled={cell.future}
      aria-pressed={selected}
      aria-label={`${formatDayKo(cell.date)}, ${cell.written ? '기록함' : '기록 없음'}${isToday ? ', 오늘' : ''}`}
      className="tap-feedback relative flex h-11 min-w-0 items-center disabled:opacity-50"
    >
      <span
        className={`flex h-8 min-w-0 flex-1 items-center justify-center text-label tabular-nums ${
          cell.linkLeft ? '' : 'ml-[3px]'
        } ${cell.linkRight ? '-mr-px' : 'mr-[3px]'} ${dayBandClass(cell, isToday)}`}
      >
        {cell.day}
      </span>
      {selected ? (
        <span aria-hidden="true" className="absolute inset-x-1.5 bottom-0 h-[3px] bg-foreground dark:bg-foreground-dark" />
      ) : null}
    </button>
  );
}

function Month({
  grid,
  visibility,
  today,
  selected,
  onSelect,
}: {
  grid: MonthGrid;
  visibility: string;
  today: string;
  selected: string;
  onSelect: (date: string) => void;
}) {
  return (
    <div className={`min-w-0 flex-1 flex-col gap-1.5 ${visibility}`}>
      <h2 className="text-subhead font-black">{grid.label}</h2>
      <div
        aria-hidden="true"
        className="grid grid-cols-7 text-center text-[0.75rem] text-badge-neutral-text dark:text-badge-neutral-text-dark"
      >
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.cells.map((cell, i) =>
          cell ? (
            <DayButton key={cell.date} cell={cell} today={today} selected={selected === cell.date} onSelect={onSelect} />
          ) : (
            <span key={`blank-${i}`} aria-hidden="true" />
          ),
        )}
      </div>
    </div>
  );
}

export function TilCalendar({ posts, today }: { posts: readonly TilCalendarPost[]; today: string }) {
  const dates = useMemo(() => posts.map((p) => p.date), [posts]);
  const stats = useMemo(() => computeStats(dates, today), [dates, today]);

  const thisMonth = today.slice(0, 7);
  const firstMonth = dates.reduce((min, d) => (d.slice(0, 7) < min ? d.slice(0, 7) : min), thisMonth);
  const [endMonth, setEndMonth] = useState(thisMonth);
  const visibleMonths = useSyncExternalStore(subscribeVisibleMonths, getVisibleMonths, () => 1);
  // 처음에는 가장 최근에 쓴 날을 펼쳐 둔다. posts는 최신순이다.
  const [selected, setSelected] = useState(posts[0]?.date ?? today);
  const selectedPosts = posts.filter((p) => p.date === selected);

  const months = useMemo(
    () => [-2, -1, 0].map((delta) => buildMonth(dates, today, shiftMonth(endMonth, delta))),
    [dates, today, endMonth],
  );

  if (posts.length === 0) return null;

  const canGoBack = shiftMonth(endMonth, 1 - visibleMonths) > firstMonth;
  const canGoForward = endMonth < thisMonth;
  const arrow = 'tap-feedback flex h-11 w-11 items-center justify-center disabled:opacity-30';

  return (
    <section aria-label="학습기록 달력" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div className="flex items-end gap-3.5">
          <span className="text-[6.5rem] font-black leading-[0.82] tracking-[-0.06em] tabular-nums">{stats.current}</span>
          <span className="flex flex-col gap-0.5">
            <span className="text-heading font-black break-keep">
              {stats.current > 0 ? '일째 이어 쓰는 중' : '일, 오늘 다시 시작해요'}
            </span>
            <span className="text-label font-normal break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
              주말은 쉬어도 이어져요
            </span>
          </span>
        </div>
        <dl className="flex gap-7">
          <StatItem label="최장 연속" value={stats.longest} />
          <StatItem label="이번 달" value={stats.monthDays} />
          <StatItem label="전체" value={stats.totalDays} />
        </dl>
      </div>

      <div className="flex flex-col gap-3 border-t-2 border-foreground pt-2 dark:border-foreground-dark">
        {canGoBack || canGoForward ? (
          <nav aria-label="달 옮기기" className="-mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setEndMonth(shiftMonth(endMonth, -1))}
              disabled={!canGoBack}
              aria-label="이전 달"
              className={arrow}
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setEndMonth(shiftMonth(endMonth, 1))}
              disabled={!canGoForward}
              aria-label="다음 달"
              className={arrow}
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </nav>
        ) : null}
        <div className="flex items-start gap-[18px]">
          {months.map((grid, i) => (
            <Month
              key={grid.month}
              grid={grid}
              visibility={MONTH_VISIBILITY[i]}
              today={today}
              selected={selected}
              onSelect={setSelected}
            />
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[0.75rem] text-badge-neutral-text dark:text-badge-neutral-text-dark"
      >
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-[22px] bg-foreground dark:bg-foreground-dark" />
          기록한 날
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-[22px] border-y-2 border-foreground dark:border-foreground-dark" />
          쉬어도 이어지는 주말
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-[22px] bg-accent dark:bg-accent-dark" />
          오늘
        </span>
      </div>

      <div aria-live="polite" className="hairline flex flex-col gap-1 pt-4">
        <h3 className="text-label font-bold">{formatDayKo(selected)}</h3>
        {selectedPosts.length > 0 ? (
          <ul className="flex flex-col">
            {selectedPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/til/${post.slug}`}
                  className="nav-link tap-feedback flex min-h-11 items-center break-keep text-body font-normal"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : selected === today ? (
          <Link
            href="/til/new"
            className="nav-link tap-feedback flex min-h-11 items-center text-body font-bold text-accent dark:text-accent-dark"
          >
            오늘 기록 쓰기
          </Link>
        ) : (
          <p className="flex min-h-11 items-center text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            이 날은 기록이 없어요.
          </p>
        )}
      </div>
    </section>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">{label}</dt>
      <dd className="text-subhead font-bold tabular-nums">{value}일</dd>
    </div>
  );
}
