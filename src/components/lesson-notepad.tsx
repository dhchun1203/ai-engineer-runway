'use client';

// 레슨당 메모 1개를 자동 저장하는 하단 시트 클라이언트 아일랜드. 서버 전용 모듈
// (note-store, supabase/admin)은 import하지 않는다 — props는 직렬화 가능한 스칼라
// 2개(lessonId, initialBody)뿐이다. 옥스포드 노트 표면(괘선/여백선, .note-paper)과
// 시트 기하(.note-sheet/.note-handle/.note-sheet-panel)는 globals.css의
// --note-line-height 단일 소스를 소비한다(G-06-9 재발 방지, Task 2).
//
// 08-03(D8-H): 이 컴포넌트는 메모(GET /api/progress?lesson=<slug>의 응답)가
// 도착한 뒤에만 마운트된다 — LessonNoteSlot이 로딩 중에는 <NotepadSkeleton>을
// 대신 렌더한다. initialBody를 나중에 다른 값으로 갈아끼우지 않는다 — 그 형태는
// lastSavedRef/valueRef의 초기값과 어긋나 빈 값 자동 저장 경로를 남긴다.

import { useEffect, useId, useRef, useState } from 'react';
import { saveLessonNoteAction } from '@/app/lesson/[lessonId]/note-actions';

// 근거: 800ms 아래는 한글 어절 사이 자연스러운 멈춤마다 저장이 걸려 요청이
// 잘게 쪼개지고, 1500ms 위는 탭을 갑자기 닫았을 때 잃는 꼬리가 길어진다.
const SAVE_DEBOUNCE_MS = 1000;

// 키보드로 인정할 최소 높이. 아이패드 화면 키보드는 250px을 넘고, Safari 하단
// 툴바는 60px 미만이라 그 사이 어디를 잘라도 되지만 여유를 두어 120px로 둔다.
const KEYBOARD_MIN_INSET_PX = 120;

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

  // 아이패드 Safari 키보드 보정(R-1~R-3). env(keyboard-inset-height)와 viewport
  // meta의 interactive-widget은 iOS/iPadOS WebKit에서 지원되지 않아 항상 폴백값
  // 0px로 해석된다 — window.visualViewport가 유일하게 실제로 동작하는 메커니즘이다.
  // visualViewport가 없으면(구형 브라우저) 조용히 아무것도 하지 않고 기본 fixed
  // 동작을 유지한다(점진적 향상).
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const root = document.documentElement;

    // TypeScript는 nested function 안에서 바깥 const의 null 내로잉을 유지하지
    // 않는다 — 위에서 이미 !vv로 반환했으므로 안전한 재단언이다.
    function sync() {
      const viewport = vv as VisualViewport;
      root.style.setProperty('--note-visible-height', `${viewport.height}px`);

      // clientHeight와 visualViewport.height의 차이는 키보드만 만드는 게 아니다.
      // 아이패드 Safari는 하단 툴바가 보이는 동안에도 키보드 없이 40~50px 차이를
      // 만든다. 그 차이를 그대로 보정하면 시트가 그만큼 떠올라 화면 최하단에 틈이
      // 생기고, 스크롤할 때 그 틈으로 본문이 지나간다(실기기에서 확인된 결함).
      // PC에는 그런 툴바가 없어 차이가 0이라 재현되지 않았다.
      //
      // 그래서 두 조건을 모두 만족할 때만 보정한다:
      //   (1) 이 시트 안의 입력 요소에 포커스가 있다 — 포커스 없이는 키보드가 뜰 수 없다
      //   (2) 차이가 키보드 크기다 — 아이패드 키보드는 250px 이상, 툴바는 60px 미만이라
      //       120px 임계값이 둘을 안전하게 가른다
      const active = document.activeElement;
      const typingHere =
        active instanceof HTMLElement &&
        (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT') &&
        active.closest('.note-sheet') !== null;
      const raw = Math.max(0, root.clientHeight - (viewport.height + viewport.offsetTop));
      const inset = typingHere && raw >= KEYBOARD_MIN_INSET_PX ? raw : 0;
      root.style.setProperty('--note-keyboard-inset', `${inset}px`);
    }

    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    // 포커스 전환만으로는 visualViewport 이벤트가 보장되지 않는다 — 포커스를 잃는
    // 순간 보정을 0으로 되돌리기 위해 직접 듣는다.
    document.addEventListener('focusin', sync);
    document.addEventListener('focusout', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
      document.removeEventListener('focusin', sync);
      document.removeEventListener('focusout', sync);
      root.style.removeProperty('--note-visible-height');
      root.style.removeProperty('--note-keyboard-inset');
    };
  }, []);

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
    <div data-notepad className="note-sheet flex flex-col">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={handleToggle}
        className="note-handle tap-feedback flex w-full items-center justify-center gap-2 text-label font-semibold"
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
        className="note-sheet-panel flex flex-col overflow-hidden px-4"
        style={{ height: open ? 'var(--note-sheet-open-height)' : '0px' }}
        inert={!open}
      >
        <textarea
          data-notepad-input
          value={value}
          onChange={handleChange}
          onBlur={() => void flush()}
          aria-label="레슨 메모"
          // 맞춤법 검사 밑줄을 끈다. 이 메모는 기술 용어(서브쿼리·리랭킹·임베딩
          // 등)와 코드 조각이 대부분이라 브라우저 사전에 없는 낱말이 계속 걸리고,
          // 빨간 물결선이 괘선 위에 깔려 노트 표면이 지저분해진다.
          spellCheck={false}
          className="note-paper flex-1"
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
