import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getPublishedPostBySlug, getPostBySlugAnyStatus } from '@/lib/til/store';
import { hasUnlockCookie } from '@/lib/auth';
import { MDXContent } from '@/components/mdx-content';
import { TilMeta } from '@/components/til/til-meta';
import { TilCopyButton } from '@/components/til/til-copy-button';
import { postToMarkdown } from '@/lib/til/markdown';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  // Next 16은 라우트 param을 URL 인코딩된 채로 넘긴다 — 한글 slug가 %XX로 오므로
  // 반드시 디코드한다(이미 디코드된 ASCII엔 무해). 태그 페이지와 같은 처리.
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const read = await getPublishedPostBySlug(decoded);
  const title = read.ok && read.data ? read.data.title : 'TIL';
  return { title, description: read.ok && read.data ? (read.data.summary ?? undefined) : undefined };
}

export default async function TilDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next 16은 param을 URL 인코딩된 채로 넘기므로 한글 slug를 디코드한다(태그 페이지와 동일).
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const unlocked = await hasUnlockCookie();

  // 공개 발행글 우선. 없고 소유자면 초고/미발행도 미리보기 허용.
  const pub = await getPublishedPostBySlug(decoded);
  let post = pub.ok ? pub.data : null;
  let isDraftPreview = false;
  if (!post && unlocked) {
    const any = await getPostBySlugAnyStatus(decoded);
    if (any.ok && any.data) {
      post = any.data;
      isDraftPreview = any.data.status !== 'published';
    }
  }
  if (!post) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        {/* 상단 줄: 왼쪽은 목록으로 돌아가기, 오른쪽은 마크다운 복사와 (소유자면) 편집. */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/til"
            data-print-hide
            className="nav-link tap-feedback flex w-fit min-h-11 items-center gap-1.5 text-label font-bold text-muted dark:text-muted-dark"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            TIL 목록
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <TilCopyButton markdown={postToMarkdown(post)} />
            {unlocked ? (
              <Link
                href={`/til/${post.slug}/edit`}
                className="btn tap-feedback text-label"
              >
                편집
              </Link>
            ) : null}
          </div>
        </div>
        {post.publishedAt ? (
          <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            {new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date(post.publishedAt))}
          </span>
        ) : null}
        {isDraftPreview ? (
          <span className="chip-solid w-fit text-label font-bold">초고 미리보기</span>
        ) : null}
        <h1 className="text-display font-black break-keep">{post.title}</h1>
        {post.summary ? (
          <p className="text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark break-keep">
            {post.summary}
          </p>
        ) : null}
      </header>

      <article className="prose prose-slate max-w-none dark:prose-invert">
        {post.bodyCode ? (
          <MDXContent code={post.bodyCode} />
        ) : (
          <p className="text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            본문이 아직 없어요.
          </p>
        )}
      </article>

      <TilMeta post={post} />

      <nav aria-label="TIL 목록으로" data-print-hide className="hairline pt-6">
        <Link
          href="/til"
          className="card-interactive panel flex min-h-11 items-center gap-2 p-4 text-body font-bold"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          TIL 전체 보기
        </Link>
      </nav>
    </main>
  );
}
