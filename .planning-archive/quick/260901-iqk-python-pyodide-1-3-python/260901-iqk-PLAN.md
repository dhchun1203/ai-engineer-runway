---
task_id: 260901-iqk
description: 브라우저 안에서 파이썬을 실행하는 파일럿 1편 — Pyodide를 실행 버튼을 누른 순간에만 CDN에서 불러오고(누르기 전 0바이트), 1-3 Python 변수·자료형 레슨의 실무 예제 한 블록에서 고쳐 실행까지 검증한다
mode: quick
created: 2026-09-01
phase: quick-260901-iqk
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: false
requirements: [PILOT-RUN-01]
files_modified:
  - src/lib/pyodide-runtime.ts
  - src/components/run-python.tsx
  - src/components/mdx-content.tsx
  - src/content/lessons/step-1/1-3-python-variables-and-types.mdx
  - src/app/globals.css
  - scripts/e2e-code-run.mjs

estimate:
  tokens: 62000
  raw_tokens: 31000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "1-3 레슨의 실무 예제 코드 블록 아래에 '실행' 버튼이 보이고, 누르면 그 코드가 브라우저 안에서 실제로 돌아 출력이 화면에 나온다 — 회원 자료형 4줄, 프리미엄 할인율, 회원 3명 인사말까지."
    - "실행 버튼을 누르기 전에는 파이썬 런타임 바이트가 단 1바이트도 내려오지 않는다 — 레슨을 그냥 읽기만 하는 방문에서는 cdn.jsdelivr.net 요청이 0건이다."
    - "'고쳐 보기'를 누르면 같은 코드를 그 자리에서 편집할 수 있고, 고친 코드로 다시 실행하면 고친 결과가 나온다 — 레슨의 해보기 3개(등급 바꾸기·회원 추가·타입 에러 내보기)를 페이지를 떠나지 않고 할 수 있다."
    - "코드가 에러를 내면 빨간 실패가 아니라 파이썬이 낸 에러 메시지 원문(TypeError 등)이 출력 영역에 그대로 보인다 — 해보기 3번이 에러를 읽는 과제이기 때문이다."
    - "처음 실행은 오래 걸린다는 사실이 화면에 먼저 안내되고, 인터넷이 없거나 로드가 실패하면 무엇이 잘못됐는지 한국어로 알려준다."
    - "실행 버튼·고쳐 보기 버튼은 아이패드에서 손가락으로 정확히 눌린다 — 높이 44px 이상."
    - "실행 관련 UI는 종이에 찍히지 않는다 — /print와 PDF 저장에서 버튼·출력 영역이 사라진다."
    - "기존 자동 게이트가 전부 그대로 통과한다 — check-lesson-structure(6단 구조·펜스 언어·단락 길이), check-design-tokens(임의값·기본 팔레트 금지), check-brand, check-route-rendering(레슨은 여전히 완전 정적), e2e-perf-budget."
    - "새 npm 의존성이 0개다 — package.json이 바뀌지 않는다."
  artifacts:
    - src/lib/pyodide-runtime.ts
    - src/components/run-python.tsx
    - scripts/e2e-code-run.mjs
  key_links:
    - "mdx-content.tsx의 defaultComponents에 RunPython이 등록돼야 MDX 안의 <RunPython>이 렌더된다 — 빠지면 레슨 페이지 전체가 빌드/렌더 에러로 죽는다."
    - "코드 원문 추출은 DOM의 [data-line] textContent 이어붙이기다 — code-block.tsx가 이미 쓰는 방식. props.children 트리 순회로 바꾸면 Shiki가 만든 span 구조에 물려 깨진다."
    - "Pyodide는 script 태그 주입으로만 불러온다 — npm 패키지로 넣거나 정적 import를 쓰면 번들에 들어가 '0바이트' 계약이 즉시 깨진다."
---

<objective>
사용자가 8/27에 내린 "아이패드 브라우저 실습 제외" 결정을 9/1에 번복했다
(PROJECT.md Out of Scope 항목, STATE.md 다음에 할 일). 다만 그때 제외한 이유였던
"아이패드에 수 MB WASM"은 여전히 실재하는 문제다.

이 파일럿은 그 충돌을 **지연 로드**로 푼다: 레슨을 읽기만 하면 파이썬 런타임은
0바이트, 사용자가 "실행"을 누른 그 순간에만 CDN에서 내려온다. 그래서 완전 정적
레슨 페이지의 성능 특성(TTFB 33~40ms, 첫 방문 전송량)이 그대로 유지된다.

범위는 레슨 **1편, 코드 블록 1개**다. 1-3 Python 변수·자료형의 "4. 실무 예제"
블록을 고른 이유: 그 레슨의 해보기 3개가 전부 "값을 바꿔가며 실행해보세요",
"회원을 추가해 다시 실행해보세요", "에러가 나는 코드를 추가해 실행해보세요"라서,
브라우저 실행이 붙는 순간 세 과제 모두 페이지를 떠나지 않고 완결된다. 실행 환경이
가장 크게 남는 자리다.

이후 Python 레슨 전체 → SQL(PGlite)로 확장할 예정이므로 컴포넌트는 확장 가능하게
설계하되(런타임 로더와 UI 껍데기를 분리), 이번에 손대는 레슨은 1편뿐이다.

Purpose: 아이패드에서 읽다가 궁금한 걸 그 자리에서 돌려볼 수 있는지, 그리고 그것이
성능 예산을 깨지 않고 가능한지를 1편으로 먼저 증명한다.
Output: 지연 로드 런타임, RunPython 컴포넌트, 게이트 스크립트 1종, 레슨 1편 수정.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md

@src/components/code-block.tsx
@src/components/mdx-content.tsx
@src/components/review-done-button.tsx
@src/content/lessons/step-1/1-3-python-variables-and-types.mdx
@scripts/e2e-mobile-readability.mjs
</context>

<preflight_findings>
착수 전에 이미 확인한 사실들이다. 다시 조사하지 말고 이 전제 위에서 시작한다.

1. **MDX 컴포넌트 주입 경로**: `src/components/mdx-content.tsx`의 `defaultComponents`
   (`Record<string, ComponentType>`)가 `pre → CodeBlock`, `table → TableWrapper`를
   주입한다. 대문자 컴포넌트(`RunPython`)도 같은 객체에 넣으면 MDX가 여기서 찾는다.
   `/lesson`과 `/print` 두 렌더 지점이 이 파일 하나를 공유하므로 등록은 한 곳이면 된다.

2. **코드 원문 추출 방식은 이미 정해져 있다**: `code-block.tsx`가
   `pre.querySelectorAll('[data-line]')`의 textContent를 `\n`으로 잇는다. Shiki가
   줄마다 `[data-line]`을 붙이기 때문이다. RunPython도 같은 방식을 쓴다.

3. **check-lesson-structure L6은 접두사 매칭이다** (`lang.startsWith(allowed)`).
   펜스 언어는 `python` 그대로 두면 통과한다. 게이트 스크립트를 고칠 필요가 없다.

4. **check-lesson-structure L7(단락 200자)은 `<`로 시작하는 줄을 단락에서 제외한다**.
   `<RunPython>` / `</RunPython>` 줄은 단락 계산에 잡히지 않는다. 다만 새로 쓰는
   설명 문장은 200자 상한을 지켜야 한다.

5. **check-design-tokens 규칙 (c)가 상시 활성**(`ENFORCE_ARBITRARY_VALUES = true`)이다.
   `src/**/*.tsx`에서 임의값 대괄호(`h-[44px]`, `text-[13px]` 등)와 Tailwind 기본
   팔레트 색 유틸리티(`bg-slate-100` 등)는 **위반**이다. 기존 컴포넌트 클래스
   (`.btn`, `.btn-action`, `.panel`, `.tap-feedback`)와 시맨틱 텍스트 클래스
   (`text-label`, `text-body`)만 쓴다. 규칙 (b)는 globals.css의 font-size/font-weight
   **절대 단위 리터럴**만 검사하므로 `var(--text-label)` 형태는 대상이 아니다.

6. **e2e 게이트 4종(typography·mobile-overflow·mobile-readability·perf-budget)의
   측정 라우트는 전부 `/lesson/1-1-course-orientation`**이다. 파일럿 대상인 1-3은
   어느 e2e 게이트의 판정 대상도 아니다 — 즉 이 파일럿이 기존 성능 숫자를 흔들
   구조적 경로가 없다. 반대로 정적 게이트(check-lesson-structure, check-design-tokens,
   check-brand, check-manifest)는 전 레슨·전 tsx를 훑으므로 이쪽은 반드시 돌린다.

7. **인쇄에서 숨기는 훅은 `[data-print-hide]`**다. globals.css의 `@media print`
   블록에 이미 선언돼 있고 "앞으로 추가될 화면 전용 크롬"을 위한 자리로 명시돼 있다.
   새 print 규칙을 만들지 말고 이 속성을 붙인다.

8. **e2e 포트 3210~3215는 모두 선점**돼 있다(progress 3210, today 3211, typography 3212,
   overflow 3213, perf/section-tape 3214, note/readability 3215). 새 게이트는 3216을 쓴다.

9. **CSP 없음**: `next.config.ts`에 헤더 설정이 없고 미들웨어 CSP도 없다. 외부 스크립트
   주입을 막는 정책 장애물은 현재 없다.

10. **모노 서체 토큰은 `var(--font-mono)`**(JetBrains Mono, `src/lib/fonts.ts`)이고
    globals.css가 `code, pre`에 이미 적용한다. `<textarea>`는 이 규칙에 안 잡히므로
    편집기 클래스에서 명시적으로 지정해야 한다.
</preflight_findings>

<tasks>

<task type="tracer">
  <name>Task 1: 실행 버튼 하나가 CDN 로드부터 출력까지 끝까지 관통한다</name>
  <files>src/lib/pyodide-runtime.ts, src/components/run-python.tsx, src/components/mdx-content.tsx, src/content/lessons/step-1/1-3-python-variables-and-types.mdx, src/app/globals.css, scripts/e2e-code-run.mjs</files>
  <precondition>인터넷에 연결돼 있어야 한다 — Pyodide를 jsDelivr에서 내려받는 경로가 이 태스크의 검증 대상이다. `.env.local`에 SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY·UNLOCK_SECRET이 채워져 있어야 게이트 스크립트의 dev 서버가 뜬다.</precondition>
  <action>
브라우저 안 파이썬 실행을 한 경로만 뚫는다. 층을 나눠 쌓지 말고, 레슨의 실무 예제
코드 블록 **하나**가 클릭 → 로드 → 실행 → 출력까지 실제로 도는 것을 먼저 만든다.

**(a) 버전 확정 — 추측 금지.** `npm view pyodide version`으로 현재 배포 버전을 확인하고,
`https://cdn.jsdelivr.net/pyodide/v<확인한버전>/full/pyodide.js`가 200을 주는지
직접 확인한 뒤 그 문자열을 `src/lib/pyodide-runtime.ts`의 상수 하나에 고정한다.
URL에 `latest` 같은 이동 표적을 절대 쓰지 않는다 — CDN 쪽이 바뀌면 사이트가 조용히
고장 난다. 확인한 버전과 확인 방법을 SUMMARY에 적는다.

**(b) `src/lib/pyodide-runtime.ts` — 지연 로드 런타임.** 브라우저에서만 도는 모듈이다.
- `package.json`을 건드리지 않는다. pyodide를 npm 의존성으로 넣지 않는다. 정적
  `import` 문도 쓰지 않는다. 번들러가 보는 순간 "0바이트" 계약이 깨진다.
- 로드는 `document.createElement('script')`로 `pyodide.js`를 주입하는 방식만 쓴다.
  `crossOrigin`은 `anonymous`로 둔다. 스크립트가 `globalThis.loadPyodide`를 노출하면
  `indexURL`을 같은 CDN 디렉터리로 넘겨 인스턴스를 만든다.
- 모듈 스코프에 진행 중 Promise를 하나 캐시해 두어, 두 번째 클릭이나 두 번째 블록이
  런타임을 다시 내려받지 않게 한다. 실패한 Promise는 캐시에서 비워 재시도가 가능하게
  한다(한 번 실패하면 영원히 못 쓰는 상태를 만들지 않는다).
- 실행 API는 `{ code }`를 받아 `{ stdout, error }`를 돌려주는 함수 하나로 좁힌다.
  표준 출력·표준 에러는 Pyodide의 stdout/stderr 후킹 API로 줄 단위 수집한다. 어떤
  API 이름과 시그니처가 그 버전에서 맞는지는 Context7(`/pyodide/pyodide`) 또는
  고정한 버전의 공식 문서로 확인하고 쓴다 — 기억으로 쓰지 않는다.
- 블록마다 **새 전역 네임스페이스**에서 실행한다. 같은 인터프리터를 재사용하되
  전역은 공유하지 않는다 — 앞 블록에서 만든 변수가 뒤 블록에 남아 있으면 "다시
  실행하면 결과가 달라지는" 학습에 최악인 동작이 된다.
- 파이썬 예외는 삼키지 않고 메시지 원문을 `error`로 돌려준다. 레슨 해보기 3번이
  `TypeError` 원문을 읽는 과제다.

**(c) `src/components/run-python.tsx` — 'use client' 컴포넌트.** children으로 서버가
이미 렌더한 하이라이팅된 코드 블록을 받고, 그 아래에 실행 컨트롤과 출력 영역을 붙인다.
- 코드 원문은 래퍼 ref에서 `[data-line]` textContent를 `\n`으로 이어 뽑는다
  (`code-block.tsx`와 같은 방식, 같은 폴백). props.children 트리를 순회하지 않는다.
- 상태: 대기 / 준비 중 / 실행 중 / 완료 / 실패. 한국어 문구로 보여준다. 첫 실행은
  런타임을 내려받느라 오래 걸린다는 사실을 **누르기 전에** 안내한다(버튼 옆 보조
  문구), 준비 중에는 진행 중임을 알린다.
- 실패 문구는 원인을 구분한다: 런타임을 못 불러온 경우(인터넷/CDN)와 코드가 에러를
  낸 경우(파이썬 메시지)를 다른 문구로 낸다. 전자는 "다시 시도" 가능해야 한다.
- 출력 영역은 실행 전에는 없다가 실행 후 나타난다. 출력이 비어 있으면(print 없는
  코드) 그 사실을 문구로 알린다 — 빈 상자를 남기지 않는다.
- `role="status"` / `aria-live="polite"`로 상태 전환을 보조기술에도 알린다
  (`code-block.tsx`의 sr-only status 패턴을 따른다).
- 루트 요소에 `data-run-python`, 실행 버튼에 `data-run`, 출력 영역에 `data-run-output`을
  붙인다 — 게이트가 잡을 손잡이다. 루트에 `data-print-hide`가 아니라, **컨트롤·출력을
  감싸는 화면 전용 영역에** `data-print-hide`를 붙인다(코드 블록 자체는 인쇄돼야 한다).
- 스타일은 기존 어휘만 쓴다: 실행 버튼은 `.btn-action`(globals.css가 "실행용 주황
  버튼"으로 정의한 그 클래스) + `.tap-feedback`, 출력 영역은 `.panel`. 임의값 대괄호와
  Tailwind 기본 팔레트 색은 금지(preflight 5).

**(d) `src/app/globals.css`** — 출력 영역용 컴포넌트 클래스 하나를 `@layer components`
안에 추가한다. 모노 서체(`var(--font-mono)`), 줄바꿈 보존, 가로 넘침 시 스크롤,
글자 크기는 `var(--text-label)` 같은 토큰 참조로 준다(절대 단위 리터럴 금지).
새 색을 만들지 않고 기존 토큰만 조합한다.

**(e) `src/components/mdx-content.tsx`** — `defaultComponents`에 `RunPython`을 등록한다.

**(f) 레슨 1편 배선.** `1-3-python-variables-and-types.mdx`의 "4. 실무 예제" 아래
`python` 펜스 블록(회원 정보 예제) **하나만** `<RunPython>` … `</RunPython>`으로 감싼다.
여는 태그·닫는 태그는 각각 자기 줄에 두고 앞뒤로 빈 줄을 넣는다 — MDX가 JSX 안의
마크다운(코드 펜스)을 파싱하려면 빈 줄 분리가 필요하다. 같은 레슨의 나머지 펜스
(개념 설명의 2줄 예시, powershell 실행 명령, 6단의 정리 코드)는 건드리지 않는다.
바로 아래 "**실행 방법:**" 단락은 지우지 않는다 — 로컬 실행 환경 구성은 여전히
가르쳐야 한다. 대신 그 앞에 브라우저에서 바로 눌러 볼 수 있다는 안내 한 문장을
추가하되 200자를 넘기지 않는다.

**(g) `scripts/e2e-code-run.mjs` — 이 태스크의 검증 수단.** 저장소의 게이트 관례를
그대로 복제한다(`e2e-mobile-readability.mjs`의 골격: 환경 변수 선검증, FatalError,
waitForServerReady, killServerTree, `next dev` spawn, 위반 누적 후 일괄 보고,
0이 아닌 종료 코드). 포트는 3216. 공유 모듈로 빼지 않는다 — 이 저장소는 "재사용
안 함, 복제" 원칙이다. 이번 태스크에서는 판정 2건만 넣는다:
- **A1 0바이트 계약**: `/lesson/1-3-python-variables-and-types`를 networkidle까지
  열었을 때 `cdn.jsdelivr.net` 호스트로 나간 응답이 0건.
- **A2 실행 계약**: 실행 버튼 클릭 후 출력 영역에 예제의 결정적 출력이 나타난다 —
  자료형 줄, 프리미엄 할인율 줄, 회원 3명 인사말 줄. 첫 로드가 느리므로 이 대기만
  넉넉한 타임아웃(2분 이상)을 준다.
어떤 출력에도 쿠키 값·시크릿을 찍지 않는다.
  </action>
  <verify>
    <automated>node --env-file=.env.local scripts/e2e-code-run.mjs</automated>
    <automated>npm run build &amp;&amp; node scripts/check-lesson-structure.mjs &amp;&amp; node scripts/check-design-tokens.mjs &amp;&amp; node scripts/check-brand.mjs &amp;&amp; node scripts/check-route-rendering.mjs</automated>
    <automated>git diff --stat -- package.json package-lock.json</automated>
  </verify>
  <done>e2e-code-run 판정 2건 전부 통과. 빌드 성공, 정적 게이트 4종 통과(레슨 라우트는 여전히 완전 정적). package.json·package-lock.json diff가 비어 있다.</done>
  <reversibility rating="reversible">컴포넌트·레슨 래핑 모두 되돌리면 원상복구된다. 외부 서비스 계정도, 스키마 변경도 없다.</reversibility>
</task>

<task type="auto">
  <name>Task 2: 고쳐서 실행 + 아이패드·인쇄 마감, 게이트 확장</name>
  <files>src/components/run-python.tsx, src/app/globals.css, scripts/e2e-code-run.mjs</files>
  <action>
Task 1이 뚫은 경로 위에 이 레슨이 실제로 요구하는 기능을 얹는다. 레슨의 해보기 3개가
전부 "코드를 고쳐서 다시 실행"을 요구하므로 편집 없이는 파일럿이 목적을 달성하지 못한다.

**(a) 편집 모드.** "고쳐 보기" 버튼을 추가한다. 누르면 DOM에서 뽑은 코드 원문을 seed로
`<textarea>`를 열고, 하이라이팅된 원본 블록은 감춘다(언마운트가 아니라 감추기 — 되돌릴
때 다시 뽑을 수 있어야 한다). "원래대로" 버튼으로 편집을 버리고 원본으로 복귀한다.
편집 중이면 실행은 textarea 내용으로 돈다.
- 아이패드 소프트 키보드 대비: `spellCheck={false}`, `autoCapitalize="off"`,
  `autoCorrect="off"`, `autoComplete="off"`를 준다. 코드에 맞춤법 물결선이 깔리고
  첫 글자가 대문자로 바뀌는 것은 실제로 겪은 문제다(quick 260901-fast, 메모장).
- textarea는 세로로 자동 확장하거나 충분한 기본 행수를 준다 — 예제가 30줄이 넘으므로
  4~5줄짜리 창에 가두면 아이패드에서 쓸 수 없다.
- 편집기 스타일도 globals.css 컴포넌트 클래스로 뺀다: 모노 서체, `.panel` 계열 면,
  `tab-size`, 가로 스크롤. 임의값 대괄호·기본 팔레트 색 금지는 그대로 적용된다.

**(b) 터치·인쇄 마감.** 실행/고쳐 보기/원래대로 버튼이 전부 높이 44px 이상인지
확인한다(`.btn`/`.btn-action`이 `min-height: 2.75rem`을 이미 준다 — 새로 만든 버튼이
그 클래스를 안 쓰고 있지 않은지 확인하는 것이 요점이다). 컨트롤·출력·편집기를 감싸는
화면 전용 영역에 `data-print-hide`가 붙어 있어 `/print/*`와 PDF 저장에서 사라지는지
확인한다.

**(c) 게이트 확장.** `scripts/e2e-code-run.mjs`에 판정 3건을 더한다.
- **A3 터치 타깃**: 768×1024에서 `[data-run-python]` 안의 button 요소 전부
  `getBoundingClientRect().height >= 44`.
- **A4 편집 실행**: "고쳐 보기" → textarea 내용을 판별 가능한 한 줄짜리 코드로 교체 →
  실행 → 그 출력이 출력 영역에 나타난다. 런타임은 A2에서 이미 캐시돼 있으므로 빠르다.
- **A5 에러 표시**: 파이썬 예외를 내는 코드를 넣고 실행했을 때 출력 영역에 파이썬이
  낸 예외 이름이 그대로 보인다(레슨 해보기 3번이 요구하는 동작).
게이트 헤더 주석에 실행법(`node --env-file=.env.local scripts/e2e-code-run.mjs`),
포트 3216을 고른 이유(3210~3215 선점), 판정 5건의 의도를 적는다.

**(d) 회귀 확인.** 성능 게이트가 이 변경으로 흔들리지 않았음을 숫자로 남긴다.
`e2e-perf-budget`의 측정 라우트는 1-1이라 구조적으로 영향이 없지만(preflight 6),
클라이언트 번들에 컴포넌트가 새로 들어갔으므로 실제로 확인해 SUMMARY에 전후 숫자를
적는다.
  </action>
  <verify>
    <automated>node --env-file=.env.local scripts/e2e-code-run.mjs</automated>
    <automated>node --env-file=.env.local scripts/e2e-perf-budget.mjs</automated>
    <automated>node scripts/check-design-tokens.mjs &amp;&amp; node scripts/check-lesson-structure.mjs &amp;&amp; npm run lint</automated>
  </verify>
  <done>e2e-code-run 판정 5건 전부 통과. e2e-perf-budget 통과하고 첫 방문 전송 바이트·TTFB 숫자가 SUMMARY에 기록됨. design-tokens·lesson-structure·lint 전부 0건.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
1-3 Python 변수·자료형 레슨의 "4. 실무 예제" 코드 블록에 브라우저 안 파이썬 실행을
붙였다. 레슨을 읽기만 할 때는 파이썬 런타임이 전혀 내려오지 않고, "실행"을 누른
순간에만 내려받는다. "고쳐 보기"로 코드를 그 자리에서 수정해 다시 실행할 수 있다.
  </what-built>
  <how-to-verify>
아이패드 사파리 실기기로 확인해 주세요. WASM 메모리와 터치 키보드는 자동 게이트가
대신 판단할 수 없는 두 지점입니다.

1. 아이패드 사파리에서 https://ai-engineer-runway.vercel.app/lesson/1-3-python-variables-and-types 를 엽니다.
2. "4. 실무 예제"까지 스크롤합니다. 코드 블록 아래에 주황색 **실행** 버튼과
   "처음 한 번은 시간이 걸린다"는 안내 문구가 보이는지 봅니다.
3. **실행**을 누릅니다. 준비 중 문구가 뜨고, 잠시 뒤(첫 실행은 10초 이상 걸릴 수
   있습니다) 출력 영역에 결과가 나타나야 합니다 — 자료형 4줄, 회원 정보 문장,
   "프리미엄 회원 할인율: 20.0%", 그리고 김지현·이민준·박서연 인사말 3줄.
   → 여기서 사파리 탭이 죽거나 "이 웹페이지에 문제가 발생했습니다"가 뜨면
      **WASM 메모리 한계**입니다. 그 사실을 알려 주세요 — 파일럿의 핵심 판정입니다.
4. **고쳐 보기**를 누릅니다. 코드가 편집 가능한 상태로 바뀝니다.
   - `membership_status = "premium"`을 `"regular"`로 바꾸고 다시 **실행**합니다.
     "일반 회원입니다…" 메시지로 바뀌어야 합니다.
   - 편집할 때 소프트 키보드가 올라오면서 **빨간 맞춤법 물결선이 안 생기는지**,
     따옴표가 “ ” 같은 곡선 따옴표로 자동 변환되지 않는지 봅니다.
     → 곡선 따옴표로 바뀌면 파이썬이 에러를 냅니다. 그 경우 알려 주세요.
   - 편집 중 화면이 위아래로 튀거나 커서가 키보드에 가려지지 않는지 봅니다.
5. **원래대로**를 눌러 원본 코드로 돌아오는지 확인합니다.
6. 두 번째 실행부터는 기다림 없이 바로 도는지 봅니다(런타임이 캐시돼 있어야 합니다).
7. 세로 모드와 가로 모드 둘 다에서 3~5번을 확인합니다.
8. 페이지 상단의 **PDF로 저장**을 눌러 인쇄 미리보기를 엽니다. 코드는 그대로 있고
   실행 버튼·출력 영역은 **안 보여야** 합니다.
9. 마지막으로 이 레슨을 새 탭에서 다시 열고 **실행을 누르지 않은 채** 잠깐 읽어
   봅니다. 평소와 같은 속도로 열리는지(느려지지 않았는지) 체감으로 봅니다.

확장 판단을 위해 함께 알려 주세요: 실제로 써 보니 나머지 Python 레슨에도 붙일
가치가 있는지, 아니면 이 레슨 하나로 충분한지.
  </how-to-verify>
  <resume-signal>"승인" 또는 발견한 문제를 알려 주세요</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| 브라우저 → jsDelivr CDN | 서드파티 오리진의 스크립트·WASM을 사용자의 브라우저가 실행한다 |
| 사용자 입력 → Pyodide 인터프리터 | 사용자가 편집한 코드가 WASM 샌드박스 안에서 실행된다 |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-IQK-01 | Tampering | pyodide-runtime.ts 스크립트 주입 | medium | mitigate | CDN URL에 **고정 버전**을 박는다(`latest` 금지). jsDelivr의 버전 경로는 불변이므로 배포 후 내용이 바뀌지 않는다. 서브리소스(wasm·stdlib)까지 SRI를 걸 수 없다는 한계는 T-IQK-02로 분리해 수용한다 |
| T-IQK-02 | Tampering | jsDelivr 자체 침해 | low | accept | 1인용 개인 학습 사이트이고 저장된 자격증명이 브라우저에 없다(진도 쿠키는 HttpOnly 서버 경로). CDN 전면 침해는 이 프로젝트가 감당할 수 있는 수준의 위험이 아니며, 자체 호스팅(10MB+ 자산을 Vercel에)은 비용이 훨씬 크다 |
| T-IQK-03 | Elevation of Privilege | 사용자 편집 코드 실행 | low | accept | Pyodide는 WASM 샌드박스라 파일시스템·네트워크 접근이 기본 차단된다. 실행하는 코드의 작성자와 실행자가 동일인(1인 사이트)이다 |
| T-IQK-04 | Denial of Service | 무한 루프 코드 | low | accept | 사용자가 자기 탭을 멈추는 것이고, 탭을 닫으면 끝난다. 워커 격리·타임아웃은 파일럿 범위 밖 — 확장 단계에서 재검토한다 |
| T-IQK-05 | Information Disclosure | 게이트 스크립트 로그 | medium | mitigate | e2e-code-run.mjs는 기존 게이트 관례대로 쿠키 값·시크릿을 어떤 출력에도 찍지 않는다 |

npm 패키지 설치가 0건이므로 패키지 정당성 게이트(T-*-SC)는 해당 없다 — 그것이 이
설계의 부수 효과다.
</threat_model>

<verification>
- `node --env-file=.env.local scripts/e2e-code-run.mjs` — 판정 5건(A1 0바이트, A2 실행, A3 44px, A4 편집 실행, A5 에러 표시)
- `npm run build` 성공, `node scripts/check-route-rendering.mjs` — `/lesson/1-3-*`가 여전히 완전 정적
- `node scripts/check-lesson-structure.mjs` — L1~L7 위반 0
- `node scripts/check-design-tokens.mjs` — 규칙 a/b/c 위반 0
- `node scripts/check-brand.mjs` — "KANT" 0건
- `node --env-file=.env.local scripts/e2e-perf-budget.mjs` — 판정 전부 통과, 숫자 기록
- `npm run lint` — 0 에러 0 경고
- `git diff --stat -- package.json package-lock.json` — 비어 있음
- 아이패드 사파리 실기기 UAT 승인 (Task 3)
</verification>

<success_criteria>
- 1-3 레슨의 실무 예제 블록을 아이패드 사파리에서 눌러 실행하면 출력이 나온다
- 실행 전 방문에서 CDN 요청 0건 — 읽기만 하는 사용자의 성능이 그대로다
- 고쳐서 다시 실행이 되고, 레슨의 해보기 3개를 페이지 안에서 완결할 수 있다
- 새 npm 의존성 0개
- 기존 자동 게이트 전부 통과 + 새 게이트 1종 추가
- 확장(나머지 Python 레슨 → SQL/PGlite) 판단에 필요한 실기기 관찰(메모리·터치 키보드)이 기록됐다
</success_criteria>

<output>
Create `.planning/quick/260901-iqk-python-pyodide-1-3-python/260901-iqk-SUMMARY.md` when done
</output>
