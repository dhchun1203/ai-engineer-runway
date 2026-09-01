"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// "이어서 읽기"(quick 260901-v4u)의 표시 절반 — last-lesson-recorder.tsx가
// localStorage "lastLesson"에 남긴 마지막 레슨을, 오늘 배정(todaySlugs)과
// 다를 때만 복귀 링크로 보여준다. 오늘 배정과 같으면(이미 TodayLessonCard가
// 같은 레슨을 보여주고 있으므로) 중복이라 아무것도 렌더하지 않는다.
//
// theme-toggle.tsx와 같은 이유로 useSyncExternalStore를 쓴다: useEffect
// 안에서 setState를 직접 호출하면 react-hooks/set-state-in-effect 린트
// 오류가 나고(연쇄 렌더 유발), localStorage는 서버에 없는 값이라 useState의
// lazy initializer로 곧장 읽으면 서버/클라이언트 첫 렌더가 달라져 하이드레이션
// 불일치가 난다. useSyncExternalStore는 서버 스냅샷(null)으로 먼저 그리고
// 하이드레이션 후 실제 클라이언트 값으로 정정하는 것이 표준 해법이다.
const LAST_LESSON_KEY = "lastLesson";

function subscribeToLastLesson(onStoreChange: () => void) {
  // 다른 탭에서 값이 바뀌었을 때도 반영한다. 같은 탭 안에서는 레슨 페이지 →
  // 홈으로 이동할 때마다 이 컴포넌트가 새로 마운트되며 useSyncExternalStore가
  // 최신 값을 다시 읽으므로 별도 커스텀 이벤트가 필요 없다.
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getLastLessonRaw(): string | null {
  try {
    return localStorage.getItem(LAST_LESSON_KEY);
  } catch {
    // 프라이빗 모드 등 — 조용히 null(카드 생략)로 취급.
    return null;
  }
}

function getLastLessonServerRaw(): string | null {
  return null;
}

function parseLastLesson(raw: string | null): { slug: string; title: string } | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { slug?: unknown }).slug === "string" &&
      typeof (parsed as { title?: unknown }).title === "string"
    ) {
      return parsed as { slug: string; title: string };
    }
  } catch {
    // 손상된 값 — 무시하고 카드 생략.
  }
  return null;
}

export function ContinueReadingCard({ todaySlugs }: { todaySlugs: readonly string[] }) {
  const raw = useSyncExternalStore(subscribeToLastLesson, getLastLessonRaw, getLastLessonServerRaw);
  const lastLesson = parseLastLesson(raw);

  // 중복 제거의 유일한 입력은 부모가 넘긴 todaySlugs다(별도 재계산 금지).
  // 오늘 배정과 같은 레슨이면 TodayLessonCard가 이미 보여주고 있다.
  if (!lastLesson || todaySlugs.includes(lastLesson.slug)) return null;

  return (
    <Link
      href={`/lesson/${encodeURIComponent(lastLesson.slug)}`}
      className="card-interactive panel tap-feedback flex min-h-11 items-center justify-between gap-3 px-4 py-3"
    >
      <span className="text-body font-normal">이어서 읽기: {lastLesson.title}</span>
      <ArrowRight className="size-4 shrink-0 text-accent dark:text-accent-dark" aria-hidden="true" />
    </Link>
  );
}
