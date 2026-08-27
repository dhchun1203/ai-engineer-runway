"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

// layout.tsx의 하이드레이션 이전 인라인 스크립트와 정확히 같은 localStorage 키("theme")와
// 같은 documentElement.classList("dark")를 읽고 쓴다 — React 컨텍스트 기반 테마 프로바이더는
// 만들지 않는다(RESEARCH Don't Hand-Roll: 하이드레이션 불일치로 인한 첫 페인트 깜빡임의 원인).

// documentElement의 class 변화를 구독한다 — toggleTheme이 직접 상태를 밀어 넣지 않아도
// 이 구독이 값을 다시 읽는다(같은 클래스를 만지는 다른 경로가 생겨도 자동으로 따라간다).
function subscribeToThemeClass(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getThemeSnapshot(): boolean | null {
  return document.documentElement.classList.contains("dark");
}

// 서버 렌더와 하이드레이션 시점에는 실제 테마를 알 수 없다(인라인 스크립트가 브라우저에서
// 이미 .dark를 반영해 두었지만 서버는 그 결과를 모른다) — null을 돌려 기존과 같은
// 초기 마크업을 유지하고, 하이드레이션 직후 클라이언트 스냅샷으로 정정된다.
function getThemeServerSnapshot(): boolean | null {
  return null;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribeToThemeClass, getThemeSnapshot, getThemeServerSnapshot);

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage 접근 불가(프라이빗 모드 등)여도 클래스 토글 자체는 이번 세션 표시에 반영된다.
    }
    // 별도 setState 없음 — 위 classList.toggle이 MutationObserver를 깨워
    // useSyncExternalStore가 새 값을 다시 읽는다.
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="tap-feedback flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-badge-neutral-text hover:bg-badge-neutral-bg dark:text-badge-neutral-text-dark dark:hover:bg-badge-neutral-bg-dark"
    >
      {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}
