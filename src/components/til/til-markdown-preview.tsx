'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * 에디터 실시간 미리보기용 클라이언트 마크다운 렌더러.
 * 최종 발행물은 서버(MDX + Shiki) 파이프라인이 정확히 렌더한다 — 여기서는
 * 상세 페이지와 같은 .prose 스타일로 근사치를 보여주는 게 목적이다(Velog도 동일).
 */
export function TilMarkdownPreview({ markdown }: { markdown: string }) {
  const trimmed = markdown.trim();

  if (!trimmed) {
    return (
      <p className="text-body font-normal text-muted dark:text-muted-dark">
        왼쪽에 쓰면 여기에 바로 보여요.
      </p>
    );
  }

  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 외부 스토리지 URL이라 next/image 대신 img로 단순화(til-card·상세와 동일 판단).
          // eslint-disable-next-line @next/next/no-img-element
          img: (props) => <img {...props} alt={props.alt ?? ''} />,
        }}
      >
        {trimmed}
      </ReactMarkdown>
    </div>
  );
}
