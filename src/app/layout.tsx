import type { Metadata } from "next";
import { pretendard } from "@/lib/fonts";
import { SiteNav } from "@/components/site-nav";
import { PrintMode } from "@/components/print-mode";
import "./globals.css";

// D-15: 비밀이 아닌 값 — 환경변수가 없어도 빌드가 성공해야 한다.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-engineer-runway.vercel.app";
const SITE_NAME = "AI Engineer Runway";
const SITE_DESCRIPTION = "AI Engineer 교육과정 사전학습 사이트 — 커리큘럼을 읽고, 완료를 체크하고, 진행률과 일정을 확인합니다.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: "ko_KR",
    type: "website",
  },
};

// FOUC/hydration-mismatch를 피하기 위해 React context 테마 프로바이더 대신
// 하이드레이션 이전에 실행되는 인라인 스크립트로 .dark 클래스를 토글한다 (D-05).
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var isDark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SiteNav />
        {/* 인쇄 직전 다크 모드 해제 + 접힌 상자 펼침 — 어느 페이지에서 인쇄하든
            같은 종이가 나오도록 루트 레이아웃에 한 번만 둔다. */}
        <PrintMode />
        {children}
      </body>
    </html>
  );
}
