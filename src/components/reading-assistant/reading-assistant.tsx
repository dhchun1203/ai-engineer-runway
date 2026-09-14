"use client";

// 독서 도우미 UI 아일랜드. 화면 우측에 고정된 세로 툴바로, 정적 레슨 본문 위에
// karaoke식 문장 포커스 리더를 얹는다. 모든 로직은 reading-controller.ts가 담고,
// 이 컴포넌트는 (1) 툴바 렌더 (2) 창 단위 키보드·스크롤 이벤트 배선만 한다.
//
// 컨트롤러는 브라우저 이벤트(시작 버튼 클릭) 시점에 지연 생성한다 — matchMedia 등
// 브라우저 전용 API를 쓰므로 SSR 렌더 중에 만들지 않는다.

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpenText, Play, Pause, ChevronUp, ChevronDown, X } from "lucide-react";
import {
  makeReadingController,
  SPEED_LEVELS,
  DEFAULT_SPEED_INDEX,
  type ReadingController,
  type ReadingStatus,
} from "@/components/reading-assistant/reading-controller";

// 스페이스 가로채기에서 제외할 편집 요소 — 메모장 등에 타이핑 중이면 스페이스는
// 그대로 글자 입력이어야 한다.
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

// 직접 스크롤로 간주할 방향/페이지 키.
const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
]);

export function ReadingAssistant({ articleId }: { articleId: string }) {
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<ReadingStatus>("reading");
  const [speedIndex, setSpeedIndex] = useState(DEFAULT_SPEED_INDEX);

  const controllerRef = useRef<ReadingController | null>(null);

  const getController = useCallback((): ReadingController => {
    if (!controllerRef.current) {
      controllerRef.current = makeReadingController(articleId, {
        onActiveChange: setActive,
        onPlayingChange: setPlaying,
        onStatusChange: setStatus,
        onSpeedChange: setSpeedIndex,
      });
    }
    return controllerRef.current;
  }, [articleId]);

  // 활성 중에만 창 단위 리스너를 붙인다. 스페이스=재생/정지(기본 스크롤 차단),
  // Esc=해제, 휠·터치·방향키=직접 스크롤 감지.
  useEffect(() => {
    if (!active) return;
    const controller = controllerRef.current;
    if (!controller) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      if (e.code === "Space" || e.key === " ") {
        // 브라우저 기본 스페이스(페이지 스크롤)를 막고 재생/정지로 쓴다.
        e.preventDefault();
        controller.primaryAction();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        controller.deactivate();
        return;
      }
      if (SCROLL_KEYS.has(e.key)) {
        // 방향/페이지 키 스크롤은 막지 않되(사용자가 이동하려는 의도), 진행은 멈춘다.
        controller.userScroll();
      }
    };

    const onUserScroll = () => controller.userScroll();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchmove", onUserScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchmove", onUserScroll);
    };
  }, [active]);

  // 언마운트(클라이언트 네비게이션 등) 시 본문 변형을 반드시 되돌린다.
  useEffect(() => {
    return () => {
      controllerRef.current?.destroy();
    };
  }, []);

  const hint =
    status === "waiting"
      ? "스페이스바로 계속"
      : status === "scrolled"
        ? "스페이스바로 이어보기"
        : status === "done"
          ? "다 읽었어요"
          : null;

  return (
    <div className="ra-rail" aria-live="polite">
      {active && hint ? <span className="ra-hint">{hint}</span> : null}

      {!active ? (
        <button
          type="button"
          onClick={() => getController().activate()}
          className="ra-launch tap-feedback"
          aria-label="독서 도우미 켜기"
          title="독서 도우미"
        >
          <BookOpenText className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : (
        <div className="ra-toolbar" role="toolbar" aria-label="독서 도우미">
          <button
            type="button"
            onClick={() => getController().primaryAction()}
            className="ra-btn tap-feedback"
            aria-label={playing ? "정지 (스페이스바)" : "재생 (스페이스바)"}
          >
            {playing ? (
              <Pause className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Play className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          <span className="ra-divider" aria-hidden="true" />

          <button
            type="button"
            onClick={() => getController().changeSpeed(1)}
            className="ra-btn tap-feedback"
            aria-label="빠르게"
            disabled={speedIndex >= SPEED_LEVELS.length - 1}
          >
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          </button>

          <span className="ra-dots" aria-label={`읽기 속도 ${SPEED_LEVELS[speedIndex].label}`}>
            {SPEED_LEVELS.map((_, i) => (
              <span key={i} className={`ra-dot ${i <= speedIndex ? "ra-dot-on" : ""}`} aria-hidden="true" />
            ))}
          </span>

          <button
            type="button"
            onClick={() => getController().changeSpeed(-1)}
            className="ra-btn tap-feedback"
            aria-label="느리게"
            disabled={speedIndex <= 0}
          >
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>

          <span className="ra-divider" aria-hidden="true" />

          <button
            type="button"
            onClick={() => getController().deactivate()}
            className="ra-btn tap-feedback"
            aria-label="독서 도우미 끄기 (Esc)"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
