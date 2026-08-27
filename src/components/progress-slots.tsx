"use client";

// useProgress()를 읽어 최종 표현 컴포넌트에 값을 넘기는 얇은 소비자들.
// 각 슬롯은 상태별로 스켈레톤/실제 배지/에러/무표시 중 하나만 렌더한다.

import { useProgress } from "@/components/progress-provider";
import { ProgressBadge } from "@/components/progress-badge";
import { ProgressReadError } from "@/components/progress-error";
import { ProgressSummary } from "@/components/progress-summary";
import {
  BadgeSkeleton,
  CompleteButtonSkeleton,
  NotepadSkeleton,
  SummarySkeleton,
} from "@/components/progress-skeleton";
import { CompleteButton } from "@/components/complete-button";
import { LessonNotepad } from "@/components/lesson-notepad";
import type { StepId } from "@/content/modules";

/** Step 헤더 배지 자리. locked/error 상태에서는 아무것도 렌더하지 않는다 —
 * 에러 문구는 ProgressErrorSlot이 한 번만 낸다. */
export function StepBadgeSlot({ stepId }: { stepId: StepId }) {
  const { status, data } = useProgress();

  if (status === "loading") return <BadgeSkeleton />;
  if (status !== "ready") return null;

  const counts = data.steps?.[stepId];
  if (!counts) return null;

  return <ProgressBadge {...counts} />;
}

/** error 상태에서만 렌더한다. 새 에러 컴포넌트를 만들지 않고 기존 것을 재사용한다. */
export function ProgressErrorSlot() {
  const { status } = useProgress();
  if (status !== "error") return null;
  return <ProgressReadError />;
}

/** 모듈 아코디언 헤더의 진행률 배지 자리. */
export function ModuleProgressSlot({ moduleId }: { moduleId: string }) {
  const { status, data } = useProgress();

  if (status === "loading") return <BadgeSkeleton />;
  if (status !== "ready") return null;

  const counts = data.modules?.[moduleId];
  if (!counts) return null;

  return <ProgressBadge {...counts} />;
}

/** 레슨 완료 버튼 자리(08-03). locked 문구·data-locked-notice 속성은 기존
 * 레슨 페이지가 쓰던 문구를 그대로 옮겨온 것이다 — 새로 쓰지 않는다. */
export function CompleteButtonSlot({ lessonId }: { lessonId: string }) {
  const { status, data, refresh } = useProgress();

  if (status === "loading") return <CompleteButtonSkeleton />;
  if (status === "error") return <ProgressReadError />;
  if (status === "locked") {
    return (
      <p
        data-locked-notice
        className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark"
      >
        완료 체크와 진행률 기록은 잠금 해제 후에 사용할 수 있습니다.
      </p>
    );
  }
  if (status !== "ready") return null;

  if (!data.lesson) return null;

  return <CompleteButton lessonId={lessonId} initialDone={data.lesson.done} onToggled={refresh} />;
}

/** 커리큘럼 페이지 전체 진행률 요약 자리(08-06). loading이면 SummarySkeleton,
 * ready면 기존 <ProgressSummary>에 counts/nextLessonSlug를 넘겨 렌더, error면
 * 기존 <ProgressReadError>, locked면 아무것도 렌더하지 않는다. progress-summary.tsx
 * 자체는 바꾸지 않는다 — 홈(/, 동적 유지)이 지금 그대로 쓰고 있어 prop 계약을
 * 깨면 안 된다. */
export function ProgressSummarySlot() {
  const { status, data } = useProgress();

  if (status === "loading") return <SummarySkeleton />;
  if (status === "error") return <ProgressReadError />;
  if (status !== "ready") return null;

  if (!data.overall) return null;

  return <ProgressSummary counts={data.overall} nextLessonSlug={data.nextLessonSlug} />;
}

/** 레슨 메모장 자리(08-03). D8-H — 메모가 도착하기 전에는 <LessonNotepad>를
 * 마운트하지 않는다(로딩 중에는 스켈레톤만). locked/error 상태에서는 메모장이
 * DOM에 전혀 등장하지 않는다 — 잠금 상태에서 메모 본문이 노출될 경로 자체를
 * 없앤다(T-08-03-02). */
export function LessonNoteSlot({ lessonId }: { lessonId: string }) {
  const { status, data } = useProgress();

  if (status === "loading") return <NotepadSkeleton />;
  if (status !== "ready") return null;

  if (!data.lesson) return null;

  if (data.lesson.note.ok) {
    return <LessonNotepad lessonId={lessonId} initialBody={data.lesson.note.body} />;
  }

  return (
    <p
      data-notepad-read-error
      className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark"
    >
      메모를 불러오지 못했어요. 새로고침해 주세요.
    </p>
  );
}
