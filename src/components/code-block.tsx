'use client';

// 코드블록 복사 버튼 — 실제로 동작하는 React 핸들러 버전.
//
// 이전 구현은 velite.config.ts의 transformerCopyButton이었는데, 그 트랜스포머는
// 인라인 onclick을 *문자열*로 내보낸다. Velite가 컴파일한 MDX는 React 엘리먼트로
// 렌더되므로 React가 문자열 이벤트 핸들러를 거부하고("Expected onClick listener to
// be a function, instead got a value of string type") 내부 noop을 대신 붙인다 —
// 즉 버튼은 멀쩡해 보이지만 클립보드에 아무것도 쓰지 않았다. 레슨 전체에서 44곳,
// 페이지당 콘솔 에러 1개/코드블록 (04-UI-REVIEW Priority Fix 1).
//
// 버튼을 <pre> 안이 아니라 position:relative 래퍼에 두는 이유: <pre>는
// overflow-x:auto라서 그 안에 절대 위치로 띄우면 긴 코드를 가로 스크롤할 때
// 버튼이 코드와 함께 밀려 나간다. 래퍼에 두면 <pre>만 스크롤한다.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { Check, Copy } from 'lucide-react';

const FEEDBACK_MS = 2_000;

export function CodeBlock({ children, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const preRef = useRef<HTMLPreElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    const pre = preRef.current;
    if (!pre) return;

    // rehype-pretty-code는 줄마다 [data-line]을 붙인다. 줄 단위로 textContent를
    // 모아야 줄바꿈이 정확히 살아난다 — innerText는 code의 display:grid 렌더링에
    // 의존하므로 폴백으로만 쓴다.
    const lines = pre.querySelectorAll('[data-line]');
    const text =
      lines.length > 0
        ? Array.from(lines, (line) => line.textContent ?? '').join('\n')
        : (pre.innerText ?? '');

    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      // 사용자 제스처 안에서 곧바로 호출한다 — 앞에 await를 끼우면 iPad Safari가
      // 제스처 컨텍스트를 잃고 거부한다.
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }

    timerRef.current = setTimeout(() => setState('idle'), FEEDBACK_MS);
  }, []);

  const label =
    state === 'copied' ? '코드를 복사했어요' : state === 'failed' ? '복사하지 못했어요' : '코드 복사';

  return (
    <div data-code-block className="relative">
      <pre {...props} ref={preRef}>
        {children}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        data-copy-state={state}
        // hover가 없는 아이패드에서도 항상 보여야 한다(기존 visibility:"always"와 동등).
        className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-lg border"
        aria-label={label}
      >
        {state === 'copied' ? (
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
      </button>
      {/* 성공/실패를 시각(아이콘) 말고 보조기술에도 알린다. */}
      <span role="status" aria-live="polite" className="sr-only">
        {state === 'idle' ? '' : label}
      </span>
    </div>
  );
}
