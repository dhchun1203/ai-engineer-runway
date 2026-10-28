"use client";

// 레슨 페이지 책갈피(2026-10-29) — 책으로 읽기 책갈피(book-bookmark.tsx)와 같은 "페이지당
// 하나" 방식이다. 지금 읽는 소제목(h2)에 꽂아 두고, 나중에 "책갈피로 이동"으로 돌아오며,
// 다른 곳에서 "여기로 옮기기"를 누르면 옮겨 간다. 정규 커리큘럼, 베이스캠프, 로드맵,
// 수업 복습 레슨이 모두 이 컴포넌트 하나를 쓴다(pageKey만 다르다, bookmark-pages.ts).
//
// 화면 좌하단 고정이다(.bookmark-fab): 우하단은 "맨 위로", 하단 전체는 메모장 시트 몫이다.
// 상태는 자체 fetch(GET /api/bookmarks?lesson=<pageKey>)로 관리하고, 잠금 상태거나 조회
// 실패면 아무것도 렌더하지 않는다(잠금 상태에서 책갈피 UI가 등장할 경로 자체를 없앤다).
//
// 위치는 h2의 순서와 제목을 함께 저장한다. 돌아갈 때는 제목 일치를 먼저 찾고, 없으면
// 순서로 찾는다 — 본문을 고쳐 h2 순서가 바뀌어도 대략 그 자리를 되찾기 위함이다
// (section-scroll-restore.tsx와 같은 취지).

import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark } from "lucide-react";
import type { BookmarksApiResponse } from "@/app/api/bookmarks/route";
import { setPageBookmarkAction } from "@/app/lesson/[lessonId]/bookmark-actions";
import { useOnline } from "@/lib/offline/connectivity";

type Mark = { index: number; title: string };

function articleHeadings(articleId: string): HTMLElement[] {
  const container = document.getElementById(articleId);
  return container ? (Array.from(container.querySelectorAll("h2")) as HTMLElement[]) : [];
}

// 지금 읽는 소제목 — 화면 위 착지선(h2의 scroll-margin-top)을 마지막으로 지난 h2. h2가
// 하나도 없으면 페이지 전체를 index 0으로 보고 제목은 페이지 제목으로 채운다. 꽂는 순간의
// DOM을 1회 읽는다(상시 스크롤 리스너 없음).
function currentSection(articleId: string, pageTitle: string): Mark {
  const headings = articleHeadings(articleId);
  if (headings.length === 0) return { index: 0, title: pageTitle };

  const offset = Number.parseFloat(getComputedStyle(headings[0]).scrollMarginTop);
  const threshold = Number.isFinite(offset) && offset > 0 ? offset : 0;
  let idx = 0;
  for (let i = 0; i < headings.length; i++) {
    if (headings[i].getBoundingClientRect().top <= threshold + 1) idx = i;
  }
  return { index: idx, title: headings[idx].textContent?.trim() ?? pageTitle };
}

export function PageBookmark({
  pageKey,
  pageTitle,
  articleId,
}: {
  pageKey: string;
  pageTitle: string;
  articleId: string;
}) {
  // null = 아직 조회 전(숨김). false = 잠금/조회 실패(영구 숨김). true = 사용 가능.
  const [available, setAvailable] = useState<boolean | null>(null);
  const [mark, setMark] = useState<Mark | null>(null);
  const [pending, setPending] = useState(false);
  // 책갈피는 서버에만 저장한다. 오프라인이면 꽂기/옮기기를 잠근다(이동은 된다).
  const online = useOnline();
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/bookmarks?lesson=${encodeURIComponent(pageKey)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => res.json() as Promise<BookmarksApiResponse>)
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!data.unlocked || !data.ok || !data.bookmarks) {
          setAvailable(false);
          return;
        }
        // 최근 것부터 오므로 맨 앞이 이 페이지의 책갈피다.
        setMark(data.bookmarks[0] ?? null);
        setAvailable(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailable(false);
      });
    return () => controller.abort();
  }, [pageKey]);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const showFlash = useCallback((message: string) => {
    setFlash(message);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 2200);
  }, []);

  const place = useCallback(async () => {
    if (pending) return;
    const next = currentSection(articleId, pageTitle);
    const previous = mark;
    setMark(next); // 낙관적 갱신 — 실패하면 되돌린다.
    setPending(true);
    try {
      await setPageBookmarkAction(pageKey, next.index, next.title);
      showFlash(previous ? `책갈피를 옮겼어요: ${next.title}` : `책갈피를 꽂았어요: ${next.title}`);
    } catch {
      setMark(previous);
      showFlash("저장하지 못했어요. 다시 눌러 주세요.");
    } finally {
      setPending(false);
    }
  }, [pending, articleId, pageTitle, mark, pageKey, showFlash]);

  const goTo = useCallback(() => {
    if (!mark) return;
    const target = mark;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scroll = () => {
      const headings = articleHeadings(articleId);
      const wanted = target.title.trim();
      const el =
        headings.find((h) => (h.textContent ?? "").trim() === wanted) ?? headings[target.index];
      if (!el) return;
      const offset = Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion ? "auto" : "smooth" });
    };
    window.requestAnimationFrame(scroll);
  }, [mark, articleId]);

  if (available !== true) return null;

  const offlineHint = "인터넷 연결 후 책갈피를 꽂을 수 있어요";

  return (
    <div data-print-hide className="bookmark-fab">
      {mark ? (
        <>
          <button
            type="button"
            onClick={goTo}
            title={`책갈피 자리: ${mark.title}`}
            className="btn tap-feedback text-label"
          >
            <Bookmark className="size-4 shrink-0 fill-current" aria-hidden="true" />
            책갈피로 이동
          </button>
          <button
            type="button"
            onClick={place}
            disabled={pending || !online}
            title={online ? "지금 읽는 소제목으로 책갈피 옮기기" : offlineHint}
            className="btn tap-feedback text-label"
          >
            여기로 옮기기
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={place}
          disabled={pending || !online}
          title={online ? "지금 읽는 소제목에 책갈피 꽂기" : offlineHint}
          className="btn tap-feedback text-label"
        >
          <Bookmark className="size-4 shrink-0" aria-hidden="true" />
          책갈피 꽂기
        </button>
      )}
      {flash ? (
        <span role="status" aria-live="polite" className="bookmark-fab-flash text-label font-semibold">
          {flash}
        </span>
      ) : null}
    </div>
  );
}
