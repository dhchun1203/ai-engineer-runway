"use client";

// 진도 아일랜드의 유일한 fetch 지점. 마운트 후 GET /api/progress를 한 번
// 호출하고 {status, data, refresh}를 Context로 노출한다.
//
// complete-button.tsx의 useOptimistic/useTransition은 사용자 액션 트랜지션용
// 이라 이 시나리오(마운트 시 자동 fetch)에는 맞지 않는다 — useState로
// loading/ready/error/locked 4상태를 관리한다.
//
// refresh()는 지금 이 플랜에서 호출자가 없다 — 08-03의 완료 토글이 이
// 표면을 쓴다. 재사용을 위해 지금 만들어 둔다.
//
// lib/supabase/admin이나 lib/progress-store를 절대 import하지 않는다
// (check-progress-gates.mjs G2).

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { StepId } from "@/content/modules";
import type { ProgressCounts } from "@/lib/progress-math";

export type ProgressLesson = {
  slug: string;
  done: boolean;
  note: { ok: true; body: string } | { ok: false };
};

export type ProgressData = {
  unlocked: boolean;
  ok: boolean;
  overall: ProgressCounts | null;
  steps: Record<StepId, ProgressCounts> | null;
  modules: Record<string, ProgressCounts> | null;
  completedSlugs: string[] | null;
  nextLessonSlug: string | null;
  lesson: ProgressLesson | null;
};

type ProgressState =
  | { status: "loading"; data: null }
  | { status: "ready"; data: ProgressData }
  | { status: "error"; data: null }
  | { status: "locked"; data: ProgressData };

export type ProgressContextValue = ProgressState & { refresh: () => void };

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useProgress()는 <ProgressProvider> 내부에서만 호출할 수 있습니다");
  }
  return ctx;
}

export function ProgressProvider({
  lessonId,
  children,
}: {
  lessonId?: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<ProgressState>({ status: "loading", data: null });
  const [reloadToken, setReloadToken] = useState(0);

  function refresh() {
    setReloadToken((token) => token + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading", data: null });

    const url = `/api/progress${lessonId ? `?lesson=${encodeURIComponent(lessonId)}` : ""}`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json() as Promise<ProgressData>)
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!data.unlocked) {
          setState({ status: "locked", data });
        } else if (!data.ok) {
          setState({ status: "error", data: null });
        } else {
          setState({ status: "ready", data });
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: "error", data: null });
      });

    return () => controller.abort();
  }, [lessonId, reloadToken]);

  return (
    <ProgressContext.Provider value={{ ...state, refresh }}>
      <div data-progress-island data-progress-state={state.status}>
        {children}
      </div>
    </ProgressContext.Provider>
  );
}
