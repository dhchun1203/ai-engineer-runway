'use client';

// 리팩터링 재생기 본체. 원래 코드에서 시작해 단계마다
//   1) 되풀이되는 곳을 노랗게 강조하고(mark)
//   2) 바꿀 줄을 빨갛게 칠한 뒤 아래에서부터 지우고(replace)
//   3) 새 줄을 한 글자씩 초록으로 타이핑한다(after/replace의 lines)
// 단계별 결과(스냅숏)는 처음에 한 번 계산해 두고, 단계 칩을 누르면 그 스냅숏으로 바로 간다.
//
// 재생은 async 루프다. 멈춤은 남은 대기 시간을 줄이지 않는 것으로, 중단(다른 단계로 가기,
// 화면 떠나기)은 토큰을 올려 대기 중인 sleep이 Cancel을 던지게 하는 것으로 처리한다.
// 편집기 스크롤은 편집기 상자 안에서만 움직인다(페이지 스크롤은 건드리지 않는다).

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import type { ReactNode } from 'react';
import type { RefactorReplayData, ReplayStep } from '@/content/refactor-replays/types';

type LineKind = '' | 'mark' | 'del' | 'new';
type Line = { t: string; k: LineKind };

const LINE_CLASS: Record<LineKind, string> = {
  '': '',
  mark: 'bg-warn/15 dark:bg-warn-dark/20',
  del: 'bg-destructive/15 line-through decoration-destructive dark:bg-destructive-dark/20 dark:decoration-destructive-dark',
  new: 'bg-ok/15 dark:bg-ok-dark/20',
};

// 아주 작은 파이썬 하이라이터. 정확한 문법 분석이 아니라 읽기 쉬운 색 구분이 목적이다.
const TOKEN_RE =
  /(#.*$)|(f?"[^"]*"?|f?'[^']*'?)|\b(def|return|while|if|elif|else|in|not|and|or|break|import|True)\b|\b(\d+)\b|\b(ask|judge|print|input|str|int)\b(?=\()/g;

function Highlighted({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let i = 0;
  let m: RegExpExecArray | null;
  // 모듈 정규식의 lastIndex를 건드리지 않도록 줄마다 새로 만든다.
  const re = new RegExp(TOKEN_RE.source, 'g');
  while ((m = re.exec(text))) {
    if (m.index > i) parts.push(text.slice(i, m.index));
    const cls = m[1]
      ? 'text-muted dark:text-muted-dark'
      : m[2]
        ? 'text-ok dark:text-ok-dark'
        : m[3]
          ? 'text-accent dark:text-accent-dark'
          : m[4]
            ? 'text-warn dark:text-warn-dark'
            : 'text-action dark:text-action-dark';
    parts.push(
      <span key={m.index} className={cls}>
        {m[0]}
      </span>,
    );
    i = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex++;
  }
  if (i < text.length) parts.push(text.slice(i));
  return <>{parts}</>;
}

// [시작 줄, 끝 줄]의 위치. 끝 줄이 "a\nb"면 a 다음 줄이 b인 곳을 끝으로 본다.
function findRange(lines: string[], [a, b]: [string, string]): [number, number] {
  const s = lines.indexOf(a);
  const p = b.split('\n');
  for (let i = s; i < lines.length; i++) {
    if (lines[i] === p[0] && (p.length < 2 || lines[i + 1] === p[1])) return [s, i];
  }
  return [s, s];
}

function applyStep(prev: string[], step: ReplayStep): string[] {
  const L = prev.slice();
  for (const op of step.ops) {
    if ('mark' in op) continue;
    if ('after' in op) {
      L.splice(L.indexOf(op.after) + 1, 0, ...op.lines);
      continue;
    }
    const [s, e] = findRange(L, op.replace);
    L.splice(s, e - s + 1, ...op.lines);
  }
  return L;
}

class Cancel {}

const SPEEDS = [1, 2, 4] as const;

export function RefactorReplayPlayer({ data }: { data: RefactorReplayData }) {
  const { original, steps, doneSay } = data;
  const N = steps.length;
  const snaps = useMemo(() => {
    const out = [original];
    steps.forEach((st, i) => out.push(applyStep(out[i], st)));
    return out;
  }, [original, steps]);

  // 화면에 그릴 상태
  const [lines, setLines] = useState<Line[]>(() => original.map((t) => ({ t, k: '' })));
  const [cur, setCur] = useState(-1);
  // -1 = 시작 전(원래 코드), 0..N-1 = 단계, N = 완성
  const [header, setHeader] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(2);

  // 재생 루프가 읽고 쓰는 값
  const linesRef = useRef<Line[]>(lines);
  const curRef = useRef(-1);
  const stepRef = useRef(0);
  const tokenRef = useRef(0);
  const pausedRef = useRef(false);
  const speedRef = useRef(2);
  const edRef = useRef<HTMLDivElement>(null);
  const scrollTargetRef = useRef<number | null>(null);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  // 화면을 떠나면 진행 중인 재생을 멈춘다.
  useEffect(
    () => () => {
      tokenRef.current++;
    },
    [],
  );

  const paint = useCallback(() => {
    setLines(linesRef.current.map((l) => ({ ...l })));
    setCur(curRef.current);
  }, []);

  // 그린 뒤 스크롤: 세로는 요청된 줄을 가운데로, 가로는 커서를 따라간다.
  useLayoutEffect(() => {
    const ed = edRef.current;
    if (!ed) return;
    const target = scrollTargetRef.current;
    if (target !== null) {
      scrollTargetRef.current = null;
      const el = ed.querySelector<HTMLElement>(`[data-ln="${target}"]`);
      if (el) ed.scrollTop = Math.max(0, el.offsetTop - ed.clientHeight / 2 + 10);
    }
    const c = ed.querySelector<HTMLElement>('[data-cursor]');
    if (c) {
      const x = c.offsetLeft;
      if (x > ed.scrollLeft + ed.clientWidth - 40) ed.scrollLeft = x - ed.clientWidth + 80;
      else if (x < ed.scrollLeft + 50) ed.scrollLeft = Math.max(0, x - 200);
    } else {
      ed.scrollLeft = 0;
    }
  }, [lines, cur]);

  const scrollTo = (i: number) => {
    scrollTargetRef.current = i;
  };

  const sleep = useCallback(async (ms: number) => {
    const my = tokenRef.current;
    let left = ms / speedRef.current;
    while (left > 0) {
      if (my !== tokenRef.current) throw new Cancel();
      await new Promise((r) => setTimeout(r, Math.min(left, 40)));
      if (!pausedRef.current) left -= 40;
    }
    if (my !== tokenRef.current) throw new Cancel();
  }, []);

  const show = useCallback(
    (i: number) => {
      stepRef.current = i;
      linesRef.current = snaps[Math.min(i, N)].map((t) => ({ t, k: '' }));
      curRef.current = -1;
      setHeader(i);
      paint();
      if (edRef.current) edRef.current.scrollTop = 0;
    },
    [N, snaps, paint],
  );

  const stop = useCallback(() => {
    tokenRef.current++;
    setPlaying(false);
    setPaused(false);
  }, []);

  const typeLine = useCallback(
    async (at: number, text: string) => {
      const ind = text.match(/^ */)![0];
      linesRef.current.splice(at, 0, { t: ind, k: 'new' });
      curRef.current = at;
      scrollTo(at);
      paint();
      for (let c = ind.length; c < text.length; c++) {
        linesRef.current[at].t = text.slice(0, c + 1);
        paint();
        await sleep(text[c] === ' ' ? 10 : 24);
      }
      await sleep(60);
    },
    [paint, sleep],
  );

  const runStep = useCallback(
    async (i: number) => {
      linesRef.current = snaps[i].map((t) => ({ t, k: '' }));
      curRef.current = -1;
      setHeader(i);
      paint();
      const texts = () => linesRef.current.map((l) => l.t);
      for (const op of steps[i].ops) {
        if ('mark' in op) {
          const [s, e] = findRange(texts(), op.mark);
          for (let j = s; j <= e; j++) linesRef.current[j].k = 'mark';
          scrollTo(Math.round((s + e) / 2));
          paint();
          await sleep(2600);
          continue;
        }
        let at: number;
        if ('after' in op) {
          at = texts().indexOf(op.after) + 1;
          scrollTo(at);
          paint();
          await sleep(400);
        } else {
          const [s, e] = findRange(texts(), op.replace);
          for (let j = s; j <= e; j++) linesRef.current[j].k = 'del';
          scrollTo(Math.round((s + e) / 2));
          paint();
          await sleep(1300);
          for (let j = e; j >= s; j--) {
            linesRef.current.splice(j, 1);
            curRef.current = -1;
            paint();
            await sleep(e - s > 8 ? 45 : 120);
          }
          at = s;
        }
        for (let k = 0; k < op.lines.length; k++) await typeLine(at + k, op.lines[k]);
        curRef.current = -1;
        paint();
        await sleep(500);
      }
      await sleep(1400);
      linesRef.current.forEach((l) => (l.k = ''));
      paint();
    },
    [snaps, steps, paint, sleep, typeLine],
  );

  const play = useCallback(async () => {
    setPlaying(true);
    setPaused(false);
    try {
      if (stepRef.current >= N) show(0);
      for (; stepRef.current < N; stepRef.current++) await runStep(stepRef.current);
      show(N);
    } catch (e) {
      if (e instanceof Cancel) return;
      throw e;
    }
    setPlaying(false);
  }, [N, runStep, show]);

  const onPlay = () => {
    if (!playing) void play();
    else setPaused((p) => !p);
  };
  const go = (i: number) => {
    stop();
    show(i);
  };

  const title =
    header < 0 ? '원래 코드' : header >= N ? '완성' : `${header + 1}. ${steps[header].title}`;
  const say =
    header < 0
      ? '재생을 누르면 한 단계씩 고쳐 나가요. 위 단계 이름을 누르면 그 단계부터 볼 수 있어요.'
      : header >= N
        ? `${original.length}줄이 ${snaps[N].length}줄이 됐어요. ${doneSay}`
        : steps[header].say;
  const running = playing && !paused;
  const chips = [...steps.map((s) => s.title), '완성'];

  return (
    <div className="not-prose my-6 border border-line dark:border-line-dark" data-refactor-replay>
      <div className="flex flex-wrap gap-2 border-b border-line bg-surface-2 p-3 dark:border-line-dark dark:bg-surface-2-dark">
        {chips.map((c, i) => {
          const on = i === header;
          const done = header >= 0 && i < header;
          return (
            <button
              key={c}
              type="button"
              onClick={() => go(i)}
              aria-current={on ? 'step' : undefined}
              className={`tap-feedback min-h-11 border px-3 text-label ${
                on
                  ? 'border-accent bg-accent text-surface dark:border-accent-dark dark:bg-accent-dark dark:text-background-dark'
                  : done
                    ? 'border-line bg-surface text-foreground dark:border-line-dark dark:bg-surface-dark dark:text-foreground-dark'
                    : 'border-line bg-surface text-muted dark:border-line-dark dark:bg-surface-dark dark:text-muted-dark'
              }`}
            >
              {i + 1}. {c}
            </button>
          );
        })}
      </div>

      <div className="bg-surface px-4 pb-3 pt-4 dark:bg-surface-dark">
        <div className="flex items-baseline gap-3">
          <p className="text-subhead font-bold">{title}</p>
          <p className="text-label text-muted dark:text-muted-dark">{lines.length}줄</p>
        </div>
        <p className="mt-1 min-h-[3.3em] text-label text-muted dark:text-muted-dark" aria-live="polite">
          {say}
        </p>
      </div>

      <div
        ref={edRef}
        role="region"
        aria-label="리팩터링 중인 코드"
        tabIndex={0}
        className="relative h-[26rem] overflow-auto border-y border-line bg-surface py-2 font-mono text-[13px] leading-5 dark:border-line-dark dark:bg-surface-dark"
      >
        {lines.map((l, i) => (
          <div key={i} data-ln={i} className={`flex min-h-5 whitespace-pre pr-3 ${LINE_CLASS[l.k]}`}>
            <span className="w-10 shrink-0 select-none pr-3 text-right text-muted dark:text-muted-dark">
              {i + 1}
            </span>
            <span>
              <Highlighted text={l.t} />
              {i === cur && (
                <span
                  data-cursor
                  aria-hidden="true"
                  className="ml-px inline-block h-4 w-0.5 align-[-3px] bg-foreground motion-safe:animate-pulse dark:bg-foreground-dark"
                />
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-surface p-3 dark:bg-surface-dark">
        <button type="button" onClick={() => go(0)} className="btn tap-feedback text-label">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          처음부터
        </button>
        <button
          type="button"
          onClick={() => go(Math.max(stepRef.current - 1, 0))}
          aria-label="이전 단계"
          className="btn tap-feedback px-3 text-label"
        >
          <SkipBack className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={onPlay} className="btn-action tap-feedback min-w-24 text-label">
          {running ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4" aria-hidden="true" />
          )}
          {running ? '멈춤' : '재생'}
        </button>
        <button
          type="button"
          onClick={() => go(Math.min(header < 0 ? 1 : stepRef.current + 1, N))}
          aria-label="다음 단계"
          className="btn tap-feedback px-3 text-label"
        >
          <SkipForward className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="ml-auto flex items-center gap-1" role="group" aria-label="속도">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              aria-pressed={speed === s}
              className={`tap-feedback min-h-11 min-w-11 border text-label font-bold ${
                speed === s
                  ? 'border-foreground bg-foreground text-surface dark:border-foreground-dark dark:bg-foreground-dark dark:text-background-dark'
                  : 'border-line bg-surface text-muted dark:border-line-dark dark:bg-surface-dark dark:text-muted-dark'
              }`}
            >
              {s}배
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
