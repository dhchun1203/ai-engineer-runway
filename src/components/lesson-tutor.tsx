'use client';

// 학습도우미 — 레슨 페이지에 떠 있는 과외선생님 (quick 260829-t8k).
//
// 화면 오른쪽 가장자리에 아이콘 하나가 둥둥 떠 있고, 누르면 그 자리에서 대화창이
// 펼쳐진다. 레슨을 떠나지 않고 지금 읽던 대목을 그대로 물어볼 수 있는 것이 이
// 기능의 전부이자 이유다 — claude.ai를 따로 켜면 "내가 뭘 읽고 있는지"를 매번
// 다시 설명해야 한다.
//
// 본문을 가리지 않게 하는 방법이 두 가지다(globals.css .tutor-panel 주석 참고):
// 1024px 이상에서는 본문에 오른쪽 여백을 줘서 실제로 비켜서게 하고, 그보다 좁은
// 화면에서는 투명도 슬라이더가 그 역할을 대신한다.
//
// 크기·투명도는 localStorage에 남는다 — 매번 다시 맞추게 하지 않는다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { GraduationCap, X, Trash2, SendHorizonal } from 'lucide-react';
import type { TutorMessage } from '@/lib/tutor-store';

const STORAGE_KEY = 'tutor-panel';

const DEFAULT_WIDTH = 380;
const DEFAULT_HEIGHT = 520;
const DEFAULT_OPACITY = 1;

const MIN_WIDTH = 280;
const MAX_WIDTH = 720;
const MIN_HEIGHT = 260;
// 투명도 하한 — 0으로 내려가 창을 잃어버리는 일이 없게 한다.
const MIN_OPACITY = 0.35;

// 처음 열었을 때 무엇을 물어야 할지 막막하지 않도록 두는 시작 버튼들.
// 레슨 내용과 무관한 일반 문구라 어느 레슨에서나 말이 된다.
const STARTERS = [
  '이 레슨을 세 문장으로 요약해줘',
  '방금 부분을 더 쉽게 설명해줘',
  '실무에서 쓰는 예시를 하나만 더',
  '내가 이해한 게 맞는지 확인해줘',
] as const;

type Stored = { width: number; height: number; opacity: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readStored(): Stored {
  const fallback = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, opacity: DEFAULT_OPACITY };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    return {
      width: typeof parsed.width === 'number' ? parsed.width : DEFAULT_WIDTH,
      height: typeof parsed.height === 'number' ? parsed.height : DEFAULT_HEIGHT,
      opacity: typeof parsed.opacity === 'number' ? parsed.opacity : DEFAULT_OPACITY,
    };
  } catch {
    return fallback;
  }
}

export function LessonTutor({ lessonId }: { lessonId: string }) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<Stored>({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    opacity: DEFAULT_OPACITY,
  });
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [partial, setPartial] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // 열려 있는 동안에만 본문을 밀어낸다. 닫으면 0으로 되돌린다.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--tutor-inset', open ? `${size.width}px` : '0px');
    return () => {
      root.style.setProperty('--tutor-inset', '0px');
    };
  }, [open, size.width]);

  const persist = useCallback((next: Stored) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // 저장 실패는 조용히 넘긴다 — 크기 기억은 편의지 기능이 아니다.
    }
  }, []);

  // 대화 불러오기 — 처음 열 때 한 번.
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!open || loadedRef.current) return;
    loadedRef.current = true;
    const controller = new AbortController();
    fetch(`/api/tutor?lesson=${encodeURIComponent(lessonId)}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then((res) => res.json() as Promise<{ ok: boolean; messages: TutorMessage[] }>)
      .then((data) => {
        if (controller.signal.aborted) return;
        if (data.ok && Array.isArray(data.messages)) setMessages(data.messages);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setNotice('이전 대화를 불러오지 못했어요.');
      });
    return () => controller.abort();
  }, [open, lessonId]);

  // 새 내용이 붙으면 항상 아래로 따라간다.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, partial, open]);

  async function send(text: string) {
    const question = text.trim();
    if (question.length === 0 || streaming) return;

    setDraft('');
    setNotice(null);
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setStreaming(true);
    setPartial('');

    let answer = '';
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson: lessonId, message: question }),
      });

      if (!res.ok || !res.body) {
        setNotice(
          res.status === 503
            ? '선생님을 부를 수 없어요 — 서버에 API 키가 설정되지 않았습니다.'
            : '답변을 받지 못했어요. 잠시 후 다시 물어봐 주세요.',
        );
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setPartial(answer);
      }
    } catch {
      setNotice('답변을 받지 못했어요. 잠시 후 다시 물어봐 주세요.');
    } finally {
      if (answer.length > 0) {
        setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
      }
      setPartial('');
      setStreaming(false);
    }
  }

  async function handleClear() {
    setMessages([]);
    setPartial('');
    setNotice(null);
    try {
      await fetch(`/api/tutor?lesson=${encodeURIComponent(lessonId)}`, { method: 'DELETE' });
    } catch {
      setNotice('대화를 지우지 못했어요.');
    }
  }

  // 크기 조절 — 왼쪽 손잡이는 폭, 위 손잡이는 높이. 포인터 이벤트라 마우스와
  // 터치가 같은 코드로 동작한다.
  function startResize(axis: 'x' | 'y') {
    return (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = size.width;
      const startHeight = size.height;

      const onMove = (ev: PointerEvent) => {
        setSize((prev) =>
          axis === 'x'
            ? {
                ...prev,
                // 왼쪽으로 끌수록 넓어진다 — 패널이 오른쪽에 붙어 있어 부호가 반대다.
                width: clamp(
                  startWidth + (startX - ev.clientX),
                  MIN_WIDTH,
                  Math.min(MAX_WIDTH, window.innerWidth - 24),
                ),
              }
            : {
                ...prev,
                height: clamp(startHeight + (startY - ev.clientY), MIN_HEIGHT, window.innerHeight - 96),
              },
        );
      };

      const onUp = () => {
        target.releasePointerCapture(e.pointerId);
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerup', onUp);
        setSize((prev) => {
          persist(prev);
          return prev;
        });
      };

      target.addEventListener('pointermove', onMove);
      target.addEventListener('pointerup', onUp);
    };
  }

  function handleOpacity(e: React.ChangeEvent<HTMLInputElement>) {
    const value = clamp(Number(e.target.value) / 100, MIN_OPACITY, 1);
    setSize((prev) => {
      const next = { ...prev, opacity: value };
      persist(next);
      return next;
    });
  }

  function handleClose() {
    setOpen(false);
    fabRef.current?.focus();
  }

  if (!open) {
    return (
      <button
        ref={fabRef}
        type="button"
        data-tutor-fab
        data-print-hide
        onClick={() => {
          // 저장된 크기·투명도는 여는 순간에 읽는다. 마운트 시 effect에서 읽으면
          // 서버 렌더와 값이 달라 하이드레이션이 어긋나고, 그걸 피하려고 effect에
          // setState를 넣으면 캐스케이딩 렌더가 된다(react-hooks/set-state-in-effect).
          // 닫혀 있는 동안에는 이 값들을 쓰는 것이 아무것도 없으므로 지금 읽으면 된다.
          setSize(readStored());
          setOpen(true);
        }}
        aria-label="학습도우미 열기"
        className="tutor-fab"
      >
        <GraduationCap className="h-6 w-6 shrink-0" aria-hidden="true" />
      </button>
    );
  }

  return (
    <section
      data-tutor-panel
      data-print-hide
      aria-label="학습도우미"
      style={{ width: `${size.width}px`, height: `${size.height}px`, opacity: size.opacity }}
      className="tutor-panel"
      onKeyDown={(e) => {
        if (e.key === 'Escape') handleClose();
      }}
    >
      <div className="tutor-grip-y" onPointerDown={startResize('y')} aria-hidden="true" />
      <div className="tutor-grip-x" onPointerDown={startResize('x')} aria-hidden="true" />

      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3 py-2 dark:border-line-dark">
        <span className="flex min-w-0 items-center gap-2 text-label font-bold">
          <GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">학습도우미</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <input
            type="range"
            min={Math.round(MIN_OPACITY * 100)}
            max={100}
            value={Math.round(size.opacity * 100)}
            onChange={handleOpacity}
            className="tutor-opacity"
            aria-label="대화창 투명도"
          />
          <button
            type="button"
            onClick={() => void handleClear()}
            aria-label="대화 초기화"
            className="tap-feedback flex h-9 w-9 items-center justify-center text-muted dark:text-muted-dark"
          >
            <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleClose}
            aria-label="학습도우미 닫기"
            className="tap-feedback flex h-9 w-9 items-center justify-center text-muted dark:text-muted-dark"
          >
            <X className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
        </span>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 && partial.length === 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-label font-normal text-muted dark:text-muted-dark">
              이 레슨을 읽고 있는 선생님입니다. 모르는 대목을 그대로 물어보세요.
            </p>
            {STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => void send(starter)}
                className="chip tap-feedback w-full justify-start text-label"
              >
                {starter}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <p
              key={index}
              className={`whitespace-pre-wrap px-3 py-2 text-label font-normal ${
                message.role === 'user' ? 'tutor-bubble-user' : 'tutor-bubble-assistant'
              }`}
            >
              {message.content}
            </p>
          ))}
          {partial.length > 0 ? (
            <p className="tutor-bubble-assistant whitespace-pre-wrap px-3 py-2 text-label font-normal">
              {partial}
            </p>
          ) : null}
          {streaming && partial.length === 0 ? (
            <p className="tutor-typing flex gap-1 px-3 py-2 text-label" aria-live="polite">
              <span aria-hidden="true">●</span>
              <span aria-hidden="true">●</span>
              <span aria-hidden="true">●</span>
              <span className="sr-only">답변을 쓰는 중</span>
            </p>
          ) : null}
        </div>

        {notice ? (
          <p
            role="status"
            className="mt-3 px-3 text-label font-normal text-destructive dark:text-destructive-dark"
          >
            {notice}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
        className="flex shrink-0 items-end gap-2 border-t border-line p-2 dark:border-line-dark"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter로 보내고 Shift+Enter로 줄바꿈 — 아이패드 외장 키보드에서도 같다.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send(draft);
            }
          }}
          rows={2}
          placeholder="이 레슨에 대해 물어보세요"
          aria-label="질문 입력"
          className="min-h-11 flex-1 resize-none border border-line bg-surface px-2 py-1.5 text-label font-normal dark:border-line-dark dark:bg-surface-dark"
        />
        <button
          type="submit"
          disabled={streaming || draft.trim().length === 0}
          aria-label="보내기"
          className="btn-action tap-feedback text-label"
        >
          <SendHorizonal className="h-4 w-4 shrink-0" aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}
