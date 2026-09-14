import { SkeletonBlock } from '@/components/skeleton';

// /basecamp(베이스캠프 선행 과제)로 이동할 때의 로딩 자리표시. 실제 페이지 레이아웃
// (max-w-3xl, 헤더 + 이번 주차 패널 + 지난 주차)을 근사한다.
export default function Loading() {
  return (
    <main
      role="status"
      aria-busy="true"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8"
    >
      <span className="sr-only">불러오는 중…</span>
      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-6 w-16" />
        <SkeletonBlock className="h-9 w-3/4" />
        <SkeletonBlock className="h-4 w-full max-w-2xl" />
      </div>
      <SkeletonBlock className="h-56 w-full" />
      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-12 w-full" />
        <SkeletonBlock className="h-12 w-full" />
      </div>
    </main>
  );
}
