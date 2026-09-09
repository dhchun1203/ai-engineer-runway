import { listPublishedByTag } from '@/lib/til/store';
import { TilCard } from '@/components/til/til-card';

export const dynamic = 'force-dynamic';

export default async function TilTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const read = await listPublishedByTag(decoded);
  const posts = read.ok ? read.data : [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-display font-black break-keep">#{decoded}</h1>
      {posts.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {posts.map((p) => (
            <li key={p.id}><TilCard post={p} /></li>
          ))}
        </ul>
      ) : (
        <p className="text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">이 태그의 글이 없어요.</p>
      )}
    </main>
  );
}
