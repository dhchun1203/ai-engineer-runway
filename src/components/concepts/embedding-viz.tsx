"use client";

// 번외 "AI 뜯어보기" 개념 2편 "임베딩"의 대표 시각화 — 2D 의미 지도.
// 단어 10개를 좌표 상수로 평면에 뿌리되 뜻이 비슷한 것끼리 가깝게 두고,
// 한 단어를 고르면 가장 가까운 이웃 2~3개로 선을 이어 강조한다.
// "임베딩은 뜻을 좌표로 바꾼 것이고, 가까울수록 뜻이 비슷하다"는 핵심을
// 글이 아니라 눈과 손으로 붙잡게 하는 것이 목적. 실제 임베딩은 수백~수천
// 차원이지만 여기선 2차원으로 줄여 그림으로 보여준다(캡션에서 밝힘).
//
// viz-kit의 공용 셸·색·컨트롤만 쓴다. 색은 ACCENT의 text(그룹색)만 SVG에
// currentColor로 흘려보내고(인라인 색 금지 규칙), 라벨·격자만 --diagram-* 변수를
// 예외로 쓴다. 애니메이션은 motion 하나, prefers-reduced-motion이면 끈다.

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ACCENT,
  ConceptFigure,
  StepControls,
  type Accent,
} from "@/components/concepts/viz-kit";

// 한 단어 = 평면 위 한 점. group은 강조색(1 블루=사람 / 2 러스트=과일 / 3 앰버=탈것),
// neighbors는 "뜻이 가장 가까운 이웃"의 id 상수(실제 계산이 아니라 미리 정해 둔 그림용).
type Word = {
  id: string;
  x: number;
  y: number;
  group: Accent;
  neighbors: string[];
};

// 좌표는 viewBox 0 0 340 300 안의 상수. 세 무리가 눈에 띄게 떨어져 뭉치도록 배치했다.
// 사람 무리(왼쪽 위) · 과일 무리(오른쪽 위) · 탈것 무리(아래 가운데).
const WORDS: readonly Word[] = [
  // 사람 무리 — 왕·여왕·남자·여자가 서로 가깝다.
  { id: "왕", x: 62, y: 58, group: 1, neighbors: ["여왕", "남자"] },
  { id: "여왕", x: 104, y: 70, group: 1, neighbors: ["왕", "여자"] },
  { id: "남자", x: 56, y: 104, group: 1, neighbors: ["여자", "왕"] },
  { id: "여자", x: 106, y: 116, group: 1, neighbors: ["남자", "여왕"] },
  // 과일 무리 — 사과·바나나·포도가 "과일" 주위에 모인다.
  { id: "사과", x: 250, y: 58, group: 2, neighbors: ["과일", "포도"] },
  { id: "바나나", x: 296, y: 80, group: 2, neighbors: ["과일", "사과"] },
  { id: "포도", x: 244, y: 104, group: 2, neighbors: ["과일", "사과"] },
  { id: "과일", x: 278, y: 124, group: 2, neighbors: ["사과", "포도", "바나나"] },
  // 탈것 무리 — 자동차·버스 둘이 붙어 있다.
  { id: "자동차", x: 122, y: 236, group: 3, neighbors: ["버스"] },
  { id: "버스", x: 172, y: 252, group: 3, neighbors: ["자동차"] },
];

const byId = (id: string): Word => WORDS.find((w) => w.id === id) as Word;

export function EmbeddingMapViz() {
  // 지금 고른 단어의 인덱스. 점을 눌러도, 아래 이전/다음 컨트롤로 넘겨도 바뀐다.
  const [sel, setSel] = useState(0);
  const reduce = useReducedMotion();

  const active = WORDS[sel];
  const accent = ACCENT[active.group];
  const neighbors = active.neighbors.map(byId);

  return (
    <ConceptFigure label="의미 지도 · 단어를 눌러 가까운 이웃을 보기">
      {/* 2D 의미 지도. 세 무리가 떨어져 뭉쳐 있고, 고른 단어에서 이웃으로 선이 뻗는다.
          점·라벨을 눌러 고를 수 있고(터치 타깃 크게), 아래 컨트롤로도 하나씩 넘긴다. */}
      <svg
        viewBox="0 0 340 300"
        className="w-full"
        role="img"
        aria-label={`의미 지도. 지금 고른 단어는 '${active.id}'이고, 가까운 이웃은 ${active.neighbors.join(
          ", "
        )}입니다.`}
      >
        {/* 평면 느낌을 주는 옅은 격자 — 색은 --diagram-line 예외만 사용. */}
        <g stroke="var(--diagram-line)" strokeWidth="1" opacity="0.5">
          <line x1="0" y1="150" x2="340" y2="150" />
          <line x1="170" y1="0" x2="170" y2="300" />
        </g>

        {/* 고른 단어 → 이웃 연결선. 그룹색(currentColor)으로, 고를 때마다 다시 그어진다. */}
        <g className={accent.text} aria-hidden="true">
          {neighbors.map((nb) => (
            <motion.line
              key={`${active.id}-${nb.id}`}
              x1={active.x}
              y1={active.y}
              x2={nb.x}
              y2={nb.y}
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: reduce ? 0 : 0.4 }}
            />
          ))}
        </g>

        {/* 단어 점 + 라벨. 각 단어는 자기 그룹색을 currentColor로 물려받는다.
            고른 단어와 그 이웃은 또렷하게, 나머지는 흐리게. */}
        {WORDS.map((w, i) => {
          const isActive = i === sel;
          const isNeighbor = active.neighbors.includes(w.id);
          const emphasized = isActive || isNeighbor;
          const wordAccent = ACCENT[w.group];
          return (
            <g
              key={w.id}
              className={`${wordAccent.text} cursor-pointer`}
              opacity={emphasized ? 1 : 0.32}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              aria-label={`${w.id} 고르기`}
              onClick={() => setSel(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSel(i);
                }
              }}
            >
              {/* 넉넉한 투명 히트 영역 — 손가락 터치를 위해 실제 점보다 크게. */}
              <circle cx={w.x} cy={w.y} r="24" fill="transparent" />
              {/* 고른 단어는 바깥 링으로 한 번 더 강조. */}
              {isActive && (
                <motion.circle
                  cx={w.x}
                  cy={w.y}
                  r="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  initial={reduce ? false : { scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: reduce ? 0 : 0.3 }}
                  style={{ transformOrigin: `${w.x}px ${w.y}px` }}
                />
              )}
              <circle cx={w.x} cy={w.y} r={isActive ? 11 : 9} fill="currentColor" />
              <text
                x={w.x}
                y={w.y + 30}
                textAnchor="middle"
                fontSize="15"
                fontWeight={emphasized ? 700 : 500}
                fill="var(--diagram-ink)"
              >
                {w.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 고른 단어와 이웃을 글로도 짚어 준다 — 지도만으론 놓치기 쉬운 "왜"를 붙인다. */}
      <div className="flex flex-col gap-2">
        <p className="break-keep text-body font-normal leading-relaxed">
          <span className={`font-bold ${accent.text}`}>{active.id}</span>과(와) 가장
          가까운 단어는 {" "}
          {neighbors.map((nb, k) => (
            <span key={nb.id}>
              <span className="font-bold">{nb.id}</span>
              {k < neighbors.length - 1 ? ", " : ""}
            </span>
          ))}
          {" "}
          예요. 좌표가 가까울수록 뜻이 비슷하다는 뜻이에요.
        </p>
        <p className="break-keep text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          지도 위 거리는 곧 &lsquo;뜻의 가까움&rsquo;이에요. 실제 임베딩은 수백~수천
          차원이라 눈에 안 보이지만, 여기선 2차원으로 줄여 그림으로 보여주고 있어요.
        </p>
      </div>

      {/* 이전/다음으로도 단어를 하나씩 넘긴다(자동재생 없음, 아이패드 터치·접근성). */}
      <StepControls
        i={sel}
        count={WORDS.length}
        setI={setSel}
        accent={active.group}
        unit="단어"
      />
    </ConceptFigure>
  );
}
