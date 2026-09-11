'use client';

// 슬랙 피드 "새로고침" 버튼. 페이지는 force-dynamic이라 열 때마다 최신을 받지만,
// 머물러 있는 동안 새 글을 다시 받고 싶을 때를 위해 router.refresh()로 서버 컴포넌트를
// 다시 실행한다(슬랙 재조회). 전체 새로고침이 아니라 서버 렌더만 다시 돈다.

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export function SlackRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className="chip tap-feedback inline-flex min-h-11 items-center gap-1.5 text-label font-semibold"
      aria-label="슬랙 피드 새로고침"
    >
      <RefreshCw className={`h-4 w-4 shrink-0 ${pending ? 'animate-spin' : ''}`} aria-hidden="true" />
      {pending ? '불러오는 중…' : '새로고침'}
    </button>
  );
}
