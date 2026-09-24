"use client";

// 브라우저 인쇄 대화상자를 여는 버튼. 아이패드 Safari에서는 이 인쇄 미리보기가
// 그대로 PDF이고, 공유 시트에서 Notability로 넘길 수 있다 — 이 버튼이 사이트의
// PDF 내보내기 입구다(quick 260828-k4t).
//
// data-print-hide: 자기 자신은 종이에 찍히면 안 된다(globals.css @media print).

import { PencilLine, Printer } from "lucide-react";

// 아이패드 홈 화면 앱(standalone)에서는 iOS가 window.print()를 아무 반응 없이 무시한다.
// 인쇄 창을 띄울 Safari 화면이 없기 때문이고, 코드로 우회할 수 없다. 조용히 아무 일도
// 안 일어나면 고장처럼 보이므로, 이 경우에는 주소를 복사해 두고 Safari에서 열라고 알린다.
// navigator.standalone은 iOS에만 있는 값이라 데스크톱 설치 앱(인쇄 가능)은 건드리지 않는다.
function isIosHomeScreenApp(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

async function explainPrintBlocked() {
  let copied = false;
  try {
    await navigator.clipboard.writeText(window.location.href);
    copied = true;
  } catch (error) {
    console.warn("[print] copying the page address failed", error);
  }
  window.alert(
    "홈 화면 앱에서는 iOS가 인쇄 창을 막아서 PDF로 저장할 수 없어요.\n\n" +
      (copied
        ? "이 페이지 주소를 복사해 두었어요. Safari 주소창에 붙여 넣어 연 다음 다시 눌러 주세요."
        : "Safari에서 이 페이지를 연 다음 다시 눌러 주세요."),
  );
}

export function PrintButton({
  label = "PDF로 저장",
  className = "",
  annotate = false,
}: {
  label?: string;
  className?: string;
  // true면 필기 여백 변형: 인쇄 전에 body에 data-print-annotate를 켜서
  // globals.css의 필기 컬럼 스코프를 활성화한다. 정리는 print-mode.tsx의
  // leave()가 담당한다(afterprint/matchMedia/언마운트 세 경로 전부).
  annotate?: boolean;
}) {
  const Icon = annotate ? PencilLine : Printer;
  return (
    <button
      type="button"
      data-print-hide
      onClick={() => {
        if (isIosHomeScreenApp()) {
          void explainPrintBlocked();
          return;
        }
        if (annotate) document.body.setAttribute("data-print-annotate", "");
        window.print();
      }}
      className={`btn tap-feedback text-label ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </button>
  );
}
