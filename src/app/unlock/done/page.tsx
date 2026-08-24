import Link from "next/link";
import type { Metadata } from "next";

// D-19 해석 기록: D-19 원문은 "URL을 한 번 열면 쿠키가 설정되고 홈으로 이동"이다.
// UI-SPEC(후속 승인)은 같은 흐름에 성공/실패 안내 화면과 각각의 CTA를 정의했다.
// 두 문서를 모두 만족시키기 위해 자동 리다이렉트의 목적지를 홈이 아닌 이
// 안내 화면으로 두고, 여기서 한 번의 탭으로 홈에 도달하게 한다 — 북마크가
// 실제로 동작했는지 사용자가 확인할 수 있어야 하기 때문이다.
//
// 이 페이지는 쿠키를 읽지 않으므로 hasUnlockCookie()를 호출하지 않는다 —
// 진도 UI가 아니라 순수 안내 화면이다. 서버에서 검증이 끝난 뒤 완성된 상태로
// 렌더되므로 클라이언트 로딩 상태가 없다(UI-SPEC #24). 검색엔진 노출 이유가
// 없으므로 색인을 거부한다.
export const metadata: Metadata = {
  title: "잠금 해제",
  robots: { index: false, follow: false },
};

export default async function UnlockDonePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const ok = state === "ok";

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-[20px] font-semibold leading-[1.3]">
        {ok ? "잠금 해제됐어요" : "유효하지 않은 링크예요"}
      </h1>
      <p className="text-[16px] font-normal leading-[1.6]">
        {ok ? "이제 이 기기에서도 진도가 저장돼요." : "링크를 다시 확인해주세요."}
      </p>
      <Link
        href="/"
        className="flex min-h-11 items-center justify-center rounded-lg bg-accent px-6 text-[16px] font-semibold leading-[1.6] text-white dark:bg-accent-dark dark:text-background-dark"
      >
        {ok ? "커리큘럼 홈으로" : "홈으로 돌아가기"}
      </Link>
    </main>
  );
}
