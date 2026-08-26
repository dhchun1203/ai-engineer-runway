'use client';

// lessonId + 저장된 필사 기록을 컨텍스트로 내려주는 프로바이더. DOM 요소를
// 만들지 않는다 — Context.Provider만 children을 감싸며, #lesson-article의
// 기하가 조금이라도 바뀌면 e2e-section-tape.mjs(G-06-9 재발 방지 게이트)가
// 깨진다.
//
// ClozeBlank는 useContext 기본값 null을 그대로 허용한다 — 프로바이더가 없으면
// Task 1과 동일한 휘발성 동작이다. /about 페이지와 잠금 상태(enabled=false)가
// 이 경로를 탄다.
//
// 초기 상태 적용은 blankId = `${lessonId}#${index}`로 찾은 기록의 answerHash가
// 자기 hash prop과 일치할 때만 한다(DD-7, 본문 수정 내성) — 불일치는 기록
// 없음으로 취급해 다시 빈칸으로 보이게 한다.

import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { recordClozeAnswer } from '@/app/lesson/[lessonId]/actions';
import type { ClozeAnswerRecord } from '@/lib/cloze-store';

type ClozeSaveStatus = 'correct' | 'revealed';

type ClozeContextValue = {
  enabled: boolean;
  getInitialState: (index: string, hash: string) => ClozeSaveStatus | null;
  save: (index: string, hash: string, status: ClozeSaveStatus) => Promise<boolean>;
};

const ClozeContext = createContext<ClozeContextValue | null>(null);

export function useClozeContext(): ClozeContextValue | null {
  return useContext(ClozeContext);
}

export function ClozeProvider({
  lessonId,
  records,
  enabled,
  children,
}: {
  lessonId: string;
  records: Record<string, ClozeAnswerRecord> | null;
  enabled: boolean;
  children: ReactNode;
}) {
  const getInitialState = useCallback(
    (index: string, hash: string): ClozeSaveStatus | null => {
      if (!records) return null;
      const record = records[`${lessonId}#${index}`];
      if (!record) return null;
      // DD-7: blank_id가 같아도 answer_hash가 현재 빈칸의 hash와 다르면
      // 그 기록은 없는 것으로 취급한다 — 본문 수정으로 순번·정답이 밀린
      // 옛 기록이 다른 용어의 정답으로 잘못 표시되는 일을 구조적으로 막는다.
      if (record.answerHash !== hash) return null;
      return record.status;
    },
    [lessonId, records],
  );

  // 저장 실패는 조용히 표시만 남긴다(DD-9) — 여기서는 Server Action 호출
  // 결과를 boolean으로만 알려주고, 오류 배너/모달은 호출부(cloze-blank.tsx)도
  // 만들지 않는다.
  const save = useCallback(
    async (index: string, hash: string, status: ClozeSaveStatus): Promise<boolean> => {
      try {
        await recordClozeAnswer(lessonId, index, hash, status);
        return true;
      } catch {
        return false;
      }
    },
    [lessonId],
  );

  const value = useMemo(
    () => ({ enabled, getInitialState, save }),
    [enabled, getInitialState, save],
  );

  return <ClozeContext.Provider value={value}>{children}</ClozeContext.Provider>;
}
