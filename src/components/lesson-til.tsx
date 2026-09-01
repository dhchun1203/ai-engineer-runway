'use client';

// 완료 영역의 TIL(오늘 배운 것 한 줄) 입력 클라이언트 아일랜드. 서버 전용 모듈은
// import하지 않는다 — props는 직렬화 가능한 스칼라 2개(lessonId, initialTil)뿐이다
// (lesson-notepad.tsx와 같은 원칙).
//
// 자동 저장이 아니라 "저장" 버튼 클릭 시에만 저장한다(quick 260902-0rz) — 코넬 큐
// 한 줄은 메모장처럼 타이핑 중간에 계속 저장할 이유가 없고, 버튼이 곧 "다 썼다"는
// 사용자 신호다.
//
// TIL은 완료 여부와 완전히 독립이다 — 이 컴포넌트는 완료 버튼·완료 상태를 전혀
// 참조하지 않는다. 빈 값 저장도 허용한다(건너뛰기 가능).

import { useState } from 'react';
import { saveLessonTilAction } from '@/app/lesson/[lessonId]/til-actions';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export function LessonTil({
  lessonId,
  initialTil,
}: {
  lessonId: string;
  initialTil: string;
}) {
  const [value, setValue] = useState(initialTil);
  const [status, setStatus] = useState<SaveStatus>('idle');

  // onChange 핸들러는 오직 setValue만 한다 — 값의 길이·문자 종류를 들여다보는
  // 로직을 넣지 않는다(한글 IME 안전, lesson-notepad.tsx 원칙).
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
  }

  async function handleSave() {
    setStatus('saving');
    try {
      await saveLessonTilAction(lessonId, value);
      setStatus('saved');
    } catch {
      // 저장 경로는 어떤 경우에도 setValue를 호출하지 않는다 — 실패해도
      // 입력창의 글은 그대로 남는다.
      setStatus('failed');
    }
  }

  return (
    <div data-til className="panel flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="lesson-til-input" className="text-label font-bold">
          오늘 배운 것 한 줄?
        </label>
        <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          내 말로 한 문장으로 설명하면?
        </p>
      </div>
      <input
        id="lesson-til-input"
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="비워 두고 건너뛰어도 괜찮아요"
        spellCheck={false}
        className="w-full border border-line bg-surface-2 p-3 text-body font-normal text-foreground dark:border-line-dark dark:bg-surface-2-dark dark:text-foreground-dark"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={status === 'saving'}
          aria-busy={status === 'saving'}
          className="btn-action tap-feedback min-h-11 px-4 text-label font-bold"
        >
          저장
        </button>
        <span role="status" aria-live="polite" className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {status === 'saved' ? '저장됨' : ''}
          {status === 'failed' ? '저장하지 못했어요. 방금 쓴 글은 그대로 남아 있어요.' : ''}
        </span>
      </div>
    </div>
  );
}
