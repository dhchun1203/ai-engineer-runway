"use client";

import { useEffect, useState } from "react";

// 책으로 읽기(quick 260904-a1o) 상단 읽기 진행 바 — 지금 이 "책"의 어디쯤
// 왔는지를 얇은 띠로 보여준다. 진도(완료 체크)와 무관한 순수 스크롤 위치라
// 쿠키·서버를 건드리지 않는다(책 페이지의 정적 셸 계약 유지).
//
// scroll-to-top.tsx와 같은 절제: 프레임당 한 번만 읽어(rAF) 아이패드 스크롤이
// 끊기지 않게 한다.
export function ReadingProgress() {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    let frame = 0;

    const read = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      setPercent(Math.min(100, Math.max(0, ratio * 100)));
    };

    const onScroll = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      data-print-hide
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-40 h-1 bg-transparent"
    >
      {/* 너비는 rAF마다 갱신돼 트랜지션 없이도 부드럽다 — 임의값 유틸리티
          (transition-[width], D-96)를 피하려 CSS 트랜지션은 쓰지 않는다. */}
      <div
        className="h-full bg-accent dark:bg-accent-dark"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
