import Link from "next/link";
import { ClassQuizStatus } from "@/components/class/class-quiz-status";

// 수업 복습 허브의 "지난 수업" 한 줄. 제목은 레슨 링크이고, 오른쪽에 수업 날짜와 퀴즈 상태가 있다.

export function ClassPastLessonRow({
  href,
  session,
  title,
  dateLabel,
  quiz,
}: {
  href: string;
  session: number;
  title: string;
  /** "10월 26일" */
  dateLabel: string;
  /** 풀이 기록을 못 읽었으면 null */
  quiz: { done: number; total: number } | null;
}) {
  return (
    <li className="border-b border-line last:border-b-0 dark:border-line-dark">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
        <Link href={href} className="tap-feedback flex min-h-11 min-w-0 flex-1 items-center gap-3">
          <span className="chip text-label font-bold">{session}회차</span>
          <span className="min-w-0 text-body font-bold break-keep">{title}</span>
        </Link>
        <span className="flex items-center gap-3">
          <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            {dateLabel}
          </span>
          {quiz ? <ClassQuizStatus done={quiz.done} total={quiz.total} /> : null}
        </span>
      </div>
    </li>
  );
}
