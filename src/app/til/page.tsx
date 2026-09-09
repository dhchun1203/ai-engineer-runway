import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublishedPosts, listPublishedDates } from '@/lib/til/store';
import { hasUnlockCookie } from '@/lib/auth';
import { TilCard } from '@/components/til/til-card';
import { TilStreak } from '@/components/til/til-streak';

export const metadata: Metadata = {
  title: 'TIL 학습기록',
  description: 'AI Engineer 교육과정 사전학습 중 배운 것을 상기하고 핵심을 기록하는 학습기록.',
};

// DB에서 오고 재배포 없이 바뀌므로 동적 렌더(홈/노트와 동일).
export const dynamic = 'force-dynamic';

export default async function TilListPage() {
  const unlocked = await hasUnlockCookie();
  const read = await listPublishedPosts();
  const posts = read.ok ? read.data : [];
  const datesRead = await listPublishedDates();
  const publishedDates = datesRead.ok ? datesRead.data : [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-display font-black">TIL 학습기록</h1>
          <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            배운 것을 내 말로 다시 정리한다.
          </p>
        </div>
        {unlocked ? (
          <Link href="/til/new" className="btn-action tap-feedback min-h-11 text-body">
            새 글 쓰기
          </Link>
        ) : null}
      </header>

      <TilStreak dates={publishedDates} />

      {read.ok ? (
        posts.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {posts.map((post) => (
              <li key={post.id}>
                <TilCard post={post} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            아직 발행한 글이 없어요.
          </p>
        )
      ) : (
        <p className="text-body font-normal">목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      )}
    </main>
  );
}
