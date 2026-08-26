"use client";

// 구간 테이프(Section Tape, D-R4K-1) — 레슨의 article h2 구조를 실제 렌더 높이에
// 비례한 상단 sticky 바로 보여준다. 코드베이스에서 ResizeObserver/스크롤 리스너로
// DOM을 측정하는 유일한 컴포넌트다(schedule-auto-scroll.tsx가 유일한 선례지만
// 그쪽은 마운트 시 1회 scrollIntoView만 한다 — 이 컴포넌트는 지속 측정이 필요).
//
// props는 직렬화 가능한 스칼라 2개뿐이다(articleId, stepId) — 진도·완료 집합·
// 시크릿 어떤 것도 클라이언트로 넘기지 않는다(T-06-15).
//
// Velite 파이프라인에 rehype-slug가 없어 컴파일된 h2에는 id가 없다 — id를 새로
// 만들거나 파이프라인에 플러그인을 추가하지 않고, 클릭 대상 HTMLElement 참조
// 자체를 useRef에 보관해 그 참조로 스크롤한다.

import { useEffect, useRef, useState } from "react";
import type { StepId } from "@/content/modules";

type Section = {
  title: string;
  ratio: number;
};

// Step 색 리터럴 맵 — step-card.tsx의 STEP_BORDER_CLASSES/STEP_FILL_CLASSES와
// 같은 이유로 템플릿 문자열로 클래스를 조합하지 않는다: Tailwind JIT은 소스에
// 리터럴로 등장하지 않는 조합 클래스명을 스캔하지 못해 색 자체가 빌드에서
// 통째로 사라진다. idle/hover/current 세 상태 각각을 완결된 문자열로 둔다.
// accent를 쓰지 않는다(D-R4K-2) — Step 1 파랑과 인접해 "청록 = 상호작용"이라는
// 기존 의미가 흐려진다.
const SECTION_TAPE_STEP_CLASSES: Record<StepId, { idle: string; hover: string; current: string }> = {
  1: {
    idle: "bg-step-1/40 dark:bg-step-1-dark/40",
    hover: "bg-step-1/60 dark:bg-step-1-dark/60",
    current: "bg-step-1 dark:bg-step-1-dark",
  },
  2: {
    idle: "bg-step-2/40 dark:bg-step-2-dark/40",
    hover: "bg-step-2/60 dark:bg-step-2-dark/60",
    current: "bg-step-2 dark:bg-step-2-dark",
  },
  3: {
    idle: "bg-step-3/40 dark:bg-step-3-dark/40",
    hover: "bg-step-3/60 dark:bg-step-3-dark/60",
    current: "bg-step-3 dark:bg-step-3-dark",
  },
};

// 이 사이트의 6단 척추 표준(06-DESIGN-INPUT.md) — 측정 전 하이드레이션 자리
// 표시용 균등 칸 수일 뿐, 실제 칸 수의 하드코딩 상한이 아니다. 측정 후에는
// 실제 h2 개수만큼 칸이 생긴다(2개 미만~7개 이상 전부 지원, D-R4K-1).
const PLACEHOLDER_SECTION_COUNT = 6;

// 셀 높이(터치 타깃, D-R4K-1) — 시각 막대는 이 안에서 3px.
const TAPE_HEIGHT_PX = 44;

export function SectionTape({
  articleId,
  stepId,
}: {
  articleId: string;
  stepId: StepId;
}) {
  // null = 아직 측정 전(하이드레이션 전 균등 폭 표시) 또는 측정 실패(조용히
  // 균등 폭 유지). hasMeasured로 "아직 측정 안 함"과 "측정했는데 h2가
  // 2개 미만"을 구분한다 — 후자만 렌더를 완전히 접는다(null 반환).
  const [sections, setSections] = useState<Section[] | null>(null);
  const [hasMeasured, setHasMeasured] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const headingRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const container = document.getElementById(articleId);
    if (!container) return; // 컨테이너 미발견 — 조용히 균등 폭 유지, 에러 UI 없음

    const measure = () => {
      const headings = Array.from(container.querySelectorAll("h2")) as HTMLElement[];
      headingRefs.current = headings;

      if (headings.length < 2) {
        setHasMeasured(true);
        setSections(null);
        return;
      }

      const totalHeight = container.scrollHeight;
      if (totalHeight <= 0) {
        // 측정 실패(높이 0) — 에러 UI 없이 균등 폭 유지로 조용히 남는다.
        // hasMeasured를 세우지 않아 플레이스홀더 상태를 계속 유지한다.
        return;
      }

      // offsetTop 대신 rect 기반 — offsetParent에 따라 기준이 달라지는 문제를
      // 피한다. 컨테이너 상단을 기준으로 각 h2의 상대 위치를 구한다.
      const containerTop = container.getBoundingClientRect().top;
      const starts = headings.map((h) => h.getBoundingClientRect().top - containerTop);

      const next: Section[] = headings.map((heading, index) => {
        const start = starts[index];
        const end = index + 1 < starts.length ? starts[index + 1] : totalHeight;
        const ratio = Math.max(0, (end - start) / totalHeight);
        return { title: heading.textContent?.trim() ?? "", ratio };
      });

      setSections(next);
      setHasMeasured(true);
    };

    const updateCurrent = () => {
      const headings = headingRefs.current;
      if (headings.length < 2) return;
      let idx = 0;
      for (let i = 0; i < headings.length; i++) {
        if (headings[i].getBoundingClientRect().top <= TAPE_HEIGHT_PX + 1) {
          idx = i;
        }
      }
      setCurrentIndex(idx);
    };

    measure();
    updateCurrent();

    // <details> 펼침 등으로 컨테이너 높이가 바뀔 때 재측정한다. cleanup에서
    // 반드시 disconnect() — 라우트 이동 시 관찰자가 누수되지 않게 한다.
    const resizeObserver = new ResizeObserver(() => {
      measure();
      updateCurrent();
    });
    resizeObserver.observe(container);

    const handleScroll = () => updateCurrent();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [articleId]);

  // 헤딩이 2개 미만으로 측정 확정되면 빈 테이프를 렌더하지 않는다(D-R4K-1).
  if (hasMeasured && (!sections || sections.length < 2)) {
    return null;
  }

  const cells: Section[] =
    sections ??
    Array.from({ length: PLACEHOLDER_SECTION_COUNT }, () => ({
      title: "",
      ratio: 1 / PLACEHOLDER_SECTION_COUNT,
    }));

  const stepClasses = SECTION_TAPE_STEP_CLASSES[stepId];

  const handleSectionClick = (index: number) => {
    const heading = headingRefs.current[index];
    if (!heading) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    heading.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <div
      data-section-tape
      className="sticky top-0 z-10 flex h-11 w-full overflow-x-hidden bg-background dark:bg-background-dark"
    >
      {cells.map((section, index) => {
        const isCurrent = sections !== null && index === currentIndex;
        const isHovered = sections !== null && index === hoveredIndex;
        const barClass = isCurrent
          ? stepClasses.current
          : isHovered
            ? stepClasses.hover
            : stepClasses.idle;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleSectionClick(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex((prev) => (prev === index ? null : prev))}
            aria-label={section.title || undefined}
            style={{ flexGrow: section.ratio, flexBasis: 0 }}
            className="section-tape-cell flex h-full min-w-6 flex-col items-center justify-end gap-1 pb-1"
          >
            <span
              style={{ height: "3px" }}
              className={`w-full rounded-full ${barClass}`}
            />
            {isCurrent ? (
              <span data-section-tape-label className="flex items-center gap-1 whitespace-nowrap px-1 opacity-100 transition-opacity duration-150">
                <span className="font-mono text-label">{String(index + 1).padStart(2, "0")}</span>
                <span data-section-tape-label-title className="text-label font-semibold">{section.title}</span>
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
