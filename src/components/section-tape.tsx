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

// 테이프 높이 상수는 여기 없다(G-06-9) — globals.css의 `:root { --section-tape-height }`가
// 단일 소스이고, 컨테이너는 `.section-tape` CSS 클래스로 그 값을 소비한다
// (h-11 Tailwind 클래스도 이 상수의 세 번째 사본이었으므로 함께 제거했다).
// updateCurrent()의 임계값도 이 값을 다시 여기 적지 않고 DOM에서 유도한다
// (아래 참고).

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
  const tapeRef = useRef<HTMLDivElement>(null);

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

      // 임계값을 브라우저가 실제로 h2를 착지시키는 값(scroll-margin-top)에서
      // 직접 읽는다(G-06-9) — 이 값과 비교하는 한 두 수치가 다시 어긋날 수
      // 없다. 캐시하지 않고 호출마다 읽는 이유: 바로 아래에서 이미 모든
      // 헤딩에 getBoundingClientRect()를 부르고 있어 추가 레이아웃 읽기가
      // 아니고, 나중에 scroll-margin-top이 미디어 쿼리로 갈라져도 캐시
      // 무효화 지점이 따로 필요 없다.
      const computedOffset = Number.parseFloat(getComputedStyle(headings[0]).scrollMarginTop);
      const threshold =
        Number.isFinite(computedOffset) && computedOffset > 0
          ? computedOffset
          : (tapeRef.current?.getBoundingClientRect().height ?? 0);

      let idx = 0;
      for (let i = 0; i < headings.length; i++) {
        if (headings[i].getBoundingClientRect().top <= threshold + 1) {
          idx = i;
        }
      }
      // 값이 실제로 바뀔 때만 상태를 갱신한다(08-07, 5.D) — 함수형 갱신으로
      // 이전 값과 같으면 같은 참조를 그대로 반환해 리렌더를 건너뛴다. 별도
      // ref 미러를 두지 않는 이유: 미러가 state와 어긋날 여지를 만들 뿐이다.
      setCurrentIndex((prev) => (prev === idx ? prev : idx));
    };

    measure();
    updateCurrent();

    // <details> 펼침 등으로 컨테이너 높이가 바뀔 때 재측정한다. cleanup에서
    // 반드시 disconnect() — 라우트 이동 시 관찰자가 누수되지 않게 한다.
    // 크기 변화는 스크롤만큼 자주 일어나지 않으므로 여기서는 rAF로 지연시키지
    // 않는다 — 지연시키면 <details> 펼침 직후 테이프가 한 박자 늦게 반응한다.
    const resizeObserver = new ResizeObserver(() => {
      measure();
      updateCurrent();
    });
    resizeObserver.observe(container);

    // 스크롤 프레임 예산 스로틀(08-07, 5.D 금지 패턴 해소, G22) — 이 리스너가
    // 저장소에서 유일한 스크롤 리스너다. rAF 핸들이 이미 예약돼 있으면 새
    // 스크롤 이벤트는 즉시 반환하고, 예약이 없을 때만 다음 프레임에
    // updateCurrent()를 실행하도록 예약한다. 콜백 안에서 핸들을 비워 다음
    // 스크롤 이벤트가 다시 예약할 수 있게 한다. 리스너 등록 자체(passive:true)는
    // 그대로 유지한다 — 5.D가 금지하는 것은 "배칭 없이 매 프레임 도는 것"이지
    // 리스너의 존재가 아니다.
    let rafHandle: number | null = null;
    const handleScroll = () => {
      if (rafHandle !== null) return;
      rafHandle = window.requestAnimationFrame(() => {
        rafHandle = null;
        updateCurrent();
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      // 예약된 프레임이 있으면 취소한다 — 라우트 이동으로 언마운트된 뒤
      // 콜백이 실행돼 사라진 컴포넌트의 상태를 건드리지 않게 한다.
      if (rafHandle !== null) {
        window.cancelAnimationFrame(rafHandle);
        rafHandle = null;
      }
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
      ref={tapeRef}
      data-section-tape
      className="section-tape sticky top-0 z-10 flex w-full overflow-x-hidden bg-background dark:bg-background-dark"
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
            className="section-tape-cell tap-feedback flex h-full min-w-6 flex-col items-center justify-end gap-1 pb-1"
          >
            <span
              style={{ height: "3px" }}
              className={`w-full rounded-full ${barClass}`}
            />
          </button>
        );
      })}
      {/* 라벨의 기준을 칸(button)에서 테이프 전체로 옮긴다(G-06-2) — 이전에는
          라벨이 current button의 자식이라 그 칸의 좁은 폭에 갇혔고, 테이프의
          overflow-x-hidden이 넘친 만큼을 그대로 잘랐다(375px 왼쪽 끝 칸에서
          최대 32px 잘림, 06-UAT.md). 이 래퍼는 테이프 폭 전체(inset-x-0)를
          차지하는 절대 배치 자식이고, 안쪽 라벨은 그 안에서 가운데 정렬 +
          max-w-full로 갇히므로 테이프 경계를 넘을 수 있는 경로가 없다.
          pointer-events-none이 없으면 이 래퍼가 테이프 폭 전체를 덮어 칸
          클릭을 통째로 먹는다. 컨테이너에는 `relative`를 추가하지 않는다 —
          `sticky`가 이미 positioned 요소라 absolute 자식의 기준이 되고,
          `relative`를 더하면 같은 position 속성끼리 충돌해 sticky가 죽는다.
          라벨을 칸 위치를 따라 좌우로 클램프하지 않고 항상 테이프 중앙에
          두는 이유: 100% 불투명도 막대와 라벨 앞 2자리 번호가 이미 "지금
          어느 칸인지"를 말해주므로, 칸을 따라가는 배치는 라벨 폭을 JS로
          매번 재야 하는 비용에 비해 이 2일 타임박스 마감 작업에서 얻는
          이득이 작다 — 측정 없는 CSS만으로 잘림 0을 보장하는 쪽을 택한다. */}
      {sections !== null && cells[currentIndex] ? (
        <span className="pointer-events-none absolute inset-x-0 top-1 flex justify-center px-1">
          <span
            data-section-tape-label
            className="flex min-w-0 max-w-full items-center gap-1 whitespace-nowrap opacity-100 transition-opacity duration-150"
          >
            {/* 인덱스 뱃지(01/02...)를 따로 그리지 않는다 — 35개 레슨의 h2 제목이 이미
                "1. 학습 목표"처럼 번호로 시작해서 "01 1. 학습 목표"로 두 번 나왔다.
                제목이 원본이므로 파생된 뱃지 쪽을 없앤다. */}
            <span data-section-tape-label-title className="truncate text-label font-semibold">
              {cells[currentIndex].title}
            </span>
          </span>
        </span>
      ) : null}
    </div>
  );
}
