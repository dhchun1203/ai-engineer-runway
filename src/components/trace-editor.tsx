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
//
// blockGuides(quick 260903-05g): 코드의 논리 블록마다 "이 블록이 뭘 하는지"
// eli5 설명을 순서대로 얹는다. 블록 = 빈 줄로 나뉘는, 비어있지 않은 줄들의
// 연속 묶음(# N) 주석 구획과 자연히 일치). 학습자가 한 블록을 다 정확히 치면
// 그 블록 설명이 아래에 누적으로 뜬다. 위치를 줄 인덱스가 아니라 블록에
// 묶는 이유: 코드 내부 한두 줄을 고쳐도 블록 경계(빈 줄)는 그대로라 설명이
// 밀리지 않는다(북마크가 겪은 줄 인덱스 취약성 회피).

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';

// 지금까지 친 값(typed)을 원본(guide)과 같은 줄·같은 열끼리 글자 단위로 비교해,
// 다른 글자만 .miss로 감싼 렌더 트리를 만든다. 진단층(.trace-diff)은 color가
// transparent라 맞는 글자는 안 보이고(아래 입력층 글자가 비쳐 보임) 틀린 글자만
// 빨갛게 뜬다. 아직 안 친 줄/글자는 렌더하지 않아 흐린 원본이 그대로 남는다.
// 맞는 글자도 폭은 그대로 차지하도록 실제 친 글자를 렌더한다(한글 2배폭 정렬 보존).
function renderDiff(guide: string, typed: string): ReactNode {
  const guideLines = guide.split('\n');
  const typedLines = typed.split('\n');
  const out: ReactNode[] = [];
  for (let i = 0; i < typedLines.length; i++) {
    const t = typedLines[i];
    const g = guideLines[i] ?? '';
    const segs: ReactNode[] = [];
    let buf = '';
    let bufWrong: boolean | null = null;
    const flush = (key: number) => {
      if (buf === '') return;
      segs.push(
        bufWrong ? (
          <span key={key} className="miss">
            {buf}
          </span>
        ) : (
          // 맞는 구간 — 클래스 없이 transparent 상속(투명). key로 배열 경고를 막는다.
          <span key={key}>{buf}</span>
        ),
      );
      buf = '';
    };
    for (let j = 0; j < t.length; j++) {
      // guide 줄보다 길게 친 글자(j >= g.length)나 값이 다른 글자는 오답이다.
      const wrong = j >= g.length || t[j] !== g[j];
      if (bufWrong === null) bufWrong = wrong;
      if (wrong !== bufWrong) {
        flush(j);
        bufWrong = wrong;
      }
      buf += t[j];
    }
    flush(t.length);
    // 마지막 줄이 아니면 줄바꿈 문자를 넣는다(white-space: pre라 그대로 개행).
    out.push(
      <span key={`line-${i}`}>
        {segs}
        {i < typedLines.length - 1 ? '\n' : ''}
      </span>,
    );
  }
  return out;
}

// 안내(guide)와 학습자가 친 값(typed)을 같은 인덱스의 줄끼리 비교해 일치한
// 줄 수를 센다. 줄 끝 공백만 무시한다(줄 중간 공백·들여쓰기는 그대로 채점) —
// guide의 줄 수를 total로 삼는다.
//
// 학습자가 아직 도달하지 않은 줄(typed에 없는 인덱스)은 세지 않는다. 이 가드가
// 없으면 빈 입력에서도 guide의 빈 줄들이 undefined→''와 맞아떨어져 매칭으로
// 잡힌다(따라 치기 진입 직후 "7/34줄 일치" 같은 오표시). 따라 치기는 위에서
// 아래로 순서대로 치는 연습이므로, 실제로 친 줄 수(typedLines.length)까지만
// 비교하면 된다 — 빈 입력이면 0/N에서 시작한다.
export function countMatchingLines(guide: string, typed: string): number {
  const guideLines = guide.split('\n');
  const typedLines = typed.split('\n');
  const upTo = Math.min(guideLines.length, typedLines.length);
  let matched = 0;
  for (let i = 0; i < upTo; i++) {
    const guideLine = guideLines[i].replace(/\s+$/, '');
    const typedLine = typedLines[i].replace(/\s+$/, '');
    if (guideLine === typedLine) matched += 1;
  }
  return matched;
}

// 가이드 코드를 논리 블록으로 쪼갠다 — 빈 줄(트림하면 '')을 경계로, 비어있지
// 않은 줄들의 연속 묶음 하나가 한 블록이다. 각 블록을 [start, end](둘 다 포함)
// 줄 인덱스 범위로 돌려준다. blockGuides 배열은 이 블록 순서에 1:1로 맞춘다.
export function splitBlocks(guide: string): Array<{ start: number; end: number }> {
  const lines = guide.split('\n');
  const blocks: Array<{ start: number; end: number }> = [];
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const blank = lines[i].trim() === '';
    if (!blank && start === -1) {
      start = i;
    } else if (blank && start !== -1) {
      blocks.push({ start, end: i - 1 });
      start = -1;
    }
  }
  if (start !== -1) blocks.push({ start, end: lines.length - 1 });
  return blocks;
}

// 블록의 모든 줄이 (줄 끝 공백 관대하게) 일치하면 완료로 본다. 블록은 비어있지
// 않은 줄들로만 이뤄지므로, 모두 일치했다는 것은 학습자가 그 줄들을 실제로 다
// 쳤다는 뜻이다(빈 입력의 undefined→''는 비어있지 않은 코드 줄과 맞지 않는다).
function isBlockComplete(
  guideLines: string[],
  typedLines: string[],
  block: { start: number; end: number },
): boolean {
  for (let i = block.start; i <= block.end; i++) {
    const g = (guideLines[i] ?? '').replace(/\s+$/, '');
    const t = (typedLines[i] ?? '').replace(/\s+$/, '');
    if (g !== t) return false;
  }
  return true;
}

export function TraceEditor({
  guide,
  value,
  onChange,
  ariaLabel,
  blockGuides,
}: {
  guide: string;
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
  // 블록 순서대로의 설명. 빈 문자열/생략은 그 블록에 설명 없음(구분선처럼
  // 자명한 블록). 아예 안 주면 지금까지와 동일하게 설명 UI가 없다.
  blockGuides?: readonly string[];
}) {
  const guideRef = useRef<HTMLPreElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const diffRef = useRef<HTMLPreElement>(null);

  // 입력면 스크롤을 안내층·진단층에 그대로 미러링한다 — 둘 다 pointer-events:
  // none이라 자체 스크롤이 없으므로, 학습자가 긴 줄을 옆으로 넘기거나 캐럿을
  // 따라 자동 스크롤될 때 아래 두 겹이 같이 밀리지 않으면 정렬이 깨진다.
  const syncScroll = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    if (guideRef.current) {
      guideRef.current.scrollTop = input.scrollTop;
      guideRef.current.scrollLeft = input.scrollLeft;
    }
    if (diffRef.current) {
      diffRef.current.scrollTop = input.scrollTop;
      diffRef.current.scrollLeft = input.scrollLeft;
    }
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

  // 오답 글자만 빨갛게 덮는 진단 트리. value가 바뀔 때만 다시 만든다.
  const diffContent = useMemo(() => renderDiff(guide, value), [guide, value]);

  // 완료된 블록의 설명을 순서대로 모은다. blockGuides가 없으면 빈 목록이라
  // 설명 UI 자체가 렌더되지 않는다(기존 동작과 동일).
  const revealedNotes = useMemo(() => {
    if (!blockGuides || blockGuides.length === 0) return [] as Array<{ key: number; text: string }>;
    const guideLines = guide.split('\n');
    const typedLines = value.split('\n');
    const blocks = splitBlocks(guide);
    const notes: Array<{ key: number; text: string }> = [];
    for (let i = 0; i < blocks.length; i++) {
      const text = blockGuides[i];
      if (!text) continue; // 설명 없는 블록(구분선 등)은 건너뛴다
      if (isBlockComplete(guideLines, typedLines, blocks[i])) {
        notes.push({ key: i, text });
      }
    }
    return notes;
  }, [blockGuides, guide, value]);

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
        {/* 진단층 — 입력층 위에 겹쳐 오답 글자만 빨갛게 덮는다(맞는 글자는 투명). */}
        <pre ref={diffRef} className="trace-diff" aria-hidden="true">
          {diffContent}
        </pre>
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

      {/* 블록을 다 치면 그 블록 설명이 여기 순서대로 쌓인다. 손으로 재생성한
          직후에 "방금 친 게 뭐였는지"를 읽어 개념을 굳히는 자리 — aria-live로
          새 설명이 뜰 때 보조기술에도 읽어 준다. */}
      {revealedNotes.length > 0 ? (
        <div className="mt-3 flex flex-col gap-3" aria-live="polite">
          {revealedNotes.map((note) => (
            <p
              key={note.key}
              className="text-label border-l-2 border-foreground pl-3 font-normal leading-relaxed text-foreground dark:border-foreground-dark dark:text-foreground-dark"
            >
              {note.text}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
