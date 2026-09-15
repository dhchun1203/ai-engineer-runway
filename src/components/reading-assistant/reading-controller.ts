// 독서 도우미의 상태 머신·플레이어 루프. React에 의존하지 않는 순수 컨트롤러 팩토리다 —
// 내부에 모든 가변 상태(스텝·현재 위치·타이머·재생 여부·속도·초점)를 클로저 변수로
// 들고, 화면 갱신은 주입받은 콜백(onActiveChange 등)으로만 알린다. 이렇게 분리하면
// UI(reading-assistant.tsx)는 렌더만, 컨트롤러는 로직만 담당해 각각 단순해진다.
//
// 브라우저에서만 생성한다(document/window/matchMedia 사용) — 컴포넌트가 클라이언트
// 이벤트(시작 버튼 클릭) 시점에 지연 생성한다.

import {
  buildSteps,
  applyFocus,
  clearFocus,
  scrollStepIntoView,
  firstVisibleStepIndex,
  RA_READING_CLASS,
  type Step,
} from '@/components/reading-assistant/reading-engine';

// 읽기 속도 단계. cps = 초당 글자 수(문장 길이에 비례한 체류 시간을 정한다).
// 기본값 index 2('느리게', 6자/초)는 "집중해서 천천히 보는 속도" — 30자 남짓한
// 문장이 약 5초 머문다. 기본에서 한 칸씩 올릴 때 증가폭이 크지 않도록 단계 간
// 비율을 약 1.2배로 촘촘하게 둔다(예: 6 → 7.2 → 8.6, 이전 6 → 8.5의 절반 수준).
// 아래로도 5·4자/초의 더 느린 단계를 남긴다.
export const SPEED_LEVELS = [
  { label: '아주 느리게', cps: 4 },
  { label: '더 느리게', cps: 5 },
  { label: '느리게', cps: 6 },
  { label: '조금 빠르게', cps: 7.2 },
  { label: '보통', cps: 8.6 },
  { label: '빠르게', cps: 10.3 },
  { label: '아주 빠르게', cps: 12.4 },
] as const;

export const DEFAULT_SPEED_INDEX = 2;

// 문장별 체류 시간의 바닥·천장(ms). 아주 짧은 문장도 한 박자는 머물고, 아주 긴
// 문장도 과하게 오래 붙들지 않게 한다.
const MIN_DWELL_MS = 800;
const MAX_DWELL_MS = 6000;

export type ReadingStatus = 'reading' | 'waiting' | 'scrolled' | 'done';

export type ReadingUI = {
  onActiveChange: (active: boolean) => void;
  onPlayingChange: (playing: boolean) => void;
  onStatusChange: (status: ReadingStatus) => void;
  onSpeedChange: (speedIndex: number) => void;
};

export type ReadingController = {
  activate: () => void;
  deactivate: () => void;
  /** 재생/정지 버튼과 스페이스바가 공유하는 단일 동작. */
  primaryAction: () => void;
  changeSpeed: (delta: number) => void;
  /** 이전 문장으로(좌 화살표). 누르는 순간 자동 재생을 멈춘다. */
  previous: () => void;
  /** 다음 문장으로(우 화살표). 누르는 순간 자동 재생을 멈춘다. */
  next: () => void;
  /** 사용자가 직접 스크롤했을 때(휠·터치·페이지 키) 호출. */
  userScroll: () => void;
  isActive: () => boolean;
  destroy: () => void;
};

function clamp(min: number, value: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function makeReadingController(articleId: string, ui: ReadingUI): ReadingController {
  let steps: Step[] = [];
  let restore: (() => void) | null = null;
  let index = 0;
  let timer: number | null = null;
  let playing = false;
  let speedIndex = DEFAULT_SPEED_INDEX;
  let focused: Step | null = null;
  let scrolled = false;
  let container: HTMLElement | null = null;

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clearTimer(): void {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  }

  function dwellMs(step: Step): number {
    const chars = (step.el.textContent ?? '').trim().length;
    const cps = SPEED_LEVELS[speedIndex].cps;
    return clamp(MIN_DWELL_MS, (chars / cps) * 1000, MAX_DWELL_MS);
  }

  function setPlaying(next: boolean): void {
    if (playing !== next) {
      playing = next;
      ui.onPlayingChange(next);
    }
  }

  function scheduleAdvance(step: Step): void {
    clearTimer();
    timer = window.setTimeout(() => {
      focusStep(index + 1, true);
    }, dwellMs(step));
  }

  // 초점을 i번 스텝으로 옮긴다. scroll이면 화면 중앙으로 이동. 블록 스텝이면
  // 재생을 멈추고 대기(스페이스바 대기), 문장 스텝이면 재생 중일 때 다음 예약.
  function focusStep(i: number, scroll: boolean): void {
    if (focused) {
      clearFocus(focused);
      focused = null;
    }

    if (i >= steps.length) {
      index = steps.length;
      clearTimer();
      setPlaying(false);
      ui.onStatusChange('done');
      return;
    }

    index = i;
    const step = steps[i];
    focused = step;
    applyFocus(step);
    if (scroll) scrollStepIntoView(step, !reduced);

    if (step.kind === 'block') {
      clearTimer();
      setPlaying(false);
      ui.onStatusChange('waiting');
      return;
    }

    ui.onStatusChange('reading');
    if (playing) scheduleAdvance(step);
  }

  function resumeCurrent(): void {
    const step = steps[index];
    if (!step) return;
    if (step.kind === 'block') focusStep(index + 1, true);
    else scheduleAdvance(step);
  }

  function activate(): void {
    if (container) return;
    const el = document.getElementById(articleId);
    if (!el) return;

    const built = buildSteps(el);
    if (built.steps.length === 0) {
      built.restore();
      return;
    }

    steps = built.steps;
    restore = built.restore;
    container = el;
    container.classList.add(RA_READING_CLASS);
    scrolled = false;
    // 맨 처음이 아니라 지금 화면에 보이는 첫 문장부터 시작한다 — 사용자가 스크롤해 둔
    // 자리에서 이어 읽게 한다. 보이는 문장이 없으면 0으로 폴백한다(firstVisibleStepIndex).
    const start = firstVisibleStepIndex(steps);
    index = start;

    ui.onActiveChange(true);
    setPlaying(true);
    ui.onStatusChange('reading');
    focusStep(start, true);
  }

  function deactivate(): void {
    clearTimer();
    if (focused) {
      clearFocus(focused);
      focused = null;
    }
    if (container) container.classList.remove(RA_READING_CLASS);
    if (restore) restore();

    steps = [];
    restore = null;
    index = 0;
    scrolled = false;
    container = null;

    setPlaying(false);
    ui.onActiveChange(false);
    ui.onStatusChange('reading');
  }

  function primaryAction(): void {
    if (!container) return;

    // 스크롤로 멈춘 상태 → 초점 위치로 되돌린 뒤 이어서 재생.
    if (scrolled) {
      scrolled = false;
      const step = steps[index];
      if (step) scrollStepIntoView(step, !reduced);
      ui.onStatusChange('reading');
      setPlaying(true);
      resumeCurrent();
      return;
    }

    // 다 읽은 상태 → 처음부터 다시 재생.
    if (index >= steps.length) {
      setPlaying(true);
      ui.onStatusChange('reading');
      focusStep(0, true);
      return;
    }

    const step = steps[index];

    // 대기 블록에서 스페이스 → 블록을 넘어 다음으로 진행.
    if (step && step.kind === 'block') {
      setPlaying(true);
      ui.onStatusChange('reading');
      focusStep(index + 1, true);
      return;
    }

    // 문장에서 스페이스 → 재생/정지 토글.
    if (playing) {
      clearTimer();
      setPlaying(false);
      ui.onStatusChange('reading');
    } else {
      setPlaying(true);
      ui.onStatusChange('reading');
      resumeCurrent();
    }
  }

  // 좌/우 화살표 — 한 스텝(문장·블록) 이동한다. 누르는 순간 자동 재생을 멈춘다
  // (수동으로 짚어 가는 조작이므로). focusStep은 playing=false이면 다음 예약을 하지
  // 않으므로 그 자리에 멈춰 선다. 다시 진행하려면 스페이스/재생.
  function step(delta: number): void {
    if (!container) return;
    clearTimer();
    setPlaying(false);
    scrolled = false;
    // 다 읽은 상태(index == length)에서 좌는 마지막 문장으로 돌아온다.
    const from = index >= steps.length ? steps.length : index;
    const target = clamp(0, from + delta, steps.length - 1);
    focusStep(target, true);
  }

  function changeSpeed(delta: number): void {
    const next = clamp(0, speedIndex + delta, SPEED_LEVELS.length - 1);
    if (next !== speedIndex) {
      speedIndex = next;
      ui.onSpeedChange(next);
    }
  }

  function userScroll(): void {
    if (!container || !playing) return;
    clearTimer();
    setPlaying(false);
    scrolled = true;
    ui.onStatusChange('scrolled');
  }

  return {
    activate,
    deactivate,
    primaryAction,
    changeSpeed,
    previous: () => step(-1),
    next: () => step(1),
    userScroll,
    isActive: () => container !== null,
    destroy: deactivate,
  };
}
