// 기기 저장본 정리(설계 3.6). 로그아웃 버튼, 로그아웃 상태 감지, 다른 계정 로그인 감지가 부른다.
// keepQueue: 동기화 안 된 쓰기만 남기고 사본은 지운다(세션이 만료돼 로그아웃 상태가 된 경우,
//   같은 계정으로 다시 로그인하면 동기화된다. 다른 계정이면 계정 대조가 모두 지운다).
// keepRegistration: 서비스 워커는 남긴다(계정만 바뀐 경우).
// 지울 것이 없는 단계는 건너뛴다(로그아웃 방문자가 이동할 때마다 삭제 요청을 보내지 않게).

import { OFFLINE_CACHE_PREFIX, clearOfflineCaches } from "./cache";
import { deleteOfflineDb, offlineDbExists } from "./db";
import { resetQueueCount } from "./queue";
import { clearCopies } from "./snapshots";

export type WipeOptions = { keepQueue?: boolean; keepRegistration?: boolean };

function hasServiceWorkerApi(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

async function hasOfflineCaches(): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) return false;
  return (await caches.keys()).some((name) => name.startsWith(OFFLINE_CACHE_PREFIX));
}

async function serviceWorkerRegistrations(): Promise<readonly ServiceWorkerRegistration[]> {
  if (!hasServiceWorkerApi()) return [];
  return navigator.serviceWorker.getRegistrations();
}

/** 이 기기에 지울 오프라인 저장본(캐시, DB, 서비스 워커)이 하나라도 있는가. 확인이 실패하면 true. */
export async function hasOfflineData(): Promise<boolean> {
  try {
    if (await hasOfflineCaches()) return true;
    if (await offlineDbExists()) return true;
    return (await serviceWorkerRegistrations()).length > 0;
  } catch (error) {
    // 확인하지 못하면 "있다"로 본다(지워야 할 저장본을 놓치지 않는 쪽).
    console.warn("[offline] checking for device data failed", error);
    return true;
  }
}

export async function wipeOfflineData(options: WipeOptions = {}): Promise<void> {
  try {
    if (await hasOfflineCaches()) await clearOfflineCaches();
  } catch (error) {
    // 캐시 삭제 실패는 다음 계정 대조에서 다시 시도한다.
    console.warn("[offline] clearing offline caches failed", error);
  }
  try {
    if (await offlineDbExists()) {
      if (options.keepQueue) await clearCopies();
      else await deleteOfflineDb();
    }
  } catch (error) {
    // 위와 같다.
    console.warn("[offline] clearing offline-db failed", error);
  }
  if (!options.keepQueue) resetQueueCount();
  if (!options.keepRegistration) {
    try {
      const registrations = await serviceWorkerRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch (error) {
      // 해제 실패는 다음 계정 대조에서 다시 시도한다.
      console.warn("[offline] unregistering service worker failed", error);
    }
  }
}
