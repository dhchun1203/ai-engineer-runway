import { ImageResponse } from "next/og";
import React from "react";

// 애플 홈 화면 추가 아이콘 — Next가 이 파일 규약으로
// <link rel="apple-touch-icon">을 자동 삽입한다(quick 260901-v4u).
// 아이패드에서 "홈 화면에 추가"를 누르면 스크린샷 대신 이 아이콘이 뜨는
// 바로 그 연결이다. icon.ts와 같은 이유로 .ts + React.createElement를 쓴다
// (check-design-tokens.mjs 규칙 a가 .tsx/globals.css만 스캔).
export const size = { width: 180, height: 180 }; // 애플 권장 크기
export const contentType = "image/png";

export default function AppleIcon() {
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
          padding: "34px",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            color: "#ffffff",
            fontSize: 78,
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
