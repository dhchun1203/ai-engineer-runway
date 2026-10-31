// 사이트 전용 아이콘. 24 격자, 2px 잉크 선, 각진 끝(square cap, miter join)으로 그리고,
// 몸통 도형을 오른쪽 아래로 살짝 어긋나게 한 번 더 칠한다(인쇄 판이 어긋난 듯한 색 면).
// 로고의 brand-mark(파란 사각형 + 하드 그림자)와 같은 문법이다.
//
// - 선 색은 currentColor라 놓인 자리의 글자색(muted, 활성 chip-solid의 반전색)을 따른다.
// - 색 면은 기본이 옅은 파랑(내비처럼 작은 자리), bold면 꽉 찬 파랑(로그인 소개처럼 큰 자리).
//   색은 globals.css의 .cicon 규칙이 토큰으로 칠한다. 리터럴 색은 없다.
// - account(사람 모양)만 색 면 없이 선으로만 그린다. 머리 뒤에 색이 깔리면 지저분해 보인다.
// - 동작 아이콘(화살표, 닫기 등)은 계속 lucide를 쓴다. 이 세트는 "어느 구역인가"를 알리는
//   자리(내비 항목, 소개 카드)에만 쓴다.

const ICONS = {
  today: { body: "M3 5h18v16H3z", ink: "M3 10h18M8 2v5M16 2v5M9 15.5l2 2 4-4" },
  basecamp: { body: "M2 21L11 7l9 14z", ink: "M11 7V2h6l-1.5 1.5L17 5h-6M8.5 21l2.5-5 2.5 5" },
  class: { body: "M2 4h20v13H2z", ink: "M6 9h7M6 12.5h4M8 21l2-4M16 21l-2-4" },
  curriculum: { body: "M3 5h7l2 2 2-2h7v14h-7l-2 2-2-2H3z", ink: "M12 7v14" },
  roadmap: { body: "M4 4h13l3 3.5-3 3.5H4z", ink: "M10 11v10M10 2v2M6 21h8" },
  til: { body: "M15 3l6 6-12 12H3v-6z", ink: "M12 6l6 6" },
  review: { body: "M4 4h16v16H4z", ink: "M9 9.5a4 4 0 1 1-.5 4.5M8 7v3h3" },
  glossary: { body: "M3 5h18v14H3z", ink: "M6 16l2.5-7 2.5 7M7 13.5h3M14 10h4M14 14h4" },
  notes: { body: "M5 3h15v18H5z", ink: "M9 3v18M12.5 8h4M12.5 12h4M3 7h4M3 12h4M3 17h4" },
  bookmarks: { body: "M6 3h12v18l-6-5-6 5z", ink: "" },
  inbox: { body: "M3 13L6 4h12l3 9v7H3z", ink: "M3 13h5l1.5 3h5L16 13h5" },
  concepts: { body: "M6 6h12v12H6z", ink: "M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4M10 10h4v4h-4z" },
  practice: { body: "M2 6h20v12H2z", ink: "M6 10h1M10 10h1M14 10h1M18 10h1M7 14h10" },
  articles: { body: "M3 4h15v16H3z", ink: "M18 8h3v12h-3M6 8h9M6 12h9M6 16h6" },
  print: { body: "M3 9h18v9H3z", ink: "M7 9V3h10v6M7 14h10v7H7z" },
  offline: { body: "M5 3h14v18H5z", ink: "M12 7v7M8.5 10.5L12 14l3.5-3.5M9 18h6" },
  about: { body: "M3 3h18v18H3z", ink: "M12 11v6M12 7v.5" },
  slack: { body: "M4 4h16v16H4z", ink: "M10 7l-1.5 10M15.5 7L14 17M7 10h11M6.5 14h11" },
  account: { body: "M12 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z", ink: "M4 21c0-4 3.5-6 8-6s8 2 8 6" },
  progress: { body: "M4 3h16v18H4z", ink: "M8 9l1.5 1.5L12.5 7.5M8 15.5l1.5 1.5 3-3M15 9h2M15 16h2" },
} as const;

export type CustomIconName = keyof typeof ICONS;

export function CustomIcon({
  name,
  bold = false,
  className = "",
}: {
  name: CustomIconName;
  bold?: boolean;
  className?: string;
}) {
  const icon = ICONS[name];
  const offset = bold ? 3 : 2;
  return (
    <svg
      viewBox="0 0 24 24"
      className={`cicon${bold ? " cicon-bold" : ""} ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {name === "account" ? null : (
        <path className="cicon-fill" transform={`translate(${offset} ${offset})`} d={icon.body} />
      )}
      <path d={icon.body} />
      {icon.ink ? <path d={icon.ink} /> : null}
    </svg>
  );
}
