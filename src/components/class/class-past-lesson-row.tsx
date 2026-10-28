"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { ClassChecklistItem } from "@/content/class-sessions";
import { ClassChecklist } from "@/components/class/class-checklist";

// 수업 복습 허브의 "지난 수업" 한 줄(2026-10-28). 제목은 레슨 링크이고, 오른쪽 "체크 n/m"을
// 누르면 그 회차의 복습 체크리스트가 줄 아래로 펼쳐진다(최근 수업과 같은 ClassChecklist,
// 같은 bc: 진도). 펼침은 globals.css의 .collapsible로 부드럽게 움직이고, 접힌 동안은
// inert라 키보드 초점이 들어가지 않는다.

export function ClassPastLessonRow({
  href,
  session,
  title,
  dateLabel,
  checklist,
  initialDoneIds,
  unlocked,
}: {
  href: string;
  session: number;
  title: string;
  /** "10월 26일" */
  dateLabel: string;
  checklist: readonly ClassChecklistItem[];
  initialDoneIds: readonly string[];
  unlocked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(initialDoneIds.length);
  const panelId = `past-checklist-${session}`;
  const hasChecklist = checklist.length > 0;

  return (
    <li className="border-b border-line last:border-b-0 dark:border-line-dark">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
        <Link href={href} className="tap-feedback flex min-h-11 min-w-0 flex-1 items-center gap-3">
          <span className="chip text-label font-bold">{session}회차</span>
          <span className="min-w-0 text-body font-bold break-keep">{title}</span>
        </Link>
        <span className="flex items-center gap-2">
          <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            {dateLabel}
          </span>
          {hasChecklist ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={panelId}
              className={`btn tap-feedback min-h-11 gap-1.5 px-3 text-label ${
                unlocked && done === checklist.length ? "text-ok dark:text-ok-dark" : ""
              }`}
            >
              {unlocked ? `체크 ${done}/${checklist.length}` : "체크리스트"}
              <ChevronDown
                className={`size-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
          ) : null}
        </span>
      </div>
      {hasChecklist ? (
        <div className="collapsible" data-open={open ? "true" : "false"}>
          <div className="collapsible-inner" inert={!open}>
            <div id={panelId} className="pb-4 pt-1">
              <ClassChecklist
                items={checklist}
                initialDoneIds={initialDoneIds}
                unlocked={unlocked}
                showHeader={!unlocked}
                onProgress={setDone}
              />
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}
