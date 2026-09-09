import { notFound } from 'next/navigation';
import { getSeriesBySlug, listPublishedBySeries } from '@/lib/til/store';
import { TilCard } from '@/components/til/til-card';

export const dynamic = 'force-dynamic';

export default async function TilSeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s.ok || !s.data) notFound();
  const posts = await listPublishedBySeries(s.data.id);
  const list = posts.ok ? posts.data : [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <span className="chip w-fit text-label font-bold">시리즈</span>
        <h1 className="text-display font-black break-keep">{s.data.title}</h1>
        {s.data.description ? <p className="text-body font-normal break-keep">{s.data.description}</p> : null}
      </header>
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {list.map((p) => (<li key={p.id}><TilCard post={p} /></li>))}
      </ol>
    </main>
  );
}
