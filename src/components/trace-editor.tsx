'use client';

// 따라 치기(고스트 코드 오버레이) 공유 컴포넌트 (quick 260902-wk7). RunPython·
// RunSQL 양쪽이 그대로 import한다 — 오버레이 렌더·스크롤 미러링·줄 일치 계산
// 로직을 두 파일에 복붙하면 한쪽만 고치는 회귀가 생기므로 단일 소스로 뽑는다.
//
// 상태는 이 컴포넌트가 소유하지 않고 부모(run-python.tsx/run-sql.tsx)가
// controlled로 준다 — value/onChange 표준 패턴. IME 안전성의 핵심도 여기 있다:
// textarea는 문자 입력을 onKeyDown으로 가로채거나 값을 다시 쓰지 않는다. 그런
// 가로채기는 한국어 조합 중인 글자를 깨뜨린다(preflight, 260901-etq 튜터
// 프롬프트 입력창에서 같은 교훈을 이미 확인함). 정렬은 순전히 globals.css의
// .trace-overlay/.trace-guide/.trace-input 공유 텍스트 메트릭에 맡긴다.
//
// blockGuides(quick 260903-05g): 코드의 논리 블록마다 "이 블록이 뭘 하는지"
// eli5 설명을 순서대로 얹는다. 블록 = 빈 줄로 나뉘는, 비어있지 않은 줄들의
// 연속 묶음(# N) 주석 구획과 자연히 일치). 학습자가 한 블록을 다 정확히 치면
// 그 블록 설명이 아래에 누적으로 뜬다.
//
// 주석 제외 + 자동 다음 줄 이동(quick 260903-0vx): 주석·빈 줄은 미리 채워진
// (given) 줄로 두고 학습자는 "코드 줄"만 채운다(주석은 타이핑 대상 아님).
// 한 코드 줄을 정확히 다 치면 다음 코드 줄로 커서가 자동 이동하고(주석 줄은
// 건너뜀), Enter도 다음 코드 줄 이동으로 동작한다(조합 중 Enter는 확정에
// 양보 — isComposing 가드). 미리 채워 두는 이유: 그래야 입력면 줄 인덱스가
// 고스트와 1:1로 유지돼 정렬이 안 깨진다.

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';

// 전체 줄 주석 판정 — 트림한 줄이 주석 접두사(파이썬 '#', SQL '--')로 시작하면
// 전체 줄 주석이다. 코드 뒤에 붙는 인라인 주석(x = 1  # 메모)은 코드 줄이므로
// 여기서 걸리지 않는다(줄 첫 글자가 접두사가 아님).
function isCommentLine(line: string, prefixes: readonly string[]): boolean {
  const t = line.trimStart();
  return prefixes.some((p) => p.length > 0 && t.startsWith(p));
}

// 타이핑 대상 줄 — 구조상 빈 줄도 아니고 전체 줄 주석도 아닌, 학습자가 실제로
// 쳐야 하는 코드 줄.
function isTypeableLine(line: string, prefixes: readonly string[]): boolean {
  if (line.trim() === '') return false;
  return !isCommentLine(line, prefixes);
}

// 따라 치기 진입 시의 초기 템플릿 — 코드 줄은 빈칸('')으로 비우고, 주석·빈 줄은
// 원본 그대로 준다. 학습자는 빈칸(코드 줄)만 채운다. 줄 개수는 원본과 같아
// 고스트와 줄 정렬이 유지된다.
export function buildTraceTemplate(guide: string, prefixes: readonly string[]): string {
  return guide
    .split('\n')
    .map((line) => (isTypeableLine(line, prefixes) ? '' : line))
    .join('\n');
}

// text에서 lineIdx번째 줄이 시작하는 문자 오프셋(앞 줄들의 길이 + 개행 수).
function lineStartOffset(text: string, lineIdx: number): number {
  const lines = text.split('\n');
  let off = 0;
  for (let i = 0; i < lineIdx && i < lines.length; i++) off += lines[i].length + 1;
  return off;
}

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

// 줄 끝 공백만 무시한 줄 단위 비교(줄 중간 공백·들여쓰기는 그대로 채점).
function lineEquals(a: string, b: string): boolean {
  return a.replace(/\s+$/, '') === b.replace(/\s+$/, '');
}

// 블록의 모든 줄이 일치하면 완료로 본다. 주석·빈 줄은 템플릿에 미리 채워져 있어
// 항상 일치하므로, 결국 그 블록의 코드 줄을 다 정확히 쳤을 때 완료된다.
function isBlockComplete(
  guideLines: string[],
  typedLines: string[],
  block: { start: number; end: number },
): boolean {
  for (let i = block.start; i <= block.end; i++) {
    if (!lineEquals(guideLines[i] ?? '', typedLines[i] ?? '')) return false;
  }
  return true;
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

// 파이썬은 '#', SQL은 '--'. 부모가 안 주면 주석 제외 없이(빈 줄만 비대상) 동작.
const NO_PREFIXES: readonly string[] = [];

export function TraceEditor({
  guide,
  value,
  onChange,
  ariaLabel,
  blockGuides,
  commentPrefixes = NO_PREFIXES,
}: {
  guide: string;
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
  // 블록 순서대로의 설명. 빈 문자열/생략은 그 블록에 설명 없음(구분선처럼
  // 자명한 블록). 아예 안 주면 지금까지와 동일하게 설명 UI가 없다.
  blockGuides?: readonly string[];
  // 전체 줄 주석 접두사. 부모(RunPython='#', RunSQL='--')가 준다. 모듈 상수를
  // 넘겨 identity를 고정해야 마운트 효과가 매 렌더 재실행되지 않는다.
  commentPrefixes?: readonly string[];
}) {
  const guideRef = useRef<HTMLPreElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const diffRef = useRef<HTMLPreElement>(null);
  // 한글 조합 중인지. 조합 중에는 자동 줄 이동을 미룬다 — 조합 도중 커서를
  // 옮기면 IME가 조합을 깨뜨린다. 코드 줄에도 한글 문자열(예: "김지현")이 있다.
  const composingRef = useRef(false);

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

  const guideLines = useMemo(() => guide.split('\n'), [guide]);

  // 커서 기준 현재 줄 인덱스보다 뒤에 있는 첫 코드(타이핑 대상) 줄 인덱스.
  const nextTypeableIndex = useCallback(
    (fromLine: number): number => {
      for (let i = fromLine + 1; i < guideLines.length; i++) {
        if (isTypeableLine(guideLines[i], commentPrefixes)) return i;
      }
      return -1;
    },
    [guideLines, commentPrefixes],
  );

  // 커서를 특정 줄의 (현재 내용 끝) 위치로 옮긴다. 코드 줄은 대개 빈칸이라 줄 시작.
  const moveCaretToLine = useCallback((lineIdx: number) => {
    const el = inputRef.current;
    if (!el) return;
    const lines = el.value.split('\n');
    const offset = lineStartOffset(el.value, lineIdx) + (lines[lineIdx] ?? '').length;
    el.focus();
    el.setSelectionRange(offset, offset);
  }, []);

  // 진입 시 커서를 첫 코드 줄로 놓는다(주석부터 시작하지 않게). guide가 바뀔 때만
  // (= 새 블록 따라 치기를 시작할 때만) 실행되도록 deps를 좁힌다.
  useEffect(() => {
    const first = guideLines.findIndex((l) => isTypeableLine(l, commentPrefixes));
    moveCaretToLine(first < 0 ? 0 : first);
  }, [guideLines, commentPrefixes, moveCaretToLine]);

  // 현재 커서가 놓인 코드 줄을 정확히 다 쳤으면 다음 코드 줄로 커서를 자동
  // 이동한다. 커서만 옮기고 값은 안 바꾸므로 루프가 없고, 값을 다시 쓰지 않아
  // IME 조합도 건드리지 않는다. 단 조합 중에는 미룬다(조합 끝에서 다시 부른다).
  const maybeAdvance = useCallback(() => {
    if (composingRef.current) return;
    const el = inputRef.current;
    if (!el) return;
    const before = el.value.slice(0, el.selectionStart);
    const lineIdx = (before.match(/\n/g) ?? []).length;
    const gLine = guideLines[lineIdx];
    if (gLine === undefined || !isTypeableLine(gLine, commentPrefixes)) return;
    const tLine = el.value.split('\n')[lineIdx] ?? '';
    if (!lineEquals(tLine, gLine)) return;
    const next = nextTypeableIndex(lineIdx);
    if (next !== -1) moveCaretToLine(next);
  }, [guideLines, commentPrefixes, nextTypeableIndex, moveCaretToLine]);

  // value가 바뀐 뒤(렌더 후) 자동 이동을 시도한다.
  useEffect(() => {
    maybeAdvance();
  }, [value, maybeAdvance]);

  // Enter — 새 줄을 넣지 않고 다음 코드 줄로 넘어간다(템플릿 줄 구조를 고정해
  // 고스트 정렬을 지킨다). 단 한글 조합 중 Enter는 조합 확정이므로 양보한다.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
      e.preventDefault();
      const el = e.currentTarget;
      const before = el.value.slice(0, el.selectionStart);
      const lineIdx = (before.match(/\n/g) ?? []).length;
      const next = nextTypeableIndex(lineIdx);
      if (next !== -1) moveCaretToLine(next);
    },
    [nextTypeableIndex, moveCaretToLine],
  );

  // "N/M줄 일치" — 주석·빈 줄은 대상에서 빼고 코드 줄만 센다.
  const typedLines = useMemo(() => value.split('\n'), [value]);
  const { target, done } = useMemo(() => {
    let target = 0;
    let done = 0;
    for (let i = 0; i < guideLines.length; i++) {
      if (!isTypeableLine(guideLines[i], commentPrefixes)) continue;
      target += 1;
      if (lineEquals(typedLines[i] ?? '', guideLines[i])) done += 1;
    }
    return { target, done };
  }, [guideLines, typedLines, commentPrefixes]);
  const complete = target > 0 && done === target;

  // 오답 글자만 빨갛게 덮는 진단 트리. value가 바뀔 때만 다시 만든다.
  const diffContent = useMemo(() => renderDiff(guide, value), [guide, value]);

  // 완료된 블록의 설명을 순서대로 모은다. blockGuides가 없으면 빈 목록이라
  // 설명 UI 자체가 렌더되지 않는다(기존 동작과 동일).
  const revealedNotes = useMemo(() => {
    if (!blockGuides || blockGuides.length === 0) return [] as Array<{ key: number; text: string }>;
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
  }, [blockGuides, guide, guideLines, typedLines]);

  return (
    <div className="panel mt-2 p-3">
      <label className="text-label mb-2 block font-normal text-muted dark:text-muted-dark">
        흐리게 보이는 코드를 그대로 따라 쳐 보세요. 주석(설명 줄)은 미리 채워져 있으니 코드만 치면 돼요 — 한 줄을 맞게 치면 다음 줄로 자동으로 넘어갑니다.
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
          onKeyDown={handleKeyDown}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={() => {
            composingRef.current = false;
            // 조합이 끝난 값이 DOM에 반영된 다음 프레임에 자동 이동을 다시 시도.
            requestAnimationFrame(maybeAdvance);
          }}
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
        {complete ? '완성! 코드를 원본과 똑같이 다 쳤어요' : `${done}/${target}줄 일치`}
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
