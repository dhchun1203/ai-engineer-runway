"use client";

import { useEffect } from "react";

// 이 phase가 도입하는 유일한 클라이언트 JS(T-03-15). props는 targetId 하나뿐이다 —
// 진도·완료 집합·시크릿 어떤 것도 받지 않는다(서버 → 클라이언트 직렬화 경계를 아예
// 없앤다). 마운트 시 한 번 해당 id 요소를 찾아 scrollIntoView로 데려가고, 요소가
// 없으면(오늘이 일정 범위 밖) 아무것도 하지 않고 조용히 끝난다. 별도 상태·이벤트
// 핸들러를 두지 않고 렌더 출력도 없다.
export function ScheduleAutoScroll({ targetId }: { targetId: string }) {
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ block: "center" });
  }, [targetId]);

  return null;
}
