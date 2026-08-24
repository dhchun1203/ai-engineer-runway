import Link from "next/link";
import type { StepId } from "@/content/modules";
import type { getLessonBySlug } from "@/content/curriculum-helpers";
import { DepthBadge } from "@/components/depth-badge";
import { EstimatedTime } from "@/components/estimated-time";

// 홈의 오늘 배정 레슨 카드 — progress-summary.tsx와 같은 형태의 서버 렌더 가능한
// 순수 표현 컴포넌트. 데이터 조회를 스스로 하지 않고 홈 페이지가 계산한
// todayLesson/state만 받는다. 완료 여부·축하 상태 props는 이 Task에서 추가하지
// 않는다 — Plan 03의 몫이다(D-38/D-39는 여기서 다루지 않음).

// Velite 콘텐츠 매니페스트 모듈을 직접 import하지 않는다 — 타입은 getLessonBySlug의
// 반환 타입에서 파생한다(progress.ts와 같은 경계).
type Lesson = NonNullable<ReturnType<typeof getLessonBySlug>>;

export type TodayCardState = "before-start" | "assigned" | "buffer" | "after-range";

// progress-summary.tsx의 min-h-11 버튼 클래스를 그대로 재사용하되, UI-SPEC
// Typography가 이 CTA에 배정한 Label 14px/600 크기로 맞춘다.
const CTA_CLASS =
  "flex min-h-11 w-fit items-center justify-center rounded-lg bg-accent px-4 py-2 text-[14px] font-semibold leading-[1.4] text-white dark:bg-accent-dark dark:text-background-dark";

export function TodayLessonCard({
  todayLesson,
  state,
}: {
  todayLesson: Lesson | null;
  state: TodayCardState;
}) {
  let heading: string | null = null;
  let body: string | null = null;
  let cta: { href: string; label: string } | null = null;

  if (state === "before-start") {
    heading = "곧 시작해요";
    body = "사전학습은 2026-08-25부터 시작됩니다.";
    cta = { href: "/schedule", label: "일정표 보기" };
  } else if (state === "after-range") {
    heading = "개강했어요!";
    body = "사전학습 기간이 끝났습니다. 커리큘럼은 계속 이용할 수 있어요.";
    cta = { href: "/curriculum", label: "커리큘럼 보기" };
  } else if (state === "buffer") {
    heading = "복습·정리일";
    body = "밀린 레슨을 따라잡거나 배운 내용을 복습하세요.";
  } else if (todayLesson) {
    cta = { href: `/lesson/${todayLesson.slug}`, label: "레슨 시작하기" };
  }

  return (
    <section
      data-schedule-ui="today-card"
      className="flex flex-col gap-3 rounded-lg bg-surface p-6 dark:bg-surface-dark"
    >
      {state === "assigned" && todayLesson ? (
        <div className="flex flex-col gap-2">
          <p className="text-[16px] font-normal leading-[1.6]">{todayLesson.title}</p>
          <div className="flex flex-wrap items-center gap-2">
            <DepthBadge depth={todayLesson.depth} stepId={todayLesson.stepId as StepId} />
            <EstimatedTime minutes={todayLesson.estimatedMinutes} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {heading ? <h2 className="text-[20px] font-semibold leading-[1.3]">{heading}</h2> : null}
          {body ? <p className="text-[16px] font-normal leading-[1.6]">{body}</p> : null}
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
