import { ScheduleTable, type ScheduleTableRow } from "@/components/schedule-table";
import { ScheduleAutoScroll } from "@/components/schedule-auto-scroll";
import { hasUnlockCookie } from "@/lib/auth";
import { readCompletedLessonIds } from "@/lib/progress-store";
import { todayInSeoul } from "@/lib/today";
import { SCHEDULE_START } from "@/lib/schedule";
import { getScheduleRows } from "@/lib/schedule-data";
import { getLessonBySlug } from "@/content/curriculum-helpers";
import type { StepId } from "@/content/modules";

// /schedule도 쿠키를 읽으므로 동적 렌더링이 필요하다 — /와 /curriculum이 이미 겪은
// 조건부 쿠키 접근 → 캐시된 응답 문제(RESEARCH Pitfall 4)를 여기서도 원천 차단한다.
// 이 선언은 상속되지 않으므로 각 라우트가 자기 파일에 직접 둔다.
export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  // 무조건, 그리고 어떤 조회보다도 먼저 호출한다 — 다른 라우트와 동일한 게이트
  // 순서를 지켜 조건부 호출이 만드는 캐시 문제를 피한다.
  const unlocked = await hasUnlockCookie();

  const progressRead = unlocked ? await readCompletedLessonIds() : null;
  const completedIds = progressRead?.ok ? progressRead.completedIds : null;

  // 일정은 정적 공개 정보라 쿠키 여부와 무관하게 항상 전량 계산·렌더한다(D-37) —
  // 쿠키가 결정하는 것은 행별 완료 체크마크 하나뿐이다.
  const today = todayInSeoul();
  const rows = getScheduleRows();

  const tableRows: ScheduleTableRow[] = rows
    .map((row): ScheduleTableRow | null => {
      if (row.lessonSlug === null) {
        return {
          date: row.date,
          isBuffer: true,
          lessonSlug: null,
          title: null,
          depth: null,
          stepId: null,
          estimatedMinutes: null,
        };
      }
      const lesson = getLessonBySlug(row.lessonSlug);
      // 매니페스트/일정 불일치로 조회에 실패한 slug는 조용히 제외한다 — 계산
      // 로직 결함이 아니라 방어적 필터링이다(홈 page.tsx의 behindRows와 동일 원칙).
      if (!lesson) return null;
      return {
        date: row.date,
        isBuffer: false,
        lessonSlug: row.lessonSlug,
        title: lesson.title,
        depth: lesson.depth,
        stepId: lesson.stepId as StepId,
        estimatedMinutes: lesson.estimatedMinutes,
      };
    })
    .filter((row): row is ScheduleTableRow => row !== null);

  const todayInRange = rows.some((row) => row.date === today);
  // 시작일은 SCHEDULE_START, 종료일은 실제 마지막 행 date에서 파생한다 — 날짜
  // 리터럴을 이 파일에 다시 적지 않는다. 하루 1레슨이 기본이고 토요일 3일만
  // 2레슨이라는 사실을 문구에 담는다.
  const scheduleEnd = rows[rows.length - 1]?.date ?? SCHEDULE_START;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-display font-bold">학습 일정표</h1>
        <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {`${SCHEDULE_START} ~ ${scheduleEnd} · 하루 1레슨(토요일 3일만 2레슨)`}
        </p>
      </header>
      <ScheduleTable rows={tableRows} today={today} completedIds={completedIds} />
      {todayInRange ? <ScheduleAutoScroll targetId="schedule-today" /> : null}
    </main>
  );
}
