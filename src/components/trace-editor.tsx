'use client';

// 따라 치기(고스트 코드 오버레이) 공유 컴포넌트 (quick 260902-wk7). RunPython·
// RunSQL 양쪽이 그대로 import한다 — 오버레이 렌더·스크롤 미러링·줄 일치 계산
// 로직을 두 파일에 복붙하면 한쪽만 고치는 회귀가 생기므로 단일 소스로 뽑는다.
//
// 상태는 이 컴포넌트가 소유하지 않고 부모(run-python.tsx/run-sql.tsx)가
// controlled로 준다 — value/onChange 표준 패턴. IME 안전성의 핵심도 여기 있다:
// textarea는 onKeyDown으로 값을 다시 쓰거나 키 입력을 가로채지 않는다. 그런
// 가로채기는 한국어 조합 중인 글자를 깨뜨린다(preflight, 260901-etq 튜터
// 프롬프트 입력창에서 같은 교훈을 이미 확인함). 정렬은 순전히 globals.css의
// .trace-overlay/.trace-guide/.trace-input 공유 텍스트 메트릭에 맡긴다.

import { useCallback, useEffect, useRef } from 'react';

// 안내(guide)와 학습자가 친 값(typed)을 같은 인덱스의 줄끼리 비교해 일치한
// 줄 수를 센다. 줄 끝 공백만 무시한다(줄 중간 공백·들여쓰기는 그대로 채점) —
// guide의 줄 수를 total로 삼는다.
export function countMatchingLines(guide: string, typed: string): number {
  const guideLines = guide.split('\n');
  const typedLines = typed.split('\n');
  let matched = 0;
  for (let i = 0; i < guideLines.length; i++) {
    const guideLine = guideLines[i].replace(/\s+$/, '');
    const typedLine = (typedLines[i] ?? '').replace(/\s+$/, '');
    if (guideLine === typedLine) matched += 1;
  }
  return matched;
}

export function TraceEditor({
  guide,
  value,
  onChange,
  ariaLabel,
}: {
  guide: string;
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
}) {
  const guideRef = useRef<HTMLPreElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 입력면 스크롤을 안내층에 그대로 미러링한다 — 안내는 pointer-events: none
  // 이라 자체 스크롤이 없으므로, 학습자가 긴 줄을 옆으로 넘기거나 캐럿을
  // 따라 자동 스크롤될 때 아래 안내가 같이 밀리지 않으면 정렬이 깨진다.
  const syncScroll = useCallback(() => {
    const input = inputRef.current;
    const guideEl = guideRef.current;
    if (!input || !guideEl) return;
    guideEl.scrollTop = input.scrollTop;
    guideEl.scrollLeft = input.scrollLeft;
  }, []);

  // onChange 경로(캐럿 이동에 따른 자동 스크롤)에서도 다음 프레임에 한 번 더
  // 맞춘다 — 리셋·초기 진입 직후 어긋남을 없앤다.
  useEffect(() => {
    const frame = requestAnimationFrame(syncScroll);
    return () => cancelAnimationFrame(frame);
  }, [value, syncScroll]);

  const total = guide.split('\n').length;
  const matched = countMatchingLines(guide, value);
  const complete = total > 0 && matched === total;

  return (
    <div className="panel mt-2 p-3">
      <label className="text-label mb-2 block font-normal text-muted dark:text-muted-dark">
        흐리게 보이는 원본 위에 그대로 따라 쳐 보세요. 눈이 아니라 손으로 익히는 연습입니다.
      </label>
      <div className="trace-overlay">
        <pre ref={guideRef} className="trace-guide" aria-hidden="true">
          {guide}
        </pre>
        <textarea
          ref={inputRef}
          className="trace-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          aria-label={ariaLabel}
        />
      </div>
      <p
        role="status"
        aria-live="polite"
        className={
          complete
            ? 'text-label mt-2 font-semibold text-foreground dark:text-foreground-dark'
            : 'text-label mt-2 font-normal text-muted dark:text-muted-dark'
        }
      >
        {complete ? '완성! 모든 줄이 원본과 일치해요' : `${matched}/${total}줄 일치`}
      </p>
    </div>
  );
}
