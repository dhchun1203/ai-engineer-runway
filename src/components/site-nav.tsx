"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

// 내비 항목 4개는 D-09가 고정한 구조다 — Phase 3가 "오늘의 학습"("/")과 "커리큘럼"
// ("/curriculum")을 켰다. "일정표"("/schedule")는 Plan 04가 라우트를 채우기
// 전까지 404이지만, D-09 배치를 그대로 지키기 위해 미리 활성 링크로 켜 둔다.
// D-09 4항목 확정 이후 "용어집"(5번째)을 리서치 2단 round2-j로 추가했다(quick
// 260901-r9t) — 커리큘럼과 함께 두는 게 자연스러운 용어 참조 도구다.
// "복습"(6번째)은 리서치 2단 round2-h V2절로 추가했다(quick 260901-w04) —
// 일정표 바로 앞, 학습 흐름(오늘의 학습 → 커리큘럼 → 용어집 → 복습 → 일정표)에서
// 자연스러운 위치다.
type NavItem = {
  label: string;
  href: string | null; // null = 비활성(준비 중)
};

const NAV_ITEMS: readonly NavItem[] = [
  { label: "오늘의 학습", href: "/" },
  { label: "커리큘럼", href: "/curriculum" },
  { label: "용어집", href: "/glossary" },
  { label: "복습", href: "/review" },
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
    <span className="chip text-label">
      준비 중
    </span>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // 헤더의 실제 높이를 --site-header-height에 실어 보낸다(quick 260831-0f5).
  // 이 값을 소비하는 곳은 두 군데다: 구간 테이프가 서는 자리(.section-tape의
  // top)와 h2 착지 오프셋(--section-tape-scroll-offset). 상수로 둘 수 없어
  // 실측한다 — 내비는 좁은 폭에서 두 줄로 접히고(320px 114px, 640px 110px,
  // 그 외 62px), 햄버거 패널을 펼치면 헤더가 더 자란다. 그때 테이프가 따라
  // 내려가지 않으면 다시 헤더 뒤로 들어간다.
  //
  // CSS 변수만 쓰고 상태를 만들지 않는다 — 이 값은 렌더에 쓰이지 않으므로
  // setState는 리렌더만 유발한다. 서버 렌더 마크업도 건드리지 않아
  // 하이드레이션 불일치 경로가 없다(globals.css의 기본값 62px이 첫 페인트를 맡는다).
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const apply = () => {
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${Math.round(el.getBoundingClientRect().height)}px`,
      );
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    // 크림 지면과 같은 색 + 굵은 잉크 밑줄 하나(.site-header) — 얇은 회색 경계선은
    // 이 디자인의 문법이 아니다. sticky로 두어 긴 레슨에서도 내비가 따라온다.
    <header ref={headerRef} className="site-header sticky top-0 z-20">
      <nav
        aria-label="주요 내비게이션"
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          className="brand-link flex min-h-11 shrink-0 items-center gap-2 text-heading font-extrabold"
        >
          <span className="brand-mark" aria-hidden="true" />
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
                className={`nav-link tap-feedback flex min-h-11 items-center px-3 text-label font-bold ${
                  isActive
                    ? "chip-solid"
                    : "text-muted dark:text-muted-dark"
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
            className="tap-feedback flex min-h-11 min-w-11 shrink-0 items-center justify-center text-badge-neutral-text hover:bg-badge-neutral-bg dark:text-badge-neutral-text-dark dark:hover:bg-badge-neutral-bg-dark sm:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
          <ThemeToggle />
        </div>
      </nav>
      {open && (
        <div
          id="site-nav-panel"
          className="nav-panel-reveal hairline sm:hidden"
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
                  className={`nav-link tap-feedback flex min-h-11 items-center px-3 text-label font-bold ${
                    isActive
                      ? "chip-solid"
                      : "text-muted dark:text-muted-dark"
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
