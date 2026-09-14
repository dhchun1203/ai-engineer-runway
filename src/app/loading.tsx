import { SkeletonBlock } from '@/components/skeleton';

// 동적 라우트로 이동할 때 서버 응답을 기다리는 동안 즉시 보여주는 로딩 자리표시.
// 홈(app/page.tsx)과, 자체 loading.tsx가 없는 다른 동적 라우트의 공용 폴백이다
// (/til·/basecamp는 각자 loading.tsx가 있어 이 파일을 쓰지 않는다). 특정 화면 모양에
// 치우치지 않도록 제목 + 카드 몇 개의 중립적인 형태로 둔다.
export default function Loading() {
  return (
    <main
      role="status"
      aria-busy="true"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8"
    >
      <span className="sr-only">불러오는 중…</span>
      <SkeletonBlock className="h-9 w-2/3" />
      <SkeletonBlock className="h-4 w-1/2" />
      <SkeletonBlock className="h-32 w-full" />
      <SkeletonBlock className="h-32 w-full" />
    </main>
  );
}
