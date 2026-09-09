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
          <span className="text-label font-bold">🔴 아직 막힌 곳</span>
          <p className="text-body font-normal break-keep">{post.blockedPoints}</p>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {post.understanding ? (
          <span className="chip text-label font-semibold">이해도 {post.understanding}/5</span>
        ) : null}
        {post.tags.map((t) => (
          <span key={t} className="chip text-label font-semibold">#{t}</span>
        ))}
      </div>
    </section>
  );
}
