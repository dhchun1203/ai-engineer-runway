"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

// 자리·모양(.scroll-top)은 globals.css가 정한다 — 이 파일은 "언제 보이나"와
// "누르면 무슨 일이 나나"만 안다. 메모장 시트를 피해 얼마나 올라가야 하는지는
// 이 컴포넌트가 알 필요가 없고, 알면 레슨 페이지 구조가 여기까지 새어 든다.

// 나타나기 시작하는 스크롤 깊이. 첫 화면(대략 헤더+제목 높이)에서는 보이지
// 않는다 — 이미 맨 위인데 "맨 위로" 버튼이 떠 있으면 소음이다.
const SHOW_AFTER_PX = 480;

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 스크롤 이벤트는 한 번 쓸어 올릴 때 수십 번 들어온다. 매번 setState하면
    // 스크롤 중 렌더가 따라붙어 아이패드에서 스크롤이 끊긴다 — 프레임당 한 번만
    // 읽고, 값이 실제로 바뀔 때만 상태를 민다.
    let frame = 0;

    const read = () => {
      frame = 0;
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };

    const onScroll = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(read);
    };

    // 마운트 시점에 이미 내려와 있을 수 있다(뒤로 가기로 스크롤 위치가 복원되는
    // 경우) — 첫 스크롤을 기다리지 않고 지금 상태를 한 번 읽는다.
    read();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  const scrollToTop = () => {
    // 부드러운 스크롤은 취향이 아니라 접근성 설정을 따른다 — 모션을 줄이도록
    // 설정한 사람에게 긴 문서를 훑어 올리는 애니메이션은 멀미의 원인이다.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      // 종이에는 찍히지 않는 화면 전용 크롬 — globals.css의 @media print가
      // 이 속성 하나로 걷어간다.
      data-print-hide
      data-scroll-top
      // 숨김은 CSS가 visibility로 처리한다(탭 순서에서도 빠진다). aria-hidden은
      // 붙이지 않는다 — 보일 때는 실제로 읽혀야 하는 버튼이고, 안 보일 때는
      // visibility: hidden이 이미 보조기술에서도 감춘다.
      className={`btn scroll-top${visible ? " scroll-top-visible" : ""}`}
      aria-label="맨 위로"
      title="맨 위로"
    >
      <ArrowUp className="size-5" aria-hidden="true" />
    </button>
  );
}
