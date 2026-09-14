// 로딩 스켈레톤용 회색 블록. 동적 페이지로 이동할 때 loading.tsx들이 공유한다.
// 클릭 즉시 이 자리표시가 그려져 "멈춘 느낌"을 없앤다(실제 데이터는 서버가 준비 중).
// 사이트의 각진 스타일에 맞춰 모서리를 둥글리지 않고, 한 단계 눌린 면(surface-2) 톤을 쓴다.

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse bg-surface-2 dark:bg-surface-2-dark ${className}`}
    />
  );
}
