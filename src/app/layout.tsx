import type { Metadata } from "next";
import { pretendard, newsreader, notoSerifKr, jetbrainsMono } from "@/lib/fonts";
import { SiteNav } from "@/components/site-nav";
import { PrintMode } from "@/components/print-mode";
import { ScrollToTop } from "@/components/scroll-to-top";
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
  // 홈 화면에 추가된 페이지를 iOS가 독립 웹앱으로 다루게 하는
  // apple-mobile-web-app-* 메타(quick 260901-v4u). manifest.ts(display:
  // standalone)와 짝을 이룬다 — 색은 여기서 다루지 않는다(디자인 토큰
  // 규칙 a — hex는 manifest.ts/아이콘 .ts 전담).
  appleWebApp: {
    capable: true,
    title: "AI Engineer 사전학습",
    statusBarStyle: "default",
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
    <html
      lang="ko"
      className={`${pretendard.variable} ${newsreader.variable} ${notoSerifKr.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/* 본문으로 건너뛰기 — 키보드/스크린리더 사용자가 내비를 지나 곧장
            본문으로 이동한다(quick 260901-v4u). 평소에는 화면 밖에 있다가
            Tab으로 포커스가 오면 나타난다(globals.css .skip-link). */}
        <a href="#main-content" className="skip-link">
          본문으로 건너뛰기
        </a>
        <SiteNav />
        {/* 인쇄 직전 다크 모드 해제 + 접힌 상자 펼침 — 어느 페이지에서 인쇄하든
            같은 종이가 나오도록 루트 레이아웃에 한 번만 둔다. */}
        <PrintMode />
        {/* skip link의 포커스 타깃. 각 페이지가 이미 자기 <main>을 렌더하므로
            여기서는 새 랜드마크를 추가하지 않고 스킵 지점 역할만 한다 —
            tabIndex=-1은 스크립트로 포커스를 옮길 수 있게 하되 탭 순서에는
            끼지 않는다. flex flex-1 flex-col은 색·임의값이 아닌 구조 유틸리티다
            — body의 flex-col 컨텍스트를 이 래퍼가 그대로 이어받아야 각 페이지의
            <main className="... flex-1 ...">가 기존과 동일하게 남은 세로 공간을
            채운다(래퍼 삽입으로 인한 레이아웃 회귀 방지). */}
        <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
          {children}
        </div>
        {/* 맨 위로 가기 — 어느 화면에서든 같은 자리에 있어야 하므로 루트에 한 번만
            둔다. 자기 자리는 스스로 안다(.scroll-top). */}
        <ScrollToTop />
      </body>
    </html>
  );
}
