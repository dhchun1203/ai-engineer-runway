"use client";

import { useEffect, useState } from "react";

// 심화 레슨의 스크롤 반응 목차. 데스크탑(xl+)의 왼쪽 여백에만 나타나고, 좁은
// 화면에서는 숨는다(본문은 늘 가운데). 본문의 h2·h3(rehypeSlug가 붙인 id)를
// 읽어 목록을 만들고, 스크롤에 따라 지금 읽는 절을 실시간으로 강조한다.
// 진도·저장과 무관한 순수 클라이언트 UI다.

type TocItem = { id: string; text: string; level: number };

export function LessonToc({ contentId }: { contentId: string }) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

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
      className="hidden xl:absolute xl:right-full xl:top-0 xl:block xl:h-full xl:w-52 xl:pr-8"
    >
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <p className="mb-3 text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
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
                  className={`-ml-0.5 block break-keep border-l-2 py-1 text-label leading-snug transition-colors ${
                    item.level === 3 ? "pl-6" : "pl-3"
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
