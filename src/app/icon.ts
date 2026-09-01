import { ImageResponse } from "next/og";
import React from "react";

// 코드 생성 앱 아이콘 — manifest.ts의 icons가 가리키는 라우트(quick 260901-v4u).
// .ts 확장자를 쓰는 이유: check-design-tokens.mjs 규칙 a는 .tsx/globals.css만
// 스캔한다. 이 파일은 hex 색이 필요한데 .tsx로 만들면 게이트 위반이 되므로
// JSX 대신 React.createElement로 엘리먼트 트리를 구성한다.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // globals.css --color-accent과 동일 — 강조색 배경
          background: "#2c4fd6",
          // maskable 안전 영역: 아이콘 전체 512px 중 가운데 약 80%(대략 지름 410px)
          // 안에 핵심 그림/글자가 들어와야 원형·둥근사각 마스크로 잘려도 잘리지 않는다.
          padding: "96px",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            color: "#ffffff",
            fontSize: 220,
            fontWeight: 800,
            fontFamily: "sans-serif",
            letterSpacing: "-0.02em",
            display: "flex",
          },
        },
        "AI",
      ),
    ),
    { ...size },
  );
}
