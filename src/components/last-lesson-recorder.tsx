"use client";

import { useEffect } from "react";

// "이어서 읽기"(quick 260901-v4u)의 기록기 절반 — 레슨을 열 때마다 localStorage
// "lastLesson"에 {slug, title}을 남긴다. 읽는 쪽은 continue-reading-card.tsx가
// 담당하고, 두 파일은 이 키 문자열로만 연결된다(동일 문자열 "lastLesson").
//
// manifest(Task 1)가 먼저 들어간 이유가 여기 있다 — 홈 화면에 추가되지 않은
// 일반 북마크 상태에서는 Safari가 7일 미방문 시 이 값을 지운다(리서치 2단).
//
// 화면에 아무것도 그리지 않는다(렌더는 null). 쓰기는 try/catch로 감싼다 —
// 사파리 프라이빗 모드는 localStorage 쓰기가 조용히 실패하거나 예외를 던질 수
// 있고, 이 기록은 부가 기능이라 실패해도 레슨 읽기 자체를 막으면 안 된다.
export function LastLessonRecorder({ slug, title }: { slug: string; title: string }) {
  useEffect(() => {
    try {
      localStorage.setItem("lastLesson", JSON.stringify({ slug, title }));
    } catch {
      // 프라이빗 모드 등 — 조용히 무시. "이어서 읽기"가 그냥 안 뜰 뿐이다.
    }
  }, [slug, title]);

  return null;
}
