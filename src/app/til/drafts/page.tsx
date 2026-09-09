import Link from 'next/link';
import { redirect } from 'next/navigation';
import { hasUnlockCookie } from '@/lib/auth';
import { listDraftPosts } from '@/lib/til/store';

export const dynamic = 'force-dynamic';

export default async function TilDraftsPage() {
  if (!(await hasUnlockCookie())) redirect('/login');
  const read = await listDraftPosts();
  const drafts = read.ok ? read.data : [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-display font-black">초고함</h1>
      {drafts.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {drafts.map((d) => (
            <li key={d.id}>
              <Link href={`/til/${d.slug}/edit`} className="panel flex min-h-11 flex-col gap-1 p-4">
                <span className="text-body font-extrabold break-keep">{d.title || '(제목 없음)'}</span>
                <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  마지막 수정 {d.updatedAt.slice(0, 10)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">초고가 없어요.</p>
      )}
    </main>
  );
}
