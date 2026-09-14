"use client";

// 독서 도우미 UI 아일랜드. 화면 우측에 고정된 세로 툴바로, 정적 레슨 본문 위에
// karaoke식 문장 포커스 리더를 얹는다. 모든 로직은 reading-controller.ts가 담고,
// 이 컴포넌트는 (1) 툴바 렌더 (2) 창 단위 키보드·스크롤 이벤트 배선만 한다.
//
// 컨트롤러는 브라우저 이벤트(시작 버튼 클릭) 시점에 지연 생성한다 — matchMedia 등
// 브라우저 전용 API를 쓰므로 SSR 렌더 중에 만들지 않는다.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpenText,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  X,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
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

// 직접 스크롤로 간주해 진행을 멈추는 페이지 이동 키. 방향키는 여기서 뺀다 —
// ↑↓는 속도, ←→는 이전/다음 문장 단축키로 따로 쓴다.
const SCROLL_KEYS = new Set(["PageUp", "PageDown", "Home", "End"]);

export function ReadingAssistant({ articleId }: { articleId: string }) {
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<ReadingStatus>("reading");
  const [speedIndex, setSpeedIndex] = useState(DEFAULT_SPEED_INDEX);
  // 단축키 안내 팝오버 표시 여부. Esc가 도우미 해제보다 먼저 이 팝오버를 닫도록
  // 최신 값을 ref에도 실어, [active]에 묶인 키보드 리스너가 stale 값을 보지 않게 한다.
  const [showHelp, setShowHelp] = useState(false);
  const showHelpRef = useRef(false);
  useEffect(() => {
    showHelpRef.current = showHelp;
  }, [showHelp]);

  const controllerRef = useRef<ReadingController | null>(null);

  const getController = useCallback((): ReadingController => {
    if (!controllerRef.current) {
      controllerRef.current = makeReadingController(articleId, {
        // 비활성으로 바뀌면 안내 팝오버도 함께 닫아, 다시 켰을 때 열린 채로 남지
        // 않게 한다(effect에서 setState하지 않고 이 이벤트 콜백에서 처리).
        onActiveChange: (a) => {
          setActive(a);
          if (!a) setShowHelp(false);
        },
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
        // 단축키 안내가 열려 있으면 Esc는 그것부터 닫는다(도우미는 그대로 유지).
        if (showHelpRef.current) {
          setShowHelp(false);
          return;
        }
        controller.deactivate();
        return;
      }
      // ↑↓ = 읽기 속도, ←→ = 이전/다음 문장. 기본 스크롤을 막고 단축키로 쓴다.
      // 좌/우는 컨트롤러 쪽에서 누르는 순간 자동 재생을 멈춘다.
      if (e.key === "ArrowUp") {
        e.preventDefault();
        controller.changeSpeed(1);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        controller.changeSpeed(-1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        controller.previous();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        controller.next();
        return;
      }
      if (SCROLL_KEYS.has(e.key)) {
        // 페이지 이동 키 스크롤은 막지 않되(사용자가 이동하려는 의도), 진행은 멈춘다.
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

  // 안내 팝오버가 열려 있을 때 레일 바깥을 누르면 닫는다(팝오버·툴바 안 클릭은 유지).
  useEffect(() => {
    if (!showHelp) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target && !(target instanceof Element && target.closest(".ra-rail"))) {
        setShowHelp(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showHelp]);

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
          data-ra-tip="독서 도우미 켜기"
        >
          <BookOpenText className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : (
        <div className="ra-toolbar" role="toolbar" aria-label="독서 도우미">
          {/* 이전/다음 문장 — 터치(아이패드·모바일)에서만 보인다(하단 가로 바). 데스크톱은
              방향키 ←→로 대신하므로 CSS로 숨긴다(.ra-btn-nav). */}
          <button
            type="button"
            onClick={() => getController().previous()}
            className="ra-btn ra-btn-nav tap-feedback"
            aria-label="이전 문장"
            data-ra-tip="이전 문장"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => getController().primaryAction()}
            className="ra-btn tap-feedback"
            aria-label={playing ? "정지 (스페이스바)" : "재생 (스페이스바)"}
            data-ra-tip={playing ? "정지 (스페이스바)" : "재생 (스페이스바)"}
          >
            {playing ? (
              <Pause className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Play className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => getController().next()}
            className="ra-btn ra-btn-nav tap-feedback"
            aria-label="다음 문장"
            data-ra-tip="다음 문장"
          >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>

          <span className="ra-divider" aria-hidden="true" />

          <button
            type="button"
            onClick={() => getController().changeSpeed(1)}
            className="ra-btn tap-feedback"
            aria-label="빠르게"
            data-ra-tip="빠르게"
            disabled={speedIndex >= SPEED_LEVELS.length - 1}
          >
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          </button>

          <span
            className="ra-dots"
            aria-label={`읽기 속도 ${SPEED_LEVELS[speedIndex].label}`}
            data-ra-tip={`속도: ${SPEED_LEVELS[speedIndex].label}`}
          >
            {SPEED_LEVELS.map((_, i) => (
              <span key={i} className={`ra-dot ${i <= speedIndex ? "ra-dot-on" : ""}`} aria-hidden="true" />
            ))}
          </span>

          <button
            type="button"
            onClick={() => getController().changeSpeed(-1)}
            className="ra-btn tap-feedback"
            aria-label="느리게"
            data-ra-tip="느리게"
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
            data-ra-tip="끄기 (Esc)"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <span className="ra-divider" aria-hidden="true" />

          {/* 단축키 안내는 키보드 단축키(스페이스·방향키·Esc)를 설명하므로 터치
              기기에는 무의미하다 — 하단 가로 바(터치)에서는 CSS로 숨긴다(.ra-help-btn).
              터치 사용자는 버튼으로 직접 조작한다. */}
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="ra-btn ra-help-btn tap-feedback"
            aria-label="단축키 안내"
            aria-expanded={showHelp}
            data-ra-tip="단축키 안내"
          >
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
          </button>

          {showHelp ? (
            <div className="ra-help" role="dialog" aria-label="단축키 안내">
              <p className="ra-help-title">단축키</p>
              <dl className="ra-help-list">
                <div>
                  <dt>
                    <kbd>스페이스바</kbd>
                  </dt>
                  <dd>재생 / 정지</dd>
                </div>
                <div>
                  <dt className="ra-help-keys">
                    <kbd>
                      <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                    </kbd>
                    <kbd>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </kbd>
                  </dt>
                  <dd>이전 / 다음 문장 (멈춤)</dd>
                </div>
                <div>
                  <dt className="ra-help-keys">
                    <kbd>
                      <ArrowUp className="h-3 w-3" aria-hidden="true" />
                    </kbd>
                    <kbd>
                      <ArrowDown className="h-3 w-3" aria-hidden="true" />
                    </kbd>
                  </dt>
                  <dd>속도 올림 / 내림</dd>
                </div>
                <div>
                  <dt>
                    <kbd>Esc</kbd>
                  </dt>
                  <dd>도우미 끄기</dd>
                </div>
              </dl>
              <p className="ra-help-note">표·코드는 스페이스바로 넘겨요. 직접 스크롤하면 멈추고, 스페이스바로 이어봐요.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
