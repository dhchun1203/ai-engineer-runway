"use client";

// 24회차(표준화) 학생 10명의 특징 세 개를 표준화 전후로 같은 자 위에 찍어 비교한다.
// 학습용 7명(행 0, 7, 2, 9, 4, 3, 6)과 시험용 3명(행 8, 1, 5)은 수업 코드
// train_test_split(test_size=0.3, random_state=42)의 결과이고, 평균과 표준편차는
// StandardScaler를 학습용 7명에 fit해 얻은 값이다(Python 3.14 + scikit-learn 1.9.1로 직접 실행).

import { useState } from "react";

const MUTED = "text-badge-neutral-text dark:text-badge-neutral-text-dark";

const FEATURES = [
  { key: "공부", col: "study_hours" },
  { key: "수면", col: "sleep_hours" },
  { key: "문제", col: "practice_count" },
] as const;

// 학습용으로 잰 평균과 표준편차(scaler.mean_, scaler.scale_)
const MEAN = [3.142857142857143, 6.857142857142857, 20.428571428571427];
const SCALE = [1.5518257844571737, 1.1248582704826817, 7.889543584705614];

// [행 번호, 공부, 수면, 문제, 시험용인가]
const ROWS: [number, number, number, number, boolean][] = [
  [0, 1, 6, 10, false],
  [7, 5, 6, 22, false],
  [2, 3, 5, 20, false],
  [9, 1, 8, 8, false],
  [4, 5, 8, 30, false],
  [3, 4, 7, 25, false],
  [6, 3, 8, 28, false],
  [8, 4, 6, 32, true],
  [1, 2, 8, 15, true],
  [5, 2, 5, 12, true],
];

// 같은 값의 점은 위아래로 나눠 겹치지 않게 한다. [특징][학생] → 세로 어긋남(px)
const OFFSETS: number[][] = [0, 1, 2].map((fi) => {
  const groups = new Map<number, number[]>();
  ROWS.forEach((r, ri) => groups.set(r[fi + 1] as number, [...(groups.get(r[fi + 1] as number) ?? []), ri]));
  const out = new Array<number>(ROWS.length).fill(0);
  groups.forEach((members) => members.forEach((ri, k) => (out[ri] = (k - (members.length - 1) / 2) * 7)));
  return out;
});

const z = (v: number, f: number) => (v - MEAN[f]) / SCALE[f];
const fmt = (v: number) => (Math.abs(v) < 0.005 ? "0.00" : v.toFixed(2)).replace("-", "−");

const W = 320;
const H = 150;
const PAD_L = 30;
const PAD_R = 10;
const ROW_Y = [30, 68, 106];

export function ScalingSimulator() {
  const [scaled, setScaled] = useState(false);
  const [pick, setPick] = useState(7);

  const lo = scaled ? -2 : 0;
  const hi = scaled ? 2 : 34;
  const sx = (v: number) => PAD_L + ((v - lo) / (hi - lo)) * (W - PAD_L - PAD_R);
  const ticks = scaled ? [-2, -1, 0, 1, 2] : [0, 5, 10, 15, 20, 25, 30];
  const [row, ...vals] = ROWS[pick];
  const isTest = ROWS[pick][4];

  return (
    <div data-figure className="not-prose panel my-6 p-4 sm:p-5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="표준화 전후 고르기">
        {[
          [false, "표준화 전"],
          [true, "표준화 후"],
        ].map(([on, label]) => (
          <button
            key={String(label)}
            type="button"
            onClick={() => setScaled(on as boolean)}
            aria-pressed={scaled === on}
            className={`tap-feedback min-h-11 px-4 text-label font-semibold ${scaled === on ? "btn-action" : "btn"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 h-auto w-full"
        role="img"
        aria-label={scaled ? "표준화 후: 세 특징이 모두 -2에서 2 사이, 0을 가운데로 퍼져 있다" : "표준화 전: 공부 1~5, 수면 5~8, 문제 8~32로 범위가 다르다"}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={sx(t)}
              x2={sx(t)}
              y1={12}
              y2={H - 22}
              className={t === 0 && scaled ? "stroke-muted dark:stroke-muted-dark" : "stroke-line dark:stroke-line-dark"}
              strokeWidth={0.5}
              strokeDasharray={t === 0 && scaled ? "2 2" : undefined}
            />
            <text x={sx(t)} y={H - 10} textAnchor="middle" className="fill-muted dark:fill-muted-dark" fontSize={8}>
              {String(t).replace("-", "−")}
            </text>
          </g>
        ))}
        {FEATURES.map((f, fi) => (
          <g key={f.key}>
            <text x={2} y={ROW_Y[fi] + 3} className="fill-foreground dark:fill-foreground-dark" fontSize={9} fontWeight={600}>
              {f.key}
            </text>
            <line x1={PAD_L} x2={W - PAD_R} y1={ROW_Y[fi]} y2={ROW_Y[fi]} className="stroke-line dark:stroke-line-dark" strokeWidth={0.8} />
            {ROWS.map((r, ri) => {
              const raw = r[fi + 1] as number;
              const v = scaled ? z(raw, fi) : raw;
              const picked = ri === pick;
              return (
                <circle
                  key={r[0]}
                  cx={sx(v)}
                  cy={ROW_Y[fi] + OFFSETS[fi][ri]}
                  r={picked ? 5 : 3.5}
                  className={
                    r[4]
                      ? "fill-action stroke-background dark:fill-action-dark dark:stroke-background-dark"
                      : "fill-accent stroke-background dark:fill-accent-dark dark:stroke-background-dark"
                  }
                  strokeWidth={picked ? 2 : 0.6}
                  opacity={picked ? 1 : 0.8}
                />
              );
            })}
          </g>
        ))}
      </svg>
      <p className={`text-right text-label ${MUTED}`}>파란 점은 학습용 7명, 주황 점은 시험용 3명</p>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="학생 고르기">
        {ROWS.map((r, ri) => (
          <button
            key={r[0]}
            type="button"
            onClick={() => setPick(ri)}
            aria-pressed={pick === ri}
            aria-label={`${r[0]}번 학생${r[4] ? " (시험용)" : ""}`}
            className={`tap-feedback min-h-11 min-w-11 px-2 text-label font-semibold ${pick === ri ? "btn-action" : "btn"}`}
          >
            {r[0]}번
          </button>
        ))}
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3" aria-live="polite">
        {FEATURES.map((f, fi) => (
          <div key={f.key} className="rounded-md bg-surface-2 px-3 py-2 dark:bg-surface-2-dark">
            <dt className={`text-label ${MUTED}`}>
              <code>{f.col}</code>
            </dt>
            <dd className="font-mono text-label tabular-nums">
              ({vals[fi]} − {MEAN[fi].toFixed(2)}) ÷ {SCALE[fi].toFixed(2)}
              <b className="block text-body">= {fmt(z(vals[fi] as number, fi))}</b>
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-2 text-label leading-relaxed">
        {scaled
          ? `세 줄이 모두 0을 가운데로 비슷한 폭에 퍼졌어요. 이제 문제 수 1개와 공부 1시간이 아니라, "평균에서 표준편차 몇 개만큼 떨어졌나"를 같은 자로 비교해요.`
          : "공부는 1~5, 수면은 5~8, 문제는 8~32에 있어요. 같은 자에 놓으면 문제 수만 넓게 퍼지고 공부와 수면은 왼쪽에 몰려요."}{" "}
        {row}번 학생은 {isTest ? "시험용이라 이 평균, 표준편차를 재는 데 쓰이지 않고 바꾸기만 해요(transform)." : "학습용이라 이 평균, 표준편차를 재는 데 쓰였어요(fit)."}
      </p>
    </div>
  );
}
