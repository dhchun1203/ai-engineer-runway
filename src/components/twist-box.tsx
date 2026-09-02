// 반전(轉) 박스 — kishōtenketsu(起承轉結)의 轉을 레슨에 채우는 콜아웃(quick
// 260902-czv). 배운 규칙이 어긋나 보이는 경계 사례 1개 + 해설을 레슨별로
// 저작해 children으로 채운다. predict-prompt.tsx와 동형(서버 컴포넌트,
// lucide-react 아이콘, `.panel` + 디자인 토큰 유틸리티만 사용) — 다른 점은
// 문구가 컴포넌트 안에 고정되지 않고 저자가 쓴다는 것.
//
// 항상 보이는 콜아웃이다 — `<details>` 접기가 아니다. 놀람(surprise)이
// 핵심 효과라 숨기면 전이 효과가 준다(Schwartz 계열 변형 연습 연구).
//
// 서버 컴포넌트다 — 상태·이벤트가 없어 'use client' 마커를 붙이지 않는다.

import type { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';

export function TwistBox({
  children,
  title = '어라? 여기서만 규칙이 어긋나 보여요',
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <div
      data-twist-box
      className="panel flex flex-col gap-2 border-l-4 border-accent p-4 dark:border-accent-dark"
    >
      <div className="flex items-center gap-2">
        <TriangleAlert className="h-4 w-4 shrink-0 text-accent dark:text-accent-dark" aria-hidden="true" />
        <p className="text-label font-bold">{title}</p>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
