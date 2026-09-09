import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedPostBySlug, getPostBySlugAnyStatus } from '@/lib/til/store';
import { hasUnlockCookie } from '@/lib/auth';
import { MDXContent } from '@/components/mdx-content';
import { TilMeta } from '@/components/til/til-meta';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const read = await getPublishedPostBySlug(slug);
  const title = read.ok && read.data ? read.data.title : 'TIL';
  return { title, description: read.ok && read.data ? (read.data.summary ?? undefined) : undefined };
}

export default async function TilDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const unlocked = await hasUnlockCookie();

  // 공개 발행글 우선. 없고 소유자면 초고/미발행도 미리보기 허용.
  const pub = await getPublishedPostBySlug(slug);
  let post = pub.ok ? pub.data : null;
  let isDraftPreview = false;
  if (!post && unlocked) {
    const any = await getPostBySlugAnyStatus(slug);
    if (any.ok && any.data) {
      post = any.data;
      isDraftPreview = any.data.status !== 'published';
    }
  }
  if (!post) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        {isDraftPreview ? (
          <span className="chip-solid w-fit text-label font-bold">초고 미리보기</span>
        ) : null}
        <h1 className="text-display font-black break-keep">{post.title}</h1>
        {post.summary ? (
          <p className="text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark break-keep">
            {post.summary}
          </p>
        ) : null}
        {unlocked ? (
          <Link href={`/til/${post.slug}/edit`} className="text-label font-bold text-accent dark:text-accent-dark">
            편집
          </Link>
        ) : null}
      </header>

      <article className="prose prose-slate max-w-none dark:prose-invert">
        <MDXContent code={post.bodyCode} />
      </article>

      <TilMeta post={post} />
    </main>
  );
}
