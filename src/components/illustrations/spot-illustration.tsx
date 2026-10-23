// 섹션 머리에 두는 스팟 일러스트. 사이트 디자인 문법(각진 종이, 굵은 잉크 선, 오른쪽 아래로
// 떨어지는 하드 그림자, 파랑/주황/황토 세 색)을 그대로 그림으로 옮긴 것이다.
//
// - 색은 전부 globals.css의 .illo 변수(디자인 토큰을 가리킴)로만 칠한다. 리터럴 색은 없다
//   (check-design-tokens 규칙 a). 라이트/다크는 .dark .illo가 변수만 바꿔 따라간다.
// - 그림자는 같은 도형을 (5, 5) 옮겨 .il-shadow 그룹으로 한 번 더 그린다. 카드의
//   box-shadow(4px/8px 하드 그림자)와 같은 감각이다.
// - 순수 장식이라 aria-hidden. 서버 컴포넌트(훅 없음)라 정적 라우트를 동적으로 바꾸지 않는다.
// - 글자는 ASCII(?, Aa)만 쓴다. 한글을 넣으면 폰트 서브셋 검사에 새 글리프가 걸릴 수 있다.

import type { ReactNode } from "react";

const SPOT_ART = {
  // 오늘의 학습: 달력과 체크
  today: (
    <>
      <path className="il-stroke-blue" d="M18 30h8M22 26v8"/>
      <path className="il-stroke-orange" d="M138 58h8M142 54v8"/>
      <g className="il-shadow" transform="translate(5 5)">
        <circle className="il-amber" cx="128" cy="30" r="11"/>
      </g>
      <circle className="il-amber" cx="128" cy="30" r="11"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-paper" x="28" y="26" width="76" height="76"/>
      </g>
      <rect className="il-paper" x="28" y="26" width="76" height="76"/>
      <rect className="il-orange" x="28" y="26" width="76" height="18"/>
      <rect className="il-solid" x="44" y="18" width="6" height="14"/>
      <rect className="il-solid" x="82" y="18" width="6" height="14"/>
      <rect className="il-soft-fill" x="38" y="52" width="10" height="8"/>
      <rect className="il-soft-fill" x="52" y="52" width="10" height="8"/>
      <rect className="il-soft-fill" x="66" y="52" width="10" height="8"/>
      <rect className="il-soft-fill" x="80" y="52" width="10" height="8"/>
      <rect className="il-soft-fill" x="38" y="66" width="10" height="8"/>
      <rect className="il-soft-fill" x="52" y="66" width="10" height="8"/>
      <polyline className="il-stroke-blue il-thick" points="52,80 64,92 92,62"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-blue" x="114" y="74" width="22" height="30"/>
        <path className="il-ink" d="M136 80h6v12h-6"/>
      </g>
      <rect className="il-blue" x="114" y="74" width="22" height="30"/>
      <path className="il-ink" d="M136 80h6v12h-6"/>
      <path className="il-thin" d="M120 66c-2-4 2-6 0-10M128 66c-2-4 2-6 0-10"/>
      <line className="il-ink" x1="8" y1="104" x2="152" y2="104"/>
    </>
  ),
  // 베이스캠프: 산과 텐트, 정상의 깃발
  basecamp: (
    <>
      <g className="il-shadow" transform="translate(5 5)">
        <circle className="il-amber" cx="130" cy="28" r="10"/>
      </g>
      <circle className="il-amber" cx="130" cy="28" r="10"/>
      <path className="il-stroke-blue" d="M20 26h8M24 22v8"/>
      <g className="il-shadow" transform="translate(5 5)">
        <polygon className="il-blue" points="88,104 116,58 144,104"/>
      </g>
      <polygon className="il-blue" points="88,104 116,58 144,104"/>
      <g className="il-shadow" transform="translate(5 5)">
        <polygon className="il-soft" points="16,104 66,28 116,104"/>
      </g>
      <polygon className="il-soft" points="16,104 66,28 116,104"/>
      <polygon className="il-paper" points="66,28 53.5,47 60,43 66,49 72,43 78.5,47"/>
      <path className="il-ink" d="M66 28V10"/>
      <polygon className="il-orange" points="66,10 82,14 66,18"/>
      <g className="il-shadow" transform="translate(5 5)">
        <polygon className="il-orange" points="26,104 42,78 58,104"/>
      </g>
      <polygon className="il-orange" points="26,104 42,78 58,104"/>
      <polygon className="il-solid" points="37,104 42,90 47,104"/>
      <line className="il-ink" x1="8" y1="104" x2="152" y2="104"/>
    </>
  ),
  // 커리큘럼: Step 1~3 계단
  curriculum: (
    <>
      <path className="il-stroke-blue" d="M22 30h8M26 26v8"/>
      <path className="il-stroke-orange" d="M66 22h8M70 18v8"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-blue" x="14" y="76" width="42" height="28"/>
      </g>
      <rect className="il-blue" x="14" y="76" width="42" height="28"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-orange" x="56" y="56" width="42" height="48"/>
      </g>
      <rect className="il-orange" x="56" y="56" width="42" height="48"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-amber" x="98" y="34" width="42" height="70"/>
      </g>
      <rect className="il-amber" x="98" y="34" width="42" height="70"/>
      <rect className="il-paper-fill" x="21" y="83" width="6" height="6"/>
      <rect className="il-paper-fill" x="63" y="63" width="6" height="6"/>
      <rect className="il-paper-fill" x="73" y="63" width="6" height="6"/>
      <rect className="il-paper-fill" x="105" y="41" width="6" height="6"/>
      <rect className="il-paper-fill" x="115" y="41" width="6" height="6"/>
      <rect className="il-paper-fill" x="125" y="41" width="6" height="6"/>
      <path className="il-ink" d="M130 34V12"/>
      <polygon className="il-blue" points="130,12 146,16 130,20"/>
      <line className="il-ink" x1="8" y1="104" x2="152" y2="104"/>
    </>
  ),
  // AI 뜯어보기: 뚜껑을 연 칩과 돋보기
  concepts: (
    <>
      <path className="il-stroke-orange" d="M20 24h8M24 20v8"/>
      <path className="il-stroke-blue" d="M142 30h8M146 26v8"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-blue" x="34" y="50" width="58" height="48"/>
      </g>
      <rect className="il-blue" x="34" y="50" width="58" height="48"/>
      <path className="il-ink" d="M44 50v-7M56 50v-7M68 50v-7M80 50v-7M44 98v6M56 98v6M68 98v6M80 98v6M34 62h-7M34 74h-7M34 86h-7M92 62h7M92 74h7M92 86h7"/>
      <rect className="il-paper" x="50" y="62" width="26" height="24"/>
      <path className="il-thin" d="M58.7 62v24M67.3 62v24M50 70h26M50 78h26"/>
      <g className="il-shadow" transform="translate(5 5)">
        <polygon className="il-soft" points="54,30 104,16 108,32 58,46"/>
      </g>
      <polygon className="il-soft" points="54,30 104,16 108,32 58,46"/>
      <g className="il-shadow" transform="translate(5 5)">
        <circle className="il-paper" cx="112" cy="76" r="17"/>
      </g>
      <circle className="il-paper" cx="112" cy="76" r="17"/>
      <path className="il-thin" d="M104 76h16M112 68v16"/>
      <path className="il-ink il-thick" d="M124 88l14 14"/>
    </>
  ),
  // 아티클: 겹친 신문 지면
  articles: (
    <>
      <path className="il-stroke-blue" d="M136 24h8M140 20v8"/>
      <path className="il-stroke-orange" d="M16 92h8M20 88v8"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-soft" x="46" y="14" width="86" height="80"/>
      </g>
      <rect className="il-soft" x="46" y="14" width="86" height="80"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-paper" x="28" y="24" width="88" height="80"/>
      </g>
      <rect className="il-paper" x="28" y="24" width="88" height="80"/>
      <rect className="il-solid" x="36" y="32" width="72" height="9"/>
      <rect className="il-blue" x="36" y="49" width="32" height="26"/>
      <polyline className="il-stroke-paper" points="36,75 46,64 54,70 68,58"/>
      <path className="il-thin" d="M75 51h33M75 58h33M75 65h33M75 72h22M36 84h72M36 91h72M36 98h48"/>
    </>
  ),
  // TIL: 줄 노트와 연필
  til: (
    <>
      <path className="il-stroke-orange" d="M136 22h8M140 18v8"/>
      <path className="il-stroke-blue" d="M16 24h8M20 20v8"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-paper" x="26" y="18" width="80" height="86"/>
      </g>
      <rect className="il-paper" x="26" y="18" width="80" height="86"/>
      <path className="il-rule" d="M26 34h80M26 44h80M26 54h80M26 64h80M26 74h80M26 84h80M26 94h80"/>
      <path className="il-stroke-orange" d="M40 18v86"/>
      <path className="il-ink" d="M46 31h40M46 41h28M46 51h44M46 61h20"/>
      <g className="il-shadow" transform="translate(5 5)">
        <g transform="rotate(-45 116 72)">
          <rect className="il-amber" x="92" y="65" width="48" height="14"/>
          <polygon className="il-paper" points="92,65 78,72 92,79"/>
          <polygon className="il-solid" points="83,69.5 78,72 83,74.5"/>
          <rect className="il-orange" x="140" y="65" width="10" height="14"/>
        </g>
      </g>
      <g transform="rotate(-45 116 72)">
        <rect className="il-amber" x="92" y="65" width="48" height="14"/>
        <polygon className="il-paper" points="92,65 78,72 92,79"/>
        <polygon className="il-solid" points="83,69.5 78,72 83,74.5"/>
        <rect className="il-orange" x="140" y="65" width="10" height="14"/>
      </g>
    </>
  ),
  // 복습: 문제 카드와 되돌리기
  review: (
    <>
      <path className="il-stroke-blue" d="M18 26h8M22 22v8"/>
      <path className="il-stroke-orange" d="M138 22h8M142 18v8"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-soft" x="50" y="16" width="78" height="54"/>
      </g>
      <rect className="il-soft" x="50" y="16" width="78" height="54"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-paper" x="28" y="32" width="84" height="58"/>
      </g>
      <rect className="il-paper" x="28" y="32" width="84" height="58"/>
      <text className="il-glyph" fontSize="34" x="42" y="72">?</text>
      <path className="il-thin" d="M66 52h34M66 60h34M66 68h22"/>
      <g className="il-shadow" transform="translate(5 5)">
        <circle className="il-blue" cx="116" cy="86" r="18"/>
      </g>
      <circle className="il-blue" cx="116" cy="86" r="18"/>
      <path className="il-stroke-paper" d="M107 86a9 9 0 1 1 3 6.7"/>
      <polyline className="il-stroke-paper" points="105,92 110,93 111,88"/>
    </>
  ),
  // 용어집: 탭이 달린 색인 카드 상자
  glossary: (
    <>
      <path className="il-stroke-orange" d="M18 24h8M22 20v8"/>
      <path className="il-stroke-blue" d="M138 30h8M142 26v8"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-soft" x="40" y="34" width="80" height="40"/>
      </g>
      <rect className="il-soft" x="40" y="34" width="80" height="40"/>
      <rect className="il-amber" x="86" y="25" width="20" height="10"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-paper" x="32" y="42" width="80" height="34"/>
      </g>
      <rect className="il-paper" x="32" y="42" width="80" height="34"/>
      <rect className="il-blue" x="42" y="33" width="20" height="10"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-orange" x="22" y="62" width="110" height="42"/>
      </g>
      <rect className="il-orange" x="22" y="62" width="110" height="42"/>
      <rect className="il-paper" x="62" y="74" width="30" height="16"/>
      <text className="il-glyph il-glyph-ink" fontSize="10" x="77" y="86.5" textAnchor="middle">Aa</text>
    </>
  ),
  // 노트: 스프링 노트와 인덱스 탭
  notes: (
    <>
      <path className="il-stroke-orange" d="M136 24h8M140 20v8"/>
      <path className="il-stroke-blue" d="M16 96h8M20 92v8"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-paper" x="38" y="16" width="78" height="88"/>
      </g>
      <rect className="il-paper" x="38" y="16" width="78" height="88"/>
      <rect className="il-blue" x="116" y="26" width="12" height="18"/>
      <rect className="il-amber" x="116" y="50" width="12" height="18"/>
      <path className="il-rule" d="M50 34h58M50 44h58M50 54h58M50 64h58M50 74h58M50 84h58M50 94h58"/>
      <path className="il-stroke-orange" d="M58 16v88"/>
      <path className="il-ink" d="M64 31h34M64 41h24M64 51h38"/>
      <rect className="il-paper" x="30" y="24" width="14" height="5"/>
      <rect className="il-paper" x="30" y="38" width="14" height="5"/>
      <rect className="il-paper" x="30" y="52" width="14" height="5"/>
      <rect className="il-paper" x="30" y="66" width="14" height="5"/>
      <rect className="il-paper" x="30" y="80" width="14" height="5"/>
      <rect className="il-paper" x="30" y="94" width="14" height="5"/>
    </>
  ),
  // 북마크: 책과 두 개의 리본
  bookmarks: (
    <>
      <path className="il-stroke-blue" d="M20 26h8M24 22v8"/>
      <path className="il-stroke-orange" d="M136 30h8M140 26v8"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-paper" x="46" y="86" width="66" height="8"/>
        <rect className="il-blue" x="40" y="12" width="72" height="76"/>
      </g>
      <rect className="il-paper" x="46" y="86" width="66" height="8"/>
      <rect className="il-blue" x="40" y="12" width="72" height="76"/>
      <rect className="il-solid" x="40" y="12" width="9" height="82"/>
      <rect className="il-paper" x="60" y="28" width="38" height="14"/>
      <path className="il-thin" d="M60 54h38"/>
      <g className="il-shadow" transform="translate(5 5)">
        <polygon className="il-orange" points="66,94 76,94 76,114 71,108 66,114"/>
      </g>
      <polygon className="il-orange" points="66,94 76,94 76,114 71,108 66,114"/>
      <g className="il-shadow" transform="translate(5 5)">
        <polygon className="il-amber" points="84,94 94,94 94,108 89,102 84,108"/>
      </g>
      <polygon className="il-amber" points="84,94 94,94 94,108 89,102 84,108"/>
    </>
  ),
  // 질문함: 질문 카드가 담기는 트레이
  inbox: (
    <>
      <path className="il-stroke-blue" d="M18 30h8M22 26v8"/>
      <g className="il-shadow" transform="translate(5 5)">
        <g transform="rotate(-8 82 44)">
          <rect className="il-paper" x="58" y="18" width="48" height="50"/>
          <text className="il-glyph" fontSize="34" x="82" y="56" textAnchor="middle">?</text>
        </g>
      </g>
      <g transform="rotate(-8 82 44)">
        <rect className="il-paper" x="58" y="18" width="48" height="50"/>
        <text className="il-glyph" fontSize="34" x="82" y="56" textAnchor="middle">?</text>
      </g>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-blue" x="112" y="12" width="30" height="20"/>
        <polygon className="il-blue" points="118,32 118,40 126,32"/>
      </g>
      <rect className="il-blue" x="112" y="12" width="30" height="20"/>
      <polygon className="il-blue" points="118,32 118,40 126,32"/>
      <rect className="il-paper-fill" x="118" y="20" width="4" height="4"/>
      <rect className="il-paper-fill" x="125" y="20" width="4" height="4"/>
      <rect className="il-paper-fill" x="132" y="20" width="4" height="4"/>
      <g className="il-shadow" transform="translate(5 5)">
        <polygon className="il-orange" points="22,70 138,70 128,104 32,104"/>
      </g>
      <polygon className="il-orange" points="22,70 138,70 128,104 32,104"/>
      <path className="il-ink" d="M22 70h116"/>
      <rect className="il-paper" x="62" y="80" width="36" height="10"/>
    </>
  ),
  // PDF 내보내기: 종이가 나오는 프린터
  print: (
    <>
      <path className="il-stroke-blue" d="M18 24h8M22 20v8"/>
      <path className="il-stroke-orange" d="M138 26h8M142 22v8"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-paper" x="50" y="12" width="60" height="36"/>
      </g>
      <rect className="il-paper" x="50" y="12" width="60" height="36"/>
      <path className="il-thin" d="M58 22h44M58 30h44M58 38h28"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-soft" x="22" y="44" width="116" height="40"/>
      </g>
      <rect className="il-soft" x="22" y="44" width="116" height="40"/>
      <path className="il-ink" d="M36 56h88"/>
      <rect className="il-blue" x="114" y="64" width="10" height="10"/>
      <rect className="il-orange" x="100" y="64" width="10" height="10"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-paper" x="44" y="74" width="72" height="30"/>
      </g>
      <rect className="il-paper" x="44" y="74" width="72" height="30"/>
      <path className="il-thin" d="M52 84h56M52 92h40"/>
    </>
  ),
  // 404: 방향을 묻는 표지판
  notfound: (
    <>
      <path className="il-stroke-blue" d="M22 24h8M26 20v8"/>
      <path className="il-stroke-orange" d="M136 24h8M140 20v8"/>
      <path className="il-dash" d="M14 98h44M102 98h44"/>
      <g className="il-shadow" transform="translate(5 5)">
        <rect className="il-solid" x="76" y="24" width="8" height="80"/>
      </g>
      <rect className="il-solid" x="76" y="24" width="8" height="80"/>
      <g className="il-shadow" transform="translate(5 5)">
        <polygon className="il-orange" points="84,28 128,28 140,40 128,52 84,52"/>
      </g>
      <polygon className="il-orange" points="84,28 128,28 140,40 128,52 84,52"/>
      <g className="il-shadow" transform="translate(5 5)">
        <polygon className="il-blue" points="76,58 34,58 22,70 34,82 76,82"/>
      </g>
      <polygon className="il-blue" points="76,58 34,58 22,70 34,82 76,82"/>
      <text className="il-glyph il-glyph-paper" fontSize="16" x="108" y="47" textAnchor="middle">?</text>
      <text className="il-glyph il-glyph-paper" fontSize="16" x="52" y="77" textAnchor="middle">?</text>
      <line className="il-ink" x1="8" y1="104" x2="152" y2="104"/>
    </>
  ),
} satisfies Record<string, ReactNode>;

export type SpotName = keyof typeof SPOT_ART;

export function SpotIllustration({
  name,
  className = "",
}: {
  name: SpotName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={`illo ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {SPOT_ART[name]}
    </svg>
  );
}
