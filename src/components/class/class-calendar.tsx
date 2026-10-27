import Link from "next/link";
import { Check } from "lucide-react";
import { monthGrid } from "@/lib/class-logic";

// 수업 달력(2026-10-27, 설계 3.7). 서버 컴포넌트(표시 전용). 수업이 있던 날 칸은 그 회차
// 레슨 링크이고, 복습 체크를 채운 만큼 진해진다. 간격 복습을 세 번 마친(졸업한) 회차는
// 칸 구석에 체크 표시가 붙는다. 이번 달과, 수업이 있었다면 지난달까지 보여 준다.

export type CalendarDay = {
  session: number;
  href: string;
  title: string;
  /** 체크리스트 완료 비율 0~1. 진도를 못 읽으면 null */
  checkRatio: number | null;
  graduated: boolean;
};

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

function toneClass(ratio: number | null): string {
  if (ratio === null || ratio === 0) {
    return "border-2 border-foreground bg-surface dark:border-foreground-dark dark:bg-surface-dark";
  }
  if (ratio < 1) {
    return "border-2 border-accent bg-accent/20 dark:border-accent-dark dark:bg-accent-dark/25";
  }
  return "border-2 border-accent bg-accent text-surface dark:border-accent-dark dark:bg-accent-dark dark:text-surface-dark";
}

function Month({
  year,
  month,
  days,
  today,
}: {
  year: number;
  month: number;
  days: ReadonlyMap<string, CalendarDay>;
  today: string;
}) {
  const grid = monthGrid(year, month);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-label font-bold">
        {year}년 {month}월
      </span>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <span
            key={w}
            aria-hidden="true"
            className="text-center text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark"
          >
            {w}
          </span>
        ))}
        {grid.flat().map((cell) => {
          const day = cell.inMonth ? days.get(cell.date) : undefined;
          const dayNumber = Number(cell.date.slice(8));
          const isToday = cell.date === today;
          if (!cell.inMonth) return <span key={cell.date} aria-hidden="true" />;
          if (!day) {
            return (
              <span
                key={cell.date}
                className={`flex h-12 items-start justify-start p-1 text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark ${
                  isToday ? "outline outline-2 -outline-offset-2 outline-foreground dark:outline-foreground-dark" : ""
                }`}
              >
                {dayNumber}
              </span>
            );
          }
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
              title={`${day.session}회차 ${day.title}`}
              aria-label={`${month}월 ${dayNumber}일 ${day.session}회차 ${day.title}${status}${day.graduated ? ", 간격 복습 마침" : ""}`}
              className={`tap-feedback relative flex h-12 flex-col items-start justify-between p-1 ${toneClass(day.checkRatio)}`}
            >
              <span className="text-label font-normal leading-none">{dayNumber}</span>
              <span className="self-end text-label font-black leading-none">{day.session}회</span>
              {day.graduated ? (
                <Check className="absolute right-1 top-1 size-3.5" strokeWidth={3} aria-hidden="true" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ClassCalendar({ days, today }: { days: ReadonlyMap<string, CalendarDay>; today: string }) {
  const [year, month] = today.split("-").map(Number);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevPrefix = `${prevYear}-${String(prevMonth).padStart(2, "0")}-`;
  const showPrev = [...days.keys()].some((date) => date.startsWith(prevPrefix));

  return (
    <section className="panel flex flex-col gap-4 p-4 sm:p-5" aria-labelledby="class-calendar-heading">
      <h2 id="class-calendar-heading" className="text-subhead font-extrabold break-keep">
        수업 달력
      </h2>
      <div className={`grid gap-6 ${showPrev ? "md:grid-cols-2" : ""}`}>
        {showPrev ? <Month year={prevYear} month={prevMonth} days={days} today={today} /> : null}
        <Month year={year} month={month} days={days} today={today} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
        <span className="flex items-center gap-1.5">
          <span className={`inline-block size-4 ${toneClass(0)}`} aria-hidden="true" />
          체크 전
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`inline-block size-4 ${toneClass(0.5)}`} aria-hidden="true" />
          일부 체크
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`inline-block size-4 ${toneClass(1)}`} aria-hidden="true" />
          체크 완료
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
          간격 복습 세 번 마침
        </span>
      </div>
    </section>
  );
}
