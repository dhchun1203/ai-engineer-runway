"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

// 내비 항목 4개는 D-09가 고정한 구조다 — Phase 3에서 "오늘의 학습"·"일정표"가 켜질
// 자리를 지금부터 잡아 두므로, 비활성 두 항목도 숨기지 않고 "준비 중" 배지로 렌더한다.
type NavItem = {
  label: string;
  href: string | null; // null = 비활성(준비 중)
};

const NAV_ITEMS: readonly NavItem[] = [
  { label: "오늘의 학습", href: null },
  { label: "커리큘럼", href: "/" },
  { label: "일정표", href: null },
  { label: "소개", href: "/about" },
];

function NavBadge() {
  return (
    <span className="rounded-full bg-badge-neutral-bg px-2 py-0.5 text-[14px] font-semibold leading-[1.4] text-badge-neutral-text dark:bg-badge-neutral-bg-dark dark:text-badge-neutral-text-dark">
      준비 중
    </span>
  );
}

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-badge-neutral-bg bg-surface dark:border-badge-neutral-bg-dark dark:bg-surface-dark">
      <nav
        aria-label="주요 내비게이션"
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center text-[20px] font-semibold leading-[1.3]"
        >
          AI Engineer Runway
        </Link>
        <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1">
          {NAV_ITEMS.map((item) => {
            if (!item.href) {
              return (
                <span
                  key={item.label}
                  aria-disabled="true"
                  className="flex min-h-11 cursor-not-allowed items-center gap-2 text-[14px] font-semibold leading-[1.4] text-badge-neutral-text opacity-70 dark:text-badge-neutral-text-dark"
                >
                  {item.label}
                  <NavBadge />
                </span>
              );
            }
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex min-h-11 items-center border-b-2 text-[14px] font-semibold leading-[1.4] ${
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
        <ThemeToggle />
      </nav>
    </header>
  );
}
