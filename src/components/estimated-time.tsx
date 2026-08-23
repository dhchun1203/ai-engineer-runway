// 60분 미만은 "약 N분", 60분 이상은 시간으로 환산해 "약 N시간"으로 표기한다(UI-SPEC Copywriting Contract).
// 나누어떨어지지 않으면 소수 첫째 자리까지 쓴다 — 270분 -> "약 4.5시간", 180분 -> "약 3시간".
export function formatEstimatedTime(minutes: number): string {
  if (minutes < 60) {
    return `약 ${minutes}분`;
  }
  const hours = Math.round((minutes / 60) * 10) / 10;
  const display = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `약 ${display}시간`;
}

export function EstimatedTime({ minutes }: { minutes: number }) {
  return (
    <span className="whitespace-nowrap text-[14px] font-normal leading-[1.4]">
      {formatEstimatedTime(minutes)}
    </span>
  );
}
