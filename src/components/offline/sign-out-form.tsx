"use client";

// 로그아웃 폼(설계 3.6). 서버 로그아웃(signOutAction) 전에 이 기기의 오프라인 저장본
// (Cache Storage, IndexedDB)을 모두 지우고 서비스 워커를 해제한다. 정리가 실패해도
// 로그아웃은 진행한다. 로그아웃 뒤 첫 화면에서 계정 대조가 한 번 더 정리한다.
//
// 세 가지를 더 챙긴다.
// 1) 서버에 아직 보내지 않은 변경(대기열)이 있으면 지우기 전에 한 번 묻는다. 취소하면
//    아무것도 지우지 않는다.
// 2) 오프라인이면 로그아웃할 수 없으니(서버 로그아웃이 필요하다) 저장본을 지우지 않고
//    안내만 한다. 온라인으로 보였는데 서버 로그아웃 요청이 실패해도 오류 화면으로
//    넘어가지 않고 같은 안내를 보인다.
// 3) 도는 동안 버튼을 잠그고 "로그아웃 중"을 보인다(useFormStatus).

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { unstable_rethrow } from "next/navigation";
import { isOnline } from "@/lib/offline/connectivity";
import { countQueue } from "@/lib/offline/queue";
import { wipeOfflineData } from "@/lib/offline/wipe";

const NEEDS_CONNECTION_MESSAGE = "로그아웃하려면 인터넷 연결이 필요해요. 연결된 뒤 다시 눌러 주세요.";

function SignOutButton({ className, children }: { className?: string; children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? "로그아웃 중…" : children}
    </button>
  );
}

export function SignOutForm({
  action,
  className,
  children,
}: {
  action: () => Promise<void>;
  // 버튼에 붙는 클래스. 버튼은 이 폼이 직접 그린다(대기 중 잠금 때문에).
  className?: string;
  // 버튼 글자.
  children: ReactNode;
}) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleAction() {
    setMessage(null);
    if (!isOnline()) {
      setMessage(NEEDS_CONNECTION_MESSAGE);
      return;
    }
    const pendingCount = await countQueue();
    if (
      pendingCount > 0 &&
      !window.confirm(`아직 서버에 보내지 않은 변경 ${pendingCount}개가 있어요. 로그아웃하면 사라져요. 로그아웃할까요?`)
    ) {
      return;
    }
    try {
      await wipeOfflineData();
    } catch (error) {
      // 위 설명대로 로그아웃은 막지 않는다.
      console.warn("[offline] wiping device data before sign-out failed", error);
    }
    try {
      await action();
    } catch (error) {
      // 성공한 로그아웃은 redirect()로 끝난다. 그 신호는 Next에 돌려준다.
      unstable_rethrow(error);
      console.warn("[offline] sign-out request failed", error);
      setMessage(NEEDS_CONNECTION_MESSAGE);
    }
  }

  return (
    <form action={handleAction} className="flex flex-col items-start gap-2">
      <SignOutButton className={className}>{children}</SignOutButton>
      {message ? (
        <p role="alert" className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {message}
        </p>
      ) : null}
    </form>
  );
}
