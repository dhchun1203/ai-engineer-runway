'use client';

// 클로즈(빈칸 채우기) 입력 아일랜드. 저장(Supabase)은 이 컴포넌트가 직접 하지
// 않는다 — ClozeProvider가 초기 상태·저장 콜백을 컨텍스트로 내려줄 때만
// 쓴다. useContext 기본값 null(프로바이더 없음, 또는 enabled=false인 잠금
// 상태·/about)이면 Task 1과 동일하게 완전히 휘발성으로 동작한다(DD-8, DD-9).
//
// 판정은 blur/Enter에서만 한다(DD-2) — onChange에서는 값만 담고 판정도
// aria-live 낭독도 하지 않는다. 한글 조합 중(`ㄱ` -> `가` -> `각`) input 이벤트가
// 미완성 자모 상태로 계속 발생하므로, 실시간 비교는 "난이도"가 아니라 "버그"로
// 읽힌다 — 비교 시점을 blur/제출로 미뤄 문제 자체가 발생하지 않게 한다.

import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import { normalizeAnswer } from '@/lib/cloze-key';
import { useClozeContext } from '@/components/cloze-provider';

type ClozeState = 'empty' | 'correct' | 'incorrect' | 'revealed';

export function ClozeBlank({
  answer,
  index,
  hash,
}: {
  answer: string;
  index: string;
  hash: string;
}) {
  const clozeContext = useClozeContext();
  const canPersist = !!clozeContext?.enabled;

  // 초기 상태 복원 — lazy useState 초기화자는 마운트 시 한 번만 실행된다.
  // getInitialState가 hash 불일치를 이미 "기록 없음"으로 걸러주므로(DD-7),
  // 여기서는 결과를 그대로 믿는다.
  const [initialRestoredState] = useState<'correct' | 'revealed' | null>(() =>
    canPersist ? (clozeContext?.getInitialState(index, hash) ?? null) : null,
  );
  const [value, setValue] = useState(initialRestoredState ? answer : '');
  const [state, setState] = useState<ClozeState>(initialRestoredState ?? 'empty');
  // 저장 실패는 조용한 표시만 남긴다(DD-9) — 배너·모달은 만들지 않는다.
  const [saveFailed, setSaveFailed] = useState(false);
  const inputId = useId();
  const feedbackId = useId();

  function persist(status: 'correct' | 'revealed') {
    if (!canPersist || !clozeContext) return;
    setSaveFailed(false);
    // 낙관적 UI를 기다리게 하지 않는다 — 실패 시 표시만 뒤늦게 붙는다.
    clozeContext.save(index, hash, status).then((ok) => {
      if (!ok) setSaveFailed(true);
    });
  }

  function judge(candidate: string) {
    if (candidate.length === 0) {
      // 빈 값으로 blur하면 판정하지 않고 empty로 둔다.
      setState('empty');
      return;
    }
    const isCorrect = normalizeAnswer(candidate) === normalizeAnswer(answer);
    setState(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) persist('correct');
  }

  function handleReveal() {
    setState('revealed');
    persist('revealed');
  }

  const feedbackText =
    state === 'correct'
      ? `정답입니다${saveFailed ? ' (저장 안 됨)' : ''}`
      : state === 'incorrect'
        ? '틀렸습니다. 다시 시도하거나 정답 보기를 눌러보세요'
        : state === 'revealed'
          ? `정답: ${answer}${saveFailed ? ' (저장 안 됨)' : ''}`
          : '';

  return (
    <span
      data-cloze-blank
      data-cloze-index={index}
      data-cloze-state={state}
      // hash는 Task 3에서 ClozeProvider가 저장된 기록의 answer_hash와 대조해
      // 초기 상태를 복원할 때 쓴다(DD-7, 본문 수정 내성). Task 1 시점에는
      // 저장이 없어 값 자체는 안 쓰이지만, DOM에 남겨 두면 게이트/디버깅에서
      // 어떤 정답 해시로 렌더됐는지 확인할 수 있다.
      data-cloze-hash={hash}
      className="inline-flex items-baseline gap-1 align-baseline"
    >
      <input
        id={inputId}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={`빈칸 ${index}번 정답 입력`}
        aria-describedby={feedbackId}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => judge(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            judge(value);
          }
        }}
        data-cloze-answer-length={answer.length}
        style={{ '--cloze-answer-length': answer.length } as CSSProperties}
        className="cloze-blank-input"
      />
      <button
        type="button"
        onClick={handleReveal}
        className="cloze-blank-reveal"
        aria-label={`빈칸 ${index}번 정답 보기`}
      >
        정답 보기
      </button>
      <span id={feedbackId} aria-live="polite" className="cloze-blank-feedback">
        {feedbackText}
      </span>
    </span>
  );
}
