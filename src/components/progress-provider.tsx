"use client";

// 진도 아일랜드의 유일한 fetch 지점. 마운트 후 GET /api/progress를 한 번
// 호출하고 {status, data, refresh}를 Context로 노출한다.
//
// complete-button.tsx의 useOptimistic/useTransition은 사용자 액션 트랜지션용
// 이라 이 시나리오(마운트 시 자동 fetch)에는 맞지 않는다 — useState로
// loading/ready/error/locked 4상태를 관리한다.
//
// refresh()는 화면을 비우지 않는다 — 이미 보여주고 있던 데이터를 그대로 둔 채
// 뒤에서 다시 읽고, 응답이 도착하면 조용히 바꿔 끼운다. 예전에는 refresh()가
// 상태를 loading으로 되돌려 아일랜드 전체가 회색 스켈레톤으로 교체됐는데,
// 완료 토글 직후에 이게 일어나면 방금 누른 버튼이 통째로 언마운트됐다가 다시
// 마운트된다 — 아이패드에서 "완료했어요 ✓ → 회색 → 레슨 완료하기"로 보이던
// 깜빡임의 출처이자, 사라진 버튼이 돌아오는 순간을 다시 눌러 완료가 취소되는
// 경로였다 (quick 260828-w2r).
//
// 스켈레톤은 최초 마운트에서만 나온다 — 그때는 보여줄 이전 데이터가 없다.
//
// lib/supabase/admin이나 lib/progress-store를 절대 import하지 않는다
// (check-progress-gates.mjs G2).

import {
  createContext,
  useCallback,
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
  til: string;
  needsReview: boolean;
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

// refresh()가 Promise를 돌려주는 것이 계약의 일부다 — 완료 버튼은 이 Promise가
// 끝날 때까지 자기 상태를 붙들고 있어야 서버 값이 도착하기 전에 이전 값으로
// 되돌아가는 깜빡임이 생기지 않는다.
export type ProgressContextValue = ProgressState & { refresh: () => Promise<void> };

const ProgressContext = createContext<ProgressContextValue | null>(null);

/** 응답 한 벌을 화면 상태로 옮기는 유일한 판정 — 최초 로드와 재조회가 공유한다. */
function toState(data: ProgressData): ProgressState {
  if (!data.unlocked) return { status: "locked", data };
  if (!data.ok) return { status: "error", data: null };
  return { status: "ready", data };
}

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

  const url = `/api/progress${lessonId ? `?lesson=${encodeURIComponent(lessonId)}` : ""}`;

  // 최초 마운트와 refresh()는 같은 응답 해석(toState)을 쓰고, fetch 배선만 각자
  // 갖는다 — 판정 로직이 두 벌이 되면 한쪽만 고쳐지는 결함이 생기고, 배선을
  // 공용 함수로 묶으면 effect 본문이 setState를 부르는 함수를 직접 호출하는
  // 모양이 되어 react-hooks/set-state-in-effect에 걸린다.
  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal, cache: "no-store" })
      .then((res) => res.json() as Promise<ProgressData>)
      .then((data) => {
        if (controller.signal.aborted) return;
        setState(toState(data));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: "error", data: null });
      });

    return () => controller.abort();
  }, [url]);

  // 재조회는 화면을 비우지 않는다 — status를 loading으로 되돌리지 않고, 응답이
  // 도착한 뒤에만 상태를 바꿔 끼운다. 돌려주는 Promise는 완료 버튼이 자기 임시
  // 상태를 언제 풀지 판단하는 신호다.
  const refresh = useCallback(
    () =>
      fetch(url, { cache: "no-store" })
        .then((res) => res.json() as Promise<ProgressData>)
        .then((data) => setState(toState(data)))
        .catch(() => setState({ status: "error", data: null })),
    [url],
  );

  return (
    <ProgressContext.Provider value={{ ...state, refresh }}>
      <div data-progress-island data-progress-state={state.status}>
        {children}
      </div>
    </ProgressContext.Provider>
  );
}
