'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

// 글 전체(제목 포함)를 마크다운으로 클립보드에 복사하는 버튼. 서버에서 postToMarkdown으로
// 만든 문자열을 markdown prop으로 받는다. 복사 성공 시 잠깐 "복사됨"으로 바뀐다.
export function TilCopyButton({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 API 실패(비보안 컨텍스트 등) — 폴백: 선택 가능한 프롬프트는 과하니 조용히 무시.
      // 대부분의 배포(HTTPS)에선 문제없다.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="글 전체를 마크다운으로 복사"
      className="chip tap-feedback inline-flex min-h-11 items-center gap-1.5 text-label font-semibold"
    >
      {copied ? (
        <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      {copied ? '복사됨' : '마크다운 복사'}
    </button>
  );
}
