"use client";

import { useEffect, useRef, useState } from "react";

// 심화 레슨의 스크롤 반응 목차. 데스크탑(xl+)의 왼쪽 여백에만 나타나고, 좁은
// 화면에서는 숨는다(본문은 늘 가운데). 본문의 큰 절 h2(rehypeSlug가 붙인 id)만
// 읽어 목록을 만들고, 스크롤에 따라 지금 읽는 절을 실시간으로 강조한다.
// 진도·저장과 무관한 순수 클라이언트 UI다.

type TocItem = { id: string; text: string };

// 제목이 착지할 화면 위 여백. `.prose h2`의 scroll-margin-top(헤더 + 구간 테이프 +
// 8px, globals.css 단일 소스)을 그대로 읽어, 테이프가 있는 정규 레슨이든 없는
// 로드맵·수업 레슨이든, 큰 모니터 배율이든 같은 값을 따른다.
function headingOffset(el: HTMLElement): number {
  return parseFloat(getComputedStyle(el).scrollMarginTop) || 88;
}

export function LessonToc({ contentId }: { contentId: string }) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = document.getElementById(contentId);
    if (!container) return;

    const headings = Array.from(
      container.querySelectorAll<HTMLElement>("h2[id]"),
    );
    setItems(
      headings.map((h) => ({
        id: h.id,
        text: h.textContent ?? "",
      })),
    );

    // 스크롤 추적 — 제목의 착지선(headingOffset, sticky 헤더와 구간 테이프 아래)을
    // 마지막으로 지난 절을 활성으로 본다. rAF로 스크롤 이벤트를 한 프레임에 한 번만
    // 처리한다.
    let raf = 0;
    const compute = () => {
      raf = 0;
      let current = headings[0]?.id ?? "";
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= headingOffset(h) + 8) current = h.id;
        else break;
      }
      setActiveId(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [contentId]);

  // 목차가 화면보다 길면 안에서 스크롤되지만 스크롤바는 숨긴다(.toc-scroll). 대신 지금
  // 읽는 절이 목차 밖으로 나가면 목차를 그만큼 따라 내려 활성 항목이 늘 보이게 한다.
  // scrollIntoView는 바깥 창까지 움직이므로 쓰지 않고 목차 상자의 scrollTop만 바꾼다.
  useEffect(() => {
    const box = scrollRef.current;
    if (!box || !activeId) return;
    const link = box.querySelector<HTMLElement>(`a[href="#${CSS.escape(activeId)}"]`);
    if (!link) return;
    const top = link.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    const margin = 48;
    if (top < box.scrollTop + margin) {
      box.scrollTop = Math.max(0, top - margin);
    } else if (top + link.offsetHeight > box.scrollTop + box.clientHeight - margin) {
      box.scrollTop = top + link.offsetHeight - box.clientHeight + margin;
    }
  }, [activeId]);

  if (items.length === 0) return null;

  // 클릭 시 제목이 sticky 헤더(정규 레슨은 구간 테이프까지)에 가리지 않게 착지선
  // 아래로 부드럽게 이동한다(reduced-motion에서는 즉시).
  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    event.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const y = el.getBoundingClientRect().top + window.scrollY - headingOffset(el);
    window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <nav
      aria-label="레슨 목차"
      className="hidden xl:absolute xl:right-full xl:top-0 xl:block xl:h-full xl:w-60 xl:pr-12 2xl:w-96 2xl:pr-20"
    >
      {/* 화면 세로 가운데에 고정: sticky top 50%(스크롤 화면 높이 기준) + 자기 높이 절반만큼 위로. */}
      <div ref={scrollRef} className="toc-scroll sticky top-1/2 max-h-[calc(100vh-10rem)] -translate-y-1/2 overflow-y-auto">
        <p className="toc-text mb-2 font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
          목차
        </p>
        <ul className="flex flex-col border-l-2 border-line dark:border-line-dark">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(event) => handleClick(event, item.id)}
                  aria-current={active ? "true" : undefined}
                  className={`toc-text -ml-0.5 block break-keep border-l-2 py-1.5 pl-4 ${
                    active
                      ? "border-accent font-bold text-accent dark:border-accent-dark dark:text-accent-dark"
                      : "border-transparent font-normal text-muted hover:text-foreground dark:text-muted-dark dark:hover:text-foreground-dark"
                  }`}
                >
                  {item.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
