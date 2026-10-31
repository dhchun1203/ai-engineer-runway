'use client';

// 따라 치기 칸. 안에 든 코드 블록의 복사 버튼을 숨기고 "직접 치기" 라벨로 바꾼다.
// 파이썬 손풀기의 원칙(복사하지 말고 손으로 치기)을 화면에서 지키는 장치다.
// code-block.tsx가 이 컨텍스트를 읽는다.

import { createContext, useContext, type ReactNode } from 'react';

const NoCopyContext = createContext(false);

export function useNoCopy(): boolean {
  return useContext(NoCopyContext);
}

export function TypeAlong({ children }: { children: ReactNode }) {
  return <NoCopyContext.Provider value>{children}</NoCopyContext.Provider>;
}
