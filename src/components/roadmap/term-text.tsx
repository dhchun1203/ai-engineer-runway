// 용어 사전 본문 한 문단을 그린다. 본문 속 `백틱`으로 감싼 부분은 코드 글꼴로 보여 준다
// (예: `async def`). 용어 패널, 용어 카드 페이지, 용어 목록이 함께 쓴다.

export function TermText({ text }: { text: string }) {
  const parts = text.split("`");
  // 백틱이 홀수 개면 짝이 안 맞으니 그대로 글자로 둔다.
  if (parts.length % 2 === 0) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            className="break-words rounded-sm bg-surface-2 px-1 py-px font-mono text-[0.9em] dark:bg-surface-2-dark"
          >
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** 메타 설명처럼 글자만 필요한 곳: 백틱을 걷어 낸다. */
export function termPlainText(text: string): string {
  return text.replaceAll("`", "");
}
