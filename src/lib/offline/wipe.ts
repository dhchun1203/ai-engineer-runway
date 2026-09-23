// 기기 저장본 정리(설계 3.6). 로그아웃 버튼, 로그아웃 상태 감지, 다른 계정 로그인 감지가 부른다.
// keepQueue: 동기화 안 된 쓰기만 남기고 사본은 지운다(세션이 만료돼 로그아웃 상태가 된 경우,
//   같은 계정으로 다시 로그인하면 동기화된다. 다른 계정이면 계정 대조가 모두 지운다).
// keepRegistration: 서비스 워커는 남긴다(계정만 바뀐 경우).

import { clearOfflineCaches } from "./cache";
import { deleteOfflineDb } from "./db";
import { resetQueueCount } from "./queue";
import { clearCopies } from "./snapshots";

export type WipeOptions = { keepQueue?: boolean; keepRegistration?: boolean };

export async function wipeOfflineData(options: WipeOptions = {}): Promise<void> {
  try {
    await clearOfflineCaches();
  } catch (error) {
    // 캐시 삭제 실패는 다음 계정 대조에서 다시 시도한다.
    console.warn("[offline] clearing offline caches failed", error);
  }
  try {
    if (options.keepQueue) await clearCopies();
    else await deleteOfflineDb();
  } catch (error) {
    // 위와 같다.
    console.warn("[offline] clearing offline-db failed", error);
  }
  if (!options.keepQueue) resetQueueCount();
  if (!options.keepRegistration && typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch (error) {
      // 해제 실패는 다음 계정 대조에서 다시 시도한다.
      console.warn("[offline] unregistering service worker failed", error);
    }
  }
}
