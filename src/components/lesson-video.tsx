'use client';

// 레슨 요약 영상 — 파일럿 "Python 변수·자료형" 전용. 레슨 맨 위에 놓여, 이 하나만
// 끝까지 봐도 레슨 전체(변수 → 자료형 4종 → 조건문 → 반복문 → 정리)를 이해하도록
// 개념을 손으로 애니메이션한 무대를 재생한다. 본문 각 절의 정적 [data-diagram]
// 네 개(상자 / 자료형 4칸 / 갈림길 / 컨베이어벨트)를 움직이는 장면으로 옮겨 담았다.
//
// 재생 상태·자동재생·전체화면·키보드·크롬 UI는 lesson-player-core.tsx가 담당하고,
// 이 파일은 이 레슨의 장면 데이터(SCENES)와 무대 그림(Stage 컴포넌트)만 담는다.
// 다른 레슨은 lesson-presenter.tsx(본문 그림 자동 재생)를 쓴다.
//
// 색·서체: data-diagram 토큰을 물려받는다(globals.css 1206~). 인쇄: 코어의
// data-print-hide로 감추고 본문 각 절의 정적 그림이 종이 몫을 한다.

import { useMemo } from 'react';
import { PlayerFrame, useLessonPlayer } from '@/components/lesson-player-core';
import type { Chapter } from '@/components/lesson-player-core';

type Stage = 'var' | 'types' | 'if' | 'for' | 'summary';
type Scene = { ch: string; stage: Stage; sub: number; cap: string; code?: string };

// 챕터 순서대로 나열한 장면들. sub는 각 stage 안에서의 공개 단계다.
const SCENES: Scene[] = [
  // ── 챕터 1: 변수 ──────────────────────────────────────────────
  { ch: '변수', stage: 'var', sub: 0, cap: '파이썬 코드 한 줄부터. age = 25 — 여기서 무슨 일이 일어날까요?', code: 'age = 25' },
  { ch: '변수', stage: 'var', sub: 1, cap: '먼저 담을 값 25가 준비됩니다.', code: 'age = 25' },
  { ch: '변수', stage: 'var', sub: 2, cap: '그 값을 담아 둘 빈 상자가 하나 만들어져요.', code: 'age = 25' },
  { ch: '변수', stage: 'var', sub: 3, cap: '값 25가 상자 안으로 쏙 들어갑니다.', code: 'age = 25' },
  { ch: '변수', stage: 'var', sub: 4, cap: "상자에 age 이름표를 붙이면 — 이 상자가 바로 '변수'예요.", code: 'age = 25' },
  { ch: '변수', stage: 'var', sub: 5, cap: '이제 age라고 부르면 언제든 25가 나와요. 파이썬은 값을 넣는 순간 종류를 스스로 정합니다(동적 타이핑).', code: 'age = 25' },
  // ── 챕터 2: 자료형 4종 ────────────────────────────────────────
  { ch: '자료형', stage: 'types', sub: 0, cap: "상자에 담기는 값은 '종류'가 있어요. 기본은 네 가지." },
  { ch: '자료형', stage: 'types', sub: 1, cap: '정수 int — 25처럼 딱 떨어지는 수. 사람 수를 셀 때처럼.' },
  { ch: '자료형', stage: 'types', sub: 2, cap: '실수 float — 175.5처럼 소수점이 있는 수. 키·체중처럼.' },
  { ch: '자료형', stage: 'types', sub: 3, cap: '문자열 str — "지현"처럼 따옴표로 감싼 글자.' },
  { ch: '자료형', stage: 'types', sub: 4, cap: '불리언 bool — True / False. 스위치의 켜짐·꺼짐.' },
  { ch: '자료형', stage: 'types', sub: 5, cap: '숫자와 글자는 자동으로 안 섞여요. "나이:" + 25는 에러 — f-string  f"나이:{25}" 로 합칩니다.' },
  // ── 챕터 3: 조건문 ────────────────────────────────────────────
  { ch: '조건문', stage: 'if', sub: 0, cap: "조건문은 '갈림길'이에요. 점수로 등급을 정해봅시다.", code: 'if score >= 90: ...' },
  { ch: '조건문', stage: 'if', sub: 1, cap: '점수가 90 이상이면? → A등급으로 갑니다.', code: 'if score >= 90:' },
  { ch: '조건문', stage: 'if', sub: 2, cap: '아니면 한 칸 내려가, 80 이상이면? → B등급.', code: 'elif score >= 80:' },
  { ch: '조건문', stage: 'if', sub: 3, cap: '그것도 아니면 → else, C등급.', code: 'else:' },
  { ch: '조건문', stage: 'if', sub: 4, cap: '한 번에 딱 한 길만 지나가요. 85점이면 B등급 하나만 실행됩니다.', code: 'score = 85  # → B' },
  // ── 챕터 4: 반복문 ────────────────────────────────────────────
  { ch: '반복문', stage: 'for', sub: 0, cap: "반복문은 '컨베이어벨트'. 명단을 한 명씩 흘려보내요.", code: 'for m in 명단:' },
  { ch: '반복문', stage: 'for', sub: 1, cap: "김지현 → '안녕, 김지현'", code: 'for m in 명단:' },
  { ch: '반복문', stage: 'for', sub: 2, cap: "이서준 → '안녕, 이서준'", code: 'for m in 명단:' },
  { ch: '반복문', stage: 'for', sub: 3, cap: "박민아 → '안녕, 박민아'", code: 'for m in 명단:' },
  { ch: '반복문', stage: 'for', sub: 4, cap: '명단이 3명이면 인사도 3번. 항목마다 같은 코드가 한 번씩 돌아요.', code: 'for m in 명단:' },
  // ── 챕터 5: 정리 ──────────────────────────────────────────────
  { ch: '정리', stage: 'summary', sub: 0, cap: '값을 상자에 담고(변수), 종류를 구분하고(자료형), 갈림길에서 고르고(조건문), 하나씩 반복한다(반복문). 이 네 가지가 모든 코드의 재료예요.' },
];

// 챕터 이름 → 그 챕터가 시작하는 장면 인덱스(건너뛰기용). 등장 순서를 보존한다.
const CHAPTERS: Chapter[] = SCENES.reduce<Chapter[]>((acc, s, i) => {
  if (!acc.some((c) => c.name === s.ch)) acc.push({ name: s.ch, at: i });
  return acc;
}, []);

export function LessonVideo() {
  const player = useLessonPlayer({ count: SCENES.length });
  const { step, reduced, isFull } = player;
  const scene = SCENES[step];
  const trans = reduced ? undefined : 'opacity .4s ease, transform .55s ease';
  const activeChapter = useMemo(
    () => CHAPTERS.reduce((cur, c) => (step >= c.at ? c.name : cur), CHAPTERS[0].name),
    [step],
  );

  return (
    <PlayerFrame
      player={player}
      ariaLabel="이 레슨 요약 영상 — 변수·자료형·조건문·반복문"
      chapters={CHAPTERS}
      activeChapter={activeChapter}
      code={scene.code ?? ''}
      caption={scene.cap}
    >
      {/* 무대 — 챕터에 따라 다른 그림. 전체화면에서는 높이 기준으로 키운다. */}
      <svg
        data-diagram
        viewBox="0 0 480 260"
        role="img"
        aria-label={scene.cap}
        style={
          isFull
            ? { margin: '0 auto', height: 'min(52vh, 32rem)', width: 'auto', maxWidth: '92vw' }
            : { margin: '0 auto', maxWidth: '34rem' }
        }
      >
        {scene.stage === 'var' && <VarStage sub={scene.sub} trans={trans} />}
        {scene.stage === 'types' && <TypesStage sub={scene.sub} trans={trans} />}
        {scene.stage === 'if' && <IfStage sub={scene.sub} trans={trans} />}
        {scene.stage === 'for' && <ForStage sub={scene.sub} trans={trans} />}
        {scene.stage === 'summary' && <SummaryStage trans={trans} />}
      </svg>
    </PlayerFrame>
  );
}

// ── 무대들 ────────────────────────────────────────────────────────────────
// 모든 좌표는 viewBox 0 0 480 260 기준. 각 무대는 sub(공개 단계)에 따라 요소를
// 켜고 끈다. 색은 전부 --diagram-* 토큰(부모 SVG의 data-diagram이 정의).

type StageProps = { sub: number; trans?: string };

// 변수 = 이름표 붙은 상자. 값 준비 → 상자 → 값 진입 → 이름표.
function VarStage({ sub, trans }: StageProps) {
  return (
    <>
      <g style={{ opacity: sub >= 2 ? 1 : 0, transition: trans }}>
        <rect x="190" y="112" width="112" height="80" fill="var(--diagram-line)" />
        <rect x="186" y="108" width="112" height="80" fill="var(--diagram-soft)" stroke="var(--diagram-ink)" strokeWidth="2" />
      </g>
      <g
        style={{
          opacity: sub >= 1 ? 1 : 0,
          transform: sub >= 3 ? 'translateX(0)' : 'translateX(150px)',
          transition: trans,
        }}
      >
        <text x="242" y="162" textAnchor="middle" fontSize="42" fill="var(--diagram-ink)">25</text>
      </g>
      <g style={{ opacity: sub >= 4 ? 1 : 0, transition: trans }}>
        <rect x="206" y="82" width="72" height="30" fill="var(--diagram-accent)" />
        <text x="242" y="103" textAnchor="middle" fontSize="17" fill="var(--diagram-on-accent)">age</text>
        <line x1="150" y1="97" x2="202" y2="97" stroke="var(--diagram-ink)" strokeWidth="2" />
        <text x="144" y="102" textAnchor="end" fontSize="13" fill="var(--diagram-ink)">이름표</text>
      </g>
    </>
  );
}

// 자료형 4종 — 값 상자가 하나씩 등장하고 아래에 형 이름.
const TYPES = [
  { v: '25', t: 'int' },
  { v: '175.5', t: 'float' },
  { v: '"지현"', t: 'str' },
  { v: 'True', t: 'bool' },
];
function TypesStage({ sub, trans }: StageProps) {
  return (
    <>
      {TYPES.map((d, i) => {
        const x = 12 + i * 118;
        const on = sub >= i + 1;
        return (
          <g key={d.t} style={{ opacity: on ? 1 : 0, transition: trans }}>
            <rect x={x + 4} y={82} width={104} height={82} fill="var(--diagram-line)" />
            <rect x={x} y={78} width={104} height={82} fill="var(--diagram-soft)" stroke="var(--diagram-ink)" strokeWidth="2" />
            <text x={x + 52} y={128} textAnchor="middle" fontSize="21" fill="var(--diagram-ink)">{d.v}</text>
            <text x={x + 52} y={190} textAnchor="middle" fontSize="17" fill="var(--diagram-accent)">{d.t}</text>
          </g>
        );
      })}
    </>
  );
}

// 조건문 = 갈림길. 세 줄(조건 → 결과), 활성 줄만 진하게. 마지막엔 85점이 B로.
const IF_ROWS = [
  { cond: '점수 ≥ 90 ?', res: 'A등급' },
  { cond: '점수 ≥ 80 ?', res: 'B등급' },
  { cond: '그 외 (else)', res: 'C등급' },
];
function IfStage({ sub, trans }: StageProps) {
  // sub 1~3 → 그 줄 활성. sub 4 → 85점이므로 2번째(B) 활성.
  const activeRow = sub === 0 ? 0 : sub <= 3 ? sub : 2;
  return (
    <>
      {IF_ROWS.map((r, i) => {
        const row = i + 1;
        const y = 20 + i * 80;
        const active = row === activeRow;
        return (
          <g key={r.res}>
            <rect x="18" y={y} width="196" height="56" fill="var(--diagram-soft)" stroke="var(--diagram-accent)" strokeWidth={active ? 3 : 1.5} style={{ transition: trans }} />
            <text x="116" y={y + 34} textAnchor="middle" fontSize="17" fill="var(--diagram-ink)">{r.cond}</text>
            <line x1="214" y1={y + 28} x2="252" y2={y + 28} stroke="var(--diagram-ink)" strokeWidth="2" />
            <polygon points={`252,${y + 22} 264,${y + 28} 252,${y + 34}`} fill="var(--diagram-ink)" />
            <rect x="270" y={y} width="196" height="56" fill="var(--diagram-accent)" style={{ opacity: active ? 1 : 0.28, transition: trans }} />
            <text x="368" y={y + 34} textAnchor="middle" fontSize="17" fill="var(--diagram-on-accent)" style={{ opacity: active ? 1 : 0.28, transition: trans }}>{r.res}</text>
            {i < 2 && (
              <>
                <line x1="116" y1={y + 56} x2="116" y2={y + 80} stroke="var(--diagram-ink)" strokeWidth="2" />
                <polygon points={`110,${y + 80} 122,${y + 80} 116,${y + 92}`} fill="var(--diagram-ink)" />
              </>
            )}
          </g>
        );
      })}
      <g style={{ opacity: sub >= 4 ? 1 : 0, transition: trans }}>
        <rect x="18" y="230" width="120" height="26" fill="var(--diagram-accent)" />
        <text x="78" y="249" textAnchor="middle" fontSize="15" fill="var(--diagram-on-accent)">점수 = 85</text>
      </g>
    </>
  );
}

// 반복문 = 컨베이어벨트. 명단 3 → 같은 코드 → 인사 3(하나씩 등장).
const FOR_NAMES = ['김지현', '이서준', '박민아'];
function ForStage({ sub, trans }: StageProps) {
  const rowY = [24, 104, 184];
  const current = sub >= 1 && sub <= 3 ? sub - 1 : -1; // 지금 처리 중인 항목
  return (
    <>
      {/* 명단 */}
      {FOR_NAMES.map((n, i) => (
        <g key={n}>
          <rect x="10" y={rowY[i]} width="120" height="52" fill="var(--diagram-soft)" stroke="var(--diagram-ink)" strokeWidth={current === i ? 3 : 2} style={{ transition: trans }} />
          <text x="70" y={rowY[i] + 33} textAnchor="middle" fontSize="18" fill="var(--diagram-ink)">{n}</text>
          <line x1="130" y1={rowY[i] + 26} x2="176" y2={rowY[i] + 26} stroke="var(--diagram-ink)" strokeWidth="2" />
        </g>
      ))}
      <line x1="176" y1="50" x2="176" y2="210" stroke="var(--diagram-ink)" strokeWidth="2" />
      <line x1="176" y1="130" x2="204" y2="130" stroke="var(--diagram-ink)" strokeWidth="2" />
      <polygon points="204,124 216,130 204,136" fill="var(--diagram-ink)" />
      {/* 같은 코드 */}
      <rect x="220" y="96" width="120" height="72" fill="var(--diagram-accent)" />
      <text x="280" y="128" textAnchor="middle" fontSize="16" fill="var(--diagram-on-accent)">항목마다</text>
      <text x="280" y="150" textAnchor="middle" fontSize="16" fill="var(--diagram-on-accent)">같은 코드</text>
      <line x1="340" y1="50" x2="340" y2="210" stroke="var(--diagram-ink)" strokeWidth="2" />
      <line x1="332" y1="130" x2="340" y2="130" stroke="var(--diagram-ink)" strokeWidth="2" />
      {/* 인사 출력 — 하나씩 */}
      {FOR_NAMES.map((n, i) => (
        <g key={`out-${n}`} style={{ opacity: sub >= i + 1 ? 1 : 0, transition: trans }}>
          <line x1="340" y1={rowY[i] + 26} x2="368" y2={rowY[i] + 26} stroke="var(--diagram-ink)" strokeWidth="2" />
          <polygon points={`368,${rowY[i] + 20} 380,${rowY[i] + 26} 368,${rowY[i] + 32}`} fill="var(--diagram-ink)" />
          <text x="386" y={rowY[i] + 32} textAnchor="start" fontSize="15" fill="var(--diagram-ink)">안녕, {n}</text>
        </g>
      ))}
    </>
  );
}

// 정리 — 네 재료를 한 줄에.
const SUMMARY = [
  { k: '변수', v: '상자' },
  { k: '자료형', v: '종류' },
  { k: '조건문', v: '갈림길' },
  { k: '반복문', v: '반복' },
];
function SummaryStage({ trans }: { trans?: string }) {
  return (
    <g style={{ opacity: 1, transition: trans }}>
      {SUMMARY.map((s, i) => {
        const x = 16 + i * 116;
        return (
          <g key={s.k}>
            <rect x={x + 4} y={94} width={100} height={72} fill="var(--diagram-line)" />
            <rect x={x} y={90} width={100} height={72} fill="var(--diagram-accent)" />
            <text x={x + 50} y={124} textAnchor="middle" fontSize="18" fill="var(--diagram-on-accent)">{s.k}</text>
            <text x={x + 50} y={148} textAnchor="middle" fontSize="14" fill="var(--diagram-on-accent)">{s.v}</text>
          </g>
        );
      })}
      <text x="240" y="210" textAnchor="middle" fontSize="15" fill="var(--diagram-accent)">모든 코드의 네 가지 재료</text>
    </g>
  );
}
