"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { roadmapTerms, type RoadmapTerm } from "@/content/roadmap-terms";

// 로드맵 심화 레슨의 용어 설명 패널. 본문의 <Term id="...">단어</Term>를 누르면
// 우측에서 패널이 미끄러져 나와 해당 용어를 설명한다. 진도·저장 같은 것과 무관한
// 순수 클라이언트 UI다.
//
// 구조: TermPanelProvider가 레슨 리더를 감싸 열림 상태와 패널을 소유하고, 본문
// 안 곳곳의 Term이 컨텍스트로 패널을 연다. 열고 닫힘은 transform 트랜지션으로
// 부드럽게 처리하되(들어올 때 rAF로 상태 전환, 나갈 때 transitionend 뒤 언마운트),
// prefers-reduced-motion에서는 즉시 전환된다(motion-reduce:transition-none).

type TermPanelContextValue = {
  open: (term: RoadmapTerm) => void;
};

const TermPanelContext = createContext<TermPanelContextValue | null>(null);

function useTermPanel(): TermPanelContextValue {
  const ctx = useContext(TermPanelContext);
  if (!ctx) {
    throw new Error("Term은 TermPanelProvider 안에서만 쓸 수 있습니다");
  }
  return ctx;
}

export function TermPanelProvider({ children }: { children: ReactNode }) {
  // active: DOM에 패널을 마운트할지(내용 포함). shown: 화면에 밀어 넣었는지(트랜지션).
  const [active, setActive] = useState<RoadmapTerm | null>(null);
  const [shown, setShown] = useState(false);
  // 패널을 연 트리거로 닫을 때 포커스를 되돌린다(접근성).
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const open = useCallback((term: RoadmapTerm) => {
    triggerRef.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;
    setActive(term);
  }, []);

  const close = useCallback(() => {
    setShown(false);
  }, []);

  // 마운트 직후 다음 프레임에 shown=true로 바꿔 들어오는 트랜지션을 발화한다.
  useEffect(() => {
    if (!active) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [active]);

  // 열리면 닫기 버튼으로 포커스를 옮긴다.
  useEffect(() => {
    if (shown) closeButtonRef.current?.focus();
  }, [shown]);

  // 열려 있는 동안 Esc로 닫는다.
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, close]);

  // 나가는 트랜지션이 끝나면 언마운트하고 트리거로 포커스를 되돌린다.
  const handleTransitionEnd = () => {
    if (!shown) {
      setActive(null);
      triggerRef.current?.focus?.();
      triggerRef.current = null;
    }
  };

  return (
    <TermPanelContext.Provider value={{ open }}>
      {children}
      {active ? (
        <>
          {/* 어둡게 덮는 배경 — 클릭하면 닫힌다. 두 테마 모두 어둡게(검정 스크림). */}
          <div
            aria-hidden="true"
            onClick={close}
            className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 motion-reduce:transition-none ${
              shown ? "opacity-100" : "opacity-0"
            }`}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`용어 설명: ${active.title}`}
            onTransitionEnd={handleTransitionEnd}
            className={`fixed inset-y-0 right-0 z-50 flex w-[min(24rem,88vw)] flex-col gap-4 overflow-y-auto border-l-2 border-foreground bg-background p-6 transition-transform duration-200 ease-out motion-reduce:transition-none dark:border-foreground-dark dark:bg-background-dark ${
              shown ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="chip text-label font-bold">용어</span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                aria-label="닫기"
                className="tap-feedback flex min-h-11 min-w-11 items-center justify-center text-badge-neutral-text hover:bg-badge-neutral-bg dark:text-badge-neutral-text-dark dark:hover:bg-badge-neutral-bg-dark"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <h2 className="break-keep text-heading font-extrabold">
              {active.title}
            </h2>
            <div className="flex flex-col gap-3">
              {active.body.split("\n\n").map((paragraph, index) => (
                <p
                  key={index}
                  className="break-keep text-body font-normal leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </aside>
        </>
      ) : null}
    </TermPanelContext.Provider>
  );
}

// 본문에서 어려운 용어를 감싸는 인라인 트리거. 사전에 없는 id면 그냥 글자만
// 보여 준다(안전한 폴백). 프로즈 폰트를 그대로 물려받아 인라인 텍스트처럼 보이되,
// 강조색 점선 밑줄로 누를 수 있음을 알린다.
export function Term({ id, children }: { id: string; children: ReactNode }) {
  const { open } = useTermPanel();
  const term = roadmapTerms[id];
  if (!term) return <>{children}</>;
  return (
    <button
      type="button"
      onClick={() => open(term)}
      aria-label={`용어 설명 열기: ${term.title}`}
      className="[font:inherit] cursor-pointer bg-transparent p-0 text-accent underline decoration-dashed underline-offset-2 dark:text-accent-dark"
    >
      {children}
    </button>
  );
}
