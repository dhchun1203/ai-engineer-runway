---
task_id: 260826-uig
description: 35개 레슨 `## 3. 개념 설명` 구간에 클로즈(빈칸 채우기) 필사를 적용하고, 기록을 Supabase에 저장해 기기 간 공유한다
mode: quick
created: 2026-08-26
phase: quick-260826-uig
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: false
requirements: [CONT-07, TRACK-05]
files_modified:
  - src/lib/remark-cloze-blanks.ts
  - src/lib/cloze-key.ts
  - src/components/cloze-blank.tsx
  - src/components/cloze-provider.tsx
  - src/components/mdx-content.tsx
  - src/lib/cloze-store.ts
  - src/app/lesson/[lessonId]/actions.ts
  - src/app/lesson/[lessonId]/page.tsx
  - src/app/globals.css
  - velite.config.ts
  - package.json
  - supabase/migrations/20260826090000_create_cloze.sql
  - scripts/e2e-cloze.mjs
  - scripts/check-supabase-cloze.mjs
  - .planning/REQUIREMENTS.md

user_setup: []
# 2026-08-26 정정: cloze_answer 테이블은 오케스트레이터가 Supabase 관리 API로 이미 생성했다
# (project ref wxqteqiuihrgtxmztauc, RLS 켜짐 / 정책 0건 — progress 테이블과 동일한 기본 차단).
# 따라서 사람이 SQL 에디터에 붙여넣는 단계는 없다. 저장소의 마이그레이션 파일은 기록용으로
# 남기되(재현 가능성·리뷰용), 실행은 이미 끝나 있다.

estimate:
  tokens: 130000
  raw_tokens: 65000
  tasks: 4
  confidence: low

must_haves:
  truths:
    - "35편 전부 빌드되고, 그중 32편 이상이 개념 설명 구간에 빈칸을 최소 1개 렌더한다."
    - "빈칸이 0개인 레슨도 개념 설명 문단이 평문으로 정상 렌더되고 빌드가 깨지지 않는다."
    - "정답을 입력하고 포커스를 벗어나야 판정이 일어난다 — 타이핑 중에는 판정도 피드백도 없다."
    - "정답은 정답으로, 오답은 오답으로 판정된다(같은 빈칸에서 두 결과가 모두 관측된다)."
    - "NFD로 분해된 한글 입력도 정답으로 인정된다."
    - "오답이어도 진행이 막히지 않고 '정답 보기'로 답을 볼 수 있다."
    - "375px에서 빈칸에 포커스가 있어도 문서 가로 오버플로가 0이다."
    - "빈칸 입력의 터치 타깃 높이가 44px 이상이다."
    - "잠금 해제 상태에서 채운 빈칸 기록이 Supabase에 저장되어 새 세션·다른 기기에서도 채워진 상태로 보인다."
    - "레슨 본문이 나중에 수정돼 정답이 달라지면 옛 기록은 조용히 무시되고 빈칸이 다시 비어 보인다 — 잘못된 '정답' 표시가 생기지 않는다."
    - "anon 키로는 cloze_answer 테이블에서 아무것도 읽거나 쓸 수 없다."
    - "레슨 .mdx 파일이 한 글자도 수정되지 않는다."
    - "기존 게이트 14종이 전부 그대로 통과한다."
  artifacts:
    - src/lib/remark-cloze-blanks.ts (빌드타임 빈칸 추출 remark 플러그인)
    - src/lib/cloze-key.ts (normalizeAnswer — 플러그인과 클라이언트가 공유하는 순수 정규화)
    - src/components/cloze-blank.tsx (빈칸 입력 클라이언트 아일랜드)
    - src/components/cloze-provider.tsx (lessonId + 저장 기록 컨텍스트)
    - src/lib/cloze-store.ts (cloze_answer 유일 데이터 접근 계층)
    - supabase/migrations/20260826090000_create_cloze.sql (RLS 켜고 정책 0개)
    - scripts/e2e-cloze.mjs (신규 런타임 게이트, 포트 3215)
    - scripts/check-supabase-cloze.mjs (신규 DB 왕복 게이트)
  key_links:
    - "velite.config.ts remarkPlugins -> 컴파일된 MDX의 ClozeBlank 참조 -> mdx-content.tsx defaultComponents — 셋 중 하나만 빠져도 MDX가 'Expected component ClozeBlank to be defined'로 렌더 실패한다"
    - "ClozeProvider(lessonId) + ClozeBlank(index) -> blankId 조합 — 플러그인은 레슨 slug를 모른다"
    - "빌드타임 hash prop <-> cloze_answer.answer_hash — 불일치하면 기록을 무시한다(본문 수정 내성의 유일한 방어선)"
    - "actions.ts의 hasUnlockCookie() 재검증 -> cloze-store 쓰기 — Server Action은 렌더 여부와 무관하게 POST 엔드포인트로 존재한다"
    - "globals.css의 빈칸 최대 폭 제한 -> 375px 가로 오버플로 0 — 긴 정답이 들어오면 여기서만 막힌다"
---

<objective>
35편 레슨의 `## 3. 개념 설명` 구간에서 저자가 이미 강조해 둔 용어 하나를 빌드 타임에 자동으로
빈칸으로 바꾸고, 학습자가 직접 입력해 채우는 클로즈(빈칸 채우기) 필사를 붙인다. 채운 기록은
Supabase에 저장해 아이패드와 PC 사이에서 공유한다.

Purpose: 읽고 넘어가는 지금의 흐름에는 인출(retrieval) 부담이 없다. 이미 보이는 문장을 그대로
베끼는 "완전 필사"는 인출이 아니라 복사라서 근거가 오히려 가장 약하고, 아이패드 한글 IME에서
기술적으로 가장 위험하다. 클로즈는 같은 노력으로 인출 연습의 조건(단서 없이 스스로 생성)을
구조적으로 만족하면서, 입력 길이를 2~6자로 묶어 화면 키보드 노출과 IME 리스크를 함께 줄인다.

Output: 레슨 .mdx를 한 글자도 고치지 않고 35편 전체에 적용되는 빈칸 상호작용 + 그것을 반증
가능하게 증명하는 신규 게이트 2종 + 기기 간 동기화되는 Supabase 저장 계층.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@.planning/research/필사-transcription-ux.md
@.planning/STATE.md
@velite.config.ts
@src/components/mdx-content.tsx
@src/components/complete-button.tsx
@src/app/lesson/[lessonId]/page.tsx
@src/app/lesson/[lessonId]/actions.ts
@src/lib/progress-store.ts
@src/lib/supabase/admin.ts
@supabase/migrations/20260824120000_create_progress.sql
@scripts/e2e-mobile-overflow.mjs
@scripts/check-supabase-progress.mjs
</context>

<design_decisions>
조사(`.planning/research/필사-transcription-ux.md`)와 이 계획 단계에서 이미 확정한 사항이다.
실행자는 뒤집지 말고 그대로 구현한다.

**DD-1. 완전 필사는 하지 않는다. 클로즈만 만든다.**
문단 전체 실시간 글자별 diff는 명시적으로 기각됐다 — 리스크/보상 비율이 가장 나쁘고, 정작
"필사"라는 이름값에 비해 학습 효과 근거가 가장 약하다. 재논의 대상이 아니다.

**DD-2. 판정은 blur/Enter 시 최종 문자열 1회 비교만 한다. 타이핑 중 비교는 아예 만들지 않는다.**
한글 조합 중(`ㄱ` → `가` → `각`) `input` 이벤트가 미완성 자모 상태로 계속 발생하므로 실시간
비교는 항상 깨지고, 그것은 "난이도"가 아니라 "버그"로 읽힌다. `compositionend`를 추적해
"처리"하는 것이 아니라, 비교 시점을 blur/제출로 미뤄 **문제 자체가 발생하지 않게** 한다.
이 타이밍은 접근성 권고(`aria-live` 폼 피드백은 키 입력마다가 아니라 필드를 벗어날 때)와도
정확히 같아서 구현 분기가 하나뿐이다.

**DD-3. 비교 직전 양쪽 모두 `.normalize('NFC')` + `trim()` + 연속 공백 1칸 축약을 건다.**
사파리 입력이 항상 NFC라고 가정하지 않는다. 비용이 한 줄이므로 리스크를 감수할 이유가 없다.

**DD-4. 빈칸은 문단당 최대 1개, 저자가 이미 쓰고 있는 강조에서만 뽑는다. 레슨 .mdx는 수정 금지.**
우선순위: 문단의 인라인 자식을 문서 순서로 훑어 (1) 첫 `strong`, 없으면 (2) 첫 `inlineCode`,
둘 다 없으면 (3) 문단 텍스트의 첫 괄호 글로스(`용어(term)` / `용어(term, 설명)`)의 **괄호 앞
한국어 용어**. 어느 것도 없으면 그 문단은 평문 그대로 둔다 — 이것은 오류가 아니라 정상 폴백이다.

**DD-5. 커버리지 32/35는 "관측된 사실"이지 "고정된 집합"이 아니다.**
조사에서 강조 없는 레슨으로 지목된 3편 중 `2-7-promptops.mdx`는 실제로 `회귀(regression)`
글로스를 갖고 있다(조사 스크립트의 글로스 정규식이 쉼표를 요구했기 때문에 0으로 집계됐다).
따라서 게이트는 "이 3편이 빈칸 0개"를 어설션하지 않는다. 대신 **"빈칸 1개 이상인 레슨이
32편 이상"**을 어설션하고, 빈칸 0편 목록은 관측 로그로 남긴다. 빈칸 0개 경로가 실제로
동작한다는 증명은 콘텐츠에 기대지 않고 **합성 픽스처**(강조가 하나도 없는 MDX 문자열)로 한다 —
35편 전부에 빈칸이 생기더라도 폴백 경로는 여전히 증명된다.

**DD-6. 플러그인은 레슨 slug를 모른다. `index`(개념 설명 구간 내 1-based 순번)와 `answer`,
`hash`만 내보낸다. blankId는 런타임에 `${lessonId}#${index}`로 조합한다.**
플러그인이 VFile 경로에서 slug를 추론하면 Velite의 frontmatter slug와 어긋날 경로가 생긴다.
lessonId는 이미 slug를 알고 있는 페이지가 `ClozeProvider`로 내려준다.

**DD-7. 키 형태와 본문 수정 내성 — 이 계획이 내리는 결정이다.**
- `blank_id = "{lessonSlug}#{index}"`. index는 개념 설명 구간 내 빈칸의 1-based 문서 순번.
- 같은 행에 `answer_hash`(빌드 타임에 계산한 `sha256(정규화된 정답)` 앞 16자리)를 함께 저장한다.
- 읽을 때 **blank_id가 같아도 answer_hash가 현재 빈칸의 hash와 다르면 그 기록은 없는 것으로
  취급한다.**
- 나중에 레슨 본문이 수정되면: 수정 지점 이전 빈칸은 index도 정답도 그대로라 기록이 유지된다.
  정답이 바뀌었거나 앞쪽에 빈칸이 추가·삭제돼 순번이 밀린 빈칸은 hash가 어긋나 기록이 무시되고
  **다시 빈 칸으로 보인다.** 즉 최악의 결과는 "그 레슨의 빈칸 몇 개를 다시 채운다"이고,
  **다른 용어의 기록이 정답으로 잘못 표시되는 일은 구조적으로 불가능하다.** 마이그레이션·백필은
  필요 없고, 어긋난 옛 행은 화면에 절대 나타나지 않은 채 남는다(무해, 나중에 일괄 정리 가능).

**DD-8. 필사 기록은 기존 "완료" 버튼과 완전히 분리된 선택적 신호다.**
`progress` 테이블과 완료 토글 Server Action은 한 줄도 건드리지 않는다. 진행률·페이스 계산에도
들어가지 않는다. 빈칸을 하나도 안 채워도 레슨은 완료할 수 있다.

**DD-9. 저장 실패·조회 실패는 학습을 막지 않는다.**
조회 실패 시 그냥 빈 기록(=휘발성 모드)으로 렌더한다. 저장 실패 시 낙관적 값은 유지하고
빈칸 옆에 조용한 실패 표시만 남긴다. 완료 버튼과 달리 오류 배너를 띄우지 않는다 — 필사는
선택적 신호이므로 실패가 화면을 점거해선 안 된다.

**DD-10. Server Action은 `revalidatePath`를 부르지 않는다.**
빈칸 하나 저장할 때마다 레슨 페이지를 재렌더하면 포커스와 다른 빈칸의 입력 중 상태가 날아간다.
클라이언트가 낙관적 상태를 갖고, 서버 값은 다음 방문 때 수렴한다.

**DD-11. 작업 순서는 마감 안전장치다. Task 1~2로 배포 가능한 상태를 먼저 만들고,
Supabase 저장(Task 3~4)은 그 뒤에만 착수한다.** 저장이 길어져도 8/28에 동작하는(저장만 안 되는)
기능이 남는다. 두 작업을 섞어 짜지 않는다.
</design_decisions>

<constraints>
- **레슨 `.mdx` 파일을 한 글자도 수정하지 않는다.** `src/content/lessons/**`는 읽기 전용이다.
- `.planning/phases/06-*`를 건드리지 않는다 — 실기기 iPad UAT 대기 중이다.
- Tailwind 임의값 대괄호 문법과 리터럴 색·기본 팔레트 색 유틸리티를 새로 도입하지 않는다.
  `check-design-tokens.mjs`가 상시 위반으로 잡는다. 폭·높이는 `globals.css`의 클래스 규칙 +
  CSS 변수로 표현하고, 폰트는 `inherit`으로 받는다(절대 rem/px 선언을 새로 만들지 않는다).
- 사용자에게 보이는 어떤 문자열·코드·주석에도 교육기관명을 넣지 않는다 — 항상
  "AI Engineer 교육과정". `check-brand.mjs`가 강제한다.
- Next.js 16 / React 19 / Tailwind v4다. Next API를 단언하기 전에
  `node_modules/next/dist/docs/`의 해당 가이드를 읽는다(AGENTS.md).
- 새 게이트는 기존 관례를 **복제**한다(공유 모듈로 빼지 않는다): 자체 dev 서버 spawn,
  `--env-file`로 env 주입, 한국어 진행 로그 + `tN/총N` 시나리오 번호, Windows `taskkill /T /F`
  프로세스 트리 종료, `finally` 정리, "검사 0건 = 실패" 방어, 위반 시 non-zero exit.
  포트는 이미 쓰이는 3210~3214를 피해 **3215**를 쓴다(`E2E_CLOZE_PORT`로 override).
- 게이트는 앱 코드의 판정 로직을 재사용하지 않는다 — `.velite/lessons.json`을 독립 재파싱한다.
  단 `remark-cloze-blanks.ts`는 **검사 대상 자체**이므로 직접 import해 픽스처로 돌린다.
- `src/lib/remark-cloze-blanks.ts`와 `src/lib/cloze-key.ts`는 Node의 타입 스트리핑으로 바로
  로드 가능해야 한다(게이트가 `pathToFileURL` 동적 import로 읽는다) — enum/namespace를 쓰지 않고,
  타입만 가져오는 import는 `import type`으로 쓴다. `server-only`를 import하지 않는다.
- `velite.config.ts`에서 플러그인을 가져올 때 `@/` 별칭을 쓰지 않는다 — Velite는 설정 파일을
  esbuild로 번들하므로 tsconfig paths가 적용되지 않는다. 상대 경로로 import한다.
</constraints>

<tasks>

<task type="tracer">
  <name>Task 1: 빌드타임 빈칸 추출부터 화면 판정까지 — 한 경로 끝에서 끝까지(저장 없음)</name>
  <files>src/lib/cloze-key.ts, src/lib/remark-cloze-blanks.ts, src/components/cloze-blank.tsx, src/components/mdx-content.tsx, src/app/globals.css, velite.config.ts, package.json, .planning/REQUIREMENTS.md</files>
  <read_first>velite.config.ts, src/components/mdx-content.tsx, src/components/complete-button.tsx, src/app/globals.css</read_first>

  <action>
저장(Supabase)은 이 작업에서 만들지 않는다. 이 작업이 끝나면 **채운 내용이 새로고침하면
사라지지만 판정·정답 보기·접근성·아이패드 폭이 전부 동작하는** 상태가 되고, 그대로 커밋해
배포해도 되는 상태여야 한다(DD-11).

1. `package.json` devDependencies에 `unist-util-visit`과 `mdast-util-to-string`을 명시적으로
   추가한다(이미 전이 의존성으로 설치돼 있어 설치 비용은 사실상 0이지만, 호이스팅에만 기대면
   lockfile이 바뀔 때 깨진다). `npm install`로 lockfile을 갱신한다.

2. `src/lib/cloze-key.ts` — 의존성 0의 순수 모듈. `normalizeAnswer(raw: string): string`
   하나만 내보낸다: `.normalize('NFC')` → 연속 공백을 한 칸으로 축약 → `trim()`(DD-3).
   플러그인(빌드 타임)과 입력 컴포넌트(런타임)가 **같은 함수**를 쓴다는 점을 주석으로 남긴다 —
   두 벌로 갈라지면 "맞게 쳤는데 틀렸다고 나온다"는 형태로 조용히 깨진다.

3. `src/lib/remark-cloze-blanks.ts` — 기본 내보내기 `remarkClozeBlanks` remark 플러그인.
   - mdast root의 직계 자식을 순회해 `## 3. 개념 설명` 구간을 찾는다: 텍스트가 `3.`으로
     시작하고 `개념 설명`을 포함하는 depth 2 heading부터, 다음 depth 2 heading 직전까지.
     그런 heading이 없으면 아무것도 하지 않고 그대로 반환한다(`/about` 등).
   - 그 구간의 **직계 `paragraph` 노드만** 대상으로 한다. 인용문·목록·표·코드 블록 안은 건드리지
     않는다. 문단 평문 길이가 20자 미만이면 건너뛴다.
   - 문단당 후보 1개를 DD-4의 우선순위로 고른다. 정답 문자열은 `normalizeAnswer`를 거친 뒤
     길이가 1~12자여야 하고, 한글·영문·숫자를 하나도 포함하지 않으면(구두점뿐이면) 버린다.
     조건을 못 맞추면 그 문단은 평문으로 남긴다.
   - 뽑힌 노드를 `mdxJsxTextElement`(name `ClozeBlank`)로 **치환**한다. 속성은 문자열 3개:
     `answer`(정답 원문), `index`(개념 설명 구간 내 1-based 순번을 문자열로), `hash`
     (`node:crypto`의 sha256을 정규화된 정답에 걸어 hex 앞 16자). 자식은 없다 — 용어 자리가
     곧 빈칸이다.
   - 어떤 문단에서 예외가 나도 그 문단만 건너뛰고 계속 진행한다. **빌드를 절대 깨지 않는다.**
   - 파일 상단 주석에 "레슨 .mdx를 수정하지 않는 이유"와 DD-6(슬러그를 모른다)을 남긴다.

4. `velite.config.ts`의 `mdx`에 `remarkPlugins: [remarkClozeBlanks]`를 추가한다. import는
   상대 경로로 쓴다(별칭 금지). 기존 `rehypePlugins` 줄과 그 주석은 건드리지 않는다.

5. `src/components/cloze-blank.tsx` — `'use client'` 아일랜드. props: `answer`, `index`, `hash`.
   - 로컬 상태: 입력값과 판정 상태 `empty | correct | incorrect | revealed`.
   - **판정은 `onBlur`와 Enter 키(`onKeyDown`)에서만** 한다. `onChange`에서는 값만 담고 판정도
     피드백도 하지 않는다(DD-2). 입력값이 비어 있으면 blur해도 판정하지 않고 `empty`로 둔다.
   - 비교: `normalizeAnswer(입력) === normalizeAnswer(answer)`.
   - 루트 요소에 `data-cloze-blank`, `data-cloze-index`, `data-cloze-state`를 붙인다.
     게이트가 이 세 속성으로만 관측한다 — 클래스 이름에 기대지 않게 한다.
   - `<input>`은 `type="text"`, `inputMode="text"`, `autoComplete="off"`,
     `autoCapitalize="off"`, `autoCorrect="off"`, `spellCheck={false}`, `aria-label`은 몇 번째
     빈칸인지 한국어로 알려준다. 정답 문자 수를 CSS 변수로 인라인 `style`에 넘겨 폭 계산에 쓴다.
   - 판정 결과는 빈칸마다 하나씩 있는 `aria-live="polite"` 스팬에 담는다. 이 스팬은 판정 전에는
     **빈 문자열**이어야 한다(타이핑 중 낭독 금지). `aria-describedby`로 입력과 연결한다.
   - "정답 보기" 버튼을 입력 옆에 항상 렌더한다. 누르면 상태를 `revealed`로 바꾸고 정답 원문을
     보여준다. 이후 입력은 읽기 전용으로 두지 않는다 — 다시 채워볼 수 있게 남긴다.
   - 오답이어도 아무것도 막지 않는다: 포커스를 가두지 않고, 모달을 띄우지 않고, 다음 요소로
     탭 이동이 그대로 된다. 재시도 유도 문구도 두지 않는다.
   - 색은 기존 토큰만 쓴다(정답 `accent` 계열, 오답·기본은 `badge-neutral` 계열). 새 색을 만들지
     않고 임의값 대괄호도 쓰지 않는다.

6. `src/components/mdx-content.tsx`의 `defaultComponents`에 `ClozeBlank`를 추가한다.
   `pre`/`table`과 같은 방식이다. 이 한 줄이 빠지면 MDX가 렌더 시점에 컴포넌트 미정의로 죽는다는
   점을 주석으로 남긴다.

7. `src/app/globals.css`에 빈칸 스타일 규칙을 추가한다. 기존 `.prose [data-code-block]` 규칙들과
   같은 형태로 `.prose` 하위에 한정한다.
   - 최소 높이는 44px 터치 타깃(`.prose` 밖의 기존 관례와 같은 값)을 만족한다.
   - 폭은 정답 문자 수 CSS 변수를 쓰는 `calc()`로 잡고, **최대 폭을 컨테이너 폭으로 제한**한다.
     375px에서 문서가 밀리는 유일한 경로가 여기다.
   - `font-family`/`font-size`는 `inherit`으로 받는다(새 절대 단위 선언 금지).
   - `display: inline-block`, 세로 정렬은 본문 baseline에 맞춘다.
   - 상태별 표시는 `[data-cloze-state="..."]` 속성 선택자로 갈라 쓰고, 라이트/다크 쌍을 모두
     정의한다.
   - 상태 전환 애니메이션을 쓴다면 기존 `@media (prefers-reduced-motion: reduce)` 블록에
     해당 선택자를 추가해 `animation: none`으로 끈다. 애니메이션을 안 쓰면 이 항목은 생략한다.

8. `.planning/REQUIREMENTS.md`에 `CONT-07`(개념 설명 클로즈 필사)과 `TRACK-05`(필사 기록 저장)
   두 줄을 기존 표 형식 그대로 추가한다.
  </action>

  <verify>
    <automated>npm run build 2>&1 | tail -5 &amp;&amp; node -e "const l=require('./.velite/lessons.json');const w=l.filter(x=>x.code.includes('ClozeBlank'));console.log('레슨 수',l.length,'빈칸 있는 레슨',w.length);if(l.length!==35)process.exit(1);if(w.length<32)process.exit(1)"</automated>
  </verify>

  <done>
`npm run build`가 성공하고, `.velite/lessons.json`의 35편 중 32편 이상이 `ClozeBlank` 참조를
갖는다. dev 서버에서 `/lesson/1-1-course-orientation`을 열면 개념 설명 문단에 빈칸 입력이
보이고, 정답을 치고 포커스를 벗어나면 정답으로, 틀리게 치면 오답으로 표시되며, "정답 보기"가
답을 보여준다. 레슨 `.mdx`는 `git status`에 한 건도 나타나지 않는다.
  </done>

  <reversibility rating="reversible">
플러그인 등록 한 줄과 컴포넌트 매핑 한 줄을 되돌리면 원래 렌더로 완전히 복귀한다.
콘텐츠도 DB 스키마도 건드리지 않는다.
  </reversibility>
</task>

<task type="auto">
  <name>Task 2: 신규 게이트 e2e-cloze.mjs — 배포 가능함을 반증 가능하게 증명한다</name>
  <files>scripts/e2e-cloze.mjs</files>
  <read_first>scripts/e2e-mobile-overflow.mjs, scripts/e2e-section-tape.mjs</read_first>

  <action>
`scripts/e2e-cloze.mjs`를 새로 만든다. 부트스트랩(서버 spawn/폴링 대기/Windows taskkill/
FatalError/finally 정리/"검사 0건 = 실패" 방어/한국어 로그 + `tN/총N`)은 `e2e-mobile-overflow.mjs`
형태를 그대로 복제한다. 포트 기본값 3215, `E2E_CLOZE_PORT`로 override. 필수 env
(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `UNLOCK_SECRET`) 부재 시 즉시 exit 1.
어떤 출력에도 쿠키 값·시크릿을 찍지 않는다.

**브라우저 컨텍스트는 잠금 해제 쿠키 없이(잠금 상태로) 연다.** 이 게이트는 저장 경로를 건드리지
않아야 하고, 콘텐츠가 잠금 상태에서도 공개라는 기존 설계상 빈칸도 잠금 상태에서 동작해야 한다.

판정 로직은 전부 **순수 함수**로 분리해 쓴다(자기 검사가 가능해야 한다).

정적 단계(브라우저 없음):
- s1 커버리지: `.velite/lessons.json`을 독립 재파싱한다(앱 코드 import 금지). 레슨 수가 35편이고,
  `ClozeBlank` 참조를 가진 레슨이 32편 이상임을 어설션한다. 빈칸 0편 레슨 목록은 **관측 로그로만**
  남긴다(위반 아님, DD-5).
- s2 폴백 픽스처: `remark-cloze-blanks.ts`를 `pathToFileURL` 동적 import로 직접 로드해
  합성 마크다운 3종에 돌린다.
  (a) `## 3. 개념 설명` 아래에 강조가 전혀 없는 평문 문단만 → 빈칸 0개, 예외 없음.
  (b) `## 3. 개념 설명` 아래 `**굵게**` 문단 1개 + `## 4. 실무 예제` 아래 `**굵게**` 문단 1개
      → 빈칸이 **개념 설명 쪽에만 1개**(구간 경계가 실제로 지켜짐).
  (c) `## 3. 개념 설명` 헤딩 자체가 없는 문서 → 빈칸 0개, 예외 없음(`/about` 경로 보호).
- s3 위양성 가드: 위 판정 함수들을 **일부러 깨진 입력**에 걸어 게이트가 실제로 잡는지 확인한다.
  커버리지 판정 함수에 `ClozeBlank`가 전부 제거된 가짜 레슨 배열을 넣으면 위반을 보고해야 하고,
  구간 경계 판정에 "개념 설명 밖에도 빈칸이 생긴" 가짜 결과를 넣으면 위반을 보고해야 한다.
  둘 중 하나라도 조용히 통과하면 이 게이트 자체를 실패로 끝낸다.
- s4 `/about` 무영향: `.velite/pages.json`에 `ClozeBlank` 참조가 0건임을 어설션한다.

브라우저 단계(Chromium, 375×667 + 768×1024):
- s5 존재·터치 타깃: `.velite/lessons.json`에서 빈칸이 있는 첫 레슨을 골라 그 라우트를 연다.
  `#lesson-article`을 기다린 뒤 `[data-cloze-blank]`가 1개 이상임을, 각 입력의
  `getBoundingClientRect().height`가 44 이상임을 어설션한다.
- s6 판정 타이밍(DD-2): 첫 빈칸에서 "정답 보기"를 눌러 정답 문자열을 DOM에서 읽고 상태가
  `revealed`가 되는지 확인한 뒤, 페이지를 새로 로드한다. 첫 빈칸에 정답을 **타이핑만** 한
  직후 `data-cloze-state`가 여전히 `empty`이고 `aria-live` 스팬이 빈 문자열임을 어설션한다
  (타이핑 중 판정 금지). 그다음 blur하면 `correct`가 되고 `aria-live` 스팬에 문구가 생긴다.
- s7 오답: 새로 로드해 같은 빈칸에 정답 뒤에 한 글자를 덧붙인 값을 넣고 blur → `incorrect`.
  s6과 s7이 **같은 빈칸에서 서로 다른 결과**를 내야 통과다(둘 중 하나만 보면 "무조건 정답"
  구현도 통과해버린다). 이어서 오답 상태에서 다음 요소로 탭 이동이 되고 페이지가 계속
  스크롤되는지(진행이 막히지 않는지) 확인한다.
- s8 NFD: 새로 로드해 같은 빈칸에 정답을 `normalize('NFD')`로 분해한 문자열을 네이티브 value
  setter + `input`/`change` 이벤트로 주입하고 blur → `correct`. 정답에 한글이 없는 레슨이
  걸렸다면 **조용히 건너뛰지 말고** 한글 정답을 가진 다른 레슨을 찾아 쓰고, 끝내 없으면
  치명적 실패로 끝낸다.
- s9 375px 오버플로: 위 시나리오를 375×667에서 돌리는 동안, 첫 빈칸에 **포커스가 있고 값이
  입력된 상태**에서 `documentElement.scrollWidth <= clientWidth`와 요소 최대 `right` 보완
  측정을 함께 확인한다(`e2e-mobile-overflow.mjs`의 판정식과 `overflow-x: hidden` 무효화
  가드를 복제한다). 정답이 가장 긴 빈칸을 가진 레슨도 한 편 골라 같은 측정을 반복한다.

마지막에 검사한 시나리오 총 건수를 출력하고, 0건이면 실패로 끝낸다.

작성 후 이 게이트와 **기존 게이트 14종을 전부** 돌려 초록임을 확인한다. 특히
`e2e-mobile-overflow.mjs`(빈칸이 들어간 레슨 라우트를 이미 검사한다)와
`check-design-tokens.mjs --strict`, `check-brand.mjs`를 반드시 포함한다.
  </action>

  <verify>
    <automated>node --env-file=.env.local scripts/e2e-cloze.mjs &amp;&amp; node --env-file=.env.local scripts/e2e-mobile-overflow.mjs &amp;&amp; node scripts/check-design-tokens.mjs --strict &amp;&amp; node scripts/check-brand.mjs</automated>
  </verify>

  <done>
`e2e-cloze.mjs`가 s1~s9 전부 통과로 exit 0이고, 위양성 가드(s3)가 깨진 입력에서 실제로 위반을
보고함을 로그로 보여준다. 기존 게이트 14종이 전부 그대로 통과한다. **이 시점의 커밋은 저장 없이도
8/28에 배포 가능한 완성된 기능이다.**
  </done>
</task>

<task type="auto">
  <name>Task 3: Supabase 저장 — 별도 테이블, 정책 0개, 완료 모델 무변경</name>
  <files>supabase/migrations/20260826090000_create_cloze.sql, src/lib/cloze-store.ts, src/components/cloze-provider.tsx, src/components/cloze-blank.tsx, src/app/lesson/[lessonId]/actions.ts, src/app/lesson/[lessonId]/page.tsx, scripts/check-supabase-cloze.mjs</files>
  <read_first>supabase/migrations/20260824120000_create_progress.sql, src/lib/progress-store.ts, src/app/lesson/[lessonId]/actions.ts, src/app/lesson/[lessonId]/page.tsx, scripts/check-supabase-progress.mjs</read_first>
  <precondition>Task 2의 커밋이 끝나 저장 없는 클로즈 기능이 독립적으로 배포 가능한 상태여야 한다(DD-11).

  **DB 사전 조건(이미 충족됨):** `public.cloze_answer` 테이블은 오케스트레이터가 Supabase
  관리 API로 **이 태스크 시작 전에 이미 생성해 두었다** — 컬럼은 아래 1번의 정의와 동일하고,
  RLS는 켜져 있으며 정책은 0건이다. 따라서 이 태스크의 `check-supabase-cloze.mjs` 검증은
  실제 호스티드 DB에 대고 바로 돌릴 수 있다. 1번에서 마이그레이션 `.sql` 파일을 저장소에
  남기는 것은 기록·재현용이며, 그 파일을 다시 실행할 필요는 없다(`if not exists`라 다시
  돌려도 무해하지만 불필요하다).</precondition>

  <action>
`progress` 테이블과 완료 토글 경로는 **한 줄도 수정하지 않는다**(DD-8).

1. `supabase/migrations/20260826090000_create_cloze.sql`:
   ```
   public.cloze_answer (
     blank_id text primary key,        -- "{lessonSlug}#{index}"
     lesson_id text not null,          -- 레슨 단위 조회용
     answer_hash text not null,        -- 빌드 타임 hash, 어긋나면 기록 무시
     status text not null check (status in ('correct','revealed')),
     answered_at timestamptz not null default now()
   )
   ```
   `lesson_id`에 인덱스를 만든다. RLS를 켜고 **정책은 하나도 만들지 않는다.** 기존
   `20260824120000_create_progress.sql`의 긴 주석과 같은 톤·같은 분량으로, 이 테이블에도
   (a) 정책 0개는 버그가 아니라 의도된 기본 차단이라는 것, (b) `service_role`로만 접근한다는 것,
   (c) 미래에 "편의 정책"을 추가하면 그 순간 인터넷에 공개된다는 것, (d) `answer_hash`가 왜
   있는지(DD-7의 본문 수정 내성)를 남긴다.

2. `src/lib/cloze-store.ts` — `'server-only'`. `progress-store.ts`의 형태를 그대로 따른다.
   - `readClozeAnswers(lessonId)` → `{ ok: true; records: Record<blankId, {answerHash, status}> }`
     또는 `{ ok: false; error }`. 조회 실패와 "기록 0건"을 타입 수준에서 구분한다.
   - `saveClozeAnswer(blankId, lessonId, answerHash, status)` → upsert.
   - 이 파일 밖에서 `cloze_answer`에 접근하지 않는다.

3. `src/app/lesson/[lessonId]/actions.ts`에 `recordClozeAnswer`를 추가한다. 기존
   `toggleLessonComplete`는 건드리지 않는다. 본문 순서가 곧 보안 계약이다:
   `hasUnlockCookie()` 재검증 → `getLessonBySlug(lessonId)` 존재 확인 → 입력 검증
   (`index`는 1~200 정수, `hash`는 16자리 소문자 hex, `status`는 `correct`/`revealed` 둘 중
   하나) → 그 뒤에만 `saveClozeAnswer`. **`revalidatePath`를 부르지 않는다**(DD-10, 이유를
   주석으로 남긴다). 왜 렌더 여부와 무관하게 재검증하는지도 기존 주석과 같은 근거로 남긴다.

4. `src/components/cloze-provider.tsx` — `'use client'`. `lessonId`, `records`(없으면 null),
   `enabled` boolean을 받아 컨텍스트로 내려주고 **DOM 요소를 만들지 않는다**(`#lesson-article`
   기하가 바뀌면 `e2e-section-tape.mjs`가 깨진다). 저장 콜백도 여기서 제공한다.
   - `ClozeBlank`는 `useContext` 기본값 `null`을 그대로 허용한다 → 프로바이더가 없으면
     Task 1과 동일한 휘발성 동작. `/about`과 잠금 상태가 이 경로를 탄다.
   - 초기 상태 적용은 `blankId = ${lessonId}#${index}`로 찾은 기록의 `answerHash`가 자기
     `hash` prop과 **일치할 때만** 한다(DD-7). 불일치는 기록 없음으로 취급한다.
   - 저장 실패는 조용히 표시만 남긴다(DD-9). 오류 배너·모달을 만들지 않는다.
   - React Context는 클라이언트 프로바이더의 children으로 들어온 서버 렌더 서브트리 안의
     클라이언트 컴포넌트까지 전달된다(테마 프로바이더와 같은 표준 패턴). 만에 하나 이 경로가
     동작하지 않으면 컨텍스트 대신 모듈 스코프 스토어 + 작은 하이드레이터 컴포넌트로 바꾼다 —
     **`MDXContent`를 클라이언트 컴포넌트로 바꾸는 방식은 쓰지 않는다**(레슨 본문 전체가
     클라이언트 번들로 넘어간다).

5. `src/app/lesson/[lessonId]/page.tsx`: 잠금 해제 상태면 `readClozeAnswers(lesson.slug)`를
   호출하고, 결과를 `ClozeProvider`에 넘겨 `#lesson-article` div를 감싼다(div 자체는 그대로 둔다).
   조회가 실패하면 `records: null`로 넘겨 휘발성 모드로 렌더한다 — 오류 UI를 새로 만들지 않는다.
   잠금 상태면 `enabled={false}`로 넘긴다. 기존 완료 버튼·잠금 안내 블록은 건드리지 않는다.

6. `scripts/check-supabase-cloze.mjs` — `check-supabase-progress.mjs`를 그대로 복제한 형태.
   `@supabase/supabase-js`의 `createClient`를 스크립트 안에서 직접 호출한다(앱 모듈 import 금지).
   프로브 `blank_id`는 실제 레슨과 겹치지 않는 값을 쓴다. 단계:
   (1) service_role select로 스키마 적용 확인 — 실패 시 "마이그레이션이 적용되지 않았습니다.
       supabase/migrations/20260826090000_create_cloze.sql을 SQL 에디터에서 실행하세요."라는
       한국어 안내로 종료한다. (2) upsert (3) 재조회 (4) 같은 blank_id에 다른 answer_hash로
       재upsert → 값이 갱신됨 확인 (5) `status`에 허용되지 않은 값을 넣으면 check 제약으로
       거부됨 확인 (6) delete 후 부재 확인 (7) anon 키 select 0행/거부 + anon insert 거부
       (8) 프로브 행 잔존 0건 최종 확인. 어떤 출력에도 키·URL 전문을 찍지 않는다.

7. `scripts/e2e-cloze.mjs`에 저장 시나리오 s10을 추가한다: 잠금 해제 쿠키를 심은 컨텍스트로
   레슨을 열어 첫 빈칸에 정답을 넣고 blur → 새로 로드해도 `correct` 상태가 유지됨을 확인한 뒤,
   service_role로 그 레슨의 프로브 행을 지우고 지워졌음을 확인한다. 정리는 `finally`에서
   반드시 수행한다 — 게이트가 실제 학습 기록을 오염시킨 채 끝나면 안 된다.
  </action>

  <verify>
    <automated>node --env-file=.env.local scripts/check-supabase-cloze.mjs &amp;&amp; node --env-file=.env.local scripts/e2e-cloze.mjs</automated>
  </verify>

  <done>
마이그레이션이 적용된 상태에서 `check-supabase-cloze.mjs` 8단계가 전부 통과하고,
`e2e-cloze.mjs` s10이 "채우고 → 새로 로드 → 여전히 채워져 있음 → 정리됨"을 증명한다.
`progress` 테이블과 완료 토글 코드에는 diff가 없다.
  </done>

  <reversibility rating="costly">
테이블 생성은 되돌리려면 별도 DDL이 필요하다. 다만 `progress`와 완전히 분리돼 있어
`cloze_answer`를 drop해도 기존 진행률·완료 기록에는 아무 영향이 없다.
  </reversibility>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
개념 설명 구간 클로즈 빈칸(빌드타임 자동 추출 + blur 1회 판정 + 정답 보기 + 아이패드 폭 보증)과
Supabase 기기 간 저장. 신규 게이트 2종(`e2e-cloze.mjs`, `check-supabase-cloze.mjs`)과 기존 14종은
로컬에서 전부 통과했다. `cloze_answer` 테이블은 오케스트레이터가 이미 생성했으므로, 남은 것은
사람만 할 수 있는 한 가지 — 실기기 아이패드 확인뿐이다.
  </what-built>
  <how-to-verify>
**1) Supabase 테이블 확인 (만드는 건 이미 끝났습니다 — 보기만 하세요)**
   - `cloze_answer` 테이블은 **이미 만들어져 있습니다.** 직접 SQL을 붙여넣을 필요가 없습니다.
   - 확인만 하고 싶으시면: Supabase Dashboard → 이 프로젝트 → 왼쪽 **Table Editor** →
     `cloze_answer`가 목록에 보이면 됩니다. 행은 0건이 정상입니다(아직 아무것도 안 채웠으니까요).
   - 이 테이블에 "RLS enabled, no policies" 경고가 뜨는 것도 **정상**입니다 — 의도된 기본 차단
     설계이고 `progress` 테이블도 같은 상태입니다. **정책을 추가하지 마세요** — 추가하는 순간
     이 테이블이 인터넷에 공개됩니다.

**2) 로컬에서 실제로 채워보기**
   - `npm run dev` → 브라우저에서 `http://localhost:3000/lesson/1-1-course-orientation`
   - 저장까지 확인하려면 먼저 잠금 해제가 필요합니다(`/unlock?key=...`, 평소 쓰시던 그 방법).
   - `3. 개념 설명` 구간의 문단에서 빈칸을 찾아 답을 쳐 넣고 **다른 곳을 한 번 탭**하세요
     (타이핑 중에는 일부러 아무 판정도 안 합니다 — 한글 조합 중 판정하면 화면이 깨지기 때문입니다).
   - 맞으면 정답 표시, 틀리면 오답 표시가 뜨고, **틀려도 다음 문단으로 그냥 넘어갈 수 있습니다.**
     막히면 옆의 **정답 보기**를 누르세요.
   - 페이지를 새로고침해서 채운 게 그대로 남아 있으면 저장이 동작하는 것입니다.

**3) 아이패드 실기기 확인 (이게 1순위입니다)**
   - 아이패드 사파리에서 같은 주소를 열고 세로·가로 모드 모두에서:
     - 빈칸을 탭했을 때 **손가락으로 정확히 눌리는지**(작아서 빗나가지 않는지)
     - 화면 키보드가 올라왔을 때 **좌우로 밀리지 않는지**
     - 한글을 칠 때 **입력 중에 초록/빨강이 깜빡이지 않는지**(깜빡이면 그건 결함입니다)
     - "정답 보기" 버튼이 손가락으로 잘 눌리는지

**4) 배포**
   - 위가 다 괜찮으면 `git push`로 Vercel 배포를 트리거하고, 배포된 주소에서 2)를 한 번 더
     확인하세요. Vercel 환경 변수는 새로 추가할 것이 없습니다(기존 Supabase 키를 그대로 씁니다).
  </how-to-verify>
  <resume-signal>"승인" 또는 발견한 문제를 그대로 적어주세요 (예: "아이패드 세로에서 빈칸이 오른쪽으로 넘침")</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| 브라우저 → Server Action | 잠금 해제 쿠키를 가진(또는 위조한) 클라이언트가 임의의 blankId/hash/status를 보낼 수 있다 |
| 공개 인터넷 → Supabase anon 키 | anon/publishable 키는 언제나 공개다 |
| 레슨 .mdx 콘텐츠 → 빌드 파이프라인 | 저자 문자열이 그대로 JSX 속성 값이 된다 |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-uig-01 | Elevation of Privilege | `recordClozeAnswer` Server Action | high | mitigate | 본문 첫 줄에서 `hasUnlockCookie()` 재검증 → `getLessonBySlug()` 존재 확인 → 그 뒤에만 저장(기존 `toggleLessonComplete`와 동일한 순서 계약) |
| T-uig-02 | Tampering | `cloze_answer` 행 무한 생성 | medium | mitigate | `index`는 1~200 정수, `hash`는 16자리 hex, `status`는 enum 2종으로 제한 → 레슨당 쓸 수 있는 키 공간이 유한하고 실제 레슨 slug에만 매인다 |
| T-uig-03 | Information Disclosure | anon 키로 `cloze_answer` 조회 | high | mitigate | RLS 켜고 정책 0개(기본 차단). `check-supabase-cloze.mjs` 7단계가 anon select/insert가 실제로 막히는지 매번 반증한다 |
| T-uig-04 | Tampering | 본문 수정 후 옛 기록이 다른 용어의 정답으로 표시됨 | medium | mitigate | `answer_hash` 불일치 시 기록을 없는 것으로 취급(DD-7). 잘못된 "정답" 표시가 구조적으로 불가능 |
| T-uig-05 | Denial of Service | remark 플러그인 예외로 전체 빌드 붕괴 | high | mitigate | 문단 단위 try/catch — 실패한 문단은 평문으로 폴백하고 빌드는 계속된다. 합성 픽스처 s2가 이 폴백을 매번 증명 |
| T-uig-06 | Tampering | 게이트가 실제 학습 기록을 오염 | medium | mitigate | 브라우저 시나리오는 잠금 상태(쓰기 불가)로 돌고, 저장 시나리오 s10만 잠금 해제 컨텍스트를 쓰되 `finally`에서 프로브 행을 삭제하고 삭제를 확인한다 |
| T-uig-07 | Information Disclosure | 게이트 로그에 시크릿 노출 | medium | mitigate | 기존 게이트와 동일 — 쿠키 값·키·URL 전문을 어떤 출력에도 찍지 않는다 |
| T-uig-08 | Tampering | 신규 npm 의존성 | low | accept | 신규 설치 0건 — `unist-util-visit`/`mdast-util-to-string`은 이미 `node_modules/`에 있는 전이 의존성을 `package.json`에 명시하는 것뿐이다(unified 생태계 1차 패키지) |
</threat_model>

<verification>
전부 저장소 루트에서 실행한다.

```
npm run build
node scripts/check-brand.mjs
node scripts/check-design-tokens.mjs --strict
node scripts/check-lesson-structure.mjs
node scripts/check-manifest.mjs
node scripts/check-pace.mjs
node scripts/check-progress-gates.mjs
node scripts/check-progress-math.mjs
node scripts/check-schedule.mjs
node --env-file=.env.local scripts/check-supabase-progress.mjs
node --env-file=.env.local scripts/check-supabase-cloze.mjs
node --env-file=.env.local scripts/e2e-progress.mjs
node --env-file=.env.local scripts/e2e-today.mjs
node --env-file=.env.local scripts/e2e-typography.mjs
node --env-file=.env.local scripts/e2e-mobile-overflow.mjs
node --env-file=.env.local scripts/e2e-section-tape.mjs
node --env-file=.env.local scripts/e2e-cloze.mjs
git status --porcelain src/content/lessons | wc -l   # 0이어야 한다
```

`check-supabase-cloze.mjs`와 `e2e-cloze.mjs`의 s10은 Task 4 체크포인트에서 마이그레이션이
적용된 뒤에만 통과한다. Task 2 시점에는 나머지 전부가 통과해야 한다.
</verification>

<success_criteria>
1. 35편 전부 빌드되고 32편 이상이 개념 설명 구간에 빈칸을 1개 이상 렌더한다.
2. 빈칸 0개 경로가 합성 픽스처로 증명되고, 빌드가 깨지지 않는다.
3. 같은 빈칸에서 정답 → `correct`, 오답 → `incorrect`가 모두 관측된다(한쪽만 보는 게이트 금지).
4. 타이핑 중에는 판정도 `aria-live` 낭독도 일어나지 않고, blur 이후에만 일어난다.
5. NFD로 분해된 한글 정답이 정답으로 인정된다.
6. 오답이 진행을 막지 않고 "정답 보기"로 답을 볼 수 있다.
7. 375px에서 빈칸에 포커스·입력이 있는 상태로도 문서 가로 오버플로가 0이다.
8. 빈칸 입력 높이가 44px 이상이다.
9. 채운 기록이 Supabase에 저장되어 새 세션에서도 유지되고, anon 키로는 읽지도 쓰지도 못한다.
10. `progress` 테이블·완료 토글·레슨 `.mdx`에 diff가 없다.
11. 기존 게이트 14종 + 신규 2종이 전부 통과한다.
</success_criteria>

<output>
`.planning/quick/260826-uig-add-cloze-blank-transcription-to-concept/260826-uig-SUMMARY.md`를 작성한다.
</output>
