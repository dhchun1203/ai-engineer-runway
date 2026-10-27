"use client";

import { useState } from "react";
import Link from "next/link";
import { matchesQuery } from "@/lib/class-logic";
import { ClassSearchField } from "@/components/class/class-search-field";

// 명령어 모음 목록(2026-10-27). 서버 페이지가 전 회차 명령어를 묶음별로 모아 넘기고, 여기서는
// 검색어로 거르기만 한다. 줄 하나는 링크가 아니라 정보라 호버 효과를 걸지 않는다.

export type CommandEntry = {
  cmd: string;
  desc: string;
  /** 이 명령이 나온 회차들(처음 배운 회차가 앞) */
  sessions: { session: number; href: string; title: string }[];
};

export type CommandGroup = { name: string; entries: CommandEntry[] };

export function CommandList({ groups }: { groups: CommandGroup[] }) {
  const [query, setQuery] = useState("");
  const filtered = groups
    .map((group) => ({
      ...group,
      entries: group.entries.filter((e) => matchesQuery(`${group.name} ${e.cmd} ${e.desc}`, query)),
    }))
    .filter((group) => group.entries.length > 0);
  const total = filtered.reduce((sum, g) => sum + g.entries.length, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <ClassSearchField
          value={query}
          onChange={setQuery}
          label="명령어 검색"
          placeholder="명령어나 하는 일로 찾기 (예: checkout, 되돌리기)"
        />
        <span role="status" className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
          {query.trim() ? `찾은 명령어 ${total}개` : `명령어 ${total}개`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="panel p-5 text-body break-keep">찾는 명령어가 없어요. 다른 낱말로 찾아보세요.</p>
      ) : (
        filtered.map((group) => (
          <section key={group.name} className="flex flex-col gap-3" aria-label={group.name}>
            <h2 className="text-heading font-extrabold break-keep">
              {group.name}{" "}
              <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                {group.entries.length}개
              </span>
            </h2>
            <ul className="panel flex flex-col">
              {group.entries.map((entry) => (
                <li
                  key={entry.cmd}
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
          </section>
        ))
      )}
    </div>
  );
}
