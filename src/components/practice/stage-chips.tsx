"use client";

import { useEffect, useRef, useState } from "react";

// 단원 페이지의 단계 막대. 사이트 헤더 바로 아래에 붙어 스크롤을 따라오며, 본문 h2(rehypeSlug id)를
// 읽어 칸으로 늘어놓는다. 누르면 그 단계로 이동한다.
// 지금 어디인지는 두 가지로 보인다. 지금 단계의 번호 칸이 잉크로 채워지고, 막대 아래 선이 읽은 만큼
// 자란다. 단계 사이에서도 선이 계속 자라도록 지금 단계 안에서 읽은 비율까지 계산한다.
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
  const navRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const stageProgress = useRef(0);

  // 선 길이 = 지금 칸의 왼쪽 + 칸 폭 x 그 단계에서 읽은 비율. 스크롤마다 다시 그리지 않게 직접 쓴다.
  const drawRail = () => {
    const nav = navRef.current;
    const rail = railRef.current;
    const cell = nav?.querySelector<HTMLElement>("[aria-current]");
    if (!nav || !rail || !cell) return;
    const end = cell.offsetLeft + cell.offsetWidth * stageProgress.current;
    rail.style.transform = `scaleX(${end / nav.clientWidth})`;
  };

  useEffect(() => {
    const container = document.getElementById(contentId);
    if (!container) return;
    const headings = Array.from(container.querySelectorAll<HTMLElement>("h2[id]"));

    let raf = 0;
    const compute = () => {
      raf = 0;
      let index = 0;
      headings.forEach((h, i) => {
        if (h.getBoundingClientRect().top <= headingOffset(h) + 8) index = i;
      });
      const current = headings[index];
      if (!current) return;
      const offset = headingOffset(current);
      const top = current.getBoundingClientRect().top - offset;
      const next = headings[index + 1];
      // 마지막 단계는 다음 제목이 없으니 글 끝이 화면 아래에 닿을 때를 끝으로 본다.
      const bottom = next
        ? next.getBoundingClientRect().top - offset
        : container.getBoundingClientRect().bottom - window.innerHeight;
      const span = bottom - top;
      stageProgress.current = span > 0 ? Math.min(1, Math.max(0, -top / span)) : 1;
      setActiveId(current.id);
      drawRail();
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

  // 지금 칸이 바뀌면 칸 폭도 바뀌므로(좁은 화면) 그려진 뒤 선을 다시 맞춘다.
  useEffect(drawRail, [activeId, stages]);

  const goTo = (id: string) => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  // 칸이 채워지기 전에도 자리는 잡아 둔다(불러온 뒤 본문이 밀려 내려가지 않게).
  return (
    <nav
      ref={navRef}
      aria-label="단원 단계"
      data-section-tape
      className="stage-bar section-tape sticky z-10 flex w-full items-stretch justify-between"
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
            className={`stage-cell tap-feedback flex min-w-8 items-center justify-center gap-1.5 whitespace-nowrap text-label font-semibold md:justify-start ${
              active
                ? "text-foreground dark:text-foreground-dark"
                : "text-muted hover:text-foreground dark:text-muted-dark dark:hover:text-foreground-dark"
            }`}
          >
            <span
              className={`stage-num flex h-4.5 w-4.5 shrink-0 items-center justify-center ${
                active
                  ? "bg-foreground text-background dark:bg-foreground-dark dark:text-background-dark"
                  : ""
              }`}
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <span className={active ? "" : "hidden md:inline"}>{stage.label}</span>
          </a>
        );
      })}
      <span ref={railRef} className="stage-rail" aria-hidden="true" />
    </nav>
  );
}
