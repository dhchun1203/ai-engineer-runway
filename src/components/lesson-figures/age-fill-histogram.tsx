"use client";

// 21회차(타이타닉 EDA) 나이 히스토그램. 요금 512 세 행을 뺀 888명의 age를 bins=20으로 센 값을
// seaborn 0.13.2 + pandas 3.1.1 + NumPy 2.5.5로 직접 실행해 옮겼다. 구간 경계는 평균으로 채운
// 뒤의 ax.hist와 같다(최솟값 0.42, 최댓값 80이 채우기 전후로 같아 세 경우 모두 같은 경계).

import { useState } from "react";

const MUTED = "text-badge-neutral-text dark:text-badge-neutral-text-dark";

const EDGES = [0.4, 4.4, 8.4, 12.4, 16.3, 20.3, 24.3, 28.3, 32.3, 36.2, 40.2, 44.2, 48.2, 52.1, 56.1, 60.1, 64.1, 68.1, 72.0, 76.0, 80.0];

type ModeKey = "before" | "mean" | "median";

const MODES: { key: ModeKey; label: string; counts: number[]; spike: number | null; note: string }[] = [
  {
    key: "before",
    label: "채우기 전 711명",
    counts: [40, 14, 15, 31, 79, 98, 85, 84, 70, 45, 35, 35, 29, 16, 13, 11, 4, 5, 1, 1],
    spike: null,
    note: "나이를 아는 711명만 셌어요. 가장 높은 막대는 20.3~24.3세 98명이고, 20대 후반과 30대 초반이 비슷하게 이어져요.",
  },
  {
    key: "mean",
    label: "평균 29.7로 채움",
    counts: [40, 14, 15, 31, 79, 98, 85, 261, 70, 45, 35, 35, 29, 16, 13, 11, 4, 5, 1, 1],
    spike: 7,
    note: "빈칸 177명이 모두 29.7세가 되어 28.3~32.3세 막대에만 들어갔어요. 84명이던 막대가 261명으로 솟았어요. 수업 노트북의 그래프가 이 모양이에요.",
  },
  {
    key: "median",
    label: "중앙값 28로 채웠다면",
    counts: [40, 14, 15, 31, 79, 98, 262, 84, 70, 45, 35, 35, 29, 16, 13, 11, 4, 5, 1, 1],
    spike: 6,
    note: "중앙값 28로 채워도 177명이 한 값에 모여요. 솟는 막대가 한 칸 왼쪽(24.3~28.3세, 262명)으로 옮겨 갈 뿐이에요.",
  },
];

export function AgeFillHistogram() {
  const [modeKey, setModeKey] = useState<ModeKey>("mean");
  const mode = MODES.find((m) => m.key === modeKey) ?? MODES[1];
  const max = 262;

  return (
    <div data-figure className="not-prose panel my-6 p-4 sm:p-5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="빈 나이 채우는 방법 고르기">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setModeKey(m.key)}
            aria-pressed={m.key === modeKey}
            className={`tap-feedback min-h-11 px-4 text-label font-semibold ${m.key === modeKey ? "btn-action" : "btn"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex h-48 items-end gap-0.5 sm:gap-1" role="img" aria-label={`나이 분포: ${mode.label}`}>
        {mode.counts.map((c, i) => (
          <div key={EDGES[i]} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className={`font-mono text-[10px] tabular-nums leading-none sm:text-[11px] ${i === mode.spike ? "font-bold" : MUTED}`}>{c}</span>
            <div
              className={`w-full rounded-t-[3px] transition-[height] duration-300 ease-out ${
                i === mode.spike ? "bg-accent dark:bg-accent-dark" : "bg-accent/35 dark:bg-accent-dark/35"
              }`}
              style={{ height: `${(c / max) * 100}%`, minHeight: c > 0 ? 2 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between border-t border-line pt-1 font-mono text-[11px] tabular-nums dark:border-line-dark">
        {[0, 20, 40, 60, 80].map((age) => (
          <span key={age} className={MUTED}>
            {age}
          </span>
        ))}
      </div>
      <p className={`mt-1 text-right text-label ${MUTED}`}>나이(세), 막대 20개</p>

      <p className="mt-2 text-label leading-relaxed" aria-live="polite">
        {mode.note}
      </p>
    </div>
  );
}
