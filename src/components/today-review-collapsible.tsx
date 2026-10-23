'use client';

// 홈 "오늘의 복습" 카드의 접고 펼치기. 만기 레슨이 쌓이면 목록이 홈 화면 높이를 다
// 차지하므로 평소엔 머리(제목, 편수)와 "복습 세션 열기"만 보이게 접어 둔다. 제목을
// 누르면 그 자리에서 설명과 레슨 목록이 펼쳐진다.
//
// 펼침 방식은 베이스캠프 "지난 주차"(basecamp-past-step.tsx)와 같다: 본문을 항상
// 마운트해 두고 globals.css .collapsible(grid-template-rows 0fr↔1fr)로 트랜지션하며,
// 접힌 동안은 inert로 포커스에서 뺀다. 목록과 버튼은 서버가 그려 children으로 넘긴다.
// "복습 세션 열기"는 토글 버튼 밖(action)에 둔다. 버튼 안에 링크를 넣으면 링크를
// 누를 때 카드도 함께 열고 닫힌다.

import { useState, type ReactNode } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';

export function TodayReviewCollapsible({
  count,
  action,
  children,
}: {
  count: number;
  action: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="panel flex flex-col p-6" aria-labelledby="today-review-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="today-review-heading" className="text-heading font-extrabold">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="today-review-body"
            className="tap-feedback -m-2 flex min-h-11 items-center gap-2 p-2 text-left"
          >
            <RotateCcw className="h-5 w-5 shrink-0" aria-hidden="true" />
            오늘의 복습
            <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
              {count}편
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        </h2>
        {action}
      </div>

      <div id="today-review-body" className="collapsible" data-open={open ? 'true' : 'false'}>
        <div className="collapsible-inner" inert={!open}>
          <div className="flex flex-col gap-4 pt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
