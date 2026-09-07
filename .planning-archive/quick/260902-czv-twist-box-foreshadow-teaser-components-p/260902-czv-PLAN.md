---
phase: quick-260902-czv
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/twist-box.tsx
  - src/components/next-teaser.tsx
  - src/components/mdx-content.tsx
  - src/content/lessons/step-1/1-3-python-variables-and-types.mdx
  - src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx
autonomous: false
requirements:
  - R6-반전박스
  - R6-안테피스예고
estimate:
  tokens: 55000
  raw_tokens: 32000
  tasks: 3
  confidence: low
must_haves:
  truths:
    - "레슨 페이지에서 <TwistBox>가 항상 보이는 콜아웃(접기 아님)으로 렌더되어 경계 사례 + 해설을 담는다"
    - "<NextTeaser>가 레슨 끝 근처에 렌더되어 질문형 미니 문제(스포일러 없음)를 담는다"
    - "1-3(Python)·1-4(SQL) 두 파일럿 레슨이 velite build와 L1~L7 구조 게이트를 통과한다"
    - "라이트/다크·아이패드 폭에서 두 콜아웃이 깨짐 없이 표시되고 코드·표 자식이 정상 렌더된다"
    - "브랜드 금지어(교육기관명) 0건 + 디자인 토큰 게이트(규칙 c 포함) 통과"
  artifacts:
    - src/components/twist-box.tsx
    - src/components/next-teaser.tsx
    - src/components/mdx-content.tsx
    - src/content/lessons/step-1/1-3-python-variables-and-types.mdx
    - src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx
  key_links:
    - "mdx-content.tsx의 defaultComponents 매핑 키 ↔ MDX 안 <TwistBox>/<NextTeaser> 태그명 정확히 일치"
    - "컴포넌트 스타일 = .panel + 디자인 토큰 유틸리티(text-accent/border-accent/text-label/text-body)만 — 리터럴 색·임의값 대괄호·기본 팔레트 색 금지(check-design-tokens 규칙 a/c)"
    - "MDX JSX 자식의 마크다운은 여는/닫는 태그 주위 빈 줄 필수 — 없으면 리터럴 텍스트로 렌더된다"
---

<objective>
반전(轉) 박스와 안테피스 예고(mechanical foreshadowing) 두 콜아웃 컴포넌트를 신설하고, 대표 2편(1-3 Python·1-4 SQL)에 실제 콘텐츠를 저작해 컴포넌트·스타일·문구 톤·게이트 통과를 한 번에 확정한다.

Purpose: predict-prompt.tsx가 세운 MDX 콜아웃 패턴을 그대로 이어받아, 이후 전편 확장이 복붙만으로 가능한 기준(파일럿)을 만든다. 반전 박스는 "배운 규칙이 어긋나 보이는 경계 사례 1개 + 해설"로 전이를 높이고(변형 연습), 안테피스 예고는 다음 레슨을 "지금 도구로는 안 풀리는 질문"으로 예고해 preparation for future learning(Schwartz & Bransford)을 만든다.

Output: twist-box.tsx / next-teaser.tsx 컴포넌트 2종, mdx-content.tsx 매핑, 1-3·1-4 두 파일럿 레슨의 콘텐츠 저작.

범위 밖(명시): 나머지 전편 확장. 파일럿 승인 후 오케스트레이터가 병렬 배치로 별도 처리한다 — 이 플랜은 파일럿 2편까지만.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.claude/CLAUDE.md
@src/components/predict-prompt.tsx
@src/components/mdx-content.tsx
@src/content/lessons/step-1/1-3-python-variables-and-types.mdx
@src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx
@scripts/check-lesson-structure.mjs

설계 배경(플래너 확정 — 되묻지 말 것):
- 두 컴포넌트는 predict-prompt.tsx와 동형이다: 서버 컴포넌트('use client' 없음), lucide-react 아이콘, `.panel` + 디자인 토큰 유틸리티만으로 스타일링, data-* 마커 부착. **새 globals.css 규칙은 필요 없다.**
- predict-prompt는 props 없는 자기완결 컴포넌트지만, 반전 박스·예고는 **레슨별로 저작되는 children(MDX)**을 담는다 — 컴포넌트는 스타일·틀만 제공하고 내용은 저자가 쓴다.
- 반전 박스는 **접기(<details>)가 아니다** — 놀람이 핵심이라 숨기면 효과가 준다. 항상 보이는 콜아웃.
- 예고의 "질문형·스포일러 금지"는 **저작 규칙**이다(컴포넌트가 강제 못 함) — 저작 시 준수.
- 게이트: MDX 편집 후 velite 재빌드 필수. L1~L7 구조 게이트(check-lesson-structure.mjs), 디자인 토큰(check-design-tokens.mjs 규칙 a/c), 브랜드(check-brand.mjs), tsc, next build.
</context>

<tasks>

<task type="tracer">
  <name>Task 1: 두 컴포넌트 신설 + 매핑 등록 + 1-3 Python 파일럿 저작(끝단까지 관통)</name>
  <files>src/components/twist-box.tsx, src/components/next-teaser.tsx, src/components/mdx-content.tsx, src/content/lessons/step-1/1-3-python-variables-and-types.mdx</files>
  <action>
predict-prompt.tsx를 원본 골격으로 삼아 컴포넌트 2종을 만들고 매핑에 등록한 뒤, 1-3 레슨 한 편에 실제 콘텐츠를 저작해 컴포넌트 → 매핑 → MDX 저작 → velite 빌드 → 렌더까지 한 경로를 끝단까지 관통시킨다. 이 태스크가 통과하면 나머지 확장은 복붙이 된다.

(1) src/components/twist-box.tsx — 서버 컴포넌트('use client' 없음). `children: React.ReactNode`와 선택적 `title?: string`(기본값: "어라? 여기서만 규칙이 어긋나 보여요")를 받는 named export `TwistBox`. 최상단 요소에 `data-twist-box` 속성 + `className="panel flex flex-col gap-2 p-4"`. 헤더 행: lucide-react 아이콘(예: `TriangleAlert` — predict-prompt의 `Lightbulb` import 방식 그대로, 설치된 lucide-react에 named export가 실제 존재하는지 확인하고 없으면 존재하는 경고/놀람 계열 글리프로 대체) + `<p className="text-label font-bold">`에 title. 본문: children을 감싸는 컨테이너(자식 MDX의 문단·코드·표는 상위 .prose 타이포그래피가 스타일링하도록 그대로 렌더). 시선 강조는 디자인 토큰 유틸리티만 사용 — 아이콘은 `text-accent dark:text-accent-dark`, 필요 시 좌측 강조 바는 `border-l-4 border-accent dark:border-accent-dark`. **리터럴 색(hex/rgb)·임의값 대괄호(text-[...])·Tailwind 기본 팔레트 색(bg-amber-*, text-slate-* 등)·text-white/text-black 금지**(check-design-tokens 규칙 a/c).

(2) src/components/next-teaser.tsx — 동형. named export `NextTeaser`, `children` + 선택적 `title?: string`(기본값: "다음 레슨 예고"). `data-next-teaser` + `.panel` + 토큰 유틸리티. 아이콘은 다음/앞을 가리키는 계열(예: `ArrowRight` 또는 `Compass` — 존재 확인). predict-prompt와 같은 톤의 콜아웃.

(3) src/components/mdx-content.tsx — 상단에서 두 컴포넌트를 import하고, defaultComponents 객체에 `TwistBox: TwistBox as ComponentType`, `NextTeaser: NextTeaser as ComponentType` 두 항목을 추가(PredictPrompt 등록 줄과 동일한 형태). 매핑 키 문자열이 MDX 태그명과 정확히 일치해야 한다.

(4) src/content/lessons/step-1/1-3-python-variables-and-types.mdx — 콘텐츠 2곳 저작:
  - **반전 박스 1개**: "## 3. 개념 설명"의 자료형 설명 뒤(하위 `###` 소제목 구조는 건드리지 않는 위치)에 `<TwistBox>` 삽입. 경계 사례는 `==` 강제 변환/타입 경계 — 예: `True == 1`이 True이고 `1 == 1.0`이 True인데 `"1" == 1`은 False라는 "어라?" 사례를 짧은 python 코드펜스(주석에 예상 출력) + 한두 문단 해설로. children의 각 산문 문단은 **200자 이하**(L7). 코드펜스 언어는 `python`(L6 허용).
  - **안테피스 예고 1개**: "## 6. 핵심 정리 및 스스로 점검"의 마지막 `</details>` 뒤(파일 끝)에 `<NextTeaser>` 삽입. 커리큘럼 순서(getOrderedLessons / getAdjacentLessons 기준)로 1-3-python의 **실제 다음 레슨**을 확인하고, 그 레슨이 도입하는 도구로만 풀리는 "지금은 못 푸는 미니 문제"를 **질문형으로만**(정답·해법 언급 금지 — 스포일러 경고) 저작.

MDX 규칙(반드시 준수): `<TwistBox>`/`<NextTeaser>` 여는·닫는 태그 **주위에 빈 줄**을 두어야 자식 마크다운이 리터럴 텍스트로 새지 않는다(RunPython/RunSQL 블록과 동일). 자식 문단은 4칸 이상 들여쓰지 않는다(코드블록화 방지). 두 컴포넌트 **안에 `<details>` 접기·`##`/`###` 마크다운 헤딩을 넣지 않는다**(L1/L2/L3 카운트 교란·"접기 아님" 원칙 위반). 기존 "이 레슨의 단어" 표(L5 5~8행)와 6개 `## ` 헤딩·`### 해보기` 개수는 그대로 둔다.
  </action>
  <verify>
    <automated>npx velite build --clean && node scripts/check-lesson-structure.mjs && node scripts/check-design-tokens.mjs && node scripts/check-brand.mjs && npm run lint && npx tsc --noEmit && npx next build</automated>
  </verify>
  <done>twist-box.tsx·next-teaser.tsx가 존재하고 mdx-content.tsx에 두 매핑이 추가됨. 1-3 레슨에 TwistBox 1개(경계 사례+해설)와 NextTeaser 1개(질문형 예고)가 저작됨. velite 빌드·L1~L7 구조 게이트·디자인 토큰(규칙 a/c)·브랜드·tsc·next build가 전부 통과. 1-3 페이지에서 두 콜아웃이 렌더된다.</done>
</task>

<task type="auto">
  <name>Task 2: 1-4 SQL 파일럿 저작(확장 — 검증된 컴포넌트 재사용)</name>
  <files>src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx</files>
  <action>
Task 1에서 확정된 컴포넌트를 그대로 재사용해 1-4 SQL 레슨에 콘텐츠 2곳을 저작한다(컴포넌트·매핑·스타일 변경 없음).
  - **반전 박스 1개**: "## 3. 개념 설명" 내 적절한 위치(하위 `###` 소제목 구조 유지)에 `<TwistBox>` — 경계 사례는 SQL의 3값 논리 `NULL = NULL`이 참이 아니라 `NULL`(미확정)이 되어 `WHERE x = NULL`이 아무 행도 못 뽑고 `IS NULL`을 써야 한다는 "어라?" 사례를 짧은 sql 코드펜스(주석에 예상 결과) + 해설로. 각 산문 문단 200자 이하(L7), 코드펜스 언어 `sql`(L6 허용).
  - **안테피스 예고 1개**: "## 6." 마지막 `</details>` 뒤(파일 끝)에 `<NextTeaser>` — 1-4-sql의 **실제 다음 레슨**을 커리큘럼 순서로 확인하고, 그 도구로만 풀리는 질문형 미니 문제를 **정답·해법 언급 없이** 저작.

MDX 규칙은 Task 1과 동일(태그 주위 빈 줄, 컴포넌트 안 `<details>`·마크다운 헤딩 금지, 6개 `## `·`### 해보기` 개수·"이 레슨의 단어" 표 8행 그대로 유지 — 1-4는 이미 8행이므로 표에 행을 추가하지 않는다).

문구 톤은 Task 1의 파일럿과 일치시킨다 — 반전 박스는 놀람을 살리는 짧은 훅, 예고는 답을 감춘 질문 하나. 이 2편이 이후 전편 확장의 기준 톤이 된다.
  </action>
  <verify>
    <automated>npx velite build --clean && node scripts/check-lesson-structure.mjs && node scripts/check-brand.mjs && npx next build</automated>
  </verify>
  <done>1-4 레슨에 TwistBox 1개(NULL 비교 경계 사례+해설)와 NextTeaser 1개(질문형 예고)가 저작됨. velite 빌드·L1~L7 구조 게이트·브랜드·next build 통과. 컴포넌트/매핑/globals.css는 수정하지 않음.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>반전 박스(<TwistBox>)·안테피스 예고(<NextTeaser>) 두 콜아웃과, 1-3 Python·1-4 SQL 두 레슨의 파일럿 콘텐츠.</what-built>
  <how-to-verify>
아이패드 폭(브라우저 창을 iPad 크기, 예: 820px 안팎)에서 라이트·다크 모두 확인:

1. `npm run dev` 실행 후 `http://localhost:3000/lesson/1-3-python-variables-and-types` 열기.
   - "3. 개념 설명" 안에 반전 박스가 **항상 펼쳐진 상태**(클릭해서 펴는 접기가 아님)로 보이는지, 헤더에 아이콘 + "어라?" 류 제목이 있고 안의 python 코드가 하이라이트되어 보이는지.
   - 페이지 맨 끝에 "다음 레슨 예고" 박스가 있고, 내용이 **질문 하나**이며 **정답/해법이 노출되지 않는지**(스포일러 금지).
2. 같은 페이지에서 라이트/다크 토글 — 두 박스의 테두리·그림자·강조색(accent)이 양쪽 테마에서 깨지지 않는지, 코드블록이 아이패드 폭에서 가로로 넘칠 때 스크롤되는지.
3. `http://localhost:3000/lesson/1-4-sql-queries-and-joins` 에서 같은 항목 확인 — 반전 박스의 NULL 비교 사례가 이해되는지, 예고가 질문형인지.
4. 두 페이지 어디에도 교육기관명(브랜드 금지어)이 노출되지 않는지 훑어보기.

톤 확정 질문: 반전 박스의 "놀람"이 살아있는지, 예고가 "요약"이 아니라 "지금은 못 푸는 문제"로 읽히는지 — 이 2편이 이후 전편 확장의 기준이 됩니다.
  </how-to-verify>
  <resume-signal>두 레슨 모두 좋으면 "approved", 문구·스타일·배치 수정이 필요하면 구체적으로 알려주세요(예: "1-3 예고가 답을 흘림", "다크에서 accent 안 보임").</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (신규 없음) | 콘텐츠는 저장소 내 저자 작성 .mdx로, velite가 빌드 타임에 컴파일한다. 런타임 사용자 입력·외부 데이터·인증 경계를 새로 만들지 않는다. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-czv-01 | Tampering | MDX 저작 콘텐츠(교육기관명 노출) | low | mitigate | check-brand.mjs가 src/ 전체에서 브랜드 금지어 0건을 상시 검증 — 두 파일럿에 게이트 적용 |
| T-czv-02 | Information Disclosure | NextTeaser 콘텐츠(다음 레슨 스포일러) | low | accept | 저작 규칙(질문형·정답 금지) + human-verify 체크포인트에서 육안 확인. 컴포넌트가 강제할 수 없는 저작 품질 이슈 |

패키지 설치 없음(기존 lucide-react 재사용) — 패키지 정당성 게이트 불필요.
</threat_model>

<verification>
- `npx velite build --clean` — MDX 재컴파일 성공(새 태그가 컴파일된 코드에 반영)
- `node scripts/check-lesson-structure.mjs` — 두 파일럿 포함 L1~L7 전부 통과(6개 `## ` 헤딩·`### 해보기` 2~3개·`<details>` 짝·빈 줄·용어 표 5~8행·코드펜스 언어·문단 200자)
- `node scripts/check-design-tokens.mjs` — 규칙 a(리터럴 색)·c(임의값 대괄호/기본 팔레트 색) 위반 0건
- `node scripts/check-brand.mjs` — 브랜드 금지어·개인 이메일 0건
- `npm run lint` — eslint 통과
- `npx tsc --noEmit` — 타입 오류 0
- `npx next build` — velite 빌드 포함 프로덕션 빌드 성공
</verification>

<success_criteria>
- twist-box.tsx·next-teaser.tsx가 predict-prompt.tsx와 동형으로 존재하고 mdx-content.tsx에 매핑됨
- 1-3·1-4 두 레슨에 반전 박스 1개 + 예고 1개씩 저작되고 위 6개 게이트 전부 통과
- 반전 박스가 접기가 아닌 항상 보이는 콜아웃으로, 예고가 질문형(스포일러 없음)으로 렌더
- 라이트/다크·아이패드 폭에서 정상 표시(human-verify 승인)
- 새 globals.css 규칙 없이 디자인 토큰만으로 스타일링, 브랜드 금지어 0건
</success_criteria>

<output>
Create `.planning/quick/260902-czv-twist-box-foreshadow-teaser-components-p/260902-czv-SUMMARY.md` when done
</output>
