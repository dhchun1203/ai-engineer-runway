---
task_id: 260831-mih
description: 레슨에 실제 그림을 들이는 파일럿 1편 — D-48(다이어그램 금지)을 뒤집고 1-3 Python 변수·자료형에 인라인 SVG 4점을 넣어 아이패드로 확인받는다
mode: quick
created: 2026-08-31
phase: quick-260831-mih
plan: 01
type: content
wave: 1
depends_on: []
autonomous: false
files_modified:
  - src/content/lessons/step-1/1-3-python-variables-and-types.mdx
  - src/app/globals.css
  - scripts/check-lesson-structure.mjs

must_haves:
  truths:
    - "1-3 레슨의 개념 설명에 그림 4점이 실제로 그려져 보인다 — 상자로서의 변수, 자료형 4종, 조건문 갈림길, 반복문 컨베이어벨트."
    - "그림은 사이트 디자인 문법을 따른다 — 각진 사각형, 하드 오프셋 그림자, 잉크 선. 새 색을 만들지 않는다."
    - "라이트·다크 두 테마에서 선과 글자가 배경과 충분히 구분된다 — 그림이 한쪽 테마에서 사라지지 않는다."
    - "클라이언트 JS가 0바이트 늘지 않는다 — mermaid 같은 렌더 라이브러리를 넣지 않는다(빌드 산출물이 정적 SVG)."
    - "아이패드 폭(768/1024)에서 그림이 가로로 넘치지 않는다 — 폭에 맞춰 줄고 문서 가로 스크롤이 생기지 않는다."
    - "PDF 인쇄(/print)에서도 그림이 나온다 — 화면 전용 크롬처럼 숨겨지지 않는다."
    - "스크린리더에 그림의 뜻이 전달된다 — 각 그림에 role=img와 제목/설명이 있다."
    - "기존 게이트가 계속 통과한다 — 6단 구조·용어 표·해보기 개수(check-lesson-structure), brand, design-tokens, 빌드."
---

<objective>
사용자 지적: "레슨들이 eli5 스킬로 작성된 것 맞나? 시각화를 적극 활용하는 스킬로 아는데?"

실측 결과 35편 전수에 mermaid 0, SVG 0, 이미지 0, ASCII 상자 그림 0이다.
있는 것은 인라인 화살표(→) 158개와 표뿐이다.

사고가 아니라 결정이었다. `04-CONTEXT.md`:
- D-47 — eli5는 **문체**로만 적용(짧은 문장, 비유 먼저, 용어 풀이)
- D-48 — "큰 그림은 마크다운만. Mermaid·SVG·이미지·ASCII 다이어그램 없음"
  근거는 PITFALLS Pitfall 4(콘텐츠 전에 컴포넌트 라이브러리 금지) + 5주 타임박스

이 파일럿은 D-48을 뒤집는다. eli5 스킬 원문이 말하는 "big pictures, few words"에서
빠져 있던 pictures를 넣는다.

**방식 선택 — 인라인 SVG.** 스파이크로 검증했다: Velite MDX가 인라인 SVG를
JSX로 그대로 컴파일한다(strokeWidth·textAnchor 속성 보존). 대안 대비 이점:
- mermaid 클라이언트 렌더 — 아이패드에 수백 KB JS를 더 얹는다. 이 사이트가
  코드 하이라이팅을 빌드 타임으로 미룬 이유(A4)와 정면으로 어긋난다
- rehype-mermaid 빌드 타임 렌더 — Vercel 빌드에 헤드리스 브라우저가 필요해
  배포가 부서지기 쉬워진다
- 인라인 SVG — 의존성 0, 클라이언트 JS 0, 정적 생성 그대로, 인쇄 그대로

파일럿이므로 1편만 쓴다. 승인 전에는 나머지 34편을 건드리지 않는다
(2026-08-25에 확정한 파일럿 규약과 같다).
</objective>

<tasks>
1. globals.css: `.prose [data-diagram]` 스타일 — 폭 100%·height auto로 넘침 방지,
   라이트/다크 두 벌 토큰(--diagram-accent, --diagram-soft), 인쇄 시 유지.
   새 색 없이 기존 step-1/surface-2/line 토큰만 참조한다.
2. 1-3 레슨에 인라인 SVG 4점 추가 — 변수=상자, 자료형 4종, 조건문=갈림길,
   반복문=컨베이어벨트. 각 그림은 그것이 대신하는 설명 문단 바로 옆에 둔다.
   글을 지우지 않는다(이중 부호화 — 글과 그림을 함께 준다).
3. 게이트: check-lesson-structure로 6단 구조가 깨지지 않았는지, design-tokens로
   리터럴 색이 없는지, 빌드·아이패드 폭 오버플로·다크·인쇄를 실측 확인.
   프로덕션 배포 후 아이패드 확인은 사용자 몫(human-verify).
</tasks>
