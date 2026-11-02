// 홈의 작은 잔디 칸 색. 하루에 몇 편을 썼는지는 따지지 않고, 그날 썼는지만 나타낸다.
// /til의 큰 달력과 같은 잉크색이다.
export function dayCellClass(written: boolean): string {
  return written
    ? 'bg-foreground dark:bg-foreground-dark'
    : 'bg-badge-neutral-bg dark:bg-badge-neutral-bg-dark';
}
