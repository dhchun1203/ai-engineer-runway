import Link from 'next/link';
import type { TilPost } from '@/lib/til/types';

export function TilCard({ post }: { post: TilPost }) {
  return (
    <Link href={`/til/${post.slug}`} className="panel flex flex-col gap-2 p-4 sm:p-5">
      {post.coverImageUrl ? (
        // eslint 규칙상 next/image 권장이나, 외부 스토리지 URL이라 img로 단순화.
        // 목록 성능이 문제되면 next/image로 교체.
        <img src={post.coverImageUrl} alt="" className="mb-1 aspect-[16/9] w-full rounded object-cover" />
      ) : null}
      <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
        {(post.publishedAt ?? post.createdAt).slice(0, 10)}
      </span>
      <span className="text-body font-extrabold break-keep">{post.title}</span>
      {post.summary ? (
        <span className="text-label font-normal leading-relaxed break-keep">{post.summary}</span>
      ) : null}
      <span className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {post.tags.map((t) => (
          <span key={t} className="chip text-label font-semibold">#{t}</span>
        ))}
        {post.understanding ? (
          <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            이해도 {post.understanding}/5
          </span>
        ) : null}
      </span>
    </Link>
  );
}
