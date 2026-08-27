import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { StepId } from "@/content/modules";
import type { getLessonBySlug } from "@/content/curriculum-helpers";
import { DepthBadge } from "@/components/depth-badge";
import { EstimatedTime } from "@/components/estimated-time";
import { SCHEDULE_START } from "@/lib/schedule";

// 홈의 오늘 배정 레슨 카드 — progress-summary.tsx와 같은 형태의 서버 렌더 가능한
// 순수 표현 컴포넌트. 데이터 조회를 스스로 하지 않고 홈 페이지가 계산한
// todayLessons/state/completed/tomorrow만 받는다.

// Velite 콘텐츠 매니페스트 모듈을 직접 import하지 않는다 — 타입은 getLessonBySlug의
// 반환 타입에서 파생한다(progress.ts와 같은 경계).
type Lesson = NonNullable<ReturnType<typeof getLessonBySlug>>;

export type TodayCardState = "before-start" | "assigned" | "buffer" | "after-range" | "celebration";

export type TomorrowInfo =
  | { kind: "lesson"; slug: string; title: string }
  | { kind: "buffer" }
  | { kind: "none" };

// progress-summary.tsx의 min-h-11 버튼 클래스를 그대로 재사용하되, UI-SPEC
// Typography가 이 CTA에 배정한 Label 14px/600 크기로 맞춘다. 640px 미만에서는
// 카드 폭 전체로 넓혀 텍스트 컨테이너가 지나치게 좁아지지 않게 한다(08-05 M3
// 게이트) — 640px 이상은 원래의 w-fit(내용에 맞춘 폭)을 그대로 유지한다.
const CTA_CLASS =
  "tap-feedback flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-4 py-2 text-label font-semibold text-white dark:bg-accent-dark dark:text-background-dark sm:w-fit";

// 개별 레슨 한 줄 — 2레슨 날에 두 레슨을 나열할 때 재사용한다. 완료 여부는
// completedIds가 non-null일 때만 표시하고(쿠키 없음/조회 실패를 미완료로
// 오인시키지 않는다), null이면 마커를 생략한다.
function TodayLessonRow({ lesson, isDone }: { lesson: Lesson; isDone: boolean }) {
  return (
    <Link href={`/lesson/${lesson.slug}`} className="card-interactive flex flex-col gap-2 rounded-lg p-2 -m-2">
      <span className="flex items-start gap-1.5">
        {isDone ? (
          <CheckCircle2
            className="mt-1 h-4 w-4 shrink-0 self-start text-accent dark:text-accent-dark"
            aria-hidden="true"
          />
        ) : null}
        <p
          className={`text-body font-normal ${
            isDone ? "text-badge-neutral-text dark:text-badge-neutral-text-dark" : ""
          }`}
        >
          {lesson.title}
        </p>
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <DepthBadge depth={lesson.depth} stepId={lesson.stepId as StepId} />
        <EstimatedTime minutes={lesson.estimatedMinutes} />
      </div>
    </Link>
  );
}

export function TodayLessonCard({
  todayLessons,
  state,
  completed,
  completedIds,
  tomorrow,
}: {
  todayLessons: readonly Lesson[];
  state: TodayCardState;
  completed?: boolean | null;
  // 2레슨 날의 "첫 번째 미완료 레슨" CTA와 개별 완료 체크마크를 계산하는 데만
  // 쓴다 — completed(집계 불리언)의 의미는 그대로 유지한다. null이면 완료
  // 여부를 알 수 없다는 뜻이라 마커를 생략하고 첫 레슨을 가리킨다.
  completedIds?: ReadonlySet<string> | null;
  tomorrow?: TomorrowInfo;
}) {
  // 레슨이 1개일 때의 렌더 결과는 지금과 픽셀 단위로 같게 둔다 — 제목 텍스트 +
  // 배지 + 하단 CTA 1개. Phase 6에서 다듬은 화면을 흔들지 않는다.
  const todayLesson = todayLessons.length === 1 ? todayLessons[0] : null;
  let heading: string | null = null;
  let body: string | null = null;
  let cta: { href: string; label: string } | null = null;

  if (state === "before-start") {
    heading = "곧 시작해요";
    body = `사전학습은 ${SCHEDULE_START}부터 시작됩니다.`;
    cta = { href: "/schedule", label: "일정표 보기" };
  } else if (state === "after-range") {
    heading = "개강했어요!";
    body = "사전학습 기간이 끝났습니다. 커리큘럼은 계속 이용할 수 있어요.";
    cta = { href: "/curriculum", label: "커리큘럼 보기" };
  } else if (state === "buffer") {
    heading = "복습·정리일";
    body = "밀린 레슨을 따라잡거나 배운 내용을 복습하세요.";
  } else if (state === "celebration") {
    // 오늘 배정을 완료했거나 앞서 있을 때(D-38) — 자동 이동·리다이렉트는 걸지
    // 않는다, 이동은 사용자가 아래 CTA를 직접 누를 때만 일어난다.
    heading = "오늘 학습을 모두 마쳤어요!";
    if (tomorrow?.kind === "lesson") {
      body = `내일은 "${tomorrow.title}"을 배워요.`;
      cta = { href: `/lesson/${tomorrow.slug}`, label: "내일 레슨 미리 보기" };
    } else if (tomorrow?.kind === "buffer") {
      body = "내일은 복습·정리일이에요.";
    } else {
      body = "사전학습 일정을 모두 마쳤어요.";
      cta = { href: "/curriculum", label: "커리큘럼 보기" };
    }
  } else if (todayLesson) {
    // assigned(1레슨) — completed === true면 "다시 보기", false·null이면 "레슨 시작하기".
    // null(조회 실패/쿠키 없음)을 미완료로 오인시키지 않는다 — 마커만 생략한다.
    cta = {
      href: `/lesson/${todayLesson.slug}`,
      label: completed === true ? "다시 보기" : "레슨 시작하기",
    };
  } else if (todayLessons.length > 1) {
    // assigned(2레슨) — 하단 CTA는 첫 번째 미완료 레슨을 가리킨다. completedIds가
    // null(완료 여부를 알 수 없음)이면 첫 레슨을 가리킨다. 이 분기에 도달했다는
    // 것은(state가 여전히 "assigned"라는 것은) 둘 다 완료는 아니라는 뜻이다 —
    // 둘 다 완료면 page.tsx가 이미 state를 "celebration"으로 전환했다.
    const firstIncomplete = completedIds
      ? todayLessons.find((lesson) => !completedIds.has(lesson.slug))
      : undefined;
    const ctaTarget = firstIncomplete ?? todayLessons[0];
    cta = {
      href: `/lesson/${ctaTarget.slug}`,
      label: completedIds?.has(ctaTarget.slug) === true ? "다시 보기" : "레슨 시작하기",
    };
  }

  return (
    <section
      data-schedule-ui="today-card"
      className={`flex flex-col gap-3 rounded-lg bg-surface p-4 transition-colors duration-150 dark:bg-surface-dark ${
        cta ? "card-interactive" : ""
      }`}
    >
      {state === "assigned" && todayLesson ? (
        <div className="flex flex-col gap-2">
          <span className="flex items-start gap-1.5">
            {completed === true ? (
              <CheckCircle2
                className="mt-1 h-4 w-4 shrink-0 self-start text-accent dark:text-accent-dark"
                aria-hidden="true"
              />
            ) : null}
            <p
              className={`text-body font-normal ${
                completed === true ? "text-badge-neutral-text dark:text-badge-neutral-text-dark" : ""
              }`}
            >
              {todayLesson.title}
            </p>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <DepthBadge depth={todayLesson.depth} stepId={todayLesson.stepId as StepId} />
            <EstimatedTime minutes={todayLesson.estimatedMinutes} />
          </div>
        </div>
      ) : state === "assigned" && todayLessons.length > 1 ? (
        // 2레슨 날 — 각 레슨을 한 줄로 나열하고 각 줄을 해당 레슨 링크로 만든다.
        // 카드 최상위 data-schedule-ui="today-card" 마커는 여전히 카드당 1건이다
        // (t1/t7 어설션 — 이 목록 안에는 별도 마커를 추가하지 않는다).
        <div className="flex flex-col gap-3">
          {todayLessons.map((lesson) => (
            <TodayLessonRow key={lesson.slug} lesson={lesson} isDone={completedIds?.has(lesson.slug) === true} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {heading ? <h2 className="text-heading font-bold">{heading}</h2> : null}
          {body ? <p className="text-body font-normal">{body}</p> : null}
        </div>
      )}
      {cta ? (
        <Link href={cta.href} className={CTA_CLASS}>
          {cta.label}
        </Link>
      ) : null}
    </section>
  );
}
