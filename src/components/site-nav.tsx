"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

function NavBadge() {
  return (
    <span className="rounded-full bg-badge-neutral-bg px-2 py-0.5 text-label font-semibold text-badge-neutral-text dark:bg-badge-neutral-bg-dark dark:text-badge-neutral-text-dark">
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
          className="flex min-h-11 shrink-0 items-center text-heading font-bold"
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
                  className="flex min-h-11 cursor-not-allowed items-center gap-2 text-label font-semibold text-badge-neutral-text opacity-70 dark:text-badge-neutral-text-dark"
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
        <ThemeToggle />
      </nav>
    </header>
  );
}
