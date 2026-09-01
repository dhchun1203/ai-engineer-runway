"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun, MonitorSmartphone } from "lucide-react";

// layout.tsx의 하이드레이션 이전 인라인 스크립트와 정확히 같은 localStorage 키("theme")와
// 같은 documentElement.classList("dark")를 읽고 쓴다 — React 컨텍스트 기반 테마 프로바이더는
// 만들지 않는다(RESEARCH Don't Hand-Roll: 하이드레이션 불일치로 인한 첫 페인트 깜빡임의 원인).
//
// quick 260901-etq: 2단(라이트↔다크)에서 3단 순환(라이트→다크→자동)으로.
// 예전 2단의 실제 결함 — 한 번이라도 토글하면 localStorage에 light/dark가 박혀,
// iOS가 일몰에 시스템 다크로 바뀌어도 사이트는 영구히 안 따라갔다. "자동"은
// 저장된 키를 지우는 것이다 — 인라인 스크립트의 기존 폴백(prefers-color-scheme)이
// 그대로 다음 방문의 진실이 되고, 이 세션에서는 아래 media 리스너가 따라간다.

type ThemeMode = "light" | "dark" | "auto";

// documentElement class + localStorage 두 신호를 함께 구독한다 — 모드(auto 여부)는
// localStorage에, 실제 표시(dark 여부)는 클래스에 있다.
function subscribeToTheme(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  // 자동 모드일 때 시스템 전환을 이 세션에서도 따라간다. 리스너는 항상 걸어두고
  // 핸들러가 모드를 확인한다 — 모드 전환 때 리스너를 붙였다 뗐다 하지 않는다.
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMediaChange = () => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("theme");
    } catch {}
    if (stored === null) {
      document.documentElement.classList.toggle("dark", media.matches);
    }
    onStoreChange();
  };
  media.addEventListener("change", onMediaChange);

  // 모드 전환이 클래스를 안 바꾸는 경우가 있다 — 다크 → 자동인데 시스템도
  // 다크면 classList가 그대로라 MutationObserver가 안 깨어나고, 라벨이 낡은
  // 모드를 보여준다(실측으로 잡은 버그). cycleTheme이 이 커스텀 이벤트를 쏴서
  // 저장소(localStorage) 변화도 스냅샷 재독을 트리거하게 한다.
  window.addEventListener("theme-mode-change", onStoreChange);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", onMediaChange);
    window.removeEventListener("theme-mode-change", onStoreChange);
  };
}

function getThemeSnapshot(): ThemeMode | null {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return "auto";
}

// 서버 렌더와 하이드레이션 시점에는 실제 테마를 알 수 없다 — null을 돌려 기존과 같은
// 초기 마크업을 유지하고, 하이드레이션 직후 클라이언트 스냅샷으로 정정된다.
function getThemeServerSnapshot(): ThemeMode | null {
  return null;
}

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  light: "dark",
  dark: "auto",
  auto: "light",
};

const MODE_LABEL: Record<ThemeMode, string> = {
  light: "라이트 모드",
  dark: "다크 모드",
  auto: "자동(시스템 따라가기)",
};

export function ThemeToggle() {
  const mode = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getThemeServerSnapshot);

  const cycleTheme = () => {
    const current = getThemeSnapshot() ?? "auto";
    const next = NEXT_MODE[current];
    try {
      if (next === "auto") {
        localStorage.removeItem("theme");
      } else {
        localStorage.setItem("theme", next);
      }
    } catch {
      // localStorage 접근 불가(프라이빗 모드 등)여도 클래스 토글은 이번 세션에 반영된다.
    }
    const isDark =
      next === "dark" || (next === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    // classList가 안 바뀌는 전환(다크→자동인데 시스템도 다크)에서도 스냅샷을
    // 다시 읽게 한다 — subscribeToTheme의 커스텀 이벤트 리스너가 받는다.
    window.dispatchEvent(new Event("theme-mode-change"));
  };

  const current = mode ?? "auto";
  const next = NEXT_MODE[current];

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`테마: ${MODE_LABEL[current]} — 누르면 ${MODE_LABEL[next]}`}
      title={MODE_LABEL[current]}
      className="tap-feedback flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-badge-neutral-text hover:bg-badge-neutral-bg dark:text-badge-neutral-text-dark dark:hover:bg-badge-neutral-bg-dark"
    >
      {current === "light" ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : current === "dark" ? (
        <Moon className="h-5 w-5" aria-hidden="true" />
      ) : (
        <MonitorSmartphone className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
