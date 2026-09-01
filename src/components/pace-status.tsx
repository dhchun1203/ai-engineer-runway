import { TrendingUp, Clock } from "lucide-react";
import type { PaceResult, AheadDetail, Projection } from "@/lib/pace";
import { catchUpDays } from "@/lib/pace";
import { formatEstimatedTime } from "@/components/estimated-time";
import { COURSE_START_DATE } from "@/lib/schedule";

// 페이스 상태 패널 — progress-summary.tsx와 같은 형태의 서버 렌더 가능한 순수
// 표현 컴포넌트. props는 { pace, ahead, projection } 세 개이고, 완료 집합 조회는
// 스스로 하지 않는다 (page.tsx가 completedIds !== null일 때만 이 컴포넌트를
// 렌더한다, D-37 게이트).
//
// 색 규칙(UI-SPEC Color): accent는 ahead 상태에만 쓴다. on-track·behind는 둘
// 다 중성 텍스트다 — destructive 토큰은 계속 미사용 예약 상태로 둔다(D-43,
// 질책·압박 톤 금지). 아이콘은 aria-hidden="true"로 장식용이며, 설치된
// lucide-react 버전에서 이름이 해석되지 않으면 이해가 아이콘에 의존하지
// 않도록 텍스트만으로도 상태가 전달된다.
//
// ahead일 때 수치를 보여준다: "앞서가고 있어요"만으로는 얼마나 앞선 건지 알 수
// 없어서 응원 문구로만 읽힌다. behind가 이미 "몇 시간·몇 개 밀렸는지"를 말하고
// 있었으므로 ahead만 숫자가 없던 비대칭을 없앤다.
//
// 완료 예측일(round2-완료예측일): 예측 줄은 ahead/on-track 분기에서만 생성되고
// behind 분기에는 코드 경로가 없다 — 늦은 완주일이 격려를 낙담으로 반전시키는
// 리서치 2단 경고를 구조로 차단한다(computeProjection의 show 플래그와 짝을
// 이루는 두 겹 방어).

/** "2026-09-01" -> "9월 1일". Date 객체를 쓰지 않는다 — 문자열 포맷이 고정이다. */
function formatMonthDay(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

/**
 * 예측 완주일 문자열을 만든다. isAhead·on-track 분기에서만 호출된다(isBehind
 * 분기는 이 함수를 호출하는 코드 경로 자체가 없다). 개강일(COURSE_START_DATE)
 * 전에 끝나는 예측이면 격려 문구를 덧붙인다 — 날짜 문자열 사전순 비교로 충분하다.
 */
function buildProjectionLine(projectedFinish: string): string {
  const base = `이 속도면 ${formatMonthDay(projectedFinish)} 완주 예정`;
  return projectedFinish < COURSE_START_DATE ? `${base} · 개강 전에 끝나요` : base;
}

export function PaceStatusPanel({
  pace,
  ahead,
  projection,
}: {
  pace: PaceResult;
  ahead?: AheadDetail;
  projection?: Projection;
}) {
  const isAhead = pace.status === "ahead";
  const isBehind = pace.status === "behind";

  let heading: string;
  // 한 줄로 크게 보여줄 수치. 없으면 기존처럼 본문 문장만 나온다.
  let headline: string | null = null;
  const bodyLines: string[] = [];
  // 예측 줄 문자열. isAhead/on-track 분기에서만 값을 만든다 — isBehind 분기에는
  // 이 변수를 세팅하는 코드를 절대 넣지 않는다(위 컴포넌트 주석 참고).
  let projectionLine: string | null = null;

  if (isAhead) {
    heading = "앞서가고 있어요";
    if (ahead && ahead.lessonCount > 0) {
      // 오늘 몫만 끝낸 것은 "0일 앞섬"이다 — 예정대로 한 것이지 앞선 게 아니라서
      // 며칠이라고 부르지 않고 그대로 "오늘 몫까지"라고 말한다.
      headline =
        ahead.daysAhead > 0 ? `${ahead.daysAhead}일 앞서 있어요` : "오늘 몫까지 끝냈어요";

      const detail = [
        `미리 끝낸 레슨 ${ahead.lessonCount}개`,
        formatEstimatedTime(ahead.minutes),
      ];
      if (ahead.throughDate) {
        detail.push(`${formatMonthDay(ahead.throughDate)} 분량까지 완료`);
      }
      bodyLines.push(detail.join(" · "));
    } else {
      bodyLines.push("계획보다 빠르게 진행하고 있어요.");
    }
    if (projection?.show && projection.projectedFinish) {
      projectionLine = buildProjectionLine(projection.projectedFinish);
    }
  } else if (isBehind) {
    heading = "조금 밀렸어요";
    const timeLabel = formatEstimatedTime(pace.gapMinutes);
    bodyLines.push(`${timeLabel} 분량(${pace.missedSlugs.length}개 레슨) 밀렸어요.`);
    bodyLines.push(`하루 30분씩 추가하면 ${catchUpDays(pace.gapMinutes)}일이면 따라잡아요.`);
  } else {
    heading = "순항 중이에요";
    bodyLines.push("계획대로 잘 따라가고 있어요.");
    if (projection?.show && projection.projectedFinish) {
      projectionLine = buildProjectionLine(projection.projectedFinish);
    }
  }

  const headingClass = isAhead
    ? "text-heading font-extrabold text-accent dark:text-accent-dark"
    : "text-heading font-extrabold";

  return (
    <section
      data-schedule-ui="pace"
      data-pace-status={pace.status}
      className="panel flex flex-col gap-2 p-6"
    >
      <div className="flex items-center gap-2">
        {isAhead ? (
          <TrendingUp className="h-5 w-5 text-accent dark:text-accent-dark" aria-hidden="true" />
        ) : null}
        {isBehind ? <Clock className="h-5 w-5" aria-hidden="true" /> : null}
        <h2 className={headingClass}>{heading}</h2>
      </div>
      {headline ? (
        <p
          data-pace-headline
          className="text-display font-black text-accent dark:text-accent-dark"
        >
          {headline}
        </p>
      ) : null}
      {bodyLines.map((line) => (
        <p key={line} className="text-body font-normal">
          {line}
        </p>
      ))}
      {projectionLine ? (
        <p
          data-pace-projection
          className={
            isAhead
              ? "text-body font-semibold text-accent dark:text-accent-dark"
              : "text-body font-normal"
          }
        >
          {projectionLine}
        </p>
      ) : null}
    </section>
  );
}
