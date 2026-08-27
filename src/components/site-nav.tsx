"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

// 내비 항목 4개는 D-09가 고정한 구조다 — Phase 3가 "오늘의 학습"("/")과 "커리큘럼"
// ("/curriculum")을 켰다. "일정표"("/schedule")는 Plan 04가 라우트를 채우기
// 전까지 404이지만, D-09 배치를 그대로 지키기 위해 미리 활성 링크로 켜 둔다.
type NavItem = {
  label: string;
  href: string | null; // null = 비활성(준비 중)
};

const NAV_ITEMS: readonly NavItem[] = [
  { label: "오늘의 학습", href: "/" },
  { label: "커리큘럼", href: "/curriculum" },
  { label: "일정표", href: "/schedule" },
  { label: "소개", href: "/about" },
];

// 데스크톱 행과 640px 미만 패널이 같은 활성 판정을 쓰게 하는 순수 함수 —
// 두 곳이 나중에 어긋나는 것을 막는다(quick task 260827-g6u).
function isActiveHref(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavBadge() {
  return (
    <span className="rounded-full bg-badge-neutral-bg px-2 py-0.5 text-label font-semibold text-badge-neutral-text dark:bg-badge-neutral-bg-dark dark:text-badge-neutral-text-dark">
      준비 중
    </span>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-badge-neutral-bg bg-surface dark:border-badge-neutral-bg-dark dark:bg-surface-dark">
      <nav
        aria-label="주요 내비게이션"
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center text-heading font-bold"
        >
          AI Engineer Runway
        </Link>
        <div className="hidden flex-1 flex-wrap items-center gap-x-4 gap-y-1 sm:flex">
          {NAV_ITEMS.map((item) => {
            if (!item.href) {
              return (
                <span
                  key={item.label}
                  aria-disabled="true"
                  className="flex min-h-11 cursor-not-allowed items-center gap-2 text-label font-semibold text-badge-neutral-text opacity-70 dark:text-badge-neutral-text-dark"
                >
                  {item.label}
                  <NavBadge />
                </span>
              );
            }
            const isActive = isActiveHref(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`tap-feedback flex min-h-11 items-center border-b-2 text-label font-semibold ${
                  isActive
                    ? "border-accent text-accent dark:border-accent-dark dark:text-accent-dark"
                    : "border-transparent"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        {/* 640px 미만에서 항목 컨테이너가 사라지면 nav의 justify-between이 로고·햄버거·토글을
            3등분으로 흩어 놓는다 — 래퍼로 묶어 로고 왼쪽 / 컨트롤 오른쪽을 유지한다.
            640px 이상에서는 sm:contents로 래퍼가 박스 트리에서 사라져 nav의 직계 자식 구성이
            변경 전(로고, 항목 컨테이너, 토글 버튼)과 동일해진다(08-05 schedule-table.tsx 패턴). */}
        <div className="flex items-center gap-1 sm:contents">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-nav-panel"
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            className="tap-feedback flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-badge-neutral-text hover:bg-badge-neutral-bg dark:text-badge-neutral-text-dark dark:hover:bg-badge-neutral-bg-dark sm:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
          <ThemeToggle />
        </div>
      </nav>
      {open && (
        <div
          id="site-nav-panel"
          className="nav-panel-reveal border-t border-badge-neutral-bg sm:hidden dark:border-badge-neutral-bg-dark"
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col px-4 pb-2">
            {NAV_ITEMS.map((item) => {
              if (!item.href) {
                return (
                  <span
                    key={item.label}
                    aria-disabled="true"
                    className="flex min-h-11 cursor-not-allowed items-center gap-2 border-l-2 border-transparent pl-3 text-label font-semibold text-badge-neutral-text opacity-70 dark:text-badge-neutral-text-dark"
                  >
                    {item.label}
                    <NavBadge />
                  </span>
                );
              }
              const isActive = isActiveHref(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`tap-feedback flex min-h-11 items-center border-l-2 pl-3 text-label font-semibold ${
                    isActive
                      ? "border-accent text-accent dark:border-accent-dark dark:text-accent-dark"
                      : "border-transparent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
