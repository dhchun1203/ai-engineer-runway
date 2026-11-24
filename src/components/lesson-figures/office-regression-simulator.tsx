"use client";

// 22회차(선형회귀) 오피스텔 시세 200건 직선 맞춰 보기. 점은 수업 코드(default_rng(40), n=200)로
// 만든 office.csv를 Python 3.14 + NumPy 2.5.5 + pandas 3.1.1로 직접 다시 만들어 면적을 소수 셋째
// 자리까지 옮겼다. 학습한 직선 값은 scikit-learn 1.9.1 LinearRegression의 coef_, intercept_ 그대로이고,
// 이 데이터로 잰 MAE, RMSE, R²가 수업 출력(2,493 / 4,030 / 0.803, 195건 2,075 / 2,732)과 같다.

import { useMemo, useState } from "react";

const MUTED = "text-badge-neutral-text dark:text-badge-neutral-text-dark";

const POINTS: [number, number][] = [[67.443,37250],[65.072,37210],[81.225,58460],[23.877,15180],[64.884,32390],[79.956,40460],[50.919,29680],[41.995,29620],[59.122,33840],[67.491,36950],[27.297,11890],[27.061,20630],[61.422,31150],[22.751,37970],[23.101,17250],[40.753,27190],[33.728,19490],[70.456,37920],[71.821,37830],[31.166,18530],[29.1,20760],[44.053,24280],[54.427,29180],[55.254,31720],[44.708,28210],[48.058,19020],[43.443,24910],[37.844,21910],[60.345,39580],[37.505,12340],[47.21,26730],[53.319,29790],[39.756,22190],[41.726,27280],[35.774,21640],[37.168,21860],[34.773,15280],[39.0,23670],[65.806,36070],[29.394,22380],[60.236,32650],[52.406,33300],[32.355,24840],[41.288,21930],[41.527,26870],[39.987,20030],[27.287,13670],[56.543,32620],[59.773,33560],[30.588,18490],[23.48,13170],[51.22,24700],[45.273,25890],[28.762,34730],[26.614,19400],[83.791,45310],[72.042,34430],[59.795,31140],[47.666,24550],[80.702,41150],[57.138,29510],[58.839,28490],[37.896,19020],[56.789,28200],[62.81,32360],[68.904,30270],[65.404,32940],[77.365,42290],[25.54,17440],[80.156,39140],[58.051,26460],[40.434,45270],[69.814,38350],[27.991,20370],[29.149,17990],[84.73,42980],[73.322,34810],[81.54,37770],[37.17,21280],[47.801,27280],[40.556,23020],[81.274,39160],[81.462,38890],[70.825,37000],[22.045,15960],[35.099,19610],[65.258,31160],[45.393,27450],[26.457,17560],[83.2,37780],[29.303,15460],[26.193,19770],[56.59,48030],[34.942,16820],[40.523,23040],[41.472,24150],[48.802,27950],[59.366,30320],[74.197,36930],[50.376,26990],[64.154,34690],[67.42,35420],[49.487,30290],[27.834,11400],[77.577,37310],[44.67,24970],[79.032,41110],[50.901,31590],[63.057,34040],[69.083,35190],[49.248,21700],[35.961,20830],[71.667,36580],[76.023,41810],[36.412,20550],[39.177,21910],[34.099,17740],[22.575,12780],[42.405,24340],[44.402,23850],[77.553,37270],[41.83,21540],[65.92,34460],[53.648,28840],[69.472,38040],[33.252,16410],[35.547,22080],[27.875,20460],[62.028,31260],[57.833,29510],[73.331,40470],[31.058,12090],[81.273,40940],[38.262,20060],[79.146,45560],[45.068,28720],[26.533,19260],[65.422,36310],[81.473,43440],[80.919,44390],[41.067,24820],[77.677,41550],[80.46,39630],[33.489,16460],[83.205,38670],[29.333,19120],[24.393,16400],[24.462,17880],[39.991,19000],[39.959,25630],[62.588,31820],[57.603,27280],[59.443,34070],[80.998,40520],[35.976,18150],[50.609,29090],[26.247,17930],[38.524,20990],[53.365,29820],[82.778,44970],[73.226,36830],[66.992,37390],[59.585,30610],[64.213,30590],[47.073,25850],[24.605,17480],[66.2,35320],[34.816,19960],[33.542,22210],[36.364,17970],[68.805,34570],[51.554,28280],[69.328,36110],[63.122,33680],[83.991,43210],[83.592,48930],[42.781,20010],[84.237,42790],[40.136,28570],[57.858,30550],[42.919,24140],[83.91,44850],[64.055,33530],[82.366,43740],[79.693,39190],[60.732,32480],[27.191,19040],[64.216,35680],[65.989,35370],[74.486,37430],[62.139,33460],[62.688,26690],[41.539,22020],[55.093,28830],[53.305,28630],[84.921,46640],[57.39,30150],[84.364,43100],[26.229,23120],[38.029,24280]];
const SPECIAL = new Set([53, 13, 2, 92, 71]);

type Preset = { key: string; label: string; w: number; b: number; note: string };

const PRESETS: Preset[] = [
  {
    key: "fit",
    label: "학습한 직선",
    w: 439.4587041713469,
    b: 5926.680580056123,
    note: "model.fit(X, y)가 찾은 직선이에요. 200건 전체에서 오차 제곱의 합(RMSE)이 가장 작은 직선이라, 손잡이를 어느 쪽으로 움직여도 전체 200건의 RMSE는 4,030보다 커져요.",
  },
  {
    key: "truth",
    label: "만들 때 쓴 값 450, 5000",
    w: 450,
    b: 5000,
    note: "데이터를 만든 진짜 규칙이에요. 그런데 전체 200건의 RMSE는 4,052로 학습한 직선(4,030)보다 커요. 모델은 잡음과 특이매물까지 포함한 점들에 제곱 오차가 가장 작게 맞췄기 때문이에요. MAE는 오히려 2,479로 더 작아요. 모델이 줄이는 것은 MAE가 아니라 제곱 오차예요.",
  },
  {
    key: "refit",
    label: "특이매물 빼고 다시 학습",
    w: 451.41058194043694,
    b: 4811.981106417567,
    note: "정상 매물 195건만으로 다시 fit 하면 w 451.41, b 4811.98로 만들 때 쓴 450, 5000에 훨씬 가까워져요. 비싸게 튄 5건이 직선을 위로 끌어 올리고 있었다는 뜻이에요.",
  },
];

const X0 = 20;
const X1 = 86;
const Y0 = 10000;
const Y1 = 60000;
const W = 320;
const H = 200;
const PAD_L = 34;
const PAD_B = 18;
const sx = (x: number) => PAD_L + ((x - X0) / (X1 - X0)) * (W - PAD_L - 4);
const sy = (y: number) => (H - PAD_B) - ((y - Y0) / (Y1 - Y0)) * (H - PAD_B - 6);

function metrics(w: number, b: number, dropSpecial: boolean) {
  const rows = POINTS.filter((_, i) => !(dropSpecial && SPECIAL.has(i)));
  const n = rows.length;
  const mean = rows.reduce((s, [, y]) => s + y, 0) / n;
  let abs = 0;
  let sq = 0;
  let tot = 0;
  for (const [x, y] of rows) {
    const e = y - (w * x + b);
    abs += Math.abs(e);
    sq += e * e;
    tot += (y - mean) * (y - mean);
  }
  return { n, mae: abs / n, rmse: Math.sqrt(sq / n), r2: 1 - sq / tot };
}

const won = (v: number) => Math.round(v).toLocaleString("ko-KR");

export function OfficeRegressionSimulator() {
  const [w, setW] = useState(PRESETS[0].w);
  const [b, setB] = useState(PRESETS[0].b);
  const [drop, setDrop] = useState(false);
  const preset = PRESETS.find((p) => p.w === w && p.b === b) ?? null;
  const m = useMemo(() => metrics(w, b, drop), [w, b, drop]);
  const p33 = Math.round((w * 33 + b) / 10) * 10;
  const p59 = Math.round((w * 59 + b) / 10) * 10;

  return (
    <div data-figure className="not-prose panel my-6 p-4 sm:p-5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="직선 고르기">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              setW(p.w);
              setB(p.b);
            }}
            aria-pressed={preset?.key === p.key}
            className={`tap-feedback min-h-11 px-4 text-label font-semibold ${preset?.key === p.key ? "btn-action" : "btn"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-auto w-full" role="img" aria-label={`오피스텔 200건 산점도와 직선 y = ${w.toFixed(2)}x + ${b.toFixed(2)}`}>
        {[10000, 20000, 30000, 40000, 50000, 60000].map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={W - 4} y1={sy(t)} y2={sy(t)} className="stroke-line dark:stroke-line-dark" strokeWidth={0.5} />
            <text x={PAD_L - 3} y={sy(t) + 3} textAnchor="end" className="fill-muted dark:fill-muted-dark" fontSize={8}>
              {t / 10000}만
            </text>
          </g>
        ))}
        {[20, 30, 40, 50, 60, 70, 80].map((t) => (
          <text key={t} x={sx(t)} y={H - 6} textAnchor="middle" className="fill-muted dark:fill-muted-dark" fontSize={8}>
            {t}
          </text>
        ))}
        {POINTS.map(([x, y], i) =>
          SPECIAL.has(i) ? (
            <g key={i}>
              {!drop && (
                <line x1={sx(x)} x2={sx(x)} y1={sy(y)} y2={sy(w * x + b)} className="stroke-action dark:stroke-action-dark" strokeWidth={0.8} strokeDasharray="2 2" />
              )}
              <circle cx={sx(x)} cy={sy(y)} r={3} className={drop ? "fill-none stroke-action dark:stroke-action-dark" : "fill-action dark:fill-action-dark"} strokeWidth={0.8} />
            </g>
          ) : (
            <circle key={i} cx={sx(x)} cy={sy(y)} r={2} className="fill-accent/45 dark:fill-accent-dark/45" />
          ),
        )}
        <line x1={sx(X0)} x2={sx(X1)} y1={sy(w * X0 + b)} y2={sy(w * X1 + b)} className="stroke-destructive dark:stroke-destructive-dark" strokeWidth={1.6} />
      </svg>
      <p className={`text-right text-label ${MUTED}`}>가로 면적, 세로 가격. 주황 점이 특이매물 5건</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="flex items-baseline justify-between text-label font-semibold">
            기울기 w <span className="font-mono tabular-nums">{w.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={300}
            max={600}
            step={1}
            value={w}
            onChange={(e) => setW(Number(e.target.value))}
            className="h-11 w-full cursor-pointer touch-manipulation accent-accent dark:accent-accent-dark"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="flex items-baseline justify-between text-label font-semibold">
            절편 b <span className="font-mono tabular-nums">{b.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={12000}
            step={100}
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
            className="h-11 w-full cursor-pointer touch-manipulation accent-accent dark:accent-accent-dark"
          />
        </label>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="평가할 매물">
        <button type="button" onClick={() => setDrop(false)} aria-pressed={!drop} className={`tap-feedback min-h-11 px-4 text-label font-semibold ${!drop ? "btn-action" : "btn"}`}>
          전체 200건으로 재기
        </button>
        <button type="button" onClick={() => setDrop(true)} aria-pressed={drop} className={`tap-feedback min-h-11 px-4 text-label font-semibold ${drop ? "btn-action" : "btn"}`}>
          특이매물 뺀 195건으로 재기
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center" aria-live="polite">
        {[
          ["MAE", won(m.mae)],
          ["RMSE", won(m.rmse)],
          ["R²", m.r2.toFixed(3)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-md bg-surface-2 px-2 py-2 dark:bg-surface-2-dark">
            <dt className={`text-label ${MUTED}`}>{k}</dt>
            <dd className="font-mono text-body font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <p className={`mt-2 font-mono text-label tabular-nums ${MUTED}`}>
        예측: 33 → {won(p33)}, 59 → {won(p59)}
      </p>

      <p className="mt-2 text-label leading-relaxed">
        {preset
          ? preset.note
          : `손잡이로 직선을 옮겼어요. ${m.n}건 기준 RMSE ${won(m.rmse)}이에요. "학습한 직선"을 누르면 200건 RMSE가 가장 작은 직선(4,030)으로 돌아가요.`}
      </p>
    </div>
  );
}
