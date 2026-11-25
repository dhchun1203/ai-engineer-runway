'use client';

// 따라 치기 칸. 안에 든 코드 블록의 복사 버튼을 숨기고 "직접 치기" 라벨로 바꾼다.
// 파이썬 손풀기의 원칙(복사하지 말고 손으로 치기)을 화면에서 지키는 장치다.
// code-block.tsx가 이 컨텍스트를 읽는다.
//
// 2026-11-25: 시작 코드(어제 코드)와 비교해 바뀐 줄을 GitHub처럼 표시한다. 줄 표시는 빌드 때
// src/lib/remark-type-along-diff.ts가 붙이고(added, removed 속성과 줄마다
// data-highlighted-line-id="add" | "del"), 여기서는 범례와 표시 끄고 켜기만 맡는다.
// 끄면 지울 줄이 숨고 초록 바탕이 빠져, 완성된 코드만 깨끗하게 보인다.

import { createContext, useContext, useState, type ReactNode } from 'react';

const NoCopyContext = createContext(false);

export function useNoCopy(): boolean {
  return useContext(NoCopyContext);
}

type Props = { children: ReactNode; added?: string; removed?: string };

export function TypeAlong({ children, added, removed }: Props) {
  const [showDiff, setShowDiff] = useState(true);
  const hasDiff = added !== undefined || removed !== undefined;

  return (
    <NoCopyContext.Provider value>
      <div data-type-along data-diff-on={hasDiff && showDiff ? '' : undefined}>
        {hasDiff && (
          <div className="not-prose mt-6 -mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="text-label leading-relaxed">
              어제 코드와 비교:{' '}
              <span data-diff-chip="add" className="font-mono font-bold">
                +{added ?? 0}
              </span>{' '}
              새로 치거나 바꿀 줄,{' '}
              <span data-diff-chip="del" className="font-mono font-bold">
                -{removed ?? 0}
              </span>{' '}
              지울 줄
            </p>
            <button
              type="button"
              onClick={() => setShowDiff((v) => !v)}
              aria-pressed={showDiff}
              className="tap-feedback btn min-h-11 px-3 text-label font-semibold"
            >
              {showDiff ? '완성 코드만 보기' : '바뀐 줄 표시'}
            </button>
          </div>
        )}
        {children}
      </div>
    </NoCopyContext.Provider>
  );
}
