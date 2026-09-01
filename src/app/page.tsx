import { ProgressSummary } from "@/components/progress-summary";
import { ProgressReadError } from "@/components/progress-error";
import { DDayCountdown } from "@/components/dday-countdown";
import { TodayLessonCard, type TodayCardState, type TomorrowInfo } from "@/components/today-lesson-card";
import { PaceStatusPanel } from "@/components/pace-status";
import { BehindLessonsList, type BehindLessonRow } from "@/components/behind-lessons-list";
import { TodayReviewCard, type DueReviewRow } from "@/components/today-review-card";
import { hasUnlockCookie } from "@/lib/auth";
import { readProgressRows } from "@/lib/progress-store";
import { readReviewStates } from "@/lib/review-store";
import { computeDueLessons, nextDueDate } from "@/lib/review";
import { overallProgress, nextIncompleteLesson } from "@/lib/progress";
import { todayInSeoul, daysUntil } from "@/lib/today";
import { computePace, computeAheadDetail, computeProjection } from "@/lib/pace";
import { SCHEDULE_START, COURSE_START_DATE, rowsForDate, firstRowAfter } from "@/lib/schedule";
import { getScheduleRows, getLessonMinutesBySlug } from "@/lib/schedule-data";
import { getLessonBySlug } from "@/content/curriculum-helpers";
import type { StepId } from "@/content/modules";

// 홈도 쿠키를 읽으므로 동적 렌더링이 필요하다 — 조건부 쿠키 접근이 캐시된
// 응답을 내보내는 문제(RESEARCH Pitfall 4)를 원천 차단한다. `/unlock` 직후
// 리다이렉트로 도착했을 때 방금 켠 진도가 안 보이는 것을 막는 바로 그 화면이다.
//
// D8-P(08-06): Phase 8이 레슨·Step·커리큘럼 세 라우트를 정적으로 전환했지만
// 이 라우트는 동적으로 남긴다 — 오늘 날짜가 곧 페이지 본문 전체다(오늘 배정
// 레슨, 상태 머신, 페이스, 밀린 레슨, 내일). 정적으로 만들려면 화면 대부분이
// 클라이언트 렌더가 되어 정적 셸의 이득이 사라진다. ISR(revalidate)도 쓰지
// 않는다 — 설치된 Next 16.3.2 문서(node_modules/next/dist/docs/01-app/
// 02-guides/incremental-static-regeneration.md 100~102행·238행)가 직접
// 말하듯 재검증 창 만료 후 첫 요청은 캐시된(낡은) 페이지를 그대로 받는다.
// 하루 한 번 여는 1인 학습 사이트에서는 그 "낡은 첫 요청"이 사실상 매일 어제의
// "오늘의 학습"을 보는 것과 같다. icn1 리전 이동으로 이미 TTFB 59~68ms라
// 동적 유지의 비용도 낮다(08-01 기준선). check-progress-gates.mjs G9의
// DYNAMIC_GATED_PAGES가 이 선언을 상시 검사한다.
export const dynamic = "force-dynamic";

export default async function Home() {
  // 무조건, 그리고 어떤 조회보다도 먼저 호출한다 — 레슨/Step 페이지와 동일한
  // 게이트 순서를 지켜 조건부 호출이 만드는 캐시 문제를 피한다.
  const unlocked = await hasUnlockCookie();

  // 완료 시각까지 함께 읽는다(readProgressRows) — 복습 만기 계산의 입력.
  // completedIds는 rows에서 파생하므로 조회는 한 번이다.
  const progressRead = unlocked ? await readProgressRows() : null;
  const completedIds = progressRead?.ok
    ? new Set(progressRead.rows.map((row) => row.lessonSlug))
    : null;

  // 복습 상태 — 진도가 정상 조회된 때만 읽는다. 복습 조회가 실패해도 홈의 다른
  // 부분은 살아야 하므로 실패는 "복습 카드 생략"으로 강등한다(진도 조회 실패의
  // ProgressReadError 배너와 달리, 복습은 부가 기능이라 조용한 강등이 맞다).
  const reviewRead = progressRead?.ok ? await readReviewStates() : null;

  // 일정·오늘 배정 레슨·D-day는 정적 공개 정보라 쿠키 여부와 무관하게 항상
  // 계산한다(D-37) — 완료 체크·페이스 상태만 completedIds 유무로 갈린다.
  const today = todayInSeoul();
  const rows = getScheduleRows();
  // 오늘 행 조회는 rowsForDate로 한다(단수 find 제거) — 2레슨 날은 오늘 행이
  // 2개일 수 있다. 빈 배열이면 종전처럼 today < SCHEDULE_START로 시작 전/범위
  // 밖을 가르고, 비어 있지 않으면 첫 행의 isBuffer로 버퍼/배정을 가른다(버퍼
  // 날짜는 2레슨 날과 겹치지 않으므로 첫 행이 대표성을 갖는다).
  const todayRows = rowsForDate(rows, today);

  let state: TodayCardState;
  if (todayRows.length > 0) {
    state = todayRows[0].isBuffer ? "buffer" : "assigned";
  } else if (today < SCHEDULE_START) {
    state = "before-start";
  } else {
    state = "after-range";
  }
  // 오늘 배정 레슨 목록 — 오늘 행들의 slug를 getLessonBySlug로 조회하고 실패한
  // 것은 조용히 제외한다(이 파일의 기존 방어적 필터링 원칙 그대로).
  const todayLessons = todayRows
    .map((row) => (row.lessonSlug ? getLessonBySlug(row.lessonSlug) : null))
    .filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson));

  // 페이스 판정(D-40~D-43)은 completedIds가 non-null일 때만 수행한다 — 진도
  // 파생 계산이므로 게이트 대상이다(D-37). computePace().missedSlugs가 밀린
  // 레슨 목록의 유일한 출처다(별도 재계산 금지).
  const minutesBySlug = getLessonMinutesBySlug();
  const pace = completedIds ? computePace(rows, minutesBySlug, completedIds, today) : null;
  // 앞선 정도의 "얼마나"는 판정과 분리된 별도 계산이다(lib/pace.ts 주석 참고).
  const ahead = completedIds
    ? computeAheadDetail(rows, minutesBySlug, completedIds, today)
    : undefined;
  // 완료 예측일(round2-완료예측일) — pace와 같은 completedIds 게이트 조건을 쓴다.
  const projection = completedIds
    ? computeProjection(rows, completedIds, today, SCHEDULE_START)
    : undefined;

  // 오늘 배정 레슨을 전부 완료했을 때만 true — completedIds가 null이면 조회
  // 실패/쿠키 없음을 미완료로 오인시키지 않도록 null을 유지한다.
  const completedToday = completedIds
    ? todayLessons.length > 0
      ? todayLessons.every((lesson) => completedIds.has(lesson.slug))
      : null
    : null;

  // 오늘 배정을 완료했거나(D-38) 전체 페이스가 ahead면 축하 상태로 전환한다.
  // 자동 이동은 걸지 않는다 — 카드 내부 CTA를 사용자가 직접 눌러야 이동한다.
  if (state === "assigned" && (completedToday === true || pace?.status === "ahead")) {
    state = "celebration";
  }

  // 내일 행은 firstRowAfter(rows, today)로 구한다 — rows.indexOf + 1 산술을
  // 쓰지 않는다. 같은 날짜에 행이 2개면 +1이 같은 날의 두 번째 레슨을 가리켜
  // "내일"이 오늘이 되어 버리기 때문이다.
  let tomorrow: TomorrowInfo = { kind: "none" };
  const tomorrowRow = firstRowAfter(rows, today);
  if (tomorrowRow) {
    if (tomorrowRow.isBuffer) {
      tomorrow = { kind: "buffer" };
    } else if (tomorrowRow.lessonSlug) {
      const tomorrowLesson = getLessonBySlug(tomorrowRow.lessonSlug);
      tomorrow = tomorrowLesson
        ? { kind: "lesson", slug: tomorrowLesson.slug, title: tomorrowLesson.title }
        : { kind: "none" };
    }
  }

  // 밀린 레슨 행 데이터는 missedSlugs를 getLessonBySlug/rows와 조합해서만 만든다
  // (별도 재계산 금지). 매니페스트/일정 불일치로 조회에 실패한 slug는 조용히
  // 제외한다 — 계산 로직 결함이 아니라 방어적 필터링이다.
  const behindRows: BehindLessonRow[] =
    pace && pace.status === "behind" && pace.missedSlugs.length > 0
      ? pace.missedSlugs
          .map((slug) => {
            const lesson = getLessonBySlug(slug);
            const row = rows.find((r) => r.lessonSlug === slug);
            if (!lesson || !row) return null;
            return {
              date: row.date,
              slug: lesson.slug,
              title: lesson.title,
              depth: lesson.depth,
              stepId: lesson.stepId as StepId,
              estimatedMinutes: lesson.estimatedMinutes,
            };
          })
          .filter((row): row is BehindLessonRow => row !== null)
      : [];

  // 오늘 만기인 복습(간격 사다리 — src/lib/review.ts). 완료 시각(timestamptz)을
  // 서울 날짜로 바꿔 계산한다. 조회 실패 시 빈 카드로 강등.
  let dueRows: DueReviewRow[] = [];
  let nextDue: string | null = null;
  if (progressRead?.ok && reviewRead?.ok) {
    const seoulDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });
    const completedDateBySlug = new Map(
      progressRead.rows.map((row) => [row.lessonSlug, seoulDate.format(new Date(row.completedAt))]),
    );
    const due = computeDueLessons(completedDateBySlug, reviewRead.states, today);
    dueRows = due
      .map(({ lessonSlug, rung }) => {
        const lesson = getLessonBySlug(lessonSlug);
        return lesson ? { lesson, rung } : null;
      })
      .filter((row): row is DueReviewRow => row !== null);
    if (dueRows.length === 0) {
      nextDue = nextDueDate(completedDateBySlug, reviewRead.states);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-display font-black">오늘의 학습</h1>
        <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          AI Engineer 교육과정 사전학습 · 2026-09-30 개강
        </p>
      </header>
      <DDayCountdown daysUntil={daysUntil(COURSE_START_DATE, today)} />
      <TodayLessonCard
        todayLessons={todayLessons}
        state={state}
        completed={completedToday}
        completedIds={completedIds}
        tomorrow={tomorrow}
      />
      {/* 오늘의 복습 — 새 레슨 카드 아래, 페이스 판정 위. 복습은 권유까지만
          하고 진행을 잠그지 않는다(round2-h·round6 설계 원칙). */}
      {progressRead?.ok ? <TodayReviewCard dueRows={dueRows} nextDue={nextDue} /> : null}
      {completedIds ? (
        <>
          {pace ? <PaceStatusPanel pace={pace} ahead={ahead} projection={projection} /> : null}
          {behindRows.length > 0 ? <BehindLessonsList rows={behindRows} /> : null}
        </>
      ) : progressRead && !progressRead.ok ? (
        <ProgressReadError />
      ) : null}
      {completedIds ? (
        <ProgressSummary
          counts={overallProgress(completedIds)}
          nextLessonSlug={nextIncompleteLesson(completedIds)?.slug ?? null}
        />
      ) : null}
    </main>
  );
}
