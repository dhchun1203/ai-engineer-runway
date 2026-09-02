"use client";

// 브라우저 인쇄 대화상자를 여는 버튼. 아이패드 Safari에서는 이 인쇄 미리보기가
// 그대로 PDF이고, 공유 시트에서 Notability로 넘길 수 있다 — 이 버튼이 사이트의
// PDF 내보내기 입구다(quick 260828-k4t).
//
// data-print-hide: 자기 자신은 종이에 찍히면 안 된다(globals.css @media print).

import { PencilLine, Printer } from "lucide-react";

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
