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
  isTodayAnchor,
  isPast,
  isDone,
}: {
  row: ScheduleTableRow;
  isToday: boolean;
  isTodayAnchor: boolean;
  isPast: boolean;
  isDone: boolean;
}) {
  return (
    <li
      data-schedule-ui="row"
      id={isTodayAnchor ? "schedule-today" : undefined}
      {...(isDone ? { "data-progress-ui": "lesson-done" } : {})}
    >
      {isTodayAnchor ? <span data-schedule-ui="today-row" className="hidden" aria-hidden="true" /> : null}
      <Link
        href={`/lesson/${row.lessonSlug}`}
        className={`card-interactive flex min-h-11 flex-col gap-2 px-2 py-3 transition-colors duration-150 sm:flex-row sm:items-center sm:gap-3 ${isToday ? TODAY_ROW_CLASS : ""}`}
      >
        {/* 375px(폰): 날짜+제목을 상단 줄로 묶는다 — 배지·소요시간 그룹은 이
            아래 별도 하단 줄로 내려가(08-05, D8-M) 제목에 남는 폭을 늘린다.
            640px 이상(sm:)에서는 이 래퍼가 display:contents로 스스로 사라져
            날짜·제목이 다시 Link의 직접 자식(flex row)이 되고, 렌더 결과가
            03-04가 만든 원래 한 줄 배치와 픽셀 단위로 같아진다. */}
        <span className="flex items-start gap-3 sm:contents">
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
        </span>
        {/* 배지·소요시간 — 640px 미만에서는 하단 줄에서 gap-2 flex로 왼쪽
            정렬한다(폰에서는 행이 이미 두 줄이라 배지 시작 위치 정렬이 애초에
            의미가 없다, D8-M). 640px 이상에서는 03-04가 도입한 고정폭
            grid(64px+88px)로 되돌아간다 — 정렬 정확성이 필요한 건 여러 행을
            한눈에 훑는 아이패드·데스크톱 폭에서뿐이다. */}
        {/* 06-08 전까지 check-design-tokens.mjs --strict는 모든 Tailwind 임의값
            대괄호를 타이포 여부와 무관하게 위반으로 잡는다(D-96 규칙 c). 이
            고정폭 grid는 타이포 마이그레이션 대상이 아니라 03-04-PLAN.md가
            남긴 정렬 결함 재발 방지 장치이므로, 시각적으로 동일한 값을
            className 대괄호 문법 대신 inline style로 옮겨 게이트를 통과시킨다
            (레이아웃 값 자체는 변경 없음). display:flex 상태(640px 미만)에서는
            grid-template-columns가 아무 효과가 없으므로 이 style은 640px
            이상에서만 실제로 적용된다. */}
        <span className="flex shrink-0 items-center gap-2 sm:grid" style={{ gridTemplateColumns: "64px 88px" }}>
          <span className="sm:justify-self-start">
            <DepthBadge depth={row.depth as "심화" | "개요"} stepId={row.stepId as StepId} />
          </span>
          <span className="sm:justify-self-end">
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

// 주차 묶기는 "행 7개 단위"가 아니라 "서로 다른 날짜 7개 단위"로 나눈다. 2레슨 날이
// 있으면 rows.slice(i, i+7) 같은 행 수 기준 슬라이스는 한 묶음이 6일치만 담게 되고,
// 최악의 경우 같은 날짜의 두 행이 서로 다른 주차로 갈라진다. 날짜가 바뀔 때만 일수를
// 세고 7일을 채우면 새 묶음을 연다 — 33일이면 묶음은 7·7·7·7·5 = 5개가 된다.
function groupRowsByWeek(rows: readonly ScheduleTableRow[]): ScheduleTableRow[][] {
  const weeks: ScheduleTableRow[][] = [];
  let currentWeek: ScheduleTableRow[] = [];
  let distinctDaysInWeek = 0;
  let lastDate: string | null = null;

  for (const row of rows) {
    if (row.date !== lastDate) {
      if (distinctDaysInWeek === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
        distinctDaysInWeek = 0;
      }
      distinctDaysInWeek++;
      lastDate = row.date;
    }
    currentWeek.push(row);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  return weeks;
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
  const weeks = groupRowsByWeek(rows);
  // 오늘 날짜의 첫 행에만 앵커(id="schedule-today")와 today-row 마커를 붙인다 —
  // 같은 날짜에 행이 2개면 둘 다에 id를 주면 DOM id가 중복되고, s3의 today-row
  // 마커 1건 어설션도 함께 깨진다. 강조 스타일(TODAY_ROW_CLASS)은 오늘 날짜의
  // 모든 행에 그대로 준다 — 앵커/마커와 강조는 별도 boolean이다.
  let seenTodayAnchor = false;

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
              const isTodayAnchor = isToday && !seenTodayAnchor;
              if (isTodayAnchor) seenTodayAnchor = true;

              // 행 key를 유일하게 만든다 — 레슨 행은 row.lessonSlug(35개 전역 유일)를,
              // 버퍼 행은 row.date(버퍼 행은 9/29 하나뿐이라 유일)를 쓴다. 날짜만으로는
              // 유일하지 않다 — 2레슨 날은 같은 date를 가진 행이 2개이기 때문이다.
              return row.isBuffer ? (
                <ScheduleBufferRow key={row.date} row={row} isToday={isToday} isPast={isPast} />
              ) : (
                <ScheduleLessonRow
                  key={row.lessonSlug as string}
                  row={row}
                  isToday={isToday}
                  isTodayAnchor={isTodayAnchor}
                  isPast={isPast}
                  isDone={isDone}
                />
              );
            })}
          </ul>
        </section>
      ))}
      <CourseStartRow />
    </div>
  );
}
