import { SkeletonBlock } from '@/components/skeleton';

// /til(학습 기록 목록)로 이동할 때의 로딩 자리표시. 실제 페이지 레이아웃(max-w-5xl,
// 헤더 + 2열 카드 그리드)을 근사해 스켈레톤에서 콘텐츠로 바뀔 때 흔들림을 줄인다.
export default function Loading() {
  return (
    <main
      role="status"
      aria-busy="true"
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8"
    >
      <span className="sr-only">불러오는 중…</span>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SkeletonBlock className="h-9 w-48" />
        <SkeletonBlock className="h-11 w-28" />
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i}>
            <SkeletonBlock className="h-40 w-full" />
          </li>
        ))}
      </ul>
    </main>
  );
}
