'use client';

// 베이스캠프 "지난 주차" 한 줄 행 — 평소엔 주차·제목·완료수만 담은 압축 행으로
// 접혀 있다가, 누르면 그 자리에서 펼쳐 항목 체크리스트를 보여준다(레이아웃 C).
// 목적은 주차가 매주 쌓여도 페이지 상단은 늘 "지금 집중할 STEP" 하나이고, 끝난
// 주차는 접힌 한 줄로 남아 스크롤이 늘어나지 않게 하는 것. 복습하려고 열면 다시
// 펼쳐진다(추천안 C에 과거 영역 아코디언을 얹은 형태).
//
// 완료 카운터는 서버 초기값에서 시작하되, 펼친 채 항목을 토글하면 체크리스트가
// onProgress로 알려와 헤더 숫자도 즉시 따라온다. 저장·낙관적 토글의 진실은 여전히
// 안쪽 BasecampStepChecklist가 들고 있고, 이 행은 표시만 맞춘다.

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { BasecampStepChecklist } from './basecamp-step-checklist';
import type { BasecampStep } from '@/content/basecamp';

export function BasecampPastStep({
  step,
  initialDoneIds,
  unlocked,
}: {
  step: BasecampStep;
  initialDoneIds: readonly string[];
  unlocked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(initialDoneIds.length);
  const total = step.items.length;
  const allDone = unlocked && done >= total;

  return (
    <div className="panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="tap-feedback flex min-h-11 w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="chip shrink-0 text-label font-bold">{step.weekLabel}</span>
          <span className="truncate text-body font-extrabold break-keep">{step.title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {unlocked ? (
            allDone ? (
              <span className="inline-flex items-center gap-1 text-label font-semibold text-ok dark:text-ok-dark">
                <Check className="h-4 w-4" aria-hidden="true" />
                {done}/{total}
              </span>
            ) : (
              <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {done}/{total}
              </span>
            )
          ) : null}
          <ChevronDown
            className={`h-5 w-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </span>
      </button>

      {/* 부드러운 펼침/접힘 — 항상 마운트해 두고 grid-template-rows 0fr↔1fr로 트랜지션한다
          (globals.css .collapsible). 접힘 상태에서는 inert로 키보드 포커스·상호작용에서
          빼고, overflow:hidden(.collapsible-inner)으로 콘텐츠를 잘라 새지 않게 한다. */}
      <div className="collapsible" data-open={open ? 'true' : 'false'}>
        <div className="collapsible-inner" inert={!open}>
          <div className="border-t border-line px-4 pb-5 pt-4 dark:border-line-dark">
            <BasecampStepChecklist
              step={step}
              initialDoneIds={initialDoneIds}
              unlocked={unlocked}
              showHeader={false}
              onProgress={(d) => setDone(d)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
