import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import React from "react";

// 애플 홈 화면 추가 아이콘 — Next가 이 파일 규약으로
// <link rel="apple-touch-icon">을 자동 삽입한다(quick 260901-v4u).
// 아이패드에서 "홈 화면에 추가"를 누르면 스크린샷 대신 이 아이콘이 뜨는
// 바로 그 연결이다. icon.ts와 같은 이유로 .ts + React.createElement를 쓴다
// (check-design-tokens.mjs 규칙 a가 .tsx/globals.css만 스캔). 디자인도 icon.ts와
// 같게 맞춘다 — 대각 그라디언트 + 좌상단 광택 + Space Grotesk(OFL) "AI". iOS가
// 모서리를 알아서 둥글리므로 여기서 radius는 주지 않는다.
export const size = { width: 180, height: 180 }; // 애플 권장 크기
export const contentType = "image/png";

export default async function AppleIcon() {
  const spaceGrotesk = await readFile(
    join(process.cwd(), "assets/fonts/SpaceGrotesk-Bold.ttf"),
  );

  return new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(145deg, #2c4fd6 0%, #7a37ef 100%)",
          padding: "34px",
        },
      },
      React.createElement("div", {
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          backgroundImage:
            "radial-gradient(130% 100% at 26% 20%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 52%)",
        },
      }),
      React.createElement(
        "div",
        {
          style: {
            color: "#ffffff",
            fontSize: 76,
            fontFamily: "Space Grotesk",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            display: "flex",
            textShadow: "0 3px 10px rgba(15,18,50,0.30)",
          },
        },
        "AI",
      ),
    ),
    {
      ...size,
      fonts: [
        {
          name: "Space Grotesk",
          data: spaceGrotesk,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
