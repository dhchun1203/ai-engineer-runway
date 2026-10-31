'use client';

// 고쳐 치기 힌트. 처음엔 모두 닫혀 있고, 버튼을 누를 때마다 다음 힌트가 하나씩 열린다.
// 막혔을 때 정답 전체가 아니라 다음 한 걸음만 보게 하는 장치다.

import { Children, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export function Hint({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Hints({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const [open, setOpen] = useState(0);

  return (
    <div className="not-prose panel my-6 flex flex-col gap-3 p-4">
      {items.slice(0, open).map((item, i) => (
        <div key={i} className="flex flex-col gap-1">
          <span className="text-label font-bold text-accent dark:text-accent-dark">힌트 {i + 1}</span>
          <div className="prose dark:prose-invert max-w-none">{item}</div>
        </div>
      ))}
      {open < items.length ? (
        <button
          type="button"
          onClick={() => setOpen((n) => n + 1)}
          className="tap-feedback flex min-h-11 w-fit items-center gap-1.5 text-label font-bold"
        >
          <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
          {open === 0 ? '힌트 보기' : `다음 힌트 (${open + 1}/${items.length})`}
        </button>
      ) : (
        <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          힌트를 모두 열었어요.
        </span>
      )}
    </div>
  );
}
