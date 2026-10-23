"use client";

import { useEffect } from "react";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";

// 진입 로드맵 단계 카드(접히는 details)의 보조 컨트롤.
// 1) "모두 펼치기 / 모두 접기" 버튼
// 2) 같은 페이지 바로가기(#rag 등)로 들어오면 그 단계를 자동으로 펼친다 — 채용 절차와
//    서류 전략의 "준비하는 곳" 버튼, 주소창의 해시, 뒤로 가기 모두 같은 길로 처리한다.
// 단계 카드는 서버에서 그리고, 이 컴포넌트는 data-roadmap-stage가 붙은 details만 다룬다.
const STAGE_SELECTOR = "details[data-roadmap-stage]";

function openStageFor(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (!id) return;
  const target = document.getElementById(id);
  const details = target?.querySelector<HTMLDetailsElement>(STAGE_SELECTOR);
  if (!details) return;
  details.open = true;
  // 펼친 뒤에도 단계 머리가 화면 위쪽에 오도록 다시 맞춘다(sticky 헤더는 scroll-mt가 비켜 준다).
  target?.scrollIntoView({ block: "start" });
}

export function StageAccordionControls() {
  useEffect(() => {
    openStageFor(window.location.hash);

    const onHashChange = () => openStageFor(window.location.hash);
    // 이미 같은 해시면 hashchange가 안 생기므로, 같은 페이지 앵커 클릭도 직접 받는다.
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (anchor) openStageFor(anchor.getAttribute("href") ?? "");
    };
    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const setAll = (open: boolean) => {
    document.querySelectorAll<HTMLDetailsElement>(STAGE_SELECTOR).forEach((d) => {
      d.open = open;
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => setAll(true)} className="btn tap-feedback text-label">
        <ChevronsUpDown className="h-4 w-4 shrink-0" aria-hidden="true" />
        모두 펼치기
      </button>
      <button type="button" onClick={() => setAll(false)} className="btn tap-feedback text-label">
        <ChevronsDownUp className="h-4 w-4 shrink-0" aria-hidden="true" />
        모두 접기
      </button>
    </div>
  );
}
