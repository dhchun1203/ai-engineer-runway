import { TrendingUp, Clock } from "lucide-react";
import type { PaceResult } from "@/lib/pace";
import { catchUpDays } from "@/lib/pace";
import { formatEstimatedTime } from "@/components/estimated-time";

// 페이스 상태 패널 — progress-summary.tsx와 같은 형태의 서버 렌더 가능한 순수
// 표현 컴포넌트. props는 { pace } 하나이고, 완료 집합 조회는 스스로 하지 않는다
// (page.tsx가 completedIds !== null일 때만 이 컴포넌트를 렌더한다, D-37 게이트).
//
// 색 규칙(UI-SPEC Color): accent는 ahead 상태에만 쓴다. on-track·behind는 둘
// 다 중성 텍스트다 — destructive 토큰은 계속 미사용 예약 상태로 둔다(D-43,
// 질책·압박 톤 금지). 아이콘은 aria-hidden="true"로 장식용이며, 설치된
// lucide-react 버전에서 이름이 해석되지 않으면 이해가 아이콘에 의존하지
// 않도록 텍스트만으로도 상태가 전달된다.

export function PaceStatusPanel({ pace }: { pace: PaceResult }) {
  const isAhead = pace.status === "ahead";
  const isBehind = pace.status === "behind";

  let heading: string;
  const bodyLines: string[] = [];

  if (isAhead) {
    heading = "앞서가고 있어요";
    bodyLines.push("계획보다 빠르게 진행하고 있어요.");
  } else if (isBehind) {
    heading = "조금 밀렸어요";
    const timeLabel = formatEstimatedTime(pace.gapMinutes);
    bodyLines.push(`${timeLabel} 분량(${pace.missedSlugs.length}개 레슨) 밀렸어요.`);
    bodyLines.push(`하루 30분씩 추가하면 ${catchUpDays(pace.gapMinutes)}일이면 따라잡아요.`);
  } else {
    heading = "순항 중이에요";
    bodyLines.push("계획대로 잘 따라가고 있어요.");
  }

  const headingClass = isAhead
    ? "text-[20px] font-semibold leading-[1.3] text-accent dark:text-accent-dark"
    : "text-[20px] font-semibold leading-[1.3]";

  return (
    <section
      data-schedule-ui="pace"
      data-pace-status={pace.status}
      className="flex flex-col gap-2 rounded-lg bg-surface p-6 dark:bg-surface-dark"
    >
      <div className="flex items-center gap-2">
        {isAhead ? (
          <TrendingUp className="h-5 w-5 text-accent dark:text-accent-dark" aria-hidden="true" />
        ) : null}
        {isBehind ? <Clock className="h-5 w-5" aria-hidden="true" /> : null}
        <h2 className={headingClass}>{heading}</h2>
      </div>
      {bodyLines.map((line) => (
        <p key={line} className="text-[16px] font-normal leading-[1.6]">
          {line}
        </p>
      ))}
    </section>
  );
}
