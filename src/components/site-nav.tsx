"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

// 내비 구조는 D-09가 고정한 4항목 골격을 계승·확장한 것이다. Phase 3가 "오늘의
// 학습"("/")과 "커리큘럼"("/curriculum")을 켰고, 리서치 2단에서 도구 라우트가
// 여럿 늘며(용어집·복습·노트·질문함·일정표·소개) 평면 8항목이 좁은 폭에서 두
// 줄로 접혔다. 이번(quick 260902-iig) 재정리는 8개 평면 항목을 대메뉴 4개 +
// 소메뉴 2단으로 묶는다:
//   1. 오늘의 학습 (/)        — 단독 링크
//   2. 커리큘럼 (/curriculum) — 단독 링크
//   3. 학습 도구 ▾            — 소메뉴: 복습·용어집·노트·질문함
//   4. 일정·정보 ▾            — 소메뉴: 일정표·PDF 내보내기·소개
// /print(PDF 내보내기)는 지금까지 커리큘럼 페이지 안 버튼으로만 닿던 숨은
// 진입점 — 이번에 "일정·정보" 소메뉴로 승격한다(라우트 자체는 이미 존재).
//
// href === null 은 이제 "드롭다운 부모"(자체 링크 없음, children 보유)를
// 뜻한다 — 예전의 "준비 중 비활성 배지"가 아니다. 렌더 분기는 children 유무로
// 먼저 가른다: children 있으면 드롭다운(데스크톱)·아코디언(모바일), 없으면
// 단독 링크, href·children 둘 다 없는 잔여 케이스만 방어적으로 비활성 배지.
type NavItem = {
  label: string;
  href: string | null;
  children?: readonly NavItem[];
};

const NAV_ITEMS: readonly NavItem[] = [
  { label: "오늘의 학습", href: "/" },
  { label: "커리큘럼", href: "/curriculum" },
  {
    label: "학습 도구",
    href: null,
    children: [
      { label: "복습", href: "/review" },
      { label: "용어집", href: "/glossary" },
      { label: "노트", href: "/notes" },
      { label: "질문함", href: "/inbox" },
    ],
  },
  {
    label: "일정·정보",
    href: null,
    children: [
      { label: "일정표", href: "/schedule" },
      { label: "PDF 내보내기", href: "/print" },
      { label: "소개", href: "/about" },
    ],
  },
];

// 데스크톱 행과 640px 미만 패널이 같은 활성 판정을 쓰게 하는 순수 함수 —
// 두 곳이 나중에 어긋나는 것을 막는다(quick task 260827-g6u).
function isActiveHref(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// 대메뉴 활성 판정 — children이 있으면 자식 href 중 하나라도 활성이면 대메뉴가
// 활성이고(그때 트리거를 chip-solid로 표시), 없으면 자기 href로 판정한다.
// isActiveHref 위에 얹은 얇은 헬퍼로, 데스크톱 행과 햄버거 패널이 공유한다.
function isMenuActive(pathname: string, item: NavItem): boolean {
  if (item.children && item.children.length > 0) {
    return item.children.some(
      (child) => child.href !== null && isActiveHref(pathname, child.href),
    );
  }
  return item.href !== null && isActiveHref(pathname, item.href);
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
  // 열린 대메뉴 하나만 식별한다(라벨을 키로). 동시에 하나만 열린다 — 다른
  // 트리거를 누르면 그쪽으로 전환된다.
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  // 데스크톱 대메뉴 행 컨테이너 — 바깥 클릭 판정의 경계다. 이 안(트리거·패널)의
  // 클릭은 유지, 밖(로고·토글·본문)의 클릭은 드롭다운을 닫는다.
  const desktopNavRef = useRef<HTMLDivElement>(null);

  // 헤더의 실제 높이를 --site-header-height에 실어 보낸다(quick 260831-0f5).
  // 이 값을 소비하는 곳은 두 군데다: 구간 테이프가 서는 자리(.section-tape의
  // top)와 h2 착지 오프셋(--section-tape-scroll-offset). 상수로 둘 수 없어
  // 실측한다 — 햄버거 패널을 펼치면 헤더가 자라고, 그때 테이프가 따라 내려가지
  // 않으면 다시 헤더 뒤로 들어간다. 데스크톱 드롭다운은 absolute(문서 흐름 밖)
  // 라 헤더 실측 높이에 영향이 없어 테이프가 흔들리지 않는다.
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

  // 드롭다운이 열려 있을 때만 바깥 클릭·Esc 리스너를 붙이고, 닫히면(또는 언마운트
  // 시) 반드시 해제한다 — 누수·중복 등록 방지(T-nav-02). 데스크톱 대메뉴 행
  // 컨테이너 바깥에서의 pointerdown이면 닫고, Esc keydown이면 닫는다. 다른 대메뉴
  // 트리거로의 전환은 그 트리거 자신의 onClick이 처리한다(컨테이너 안이라 이
  // 바깥-클릭 핸들러는 관여하지 않는다).
  useEffect(() => {
    if (openMenu === null) return;

    const onPointerDown = (event: PointerEvent) => {
      const container = desktopNavRef.current;
      if (container && !container.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

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
        <div
          ref={desktopNavRef}
          className="hidden flex-1 flex-wrap items-center gap-x-4 gap-y-1 sm:flex"
        >
          {NAV_ITEMS.map((item, index) => {
            // 드롭다운 부모 — 클릭 토글(hover 아님, 아이패드 터치 대응).
            if (item.children && item.children.length > 0) {
              const isOpen = openMenu === item.label;
              const menuActive = isMenuActive(pathname, item);
              const panelId = `nav-dropdown-${index}`;
              return (
                <div key={item.label} className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenu((current) =>
                        current === item.label ? null : item.label,
                      )
                    }
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className={`nav-link tap-feedback flex min-h-11 items-center gap-1 px-3 text-label font-bold ${
                      menuActive
                        ? "chip-solid"
                        : "text-muted dark:text-muted-dark"
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    // 절대배치(top-full) — 문서 흐름 밖이라 헤더 실측 높이 불변,
                    // 구간 테이프가 안 흔들린다. 헤더와 같은 크림 지면 + 굵은 잉크
                    // 경계 문법(border-2 border-foreground · bg-background).
                    <div
                      id={panelId}
                      className="absolute left-0 top-full z-30 flex min-w-44 flex-col border-2 border-foreground bg-background p-1 dark:border-foreground-dark dark:bg-background-dark"
                    >
                      {item.children.map((child) => {
                        if (!child.href) return null;
                        const childActive = isActiveHref(pathname, child.href);
                        return (
                          <Link
                            key={child.label}
                            href={child.href}
                            onClick={() => setOpenMenu(null)}
                            className={`nav-link tap-feedback flex min-h-11 items-center px-3 text-label font-bold ${
                              childActive
                                ? "chip-solid"
                                : "text-muted dark:text-muted-dark"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            // 잔여 방어 케이스 — href·children 둘 다 없음(현재 트리엔 없음).
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
            // 단독 링크.
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
              // 드롭다운 부모 — 640px 미만에서는 드롭다운이 아니라 항상 펼친
              // 아코디언. 대메뉴 라벨은 비링크 소제목(span), 그 아래 자식 링크를
              // 좌측 잉크 라인으로 들여쓴 그룹으로 배치한다.
              if (item.children && item.children.length > 0) {
                return (
                  <div key={item.label} className="flex flex-col">
                    <span className="flex items-center px-3 pt-3 pb-1 text-label font-semibold text-muted dark:text-muted-dark">
                      {item.label}
                    </span>
                    <div className="ml-3 flex flex-col border-l-2 border-foreground pl-3 dark:border-foreground-dark">
                      {item.children.map((child) => {
                        if (!child.href) return null;
                        const childActive = isActiveHref(pathname, child.href);
                        return (
                          <Link
                            key={child.label}
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className={`nav-link tap-feedback flex min-h-11 items-center px-3 text-label font-bold ${
                              childActive
                                ? "chip-solid"
                                : "text-muted dark:text-muted-dark"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              // 잔여 방어 케이스 — href·children 둘 다 없음.
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
              // 단독 링크.
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
