// 베이스캠프 복습 카드와 퀴즈에서 쓰는 짧은 코드 상자. 레슨 본문(MDX)의 코드 블록은
// 빌드 때 하이라이트되지만, 복습 데이터는 TS 문자열이라 하이라이트 없이 고정폭 글꼴로만
// 보여 준다. 긴 줄은 가로로 스크롤한다(아이패드에서 줄바꿈으로 코드가 깨지지 않게).

export function ReviewCode({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto border border-line bg-surface-2 px-3 py-2.5 font-mono text-label leading-relaxed dark:border-line-dark dark:bg-surface-2-dark">
      <code>{code}</code>
    </pre>
  );
}
