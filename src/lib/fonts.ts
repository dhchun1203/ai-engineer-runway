import localFont from "next/font/local";
import { Newsreader, JetBrains_Mono } from "next/font/google";

// 이 사이트의 타이포 배치는 "제목 산세 + 본문 세리프"다(quick 260831-wlw).
// 클로드의 실제 서체(Styrene·Tiempos 등)는 상용 라이선스이고 한글이 없어 쓸 수
// 없으므로, 같은 배치를 라이선스 가능한(OFL) 서체로 재현한다.
//
// next/font/google은 런타임에 구글로 요청을 보내지 않는다 — 빌드 때 내려받아
// 자기 도메인에서 서빙한다. 그래서 Pretendard처럼 파일을 저장소에 넣지 않아도
// 추가 왕복이나 외부 추적이 생기지 않는다.

export const pretendard = localFont({
  // 08-04: 풀세트(2.0MB, 한자·가나 포함) 대신 서브셋 파일을 가리킨다 — 서브셋 여부와
  // 무관한 variable/weight/display는 그대로 둔다. 원본은 assets/fonts/에 보존돼 있다.
  src: "../../public/fonts/PretendardVariable.subset.woff2",
  variable: "--font-pretendard",
  weight: "45 920", // variable font axis range, not 9 discrete static files
  display: "swap",
});

// 본문 라틴 — Tiempos와 같은 계열의 뉴스 세리프. opsz(광학 크기)·wght 두 축을 가진
// 가변 폰트라 본문부터 큰 인용까지 한 파일로 덮는다.
export const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif-latin",
  display: "swap",
});

// 본문 한글 — 가변 명조(OFL). 라틴 세리프에는 한글이 없으므로 폰트 스택에서 이
// 서체가 한글을 받는다.
//
// next/font/google을 쓰지 않는 이유: 이 Next 버전의 폰트 데이터에는 `korean`
// 서브셋을 가진 폰트가 하나도 없다(구글이 한글을 이름 없는 유니코드 구간 90여
// 조각으로 쪼개 배포하기 때문이다). 그래서 구글 경로로는 한글을 아예 못 받는다 —
// Pretendard와 같은 방식으로 원본을 저장소에 두고 서브셋해서 자기 도메인에서
// 서빙한다. 서브셋 생성은 scripts/subset-font.mjs, 정합성은
// scripts/check-font-glyph-coverage.mjs가 상시로 지킨다.
//
// Hahmlet을 먼저 시도했다가 물렀다: "serif" 분류의 한국어 폰트지만 **라틴만
// 세리프이고 한글은 고딕**이라, 본문 한글이 그대로 산세로 나왔다(큰 글자로
// 나란히 놓고 확인했다). 한국어 폰트는 분류명이 아니라 실제 한글 자형을 봐야 한다.
export const notoSerifKr = localFont({
  src: "../../public/fonts/NotoSerifKR.subset.woff2",
  variable: "--font-serif-ko",
  weight: "200 900", // variable font axis range
  display: "swap",
});

// 코드 — 지금까지 `ui-monospace`(기기마다 다른 서체가 잡힌다)였다. 코드 정확성이
// 학습 내용의 일부인 사이트라 어느 기기에서든 같은 글자가 나와야 한다.
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
