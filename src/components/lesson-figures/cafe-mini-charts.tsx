"use client";

// 미니 프로젝트(카페 세 지점 2주 주문 분석) 그림 두 개. 숫자는 public/downloads/cafe-seed.sql을
// postgres:18 + pandas 3.1.1로 실제 실행한 결과를 그대로 옮겼다(by_hour, 단체 주문 뺀 지점 합계).

import { useState } from "react";

const MUTED = "text-badge-neutral-text dark:text-badge-neutral-text-dark";

// ---- 1. 시간대별 주문 수 (by_hour 표)
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const BY_HOUR: Record<string, number[]> = {
  성수점: [2, 7, 13, 22, 30, 26, 28, 30, 38, 22, 20, 11, 3, 1],
  연남점: [0, 0, 1, 9, 19, 26, 26, 29, 20, 23, 20, 12, 16, 11],
  판교점: [43, 43, 16, 16, 39, 31, 18, 16, 15, 9, 3, 0, 0, 0],
};
const HOUR_NOTE: Record<string, string> = {
  성수점: "점심부터 늘어 오후 4시(16시)에 가장 붐벼요. 아침과 밤은 한산해요.",
  연남점: "낮 12시 전에는 거의 없고, 오후 내내 고르게 들어와요. 밤 8, 9시에도 주문이 이어져요.",
  판교점: "출근 시간 8, 9시와 점심 12시에 몰리고, 저녁 7시 뒤로는 0건이에요. 8시와 9시가 43건으로 같아서 idxmax()는 먼저 나온 8시를 골라요.",
};

export function CafeHourChart() {
  const stores = Object.keys(BY_HOUR);
  const [store, setStore] = useState(stores[2]);
  const counts = BY_HOUR[store];
  const max = Math.max(...counts);
  const peak = counts.indexOf(max);

  return (
    <div data-figure className="not-prose panel my-6 p-4 sm:p-5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="지점 고르기">
        {stores.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStore(s)}
            aria-pressed={s === store}
            className={`tap-feedback min-h-11 px-4 text-label font-semibold ${s === store ? "btn-action" : "btn"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-5 flex h-44 items-end gap-1 sm:gap-1.5" role="img" aria-label={`${store} 시간대별 주문 수`}>
        {counts.map((c, i) => (
          <div key={HOURS[i]} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className={`font-mono text-[11px] tabular-nums leading-none ${i === peak ? "font-bold" : MUTED}`}>{c}</span>
            <div
              className={`w-full rounded-t-[4px] transition-[height] duration-300 ease-out ${
                i === peak ? "bg-accent dark:bg-accent-dark" : "bg-accent/35 dark:bg-accent-dark/35"
              }`}
              style={{ height: `${max ? (c / max) * 100 : 0}%`, minHeight: c > 0 ? 2 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1 border-t border-line pt-1 dark:border-line-dark sm:gap-1.5">
        {HOURS.map((h) => (
          <span key={h} className={`min-w-0 flex-1 text-center font-mono text-[11px] tabular-nums ${MUTED}`}>
            {h}
          </span>
        ))}
      </div>
      <p className={`mt-1 text-right text-label ${MUTED}`}>시(hour)</p>

      <p className="mt-2 text-label leading-relaxed" aria-live="polite">
        <strong>{store}</strong> 가장 바쁜 시간은 <strong className="font-mono">{HOURS[peak]}시</strong>({max}건)예요. {HOUR_NOTE[store]}
      </p>
    </div>
  );
}

// ---- 2. 단체 주문 세 건을 빼면 1위가 바뀐다
type StoreRow = { store: string; revenue: number; orders: number; avg: number };
const WITH_BULK: StoreRow[] = [
  { store: "판교점", revenue: 2305700, orders: 249, avg: 9260 },
  { store: "성수점", revenue: 2200000, orders: 253, avg: 8696 },
  { store: "연남점", revenue: 2009700, orders: 212, avg: 9480 },
];
const WITHOUT_BULK: StoreRow[] = [
  { store: "성수점", revenue: 2200000, orders: 253, avg: 8696 },
  { store: "판교점", revenue: 2079200, orders: 246, avg: 8452 },
  { store: "연남점", revenue: 2009700, orders: 212, avg: 9480 },
];

export function CafeBulkToggle() {
  const [drop, setDrop] = useState(false);
  const rows = drop ? WITHOUT_BULK : WITH_BULK;
  const max = WITH_BULK[0].revenue;

  return (
    <div data-figure className="not-prose panel my-6 p-4 sm:p-5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="단체 주문 포함 여부">
        <button
          type="button"
          onClick={() => setDrop(false)}
          aria-pressed={!drop}
          className={`tap-feedback min-h-11 px-4 text-label font-semibold ${!drop ? "btn-action" : "btn"}`}
        >
          전체 주문 714건
        </button>
        <button
          type="button"
          onClick={() => setDrop(true)}
          aria-pressed={drop}
          className={`tap-feedback min-h-11 px-4 text-label font-semibold ${drop ? "btn-action" : "btn"}`}
        >
          단체 주문 3건 빼기
        </button>
      </div>

      <ol className="mt-4 flex flex-col gap-3">
        {rows.map((r, i) => (
          <li key={r.store} className="grid grid-cols-[1.5rem_3.5rem_minmax(0,1fr)] items-center gap-2">
            <span className="font-mono text-label font-bold tabular-nums">{i + 1}</span>
            <span className="text-label font-semibold">{r.store}</span>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="h-4 w-full">
                <div
                  className={`h-full rounded-r-[4px] transition-[width] duration-300 ease-out ${
                    i === 0 ? "bg-accent dark:bg-accent-dark" : "bg-accent/35 dark:bg-accent-dark/35"
                  }`}
                  style={{ width: `${(r.revenue / max) * 100}%` }}
                />
              </div>
              <span className={`font-mono text-label tabular-nums ${MUTED}`}>
                {r.revenue.toLocaleString("ko-KR")}원, {r.orders}건, 객단가 {r.avg.toLocaleString("ko-KR")}원
              </span>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-3 text-label leading-relaxed" aria-live="polite">
        {drop
          ? "판교점 매출에서 단체 주문 226,500원이 빠지자 성수점이 1위가 됐어요. 판교점 객단가도 9,260원에서 8,452원으로 내려가 세 지점 중 가장 낮아요."
          : "판교점이 1위예요. 그런데 이 안에 한 번에 6만 원에서 9만 원이 넘는 회의용 단체 주문 세 건이 들어 있어요."}
      </p>
    </div>
  );
}
