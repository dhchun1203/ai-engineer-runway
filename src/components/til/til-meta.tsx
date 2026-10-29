import Link from 'next/link';
import { CircleAlert } from 'lucide-react';
import type { TilPost } from '@/lib/til/types';

export function TilMeta({ post }: { post: TilPost }) {
  return (
    <section className="flex flex-col gap-4 border-t-2 border-line pt-6 dark:border-line-dark">
      {post.selfCheck ? (
        <div className="panel flex flex-col gap-1 p-4">
          <span className="text-label font-bold">셀프 체크 질문</span>
          <p className="text-body font-normal break-keep">{post.selfCheck}</p>
        </div>
      ) : null}
      {post.blockedPoints ? (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-label font-bold">
            <CircleAlert className="h-4 w-4 shrink-0 text-destructive dark:text-destructive-dark" aria-hidden="true" />
            아직 막힌 곳
          </span>
          <p className="text-body font-normal break-keep">{post.blockedPoints}</p>
        </div>
      ) : null}
      {/* 목록 카드(til-card)와 같은 배치: 태그 칩이 먼저, 이해도는 칩 없이 흐린 글자로.
          태그 링크는 44px 터치 영역을 바깥 Link가 갖고, 보이는 칩은 이해도 줄과 같은 높이로 둔다. */}
      <div className="flex flex-wrap items-center gap-x-2">
        {post.tags.map((t) => (
          <Link
            key={t}
            href={`/til/tags/${encodeURIComponent(t)}`}
            className="tap-feedback inline-flex min-h-11 items-center"
          >
            <span className="chip text-label font-semibold">#{t}</span>
          </Link>
        ))}
        {post.understanding ? (
          <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            이해도 {post.understanding}/5
          </span>
        ) : null}
      </div>
    </section>
  );
}
