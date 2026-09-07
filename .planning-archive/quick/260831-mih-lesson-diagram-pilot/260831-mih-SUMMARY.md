---
phase: quick-260831-mih
plan: 01
status: complete
subsystem: content
tags: [content, eli5, diagram, svg, mdx, pilot, ipad]

requires:
  - phase: 04-step-1
    provides: "eli5 × 6단 집필 표준(D-47)과 레슨 구조 게이트(check-lesson-structure)"
provides:
  - "레슨 본문 그림 계약 — data-diagram 인라인 SVG + 테마 토큰 4종(ink/accent/on-accent/soft)"
  - "파일럿 1편(1-3 Python 변수·자료형) 그림 4점"
  - "D-48(다이어그램 금지) 철회 근거와 대안 검토 기록"
affects: [lesson-content, globals-css, project-key-decisions]

actuals:
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns:
    - "MDX의 인라인 SVG는 Velite가 JSX로 컴파일한다(strokeWidth·textAnchor 보존) — 다이어그램에 렌더 라이브러리가 필요하다는 전제가 틀렸다"
    - "그림은 자기 색을 정하지 않는다 — CSS 커스텀 프로퍼티 4종만 참조하게 하면 테마 전환·팔레트 교체가 그림 파일을 건드리지 않는다"
    - "강조색 위 글자색은 currentColor로 대신할 수 없다 — 팔레트에 라이트/다크 짝이 따로 있으면 전용 토큰이 필요하다"
---

## 지적

사용자: "레슨들 내용 eli5 스킬 적극 활용해서 작성된 것 맞아? 시각화 요소를 굉장히
적극적으로 활용해서 쉽게 설명하는 스킬로 알고 있는데?"

## 조사 — 지적이 맞았다

35편 전수 실측.

| 항목 | 결과 |
|---|---|
| mermaid | 0 |
| SVG·이미지 | 0 |
| ASCII 상자 그림(`┌`) | 0 |
| 인라인 화살표(`→`) | 158 |
| 표 | 레슨당 9~28행 |

사고가 아니라 결정이었다. `04-CONTEXT.md`가 eli5를 둘로 쪼개 한쪽만 채택했다.

- **D-47** — eli5를 **문체**로 적용(짧은 문장, 비유 먼저, 용어 괄호 풀이). 채택됨
- **D-48** — "큰 그림은 마크다운만. Mermaid·SVG·이미지·ASCII 다이어그램 없음."
  근거는 PITFALLS Pitfall 4(콘텐츠 전에 컴포넌트 라이브러리를 만들지 말 것) + 5주 타임박스

eli5 스킬 원문은 "HTML artifact with **big pictures** and few words"다. `/about`은 HTML이라
그림이 들어갔지만, 레슨은 MDX라 톤만 넘어왔다.

곁가지로 하나 더: 커밋 `3db52c2`(8/29) "과외 지침에 인라인 시각화 규칙 추가"는 레슨
본문이 아니라 **클로드에게 붙여넣는 과외 프롬프트**에 들어갔다. "그림을 그려라"는 지시가
사이트에 있긴 했지만 읽는 사람이 아니라 대화 상대를 향해 있었다.

## 방식 선택

| 후보 | 판단 |
|---|---|
| mermaid 클라이언트 렌더 | ✗ 아이패드에 수백 KB JS. 코드 하이라이팅을 빌드 타임으로 미룬 이 사이트의 원칙(A4)과 정면 충돌 |
| rehype-mermaid 빌드 타임 | ✗ Vercel 빌드에 헤드리스 브라우저가 필요 — 배포가 부서지기 쉬워진다 |
| **인라인 SVG** | ✓ 의존성 0, 클라이언트 JS 0, 정적 생성·인쇄 그대로 |

스파이크로 먼저 확인했다: Velite MDX가 인라인 SVG를 JSX로 그대로 컴파일한다
(`strokeWidth`·`textAnchor`가 보존됨). 컴포넌트 라이브러리를 만들지 않으므로
D-48의 원래 근거(PITFALLS 4)도 위반하지 않는다 — 금지의 이유가 사라진 것이다.

## 만든 것

**`globals.css`** — `.prose [data-diagram]` 계약. 그림은 색을 직접 정하지 않고 네 변수만
참조한다: `--diagram-ink`(= currentColor, 테마 전환 자동), `--diagram-accent`,
`--diagram-on-accent`, `--diagram-soft`/`--diagram-line`. 폭 100% + height auto로
아이패드 세로에서도 넘치지 않는다.

**1-3 레슨** — 그림 4점. 글을 지우지 않고 **옆에** 뒀다(이중 부호화 — 글과 그림을 함께 준다).

| 그림 | 내용 |
|---|---|
| 변수 = 이름표 붙은 상자 | `age` 이름표가 붙은 상자 안에 25, 아래에 `age = 25` |
| 자료형 4종 | 상자 넷에 25 / 175.5 / "지현" / True, 아래 int·float·str·bool |
| 조건문 = 갈림길 | 조건 두 개가 세로로 내려가며 참이면 오른쪽으로 빠지는 사다리, 마지막은 else |
| 반복문 = 컨베이어벨트 | 리스트 3항목이 벨트를 타고 "항목마다 같은 코드"를 지나 출력 3줄 |

## 검증

| 확인 | 결과 |
|---|---|
| 그림 개수 | 4/4 렌더 |
| 아이패드 세로(768px) | 문서 가로 오버플로 없음(scrollWidth = clientWidth = 753) |
| 다크 모드 | 선·글자 반전 확인, 강조 블록 위 글자 대비 유지 |
| 인쇄(PDF) | 4점 모두 display:block·visible, 544px로 출력 |
| 클라이언트 JS | 0바이트 증가(정적 SVG) |
| 게이트 | check-lesson-structure(35편 7검사)·design-tokens·brand·빌드 통과 |

## 남은 것 — 사용자 확인 대기

**이 파일럿은 승인 전까지 1편이다.** 나머지 34편은 한 줄도 건드리지 않았다
(2026-08-25에 정한 파일럿 규약 그대로).

아이패드에서 `/lesson/1-3-python-variables-and-types`를 열어 그림 넷을 보고,
확장할지 판단하면 된다. 확장한다면 편당 2~4점 × 34편이므로 병렬 집필로 한 번에 쓴다.
