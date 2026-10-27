import Link from "next/link";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { monthGrid, weekdayIndex } from "@/lib/class-logic";

// 수업 달력(2026-10-27, 설계 3.7). 서버 컴포넌트(표시 전용). 왼쪽은 그 달의 숫자 요약,
// 오른쪽은 한 달 달력이다. 수업이 있던 날 칸은 그 회차 레슨 링크이고, 복습 체크를 채운 만큼
// 칸이 차오른다(일부는 바닥 막대, 전부는 칸 전체). 간격 복습을 세 번 마친(졸업한) 회차는
// 칸 구석에 체크가 붙는다. 마우스를 올리면 칸이 떠오르고 회차 이름표가 뜬다(globals.css
// .cal-day, .cal-tip). 달은 화살표로 옮기며 주소의 ?cal=YYYY-MM으로 받는다.

export type CalendarDay = {
  session: number;
  href: string;
  title: string;
  /** 체크리스트 완료 비율 0~1. 진도를 못 읽으면 null */
  checkRatio: number | null;
  graduated: boolean;
};

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const index = y * 12 + (m - 1) + delta;
  return monthKey(Math.floor(index / 12), (index % 12) + 1);
}

function tileClass(ratio: number | null): string {
  if (ratio === 1) {
    return "border-accent bg-accent text-surface dark:border-accent-dark dark:bg-accent-dark dark:text-surface-dark";
  }
  if (ratio !== null && ratio > 0) {
    return "border-accent bg-accent/10 text-accent dark:border-accent-dark dark:bg-accent-dark/15 dark:text-accent-dark";
  }
  return "border-foreground bg-surface text-foreground dark:border-foreground-dark dark:bg-surface-dark dark:text-foreground-dark";
}

/** 이름표를 칸 위 어디에 띄울지 — 양 끝 열은 달력 밖으로 삐져나가지 않게 한쪽에 붙인다. */
function tipAlign(column: number): string {
  if (column <= 1) return "left-0";
  if (column >= 5) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2.5 last:border-b-0 dark:border-line-dark md:flex-col md:items-start md:gap-0.5">
      <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">{label}</span>
      <span className="text-heading font-black tabular-nums">{value}</span>
    </div>
  );
}

export function ClassCalendar({
  days,
  today,
  month,
  minMonth,
  maxMonth,
}: {
  days: ReadonlyMap<string, CalendarDay>;
  today: string;
  /** 보여 줄 달(YYYY-MM) */
  month: string;
  /** 화살표로 갈 수 있는 범위(YYYY-MM) */
  minMonth: string;
  maxMonth: string;
}) {
  const [year, mon] = month.split("-").map(Number);
  const grid = monthGrid(year, mon);
  const inMonth = [...days.entries()].filter(([date]) => date.startsWith(`${month}-`)).map(([, day]) => day);
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const hasPrev = prev >= minMonth;
  const hasNext = next <= maxMonth;

  const arrow = "tap-feedback flex h-11 w-11 items-center justify-center border border-line dark:border-line-dark";
  return (
    <section className="panel grid gap-6 p-5 sm:p-6 md:grid-cols-5 md:gap-8" aria-labelledby="class-calendar-heading">
      <div className="flex flex-col gap-4 md:col-span-2">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="class-calendar-heading" className="text-label font-bold text-accent dark:text-accent-dark">
              수업 달력
            </h2>
            <p className="text-display font-black leading-none tabular-nums">
              {mon}월
              <span className="ml-2 text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {year}
              </span>
            </p>
          </div>
          <nav aria-label="달 옮기기" className="flex gap-1.5">
            {hasPrev ? (
              <Link href={`/class?cal=${prev}`} scroll={false} className={`${arrow} hover:border-foreground dark:hover:border-foreground-dark`} aria-label="지난달">
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <span className={`${arrow} opacity-40`} aria-hidden="true">
                <ChevronLeft className="size-4" />
              </span>
            )}
            {hasNext ? (
              <Link href={`/class?cal=${next}`} scroll={false} className={`${arrow} hover:border-foreground dark:hover:border-foreground-dark`} aria-label="다음 달">
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <span className={`${arrow} opacity-40`} aria-hidden="true">
                <ChevronRight className="size-4" />
              </span>
            )}
          </nav>
        </div>
        <div className="flex flex-col">
          <Stat value={inMonth.length} label="수업" />
          <Stat value={inMonth.filter((d) => d.checkRatio === 1).length} label="체크 완료" />
          <Stat value={inMonth.filter((d) => d.graduated).length} label="간격 복습 마침" />
        </div>
      </div>

      <div className="flex flex-col gap-3 md:col-span-3">
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((w, i) => (
            <span
              key={w}
              aria-hidden="true"
              className={`pb-1 text-center text-label font-semibold ${
                i >= 5 ? "text-muted dark:text-muted-dark" : "text-badge-neutral-text dark:text-badge-neutral-text-dark"
              }`}
            >
              {w}
            </span>
          ))}
          {grid.flat().map((cell) => {
            if (!cell.inMonth) return <span key={cell.date} aria-hidden="true" />;
            const day = days.get(cell.date);
            const dayNumber = Number(cell.date.slice(8));
            const isToday = cell.date === today;
            const todayRing = isToday ? "outline outline-2 outline-offset-2 outline-action dark:outline-action-dark" : "";
            if (!day) {
              return (
                <span
                  key={cell.date}
                  aria-label={isToday ? `오늘, ${mon}월 ${dayNumber}일` : undefined}
                  className={`flex h-11 items-center justify-center text-label tabular-nums ${
                    weekdayIndex(cell.date) >= 5
                      ? "text-muted dark:text-muted-dark"
                      : "text-badge-neutral-text dark:text-badge-neutral-text-dark"
                  } ${isToday ? "font-bold text-foreground dark:text-foreground-dark" : "font-normal"} ${todayRing}`}
                >
                  {dayNumber}
                </span>
              );
            }
            const partial = day.checkRatio !== null && day.checkRatio > 0 && day.checkRatio < 1;
            const status =
              day.checkRatio === null
                ? ""
                : day.checkRatio === 1
                  ? ", 복습 체크 완료"
                  : `, 복습 체크 ${Math.round(day.checkRatio * 100)}%`;
            return (
              <Link
                key={cell.date}
                href={day.href}
                aria-label={`${isToday ? "오늘, " : ""}${mon}월 ${dayNumber}일 ${day.session}회차 ${day.title}${status}${day.graduated ? ", 간격 복습 마침" : ""}`}
                className={`cal-day relative flex h-11 items-center justify-center border text-label font-extrabold tabular-nums ${tileClass(day.checkRatio)} ${todayRing}`}
              >
                {dayNumber}
                {partial ? (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 h-1 bg-accent dark:bg-accent-dark"
                    style={{ width: `${Math.round((day.checkRatio ?? 0) * 100)}%` }}
                  />
                ) : null}
                {day.graduated ? (
                  <Check className="absolute right-0.5 top-0.5 size-3" strokeWidth={3.5} aria-hidden="true" />
                ) : null}
                <span
                  aria-hidden="true"
                  className={`cal-tip pointer-events-none absolute bottom-full z-20 mb-2 flex flex-col whitespace-nowrap border border-foreground bg-surface px-2.5 py-1.5 text-left text-foreground dark:border-foreground-dark dark:bg-surface-dark dark:text-foreground-dark ${tipAlign(weekdayIndex(cell.date))}`}
                >
                  <span className="text-label font-bold text-accent dark:text-accent-dark">{day.session}회차</span>
                  <span className="text-label font-semibold">{day.title}</span>
                </span>
              </Link>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          <span className="flex items-center gap-1.5">
            <span className={`inline-block size-3.5 border ${tileClass(0)}`} aria-hidden="true" />
            체크 전
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`relative inline-block size-3.5 border ${tileClass(0.5)}`} aria-hidden="true">
              <span className="absolute bottom-0 left-0 h-0.5 w-1/2 bg-accent dark:bg-accent-dark" />
            </span>
            일부 체크
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`inline-block size-3.5 border ${tileClass(1)}`} aria-hidden="true" />
            체크 완료
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
            복습 마침
          </span>
        </div>
      </div>
    </section>
  );
}
