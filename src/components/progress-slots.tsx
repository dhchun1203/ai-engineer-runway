"use client";

// useProgress()를 읽어 최종 표현 컴포넌트에 값을 넘기는 얇은 소비자들.
// 각 슬롯은 상태별로 스켈레톤/실제 배지/에러/무표시 중 하나만 렌더한다.

import { useProgress } from "@/components/progress-provider";
import { ProgressBadge } from "@/components/progress-badge";
import { ProgressReadError } from "@/components/progress-error";
import { BadgeSkeleton } from "@/components/progress-skeleton";
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
