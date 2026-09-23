import type { Metadata } from "next";
import { OfflineCenter } from "@/components/offline/offline-center";

// 오프라인 저장 화면(설계 3.3). 쿠키도 사용자 데이터도 읽지 않는 정적 셸이다. 그래야
// 서비스 워커가 이 HTML을 저장해 두었다가 누구의 개인 화면 대신이든 그대로 보여 줄 수 있다.
// 내용(저장 현황, 목차)은 전부 클라이언트 아일랜드가 기기 저장소에서 읽는다.
export const metadata: Metadata = {
  title: "오프라인 저장",
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <OfflineCenter />
    </main>
  );
}
