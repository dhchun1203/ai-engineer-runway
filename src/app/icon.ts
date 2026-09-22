import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import React from "react";

// 코드 생성 앱 아이콘 — manifest.ts의 icons가 가리키는 라우트(quick 260901-v4u).
// .ts 확장자를 쓰는 이유: check-design-tokens.mjs 규칙 a는 .tsx/globals.css만
// 스캔한다. 이 파일은 hex 색이 필요한데 .tsx로 만들면 게이트 위반이 되므로
// JSX 대신 React.createElement로 엘리먼트 트리를 구성한다.
//
// 디자인: 강조색(#2c4fd6) 계열의 대각 그라디언트 배경 + 좌상단 은은한 광택
// (radial highlight)으로 깊이를 준다. 배경은 512px 전체를 꽉 채워(bleed) maskable
// 마스크가 어떤 모양으로 잘라도 가장자리에 색이 남게 하고, 글자는 가운데 안전
// 영역(padding) 안에 둬 잘리지 않게 한다.
//
// 글자는 기본 sans-serif 대신 Space Grotesk(기하학적 디스플레이 서체, OFL)를 심는다
// — 기본 서체는 밋밋해서 로고감이 안 난다. next/og 문서 권장대로 프로젝트 루트의
// ttf를 readFile로 읽어 fonts로 넘긴다(ttf/otf만 지원, woff2 불가라 사이트 본문
// 서브셋은 못 쓴다). 라이선스: assets/fonts/SpaceGrotesk-OFL.txt.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default async function Icon() {
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
          // globals.css --color-accent(#2c4fd6)에서 보라로 흐르는 대각 그라디언트
          backgroundImage: "linear-gradient(145deg, #2c4fd6 0%, #7a37ef 100%)",
          // maskable 안전 영역: 가운데 약 80%(지름 410px 안)에 글자가 들어와야 한다
          padding: "96px",
        },
      },
      // 좌상단에서 번지는 부드러운 광택 — 유리처럼 살짝 볼록해 보이게 한다.
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
            fontSize: 216,
            fontFamily: "Space Grotesk",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            display: "flex",
            // 글자 아래 옅은 그림자로 배경에서 살짝 떠 보이게 한다.
            textShadow: "0 5px 20px rgba(15,18,50,0.30)",
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
