"use client";

// 번외 "AI 뜯어보기" 개념편 "환각"의 시각화 — 자신 있는 답 속 '검증 대상' 가려내기.
// AI가 그럴듯하게 써낸 문단 하나를 보여주고, 그 안의 '사실 주장' 조각(출처·수치·인명·
// 인용)을 눌러 진짜인지/지어낸 것인지 드러낸다. 핵심 메시지: 모델은 다음 말을 '그럴듯함'
// 으로 이어 붙일 뿐 '사실 여부'를 확인하지 않으므로, 문법과 자신감이 완벽해도 틀릴 수
// 있다 — 그래서 수치·출처·인용은 늘 사람이 검증 대상으로 분류해야 한다.
//
// prose 안(개념 리더)에서 렌더되므로 viz-kit의 ConceptFigure가 not-prose로 감싼다.
// 애니메이션은 motion 하나만, prefers-reduced-motion이면 페이드/이동을 끈다.

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ACCENT, ConceptFigure } from "@/components/concepts/viz-kit";

// 조각의 판정: 널리 확인된 '사실'인지, 그럴듯하게 '지어낸' 것인지. 색은 아래에서
// 사실=ACCENT[1](블루), 지어냄=ACCENT[3](앰버)로 못 박는다.
type Verdict = "fact" | "fake";

type Claim = {
  id: string;
  text: string;
  verdict: Verdict;
  // 지어냄 조각에는 왜 위험한지 한 줄. 사실 조각에는 왜 검증을 통과하는지 한 줄.
  note: string;
};

// 문단에 등장하는 '사실 주장' 조각들. 라벨과 설명은 전부 이 상수 안에 둔다(외부 데이터 금지).
// 일부러 하나만 '사실'(널리 확인된 상식)로 두고, 정밀해 보이는 특정 수치·출처·인명·인용을
// 전부 '지어냄'으로 둔다 — "정확해 보일수록 검증 대상"이라는 감각을 심기 위해서다.
const CLAIMS: readonly Claim[] = [
  {
    id: "general",
    text: "잠이 부족하면 다음 날 집중력이 떨어진다",
    verdict: "fact",
    note: "여러 곳에서 거듭 확인된 일반 상식 — 출처가 없어도 사실일 가능성이 높다.",
  },
  {
    id: "study",
    text: "하버드 의대의 2019년 연구",
    verdict: "fake",
    note: "그럴듯한 기관·연도를 붙였을 뿐, 실제로 이런 연구가 있는지 모델은 확인하지 않았다. 존재하지 않는 논문일 수 있다.",
  },
  {
    id: "number",
    text: "집중력 점수가 23% 높았다",
    verdict: "fake",
    note: "정밀해 보이는 수치일수록 위험하다 — '그럴듯한 숫자'를 이어 붙인 것이지, 어떤 데이터에서 계산한 값이 아니다.",
  },
  {
    id: "name",
    text: "마이클 카터 교수",
    verdict: "fake",
    note: "실존 인물처럼 보이는 이름을 지어냈다. 존재하지 않는 사람에게 없는 말을 씌우는 셈이다.",
  },
  {
    id: "cite",
    text: "《Nature Neuroscience》 2019년 4월호",
    verdict: "fake",
    note: "학술지 이름·발행 시점까지 붙어 가장 믿음직해 보이지만, 바로 그래서 가장 먼저 원문을 찾아 확인해야 한다.",
  },
];

// 문단을 '순수 텍스트 조각'과 '클릭 가능한 주장 조각(claimId)'의 배열로 표현한다.
type Part = string | { claimId: string };

const PARAGRAPH: readonly Part[] = [
  { claimId: "general" },
  "는 잘 알려진 이야기죠. 실제로 ",
  { claimId: "study" },
  "에 따르면, 하루 7시간 반을 잔 사람은 6시간을 잔 사람보다 ",
  { claimId: "number" },
  "고 합니다. 이 연구를 이끈 ",
  { claimId: "name" },
  "는 그 결과를 ",
  { claimId: "cite" },
  "에 실었습니다.",
];

const CLAIM_BY_ID: Record<string, Claim> = Object.fromEntries(
  CLAIMS.map((c) => [c.id, c]),
);

// 판정색: 사실=블루(ACCENT[1]), 지어냄=앰버(ACCENT[3]).
const VERDICT_ACCENT: Record<Verdict, 1 | 3> = { fact: 1, fake: 3 };
const VERDICT_LABEL: Record<Verdict, string> = { fact: "사실", fake: "지어냄" };
const VERDICT_ICON: Record<Verdict, string> = { fact: "✓", fake: "⚠" };

export function HallucinationViz() {
  // 각 조각이 '검증되어 정체가 드러났는지'. 비어 있으면 전부 가려진 상태(그럴듯한 답만 보임).
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const reduce = useReducedMotion();

  const allRevealed = CLAIMS.every((c) => revealed[c.id]);
  const anyRevealed = CLAIMS.some((c) => revealed[c.id]);

  const toggleOne = (id: string) =>
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));

  const verifyAll = () =>
    setRevealed(Object.fromEntries(CLAIMS.map((c) => [c.id, true])));

  const hideAll = () => setRevealed({});

  // 드러난 '지어냄' 조각만 아래 경고 목록에 모은다.
  const revealedFakes = CLAIMS.filter(
    (c) => c.verdict === "fake" && revealed[c.id],
  );

  return (
    <ConceptFigure label="AI의 자신 있는 답 · 무엇을 검증해야 하나">
      {/* 그럴듯한 답 문단 — 사실 주장 조각은 눌러 볼 수 있는 버튼이다. */}
      <div className="border-l-4 border-line bg-surface-2 p-4 dark:border-line-dark dark:bg-surface-2-dark">
        <p className="text-label font-bold tracking-wide text-badge-neutral-text dark:text-badge-neutral-text-dark">
          🤖 AI의 답변
        </p>
        <p className="mt-3 break-keep text-body font-normal leading-loose">
          {PARAGRAPH.map((part, idx) => {
            if (typeof part === "string") {
              return <span key={idx}>{part}</span>;
            }
            const claim = CLAIM_BY_ID[part.claimId];
            const isOpen = revealed[claim.id];
            const accent = ACCENT[VERDICT_ACCENT[claim.verdict]];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleOne(claim.id)}
                aria-pressed={isOpen}
                className={
                  isOpen
                    ? `mx-0.5 inline rounded-sm border-b-2 px-1 py-1 font-bold ${accent.border} ${accent.text}`
                    : "mx-0.5 inline rounded-sm border-b-2 border-dashed border-foreground px-1 py-1 font-medium underline decoration-dotted underline-offset-4 dark:border-foreground-dark"
                }
              >
                {isOpen && (
                  <span aria-hidden="true">{VERDICT_ICON[claim.verdict]} </span>
                )}
                {claim.text}
              </button>
            );
          })}
        </p>
        <p className="mt-3 text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {anyRevealed
            ? "밑줄 조각을 다시 누르면 가려집니다."
            : "밑줄 친 조각을 누르거나, 아래 ‘모두 검증하기’를 눌러보세요."}
        </p>
      </div>

      {/* 컨트롤 — 44px 이상. 자동 없이 사용자가 직접 조작한다. */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={verifyAll}
          disabled={allRevealed}
          className="btn-action tap-feedback min-h-11 px-4 text-label disabled:cursor-not-allowed disabled:opacity-40"
        >
          🔎 모두 검증하기
        </button>
        <button
          type="button"
          onClick={hideAll}
          disabled={!anyRevealed}
          className="btn tap-feedback min-h-11 px-4 text-label disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↺ 다시 가리기
        </button>
      </div>

      {/* 검증 결과 — 드러난 '지어냄' 조각의 위험 이유를 모아 보여준다. */}
      <AnimatePresence mode="wait">
        {revealedFakes.length > 0 && (
          <motion.div
            key={revealedFakes.map((c) => c.id).join(",")}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className={`flex flex-col gap-3 border-l-4 bg-surface-2 p-4 dark:bg-surface-2-dark ${ACCENT[3].border}`}
          >
            <span
              className={`w-fit px-2 py-0.5 text-label font-bold ${ACCENT[3].badge}`}
            >
              ⚠ 지어냄 — 검증 대상 {revealedFakes.length}건
            </span>
            <ul className="flex flex-col gap-2">
              {revealedFakes.map((c) => (
                <li key={c.id} className="break-keep text-label leading-relaxed">
                  <span className={`font-bold ${ACCENT[3].text}`}>
                    “{c.text}”
                  </span>{" "}
                  — {c.note}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 판정 색 안내 + 핵심 한 줄. */}
      <div className="flex flex-col gap-2 border-t-2 border-line pt-4 dark:border-line-dark">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-label font-bold ${ACCENT[1].badge}`}
          >
            {VERDICT_ICON.fact} {VERDICT_LABEL.fact}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-label font-bold ${ACCENT[3].badge}`}
          >
            {VERDICT_ICON.fake} {VERDICT_LABEL.fake}
          </span>
        </div>
        <p className="break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          문법도 말투도 완벽하지만, 정밀해 보이는 수치·출처·인명·인용이 전부
          지어낸 것일 수 있습니다. AI는 ‘그럴듯함’으로 말을 잇지 ‘사실 여부’를
          확인하지 않으니까요.
        </p>
      </div>
    </ConceptFigure>
  );
}
