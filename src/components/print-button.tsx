"use client";

// 브라우저 인쇄 대화상자를 여는 버튼. 아이패드 Safari에서는 이 인쇄 미리보기가
// 그대로 PDF이고, 공유 시트에서 Notability로 넘길 수 있다 — 이 버튼이 사이트의
// PDF 내보내기 입구다(quick 260828-k4t).
//
// data-print-hide: 자기 자신은 종이에 찍히면 안 된다(globals.css @media print).

import { Printer } from "lucide-react";

export function PrintButton({
  label = "PDF로 저장",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-print-hide
      onClick={() => window.print()}
      className={`tap-feedback inline-flex min-h-11 items-center gap-2 rounded-lg border border-badge-neutral-bg px-4 text-label font-semibold text-badge-neutral-text dark:border-badge-neutral-bg-dark dark:text-badge-neutral-text-dark ${className}`}
    >
      <Printer className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </button>
  );
}
