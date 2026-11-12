"use client";

// 9회차 인스턴스 시뮬레이터. 위는 SmartPhone 인스턴스 두 개(phone_a, phone_b)를 따로 충전해
// 인스턴스마다 자기 battery를 가진다는 것을, 아래는 bucket 리스트를 __init__ 안에 만들 때와
// 클래스 바로 아래에 만들 때 x, y 카트가 어떻게 달라지는지 보여 준다. 출력 창의 문장은
// 레슨의 SmartPhone.charge()가 찍는 글자 그대로다(파이썬 3.13으로 확인).

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

type Line = { text: string; why?: string; tone?: "ok" | "dim" };
type Phone = { key: "phone_a" | "phone_b"; model: string; battery: number };
type Mode = "init" | "class";

const PHONES: Phone[] = [
  { key: "phone_a", model: "아이폰", battery: 50 },
  { key: "phone_b", model: "갤럭시", battery: 50 },
];

const START: Line[] = [
  { text: 'phone_a = SmartPhone("아이폰")', tone: "dim" },
  { text: 'phone_b = SmartPhone("갤럭시")', tone: "dim" },
  { text: "x = ShoppingCart()", tone: "dim" },
  { text: "y = ShoppingCart()", tone: "dim" },
];

const cartClass = (m: Mode) => (m === "init" ? "ShoppingCart" : "SharedCart");
const show = (list: string[]) => `[${list.map((s) => `'${s}'`).join(", ")}]`;

export function InstanceSimulator() {
  const [phones, setPhones] = useState<Phone[]>(() => PHONES.map((p) => ({ ...p })));
  const [mode, setMode] = useState<Mode>("init");
  const [xBucket, setXBucket] = useState<string[]>([]);
  const [yBucket, setYBucket] = useState<string[]>([]);
  const [shared, setShared] = useState<string[]>([]);
  const [log, setLog] = useState<Line[]>(START);
  const logRef = useRef<HTMLDivElement>(null);

  const say = (lines: Line[]) => {
    setLog((prev) => [...prev, ...lines].slice(-60));
    requestAnimationFrame(() => {
      const el = logRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  // SmartPhone.charge(amount)와 같은 규칙: 더한 뒤 100을 넘으면 100으로 맞추고 "완료".
  const charge = (i: number, amount: number) => {
    const p = phones[i];
    const raw = p.battery + amount;
    const over = raw > 100;
    const next = over ? 100 : raw;
    setPhones((prev) => prev.map((q, j) => (j === i ? { ...q, battery: next } : q)));
    say([
      { text: `${p.key}.charge(${amount})`, why: `self는 ${p.key}`, tone: "dim" },
      over
        ? { text: `배터리 충전 완료 : ${next}%`, why: `${p.battery} + ${amount} = ${raw}, 100을 넘어서 100으로`, tone: "ok" }
        : { text: `배터리 충전 중 ... : ${next}%`, why: `${p.battery} + ${amount} = ${raw}` },
    ]);
  };

  const xList = mode === "init" ? xBucket : shared;
  const yList = mode === "init" ? yBucket : shared;

  const addItem = (who: "x" | "y", item: string) => {
    if (mode === "class") {
      setShared((prev) => [...prev, item]);
      say([{ text: `${who}.add_item("${item}")`, why: "SharedCart.bucket 하나에 담겨요", tone: "dim" }]);
      return;
    }
    if (who === "x") setXBucket((prev) => [...prev, item]);
    else setYBucket((prev) => [...prev, item]);
    say([{ text: `${who}.add_item("${item}")`, why: `${who} 자기 리스트에만 담겨요`, tone: "dim" }]);
  };

  const printBuckets = () => {
    say([
      { text: "print(x.bucket)", tone: "dim" },
      { text: show(xList) },
      { text: "print(y.bucket)", tone: "dim" },
      { text: show(yList) },
      { text: "print(x.bucket is y.bucket)", tone: "dim" },
      { text: mode === "class" ? "True" : "False", why: mode === "class" ? "같은 리스트 하나" : "리스트가 따로 둘" },
    ]);
  };

  // 카트를 새로 만든다. ShoppingCart는 __init__이 새 리스트를 주니 비어서 시작하고,
  // SharedCart는 클래스에 붙은 리스트가 그대로라 전에 담은 것이 남아 있다(파이썬과 같음).
  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    setXBucket([]);
    setYBucket([]);
    const why =
      m === "class" && shared.length > 0 ? "새로 만들어도 SharedCart.bucket은 전에 담은 그대로예요" : undefined;
    say([
      { text: `x = ${cartClass(m)}()`, tone: "dim" },
      { text: `y = ${cartClass(m)}()`, why, tone: "dim" },
    ]);
  };

  const reset = () => {
    setPhones(PHONES.map((p) => ({ ...p })));
    setMode("init");
    setXBucket([]);
    setYBucket([]);
    setShared([]);
    setLog(START);
  };

  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
  const toneClass = (t?: Line["tone"]) => (t === "ok" ? "text-ok dark:text-ok-dark" : t === "dim" ? muted : "");

  return (
    <div data-figure className="not-prose panel @container my-6 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2" aria-label="스마트폰 인스턴스">
          <h3 className="text-label font-bold">SmartPhone 인스턴스 두 개</h3>
          {phones.map((p, i) => (
            <div key={p.key} className="flex flex-col gap-1.5 border border-line p-3 dark:border-line-dark">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-mono text-body font-semibold text-action dark:text-action-dark">{p.key}</p>
                <p className={`text-label ${muted}`}>model: {p.model}</p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-3 flex-1 bg-surface-2 dark:bg-surface-2-dark"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={p.battery}
                  aria-label={`${p.key} 배터리`}
                >
                  <div className="h-full bg-ok dark:bg-ok-dark" style={{ width: `${p.battery}%` }} />
                </div>
                <span className="w-24 shrink-0 text-right font-mono text-label tabular-nums">battery {p.battery}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[10, 30].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => charge(i, amt)}
                    className="btn tap-feedback min-h-11 px-3 font-mono text-label"
                    aria-label={`${p.key} ${amt} 충전`}
                  >
                    charge({amt})
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="flex min-w-0 flex-col gap-2" aria-label="카트 인스턴스">
          <h3 className="text-label font-bold">bucket 리스트를 어디에 만들까</h3>
          <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="bucket을 만드는 곳">
            {(
              [
                ["init", "__init__ 안: self.bucket = []"],
                ["class", "클래스 바로 아래: bucket = []"],
              ] as [Mode, string][]
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => switchMode(m)}
                className={`tap-feedback min-h-11 border px-3 text-left font-mono text-label ${
                  mode === m
                    ? "border-warn bg-warn/10 font-semibold dark:border-warn-dark dark:bg-warn-dark/15"
                    : "border-line dark:border-line-dark"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <dl className="flex flex-col gap-1 font-mono text-label">
            {(
              [
                ["x.bucket", xList],
                ["y.bucket", yList],
              ] as [string, string[]][]
            ).map(([name, list]) => (
              <div key={name} className="flex flex-wrap items-center gap-2">
                <dt className="font-semibold">{name}</dt>
                <dd className="break-all">= {show(list)}</dd>
              </div>
            ))}
            <p className={`font-sans ${muted}`}>
              {mode === "class" ? "x와 y가 클래스에 붙은 리스트 하나를 같이 써요" : "x와 y가 자기 리스트를 따로 가져요"}
            </p>
          </dl>

          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => addItem("x", "초코파이")} className="btn tap-feedback min-h-11 px-3 font-mono text-label">
              x.add_item(&quot;초코파이&quot;)
            </button>
            <button type="button" onClick={() => addItem("y", "새우깡")} className="btn tap-feedback min-h-11 px-3 font-mono text-label">
              y.add_item(&quot;새우깡&quot;)
            </button>
            <button type="button" onClick={printBuckets} className="btn-action tap-feedback min-h-11 font-mono text-label">
              print(...)
            </button>
          </div>
        </section>
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-label font-bold">출력 (print)</h3>
          <button type="button" onClick={reset} className="btn tap-feedback min-h-11 text-label">
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
            처음부터
          </button>
        </div>
        <div
          ref={logRef}
          aria-live="polite"
          className="flex h-44 flex-col gap-0.5 overflow-y-auto bg-surface-2 px-3 py-2 font-mono text-label leading-relaxed dark:bg-surface-2-dark"
        >
          {log.map((l, i) => (
            <div key={i} className={toneClass(l.tone)}>
              {l.text}
              {l.why ? <span className={muted}>{`  # ${l.why}`}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
