"use client";

// 오프라인 모드의 보이지 않는 런타임(설계 3.1, 3.4, 3.6, 4절 위험 1). 루트 레이아웃에 한 번만 둔다.
//   1) 계정 대조와 서비스 워커 등록: 경로가 바뀔 때마다 /api/auth로 로그인 상태를 본다.
//      로그인이 아니면 저장본을 지우고 서비스 워커를 해제한다(동기화 안 된 대기열이 있으면
//      대기열만 남긴다). 다른 계정이면 기기 사본과 대기열을 모두 지운다. 로그인이면
//      production에서만 /sw.js?v=<빌드 id>를 등록한다. 개발 서버의 청크 주소는 해시가
//      아니라 캐시 먼저 전략과 맞지 않는다.
//   2) 동기화 계기: 앱 시작(위 대조 직후), 온라인 복귀, 화면이 다시 보일 때.
//   2-1) 새 배포 뒤 옛 저장본 옮기기(migration.ts): 대조가 끝난 뒤 한 번 부른다.
//   3) 오프라인 링크 이동: Next의 클라이언트 이동은 HTML이 아니라 RSC 데이터를 받아서
//      오프라인에서는 실패한다. 오프라인이면 같은 출처 <a> 클릭을 캡처 단계에서 가로채
//      location.assign으로 전체 이동시킨다. 그러면 서비스 워커가 저장된 HTML을 준다.

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { BUILD_ID } from "@/lib/offline/cache";
import { isOnline, subscribeOnline } from "@/lib/offline/connectivity";
import { allowOfflineDbReopen, getMeta, offlineDbExists, setMeta } from "@/lib/offline/db";
import { startMigrationOnce } from "@/lib/offline/migration";
import { countQueue } from "@/lib/offline/queue";
import { fetchAuthState, markNeedsLogin, replayQueue } from "@/lib/offline/sync";
import { hasOfflineData, wipeOfflineData } from "@/lib/offline/wipe";
import type { AuthState } from "@/lib/offline/offline-logic";

const SERVICE_WORKER_URL = `/sw.js?v=${encodeURIComponent(BUILD_ID)}`;

// 한 번의 "로그아웃" 응답은 일시적일 수 있다(인증 서버 키 조회 실패 등). 지우기 전에 이만큼
// 기다렸다가 한 번 더 묻는다.
const LOGGED_OUT_RECHECK_MS = 2_000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isServiceWorkerEnabled(): boolean {
  return process.env.NODE_ENV === "production" && "serviceWorker" in navigator;
}

/**
 * 계정 전환으로 저장본을 지운 뒤 부른다. 등록은 그대로라 서비스 워커가 다시 설치되지 않고,
 * 캐시는 설치 때만 만들어지므로 활성 서비스 워커에게 오프라인 목차를 다시 받게 한다(이때
 * 현재 빌드 캐시가 다시 생긴다).
 */
async function requestReprecache(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    registration?.active?.postMessage({ type: "reprecache" });
  } catch (error) {
    console.warn("[offline] asking service worker to reprecache failed", error);
  }
}

/**
 * 로그아웃 응답을 받았을 때. 지울 것이 없으면 바로 끝낸다. 있으면 잠시 뒤 한 번 더 확인하고
 * 그래도 로그아웃이면 지운다. 다시 물었더니 로그인이면 그 상태를 돌려준다(이어서 로그인 처리).
 * 돌려주는 값: 로그인 상태(계속 진행), "stop"(동기화 금지), "unknown"(판단 불가, 저장본 유지).
 */
async function handleLoggedOut(): Promise<AuthState | "stop" | "unknown"> {
  // 이동할 때마다 확인한다(값싼 기기 안 조회 세 번). 다른 탭에서 받은 저장본도 놓치지 않는다.
  if (!(await hasOfflineData())) {
    if ((await offlineDbExists()) && (await countQueue()) > 0) markNeedsLogin();
    return "stop";
  }
  await wait(LOGGED_OUT_RECHECK_MS);
  const again = await fetchAuthState();
  if (again === null) return "unknown";
  if (again.loggedIn) return again;
  const keepQueue = (await offlineDbExists()) && (await countQueue()) > 0;
  await wipeOfflineData({ keepQueue });
  // 동기화 안 된 쓰기가 남았다. 재생이 돌지 않으니 여기서 "다시 로그인하면 동기화돼요"를 켠다.
  if (keepQueue) markNeedsLogin();
  return "stop";
}

/** 로그인 상태를 확인해 저장본을 정리하고 서비스 워커를 등록한다. 돌려주는 값은 "동기화를 시도해도 되는가". */
async function reconcileAccount(): Promise<boolean> {
  let auth = await fetchAuthState();
  // 서버에 닿지 않는다(오프라인). 판단할 수 없으니 저장본은 그대로 두고 동기화는 허용한다.
  // 동기화 엔진이 보내기 전에 로그인을 다시 확인한다.
  if (auth === null) return true;

  if (!auth.loggedIn) {
    const outcome = await handleLoggedOut();
    if (outcome === "stop") return false;
    if (outcome === "unknown") return true;
    auth = outcome;
  }

  let switchedAccount = false;
  if (auth.userId) {
    // 로그인이 확인됐다. 이 페이지에서 앞서 로그아웃 정리로 막아 둔 DB 열기를 푼다(db.ts).
    allowOfflineDbReopen();
    const owner = await getMeta<string>("userId").catch((error: unknown) => {
      console.warn("[offline] reading device data owner failed", error);
      return undefined;
    });
    if (owner && owner !== auth.userId) {
      await wipeOfflineData({ keepRegistration: true });
      // 계정만 바뀐 정리다. 새 계정의 사본은 바로 이어서 저장하므로 다시 연다.
      allowOfflineDbReopen();
      switchedAccount = true;
    }
    await setMeta("userId", auth.userId).catch((error: unknown) => {
      console.warn("[offline] saving device data owner failed", error);
    });
  }

  if (isServiceWorkerEnabled()) {
    // 옛 빌드의 탭이 옛 주소(/sw.js?v=<옛 id>)를 다시 등록하면 새 서비스 워커를 옛 것으로
    // 덮는다. 서버 빌드가 다르면 등록을 건너뛴다(새 페이지가 등록한다).
    const staleBuild = auth.buildId !== null && auth.buildId !== BUILD_ID;
    if (!staleBuild) await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: "/" });
    if (switchedAccount) await requestReprecache();
  }
  return true;
}

function isPlainLeftClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function OfflineRuntime() {
  const pathname = usePathname();
  // 로그아웃 상태에서 동기화를 부르면 빈 DB가 새로 생긴다. 대조 결과를 기억해 막는다.
  const canSyncRef = useRef(false);

  useEffect(() => {
    let active = true;
    reconcileAccount()
      .catch((error: unknown) => {
        // 대조나 등록이 실패해도 동기화 엔진이 보내기 전에 로그인을 다시 확인한다.
        console.warn("[offline] account reconcile or service worker registration failed", error);
        return true;
      })
      .then((canSync) => {
        if (!active) return;
        canSyncRef.current = canSync;
        // 앱 시작과 경로 이동: 입력 중이 아니라 빌드가 다르면 한 번 새로 불러와도 된다.
        if (canSync) void replayQueue({ allowReload: true });
        // 새 배포 뒤 옛 저장본을 지금 빌드 캐시로 옮긴다(페이지 로드마다 한 번, 조건은 migration.ts).
        if (canSync) startMigrationOnce();
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = subscribeOnline(() => {
      if (isOnline() && canSyncRef.current) void replayQueue();
    });
    function handleVisibility() {
      if (document.visibilityState === "visible" && canSyncRef.current) void replayQueue({ allowReload: true });
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (isOnline() || event.defaultPrevented || !isPlainLeftClick(event)) return;
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (target.target && target.target !== "_self") return;
      if (target.hasAttribute("download")) return;
      const url = new URL(target.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // 같은 문서 안 이동(#소제목)은 브라우저에 맡긴다.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(url.href);
    }
    window.addEventListener("click", handleClick, true);
    return () => window.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
