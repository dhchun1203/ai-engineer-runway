'use client';

// 지난 STEP의 "과제 보강" 묶음을 접이식 한 줄 행으로 보여준다. BasecampPastStep과
// 같은 인터랙션(압축 헤더 + 완료수 + 셰브론, 누르면 그 자리에서 펼침)이되, 안에
// 담는 것이 STEP 항목이 아니라 보강 레슨 체크리스트(BasecampPrepChecklist)라 별도
// 컴포넌트로 둔다. STEP 3가 지금 집중이 된 뒤 STEP 2 보강을 페이지 하단에 접어
// 두려는 용도(사용자 요청 2026-09-21).
//
// 완료 카운터는 서버 초기값에서 시작하되, 펼친 채 항목을 토글하면 체크리스트가
// onProgress로 알려와 헤더 숫자도 즉시 따라온다. 저장의 진실은 안쪽 체크리스트가
// 들고 있고, 이 행은 표시만 맞춘다(BasecampPastStep과 같은 구조).

import { useCallback, useState } from 'react';
import { ChevronDown, Check, ExternalLink } from 'lucide-react';
import { BasecampPrepChecklist } from './basecamp-prep-checklist';
import type { BasecampPrepLesson } from '@/content/basecamp';

export function BasecampPastPrep({
  label,
  title,
  description,
  officialUrl,
  officialLabel,
  lessons,
  initialDoneIds,
  unlocked,
}: {
  /** 압축 행 왼쪽 칩 문구(예: "STEP 2 과제 보강"). */
  label: string;
  /** 압축 행 제목(예: "심화 과제 보강 레슨"). */
  title: string;
  /** 펼쳤을 때 위에 보여줄 설명 한 문단. */
  description: string;
  /** 펼쳤을 때 걸 공식 과제 링크(있으면). */
  officialUrl?: string;
  officialLabel?: string;
  lessons: readonly BasecampPrepLesson[];
  initialDoneIds: readonly string[];
  unlocked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(initialDoneIds.length);
  const total = lessons.length;
  const allDone = unlocked && done >= total;

  // 안정적 콜백 — 체크리스트의 onProgress effect가 doneCount 변화에만 반응하도록.
  const handleProgress = useCallback((d: number) => setDone(d), []);

  return (
    <div className="panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="tap-feedback flex min-h-11 w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="chip shrink-0 text-label font-bold">{label}</span>
          <span className="truncate text-body font-extrabold break-keep">{title}</span>
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

      {/* 부드러운 펼침/접힘 — BasecampPastStep과 같은 .collapsible 트랜지션. 접힘
          상태에서는 inert로 상호작용에서 빼고 overflow로 콘텐츠를 잘라 새지 않게 한다. */}
      <div className="collapsible" data-open={open ? 'true' : 'false'}>
        <div className="collapsible-inner" inert={!open}>
          <div className="flex flex-col gap-3 border-t border-line px-4 pb-5 pt-4 dark:border-line-dark">
            <p className="break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
              {description}
            </p>
            {officialUrl ? (
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link tap-feedback inline-flex min-h-11 w-fit items-center gap-1.5 text-label font-bold text-accent dark:text-accent-dark"
              >
                {officialLabel ?? '공식 과제 열기'}
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>
            ) : null}
            <BasecampPrepChecklist
              lessons={lessons}
              initialDoneIds={initialDoneIds}
              unlocked={unlocked}
              showCounter={false}
              onProgress={handleProgress}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
