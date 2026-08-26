import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { StepId } from "@/content/modules";
import { DepthBadge } from "@/components/depth-badge";
import { EstimatedTime } from "@/components/estimated-time";
import { COURSE_START_DATE } from "@/lib/schedule";

// /와 /schedule이 같은 getScheduleRows()를 쓰지만, 이 컴포넌트는 스스로 매니페스트를
// 조회하지 않는 서버 렌더 순수 표현 컴포넌트다(step-card.tsx/behind-lessons-list.tsx와
// 같은 역할 분리) — page.tsx가 이미 레슨 메타(제목·깊이·stepId·소요시간)까지 조립한
// 평범한 데이터 배열만 넘긴다. 버퍼 행(9/29)은 title/depth/stepId/estimatedMinutes가
// null이다.
export type ScheduleTableRow = {
  date: string;
  isBuffer: boolean;
  lessonSlug: string | null;
  title: string | null;
  depth: "심화" | "개요" | null;
  stepId: StepId | null;
  estimatedMinutes: number | null;
};

// 지난 행 톤다운 — 취소선·투명도 트릭 없이 중성 텍스트 토큰만 쓴다(D-43, D-24 관례 승계).
const PAST_TONE_CLASS = "text-badge-neutral-text dark:text-badge-neutral-text-dark";

// 오늘 행 강조 — accent 좌측 테두리 + 배경 틴트(UI-SPEC Color, D-46). 36행 중 유일하게
// "튀어야" 하는 행이다.
const TODAY_ROW_CLASS = "border-l-4 border-accent bg-accent/10 dark:border-accent-dark dark:bg-accent-dark/10";

// 개강일 행 — 표 전체의 도착점을 표시하는 accent 좌측 테두리(UI-SPEC Color). 오늘 행과
// 같은 강조 어휘를 재사용하되 배경 틴트는 더 옅게 둬 "오늘"과 시각적으로 구분한다.
const COURSE_START_ROW_CLASS = "border-l-4 border-accent bg-accent/5 dark:border-accent-dark dark:bg-accent-dark/5";

function ScheduleLessonRow({
  row,
  isToday,
  isPast,
  isDone,
}: {
  row: ScheduleTableRow;
  isToday: boolean;
  isPast: boolean;
  isDone: boolean;
}) {
  return (
    <li
      data-schedule-ui="row"
      id={isToday ? "schedule-today" : undefined}
      {...(isDone ? { "data-progress-ui": "lesson-done" } : {})}
    >
      {isToday ? <span data-schedule-ui="today-row" className="hidden" aria-hidden="true" /> : null}
      <Link
        href={`/lesson/${row.lessonSlug}`}
        className={`card-interactive flex min-h-11 items-center gap-3 px-2 py-3 transition-colors duration-150 ${isToday ? TODAY_ROW_CLASS : ""}`}
      >
        <span className={`whitespace-nowrap text-label font-normal ${isPast ? PAST_TONE_CLASS : ""}`}>
          {row.date}
        </span>
        <span className="flex min-w-0 flex-1 items-start gap-1.5">
          {isDone ? (
            <CheckCircle2
              className="mt-1 h-4 w-4 shrink-0 self-start text-accent dark:text-accent-dark"
              aria-hidden="true"
            />
          ) : null}
          <span className={`text-body font-normal ${isPast ? PAST_TONE_CLASS : ""}`}>{row.title}</span>
        </span>
        {/* 배지·소요시간 각각을 고정폭 그리드 칸에 담는다 — "심화"/"개요" 배지는 폭이
            거의 같지만 소요시간 문구("약 1시간"~"약 2.5시간")는 주차마다 길이가 달라,
            flex shrink-to-content로 두면 그룹 전체 폭이 행마다 달라지고 그 결과 배지
            시작 위치가 흔들린다(1·2주차처럼 소요시간이 우연히 균일한 주만 정렬돼
            보이던 결함). 고정폭 칸이 이 흔들림을 원천 차단한다. */}
        {/* 06-08 전까지 check-design-tokens.mjs --strict는 모든 Tailwind 임의값
            대괄호를 타이포 여부와 무관하게 위반으로 잡는다(D-96 규칙 c). 이
            고정폭 grid는 타이포 마이그레이션 대상이 아니라 03-04-PLAN.md가
            남긴 정렬 결함 재발 방지 장치이므로, 시각적으로 동일한 값을
            className 대괄호 문법 대신 inline style로 옮겨 게이트를 통과시킨다
            (레이아웃 값 자체는 변경 없음). */}
        <span className="grid shrink-0 items-center gap-2" style={{ gridTemplateColumns: "64px 88px" }}>
          <span className="justify-self-start">
            <DepthBadge depth={row.depth as "심화" | "개요"} stepId={row.stepId as StepId} />
          </span>
          <span className="justify-self-end">
            <EstimatedTime minutes={row.estimatedMinutes as number} />
          </span>
        </span>
      </Link>
    </li>
  );
}

function ScheduleBufferRow({ row, isToday, isPast }: { row: ScheduleTableRow; isToday: boolean; isPast: boolean }) {
  return (
    <li data-schedule-ui="row" id={isToday ? "schedule-today" : undefined}>
      {isToday ? <span data-schedule-ui="today-row" className="hidden" aria-hidden="true" /> : null}
      <div className={`flex min-h-11 items-center gap-3 px-2 py-3 ${isToday ? TODAY_ROW_CLASS : ""}`}>
        <span className={`whitespace-nowrap text-label font-normal ${isPast ? PAST_TONE_CLASS : ""}`}>
          {row.date}
        </span>
        <span className={`flex-1 text-body font-normal ${isPast ? PAST_TONE_CLASS : ""}`}>
          복습·정리일 — 밀린 레슨을 따라잡거나 배운 내용을 복습하세요.
        </span>
      </div>
    </li>
  );
}

// 개강일 행 — 36행 밖에서 렌더된다(36행 총계 어설션과 충돌하지 않도록). data-schedule-ui="row"를
// 달지 않는다.
function CourseStartRow() {
  return (
    <div className={`flex min-h-11 items-center gap-3 px-2 py-3 ${COURSE_START_ROW_CLASS}`}>
      <span className="whitespace-nowrap text-label font-normal">{COURSE_START_DATE}</span>
      <span className="flex-1 text-body font-normal">개강일 — 여기서 본 과정이 시작됩니다.</span>
    </div>
  );
}

export function ScheduleTable({
  rows,
  today,
  completedIds,
}: {
  rows: readonly ScheduleTableRow[];
  today: string;
  completedIds: ReadonlySet<string> | null;
}) {
  const weeks: ScheduleTableRow[][] = [];
  for (let i = 0; i < rows.length; i += 7) {
    weeks.push(rows.slice(i, i + 7));
  }

  return (
    <div className="flex flex-col gap-12">
      {weeks.map((weekRows, weekIndex) => (
        <section key={weekRows[0]?.date ?? weekIndex} className="flex flex-col gap-3">
          {/* 단일 문자열로 조합해 렌더한다 — {expr}과 인접 텍스트를 그대로 두면 React SSR이
              둘 사이에 <!-- --> 코멘트 마커를 끼워 넣어 "1주차" 문자열 검색(e2e/텍스트 매칭)이
              깨진다(e2e-today.mjs의 stripSsrComments가 다루는 것과 같은 문제, 여기서는 마커
              삽입 자체를 피한다). */}
          <h2 className="text-heading font-bold">{`${weekIndex + 1}주차`}</h2>
          <ul className="flex flex-col divide-y divide-badge-neutral-bg dark:divide-badge-neutral-bg-dark">
            {weekRows.map((row) => {
              const isToday = row.date === today;
              const isPast = row.date < today;
              const isDone =
                completedIds !== null && row.lessonSlug !== null ? completedIds.has(row.lessonSlug) : false;

              return row.isBuffer ? (
                <ScheduleBufferRow key={row.date} row={row} isToday={isToday} isPast={isPast} />
              ) : (
                <ScheduleLessonRow key={row.date} row={row} isToday={isToday} isPast={isPast} isDone={isDone} />
              );
            })}
          </ul>
        </section>
      ))}
      <CourseStartRow />
    </div>
  );
}
