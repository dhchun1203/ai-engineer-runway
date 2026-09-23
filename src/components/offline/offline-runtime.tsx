"use client";

// 오프라인 모드의 보이지 않는 런타임(설계 3.1, 3.4, 3.6, 4절 위험 1). 루트 레이아웃에 한 번만 둔다.
//   1) 계정 대조와 서비스 워커 등록: 경로가 바뀔 때마다 /api/auth로 로그인 상태를 본다.
//      로그인이 아니면 저장본을 지우고 서비스 워커를 해제한다(동기화 안 된 대기열이 있으면
//      대기열만 남긴다). 다른 계정이면 기기 사본과 대기열을 모두 지운다. 로그인이면
//      production에서만 /sw.js?v=<빌드 id>를 등록한다. 개발 서버의 청크 주소는 해시가
//      아니라 캐시 먼저 전략과 맞지 않는다.
//   2) 동기화 계기: 앱 시작(위 대조 직후), 온라인 복귀, 화면이 다시 보일 때.
//   3) 오프라인 링크 이동: Next의 클라이언트 이동은 HTML이 아니라 RSC 데이터를 받아서
//      오프라인에서는 실패한다. 오프라인이면 같은 출처 <a> 클릭을 캡처 단계에서 가로채
//      location.assign으로 전체 이동시킨다. 그러면 서비스 워커가 저장된 HTML을 준다.

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { BUILD_ID } from "@/lib/offline/cache";
import { isOnline, subscribeOnline } from "@/lib/offline/connectivity";
import { getMeta, offlineDbExists, setMeta } from "@/lib/offline/db";
import { countQueue } from "@/lib/offline/queue";
import { fetchAuthState, replayQueue } from "@/lib/offline/sync";
import { wipeOfflineData } from "@/lib/offline/wipe";

const SERVICE_WORKER_URL = `/sw.js?v=${encodeURIComponent(BUILD_ID)}`;

/** 로그인 상태를 확인해 저장본을 정리하고 서비스 워커를 등록한다. 돌려주는 값은 "동기화를 시도해도 되는가". */
async function reconcileAccount(): Promise<boolean> {
  const auth = await fetchAuthState();
  // 서버에 닿지 않는다(오프라인). 판단할 수 없으니 저장본은 그대로 두고 동기화는 허용한다.
  // 동기화 엔진이 보내기 전에 로그인을 다시 확인한다.
  if (auth === null) return true;

  if (!auth.loggedIn) {
    const keepQueue = (await offlineDbExists()) && (await countQueue()) > 0;
    await wipeOfflineData({ keepQueue });
    return false;
  }

  if (auth.userId) {
    const owner = await getMeta<string>("userId").catch((error: unknown) => {
      console.warn("[offline] reading device data owner failed", error);
      return undefined;
    });
    if (owner && owner !== auth.userId) {
      await wipeOfflineData({ keepRegistration: true });
    }
    await setMeta("userId", auth.userId).catch((error: unknown) => {
      console.warn("[offline] saving device data owner failed", error);
    });
  }

  if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
    await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: "/" });
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
        if (canSync) void replayQueue();
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
      if (document.visibilityState === "visible" && canSyncRef.current) void replayQueue();
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
