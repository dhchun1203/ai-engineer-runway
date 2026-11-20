"use client";

// 20회차 pandas 조건 거르기 시뮬레이터. 수업 가계부 spend 12행(값 수정 전)을 두고 조건 하나를 고르면
// 행마다 True/False(거름망)가 붙고, True인 행만 진하게 남는다. 남는 행 번호와 오류 문장은 같은 표를
// NumPy 2.5.5, pandas 3.1.1에서 실제로 실행해 확인한 결과를 그대로 적어 둔다.

import { useState } from "react";

type Row = { idx: number; day: number; shop: string; category: string; amount: number };

const SPEND: Row[] = [
  { idx: 0, day: 2, shop: "편의점", category: "식비", amount: 3200 },
  { idx: 1, day: 3, shop: "버스", category: "교통", amount: 1500 },
  { idx: 2, day: 4, shop: "영화관", category: "문화", amount: 15000 },
  { idx: 3, day: 5, shop: "분식집", category: "식비", amount: 6500 },
  { idx: 4, day: 7, shop: "온라인쇼핑", category: "쇼핑", amount: 32000 },
  { idx: 5, day: 9, shop: "카페", category: "식비", amount: 4800 },
  { idx: 6, day: 12, shop: "음원앱", category: "문화", amount: 10900 },
  { idx: 7, day: 14, shop: "버스", category: "교통", amount: 1500 },
  { idx: 8, day: 16, shop: "편의점", category: "식비", amount: 2700 },
  { idx: 9, day: 19, shop: "웹툰", category: "문화", amount: 3000 },
  { idx: 10, day: 20, shop: "온라인쇼핑", category: "쇼핑", amount: 18500 },
  { idx: 11, day: 25, shop: "분식집", category: "식비", amount: 7000 },
];

// 거름망 한 줄: 머리 이름과 True인 행 번호.
type Mask = { head: string; trues: number[] };

type Cond = {
  label: string;
  code: string;
  masks: Mask[];
  keep: number[];
  error?: string;
  why: string;
};

const FOOD: Mask = { head: "식비", trues: [0, 3, 5, 8, 11] };
const OVER_5000: Mask = { head: ">= 5000", trues: [2, 3, 4, 6, 10, 11] };

const CONDS: Cond[] = [
  {
    label: "== 문화",
    code: 'spend[spend["category"] == "문화"]',
    masks: [{ head: "== 문화", trues: [2, 6, 9] }],
    keep: [2, 6, 9],
    why: "행마다 '문화인가?'를 물어 True 세 개가 나왔어요. 행 번호 2, 6, 9가 원래 번호 그대로 따라와요.",
  },
  {
    label: ">= 10000",
    code: 'spend[spend["amount"] >= 10000]',
    masks: [{ head: ">= 10000", trues: [2, 4, 6, 10] }],
    keep: [2, 4, 6, 10],
    why: "숫자 비교도 똑같아요. 만 원 이상인 네 건이 남아요.",
  },
  {
    label: "!= 식비",
    code: 'spend[spend["category"] != "식비"]',
    masks: [{ head: "!= 식비", trues: [1, 2, 4, 6, 7, 9, 10] }],
    keep: [1, 2, 4, 6, 7, 9, 10],
    why: "!= 는 '같지 않다'예요. 식비 5건을 뺀 7건이 남아요.",
  },
  {
    label: "& 그리고",
    code: 'spend[(spend["category"] == "식비") & (spend["amount"] >= 5000)]',
    masks: [FOOD, OVER_5000, { head: "&", trues: [3, 11] }],
    keep: [3, 11],
    why: "두 거름망이 같은 행에서 모두 True일 때만 True예요. 카페 4800원은 식비지만 5000원이 안 돼서 빠져요.",
  },
  {
    label: "| 또는",
    code: 'spend[(spend["category"] == "식비") | (spend["amount"] >= 15000)]',
    masks: [FOOD, { head: ">= 15000", trues: [2, 4, 10] }, { head: "|", trues: [0, 2, 3, 4, 5, 8, 10, 11] }],
    keep: [0, 2, 3, 4, 5, 8, 10, 11],
    why: "둘 중 하나만 True여도 True예요. 식비 5건과 15000원 이상 3건이 합쳐져 8건이에요.",
  },
  {
    label: "and 로 이으면",
    code: 'spend[(spend["category"] == "식비") and (spend["amount"] >= 5000)]',
    masks: [FOOD, OVER_5000],
    keep: [],
    error:
      "ValueError: The truth value of a Series is ambiguous. Use a.empty, a.item(), a.any() or a.all().",
    why: "거름망 두 줄은 잘 만들어졌어요. 그런데 and 는 양쪽을 True 하나, False 하나로 보려고 해요. 12칸짜리 줄은 하나로 정할 수 없어서 멈춰요. 행마다 잇는 & 를 써요.",
  },
  {
    label: "괄호 빼면",
    code: 'spend[spend["category"] == "식비" & spend["amount"] >= 5000]',
    masks: [],
    keep: [],
    error: "TypeError: Cannot perform 'rand_' with a dtyped [int64] array and scalar of type [bool]",
    why: "& 가 == 와 >= 보다 먼저 계산돼요. 그래서 \"식비\" & spend[\"amount\"] 부터 하려다 막혀요. 거름망이 하나도 만들어지지 못해요. 조건마다 괄호로 감싸요.",
  },
];

export function PandasMaskSimulator() {
  const [pick, setPick] = useState(0);
  const cond = CONDS[pick];
  const keepSet = new Set(cond.keep);
  const maskSets = cond.masks.map((m) => new Set(m.trues));

  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
  const head = `border-b border-line text-left dark:border-line-dark ${muted}`;

  return (
    <div data-figure className="not-prose panel @container my-6 p-4 sm:p-5">
      <section className="flex flex-col gap-2" aria-label="조건 고르기">
        <h3 className="text-label font-bold">조건 고르기</h3>
        <div className="flex flex-wrap gap-1.5">
          {CONDS.map((c, i) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setPick(i)}
              aria-pressed={i === pick}
              className={`tap-feedback min-h-11 px-3 text-label font-mono ${i === pick ? "btn-action" : "btn"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-4 whitespace-pre-wrap break-words bg-surface-2 px-3 py-2 font-mono text-label font-semibold leading-relaxed dark:bg-surface-2-dark">
        {cond.code}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[30rem] font-mono text-label tabular-nums">
          <thead>
            <tr className={head}>
              <th className="py-1 pr-2 font-semibold"> </th>
              <th className="py-1 pr-2 font-semibold">day</th>
              <th className="py-1 pr-2 font-semibold">shop</th>
              <th className="py-1 pr-2 font-semibold">category</th>
              <th className="py-1 pr-3 text-right font-semibold">amount</th>
              {cond.masks.map((m) => (
                <th key={m.head} className="border-l border-line py-1 pl-2 pr-2 font-semibold dark:border-line-dark">
                  {m.head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SPEND.map((r) => {
              const on = keepSet.has(r.idx);
              return (
                <tr
                  key={r.idx}
                  className={`border-b border-line transition-opacity duration-200 last:border-b-0 dark:border-line-dark ${
                    on ? "bg-accent/10 font-semibold dark:bg-accent-dark/15" : cond.error ? "opacity-60" : "opacity-35"
                  }`}
                >
                  <td className="py-1 pr-2 text-accent dark:text-accent-dark">{r.idx}</td>
                  <td className="py-1 pr-2">{r.day}</td>
                  <td className="py-1 pr-2 font-sans">{r.shop}</td>
                  <td className="py-1 pr-2 font-sans">{r.category}</td>
                  <td className="py-1 pr-3 text-right">{r.amount}</td>
                  {maskSets.map((s, i) => {
                    const t = s.has(r.idx);
                    return (
                      <td
                        key={cond.masks[i].head}
                        className={`border-l border-line py-1 pl-2 pr-2 dark:border-line-dark ${
                          t ? "text-accent dark:text-accent-dark" : muted
                        }`}
                      >
                        {t ? "True" : "False"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-label leading-relaxed" aria-live="polite">
        {cond.error ? (
          <p className="whitespace-pre-wrap break-words border-l-2 border-destructive bg-destructive/8 px-3 py-2 font-mono text-destructive dark:border-destructive-dark dark:bg-destructive-dark/12 dark:text-destructive-dark">
            {cond.error}
          </p>
        ) : (
          <p className="font-mono font-semibold">{`${cond.keep.length}행이 남아요`}</p>
        )}
        <p className="mt-1">{cond.why}</p>
      </div>
      <p className={`mt-1 text-label ${muted}`}>
        오른쪽 칸이 거름망(True/False 줄)이에요. 진한 행이 결과에 나오는 행이에요.
      </p>
    </div>
  );
}
