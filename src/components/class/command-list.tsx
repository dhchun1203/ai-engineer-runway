"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { matchesQuery } from "@/lib/class-logic";
import { ClassSearchField } from "@/components/class/class-search-field";

// 명령어 모음 목록(2026-10-27). 서버 페이지가 전 회차 명령어를 묶음별로 모아 넘기고, 여기서는
// 접고 펼치기와 검색만 한다. 회차가 쌓이면 목록이 길어지므로 평소에는 묶음을 모두 접어 두고,
// 검색어가 있으면 찾은 명령이 있는 묶음만 펼친 뒤 첫 결과로 화면을 옮긴다(입력 초점은 검색창에
// 그대로 둔다). 검색창은 사이트 머리 아래에 붙어 따라와 화면이 내려가도 계속 칠 수 있다.
// 줄 하나는 링크가 아니라 정보라 호버 효과를 걸지 않는다.

export type CommandEntry = {
  cmd: string;
  desc: string;
  /** 이 명령이 나온 회차들(처음 배운 회차가 앞) */
  sessions: { session: number; href: string; title: string }[];
};

export type CommandGroup = { name: string; entries: CommandEntry[] };

/** 입력을 멈춘 뒤 화면을 옮기기까지 기다리는 시간(글자마다 화면이 튀지 않게) */
const SCROLL_DELAY_MS = 350;

export function CommandList({ groups }: { groups: CommandGroup[] }) {
  const [query, setQuery] = useState("");
  const [opened, setOpened] = useState<ReadonlySet<string>>(() => new Set());
  const firstHitRef = useRef<HTMLLIElement | null>(null);

  const searching = query.trim() !== "";
  const filtered = groups
    .map((group) => ({
      ...group,
      entries: searching
        ? group.entries.filter((e) => matchesQuery(`${group.name} ${e.cmd} ${e.desc}`, query))
        : group.entries,
    }))
    .filter((group) => group.entries.length > 0);
  const total = filtered.reduce((sum, g) => sum + g.entries.length, 0);
  const allOpen = groups.every((g) => opened.has(g.name));

  // 검색어가 바뀌면(입력을 잠깐 멈춘 뒤) 첫 결과 줄로 화면을 옮긴다. 초점은 옮기지 않는다.
  useEffect(() => {
    if (!searching) return;
    const timer = window.setTimeout(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      firstHitRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }, SCROLL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [query, searching]);

  function toggle(name: string) {
    setOpened((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        className="sticky z-10 -mx-4 flex flex-col gap-2 bg-background px-4 py-3 dark:bg-background-dark sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        style={{ top: "var(--site-header-height)" }}
      >
        <ClassSearchField
          value={query}
          onChange={setQuery}
          label="명령어 검색"
          placeholder="명령어나 하는 일로 찾기 (예: checkout, 되돌리기)"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span role="status" className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            {searching ? `찾은 명령어 ${total}개, ${filtered.length}개 묶음` : `명령어 ${total}개, ${groups.length}개 묶음`}
          </span>
          {!searching ? (
            <button
              type="button"
              onClick={() => setOpened(allOpen ? new Set() : new Set(groups.map((g) => g.name)))}
              className="nav-link tap-feedback min-h-11 text-label font-bold text-accent dark:text-accent-dark"
            >
              {allOpen ? "모두 접기" : "모두 펼치기"}
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="panel p-5 text-body break-keep">찾는 명령어가 없어요. 다른 낱말로 찾아보세요.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((group, gi) => {
            const open = searching || opened.has(group.name);
            const panelId = `command-group-${gi}`;
            return (
              <section key={group.name} className="panel overflow-hidden" aria-label={group.name}>
                <h2>
                  <button
                    type="button"
                    onClick={() => toggle(group.name)}
                    disabled={searching}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="flex min-h-11 w-full items-center justify-between gap-3 bg-surface-2 px-4 py-3 text-left dark:bg-surface-2-dark"
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="text-subhead font-extrabold break-keep">{group.name}</span>
                      <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                        {group.entries.length}개
                      </span>
                    </span>
                    {!searching ? (
                      <ChevronDown
                        className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                </h2>
                {open ? (
                  <ul id={panelId} className="flex flex-col border-t border-line dark:border-line-dark">
                    {group.entries.map((entry, ei) => (
                      <li
                        key={entry.cmd}
                        ref={gi === 0 && ei === 0 ? firstHitRef : undefined}
                        style={{ scrollMarginTop: "calc(var(--site-header-height) + 9rem)" }}
                        className="flex flex-col gap-2 border-b border-line px-4 py-3 last:border-b-0 dark:border-line-dark sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                      >
                        <div className="flex min-w-0 flex-col gap-1">
                          <code className="font-mono text-body font-bold break-all">{entry.cmd}</code>
                          <span className="break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
                            {entry.desc}
                          </span>
                        </div>
                        <span className="flex shrink-0 flex-wrap gap-1.5 sm:justify-end">
                          {entry.sessions.map((s) => (
                            <Link
                              key={s.href}
                              href={s.href}
                              title={s.title}
                              className="chip tap-feedback min-h-11 items-center text-label"
                            >
                              {s.session}회차
                            </Link>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
