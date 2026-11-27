"use client";

// 25회차(KNN): 229번 사진(정답 22번 사람)을 뺀 399장으로 KNeighborsClassifier를 학습하고
// 가장 가까운 이웃 10장을 찾은 결과다. K를 바꾸면 앞에서부터 K장만 투표에 들어간다.
// 이웃, 거리, 예측, 출력 글자는 Python 3.14 + scikit-learn 1.9.1로 K = 1~10을 직접 실행해 얻은 값이다.
// 동점이면 scikit-learn은 번호가 작은 사람을 고른다(K = 2, 6, 7에서 17번).

import { useState } from "react";

const MUTED = "text-badge-neutral-text dark:text-badge-neutral-text-dark";

// [사람 번호, 거리, 원래 사진 번호]
const NEIGHBORS: [number, number, number][] = [
  [17, 6.07, 179],
  [22, 6.26, 228],
  [22, 6.44, 225],
  [22, 6.63, 220],
  [17, 6.68, 175],
  [17, 6.93, 172],
  [3, 7.02, 36],
  [17, 7.07, 177],
  [11, 7.23, 115],
  [8, 7.27, 87],
];

const ANSWER = 22;

// print로 찍히는 글자 그대로(NumPy는 두 자리 수가 섞이면 한 자리 수 앞에 칸을 넣는다)
function printed(k: number) {
  const people = NEIGHBORS.slice(0, k).map((n) => n[0]);
  const width = Math.max(...people.map((p) => String(p).length));
  const label = `[${people.map((p) => String(p).padStart(width)).join(" ")}]`;
  const dist = `[${NEIGHBORS.slice(0, k)
    .map((n) => n[1].toFixed(2))
    .join(" ")}]`;
  return { label, dist };
}

function vote(k: number) {
  const counts = new Map<number, number>();
  NEIGHBORS.slice(0, k).forEach(([p]) => counts.set(p, (counts.get(p) ?? 0) + 1));
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const top = ranked[0][1];
  const tied = ranked.filter(([, c]) => c === top).length > 1;
  return { ranked, winner: ranked[0][0], tied };
}

export function KnnVoteSimulator() {
  const [k, setK] = useState(3);
  const { ranked, winner, tied } = vote(k);
  const { label, dist } = printed(k);
  const right = winner === ANSWER;

  return (
    <div data-figure className="not-prose panel my-6 p-4 sm:p-5">
      <p className={`text-label ${MUTED}`}>이웃 수 K 고르기</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="이웃 수 K 고르기">
        {NEIGHBORS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setK(i + 1)}
            aria-pressed={k === i + 1}
            className={`tap-feedback min-h-11 min-w-11 px-2 text-label font-semibold ${k === i + 1 ? "btn-action" : "btn"}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <ol className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-5" aria-label="가까운 순서의 이웃 10장">
        {NEIGHBORS.map(([person, d, photo], i) => {
          const inVote = i < k;
          const isAnswer = person === ANSWER;
          return (
            <li
              key={photo}
              className={`rounded-md border px-2 py-1.5 transition-opacity ${
                inVote
                  ? isAnswer
                    ? "border-action bg-surface-2 dark:border-action-dark dark:bg-surface-2-dark"
                    : "border-accent bg-surface-2 dark:border-accent-dark dark:bg-surface-2-dark"
                  : "border-line opacity-40 dark:border-line-dark"
              }`}
            >
              <span className={`block text-label ${MUTED}`}>{i + 1}번째</span>
              <b className="block text-body">{person}번</b>
              <span className="block font-mono text-label tabular-nums">거리 {d.toFixed(2)}</span>
            </li>
          );
        })}
      </ol>
      <p className={`mt-1 text-right text-label ${MUTED}`}>테두리가 있는 칸만 투표해요. 주황 테두리가 정답인 22번이에요.</p>

      <div className="mt-3 rounded-md bg-surface-2 px-3 py-2 dark:bg-surface-2-dark" aria-live="polite">
        <p className="text-label font-semibold">투표</p>
        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {ranked.map(([person, count]) => (
            <li key={person} className="flex items-center gap-1.5 font-mono text-label tabular-nums">
              {person}번
              <span className="flex gap-0.5" aria-hidden="true">
                {Array.from({ length: count }, (_, i) => (
                  <span
                    key={i}
                    className={`h-3 w-3 ${person === ANSWER ? "bg-action dark:bg-action-dark" : "bg-accent dark:bg-accent-dark"}`}
                  />
                ))}
              </span>
              {count}표
            </li>
          ))}
        </ul>
        <pre className="mt-2 overflow-x-auto font-mono text-label leading-relaxed">
          {`가장 가까운 이웃: ${label}\n이웃과의 거리: ${dist}\n예측한 사람 : ${winner}\n실제 정답: ${ANSWER}`}
        </pre>
      </div>

      <p className="mt-2 text-label leading-relaxed">
        {k === 1
          ? "K = 1이면 가장 가까운 한 장만 보는데, 그 한 장이 하필 다른 사람(17번)이라 틀려요."
          : right
            ? `K = ${k}이면 22번이 가장 많은 표를 받아 정답을 맞혀요.`
            : tied
              ? `K = ${k}이면 17번과 22번이 같은 표라, 번호가 작은 17번을 골라 틀려요.`
              : `K = ${k}이면 17번이 더 많은 표를 받아 틀려요. 멀리 있는 사진까지 투표에 들어오면 17번 사진이 더 많이 섞여요.`}
      </p>
    </div>
  );
}
