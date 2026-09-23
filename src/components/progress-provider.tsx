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
//
// 오프라인 모드(설계 3.4): 받은 응답은 기기 사본으로 남기고, 동기화 안 된 쓰기(대기열)를
// 얹어 보여 준다. 받기가 실패하면(오프라인) 사본에 대기열을 얹어 ready로 그린다. 사본이
// 없을 때만 기존처럼 error다.
//
// 사본 저장(IndexedDB 쓰기)은 화면을 그리는 것을 절대 막지 않는다. countQueue()를 fetch와
// 동시에 시작해 두고, 대기열이 비어 있으면(흔한 경우) 응답이 오자마자 바로 그리고 사본
// 저장은 그 뒤 백그라운드로 넘긴다. 대기열이 있으면 얘기가 다르다. 서버 값을 먼저 그렸다가
// 한 프레임 뒤 대기열이 얹힌 값으로 바꿔 끼우면, 메모장(lesson-notepad.tsx)은 initialBody를
// 마운트 시 한 번만 읽으므로 그 사이에 옛 서버 값으로 마운트되어 오프라인에서 쓴 메모가
// 화면에서 사라진 것처럼 보이고, 그 상태에서 사용자가 다시 타이핑하면 자동 저장이 서버의
// 옛 값으로 오프라인 메모를 덮어써 버린다(완료 버튼도 한 프레임 되돌아간 것처럼 보인다).
// 그래서 대기열이 있을 때는 keepProgressCopy가 다 얹어 줄 때까지 기다렸다가 그 값 하나로만
// 그린다. status가 loading에서 곧장 최종값으로만 넘어가고, 중간에 옛 값이 끼어들 틈이 없다.
// (서버 조회와 대기열 조회 사이의 아주 좁은 경합은 감수한다. 그 사이에 재생이 이 항목을
// 지우면 다음 로드에서 맞는 값으로 정리된다.)
//
// 겹치는 재조회(effect 재실행, refresh()의 중복 호출)가 있으면 더 늦게 시작한 요청의
// 결과만 반영한다(requestSeqRef). 먼저 시작한 요청이 응답만 늦게 오면, 이미 새 요청이
// 그려 둔 최신 값을 옛 값으로 덮어쓸 수 있기 때문이다.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { StepId } from "@/content/modules";
import type { ProgressCounts } from "@/lib/progress-math";
import { countQueue } from "@/lib/offline/queue";
import { keepProgressCopy, readProgressCopy } from "@/lib/offline/snapshots";

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
  needsReviewSlugs: string[] | null;
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

  // 겹치는 요청 중 가장 늦게 시작한 것만 화면에 반영한다(위 주석 참고). 최초 마운트의
  // effect와 refresh()가 이 하나의 카운터를 함께 올린다.
  const requestSeqRef = useRef(0);

  // 최초 마운트와 refresh()는 같은 응답 해석(toState)을 쓰고, fetch 배선만 각자
  // 갖는다 — 판정 로직이 두 벌이 되면 한쪽만 고쳐지는 결함이 생기고, 배선을
  // 공용 함수로 묶으면 effect 본문이 setState를 부르는 함수를 직접 호출하는
  // 모양이 되어 react-hooks/set-state-in-effect에 걸린다.
  useEffect(() => {
    const controller = new AbortController();
    const seq = (requestSeqRef.current += 1);
    const isCurrent = () => !controller.signal.aborted && requestSeqRef.current === seq;

    Promise.all([
      fetch(url, { signal: controller.signal, cache: "no-store" }).then(
        (res) => res.json() as Promise<ProgressData>,
      ),
      countQueue(),
    ])
      .then(async ([data, queued]) => {
        if (!isCurrent()) return;
        if (queued === 0) {
          // 대기열이 없으면(흔한 경우) 응답이 오자마자 바로 그린다. 사본 저장은 그 뒤
          // 백그라운드에서 한다(기기 저장소 왕복이 매 레슨 로드의 첫 그리기를 늦추지 않게).
          setState(toState(data));
          keepProgressCopy(lessonId, data).catch((error: unknown) => {
            console.warn("[offline] keeping progress copy failed", error);
          });
          return;
        }
        // 대기열이 있으면 서버 값을 먼저 그리지 않는다(위 파일 헤더 주석 참고). 대기열이
        // 얹힌 값이 갖춰질 때까지 기다렸다가 그 값 하나로만 그린다.
        const kept = await keepProgressCopy(lessonId, data);
        if (!isCurrent()) return;
        setState(toState(kept));
      })
      .catch(() => {
        if (!isCurrent()) return;
        readProgressCopy(lessonId).then((copy) => {
          if (!isCurrent()) return;
          setState(copy ? toState(copy) : { status: "error", data: null });
        });
      });

    return () => controller.abort();
  }, [url, lessonId]);

  // 재조회는 화면을 비우지 않는다. status를 loading으로 되돌리지 않고, 응답이
  // 도착한 뒤에만 상태를 바꿔 끼운다. 돌려주는 Promise는 완료 버튼이 자기 임시
  // 상태를 언제 풀지 판단하는 신호다(응답이 도착해 화면이 갱신된 시점에 곧바로
  // resolve하고, 사본 저장은 그 뒤 백그라운드에서 마저 한다). 대기열이 있으면 위 effect와
  // 같은 규칙으로 그 값이 갖춰질 때까지 기다린다. 오프라인이면 사본(+대기열)으로 바꿔 끼운다.
  const refresh = useCallback(() => {
    const seq = (requestSeqRef.current += 1);
    const isCurrent = () => requestSeqRef.current === seq;

    return Promise.all([
      fetch(url, { cache: "no-store" }).then((res) => res.json() as Promise<ProgressData>),
      countQueue(),
    ])
      .then(async ([data, queued]) => {
        if (!isCurrent()) return;
        if (queued === 0) {
          setState(toState(data));
          keepProgressCopy(lessonId, data).catch((error: unknown) => {
            console.warn("[offline] keeping progress copy failed", error);
          });
          return;
        }
        const kept = await keepProgressCopy(lessonId, data);
        if (!isCurrent()) return;
        setState(toState(kept));
      })
      .catch(() => {
        if (!isCurrent()) return;
        return readProgressCopy(lessonId).then((copy) => {
          if (!isCurrent()) return;
          setState(copy ? toState(copy) : { status: "error", data: null });
        });
      });
  }, [url, lessonId]);

  return (
    <ProgressContext.Provider value={{ ...state, refresh }}>
      <div data-progress-island data-progress-state={state.status}>
        {children}
      </div>
    </ProgressContext.Provider>
  );
}
