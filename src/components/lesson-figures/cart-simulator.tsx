"use client";

// 12회차 쇼핑몰 장바구니 시뮬레이터. 완성 코드(cart.py, coupon.py)와 같은 규칙으로 움직인다.
// 버튼 하나가 cart.add(상품, 1), cart.remove(상품, 1), cart.apply_coupon(쿠폰), cart.checkout()
// 한 번이다. 출력 창의 문장은 파이썬 print와 글자까지 같게 두고, 왜 그렇게 됐는지는
// 뒤에 # 주석으로 붙인다.

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

type Product = { name: string; price: number; stock: number };
type Coupon = { name: string; discount: (total: number) => number };
type Line = { text: string; why?: string; tone?: "ok" | "warn" | "dim" };

const INIT: Product[] = [
  { name: "무선이어폰", price: 89_000, stock: 3 },
  { name: "텀블러", price: 15_000, stock: 10 },
  { name: "보조배터리", price: 32_000, stock: 5 },
  { name: "마우스패드", price: 9_000, stock: 0 },
  { name: "USB 허브", price: 30_000, stock: 10 },
];

const COUPONS: Coupon[] = [
  { name: "쿠폰 없음", discount: () => 0 },
  { name: "10% 할인 (최대 5,000원)", discount: (t) => Math.min(Math.floor(t * 0.1), 5_000) },
  { name: "3,000원 할인 (20,000원 이상 구매 시)", discount: (t) => (t >= 20_000 ? 3_000 : 0) },
];

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export function CartSimulator() {
  const [products, setProducts] = useState<Product[]>(() => INIT.map((p) => ({ ...p })));
  const [items, setItems] = useState<number[]>(() => INIT.map(() => 0)); // 상품 칸마다 담은 수량
  const [coupon, setCoupon] = useState(0);
  const [log, setLog] = useState<Line[]>([{ text: "cart = Cart()", tone: "dim" }]);
  const logRef = useRef<HTMLDivElement>(null);

  const say = (lines: Line[]) => {
    setLog((prev) => [...prev, ...lines].slice(-60));
    requestAnimationFrame(() => {
      const el = logRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const subtotal = items.reduce((s, q, i) => s + products[i].price * q, 0);
  const empty = items.every((q) => q === 0);
  const discount = COUPONS[coupon].discount(subtotal);
  const shipping = empty ? 0 : subtotal - discount >= 30_000 ? 0 : 3_000;
  const total = subtotal - discount + shipping;

  const add = (i: number) => {
    const p = products[i];
    if (p.stock === 0) return say([{ text: "품절된 상품입니다.", why: "is_sold_out() == True", tone: "warn" }]);
    const extra = p.stock - items[i];
    if (1 > extra)
      return say([
        { text: `재고가 부족합니다. (담을 수 있는 수량: ${extra}개)`, why: `재고 ${p.stock} - 담은 ${items[i]}`, tone: "warn" },
      ]);
    setItems((prev) => prev.map((q, j) => (j === i ? q + 1 : q)));
    say([{ text: `${p.name} 1개를 담았습니다.`, tone: "ok" }]);
  };

  const remove = (i: number) => {
    const p = products[i];
    if (items[i] === 0) return say([{ text: "장바구니에 해당 상품이 없습니다.", why: "product not in self.items", tone: "warn" }]);
    setItems((prev) => prev.map((q, j) => (j === i ? q - 1 : q)));
    if (items[i] <= 1) say([{ text: `${p.name}을 장바구니에서 모두 뺐습니다.`, why: "del self.items[product]" }]);
    else say([{ text: `${p.name} 1개를 뺐습니다.` }]);
  };

  const apply = (c: number) => {
    setCoupon(c);
    say([{ text: `[${COUPONS[c].name}] 쿠폰을 적용했습니다.`, why: "self.coupon = coupon" }]);
  };

  const checkout = () => {
    if (empty) return say([{ text: "장바구니가 비어있습니다.", why: "is_empty() -> return", tone: "warn" }]);
    const lines: Line[] = [{ text: "[영수증]" }];
    items.forEach((q, i) => {
      if (q > 0) lines.push({ text: `${products[i].name} x ${q} = ${won(products[i].price * q)}` });
    });
    lines.push({ text: `결제 금액 ${won(total)}`, why: `${won(subtotal)} - ${won(discount)} + ${won(shipping)}` });
    items.forEach((q, i) => {
      if (q > 0) lines.push({ text: `${products[i].name} 재고 ${products[i].stock} -> ${products[i].stock - q}`, why: "p.stock -= q", tone: "dim" });
    });
    lines.push({ text: "(장바구니 비우기, 쿠폰 없음으로 되돌리기)", why: "items.clear(), Coupon(\"쿠폰 없음\")", tone: "dim" });
    lines.push({ text: "결제가 완료되었습니다. 감사합니다!", tone: "ok" });
    setProducts((prev) => prev.map((p, i) => ({ ...p, stock: p.stock - items[i] })));
    setItems((prev) => prev.map(() => 0));
    setCoupon(0);
    say(lines);
  };

  const reset = () => {
    setProducts(INIT.map((p) => ({ ...p })));
    setItems(INIT.map(() => 0));
    setCoupon(0);
    setLog([{ text: "cart = Cart()", tone: "dim" }]);
  };

  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
  const toneClass = (t?: Line["tone"]) =>
    t === "ok" ? "text-ok dark:text-ok-dark" : t === "warn" ? "text-action dark:text-action-dark" : t === "dim" ? muted : "";

  return (
    <div data-figure className="not-prose panel @container my-6 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-1" aria-label="상품">
          <h3 className="text-label font-bold">상품 목록</h3>
          {products.map((p, i) => (
            <div key={p.name} className="flex items-center justify-between gap-2 border-b border-line py-1.5 last:border-b-0 dark:border-line-dark">
              <div className="min-w-0">
                <p className="truncate text-body font-semibold">{p.name}</p>
                <p className={`font-mono text-label ${muted}`}>
                  {won(p.price)}, {p.stock === 0 ? "품절" : `재고 ${p.stock}`}
                  {items[i] > 0 ? `, 담음 ${items[i]}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" onClick={() => add(i)} className="btn tap-feedback min-h-11 px-3 text-label" aria-label={`${p.name} 1개 담기`}>
                  담기
                </button>
                <button type="button" onClick={() => remove(i)} className="btn tap-feedback min-h-11 px-3 text-label" aria-label={`${p.name} 1개 빼기`}>
                  빼기
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="flex min-w-0 flex-col gap-4" aria-label="장바구니">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-label font-bold">self.items</h3>
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-label">
              <span>{"{"}</span>
              {items.every((q) => q === 0) ? <span className={muted}>(비어 있음)</span> : null}
              {items.map((q, i) =>
                q > 0 ? (
                  <span key={i} className="inline-flex border border-line dark:border-line-dark">
                    <span className="bg-action/8 px-2 py-0.5 text-action dark:bg-action-dark/12 dark:text-action-dark">{products[i].name}</span>
                    <span className="bg-accent/8 px-2 py-0.5 font-semibold text-accent dark:bg-accent-dark/12 dark:text-accent-dark">{q}</span>
                  </span>
                ) : null,
              )}
              <span>{"}"}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-label font-bold">쿠폰 (한 번에 1장)</h3>
            <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="쿠폰">
              {COUPONS.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  role="radio"
                  aria-checked={coupon === i}
                  onClick={() => apply(i)}
                  className={`tap-feedback min-h-11 border px-3 text-left text-label ${
                    coupon === i
                      ? "border-warn bg-warn/10 font-semibold dark:border-warn-dark dark:bg-warn-dark/15"
                      : "border-line dark:border-line-dark"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 font-mono text-label tabular-nums">
            <dt>subtotal()</dt>
            <dd className="text-right">{won(subtotal)}</dd>
            <dt>discount()</dt>
            <dd className="text-right">{discount > 0 ? `-${won(discount)}` : won(0)}</dd>
            <dt>shipping()</dt>
            <dd className="text-right">
              {won(shipping)}
              {!empty && shipping > 0 ? <span className={`ml-1 font-sans ${muted}`}>(할인 뒤 3만원 미만)</span> : null}
            </dd>
            <dt className="border-t border-line pt-1 font-semibold dark:border-line-dark">total()</dt>
            <dd className="border-t border-line pt-1 text-right font-semibold dark:border-line-dark">{won(total)}</dd>
          </dl>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={checkout} className="btn-action tap-feedback min-h-11 text-label">
              checkout()
            </button>
            <button type="button" onClick={reset} className="btn tap-feedback min-h-11 text-label">
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              처음부터
            </button>
          </div>
        </section>
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <h3 className="text-label font-bold">출력 (print)</h3>
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
