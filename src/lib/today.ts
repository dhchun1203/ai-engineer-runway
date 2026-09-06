// "오늘" 판정의 심장 — 의존성 0 순수 모듈. import 문을 하나도 쓰지 않는다.
// 그래야 Node가 이 파일을 별도 트랜스파일러 없이 그대로 로드할 수 있고
// (scripts/check-schedule.mjs, Node 22.6+ 타입 스트리핑), 화면 작업이 타임존
// 계산 정확성을 다시 의심하지 않아도 된다 — progress-math.ts와 같은 이유.

/**
 * Asia/Seoul(1988년 이후 서머타임 없는 고정 UTC+9) 기준 오늘 날짜를 YYYY-MM-DD로
 * 돌려준다. en-CA 로케일은 Intl.DateTimeFormat에서 연-월-일 순서로 포맷한다.
 * now는 반드시 주입 가능한 기본값 인자여야 한다 — 게이트가 자정 경계(예: UTC
 * 14:59:59 vs 15:00:00)를 재현하는 유일한 방법이다(RESEARCH Pitfall 1).
 */
export function todayInSeoul(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now);
}

/**
 * 두 YYYY-MM-DD 문자열의 캘린더 일수 차이(targetDateISO - fromDateISO)를 돌려준다.
 * 두 문자열을 각각 Date.UTC로 자정 UTC 인스턴트로 만들어 뺄셈한다 — 로컬 타임존
 * getter는 한 번도 쓰지 않는다(Pitfall 1). 개강일 이후에는 음수를 그대로 돌려주고,
 * 'D-DAY'로 표시할지는 표시층(DDayCountdown)이 판단한다.
 */
export function daysUntil(targetDateISO: string, fromDateISO: string): number {
  const [ty, tm, td] = targetDateISO.split('-').map(Number);
  const [fy, fm, fd] = fromDateISO.split('-').map(Number);
  const targetUTC = Date.UTC(ty, tm - 1, td);
  const fromUTC = Date.UTC(fy, fm - 1, fd);
  return Math.round((targetUTC - fromUTC) / 86_400_000);
}

/**
 * Asia/Seoul 기준 현재 시(0-23)를 돌려준다. 학습 알림 크론이 "지금이 사용자가 정한
 * 발송 시각인가"를 판단하는 데 쓴다. now는 todayInSeoul과 같은 이유로 주입 가능한
 * 기본값 인자다(자정·정시 경계 테스트). hour12: false는 자정을 '24'로 주는 환경이
 * 있어 24로 나눈 나머지로 0에 정규화한다.
 */
export function hourInSeoul(now: Date = new Date()): number {
  const hh = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    hour12: false,
  }).format(now);
  return Number(hh) % 24;
}
