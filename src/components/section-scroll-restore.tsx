"use client";

// 북마크에서 되돌아왔을 때 그 소제목(h2)으로 스크롤한다(quick 260902-bkm). /bookmarks가
// `/lesson/<slug>?section=<index>&st=<제목>` 으로 링크하면, 이 컴포넌트가 그 h2를 찾아
// 착지시킨다. 화면에는 아무것도 그리지 않는다(렌더 null) — 정적 셸 계약을 깨지 않는다.
//
// 제목(st) 일치를 먼저 시도하고, 없으면 index로 폴백한다 — 본문을 개정해 h2 순서가
// 바뀌어도 저장해 둔 제목으로 되찾기 위함이다(북마크 위치가 본문 수정에 견디게 하는
// 요구사항). 둘 다 실패하면 조용히 아무 것도 하지 않는다(레슨 맨 위에 그대로 둔다).
//
// 스크롤은 h2의 scroll-margin-top(구간 테이프가 세운 --section-tape-scroll-offset)을
// 존중하므로 헤더·테이프에 가리지 않는다. 폰트·이미지 로드로 레이아웃이 뒤늦게
// 움직일 수 있어, 마운트 직후 1회 + 짧은 지연 뒤 1회 보정한다.
//
// URL 쿼리는 next/navigation의 useSearchParams가 아니라 window.location.search에서
// 직접 읽는다 — 이 레슨 페이지는 정적 생성(generateStaticParams) 셸이라 useSearchParams는
// <Suspense> 경계를 요구하고 페이지를 동적으로 강등시킨다. 이 컴포넌트는 마운트 후
// 클라이언트에서만 도는 effect라 window로 읽는 편이 셸 계약을 건드리지 않는다.

import { useEffect } from "react";

export function SectionScrollRestore({ articleId }: { articleId: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sectionRaw = params.get("section");
    const titleRaw = params.get("st");
    if (sectionRaw === null && titleRaw === null) return;

    const container = document.getElementById(articleId);
    if (!container) return;
    const headings = Array.from(container.querySelectorAll("h2")) as HTMLElement[];
    if (headings.length === 0) return;

    // 1순위: 제목 일치(정확 일치 → 없으면 그대로 폴백). 2순위: index.
    let target: HTMLElement | null = null;
    if (titleRaw) {
      const wanted = titleRaw.trim();
      target = headings.find((h) => (h.textContent?.trim() ?? "") === wanted) ?? null;
    }
    if (!target && sectionRaw !== null) {
      const idx = Number.parseInt(sectionRaw, 10);
      if (Number.isInteger(idx) && idx >= 0) {
        target = headings[Math.min(idx, headings.length - 1)] ?? null;
      }
    }
    if (!target) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const landing = target;
    const scroll = () => landing.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });

    // 마운트 직후 1회, 그리고 레이아웃이 늦게 움직일 수 있으므로 300ms 뒤 1회 더 보정.
    const raf = window.requestAnimationFrame(scroll);
    const timer = window.setTimeout(scroll, 300);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [articleId]);

  return null;
}
