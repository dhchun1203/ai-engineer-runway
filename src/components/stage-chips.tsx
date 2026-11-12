"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// 본문 위 단계 막대. 사이트 헤더 바로 아래에 붙어 스크롤을 따라오며, 본문 h2(rehypeSlug id)를
// 읽어 칸으로 늘어놓는다. 누르면 그 단계로 이동한다.
// 지금 어디인지는 두 가지로 보인다. 지금 단계의 번호 칸이 잉크로 채워지고, 막대 아래 선이 읽은 만큼
// 자란다. 단계 사이에서도 선이 계속 자라도록 지금 단계 안에서 읽은 비율까지 계산한다.
// 높이와 서는 자리는 구간 테이프와 같은 .section-tape를 쓴다. 그래야 h2 착지 위치
// (--section-tape-scroll-offset)가 막대 바로 아래로 맞는다.
//
// 두 가지 모양이 있다.
// - 기본(파이썬 손풀기): 단계마다 칸 하나. 좁은 화면(md 미만)에서는 지금 단계만 이름을 보인다.
//   한 줄을 지키기 위해서다. 두 줄이 되면 따라오는 막대가 본문을 가린다.
// - compact(수업 레슨): 절이 20개까지 늘어 칸을 다 늘어놓으면 44px 터치 칸이 한 줄에 안 들어간다.
//   그래서 지금 절의 번호와 이름, "3 / 20"만 보이고, 누르면 전체 목차가 막대 아래로 펼쳐진다.
//   선은 글 전체에서 읽은 만큼 자란다.
// 펼친 목차는 막대 밖 형제로 둔다. 막대의 clip-path가 아래로 넘치는 것을 잘라 내기 때문이다.

type Stage = { id: string; label: string };

function headingOffset(el: HTMLElement): number {
  return parseFloat(getComputedStyle(el).scrollMarginTop) || 88;
}

export function StageChips({ contentId, compact = false }: { contentId: string; compact?: boolean }) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [activeId, setActiveId] = useState("");
  const [open, setOpen] = useState(false);
  const [panelBox, setPanelBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const stageProgress = useRef(0);
  const activeIndex = useRef(0);
  const stageCount = useRef(0);
  const panelId = useId();

  // 기본: 선 길이 = 지금 칸의 왼쪽 + 칸 폭 x 그 단계에서 읽은 비율.
  // compact: 선 길이 = (지금 절 순서 + 그 절에서 읽은 비율) / 절 수.
  // 스크롤마다 다시 그리지 않게 직접 쓴다.
  const drawRail = () => {
    const nav = navRef.current;
    const rail = railRef.current;
    if (!nav || !rail) return;
    if (compact) {
      const n = stageCount.current;
      if (!n) return;
      rail.style.transform = `scaleX(${(activeIndex.current + stageProgress.current) / n})`;
      return;
    }
    const cell = nav.querySelector<HTMLElement>("[aria-current]");
    if (!cell) return;
    const end = cell.offsetLeft + cell.offsetWidth * stageProgress.current;
    rail.style.transform = `scaleX(${end / nav.clientWidth})`;
  };

  useEffect(() => {
    const container = document.getElementById(contentId);
    if (!container) return;
    const headings = Array.from(container.querySelectorAll<HTMLElement>("h2[id]"));
    stageCount.current = headings.length;

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
      activeIndex.current = index;
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

  // 펼친 목차: 막대 바로 아래, 막대와 같은 폭. 바깥을 누르거나 Esc를 누르면 닫는다.
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = navRef.current?.getBoundingClientRect();
      if (r) setPanelBox({ top: r.bottom + 6, left: r.left, width: r.width });
    };
    const place = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || toggleRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 펼칠 때 지금 절이 목록 안에 보이게 맞춘다.
  useEffect(() => {
    if (!open || !panelBox) return;
    panelRef.current?.querySelector<HTMLElement>("[aria-current]")?.scrollIntoView({ block: "nearest" });
  }, [open, panelBox]);

  const goTo = (id: string) => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  const numBox = (n: number, active: boolean) => (
    <span
      className={`stage-num flex h-4.5 w-4.5 shrink-0 items-center justify-center ${
        active ? "bg-foreground text-background dark:bg-foreground-dark dark:text-background-dark" : ""
      }`}
      aria-hidden="true"
    >
      {n}
    </span>
  );

  if (compact) {
    const index = Math.max(0, stages.findIndex((s) => s.id === activeId));
    const current = stages[index];
    return (
      <>
        <nav
          ref={navRef}
          aria-label="목차"
          data-section-tape
          className="stage-bar section-tape sticky z-10 flex w-full items-stretch"
        >
          {current ? (
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={panelId}
              className="stage-cell tap-feedback flex w-full min-w-0 items-center gap-1.5 text-label font-semibold text-foreground dark:text-foreground-dark"
            >
              {numBox(index + 1, true)}
              <span className="min-w-0 truncate text-left">{current.label}</span>
              <span className="ml-auto flex shrink-0 items-center gap-1.5 pl-3 font-normal text-muted dark:text-muted-dark">
                <span className="tabular-nums">
                  {index + 1} / {stages.length}
                </span>
                <span className="font-semibold text-foreground dark:text-foreground-dark">목차</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </span>
            </button>
          ) : null}
          <span ref={railRef} className="stage-rail" aria-hidden="true" />
        </nav>
        {open && panelBox ? (
          <div
            ref={panelRef}
            id={panelId}
            data-print-hide
            className="stage-index panel fixed z-20 overflow-y-auto overscroll-contain p-1.5"
            style={{
              top: panelBox.top,
              left: panelBox.left,
              width: panelBox.width,
              maxHeight: `calc(100dvh - ${panelBox.top}px - 16px)`,
            }}
          >
            <ol className="flex flex-col">
              {stages.map((stage, i) => {
                const active = stage.id === activeId;
                return (
                  <li key={stage.id}>
                    <a
                      href={`#${stage.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setOpen(false);
                        goTo(stage.id);
                      }}
                      aria-current={active ? "location" : undefined}
                      className={`stage-index-item tap-feedback flex min-h-11 items-center gap-2.5 px-2.5 text-label break-keep ${
                        active
                          ? "font-bold text-foreground dark:text-foreground-dark"
                          : "font-normal text-badge-neutral-text hover:text-foreground dark:text-badge-neutral-text-dark dark:hover:text-foreground-dark"
                      }`}
                    >
                      {numBox(i + 1, active)}
                      <span>{stage.label}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}
      </>
    );
  }

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
            {numBox(i + 1, active)}
            <span className={active ? "" : "hidden md:inline"}>{stage.label}</span>
          </a>
        );
      })}
      <span ref={railRef} className="stage-rail" aria-hidden="true" />
    </nav>
  );
}
