// 연결 상태 저장소(설계 3.5 "상태 판단"). 오프라인 기능 전부가 이 하나를 본다.
// navigator.onLine과 online/offline 이벤트를 쓰되, 오프라인인 동안에는 10초마다 같은
// 출처에 가벼운 HEAD 요청(/manifest.webmanifest, 로그인 없이 열리는 경로)을 보내 실제
// 복구를 확인한다. online 이벤트가 와도 이 확인이 통과해야 온라인으로 바꾼다(와이파이만
// 붙고 인터넷은 안 되는 경우를 거른다). 서비스 워커는 HEAD를 건드리지 않는다.

import { useSyncExternalStore } from "react";

const PROBE_URL = "/manifest.webmanifest";
const PROBE_INTERVAL_MS = 10_000;
const PROBE_TIMEOUT_MS = 5_000;

let online = true;
let started = false;
let probeTimer: ReturnType<typeof setInterval> | null = null;
// 오프라인이 될 때마다 1씩 는다. 확인 요청은 시작할 때의 값을 기억하고, 그 사이에 다시
// 오프라인이 됐으면(값이 바뀌었으면) 결과를 버린다. 오프라인 이벤트 전에 떠난 느린 확인이
// 뒤늦게 성공해 다시 온라인으로 뒤집는 일을 막는다.
let offlineEpoch = 0;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function stopProbing(): void {
  if (probeTimer !== null) {
    clearInterval(probeTimer);
    probeTimer = null;
  }
}

/** 확인 요청을 보내고, 그 사이 새 오프라인 신호가 없었을 때만 결과를 반영한다. */
function probeAndApply(onUnreachable?: () => void): void {
  const epoch = offlineEpoch;
  void probeOnline().then((reachable) => {
    if (epoch !== offlineEpoch) return;
    if (reachable) setOnline(true);
    else onUnreachable?.();
  });
}

function startProbing(): void {
  if (probeTimer !== null) return;
  probeTimer = setInterval(() => probeAndApply(), PROBE_INTERVAL_MS);
}

function setOnline(next: boolean): void {
  if (next) stopProbing();
  else {
    offlineEpoch += 1;
    startProbing();
  }
  if (next === online) return;
  online = next;
  emit();
}

function start(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  online = navigator.onLine;
  if (!online) startProbing();
  window.addEventListener("offline", () => setOnline(false));
  window.addEventListener("online", () => probeAndApply(startProbing));
}

/** 서버에 닿는지만 본다(응답 코드는 보지 않는다). */
export async function probeOnline(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    await fetch(PROBE_URL, { method: "HEAD", cache: "no-store", signal: controller.signal });
    return true;
  } catch {
    // 오프라인이면 늘 실패하는 확인이라(10초마다) 경고로 남기지 않는다. 결과 false가 곧 보고다.
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function isOnline(): boolean {
  start();
  return online;
}

/** 요청이 네트워크 오류로 실패했을 때 호출한다. 확인 요청이 복구를 감지하면 다시 온라인이 된다. */
export function markOffline(): void {
  start();
  setOnline(false);
}

export function subscribeOnline(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getServerOnline(): boolean {
  return true;
}

export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, isOnline, getServerOnline);
}
