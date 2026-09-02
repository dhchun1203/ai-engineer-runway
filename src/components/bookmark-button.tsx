"use client";

// 레슨 페이지 플로팅 북마크 버튼(quick 260902-bkm) — "지금 읽고 있는 소제목(h2)"을
// 북마크로 지정·해제한다. 화면 좌하단에 고정한다: 우하단은 "맨 위로"(.scroll-top),
// 하단 전체는 메모장 시트가 차지하므로 좌하단이 유일하게 비어 있는 자리다. 자리·모양은
// globals.css의 .bookmark-fab이 정하고, 이 파일은 "지금 어느 섹션인가", "그게 북마크됐나",
// "누르면 지정/해제" 만 안다.
//
// 상태는 자체 fetch(GET /api/bookmarks?lesson=<slug>)로 관리한다 — 진도 아일랜드
// (ProgressProvider)와 독립이다. 잠금 상태거나 조회 실패면 아무것도 렌더하지 않는다
// (잠금 상태에서 북마크 UI가 등장할 경로 자체를 없앤다 — note-slot과 같은 결).
//
// 현재 섹션은 구간 테이프(section-tape.tsx)와 같은 방식으로 판정한다: #lesson-article
// 안 h2들 중 화면 상단(scroll-margin-top 임계값) 위로 올라간 마지막 h2. 스크롤 리스너는
// scroll-to-top.tsx와 동일하게 rAF로 프레임당 1회만 읽는다.

import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark } from "lucide-react";
import type { BookmarksApiResponse } from "@/app/api/bookmarks/route";
import { addBookmarkAction, removeBookmarkAction } from "@/app/lesson/[lessonId]/bookmark-actions";

type CurrentSection = { index: number; title: string };

// 현재 섹션 판정 — 호출 시점의 DOM을 읽는다. h2가 하나도 없으면(콘텐츠가 h2 없이
// 구성된 예외) 레슨 전체를 index 0으로 취급하고 제목은 레슨 제목으로 채운다.
function computeCurrentSection(articleId: string, lessonTitle: string): CurrentSection {
  const container = document.getElementById(articleId);
  const headings = container
    ? (Array.from(container.querySelectorAll("h2")) as HTMLElement[])
    : [];

  if (headings.length === 0) {
    return { index: 0, title: lessonTitle };
  }

  const computedOffset = Number.parseFloat(getComputedStyle(headings[0]).scrollMarginTop);
  const threshold = Number.isFinite(computedOffset) && computedOffset > 0 ? computedOffset : 0;

  let idx = 0;
  for (let i = 0; i < headings.length; i++) {
    if (headings[i].getBoundingClientRect().top <= threshold + 1) {
      idx = i;
    }
  }

  return { index: idx, title: headings[idx].textContent?.trim() ?? lessonTitle };
}

export function BookmarkButton({
  lessonId,
  lessonTitle,
  articleId,
}: {
  lessonId: string;
  lessonTitle: string;
  articleId: string;
}) {
  // null = 아직 조회 전(버튼 숨김). false = 잠금/조회 실패(영구 숨김). true = 사용 가능.
  const [available, setAvailable] = useState<boolean | null>(null);
  // 이 레슨에서 북마크된 section_index 집합. Set 자체를 갈아 끼워 리렌더를 유발한다.
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pending, setPending] = useState(false);
  // 지정/해제 직후 잠깐 뜨는 안내. null이면 숨김.
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 마운트 시 1회 조회. 잠금·실패면 available=false로 두어 버튼을 영구 숨긴다.
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/bookmarks?lesson=${encodeURIComponent(lessonId)}`, {
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
        setBookmarked(new Set(data.bookmarks.map((b) => b.index)));
        setAvailable(true);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setAvailable(false);
      });
    return () => controller.abort();
  }, [lessonId]);

  // 현재 섹션 추적(채움/윤곽 표시용). scroll-to-top.tsx와 동일한 rAF 스로틀.
  useEffect(() => {
    if (available !== true) return;

    let frame = 0;
    const read = () => {
      frame = 0;
      const { index } = computeCurrentSection(articleId, lessonTitle);
      setCurrentIndex((prev) => (prev === index ? prev : index));
    };
    const onScroll = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [available, articleId, lessonTitle]);

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

  const isCurrentBookmarked = bookmarked.has(currentIndex);

  async function handleToggle() {
    if (pending) return;
    // 클릭 시점의 DOM을 다시 읽어 인덱스·제목을 확정한다(스크롤 상태가 한 프레임
    // 뒤처져 있을 수 있으므로 표시값이 아니라 실측값으로 저장한다).
    const { index, title } = computeCurrentSection(articleId, lessonTitle);
    const wasBookmarked = bookmarked.has(index);

    // 낙관적 갱신 — 실패 시 되돌린다.
    const next = new Set(bookmarked);
    if (wasBookmarked) next.delete(index);
    else next.add(index);
    setBookmarked(next);
    setPending(true);

    try {
      if (wasBookmarked) {
        await removeBookmarkAction(lessonId, index);
        showFlash("북마크 해제");
      } else {
        await addBookmarkAction(lessonId, index, title);
        showFlash(title ? `북마크: ${title}` : "북마크 저장");
      }
    } catch {
      // 되돌린다 — 저장에 실패했는데 지정된 것처럼 보이면 안 된다.
      setBookmarked(bookmarked);
      showFlash("저장하지 못했어요. 다시 눌러 주세요.");
    } finally {
      setPending(false);
    }
  }

  // 조회 전이거나 잠금/실패면 렌더하지 않는다.
  if (available !== true) return null;

  return (
    <div data-print-hide className="bookmark-fab">
      {flash ? (
        <span role="status" aria-live="polite" className="bookmark-fab-flash text-label font-semibold">
          {flash}
        </span>
      ) : null}
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        aria-pressed={isCurrentBookmarked}
        aria-label={isCurrentBookmarked ? "이 위치 북마크 해제" : "이 위치 북마크"}
        title={isCurrentBookmarked ? "이 위치 북마크 해제" : "이 위치 북마크"}
        className="btn bookmark-fab-btn tap-feedback"
      >
        <Bookmark
          className={`size-5 ${isCurrentBookmarked ? "fill-current" : ""}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
