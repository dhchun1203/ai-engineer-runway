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

// rehype-pretty-code가 <pre>에 붙이는 data-language(예: "typescript")를 헤더에 보여줄
// 사람용 라벨로 바꾼다. 축약어(ts)가 아니라 풀어 쓴 이름이 학습자에게 더 친절하다.
// 목록에 없는 언어는 원문을 대문자로(예: "kotlin" -> "KOTLIN") 그대로 쓴다.
// 값이 ''인 것(text/plaintext)은 라벨을 숨긴다 — 출력·평문 블록에 언어 딱지는 소음이다.
const LANGUAGE_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  tsx: 'TSX',
  jsx: 'JSX',
  python: 'Python',
  py: 'Python',
  sql: 'SQL',
  bash: 'Shell',
  sh: 'Shell',
  shell: 'Shell',
  'shell-session': 'Shell',
  powershell: 'PowerShell',
  ps1: 'PowerShell',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  html: 'HTML',
  css: 'CSS',
  text: '',
  plaintext: '',
  txt: '',
};

function languageLabel(props: Record<string, unknown>): string {
  const raw = props['data-language'];
  if (typeof raw !== 'string' || raw.length === 0) return '';
  return raw in LANGUAGE_LABELS ? LANGUAGE_LABELS[raw] : raw.toUpperCase();
}

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
  const lang = languageLabel(props as Record<string, unknown>);

  // 상단 크롬 바(헤더)에 언어 라벨과 복사 버튼을 나란히 둔다. 버튼을 <pre> 안이나
  // 그 위에 절대 위치로 띄우지 않고 헤더(스크롤되지 않는 형제)에 두므로, 긴 코드를
  // 가로 스크롤해도 버튼이 밀려나지 않고 코드 첫 줄을 가리지도 않는다.
  return (
    <div data-code-block>
      <div data-code-header>
        <span data-code-lang>{lang}</span>
        <button
          type="button"
          onClick={handleCopy}
          data-copy-state={state}
          // hover가 없는 아이패드에서도 항상 보여야 한다(기존 visibility:"always"와 동등).
          className="tap-feedback flex h-11 w-11 items-center justify-center"
          aria-label={label}
        >
          {state === 'copied' ? (
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
        </button>
      </div>
      <pre {...props} ref={preRef}>
        {children}
      </pre>
      {/* 성공/실패를 시각(아이콘) 말고 보조기술에도 알린다. */}
      <span role="status" aria-live="polite" className="sr-only">
        {state === 'idle' ? '' : label}
      </span>
    </div>
  );
}
