"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  ListMusic,
  X,
} from "lucide-react";
import type { BookAudioChapter } from "@/content/book-audio";

// 책으로 읽기 음성 플레이어(book audio, quick 260905-vbc) — /book/[step] 하단에 뜨는
// 재생 바. 미리 만든 챕터별 MP3(Supabase Storage)를 순서대로 이어 재생한다. 레슨
// 페이지가 "학습"이라면 이 화면은 "듣는 독서"라, 선생님이 읽어주듯 챕터를 자동으로
// 넘겨 가며 들려준다.
//
// 설계 요지:
// - <audio> 하나로 현재 챕터를 재생하고, 끝나면 다음 챕터로 자동 진행(autoplay).
//   iOS 사파리는 첫 재생에 사용자 탭이 필요하므로, 복원 시엔 자리만 맞추고 재생은
//   사용자가 시작한다. 같은 재생 세션 안의 "다음 챕터"는 허용된다.
// - 이어듣기: 현재 챕터·시간을 localStorage에 저장(기기별 편의값이라 서버 불필요 —
//   책갈피[[book-bookmark]]와 역할이 다르다). 실패해도 조용히 무시한다.
// - 재생 중 챕터가 바뀌면 본문의 해당 챕터([data-book-chapter])로 스크롤하고 잠깐
//   강조한다 — 지금 어디를 읽는지 눈으로도 따라오게.
// - MediaSession으로 잠금화면·제어센터에서도 재생/일시정지·이전/다음이 된다
//   (아이패드에서 화면 꺼도 팟캐스트처럼 이어진다).

const SPEEDS = [1, 1.25, 1.5] as const;

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Saved = { index: number; time: number };

export function BookAudioPlayer({
  stepId,
  chapters,
}: {
  stepId: number;
  chapters: BookAudioChapter[];
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  // 새 챕터 로드 후 이어서 재생할지(사용자 제스처로 시작된 재생 세션에서만 true).
  const wantPlay = useRef(false);
  // 복원 시 메타데이터 로드 후 한 번 위치를 맞추기 위한 목표 시간.
  const restoreTime = useRef<number | null>(null);
  const saveKey = `book-audio:step:${stepId}`;

  const current = chapters[index];

  // ── 이어듣기 위치 복원(마운트 1회). 재생은 하지 않는다(iOS 제스처 요건). ──
  useEffect(() => {
    let s: Saved | null = null;
    try {
      const raw = localStorage.getItem(saveKey);
      if (raw) s = JSON.parse(raw) as Saved;
    } catch {
      /* 저장소 접근 불가/파손 — 무시하고 처음부터 */
    }
    if (s && typeof s.index === "number" && s.index >= 0 && s.index < chapters.length) {
      const saved = s;
      restoreTime.current = typeof saved.time === "number" ? saved.time : null;
      // 다음 틱에 적용 — effect 본문 동기 setState를 피한다(book-bookmark가 .then()
      // 콜백에서 setState하는 것과 같은 취지, react-hooks/set-state-in-effect).
      queueMicrotask(() => setIndex(saved.index));
    }
    // chapters 길이는 마운트 시 고정이므로 1회만.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 위치 저장(throttle). 시간 갱신·일시정지·챕터 이동 때 호출. ──
  const lastSave = useRef(0);
  const persist = useCallback(
    (i: number, t: number, force = false) => {
      const now = Date.now();
      if (!force && now - lastSave.current < 3000) return;
      lastSave.current = now;
      try {
        localStorage.setItem(saveKey, JSON.stringify({ index: i, time: t } satisfies Saved));
      } catch {
        /* 무시 */
      }
    },
    [saveKey],
  );

  // ── 챕터(index) 변경 → src 교체. wantPlay면 로드 후 재생. ──
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    a.src = current.url;
    a.playbackRate = SPEEDS[speedIdx];
    a.load();
    setTime(0);
    setDuration(0);
    if (wantPlay.current) {
      a.play().catch(() => setPlaying(false));
    }
    // 재생 중 챕터가 바뀌면 본문에서 그 챕터로 스크롤 + 강조.
    if (wantPlay.current) scrollToChapter(current.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // ── 재생 속도 적용 ──
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.playbackRate = SPEEDS[speedIdx];
  }, [speedIdx]);

  // ── MediaSession(잠금화면 컨트롤) ──
  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ms = navigator.mediaSession as any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ms.metadata = new (window as any).MediaMetadata({
        title: current.title,
        artist: "AI Engineer 교육과정 · 책으로 읽기",
        album: `Step ${stepId}`,
      });
      ms.playbackState = playing ? "playing" : "paused";
      ms.setActionHandler("play", () => togglePlay());
      ms.setActionHandler("pause", () => togglePlay());
      ms.setActionHandler("previoustrack", () => gotoChapter(index - 1));
      ms.setActionHandler("nexttrack", () => gotoChapter(index + 1));
      ms.setActionHandler("seekbackward", () => nudge(-10));
      ms.setActionHandler("seekforward", () => nudge(10));
    } catch {
      /* 일부 브라우저 미지원 — 무시 */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, playing, current]);

  function scrollToChapter(slug: string) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = document.querySelector<HTMLElement>(`[data-book-chapter="${slug}"]`);
    if (!el) return;
    // 이전 강조 제거 후 현재 챕터 강조.
    document
      .querySelectorAll("[data-book-audio-active]")
      .forEach((n) => n.removeAttribute("data-book-audio-active"));
    el.setAttribute("data-book-audio-active", "");
    const y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
  }

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      wantPlay.current = true;
      a.play()
        .then(() => {
          if (current) scrollToChapter(current.slug);
        })
        .catch(() => setPlaying(false));
    } else {
      a.pause();
      wantPlay.current = false;
    }
  }, [current]);

  const nudge = useCallback((delta: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min((a.duration || 0), a.currentTime + delta));
  }, []);

  const gotoChapter = useCallback(
    (i: number, forcePlay?: boolean) => {
      if (i < 0 || i >= chapters.length) return;
      if (forcePlay) wantPlay.current = true;
      restoreTime.current = null;
      setListOpen(false);
      setIndex(i);
      persist(i, 0, true);
    },
    [chapters.length, persist],
  );

  // ── <audio> 이벤트 ──
  const onTime = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setTime(a.currentTime);
    persist(index, a.currentTime);
  }, [index, persist]);

  const onMeta = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setDuration(a.duration || 0);
    if (restoreTime.current != null) {
      a.currentTime = Math.min(restoreTime.current, (a.duration || 0) - 0.5);
      restoreTime.current = null;
    }
  }, []);

  const onEnded = useCallback(() => {
    if (index < chapters.length - 1) {
      wantPlay.current = true;
      setIndex(index + 1); // 다음 챕터 자동 재생(effect가 play)
    } else {
      wantPlay.current = false;
      setPlaying(false);
      persist(index, 0, true);
    }
  }, [index, chapters.length, persist]);

  const onSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Number(e.target.value);
  }, []);

  if (chapters.length === 0) return null;

  const speedLabel = `${SPEEDS[speedIdx]}×`;
  const iconBtn =
    "tap-feedback inline-flex size-11 shrink-0 items-center justify-center text-foreground dark:text-foreground-dark disabled:opacity-30";

  return (
    <div data-print-hide className="book-audio-bar">
      {/* 챕터 목록(펼치기) */}
      {listOpen ? (
        <div className="book-audio-list">
          <div className="flex items-center justify-between px-4 py-2 border-b border-line dark:border-line-dark">
            <span className="text-label font-semibold text-muted dark:text-muted-dark">
              챕터 {chapters.length}개 · 듣는 순서
            </span>
            <button
              type="button"
              onClick={() => setListOpen(false)}
              className="tap-feedback inline-flex size-9 items-center justify-center"
              aria-label="목록 닫기"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <ol className="max-h-[50vh] overflow-y-auto">
            {chapters.map((c, i) => (
              <li key={c.slug}>
                <button
                  type="button"
                  onClick={() => gotoChapter(i, true)}
                  className={`tap-feedback flex w-full items-center gap-3 px-4 py-3 text-left ${
                    i === index
                      ? "bg-surface-2 dark:bg-surface-2-dark font-semibold text-accent dark:text-accent-dark"
                      : "text-foreground dark:text-foreground-dark"
                  }`}
                >
                  <span className="w-6 shrink-0 text-label font-mono text-muted dark:text-muted-dark">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-body">{c.title}</span>
                  <span className="shrink-0 text-label font-mono text-muted dark:text-muted-dark">
                    {fmt(c.seconds)}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {/* 진행 막대 */}
      <input
        type="range"
        className="book-audio-range"
        min={0}
        max={duration || current?.seconds || 0}
        step={0.1}
        value={time}
        onChange={onSeek}
        aria-label="재생 위치"
      />

      <div className="flex items-center gap-1 px-2 pb-1 sm:gap-2 sm:px-3">
        {/* 현재 챕터 라벨(탭하면 목록) */}
        <button
          type="button"
          onClick={() => setListOpen((v) => !v)}
          className="tap-feedback flex min-w-0 flex-1 items-center gap-2 py-1 pr-1 text-left"
        >
          <ListMusic className="size-4 shrink-0 text-muted dark:text-muted-dark" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block truncate text-label font-semibold text-foreground dark:text-foreground-dark">
              {current?.title}
            </span>
            <span className="block text-label font-mono text-muted dark:text-muted-dark">
              {index + 1}/{chapters.length} · {fmt(time)} / {fmt(duration || current?.seconds || 0)}
            </span>
          </span>
        </button>

        {/* 이전 챕터 */}
        <button
          type="button"
          onClick={() => gotoChapter(index - 1, playing)}
          disabled={index === 0}
          className={iconBtn}
          aria-label="이전 챕터"
        >
          <SkipBack className="size-5" aria-hidden="true" />
        </button>
        {/* 10초 뒤로 */}
        <button type="button" onClick={() => nudge(-10)} className={iconBtn} aria-label="10초 뒤로">
          <RotateCcw className="size-5" aria-hidden="true" />
        </button>
        {/* 재생/일시정지 */}
        <button
          type="button"
          onClick={togglePlay}
          className="tap-feedback inline-flex size-12 shrink-0 items-center justify-center bg-accent text-white dark:bg-accent-dark dark:text-[#0b0d13]"
          aria-label={playing ? "일시정지" : "재생"}
        >
          {playing ? (
            <Pause className="size-6 fill-current" aria-hidden="true" />
          ) : (
            <Play className="size-6 fill-current" aria-hidden="true" />
          )}
        </button>
        {/* 10초 앞으로 */}
        <button type="button" onClick={() => nudge(10)} className={iconBtn} aria-label="10초 앞으로">
          <RotateCw className="size-5" aria-hidden="true" />
        </button>
        {/* 다음 챕터 */}
        <button
          type="button"
          onClick={() => gotoChapter(index + 1, playing)}
          disabled={index === chapters.length - 1}
          className={iconBtn}
          aria-label="다음 챕터"
        >
          <SkipForward className="size-5" aria-hidden="true" />
        </button>
        {/* 배속 */}
        <button
          type="button"
          onClick={() => setSpeedIdx((v) => (v + 1) % SPEEDS.length)}
          className="tap-feedback inline-flex h-11 min-w-11 shrink-0 items-center justify-center px-2 text-label font-semibold font-mono text-foreground dark:text-foreground-dark"
          aria-label={`재생 속도 ${speedLabel}`}
        >
          {speedLabel}
        </button>
      </div>

      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={onTime}
        onLoadedMetadata={onMeta}
        onEnded={onEnded}
      />
    </div>
  );
}
