// 잔디 칸의 색. 하루에 몇 편을 썼는지는 따지지 않고, 그날 썼는지만 나타낸다.
// 큰 달력과 홈의 작은 잔디가 함께 쓴다.
export function dayCellClass(written: boolean): string {
  return written
    ? 'bg-ok dark:bg-ok-dark'
    : 'bg-badge-neutral-bg dark:bg-badge-neutral-bg-dark';
}

// 칸 안의 날짜 숫자 색.
export function dayCellTextClass(written: boolean): string {
  return written
    ? 'text-white dark:text-background-dark'
    : 'text-badge-neutral-text dark:text-badge-neutral-text-dark';
}
