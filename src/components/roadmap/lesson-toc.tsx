"use client";

import { useEffect, useRef, useState } from "react";

// 심화 레슨의 스크롤 반응 목차. 데스크탑(xl+)의 왼쪽 여백에만 나타나고, 좁은
// 화면에서는 숨는다(본문은 늘 가운데). 본문의 h2·h3(rehypeSlug가 붙인 id)를
// 읽어 목록을 만들고, 스크롤에 따라 지금 읽는 절을 실시간으로 강조한다.
// 진도·저장과 무관한 순수 클라이언트 UI다.

type TocItem = { id: string; text: string; level: number };

export function LessonToc({ contentId }: { contentId: string }) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = document.getElementById(contentId);
    if (!container) return;

    const headings = Array.from(
      container.querySelectorAll<HTMLElement>("h2[id], h3[id]"),
    );
    setItems(
      headings.map((h) => ({
        id: h.id,
        text: h.textContent ?? "",
        level: h.tagName === "H3" ? 3 : 2,
      })),
    );

    // 스크롤 추적 — 상단(sticky 헤더 아래, 96px) 선을 마지막으로 지난 절을 활성으로
    // 본다. rAF로 스크롤 이벤트를 한 프레임에 한 번만 처리한다.
    let raf = 0;
    const compute = () => {
      raf = 0;
      let current = headings[0]?.id ?? "";
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= 96) current = h.id;
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

  // 클릭 시 sticky 헤더에 가리지 않게 88px 여유를 두고 부드럽게 이동한다
  // (reduced-motion에서는 즉시).
  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    event.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const y = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <nav
      aria-label="레슨 목차"
      className="hidden xl:absolute xl:right-full xl:top-0 xl:block xl:h-full xl:w-60 xl:pr-12 2xl:w-80 2xl:pr-20"
    >
      <div ref={scrollRef} className="toc-scroll sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
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
                  className={`toc-text -ml-0.5 block break-keep border-l-2 py-0.5 transition-colors ${
                    item.level === 3 ? "pl-5" : "pl-3"
                  } ${
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
