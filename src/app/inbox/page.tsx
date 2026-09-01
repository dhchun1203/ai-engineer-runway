import { hasUnlockCookie } from "@/lib/auth";
import { readInboxItems } from "@/lib/inbox-store";
import { InboxPanel } from "@/components/inbox-panel";

// /inbox 질문함(quick 260901-x62). /review·/notes와 같은 조립 순서를 재사용한다
// — hasUnlockCookie() 최우선 → readInboxItems(). 쿠키가 있어야만 질문 데이터에
// 접근하므로 동적 렌더가 필요하다(조건부 쿠키 접근이 캐시된 응답을 내보내는
// 문제 회피).
export const dynamic = "force-dynamic";

function EmptyState({ message }: { message: string }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="panel-hero flex flex-col gap-2 px-4 py-4 sm:px-6 sm:py-6">
        <h1 className="text-display font-black">질문함</h1>
        <p className="text-body font-normal">{message}</p>
      </header>
    </main>
  );
}

export default async function InboxPage() {
  // 무조건, 그리고 어떤 조회보다도 먼저 호출한다 — 홈·복습·레슨 페이지와
  // 동일한 게이트 순서(D8-P 원칙 승계).
  const unlocked = await hasUnlockCookie();
  if (!unlocked) {
    return <EmptyState message="질문함은 잠금 해제 후 이용할 수 있어요. 홈에서 잠금을 해제해 주세요." />;
  }

  const itemsRead = await readInboxItems();
  if (!itemsRead.ok) {
    return <EmptyState message="질문 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요." />;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="panel-hero flex flex-col gap-2 px-4 py-4 sm:px-6 sm:py-6">
        <h1 className="text-display font-black">질문함</h1>
        <p className="text-body font-normal">
          공부하다가 곁가지로 떠오른 질문을 여기 담아두세요. 나중에 &ldquo;클로드에 물어보기&rdquo;로
          꺼내 쓸 수 있어요.
        </p>
      </header>

      <InboxPanel items={itemsRead.items} />
    </main>
  );
}
