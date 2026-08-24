import { ProgressSummary } from "@/components/progress-summary";
import { ProgressReadError } from "@/components/progress-error";
import { DDayCountdown } from "@/components/dday-countdown";
import { TodayLessonCard, type TodayCardState } from "@/components/today-lesson-card";
import { hasUnlockCookie } from "@/lib/auth";
import { readCompletedLessonIds } from "@/lib/progress-store";
import { overallProgress, nextIncompleteLesson } from "@/lib/progress";
import { todayInSeoul, daysUntil } from "@/lib/today";
import { SCHEDULE_START, COURSE_START_DATE } from "@/lib/schedule";
import { getScheduleRows } from "@/lib/schedule-data";
import { getLessonBySlug } from "@/content/curriculum-helpers";

// 홈도 쿠키를 읽으므로 동적 렌더링이 필요하다 — 조건부 쿠키 접근이 캐시된
// 응답을 내보내는 문제(RESEARCH Pitfall 4)를 원천 차단한다. `/unlock` 직후
// 리다이렉트로 도착했을 때 방금 켠 진도가 안 보이는 것을 막는 바로 그 화면이다.
export const dynamic = "force-dynamic";

export default async function Home() {
  // 무조건, 그리고 어떤 조회보다도 먼저 호출한다 — 레슨/Step 페이지와 동일한
  // 게이트 순서를 지켜 조건부 호출이 만드는 캐시 문제를 피한다.
  const unlocked = await hasUnlockCookie();

  const progressRead = unlocked ? await readCompletedLessonIds() : null;
  const completedIds = progressRead?.ok ? progressRead.completedIds : null;

  // 일정·오늘 배정 레슨·D-day는 정적 공개 정보라 쿠키 여부와 무관하게 항상
  // 계산한다(D-37) — 완료 체크·페이스 상태만 completedIds 유무로 갈린다.
  const today = todayInSeoul();
  const rows = getScheduleRows();
  const todayRow = rows.find((row) => row.date === today) ?? null;

  let state: TodayCardState;
  if (todayRow) {
    state = todayRow.isBuffer ? "buffer" : "assigned";
  } else if (today < SCHEDULE_START) {
    state = "before-start";
  } else {
    state = "after-range";
  }
  const todayLesson = todayRow?.lessonSlug ? (getLessonBySlug(todayRow.lessonSlug) ?? null) : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold leading-[1.2]">오늘의 학습</h1>
        <p className="text-[14px] font-normal leading-[1.4] text-badge-neutral-text dark:text-badge-neutral-text-dark">
          AI Engineer 교육과정 사전학습 · 2026-09-30 개강
        </p>
      </header>
      <DDayCountdown daysUntil={daysUntil(COURSE_START_DATE, today)} />
      <TodayLessonCard todayLesson={todayLesson} state={state} />
      {completedIds ? (
        <ProgressSummary
          counts={overallProgress(completedIds)}
          nextLessonSlug={nextIncompleteLesson(completedIds)?.slug ?? null}
        />
      ) : progressRead && !progressRead.ok ? (
        <ProgressReadError />
      ) : null}
    </main>
  );
}
