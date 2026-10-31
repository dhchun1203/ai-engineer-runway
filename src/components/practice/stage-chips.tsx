"use client";

import { useEffect, useState } from "react";

// 단원 페이지 위쪽 단계 칩. 본문의 h2(rehypeSlug id)를 읽어 칩으로 늘어놓고, 누르면 그 단계로
// 이동, 지금 읽는 단계를 채운 칩으로 보여 준다. h2 제목의 "3. " 같은 번호는 칩에서 뺀다.
// 스크롤 판정은 LessonToc(roadmap/lesson-toc.tsx)와 같다(제목 착지선을 마지막으로 지난 절).
// 칩 줄은 sticky로 두지 않는다. 칩이 7개라 아이패드 세로에서 두 줄이 되어 본문을 가린다.

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

  if (stages.length === 0) return null;
  return (
    <nav aria-label="단원 단계" data-print-hide className="flex flex-wrap gap-2">
      {stages.map((s, i) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-current={s.id === activeId ? "step" : undefined}
          className={`${s.id === activeId ? "chip-solid" : "chip"} tap-feedback min-h-11 break-keep text-label font-bold`}
        >
          {i + 1}. {s.label}
        </a>
      ))}
    </nav>
  );
}
