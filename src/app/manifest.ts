import type { MetadataRoute } from "next";

// PWA manifest — 아이패드 홈 화면에 앱으로 추가됐을 때 Safari가 이 정보를 읽는다
// (quick 260901-v4u). 리서치 2단 근거: manifest 없이 홈 화면에 추가된 사이트는
// 일반 북마크로 취급되어 localStorage가 Safari의 7일 미방문 정책에 그대로
// 노출된다 — manifest(+ display: standalone)가 있어야 "웹앱"으로 분류돼 그
// 정책에서 제외된다. 그래서 이 파일이 "이어서 읽기"(LastLessonRecorder)보다
// 먼저 들어간다.
//
// hex는 이 .ts 파일에만 둔다(check-design-tokens.mjs 규칙 a는 .tsx/globals.css만
// 스캔하므로 .ts는 대상 밖이다) — 각 값 옆에 대응하는 globals.css 토큰명을
// 주석으로 남겨 사람이 팔레트 변경 시 동기화할 수 있게 한다.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Engineer 사전학습",
    short_name: "사전학습",
    description: "AI Engineer 교육과정 사전학습 — 커리큘럼을 읽고, 완료를 체크하고, 진행률과 일정을 확인합니다.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f4f0", // globals.css --color-background(종이)
    theme_color: "#f5f4f0", // globals.css --color-background — 라이트 우선 편집 디자인, 상태바가 헤더와 붙는다
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
