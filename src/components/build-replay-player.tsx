'use client';

// 빌드 재생기 본체. 빈 파일에서 시작해 단계마다
//   1) 이번에 지울 줄을 빨갛게 칠한 뒤 지우고
//   2) 새 줄을 초록으로 타이핑하고
//   3) 그 단계까지의 코드를 실행한 결과를 아래 실행 결과 창에 흘려 보내고
//   4) 객체 보드(상품, 장바구니 줄, 쿠폰, 금액)를 그 단계의 상태로 바꾼다.
// 실행 결과와 객체 상태는 데이터 파일에 미리 담긴 실제 실행 값이다(직접 계산하지 않는다).
//
// 재생 구조는 RefactorReplayPlayer와 같다: async 루프, 멈춤은 남은 대기 시간을 줄이지 않는 것으로,
// 중단(다른 단계로 가기, 화면 떠나기)은 토큰을 올려 대기 중인 sleep이 Cancel을 던지게 한다.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import type { ReactNode } from 'react';
import type { BuildBoardLabels, BuildGroup, BuildReplayData, BuildState } from '@/content/build-replays/types';

type LineKind = '' | 'new' | 'del';
type Line = { t: string; k: LineKind };
type ConsoleLine = { k: 'in' | 'out' | 'err'; t: string };
type Board = { state: BuildState; prev: BuildState | null; animate: boolean; key: number };

const LINE_CLASS: Record<LineKind, string> = {
  '': '',
  new: 'bg-ok/15 dark:bg-ok-dark/20',
  del: 'bg-destructive/15 line-through decoration-destructive dark:bg-destructive-dark/20 dark:decoration-destructive-dark',
};

const GROUP: Record<BuildGroup, { name: string; text: string; top: string }> = {
  product: { name: 'Product', text: 'text-accent dark:text-accent-dark', top: 'border-t-accent dark:border-t-accent-dark' },
  line: { name: 'CartLine', text: 'text-warn dark:text-warn-dark', top: 'border-t-warn dark:border-t-warn-dark' },
  cart: { name: 'Cart', text: 'text-action dark:text-action-dark', top: 'border-t-action dark:border-t-action-dark' },
  coupon: { name: 'Discount', text: 'text-ok dark:text-ok-dark', top: 'border-t-ok dark:border-t-ok-dark' },
  menu: { name: '메뉴', text: 'text-muted dark:text-muted-dark', top: 'border-t-muted dark:border-t-muted-dark' },
};

const EMPTY: BuildState = { nextNumber: null, products: [], holder: null, lines: [], coupon: null, totals: null };

// 아주 작은 파이썬 하이라이터. 정확한 문법 분석이 아니라 읽기 쉬운 색 구분이 목적이다.
const TOKEN_RE =
  /(#.*$)|(f?"[^"]*"?|f?'[^']*'?)|\b(class|def|return|while|for|if|elif|else|in|is|not|and|or|break|continue|None|True|False)\b|\b(\d[\d_]*(?:\.\d+)?)\b|\b(print|input|int|min|sum|len|enumerate|self|super)\b/g;

function Highlighted({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let i = 0;
  let m: RegExpExecArray | null;
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

/** 설명 문장의 `백틱`을 인라인 코드로 바꾼다. */
function Say({ text }: { text: string }) {
  return (
    <>
      {text.split(/`([^`]+)`/).map((part, i) =>
        i % 2 ? (
          <code
            key={i}
            className="border border-line bg-surface-2 px-1 font-mono text-foreground dark:border-line-dark dark:bg-surface-2-dark dark:text-foreground-dark"
          >
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

const won = (n: number) => n.toLocaleString('ko-KR');

const DEFAULT_LABELS: Required<BuildBoardLabels> = {
  counter: 'next_number',
  cart: 'Cart 객체, cart.lines',
  empty: 'lines = [] (비어 있음)',
  ptr: 'item',
  qty: 'qty',
  note: '점선은 장바구니 줄이 상품 객체를 가리킨다는 뜻이에요(복사가 아니에요).',
};

function ObjectBoard({ board, labels }: { board: Board; labels?: BuildBoardLabels }) {
  const L = { ...DEFAULT_LABELS, ...labels };
  const { state: s, prev, animate } = board;
  const P = prev ?? EMPTY;
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const refs = new Set(s.lines.map((l) => String(l.number ?? l.name)));
  const flash = (changed: boolean) => (animate && changed ? 'build-flash' : '');
  const enter = (isNew: boolean) => (animate && isNew ? 'build-enter' : '');

  // 장바구니 줄 → 상품 카드 점선. 화면 크기가 바뀌면 다시 그린다.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const svg = svgRef.current;
    if (!box || !svg) return;
    const draw = () => {
      const br = box.getBoundingClientRect();
      let d = '';
      box.querySelectorAll<HTMLElement>('[data-cline]').forEach((cl) => {
        const card = box.querySelector<HTMLElement>(`[data-pcard="${CSS.escape(cl.dataset.cline ?? '')}"]`);
        const ptr = cl.querySelector<HTMLElement>('[data-ptr]');
        const cart = cl.closest<HTMLElement>('[data-cartbox]');
        if (!card || !ptr || !cart) return;
        const a = ptr.getBoundingClientRect();
        const r = card.getBoundingClientRect();
        const c = cart.getBoundingClientRect();
        const x1 = a.left - br.left + 12;
        const y1 = c.top - br.top;
        const x2 = r.left - br.left + r.width / 2;
        const y2 = r.bottom - br.top + 2;
        const my = (y1 + y2) / 2;
        d += `<path d="M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}"/><circle cx="${x2}" cy="${y2}" r="3"/>`;
      });
      svg.innerHTML = d;
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(box);
    return () => ro.disconnect();
  }, [board]);

  if (!s.products.length) {
    return <p className="py-6 text-center text-label text-muted dark:text-muted-dark">아직 만든 객체가 없어요.</p>;
  }

  return (
    <div ref={boxRef} className="relative">
      <svg
        ref={svgRef}
        aria-hidden="true"
        className="build-links pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      />
      <div className="relative z-10 mb-2 flex flex-wrap items-center gap-2 text-label">
        <span className="font-mono font-semibold text-accent dark:text-accent-dark">class Product</span>
        {s.nextNumber !== null && (
          <span
            key={`nn-${board.key}`}
            className={`border border-dashed border-accent px-2 font-mono dark:border-accent-dark ${enter(P.nextNumber === null)}`}
          >
            {L.counter} = <b className="tabular-nums">{s.nextNumber}</b>
            <span className="text-muted dark:text-muted-dark"> (발급기)</span>
          </span>
        )}
      </div>
      <div className="relative z-10 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {s.products.map((p, i) => {
          const q = P.products[i];
          const changed = !!q && (q.stock !== p.stock || q.number !== p.number || q.hidden !== p.hidden || q.listed !== p.listed);
          const key = String(p.number ?? p.name);
          return (
            <div
              key={`${key}-${board.key}`}
              data-pcard={key}
              className={`min-w-0 border border-t-2 border-line bg-surface-2 px-2 py-1.5 font-mono text-label dark:border-line-dark dark:bg-surface-2-dark ${GROUP.product.top} ${
                refs.has(key) ? 'outline-2 outline-offset-1 outline-warn dark:outline-warn-dark' : ''
              } ${flash(changed)} ${enter(!q)}`}
            >
              <div className="flex items-baseline gap-1 font-sans">
                <span className={`shrink-0 font-semibold ${p.number !== null ? GROUP.product.text : 'text-muted dark:text-muted-dark'}`}>
                  #{p.number ?? '?'}
                </span>
                <span className="min-w-0 break-keep font-semibold leading-tight">{p.name}</span>
              </div>
              <div className="mt-1 flex justify-between gap-1 text-muted dark:text-muted-dark">
                <span>price</span>
                <span className="tabular-nums text-foreground dark:text-foreground-dark">{won(p.price)}</span>
              </div>
              <div className="flex justify-between gap-1 text-muted dark:text-muted-dark">
                <span>{p.hidden ? '__stock' : 'stock'}</span>
                <span className="tabular-nums text-foreground dark:text-foreground-dark">{p.stock}</span>
              </div>
              {p.listed && (
                <div
                  className={`mt-0.5 font-sans ${p.stock === 0 ? 'font-semibold text-destructive dark:text-destructive-dark' : 'text-muted dark:text-muted-dark'}`}
                >
                  {p.stock === 0 ? '(품절)' : `(재고 ${p.stock}개)`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {s.holder && (
        <div
          key={`cart-${board.key}`}
          data-cartbox
          className={`relative z-10 mt-8 border border-t-2 border-line bg-surface-2 p-2.5 dark:border-line-dark dark:bg-surface-2-dark ${
            s.holder === 'line' ? GROUP.line.top : GROUP.cart.top
          } ${enter(!P.holder)}`}
        >
          <p className="mb-2 font-mono text-label text-muted dark:text-muted-dark">
            {s.holder === 'line' ? (
              <>
                <b className={GROUP.line.text}>line</b> = CartLine 객체 하나
              </>
            ) : (
              <>
                <b className={GROUP.cart.text}>cart</b> = {L.cart}
              </>
            )}
          </p>
          {s.lines.length === 0 && (
            <p className="pb-1 font-mono text-label text-muted dark:text-muted-dark">{L.empty}</p>
          )}
          <div className="flex flex-col gap-1.5">
            {s.lines.map((l) => {
              const q = P.lines.find((x) => x.name === l.name);
              return (
                <div
                  key={`${l.name}-${board.key}`}
                  data-cline={String(l.number ?? l.name)}
                  className={`flex items-center gap-2 border border-l-2 border-line border-l-warn bg-surface px-2 py-1 text-label dark:border-line-dark dark:border-l-warn-dark dark:bg-surface-dark ${
                    q ? flash(q.qty !== l.qty) : enter(true)
                  }`}
                >
                  <span data-ptr className={`font-mono ${GROUP.line.text}`}>
                    {L.ptr}{l.number !== null ? ` → #${l.number}` : ''}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{l.name}</span>
                  <span className="font-mono tabular-nums">
                    {L.qty} <b className={GROUP.line.text}>{l.qty}</b>
                  </span>
                  <span className="font-mono tabular-nums">{won(l.subtotal)}원</span>
                </div>
              );
            })}
          </div>
          {s.coupon !== null && (
            <div
              className={`mt-1.5 flex items-center gap-2 border border-dashed border-ok px-2 py-1 text-label dark:border-ok-dark ${
                P.coupon === null ? enter(true) : flash(P.coupon !== s.coupon)
              }`}
            >
              <span className={`font-mono ${GROUP.coupon.text}`}>coupon →</span>
              <span>{s.coupon}</span>
            </div>
          )}
          {s.totals && (
            <table
              className={`mt-2 w-full text-label ${P.totals ? flash(JSON.stringify(P.totals) !== JSON.stringify(s.totals)) : enter(true)}`}
            >
              <tbody>
                {(
                  [
                    ['①', '상품 합계', `${won(s.totals.total)}원`],
                    ['②', '할인', s.totals.discount ? `-${won(s.totals.discount)}원` : '0원'],
                    ['③', '배송비', `${won(s.totals.ship)}원`],
                    ['④', '결제 금액', `${won(s.totals.pay)}원`],
                  ] as const
                ).map(([n, label, v], i) => (
                  <tr key={n} className={i === 3 ? 'font-bold' : 'border-b border-dotted border-line dark:border-line-dark'}>
                    <td className="w-6 py-0.5 text-muted dark:text-muted-dark">{n}</td>
                    <td className="py-0.5">{label}</td>
                    <td className="py-0.5 text-right font-mono tabular-nums">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {s.holder && (
        <p className="relative z-10 mt-2 text-label text-muted dark:text-muted-dark">
          {L.note}
        </p>
      )}
    </div>
  );
}

class Cancel {}

const SPEEDS = [1, 2, 4] as const;

export function BuildReplayPlayer({ data }: { data: BuildReplayData }) {
  const { file, blocks, steps, board: labels } = data;
  const N = steps.length;

  // 단계 s(1부터)에서 보이는 줄. kind: old = 전부터 있던 줄, new = 이번에 생긴 줄, gone = 이번에 지워지는 줄
  const trans = useMemo(
    () =>
      steps.map((_, i) => {
        const s = i + 1;
        const out: { t: string; kind: 'old' | 'new' | 'gone' }[] = [];
        for (const b of blocks) {
          const visible = b.from <= s && (b.until === undefined || s < b.until);
          const gone = b.until === s;
          if (!visible && !gone) continue;
          const kind = gone ? 'gone' : b.from === s ? 'new' : 'old';
          for (const t of b.lines) out.push({ t, kind });
        }
        return out;
      }),
    [blocks, steps],
  );
  const finalLines = useCallback(
    (i: number): Line[] => trans[i].filter((e) => e.kind !== 'gone').map((e) => ({ t: e.t, k: e.kind === 'new' ? 'new' : '' })),
    [trans],
  );
  const runLines = useCallback(
    (i: number): ConsoleLine[] =>
      steps[i].run.flatMap((e) => [
        { k: 'in' as const, t: e.code },
        ...(e.out ? e.out.split('\n').map((t) => ({ k: e.error ? ('err' as const) : ('out' as const), t })) : []),
      ]),
    [steps],
  );

  const [lines, setLines] = useState<Line[]>(() => finalLines(0));
  const [cur, setCur] = useState(-1);
  const [header, setHeader] = useState(0);
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>(() => runLines(0));
  const [board, setBoard] = useState<Board>({ state: steps[0].state, prev: null, animate: false, key: 0 });
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(2);
  const [progress, setProgress] = useState(1);

  const linesRef = useRef<Line[]>(lines);
  const curRef = useRef(-1);
  const stepRef = useRef(0);
  const tokenRef = useRef(0);
  const pausedRef = useRef(false);
  const speedRef = useRef(2);
  const boardKeyRef = useRef(0);
  const edRef = useRef<HTMLDivElement>(null);
  const conRef = useRef<HTMLDivElement>(null);
  const scrollTargetRef = useRef<number | null>(null);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
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

  // 편집기 스크롤은 편집기 상자 안에서만 움직인다(페이지 스크롤은 건드리지 않는다).
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

  useLayoutEffect(() => {
    const c = conRef.current;
    if (c) c.scrollTop = c.scrollHeight;
  }, [consoleLines]);

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

  const putBoard = useCallback((state: BuildState, prev: BuildState | null, animate: boolean) => {
    boardKeyRef.current++;
    setBoard({ state, prev, animate, key: boardKeyRef.current });
  }, []);

  /** 단계 i의 완성 화면으로 바로 간다(애니메이션 없음). */
  const show = useCallback(
    (i: number) => {
      stepRef.current = i;
      linesRef.current = finalLines(i);
      curRef.current = -1;
      setHeader(i);
      setProgress(1);
      paint();
      setConsoleLines(runLines(i));
      putBoard(steps[i].state, null, false);
      const first = linesRef.current.findIndex((l) => l.k === 'new');
      if (first >= 0) scrollTargetRef.current = first;
    },
    [finalLines, runLines, paint, putBoard, steps],
  );

  const stop = useCallback(() => {
    tokenRef.current++;
    setPlaying(false);
    setPaused(false);
  }, []);

  const runStep = useCallback(
    async (i: number) => {
      const prevState = i > 0 ? steps[i - 1].state : EMPTY;
      const T = trans[i].map((e) => ({ ...e, shown: e.kind !== 'new', typed: e.kind === 'new' ? '' : e.t, k: '' as LineKind }));
      const sync = () => {
        linesRef.current = T.filter((e) => e.shown).map((e) => ({ t: e.typed, k: e.k }));
      };
      const at = (idx: number) => T.slice(0, idx).filter((e) => e.shown).length;
      setHeader(i);
      setProgress(0);
      setConsoleLines([]);
      putBoard(prevState, null, false);
      curRef.current = -1;
      sync();
      paint();
      await sleep(500);

      // 1) 지울 줄
      const gone = T.map((e, idx) => (e.kind === 'gone' ? idx : -1)).filter((x) => x >= 0);
      if (gone.length) {
        gone.forEach((idx) => (T[idx].k = 'del'));
        scrollTargetRef.current = at(gone[0]);
        sync();
        paint();
        await sleep(1600);
        for (const idx of gone.reverse()) {
          T[idx].shown = false;
          sync();
          paint();
          await sleep(140);
        }
      }

      // 2) 새 줄 타이핑. 줄이 많은 단계는 한 줄을 더 적은 번에 나눠 친다.
      const news = T.map((e, idx) => (e.kind === 'new' ? idx : -1)).filter((x) => x >= 0);
      const totalChars = news.reduce((n, idx) => n + T[idx].t.length, 0);
      const pieces = totalChars > 1500 ? 2 : totalChars > 600 ? 4 : 8;
      for (let n = 0; n < news.length; n++) {
        const e = T[news[n]];
        e.shown = true;
        e.k = 'new';
        const ind = e.t.match(/^ */)![0];
        e.typed = ind;
        const row = at(news[n]);
        curRef.current = row;
        scrollTargetRef.current = row;
        sync();
        paint();
        const body = e.t.length - ind.length;
        const chunk = Math.max(1, Math.ceil(body / pieces));
        for (let c = ind.length; c < e.t.length; c += chunk) {
          e.typed = e.t.slice(0, Math.min(e.t.length, c + chunk));
          sync();
          paint();
          await sleep(26);
        }
        setProgress(((n + 1) / Math.max(1, news.length)) * 0.6);
      }
      curRef.current = -1;
      paint();
      await sleep(600);

      // 3) 실행 결과
      const big = steps[i].run.some((r) => r.out.split('\n').length > 40);
      const out: ConsoleLine[] = [];
      for (const r of steps[i].run) {
        out.push({ k: 'in', t: r.code });
        setConsoleLines([...out]);
        await sleep(450);
        if (r.out) {
          for (const t of r.out.split('\n')) {
            out.push({ k: r.error ? 'err' : 'out', t });
            setConsoleLines([...out]);
            await sleep(big ? 22 : 140);
          }
        }
        await sleep(300);
      }
      setProgress(0.85);

      // 4) 객체 보드
      putBoard(steps[i].state, prevState, true);
      setProgress(1);
      await sleep(3200);
    },
    [steps, trans, paint, sleep, putBoard],
  );

  const play = useCallback(
    async (from: number) => {
      setPlaying(true);
      setPaused(false);
      try {
        for (stepRef.current = from; stepRef.current < N; stepRef.current++) await runStep(stepRef.current);
        stepRef.current = N - 1;
      } catch (e) {
        if (e instanceof Cancel) return;
        throw e;
      }
      setPlaying(false);
    },
    [N, runStep],
  );

  const onPlay = () => {
    if (!playing) {
      tokenRef.current++;
      void play(header >= N - 1 && progress >= 1 && stepRef.current >= N - 1 ? 0 : header);
    } else setPaused((p) => !p);
  };
  const go = (i: number) => {
    stop();
    show(Math.max(0, Math.min(N - 1, i)));
  };

  const step = steps[header];
  const g = GROUP[step.group];
  const running = playing && !paused;
  const railEnd = (header + progress) / N;

  return (
    <div className="not-prose my-6 border border-line bg-surface dark:border-line-dark dark:bg-surface-dark" data-build-replay>
      <nav aria-label="만드는 단계" className="relative flex border-b border-line px-1 dark:border-line-dark">
        {steps.map((s, i) => {
          const on = i === header;
          return (
            <button
              key={s.short}
              type="button"
              onClick={() => go(i)}
              aria-label={`${i + 1}단계. ${s.short}`}
              title={`${i + 1}. ${s.short}`}
              aria-current={on ? 'step' : undefined}
              className={`replay-cell tap-feedback flex min-h-11 min-w-0 flex-1 items-center justify-center ${
                on || i < header
                  ? 'text-foreground dark:text-foreground-dark'
                  : 'text-muted hover:text-foreground dark:text-muted-dark dark:hover:text-foreground-dark'
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 items-center justify-center text-label font-semibold tabular-nums ${
                  on ? 'bg-foreground text-background dark:bg-foreground-dark dark:text-background-dark' : ''
                }`}
              >
                {i + 1}
              </span>
            </button>
          );
        })}
        <span aria-hidden="true" className="replay-rail" style={{ transform: `scaleX(${railEnd})` }} />
      </nav>

      <div className="px-4 pb-3 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`border border-current px-1.5 font-mono text-label font-semibold ${g.text}`}>{g.name}</span>
          <span className="text-label text-muted dark:text-muted-dark">{step.concept}</span>
          <span className="ml-auto shrink-0 text-label tabular-nums text-muted dark:text-muted-dark">
            {header + 1} / {N}, {lines.length}줄
          </span>
        </div>
        <p className="mt-2 text-subhead font-bold">
          {header + 1}. {step.title}
        </p>
        <p className="mt-1 text-label text-muted dark:text-muted-dark" aria-live="polite">
          <Say text={step.say} />
        </p>
        <details key={header} className="mt-3 border-l-2 border-warn pl-3 text-label dark:border-warn-dark">
          <summary className="tap-feedback flex min-h-11 cursor-pointer items-center font-semibold">
            생각해 보기: <span className="ml-1 font-normal"><Say text={step.think.q} /></span>
          </summary>
          <p className="pb-1 text-muted dark:text-muted-dark">
            <Say text={step.think.a} />
          </p>
        </details>
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-1.5 font-mono text-label text-muted dark:border-line-dark dark:text-muted-dark">
        <span>{file}</span>
        <span className="flex gap-3 font-sans">
          <span className="flex items-center gap-1">
            <i aria-hidden="true" className="inline-block h-2.5 w-2.5 bg-ok dark:bg-ok-dark" />
            이번에 추가
          </span>
          <span className="flex items-center gap-1">
            <i aria-hidden="true" className="inline-block h-2.5 w-2.5 bg-destructive dark:bg-destructive-dark" />
            이번에 삭제
          </span>
        </span>
      </div>
      <div
        ref={edRef}
        role="region"
        aria-label="쌓이고 있는 코드"
        tabIndex={0}
        className="relative h-96 overflow-auto border-y border-line bg-surface py-2 font-mono text-label leading-5 dark:border-line-dark dark:bg-surface-dark"
      >
        {lines.map((l, i) => (
          <div key={i} data-ln={i} className={`flex min-h-5 whitespace-pre pr-3 ${LINE_CLASS[l.k]}`}>
            <span className="w-10 shrink-0 select-none pr-3 text-right text-muted dark:text-muted-dark">{i + 1}</span>
            <span>
              <Highlighted text={l.t} />
              {i === cur && (
                <span
                  data-cursor
                  aria-hidden="true"
                  className="ml-px inline-block h-4 w-0.5 bg-foreground align-middle motion-safe:animate-pulse dark:bg-foreground-dark"
                />
              )}
            </span>
          </div>
        ))}
      </div>

      <div>
        <section aria-label="객체 보드" className="min-w-0 border-b border-line p-3 dark:border-line-dark">
          <p className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-label font-bold">객체 보드</span>
            <span className="text-label text-muted dark:text-muted-dark">이 단계 코드를 실행한 뒤의 상태</span>
          </p>
          <ObjectBoard board={board} labels={labels} />
        </section>
        <section aria-label="실행 결과" className="min-w-0 border-b border-line p-3 dark:border-line-dark">
          <p className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-label font-bold">실행 결과</span>
            <span className="text-label text-muted dark:text-muted-dark">
              {header === N - 1 ? '발제의 실행 예시대로 입력' : '이 단계 코드로 돌려 본 것'}
            </span>
          </p>
          <div
            ref={conRef}
            className="build-console h-64 overflow-auto border border-line bg-surface-2 p-2 font-mono text-label leading-5 dark:border-line-dark dark:bg-surface-2-dark"
          >
            {consoleLines.length === 0 && (
              <p className="text-muted dark:text-muted-dark">코드가 다 쌓이면 실행 결과가 나와요.</p>
            )}
            {consoleLines.map((c, i) => (
              <div
                key={i}
                className={`whitespace-pre ${
                  c.k === 'in'
                    ? 'text-accent dark:text-accent-dark'
                    : c.k === 'err'
                      ? 'text-destructive dark:text-destructive-dark'
                      : ''
                }`}
              >
                {c.k === 'in' && <span className="select-none text-muted dark:text-muted-dark">{'>>> '}</span>}
                {c.t || ' '}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-surface p-3 dark:bg-surface-dark">
        <button type="button" onClick={() => go(0)} className="btn tap-feedback text-label">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          처음부터
        </button>
        <button type="button" onClick={() => go(header - 1)} aria-label="이전 단계" className="btn tap-feedback px-3 text-label">
          <SkipBack className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={onPlay} className="btn-action tap-feedback min-w-24 text-label">
          {running ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          {running ? '멈춤' : '재생'}
        </button>
        <button type="button" onClick={() => go(header + 1)} aria-label="다음 단계" className="btn tap-feedback px-3 text-label">
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
