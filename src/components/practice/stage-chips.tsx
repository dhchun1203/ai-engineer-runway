"use client";

import { useEffect, useState } from "react";

// 단원 페이지의 단계 막대. 사이트 헤더 바로 아래에 붙어 스크롤을 따라오며, 본문 h2(rehypeSlug id)를
// 읽어 칸으로 늘어놓고 지금 읽는 단계를 채워 보여 준다. 누르면 그 단계로 이동한다.
// 높이와 서는 자리는 구간 테이프와 같은 .section-tape를 쓴다. 그래야 h2 착지 위치
// (--section-tape-scroll-offset)가 막대 바로 아래로 맞는다.
// 좁은 화면(md 미만)에서는 지금 단계만 이름을 보이고, 나머지는 번호만 보인다. 한 줄을 지키기
// 위해서다. 두 줄이 되면 따라오는 막대가 본문을 가린다.

type Stage = { id: string; label: string };

function headingOffset(el: HTMLElement): number {
  return parseFloat(getComputedStyle(el).scrollMarginTop) || 88;
}

export function StageChips({ contentId }: { contentId: string }) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const container = document.getElementById(contentId);
    if (!container) return;
    const headings = Array.from(container.querySelectorAll<HTMLElement>("h2[id]"));

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
    // 첫 읽기도 다음 프레임에 한다(effect 본문에서 곧바로 setState하지 않는다).
    raf = requestAnimationFrame(() => {
      setStages(
        headings.map((h) => ({ id: h.id, label: (h.textContent ?? "").replace(/^\d+\.\s*/, "") })),
      );
      compute();
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [contentId]);

  const goTo = (id: string) => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  // 칸이 채워지기 전에도 자리는 잡아 둔다(불러온 뒤 본문이 밀려 내려가지 않게).
  return (
    <nav
      aria-label="단원 단계"
      data-section-tape
      className="section-tape sticky z-10 flex w-full items-stretch bg-background dark:bg-background-dark"
    >
      {stages.map((stage, i) => {
        const active = stage.id === activeId;
        return (
          <a
            key={stage.id}
            href={`#${stage.id}`}
            onClick={(e) => {
              e.preventDefault();
              goTo(stage.id);
            }}
            aria-label={`${i + 1}. ${stage.label}`}
            aria-current={active ? "step" : undefined}
            className={`tap-feedback flex min-w-8 items-center justify-center whitespace-nowrap text-label font-bold md:min-w-0 md:flex-auto md:px-2 ${
              active
                ? "shrink-0 bg-foreground px-3 text-background dark:bg-foreground-dark dark:text-background-dark"
                : "flex-1 text-muted dark:text-muted-dark"
            }`}
          >
            <span className="md:hidden">{i + 1}</span>
            <span className={active ? "ml-1.5 md:ml-0" : "hidden md:inline"}>{stage.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
