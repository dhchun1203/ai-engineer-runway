// 잔디 칸의 색. 글 수를 초록 한 색의 농도로 나타낸다. 큰 달력과 홈의 작은 잔디가 함께 쓴다.
export function levelClass(count: number): string {
  if (count === 0) return 'bg-badge-neutral-bg dark:bg-badge-neutral-bg-dark';
  if (count === 1) return 'bg-ok/45 dark:bg-ok-dark/45';
  if (count === 2) return 'bg-ok/70 dark:bg-ok-dark/70';
  return 'bg-ok dark:bg-ok-dark';
}

// 칸 안의 날짜 숫자 색. 농도마다 읽히는 쪽을 고른다.
export function levelTextClass(count: number): string {
  if (count === 0) return 'text-badge-neutral-text dark:text-badge-neutral-text-dark';
  if (count === 1) return 'text-foreground dark:text-foreground-dark';
  if (count === 2) return 'text-foreground dark:text-background-dark';
  return 'text-white dark:text-background-dark';
}
