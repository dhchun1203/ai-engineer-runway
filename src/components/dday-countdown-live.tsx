"use client";

// D8-O: /curriculum이 완전 정적이 되려면 D-day 계산이 빌드 시점 값에 갇히면
// 안 된다. ISR(revalidate)을 쓰면 재검증 창 만료 후 첫 요청이 낡은 페이지를
// 그대로 받는다(설치된 Next 16.3.2 문서 incremental-static-regeneration.md
// 100~102행·238행) — 하루 한 번 여는 사이트에서는 그 "낡은 첫 요청"이 사실상
// 매일이 된다. 대신 D-day만 브라우저에서 다시 계산해 정정한다: 정적 셸은
// 빌드 시점 값을 초기 마크업으로 심어 레이아웃을 확정하고, 마운트 후
// useEffect가 브라우저의 오늘(Asia/Seoul)로 다시 계산해 다르면 갱신한다.
// ISR보다 정확하고(창 자체가 없다) 완전 정적의 이점(캐시·TTFB)도 잃지 않는다.
//
// src/lib/today.ts와 src/lib/schedule.ts만 import한다 — 둘 다 의존성 0 순수
// 모듈(G18)이라 클라이언트 번들에 진도·시크릿 계열 식별자가 전혀 섞이지 않는다.
// 렌더는 기존 <DDayCountdown>에 위임한다 — 표현 컴포넌트를 복제하지 않는다.

import { useSyncExternalStore } from "react";
import { DDayCountdown } from "@/components/dday-countdown";
import { todayInSeoul, daysUntil } from "@/lib/today";
import { COURSE_START_DATE } from "@/lib/schedule";

// 마운트 이후 값이 스스로 바뀌지는 않는다(자정을 넘겨 열어 둔 탭은 갱신되지 않는다 —
// 기존 useEffect 구현과 같은 범위다). 구독은 해제 함수만 돌려주는 no-op이다.
function subscribeToNothing() {
  return () => {};
}

function getTodaySnapshot() {
  return daysUntil(COURSE_START_DATE, todayInSeoul());
}

export function DDayCountdownLive({ initialDaysUntil }: { initialDaysUntil: number }) {
  // 서버 스냅샷은 정적 셸에 심긴 빌드 시점 값, 클라이언트 스냅샷은 브라우저의
  // 오늘(Asia/Seoul)로 재계산한 값 — 하이드레이션 직후 값이 다르면 정정된다.
  const value = useSyncExternalStore(subscribeToNothing, getTodaySnapshot, () => initialDaysUntil);

  return <DDayCountdown daysUntil={value} />;
}
