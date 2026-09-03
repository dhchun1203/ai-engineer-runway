"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { Bookmark } from "lucide-react";

// 책으로 읽기(quick 260904-a1o) 책갈피 — 말 그대로 책에 끼우는 책갈피 한 개다.
// 지금 읽던 자리에 꽂아 두고, 나중에 그 자리로 스크롤해 돌아온다. 여러 개를 모으거나
// 목록으로 보는 기능이 아니다(그건 레슨 페이지의 소제목 북마크가 담당한다).
//
// 저장은 이 기기의 localStorage 한 칸이다 — "이어서 읽기"(last-lesson-recorder.tsx)와
// 같은 결의 기기별 읽기 편의라, 로그인·서버를 건드리지 않고 책 페이지의 정적 셸
// 계약도 그대로 둔다. 없거나(프라이빗 모드) 손상돼도 조용히 넘어간다.
//
// 위치는 픽셀 좌표만 저장하지 않고 "몇 번째 챕터의 위에서 얼마" 형태로 챕터에
// 앵커한다 — 개정으로 앞 챕터 길이가 바뀌어도 대략 그 자리를 되찾기 위함이다
// (section-scroll-restore.tsx가 제목/인덱스로 견디게 한 것과 같은 취지).

type SavedMark = { chapter?: string; within?: number; y: number };

function storageKey(stepId: number): string {
  return `bookBookmark:step-${stepId}`;
}

function parseMark(raw: string | null): SavedMark | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof (parsed as { y?: unknown }).y === "number") {
      return parsed as SavedMark;
    }
  } catch {
    // 손상된 값 — 책갈피 없음으로 취급.
  }
  return null;
}

// 같은 탭 안에서 꽂기/옮기기 직후 버튼 상태가 즉시 바뀌도록 커스텀 이벤트를 쓴다.
// 'storage' 이벤트는 다른 탭에서만 발생하므로 그것만으론 같은 탭 갱신이 안 된다
// (continue-reading-card.tsx는 리마운트에 기댔지만, 이 FAB는 페이지에 상주한다).
const CHANGE_EVENT = "book-bookmark-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

// "지금 읽고 있는 챕터"를 고른다 — 화면 상단(약간 아래 임계선) 위로 올라간 마지막
// 챕터. 스크롤 리스너가 아니라 꽂는 순간의 DOM을 1회 읽는다(상시 리스너 없음 →
// G22 무관).
function pickCurrentChapter(): { slug: string; absTop: number } | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-book-chapter]"));
  if (els.length === 0) return null;
  const probe = window.scrollY + 120;
  let chosen = els[0];
  for (const el of els) {
    const absTop = el.getBoundingClientRect().top + window.scrollY;
    if (absTop <= probe) chosen = el;
    else break;
  }
  const absTop = chosen.getBoundingClientRect().top + window.scrollY;
  return { slug: chosen.dataset.bookChapter ?? "", absTop };
}

export function BookBookmark({ stepId }: { stepId: number }) {
  const key = storageKey(stepId);

  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null, // 서버 스냅샷 — 하이드레이션 첫 렌더는 "책갈피 없음"으로 시작한다.
  );
  const mark = parseMark(raw);

  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = useCallback((msg: string) => {
    setFlash(msg);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 2000);
  }, []);

  const place = useCallback(() => {
    try {
      const cur = pickCurrentChapter();
      const y = Math.round(window.scrollY);
      const payload: SavedMark = cur
        ? { chapter: cur.slug, within: Math.round(y - cur.absTop), y }
        : { y };
      localStorage.setItem(key, JSON.stringify(payload));
      window.dispatchEvent(new Event(CHANGE_EVENT));
      showFlash("책갈피를 꽂았어요");
    } catch {
      // 프라이빗 모드 등 — 조용히 무시(책갈피 기능만 동작 안 함).
    }
  }, [key, showFlash]);

  const goTo = useCallback(() => {
    const target = mark;
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scroll = () => {
      let targetY = target.y;
      if (target.chapter) {
        const el = document.querySelector<HTMLElement>(`[data-book-chapter="${target.chapter}"]`);
        if (el) {
          const absTop = el.getBoundingClientRect().top + window.scrollY;
          targetY = absTop + (target.within ?? 0);
        }
      }
      window.scrollTo({ top: Math.max(0, targetY), behavior: reduceMotion ? "auto" : "smooth" });
    };

    // 폰트·이미지 로드로 레이아웃이 늦게 움직일 수 있어 1회 + 300ms 뒤 1회 보정한다
    // (section-scroll-restore.tsx와 동일).
    window.requestAnimationFrame(scroll);
    window.setTimeout(scroll, 300);
  }, [mark]);

  const btnClass =
    "btn tap-feedback inline-flex min-h-11 items-center gap-2 px-4 text-label font-semibold";

  return (
    <div data-print-hide className="book-bookmark-fab">
      {flash ? <span className="bookmark-fab-flash text-label font-semibold">{flash}</span> : null}
      {mark ? (
        <>
          <button type="button" onClick={goTo} className={btnClass}>
            <Bookmark className="size-4 shrink-0 fill-current" aria-hidden="true" />
            책갈피로 이동
          </button>
          <button type="button" onClick={place} className={btnClass}>
            여기로 옮기기
          </button>
        </>
      ) : (
        <button type="button" onClick={place} className={btnClass}>
          <Bookmark className="size-4 shrink-0" aria-hidden="true" />
          책갈피 꽂기
        </button>
      )}
    </div>
  );
}
