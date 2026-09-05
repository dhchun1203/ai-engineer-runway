'use client';

// 레슨 요약 영상 (파일럿: "Python 변수·자료형"). 레슨 맨 위에 놓여, 이 하나만
// 끝까지 봐도 레슨 전체 — 변수 → 자료형 4종 → 조건문 → 반복문 → 정리 — 를
// 이해하도록 만든 챕터형 애니메이션 플레이어다. 본문 각 절의 정적 [data-diagram]
// 네 개(상자 / 자료형 4칸 / 갈림길 / 컨베이어벨트)를 움직이는 장면으로 옮겨 담았다.
//
// 색·서체: 새로 정하지 않고 data-diagram 토큰을 물려받는다(globals.css 1206~).
//   SVG에 data-diagram만 달면 레슨 Step 색까지 저절로 따라온다.
// 움직임: CSS transition(opacity/transform)만. 라이브러리 없음.
//   prefers-reduced-motion: reduce이면 자동재생·트랜지션 없이 장면만 즉시 바뀐다.
// 인쇄: data-print-hide로 감춘다 — 본문 각 절의 정적 그림이 종이 몫을 한다.
//
// 장면 데이터(SCENES)는 이 레슨용으로 이 파일 안에 담았다. 다른 레슨으로 넓힐 때
// 이 배열과 stage 렌더러만 갈아끼우면 되도록 플레이어 로직과 분리해 두었다.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

const LAST = SCENES.length - 1;
const BASE_MS = 3800; // 1배속 장면 간격 — 자막을 읽을 시간
const SPEEDS = [0.75, 1, 1.5, 2] as const;

// 챕터 이름 → 그 챕터가 시작하는 장면 인덱스(건너뛰기용). 등장 순서를 보존한다.
const CHAPTERS = SCENES.reduce<{ name: string; at: number }[]>((acc, s, i) => {
  if (!acc.some((c) => c.name === s.ch)) acc.push({ name: s.ch, at: i });
  return acc;
}, []);

export function LessonVideo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isFull, setIsFull] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // ── 전체화면 ──────────────────────────────────────────────────────────
  // 진짜 전체화면 API(Fullscreen API)를 먼저 시도하고, 안 되면(구형 iPad
  // Safari 등 임의 요소 전체화면 미지원) isFull 상태만으로 CSS 가짜 전체화면
  // (position: fixed로 화면 전체를 덮음)을 적용한다 — 어느 기기에서도 동작하게.
  const exitFull = useCallback(() => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => void;
    };
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc);
    }
    setIsFull(false);
  }, []);

  const enterFull = useCallback(() => {
    setIsFull(true);
    const el = containerRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void })
      | null;
    const req = el?.requestFullscreen ?? el?.webkitRequestFullscreen;
    if (el && req) {
      try {
        const p = req.call(el);
        if (p && typeof (p as Promise<void>).catch === 'function') (p as Promise<void>).catch(() => {});
      } catch {
        // 네이티브 전체화면 불가 — 위 setIsFull(true)의 CSS 가짜 전체화면으로 간다.
      }
    }
  }, []);

  const toggleFull = useCallback(() => {
    if (isFull) exitFull();
    else enterFull();
  }, [isFull, enterFull, exitFull]);

  // 네이티브 전체화면을 시스템 UI(Esc·제스처)로 빠져나가면 상태를 맞춘다.
  useEffect(() => {
    const onChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element };
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) setIsFull(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  // 전체화면 동안 배경 스크롤을 막는다. (키보드 조작은 재생/이전/다음 콜백이
  // 정의된 뒤 아래 별도 effect에서 처리한다.)
  useEffect(() => {
    if (!isFull) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isFull]);

  // 자동재생 — 마지막 직전에서 재생을 함께 끈다. 멈춤(setState)은 effect 본문이
  // 아니라 타이머 콜백에서 일어난다(react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!playing || reduced || step >= LAST) return;
    timer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, LAST));
      if (step + 1 >= LAST) setPlaying(false);
    }, BASE_MS / speed);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, reduced, step, speed]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (!p && step >= LAST) setStep(0);
      return !p;
    });
  }, [step]);

  const goPrev = useCallback(() => {
    setPlaying(false);
    setStep((s) => Math.max(s - 1, 0));
  }, []);
  const goNext = useCallback(() => {
    setPlaying(false);
    setStep((s) => Math.min(s + 1, LAST));
  }, []);
  const jump = useCallback((at: number) => {
    setPlaying(false);
    setStep(at);
  }, []);

  // 전체화면 키보드 조작: 스페이스=재생/정지, ←/→=이전/다음 장면,
  // ↑/↓=속도 증가/감소, Esc=나가기. 재생/이전/다음 콜백을 참조하므로 그 뒤에
  // 둔다. preventDefault로 스페이스·방향키의 기본 스크롤을 막는다.
  useEffect(() => {
    if (!isFull) return;
    const onKey = (e: KeyboardEvent) => {
      // 스페이스는 브라우저마다 e.key가 ' '/'Spacebar'로 갈리므로 e.code로도 잡는다.
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        togglePlay();
        return;
      }
      switch (e.key) {
        case 'Escape':
          exitFull();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSpeed((s) => SPEEDS[Math.min((SPEEDS as readonly number[]).indexOf(s) + 1, SPEEDS.length - 1)]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSpeed((s) => SPEEDS[Math.max((SPEEDS as readonly number[]).indexOf(s) - 1, 0)]);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFull, exitFull, togglePlay, goPrev, goNext]);

  const scene = SCENES[step];
  const trans = reduced ? undefined : 'opacity .4s ease, transform .55s ease';
  const activeChapter = useMemo(
    () => CHAPTERS.reduce((cur, c) => (step >= c.at ? c.name : cur), CHAPTERS[0].name),
    [step],
  );

  return (
    <div
      ref={containerRef}
      data-print-hide
      className="panel-hero my-6 flex flex-col gap-3 p-4"
      role="group"
      aria-label="이 레슨 요약 영상 — 변수·자료형·조건문·반복문"
      style={
        isFull
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              margin: 0,
              maxWidth: 'none',
              border: 'none',
              boxShadow: 'none',
              overflow: 'auto',
              justifyContent: 'center',
            }
          : undefined
      }
    >
      {/* 헤더 — 이게 무엇인지 한 줄로 + 전체화면 토글. */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-label font-bold">▶ 레슨 한눈에 보기</p>
        <div className="flex items-center gap-2">
          <span className="text-caption opacity-70">{activeChapter}</span>
          <button
            type="button"
            onClick={toggleFull}
            className="chip tap-feedback text-caption"
            aria-label={isFull ? '전체화면 나가기' : '전체화면으로 보기'}
          >
            {isFull ? '✕ 닫기' : '⛶ 전체화면'}
          </button>
        </div>
      </div>

      {/* 챕터 건너뛰기 */}
      <div className="flex flex-wrap gap-1.5">
        {CHAPTERS.map((c) => {
          const on = c.name === activeChapter;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => jump(c.at)}
              className="chip tap-feedback text-caption"
              aria-pressed={on}
              style={
                on
                  ? { backgroundColor: 'var(--color-action)', color: 'var(--color-surface)' }
                  : undefined
              }
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {/* 코드 한 줄 — 지금 장면과 짝이 되는 코드(있을 때만). */}
      <p className="text-center font-mono text-body" style={{ minHeight: '1.6em' }}>
        {scene.code ?? ''}
      </p>

      {/* 무대 — 챕터에 따라 다른 그림. 높이를 고정해 장면이 바뀌어도 튀지 않는다. */}
      <svg
        data-diagram
        viewBox="0 0 480 260"
        role="img"
        aria-label={scene.cap}
        // 전체화면에서는 높이 기준으로 키워 화면을 넉넉히 쓴다(폭은 92vw로 제한).
        // 평소엔 34rem 폭 제한. viewBox 비율은 유지된다.
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

      {/* 자막 — 3줄까지 자리를 잡아 컨트롤이 위아래로 튀지 않게 한다. */}
      <p
        className="text-center text-body font-normal"
        style={{ minHeight: '4.2em' }}
        aria-live="polite"
      >
        {scene.cap}
      </p>

      {/* 진행 점 */}
      <div className="flex flex-wrap justify-center gap-1" aria-hidden="true">
        {SCENES.map((_, i) => (
          <span
            key={i}
            className="h-1.5 w-1.5"
            style={{ backgroundColor: i <= step ? 'var(--color-action)' : 'var(--color-line)' }}
          />
        ))}
      </div>

      {/* 컨트롤 */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={step === 0}
          className="btn tap-feedback text-label"
          aria-label="이전 장면"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="btn-action tap-feedback text-label"
          aria-label={playing ? '일시정지' : '재생'}
        >
          {playing ? '❚❚ 일시정지' : step >= LAST ? '↻ 다시 재생' : '▶ 재생'}
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={step >= LAST}
          className="btn tap-feedback text-label"
          aria-label="다음 장면"
        >
          ▶
        </button>
      </div>

      {/* 속도 + 진행 표시 */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-caption opacity-70">속도</span>
        {SPEEDS.map((sp) => {
          const on = sp === speed;
          return (
            <button
              key={sp}
              type="button"
              onClick={() => setSpeed(sp)}
              className="chip tap-feedback text-caption"
              aria-pressed={on}
              style={
                on
                  ? { backgroundColor: 'var(--color-action)', color: 'var(--color-surface)' }
                  : undefined
              }
            >
              {sp}×
            </button>
          );
        })}
      </div>

      <p className="text-center text-caption opacity-70">
        {step + 1} / {SCENES.length}
        {step > 0 && (
          <>
            {' · '}
            <button type="button" onClick={() => jump(0)} className="underline">
              처음부터
            </button>
          </>
        )}
      </p>

      {/* 전체화면 단축키 안내 — 전체화면에서만. */}
      {isFull && (
        <p className="text-center text-caption opacity-60">
          스페이스 재생/정지 · ←/→ 이전·다음 · ↑/↓ 속도 · Esc 나가기
        </p>
      )}
    </div>
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
