// 안테피스 예고(mechanical foreshadowing) — 다음 레슨이 도입할 도구가 오기
// 전에, 그 도구로만 풀리는 문제를 질문형으로 먼저 보여주는 콜아웃(quick
// 260902-czv). 근거: Schwartz & Bransford "A Time for Telling" —
// preparation for future learning. predict-prompt.tsx와 동형(서버
// 컴포넌트, lucide-react 아이콘, `.panel` + 디자인 토큰 유틸리티만 사용).
//
// "질문형·스포일러 금지"는 저작 규칙이다 — 이 컴포넌트는 스타일·틀만
// 제공하고, 정답·해법을 노출하지 않는 것은 MDX 저작 시점에 지켜야 한다.
//
// 항상 보이는 콜아웃이다 — `<details>` 접기가 아니다.
//
// 서버 컴포넌트다 — 상태·이벤트가 없어 'use client' 마커를 붙이지 않는다.

import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

export function NextTeaser({
  children,
  title = '다음 레슨 예고',
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <div
      data-next-teaser
      className="panel flex flex-col gap-2 border-l-4 border-accent p-4 dark:border-accent-dark"
    >
      <div className="flex items-center gap-2">
        <ArrowRight className="h-4 w-4 shrink-0 text-accent dark:text-accent-dark" aria-hidden="true" />
        <p className="text-label font-bold">{title}</p>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
