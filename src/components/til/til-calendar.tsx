'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { buildWeeks, computeStats, formatDayKo, monthLabels } from '@/lib/til/streak-logic';
import { dayCellClass, dayCellTextClass } from './streak-level';

// TIL 목록 머리의 큰 잔디. 칸마다 날짜가 적혀 있고, 누르면 그날 쓴 글이 아래에 나온다
// (아이패드에는 hover 툴팁이 없으므로 누르는 것을 기본으로 삼는다).
// 칸은 터치 영역 44px을 지키는 크기로 고정하고, 넓은 화면은 14주, 좁은 화면은 최근 7주만 보여 준다.

export type TilCalendarPost = { date: string; title: string; slug: string };

const WEEK_COUNT = 14;
const NARROW_WEEK_COUNT = 7;
const WEEKDAY_LABELS = ['월', '', '수', '', '금', '', ''];

export function TilCalendar({ posts, today }: { posts: readonly TilCalendarPost[]; today: string }) {
  const dates = useMemo(() => posts.map((p) => p.date), [posts]);
  const weeks = useMemo(() => buildWeeks(dates, today, WEEK_COUNT), [dates, today]);
  const labels = useMemo(() => monthLabels(weeks), [weeks]);
  const stats = useMemo(() => computeStats(dates, today), [dates, today]);

  // 처음에는 가장 최근에 쓴 날을 펼쳐 둔다. posts는 최신순이다.
  const [selected, setSelected] = useState(posts[0]?.date ?? today);
  const selectedPosts = posts.filter((p) => p.date === selected);

  if (posts.length === 0) return null;

  const firstNarrow = WEEK_COUNT - NARROW_WEEK_COUNT;

  return (
    <section aria-label="학습기록 잔디" className="flex flex-col gap-5">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="flex shrink-0 flex-col gap-3">
          {/* 고른 칸의 바깥 테두리가 스크롤 영역에 잘리지 않도록 안쪽 여백을 두고, 음수 여백으로 자리를 맞춘다. */}
          <div className="-m-1 overflow-x-auto p-1">
            <div className="flex w-max gap-1">
              <div aria-hidden="true" className="flex w-[1.125rem] flex-col gap-1">
                <span className="h-5" />
                {WEEKDAY_LABELS.map((label, i) => (
                  <span
                    key={i}
                    className="flex h-11 items-center text-[0.75rem] leading-none text-badge-neutral-text dark:text-badge-neutral-text-dark"
                  >
                    {label}
                  </span>
                ))}
              </div>
              {weeks.map((week, w) => {
                // 좁은 화면의 첫 열은 앞 열이 숨어 달 이름이 비기 쉬우니 거기서만 따로 찍는다.
                const narrowLabel =
                  w === firstNarrow && !labels[w] ? `${Number(week[0].date.slice(5, 7))}월` : '';
                return (
                  <div key={week[0].date} className={`flex-col gap-1 ${w < firstNarrow ? 'hidden md:flex' : 'flex'}`}>
                    <span
                      aria-hidden="true"
                      className="h-5 w-11 whitespace-nowrap text-[0.75rem] font-semibold leading-5 text-badge-neutral-text dark:text-badge-neutral-text-dark"
                    >
                      {labels[w] || <span className="md:hidden">{narrowLabel}</span>}
                    </span>
                    {week.map((day) =>
                      day.future ? (
                        <span key={day.date} aria-hidden="true" className="h-11 w-11" />
                      ) : (
                        <button
                          key={day.date}
                          type="button"
                          onClick={() => setSelected(day.date)}
                          aria-pressed={selected === day.date}
                          aria-label={`${formatDayKo(day.date)}, ${day.written ? '기록함' : '기록 없음'}${day.date === today ? ', 오늘' : ''}`}
                          title={`${formatDayKo(day.date)}: ${day.written ? '기록함' : '기록 없음'}`}
                          className={`tap-feedback flex h-11 w-11 items-center justify-center rounded-sm text-[0.75rem] tabular-nums ${dayCellClass(day.written)} ${dayCellTextClass(day.written)} ${
                            day.date === today ? 'ring-2 ring-inset ring-accent dark:ring-accent-dark' : ''
                          } ${
                            selected === day.date
                              ? 'font-bold outline-2 outline-offset-1 outline-foreground dark:outline-foreground-dark'
                              : ''
                          }`}
                        >
                          {Number(day.date.slice(8))}
                        </button>
                      ),
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            aria-hidden="true"
            className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[1.375rem] text-[0.75rem] text-badge-neutral-text dark:text-badge-neutral-text-dark"
          >
            <span className="flex items-center gap-1.5">
              <span className={`h-3.5 w-3.5 rounded-sm ${dayCellClass(true)}`} />
              기록한 날
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded-sm ring-2 ring-inset ring-accent dark:ring-accent-dark" />
              오늘
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4 lg:grid-cols-2">
            <StatItem label="연속 기록" value={stats.current} unit="일" note="주말은 쉬어도 이어져요" />
            <StatItem label="최장 연속" value={stats.longest} unit="일" />
            <StatItem label="이번 달 기록" value={stats.monthDays} unit="일" />
            <StatItem label="전체 기록" value={stats.totalDays} unit="일" />
          </dl>

          <div aria-live="polite" className="hairline flex flex-col gap-1 pt-4">
            <h2 className="text-label font-bold">{formatDayKo(selected)}</h2>
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
        </div>
      </div>
    </section>
  );
}

function StatItem({ label, value, unit, note }: { label: string; value: number; unit: string; note?: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">{label}</dt>
      <dd className="text-heading font-extrabold tabular-nums">
        {value}
        <span className="ml-0.5 text-label font-bold">{unit}</span>
      </dd>
      {note ? (
        <dd className="break-keep text-[0.75rem] text-badge-neutral-text dark:text-badge-neutral-text-dark">{note}</dd>
      ) : null}
    </div>
  );
}
