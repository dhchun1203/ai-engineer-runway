import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-[28px] font-semibold leading-[1.2]">페이지를 찾을 수 없습니다</h1>
      <p className="text-[16px] font-normal leading-[1.6]">
        요청하신 콘텐츠가 존재하지 않습니다. 아래 버튼으로 커리큘럼 홈에서 다시 탐색해보세요.
      </p>
      <Link
        href="/"
        className="flex min-h-11 items-center justify-center rounded-lg bg-accent px-6 text-[16px] font-semibold leading-[1.6] text-white dark:bg-accent-dark dark:text-background-dark"
      >
        커리큘럼 홈으로
      </Link>
    </main>
  );
}
