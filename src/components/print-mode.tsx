"use client";

// 인쇄 직전 DOM을 "종이에 맞는 상태"로 바꾸고, 인쇄가 끝나면 화면 상태로 되돌린다
// (quick 260828-k4t). CSS만으로는 두 가지를 할 수 없어서 존재하는 컴포넌트다.
//
// 1) 다크 모드 해제 — `dark:` 유틸리티가 만든 선언이 코드베이스 전체에 수백 개라
//    @media print에서 하나씩 되돌리는 것은 유지 불가능하다. 루트의 .dark 클래스를
//    잠깐 걷어내면 그 전부가 한 번에 라이트로 돌아간다. PDF는 Notability에서
//    애플펜슬로 필기할 종이이므로 항상 밝아야 한다.
// 2) <details> 펼침 — 접힌 정답/힌트 상자는 CSS로 열 수 없다(open은 HTML 상태다).
//    닫힌 채로 인쇄하면 그 내용이 PDF에서 통째로 사라진다.
//
// 되돌리기가 핵심이다 — 인쇄를 취소하고 화면으로 돌아왔을 때 다크 모드가 풀려
// 있거나 접어둔 정답이 열려 있으면 안 된다. 우리가 연 <details>에만 표식을 달아
// 사용자가 직접 펼쳐둔 것은 건드리지 않는다.

import { useEffect } from "react";

const OPENED_BY_PRINT = "data-print-opened";

export function PrintMode() {
  useEffect(() => {
    const root = document.documentElement;
    let darkRemoved = false;

    const enter = () => {
      if (root.classList.contains("dark")) {
        root.classList.remove("dark");
        darkRemoved = true;
      }
      document.querySelectorAll<HTMLDetailsElement>("details:not([open])").forEach((el) => {
        el.setAttribute(OPENED_BY_PRINT, "");
        el.open = true;
      });
    };

    const leave = () => {
      if (darkRemoved) {
        root.classList.add("dark");
        darkRemoved = false;
      }
      document
        .querySelectorAll<HTMLDetailsElement>(`details[${OPENED_BY_PRINT}]`)
        .forEach((el) => {
          el.removeAttribute(OPENED_BY_PRINT);
          el.open = false;
        });
      // 필기 여백 변형(print-button.tsx의 annotate)이 켜 둔 표식을 여기서
      // 걷어낸다. 없는 속성에 대한 removeAttribute는 no-op이라 일반 인쇄
      // 경로에서도 안전하다 — 이 한 곳이 afterprint/matchMedia/언마운트
      // 세 정리 경로 전부를 커버한다(quick 260902-cet).
      document.body.removeAttribute("data-print-annotate");
    };

    window.addEventListener("beforeprint", enter);
    window.addEventListener("afterprint", leave);

    // Safari는 beforeprint/afterprint 지원이 늦었고 지금도 발화 시점이 다른
    // 브라우저와 어긋난다 — print 미디어 쿼리 전환이 같은 순간을 알려주는 두 번째
    // 경로다. 두 경로가 겹쳐 enter()가 두 번 불려도 결과는 같다(이미 걷어낸
    // .dark는 다시 걷어낼 게 없고, 이미 열린 details는 `:not([open])`에 걸리지 않는다).
    const printQuery = window.matchMedia("print");
    const handleQueryChange = (event: MediaQueryListEvent) => {
      if (event.matches) enter();
      else leave();
    };
    printQuery.addEventListener("change", handleQueryChange);

    return () => {
      window.removeEventListener("beforeprint", enter);
      window.removeEventListener("afterprint", leave);
      printQuery.removeEventListener("change", handleQueryChange);
      // 인쇄 중 라우트가 바뀌어 언마운트되는 경우에도 화면 상태는 원복한다.
      leave();
    };
  }, []);

  return null;
}
