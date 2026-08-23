import type { Metadata } from "next";
import { pretendard } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Engineer Runway",
  description: "AI Engineer 교육과정 사전학습 사이트",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
