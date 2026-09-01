'use client';

// /inbox 클라이언트 아일랜드(quick 260901-x62) — 추가 폼 + 목록(완료 토글 +
// "클로드에 물어보기" 복사). 단일 사용자 전제라 낙관적 UI 없이 서버 액션 성공
// 후 router.refresh()로 force-dynamic 서버 페이지를 다시 읽어 목록을
// 갱신한다(review-judgment-buttons.tsx와 같은 useTransition + refresh 규약).
// ProgressProvider·useProgress는 쓰지 않는다(진도 불필요, 인박스는 진도와
// 무관한 전역 리스트다).

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy } from 'lucide-react';
import { addInboxQuestion, toggleInboxDone } from '@/app/inbox-actions';
import type { InboxItem } from '@/lib/inbox-store';

const COPY_FEEDBACK_MS = 2_400;

// 곁가지 질문 하나에 맞춘 가벼운 프레이밍 — lesson-copy-prompt.tsx의
// TEACHER_BRIEF 전체(레슨 과외 지침)를 붙이지 않는다. 이건 레슨 본문을 들고
// 가는 게 아니라 공부하다 떠오른 질문 한 줄을 들고 가는 것이라 무게가 다르다.
function buildQuestionPrompt(body: string): string {
  return [
    '공부하다가 떠오른 질문이야. AI Engineer 교육과정 사전학습 중에 나온 질문인데, 편하게 답해줘.',
    '',
    body,
  ].join('\n');
}

function AddQuestionForm() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length === 0) return;

    setFailed(false);
    const submitted = value;
    startTransition(async () => {
      try {
        await addInboxQuestion(submitted);
        // 저장이 성공했을 때만 입력창을 비운다 — 실패 시 방금 쓴 글은 그대로
        // 남긴다(note-store 실패 처리 원칙).
        setValue('');
        router.refresh();
      } catch {
        setFailed(true);
      }
    });
  }

  // onChange 핸들러는 오직 setValue만 한다 — 값의 길이·문자 종류를 들여다보는
  // 로직을 넣지 않는다(한글 IME 안전, lesson-notepad.tsx 원칙).
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
  }

  return (
    <form onSubmit={handleSubmit} className="panel flex flex-col gap-3 p-4">
      <label htmlFor="inbox-new-question" className="text-label font-bold">
        새 질문
      </label>
      <textarea
        id="inbox-new-question"
        value={value}
        onChange={handleChange}
        placeholder="공부하다가 떠오른 질문을 적어보세요"
        spellCheck={false}
        rows={3}
        className="w-full resize-y border border-line bg-surface-2 p-3 text-body font-normal text-foreground dark:border-line-dark dark:bg-surface-2-dark dark:text-foreground-dark"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || value.trim().length === 0}
          className="btn-action tap-feedback min-h-11 px-4 text-label font-bold"
        >
          질문 추가
        </button>
        <span
          role="status"
          aria-live="polite"
          className={`text-label font-normal text-muted dark:text-muted-dark ${failed ? '' : 'sr-only'}`}
        >
          {failed ? '저장하지 못했어요. 방금 쓴 글은 그대로 남아 있어요.' : ''}
        </span>
      </div>
    </form>
  );
}

function CopyQuestionButton({ body }: { body: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      // 사용자 제스처 안에서 곧바로 호출한다 — 앞에 await를 끼우면 iPad
      // Safari가 제스처 컨텍스트를 잃고 거부한다(lesson-copy-prompt.tsx와
      // 같은 이유로 같은 형태다).
      await navigator.clipboard.writeText(buildQuestionPrompt(body));
      setState('copied');
    } catch {
      setState('failed');
    }
    timerRef.current = setTimeout(() => setState('idle'), COPY_FEEDBACK_MS);
  }, [body]);

  const label =
    state === 'copied' ? '복사했어요 — 클로드에 붙여넣으세요' : state === 'failed' ? '복사하지 못했어요' : '클로드에 물어보기';

  return (
    <span className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label="질문을 복사해 클로드에 붙여넣기"
        className="btn tap-feedback min-h-11 text-label"
      >
        {state === 'copied' ? (
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        클로드에 물어보기
      </button>
      {/* 성공·실패를 아이콘 말고 글자로도 알린다(보조기술 포함). */}
      <span
        role="status"
        aria-live="polite"
        className={`text-label font-normal text-muted dark:text-muted-dark ${state === 'idle' ? 'sr-only' : ''}`}
      >
        {state === 'idle' ? '' : label}
      </span>
    </span>
  );
}

function InboxItemCard({ item }: { item: InboxItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function handleToggle() {
    setFailed(false);
    startTransition(async () => {
      try {
        await toggleInboxDone(item.id, !item.done);
        router.refresh();
      } catch {
        // 저장 실패는 조용히 삼키지 않는다 — 완료 상태가 바뀐 것처럼 오인하면
        // 안 된다(review-judgment-buttons.tsx와 같은 원칙).
        setFailed(true);
      }
    });
  }

  return (
    <li className={`panel flex flex-col gap-3 p-4 ${item.done ? 'opacity-60' : ''}`}>
      <p className="text-body font-normal whitespace-pre-wrap">{item.body}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={handleToggle}
            aria-pressed={item.done}
            className={`btn tap-feedback flex min-h-11 items-center gap-2 px-3 text-label font-bold ${
              item.done ? 'chip-solid' : ''
            }`}
          >
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.done ? '완료됨' : '완료로 표시'}
          </button>
          {failed ? (
            <span role="status" aria-live="polite" className="text-label font-normal text-muted dark:text-muted-dark">
              저장하지 못했어요. 다시 눌러 주세요.
            </span>
          ) : null}
        </div>
        <CopyQuestionButton body={item.body} />
      </div>
    </li>
  );
}

export function InboxPanel({ items }: { items: InboxItem[] }) {
  return (
    <div className="flex flex-col gap-6">
      <AddQuestionForm />

      {items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <InboxItemCard key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <p className="text-label font-normal text-muted dark:text-muted-dark">
          아직 담아둔 질문이 없어요. 위 칸에 적어보세요.
        </p>
      )}
    </div>
  );
}
