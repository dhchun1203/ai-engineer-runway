"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { matchesQuery } from "@/lib/class-logic";
import type { ClassSearchDoc } from "@/content/class-derived";
import { ClassSearchField } from "@/components/class/class-search-field";

// 회차 검색(2026-10-27, 설계 3.8). 검색어가 비어 있으면 서버가 그린 목록(children)을 그대로
// 보여 주고, 검색어가 있으면 그 자리에 찾은 회차 카드만 보여 준다. 색인은 제목, 요약, 주제,
// 소제목, 명령어, 용어까지라 본문 문장은 찾지 않는다.

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${m}월 ${d}일`;
}

export function ClassSearch({ docs, children }: { docs: ClassSearchDoc[]; children: ReactNode }) {
  const [query, setQuery] = useState("");
  const searching = query.trim() !== "";
  const found = searching ? docs.filter((doc) => matchesQuery(doc.text, query)) : [];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <ClassSearchField
          value={query}
          onChange={setQuery}
          label="수업 회차 검색"
          placeholder="배운 내용으로 회차 찾기 (예: detached, vim, 리다이렉션)"
        />
        {searching ? (
          <span role="status" className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            찾은 회차 {found.length}개
          </span>
        ) : null}
      </div>

      {searching ? (
        found.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {found.map((doc) => (
              <li key={doc.slug}>
                <Link href={doc.href} className="card-interactive panel flex flex-col gap-2 p-5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="chip text-label font-bold">{doc.session}회차</span>
                    <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                      {formatDate(doc.date)} 수업, {doc.topic}
                    </span>
                  </span>
                  <span className="text-heading font-extrabold break-keep">{doc.title}</span>
                  <span className="break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
                    {doc.summary}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-label font-bold text-accent dark:text-accent-dark">
                    레슨 읽기
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="panel p-5 text-body break-keep">
            찾는 회차가 없어요. 명령어라면 명령어 모음에서도 찾아보세요.
          </p>
        )
      ) : (
        children
      )}
    </div>
  );
}
