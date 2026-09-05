'use client';

// 레슨 요약 영상 플레이어의 공유 코어. 두 종류의 플레이어가 이 로직·크롬을 함께
// 쓴다:
//  - lesson-video.tsx (LessonVideo): 파일럿 1-3 전용, 개념을 손으로 애니메이션한
//    무대(변수 상자·자료형·갈림길·컨베이어)를 재생.
//  - lesson-presenter.tsx (LessonPresenter): 모든 레슨 공용. 레슨이 이미 가진
//    본문 정적 그림([data-diagram])을 그 자리에서 모아 캡션과 함께 재생.
//
// 여기서는 재생 상태·자동재생·전체화면·키보드 조작(공통)과 크롬 UI(헤더·챕터 칩·
// 컨트롤·속도·진행·전체화면 단축키 안내)를 한 곳에 둔다. 무대(그림)만 각 플레이어가
// children으로 끼워 넣는다.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export const DEFAULT_SPEEDS = [0.75, 1, 1.5, 2] as const;
export const BASE_MS = 3800; // 1배속 장면 간격 — 자막을 읽을 시간

export type Chapter = { name: string; at: number };

export type LessonPlayer = ReturnType<typeof useLessonPlayer>;

// 재생 상태 + 자동재생 + 전체화면 + 키보드. count(장면 수)는 실행 중 바뀔 수 있다
// (LessonPresenter는 마운트 후 그림을 모아 정한다) — last를 매 렌더 다시 계산한다.
export function useLessonPlayer({
  count,
  baseMs = BASE_MS,
  speeds = DEFAULT_SPEEDS,
}: {
  count: number;
  baseMs?: number;
  speeds?: readonly number[];
}) {
  const last = Math.max(count - 1, 0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isFull, setIsFull] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 움직임 최소화 설정을 존중 — 켜지면 자동재생·트랜지션을 끈다.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // ── 전체화면 ──────────────────────────────────────────────────────────
  // 진짜 전체화면 API를 먼저 시도하고, 안 되면(구형 iPad Safari 등) isFull 상태만으로
  // CSS 가짜 전체화면(position:fixed)을 적용한다 — 어느 기기에서도 동작하게.
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

  // 시스템 UI(Esc·제스처)로 네이티브 전체화면을 빠져나가면 상태를 맞춘다.
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

  // 전체화면 동안 배경 스크롤을 막는다.
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
    if (!playing || reduced || step >= last) return;
    timer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, last));
      if (step + 1 >= last) setPlaying(false);
    }, baseMs / speed);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, reduced, step, speed, last, baseMs]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (!p && step >= last) setStep(0);
      return !p;
    });
  }, [step, last]);

  const goPrev = useCallback(() => {
    setPlaying(false);
    setStep((s) => Math.max(s - 1, 0));
  }, []);
  const goNext = useCallback(() => {
    setPlaying(false);
    setStep((s) => Math.min(s + 1, last));
  }, [last]);
  const jump = useCallback(
    (at: number) => {
      setPlaying(false);
      setStep(Math.min(Math.max(at, 0), last));
    },
    [last],
  );

  // 전체화면 키보드: 스페이스=재생/정지, ←/→=이전/다음, ↑/↓=속도, Esc=나가기.
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
          setSpeed((s) => speeds[Math.min((speeds as readonly number[]).indexOf(s) + 1, speeds.length - 1)]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSpeed((s) => speeds[Math.max((speeds as readonly number[]).indexOf(s) - 1, 0)]);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFull, exitFull, togglePlay, goPrev, goNext, speeds]);

  return {
    step,
    playing,
    reduced,
    speed,
    isFull,
    last,
    count,
    speeds,
    containerRef,
    setSpeed,
    togglePlay,
    goPrev,
    goNext,
    jump,
    toggleFull,
  };
}

// 플레이어 크롬(무대를 뺀 껍데기): 패널 + 헤더(전체화면 토글) + 챕터 칩 + 코드 한 줄
// + [무대=children] + 자막 + 진행 점 + 컨트롤 + 속도 + 진행 표시 + 전체화면 단축키.
export function PlayerFrame({
  player,
  ariaLabel,
  chapters,
  activeChapter,
  code,
  caption,
  children,
}: {
  player: LessonPlayer;
  ariaLabel: string;
  chapters: Chapter[];
  activeChapter: string;
  code?: string;
  caption: string;
  children: ReactNode; // 무대(그림)
}) {
  const { step, playing, speed, isFull, last, count, speeds, containerRef } = player;

  return (
    <div
      ref={containerRef}
      data-print-hide
      className="panel-hero my-6 flex flex-col gap-3 p-4"
      role="group"
      aria-label={ariaLabel}
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
      {/* 헤더 + 전체화면 토글 */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-label font-bold">▶ 레슨 한눈에 보기</p>
        <div className="flex items-center gap-2">
          {activeChapter && <span className="text-caption opacity-70">{activeChapter}</span>}
          <button
            type="button"
            onClick={player.toggleFull}
            className="chip tap-feedback text-caption"
            aria-label={isFull ? '전체화면 나가기' : '전체화면으로 보기'}
          >
            {isFull ? '✕ 닫기' : '⛶ 전체화면'}
          </button>
        </div>
      </div>

      {/* 챕터 건너뛰기 — 챕터가 둘 이상일 때만. */}
      {chapters.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {chapters.map((c) => {
            const on = c.name === activeChapter;
            return (
              <button
                key={`${c.name}-${c.at}`}
                type="button"
                onClick={() => player.jump(c.at)}
                className="chip tap-feedback text-caption"
                aria-pressed={on}
                style={
                  on ? { backgroundColor: 'var(--color-action)', color: 'var(--color-surface)' } : undefined
                }
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 코드 한 줄(있을 때만 자리 확보) */}
      {code !== undefined && (
        <p className="text-center font-mono text-body" style={{ minHeight: '1.6em' }}>
          {code}
        </p>
      )}

      {/* 무대 */}
      {children}

      {/* 자막 */}
      <p className="text-center text-body font-normal" style={{ minHeight: '4.2em' }} aria-live="polite">
        {caption}
      </p>

      {/* 진행 점 */}
      <div className="flex flex-wrap justify-center gap-1" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
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
          onClick={player.goPrev}
          disabled={step === 0}
          className="btn tap-feedback text-label"
          aria-label="이전 장면"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={player.togglePlay}
          className="btn-action tap-feedback text-label"
          aria-label={playing ? '일시정지' : '재생'}
        >
          {playing ? '❚❚ 일시정지' : step >= last ? '↻ 다시 재생' : '▶ 재생'}
        </button>
        <button
          type="button"
          onClick={player.goNext}
          disabled={step >= last}
          className="btn tap-feedback text-label"
          aria-label="다음 장면"
        >
          ▶
        </button>
      </div>

      {/* 속도 */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-caption opacity-70">속도</span>
        {speeds.map((sp) => {
          const on = sp === speed;
          return (
            <button
              key={sp}
              type="button"
              onClick={() => player.setSpeed(sp)}
              className="chip tap-feedback text-caption"
              aria-pressed={on}
              style={
                on ? { backgroundColor: 'var(--color-action)', color: 'var(--color-surface)' } : undefined
              }
            >
              {sp}×
            </button>
          );
        })}
      </div>

      {/* 진행 표시 */}
      <p className="text-center text-caption opacity-70">
        {step + 1} / {count}
        {step > 0 && (
          <>
            {' · '}
            <button type="button" onClick={() => player.jump(0)} className="underline">
              처음부터
            </button>
          </>
        )}
      </p>

      {/* 전체화면 단축키 안내 */}
      {isFull && (
        <p className="text-center text-caption opacity-60">
          스페이스 재생/정지 · ←/→ 이전·다음 · ↑/↓ 속도 · Esc 나가기
        </p>
      )}
    </div>
  );
}
