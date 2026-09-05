'use client';

// 개념 애니메이션 파일럿 (레슨 "Python 변수·자료형"). "변수에 값이 담기는 과정"을
// 한 단계씩 움직여 보여주는 재생 플레이어다 — 정적 그림 [data-diagram] 하나가
// 담던 결과 장면을, 값이 준비되고 → 상자가 생기고 → 값이 들어가고 → 이름표가
// 붙는 흐름으로 쪼개 "영상처럼" 재생한다.
//
// 왜 새 그림을 그리지 않고 [data-diagram]을 다시 쓰는가: 색·서체 토큰
// (--diagram-accent / --diagram-ink / --diagram-soft / --diagram-line /
// --diagram-on-accent, 그리고 text의 산세 서체)이 전부 그 셀렉터에 걸려 있다
// (globals.css 1206~). SVG에 data-diagram만 달면 레슨 Step 색까지 저절로
// 따라오므로 여기서 색을 새로 정하지 않는다(check-design-tokens 규칙 a와 같은 정신).
// 대신 [data-diagram]의 기본 margin(2.4em auto)은 패널 안에서 과하므로 아래
// style로 0으로 덮는다.
//
// 움직임은 CSS transition(opacity/transform)만 쓴다 — 그림 하나 움직이자고
// 애니메이션 라이브러리를 얹지 않는다. prefers-reduced-motion: reduce이면
// 자동 재생을 끄고 트랜지션도 없이 단계만 즉시 바뀐다(사이트 전역 원칙과 일치).
//
// 인쇄: data-print-hide로 종이에서 감춘다 — 정지 화면이 필요한 인쇄본은 바로
// 위 정적 [data-diagram]이 이미 담당한다.

import { useCallback, useEffect, useRef, useState } from 'react';

// 6개 장면. 각 장면의 자막(caption)과 코드 강조 토큰을 한 곳에 모아 둔다 —
// 장면 수가 곧 진행바 점의 수이고, 마지막 장면에서 자동 재생이 멈춘다.
const SCENES = [
  { caption: '이 한 줄이 무슨 일을 하는지, 한 단계씩 볼게요.', hl: 'none' },
  { caption: '먼저 담을 값 25가 준비됩니다.', hl: 'value' },
  { caption: '값을 담아 둘 빈 상자(변수)가 하나 만들어져요.', hl: 'box' },
  { caption: '값 25가 상자 안으로 쏙 들어갑니다.', hl: 'value' },
  { caption: "상자에 age라는 이름표를 붙여요 — 이게 변수 이름입니다.", hl: 'name' },
  { caption: '이제 age라고 부르면 언제든 25가 나옵니다.', hl: 'all' },
] as const;

const LAST = SCENES.length - 1;
const STEP_MS = 2200; // 장면 자동 넘김 간격

export function VarBoxAnim() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 접근성: 움직임 최소화 설정을 존중한다. 켜져 있으면 자동 재생 자체를 막고
  // (아래 effect) 트랜지션도 끈다 — 단계는 버튼으로 즉시 전환된다.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // 자동 재생 타이머. 한 장면씩 넘기다 마지막 직전에서 다음 장면이 곧 끝임을
  // 알면 재생을 함께 끈다. 멈춤(setState)은 effect 본문이 아니라 타이머 콜백
  // 안에서 일어난다 — effect 본문의 동기 setState는 cascading render를 부른다
  // (react-hooks/set-state-in-effect). 마지막 장면(step >= LAST)에서는 애초에
  // 타이머를 걸지 않는다.
  useEffect(() => {
    if (!playing || reduced || step >= LAST) return;
    timer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, LAST));
      // 이 타이머가 마지막 장면으로 넘기는 것이면 재생을 여기서 끝낸다.
      if (step + 1 >= LAST) setPlaying(false);
    }, STEP_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, reduced, step]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      // 끝에서 재생을 누르면 처음부터 다시 튼다.
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

  const restart = useCallback(() => {
    setPlaying(false);
    setStep(0);
  }, []);

  const scene = SCENES[step];
  const trans = reduced ? undefined : 'opacity .45s ease, transform .6s ease';

  // 장면별 표시 상태 — 값 등장(1~) / 상자 등장(2~) / 값이 상자로 이동(3~) /
  // 이름표 등장(4~). 값은 처음엔 상자 오른쪽 밖에 떠 있다가 3장면에서 들어온다.
  const valueOn = step >= 1;
  const boxOn = step >= 2;
  const valueIn = step >= 3;
  const nameOn = step >= 4;

  // 코드 한 줄 `age = 25` 을 토큰별로 강조한다. 강조 대상은 장면의 hl이 정한다.
  const hlName = scene.hl === 'name' || scene.hl === 'all';
  const hlValue = scene.hl === 'value' || scene.hl === 'all';

  return (
    <div
      data-print-hide
      className="panel my-8 flex flex-col gap-3 p-4"
      role="group"
      aria-label="변수에 값이 담기는 과정 애니메이션"
    >
      {/* 코드 한 줄 — 지금 어느 부분을 이야기하는지 토큰 강조로 짚어 준다. */}
      <p className="text-center font-mono text-body">
        <CodeToken text="age" active={hlName} />
        <span className="opacity-60"> = </span>
        <CodeToken text="25" active={hlValue} />
      </p>

      {/* 장면. data-diagram으로 색·서체 토큰을 물려받는다(위 주석 참고). */}
      <svg
        data-diagram
        viewBox="0 0 440 200"
        role="img"
        aria-label={scene.caption}
        style={{ margin: 0, maxWidth: '30rem' }}
      >
        {/* 빈 상자 — 하드 그림자(뒤 rect) + 잉크 테두리 면(앞 rect). 정적
            그림과 같은 이중 사각형 관례를 그대로 따른다. */}
        <g style={{ opacity: boxOn ? 1 : 0, transition: trans }}>
          <rect x="174" y="82" width="108" height="76" fill="var(--diagram-line)" />
          <rect
            x="170"
            y="78"
            width="108"
            height="76"
            fill="var(--diagram-soft)"
            stroke="var(--diagram-ink)"
            strokeWidth="2"
          />
        </g>

        {/* 값 25 — 처음엔 상자 오른쪽 밖(+150)에 떠 있다가 3장면에서 상자
            중앙으로 슬라이드해 들어온다. */}
        <g
          style={{
            opacity: valueOn ? 1 : 0,
            transform: valueIn ? 'translateX(0)' : 'translateX(150px)',
            transition: trans,
          }}
        >
          <text x="224" y="130" textAnchor="middle" fontSize="40" fill="var(--diagram-ink)">
            25
          </text>
        </g>

        {/* 이름표 age — 상자 윗변에 걸치는 강조색 라벨(정적 그림과 같은 배치). */}
        <g style={{ opacity: nameOn ? 1 : 0, transition: trans }}>
          <rect x="188" y="52" width="72" height="30" fill="var(--diagram-accent)" />
          <text x="224" y="73" textAnchor="middle" fontSize="17" fill="var(--diagram-on-accent)">
            age
          </text>
          <line x1="130" y1="67" x2="184" y2="67" stroke="var(--diagram-line)" strokeWidth="2" />
          <text x="124" y="72" textAnchor="end" fontSize="13" fill="var(--diagram-ink)">
            이름표
          </text>
        </g>
      </svg>

      {/* 자막 — 화면 낭독기가 장면 전환을 읽도록 aria-live. 자막 길이가 장면마다
          달라도 아래 컨트롤이 위아래로 튀지 않게 최소 높이를 확보한다. minHeight는
          em 상대값이라 대응하는 Tailwind 스페이싱 토큰이 없어 인라인 style로 둔다
          (className 대괄호 임의값은 check-design-tokens 규칙 c가 막는다). */}
      <p
        className="text-center text-body font-normal"
        style={{ minHeight: '2.5em' }}
        aria-live="polite"
      >
        {scene.caption}
      </p>

      {/* 진행 점 — 지금 몇 번째 장면인지. */}
      <div className="flex justify-center gap-1.5" aria-hidden="true">
        {SCENES.map((_, i) => (
          <span
            key={i}
            className="h-1.5 w-1.5"
            style={{
              backgroundColor: i <= step ? 'var(--color-action)' : 'var(--color-line)',
            }}
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
          ◀ 이전
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
          다음 ▶
        </button>
      </div>

      <p className="text-center text-caption opacity-70">
        {step + 1} / {SCENES.length}
        {step > 0 && (
          <>
            {' · '}
            <button type="button" onClick={restart} className="underline">
              처음부터
            </button>
          </>
        )}
      </p>
    </div>
  );
}

// 코드 토큰 한 조각. active면 강조색 배경으로 지금 이야기 중인 부분을 짚는다.
function CodeToken({ text, active }: { text: string; active: boolean }) {
  return (
    <span
      style={
        active
          ? {
              backgroundColor: 'var(--diagram-accent)',
              color: 'var(--diagram-on-accent)',
              padding: '0.05em 0.35em',
              fontWeight: 800,
            }
          : undefined
      }
    >
      {text}
    </span>
  );
}
