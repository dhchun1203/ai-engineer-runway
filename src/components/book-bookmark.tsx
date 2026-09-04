"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark } from "lucide-react";
import type { BookBookmarkApiResponse } from "@/app/api/book-bookmark/route";
import { setBookBookmarkAction } from "@/app/book/[step]/book-bookmark-actions";

// 책으로 읽기(quick 260904-a1o) 책갈피 — 말 그대로 책에 끼우는 책갈피 한 개다.
// 지금 읽던 자리에 꽂아 두고, 나중에 그 자리로 스크롤해 돌아온다. 여러 개를 모으거나
// 목록으로 보는 기능이 아니다(그건 레슨 페이지의 소제목 북마크가 담당한다).
//
// 처음엔 기기별 localStorage였는데, 아이패드에서 꽂은 걸 데스크톱에서도 이어 보려고
// 서버로 옮겼다(기기 간 동기화). 이제 bookmark-button.tsx와 같은 계약이다: 마운트 시
// GET /api/book-bookmark로 상태를 읽고, 잠금·조회 실패면 아무것도 렌더하지 않으며,
// 꽂기/옮기기는 Server Action으로 저장한다. 책 페이지는 여전히 정적 셸이다(이 섬만
// 클라이언트에서 자체 fetch).
//
// 위치는 픽셀 좌표만 저장하지 않고 "몇 번째 챕터의 위에서 얼마" 형태로 챕터에
// 앵커한다 — 개정으로 앞 챕터 길이가 바뀌어도 대략 그 자리를 되찾기 위함이다
// (section-scroll-restore.tsx가 제목/인덱스로 견디게 한 것과 같은 취지).

type Mark = { chapter: string | null; within: number; y: number };

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
  // null = 아직 조회 전(FAB 숨김). false = 잠금/조회 실패(영구 숨김). true = 사용 가능.
  const [available, setAvailable] = useState<boolean | null>(null);
  const [mark, setMark] = useState<Mark | null>(null);
  const [pending, setPending] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 마운트 시 1회 조회. 잠금·실패면 available=false로 두어 FAB를 영구 숨긴다
  // (bookmark-button.tsx와 동일한 계약).
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/book-bookmark?step=${stepId}`, { signal: controller.signal, cache: "no-store" })
      .then((res) => res.json() as Promise<BookBookmarkApiResponse>)
      .then((body) => {
        if (!body.unlocked || !body.ok) {
          setAvailable(false);
          return;
        }
        setAvailable(true);
        setMark(body.bookmark);
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailable(false);
      });
    return () => controller.abort();
  }, [stepId]);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const showFlash = useCallback((msg: string) => {
    setFlash(msg);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 2000);
  }, []);

  const place = useCallback(async () => {
    const cur = pickCurrentChapter();
    const y = Math.round(window.scrollY);
    const payload: Mark = cur
      ? { chapter: cur.slug, within: Math.round(y - cur.absTop), y }
      : { chapter: null, within: 0, y };

    const wasSet = mark !== null;
    setPending(true);
    setMark(payload); // 낙관적 갱신 — 버튼이 곧바로 "이동" 상태로 바뀐다.
    try {
      await setBookBookmarkAction(stepId, payload);
      showFlash(wasSet ? "책갈피를 옮겼어요" : "책갈피를 꽂았어요");
    } catch {
      showFlash("저장하지 못했어요");
    } finally {
      setPending(false);
    }
  }, [stepId, mark, showFlash]);

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
          targetY = absTop + target.within;
        }
      }
      window.scrollTo({ top: Math.max(0, targetY), behavior: reduceMotion ? "auto" : "smooth" });
    };

    // 폰트·이미지 로드로 레이아웃이 늦게 움직일 수 있어 1회 + 300ms 뒤 1회 보정한다
    // (section-scroll-restore.tsx와 동일).
    window.requestAnimationFrame(scroll);
    window.setTimeout(scroll, 300);
  }, [mark]);

  // 잠금·조회 전·실패면 아무것도 렌더하지 않는다(레슨 북마크와 동일 — 잠금 상태에서
  // 책갈피 UI가 등장할 경로 자체를 없앤다).
  if (available !== true) return null;

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
          <button type="button" onClick={place} disabled={pending} className={btnClass}>
            여기로 옮기기
          </button>
        </>
      ) : (
        <button type="button" onClick={place} disabled={pending} className={btnClass}>
          <Bookmark className="size-4 shrink-0" aria-hidden="true" />
          책갈피 꽂기
        </button>
      )}
    </div>
  );
}
