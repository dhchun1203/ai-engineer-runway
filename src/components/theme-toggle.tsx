"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

// layout.tsx의 하이드레이션 이전 인라인 스크립트와 정확히 같은 localStorage 키("theme")와
// 같은 documentElement.classList("dark")를 읽고 쓴다 — React 컨텍스트 기반 테마 프로바이더는
// 만들지 않는다(RESEARCH Don't Hand-Roll: 하이드레이션 불일치로 인한 첫 페인트 깜빡임의 원인).
export function ThemeToggle() {
  // 서버 렌더와 하이드레이션 시점에는 실제 테마를 알 수 없다 — 인라인 스크립트가 이미
  // documentElement에 .dark를 반영해 두었으므로, 마운트 직후 그 값을 읽어 동기화한다.
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage 접근 불가(프라이빗 모드 등)여도 클래스 토글 자체는 이번 세션 표시에 반영된다.
    }
    setIsDark(next);
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
