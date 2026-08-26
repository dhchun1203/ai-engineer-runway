'use client';

// 레슨당 메모 1개를 자동 저장하는 하단 시트 클라이언트 아일랜드. 서버 전용 모듈
// (note-store, supabase/admin)은 import하지 않는다 — props는 직렬화 가능한 스칼라
// 2개(lessonId, initialBody)뿐이다. 옥스포드 노트 표면(괘선/여백선)과 아이패드
// 키보드 보정은 Task 2가 이 파일을 편집해 덧붙인다 — 이 버전은 기존 토큰만으로
// 배포 가능한 최소 형태다(Task 1 tracer).

import { useEffect, useId, useRef, useState } from 'react';
import { saveLessonNoteAction } from '@/app/lesson/[lessonId]/note-actions';

// 근거: 800ms 아래는 한글 어절 사이 자연스러운 멈춤마다 저장이 걸려 요청이
// 잘게 쪼개지고, 1500ms 위는 탭을 갑자기 닫았을 때 잃는 꼬리가 길어진다.
const SAVE_DEBOUNCE_MS = 1000;

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export function LessonNotepad({
  lessonId,
  initialBody,
}: {
  lessonId: string;
  initialBody: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialBody);
  const [status, setStatus] = useState<SaveStatus>('idle');

  // 마지막으로 성공 저장된 문자열 — flush 시점에 이 값과 같으면 저장을 건너뛴다.
  const lastSavedRef = useRef(initialBody);
  // 디바운스 타이머가 만료될 때 최신 값을 읽기 위한 참조(클로저 갱신 문제 회피).
  const valueRef = useRef(initialBody);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const mountedRef = useRef(true);
  const panelId = useId();

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function flush() {
    const current = valueRef.current;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (current === lastSavedRef.current) return;
    if (mountedRef.current) setStatus('saving');
    try {
      await saveLessonNoteAction(lessonId, current);
      lastSavedRef.current = current;
      if (mountedRef.current) setStatus('saved');
    } catch {
      // 저장 경로는 어떤 경우에도 setValue를 호출하지 않는다 — 실패해도
      // textarea의 글은 그대로 남는다.
      if (mountedRef.current) setStatus('failed');
    }
  }

  // onChange 핸들러는 오직 setValue와 타이머 재장전만 한다. 값의 길이·문자
  // 종류·조합 여부를 들여다보는 로직을 여기에 절대 넣지 않는다(한글 IME 안전).
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flush();
    }, SAVE_DEBOUNCE_MS);
  }

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') void flush();
    }
    function handlePageHide() {
      void flush();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // 이 아일랜드는 레슨마다 리마운트되므로 사실상 마운트 시 1회다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  function handleToggle() {
    setOpen((prev) => !prev);
  }

  // Escape로 닫고 포커스를 토글 버튼으로 되돌린다. 포커스 트랩은 만들지
  // 않는다 — Tab으로 시트 밖으로 나갈 수 있어야 한다.
  function handlePanelKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      toggleRef.current?.focus();
    }
  }

  // 글자 수 목표·독려 문구 없음(D-6) — 점 하나로만 "메모가 있다"만 표시한다.
  const hasContent = value.trim().length > 0;

  return (
    <div
      data-notepad
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col border-t border-badge-neutral-bg bg-surface dark:border-badge-neutral-bg-dark dark:bg-surface-dark"
    >
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={handleToggle}
        className="flex min-h-11 w-full items-center justify-center gap-2 text-label font-semibold"
      >
        <span>{open ? '메모 닫기' : '메모'}</span>
        {hasContent ? (
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-accent-dark"
          />
        ) : null}
      </button>
      <div
        id={panelId}
        data-notepad-panel
        onKeyDown={handlePanelKeyDown}
        className="flex flex-col overflow-hidden px-4"
        style={{ height: open ? '40vh' : '0px' }}
        inert={!open}
      >
        <textarea
          data-notepad-input
          value={value}
          onChange={handleChange}
          onBlur={() => void flush()}
          aria-label="레슨 메모"
          className="w-full flex-1 resize-none border-0 bg-transparent text-body outline-none"
        />
        <div
          data-notepad-status={status}
          className="flex items-center gap-2 pb-4 text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark"
        >
          {/* saving 중간 상태는 라이브 영역 밖에서 aria-hidden으로 조용히
              표시한다 — 키 입력마다 스크린리더가 떠들지 않게 한다. */}
          <span aria-hidden="true">{status === 'saving' ? '저장 중…' : ''}</span>
          {/* 저장이 끝난 상태(저장됨 / 저장하지 못했어요)만 라이브 영역에 담는다. */}
          <span role="status" aria-live="polite">
            {status === 'saved' ? '저장됨' : ''}
            {status === 'failed' ? '저장하지 못했어요. 방금 쓴 글은 그대로 남아 있어요.' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
