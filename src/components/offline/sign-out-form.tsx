"use client";

// 로그아웃 폼(설계 3.6). 서버 로그아웃(signOutAction) 전에 이 기기의 오프라인 저장본
// (Cache Storage, IndexedDB)을 모두 지우고 서비스 워커를 해제한다. 정리가 실패해도
// 로그아웃은 진행한다. 로그아웃 뒤 첫 화면에서 계정 대조가 한 번 더 정리한다.

import type { ReactNode } from "react";
import { wipeOfflineData } from "@/lib/offline/wipe";

export function SignOutForm({ action, children }: { action: () => Promise<void>; children: ReactNode }) {
  async function handleAction() {
    try {
      await wipeOfflineData();
    } catch (error) {
      // 위 설명대로 로그아웃은 막지 않는다.
      console.warn("[offline] wiping device data before sign-out failed", error);
    }
    await action();
  }

  return <form action={handleAction}>{children}</form>;
}
