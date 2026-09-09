import { redirect, notFound } from 'next/navigation';
import { hasUnlockCookie } from '@/lib/auth';
import { getPostBySlugAnyStatus, listSeries } from '@/lib/til/store';
import { TilEditor } from '@/components/til/til-editor';

export const dynamic = 'force-dynamic';

export default async function TilEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!(await hasUnlockCookie())) redirect('/login');
  const { slug } = await params;
  const read = await getPostBySlugAnyStatus(slug);
  if (!read.ok || !read.data) notFound();
  const seriesRead = await listSeries();
  const allSeries = seriesRead.ok ? seriesRead.data : [];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <TilEditor mode="edit" post={read.data} allSeries={allSeries} />
    </main>
  );
}
