"use client";

// 6회차 슬라이싱 탐색기. numbers = [0, 1, 2, 3, 4, 5]에 시작, 끝, 간격을 골라
// numbers[시작:끝:간격]이 어떤 칸을 어떤 순서로 꺼내는지 보여 준다. 칸 계산은 CPython의
// slice.indices()와 같은 규칙(음수 보정, 범위 밖 자르기, 간격 0이면 ValueError)이다.

import { useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

const NUMBERS = [0, 1, 2, 3, 4, 5];
const LEN = NUMBERS.length;

type Part = number | null; // null = 비움(기본값)

// CPython PySlice_Unpack + PySlice_AdjustIndices와 같은 계산. 간격 0은 null을 돌려준다.
export function sliceIndices(start: Part, stop: Part, step: Part, len: number): number[] | null {
  const st = step ?? 1;
  if (st === 0) return null;
  const clamp = (v: Part, dflt: number) => {
    if (v === null) return dflt;
    let x = v;
    if (x < 0) {
      x += len;
      if (x < 0) x = st < 0 ? -1 : 0;
    } else if (x >= len) {
      x = st < 0 ? len - 1 : len;
    }
    return x;
  };
  const a = clamp(start, st < 0 ? len - 1 : 0);
  const b = clamp(stop, st < 0 ? -1 : len);
  const out: number[] = [];
  if (st > 0) for (let i = a; i < b; i += st) out.push(i);
  else for (let i = a; i > b; i += st) out.push(i);
  return out;
}

const fmt = (v: Part) => (v === null ? "" : String(v));
const exprOf = (a: Part, b: Part, c: Part) => `numbers[${fmt(a)}:${fmt(b)}${c === null ? "" : `:${c}`}]`;

const PRESETS: { a: Part; b: Part; c: Part; note: string }[] = [
  { a: 1, b: 4, c: null, note: "1번부터 4번 미만까지" },
  { a: null, b: null, c: 2, note: "2칸씩 간격으로" },
  { a: null, b: null, c: -1, note: "역순으로" },
  { a: null, b: 3, c: null, note: "앞에서 3개만" },
  { a: 3, b: null, c: null, note: "3번부터 끝까지" },
];

function Stepper({
  label,
  value,
  min,
  max,
  start,
  onChange,
}: {
  label: string;
  value: Part;
  min: number;
  max: number;
  start: number; // 비움에서 +나 -를 누르면 이 숫자부터
  onChange: (v: Part) => void;
}) {
  const dec = () => onChange(value === null ? start : Math.max(min, value - 1));
  const inc = () => onChange(value === null ? start : Math.min(max, value + 1));
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label font-bold">{label}</span>
      <div className="flex items-stretch gap-1">
        <button type="button" onClick={dec} disabled={value !== null && value <= min} className="btn tap-feedback min-h-11 px-3" aria-label={`${label} 1 줄이기`}>
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="flex min-h-11 min-w-14 items-center justify-center border border-line px-2 font-mono text-body font-semibold dark:border-line-dark">
          {value === null ? "비움" : value}
        </span>
        <button type="button" onClick={inc} disabled={value !== null && value >= max} className="btn tap-feedback min-h-11 px-3" aria-label={`${label} 1 늘리기`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={value === null}
          className="btn tap-feedback min-h-11 px-3 text-label"
          aria-label={`${label} 비우기`}
        >
          비움
        </button>
      </div>
    </div>
  );
}

export function SliceExplorer() {
  const [a, setA] = useState<Part>(1);
  const [b, setB] = useState<Part>(4);
  const [c, setC] = useState<Part>(null);

  const picked = sliceIndices(a, b, c, LEN);
  const order = new Map<number, number>();
  picked?.forEach((idx, n) => order.set(idx, n + 1));
  const result = picked === null ? null : `[${picked.map((i) => NUMBERS[i]).join(", ")}]`;

  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";

  return (
    <div data-figure className="not-prose panel my-6 flex flex-col gap-5 p-4 sm:p-5">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-label font-bold">표의 다섯 식</h3>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const on = p.a === a && p.b === b && p.c === c;
            return (
              <button
                key={exprOf(p.a, p.b, p.c)}
                type="button"
                onClick={() => {
                  setA(p.a);
                  setB(p.b);
                  setC(p.c);
                }}
                aria-pressed={on}
                aria-label={`${exprOf(p.a, p.b, p.c)}, ${p.note}`}
                className={`tap-feedback min-h-11 border px-3 font-mono text-label ${
                  on ? "border-accent bg-accent/10 font-semibold dark:border-accent-dark dark:bg-accent-dark/15" : "border-line dark:border-line-dark"
                }`}
              >
                {exprOf(p.a, p.b, p.c)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Stepper label="시작" value={a} min={-8} max={9} start={0} onChange={setA} />
        <Stepper label="끝" value={b} min={-8} max={9} start={0} onChange={setB} />
        <Stepper label="간격" value={c} min={-3} max={3} start={1} onChange={setC} />
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setA(null);
              setB(null);
              setC(null);
            }}
            className="btn tap-feedback min-h-11 text-label"
          >
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
            모두 비우기
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-mono text-body font-semibold">{exprOf(a, b, c)}</p>
        <div className="grid grid-cols-6 gap-1.5" role="list" aria-label="numbers의 칸">
          {NUMBERS.map((v, i) => {
            const n = order.get(i);
            return (
              <div
                key={i}
                role="listitem"
                aria-label={`${i}번 칸 값 ${v}${n ? `, ${n}번째로 꺼냄` : ""}`}
                className={`flex flex-col items-center gap-0.5 border-2 px-1 py-2 font-mono ${
                  n
                    ? "border-accent bg-accent/8 dark:border-accent-dark dark:bg-accent-dark/12"
                    : "border-line dark:border-line-dark"
                }`}
              >
                <span className={`text-label ${muted}`}>[{i}]</span>
                <span className={`text-heading font-semibold ${n ? "text-accent dark:text-accent-dark" : ""}`}>{v}</span>
                <span className={`text-label ${muted}`}>[{i - LEN}]</span>
                <span
                  className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-label font-semibold ${
                    n ? "bg-accent text-surface dark:bg-accent-dark dark:text-background-dark" : ""
                  }`}
                  aria-hidden="true"
                >
                  {n ?? ""}
                </span>
              </div>
            );
          })}
        </div>
        <p className={`text-label ${muted}`}>칸 위는 앞에서 센 번호, 아래는 뒤에서 센 번호예요. 동그라미는 꺼내는 순서예요.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-label font-bold">출력 (print)</h3>
        <div aria-live="polite" className="bg-surface-2 px-3 py-2 font-mono text-label leading-relaxed dark:bg-surface-2-dark">
          {result === null ? (
            <span className="text-action dark:text-action-dark">ValueError: slice step cannot be zero</span>
          ) : (
            <>
              {result}
              {picked && picked.length === 0 ? <span className={muted}>{"  # 꺼낼 칸이 없어서 빈 리스트"}</span> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
