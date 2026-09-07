# Phase 4: Step 1 심화 콘텐츠 - Pattern Map

**Mapped:** 2026-08-25
**Files analyzed:** 15 (10 lesson `.mdx` + 5 platform touch points)
**Analogs found:** 15 / 15 (전부 저장소 내 기존 파일이 analog — 새 스택 없음)

이 phase는 콘텐츠 전용 phase다(D-48 "플랫폼 변경 0"). 모든 analog는 이미 프로덕션에 배포된 파일럿(`1-3-python-variables-and-types.mdx`, Step 2의 `2-3-react-components.mdx`) 또는 기존 게이트 스크립트다. 새 컴포넌트·라이브러리 도입 없음.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/content/lessons/step-1/1-3-python-variables-and-types.mdx` (파일럿 재작성) | content(MDX) | build-time transform | 자기 자신(구 버전) + `docs/making-of.md`(톤) | exact(구조) / role-match(톤) |
| `src/content/lessons/step-1/1-1-course-orientation.mdx` | content(MDX) | build-time transform | `1-3-python-variables-and-types.mdx`(구조), `docs/making-of.md`(톤) | role-match |
| `src/content/lessons/step-1/1-1-dev-environment-setup.mdx` | content(MDX) | build-time transform | 동일 + `1-1-dev-environment-setup.mdx`(PowerShell 언급 위해 자기 frontmatter 확인) | role-match |
| `src/content/lessons/step-1/1-2-git-branch-and-pr.mdx` | content(MDX) | build-time transform | `1-3-python-variables-and-types.mdx` | role-match |
| `src/content/lessons/step-1/1-2-generative-ai-basics.mdx` | content(MDX) | build-time transform | `1-3-python-variables-and-types.mdx` | role-match |
| `src/content/lessons/step-1/1-3-python-functions-and-io.mdx` | content(MDX) | build-time transform | `1-3-python-variables-and-types.mdx`(동일 언어 python) | exact |
| `src/content/lessons/step-1/1-4-relational-db-basics.mdx` | content(MDX) | build-time transform | `1-3-python-variables-and-types.mdx`(구조) — sql 펜스는 미실증, Pattern 3 참고 | role-match |
| `src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx` | content(MDX) | build-time transform | 상동 | role-match |
| `src/content/lessons/step-1/1-5-ml-model-types.mdx` | content(MDX) | build-time transform | `1-3-python-variables-and-types.mdx`(동일 언어 python) | exact |
| `src/content/lessons/step-1/1-5-ml-metrics-and-pipeline.mdx` | content(MDX) | build-time transform | 상동 | exact |
| `scripts/check-manifest.mjs` | config/gate script | batch(regex validation) | 자기 자신(Invariant 10 블록) | exact |
| `src/app/globals.css` | config(styling) | transform(CSS cascade) | 자기 자신(`.prose` 블록, 복사 버튼 규칙) | exact |
| `src/app/lesson/[lessonId]/page.tsx` | component(RSC) | request-response | 자기 자신(빈 상태 분기, 54-66행) | exact |
| `docs/making-of.md` | content(문서) | batch(수기 갱신) | 자기 자신(기존 Phase 1~3 기록 항목) | exact |
| `scripts/check-lesson-structure.mjs` (선택, 신설) | config/gate script | batch(regex validation) | `scripts/check-brand.mjs`, `scripts/check-manifest.mjs` | role-match |

## Pattern Assignments

### `src/content/lessons/step-1/*.mdx` (content, build-time transform) — 10편 공통

**Analog 1(구조·frontmatter):** `src/content/lessons/step-1/1-3-python-variables-and-types.mdx`
**Analog 2(톤 선례):** `docs/making-of.md`
**Analog 3(다른 언어 재확인):** `src/content/lessons/step-2/2-3-react-components.mdx`(tsx/bash 펜스 실증)

**Frontmatter 패턴** (`1-3-python-variables-and-types.mdx:1-10`) — **절대 값을 바꾸지 않고 그대로 유지, `hasContent`만 9편에서 `false → true`**:
```yaml
---
title: "Python 변수·자료형"
stepId: 1
moduleId: "1-3"
order: 1
depth: "심화"
estimatedMinutes: 150
hasContent: true
slug: "1-3-python-variables-and-types"
---
```

**6단 헤딩 패턴** (원문 그대로 인용, `1-3-python-variables-and-types.mdx:12,21,25,53,97,104`) — Step 1 10편 전부 예외 없이 유지:
```markdown
## 1. 학습 목표
## 2. 왜 배우나
## 3. 개념 설명
## 4. 실무 예제
## 5. 실무 팁
## 6. 핵심 정리 및 스스로 점검
```

**학습 목표 패턴** (`1-3-...mdx:12-19`, 동사로 끝나는 관찰 가능한 결과 3~4개):
```markdown
## 1. 학습 목표

이 레슨을 마치면 다음을 할 수 있습니다.

- Python에서 변수에 값을 저장하고, 이름을 짓는 규칙을 지켜 변수를 선언할 수 있다
- ...
```

**개념 설명 — 비유 + 일상 비유 표 패턴** (`1-3-...mdx:38-46`):
```markdown
| 자료형 | 이름 | 예시 | 일상 비유 |
|--------|------|------|-----------|
| `int` | 정수 | `25`, `-3`, `0` | 사람 수를 셀 때 — "3.5명"은 없다 |
```
D-48("이모지 헤더·일상 비유 표·`A → B → C` 흐름 한 줄"만 허용)에 맞춰 Mermaid·이미지 등은 절대 추가하지 않는다.

**실무 예제 — 완결 코드 + 실행 방법 패턴** (`1-3-...mdx:57-93`):
```python
# variables.py
# 회원 정보를 변수로 관리하고 자료형별로 다르게 다루는 예제
name = "김지현"
...
```
```bash
python variables.py
```
D-58(OS 기준 Windows)에 따라 다른 레슨(1-1/1-2/1-5)은 이 자리에서 `powershell` 펜스를 우선 쓰고 다를 때만 macOS 한 줄 병기(Pattern 3 참고 — 이 저장소에서 sql/powershell 펜스는 아직 미실증이므로 9편 착수 전 스모크 빌드 권장).

**핵심 정리 + 용어 표 + 스스로 점검(`<details>`) 패턴** (`1-3-...mdx:104-117`, D-50/D-61 반영):
```markdown
## 6. 핵심 정리 및 스스로 점검

**핵심 정리**
- (4~5줄 요약)

**이 레슨의 단어**

| 단어 | 뜻 |
|------|-----|
| (용어) | (한 줄 뜻) |

**스스로 점검**

1. (질문형 또는 실행형 과제)

<details>
<summary>정답 보기</summary>

(빈 줄 필수 — 없으면 마크다운이 파싱되지 않고 raw 텍스트로 노출된다.)

(정답/풀이 또는 예상 출력)

</details>
```
**주의(Pitfall 3 — CommonMark HTML-block 규칙):** `<summary>` 다음 줄, `</details>` 앞줄에 반드시 빈 줄을 넣는다. 이 저장소에서 아직 `<details>`가 실제 렌더된 적이 없으므로(`grep` 0건 확인됨) 파일럿에서 1회 실제 빌드로 검증.

**eli5 톤 선례** — `docs/making-of.md`(전체 톤 선례, 이모지 섹션 헤더·"한 문장으로 말하면"·괄호 한 줄 풀이·짧은 문장·표). 레슨 실행자는 이 문서의 문체를 그대로 재료로 삼아 6단 구조에 입힌다. 별도 발췌는 생략(문서 전체가 톤 기준이므로 실행자가 직접 열람 권장).

**SQL 연습 스키마 자급자족 패턴** (D-56, 1-4 레슨 전용, RESEARCH.md `## Code Examples`에서 인용):
```sql
-- Supabase SQL 에디터에서 실행 — 이 사이트의 진도 데이터(public.progress)와
-- 무관한 별도 연습 스키마를 만듭니다. public 스키마를 건드리지 않습니다.
CREATE SCHEMA IF NOT EXISTS practice;

CREATE TABLE practice.students (
  id serial PRIMARY KEY,
  name text NOT NULL,
  grade int
);
```

---

### `scripts/check-manifest.mjs` (config/gate script, batch validation)

**Analog:** 자기 자신 — Invariant 10 블록만 갱신 대상, 나머지 12개 불변식은 손대지 않는다.

**갱신 대상 상수** (`scripts/check-manifest.mjs:6-9`):
```javascript
// 기대값 상수: hasContent가 true인 레슨 수. Plan 06이 파일럿 2(2-3-react-components)를
// 채우면서 1에서 2로 올렸다 — Step 1과 Step 2에 하나씩, 두 파일럿 모두 실콘텐츠다.
const EXPECTED_HAS_CONTENT_COUNT = 2;
const EXPECTED_HAS_CONTENT_SLUGS = ['1-3-python-variables-and-types', '2-3-react-components'];
```
**갱신 규칙 (Pitfall 5 — 파일럿 단계와 9편 단계 구분):**
- **Wave 1(파일럿, `1-3-python-variables-and-types` 본문 교체):** 이 파일은 **건드리지 않는다.** 이미 `hasContent: true`이므로 카운트·슬러그 불변.
- **Wave 2(9편, `hasContent: false → true` 전환):** `EXPECTED_HAS_CONTENT_COUNT`를 `2 → 11`로, `EXPECTED_HAS_CONTENT_SLUGS`에 9개 slug를 추가(기존 2개 유지):
```javascript
const EXPECTED_HAS_CONTENT_COUNT = 11;
const EXPECTED_HAS_CONTENT_SLUGS = [
  '1-3-python-variables-and-types', '2-3-react-components',
  '1-1-course-orientation', '1-1-dev-environment-setup',
  '1-2-git-branch-and-pr', '1-2-generative-ai-basics',
  '1-3-python-functions-and-io',
  '1-4-relational-db-basics', '1-4-sql-queries-and-joins',
  '1-5-ml-model-types', '1-5-ml-metrics-and-pipeline',
];
```
다른 불변식(1~9, 11~13)은 frontmatter(title/moduleId/order/depth/estimatedMinutes/slug)가 이미 확정값이고 이 phase가 그 값을 바꾸지 않으므로 자동으로 계속 통과한다.

---

### `src/app/globals.css` (config/styling, transform)

**Analog:** 자기 자신 — `.prose` 블록과 인접 복사 버튼 규칙이 `<details>/<summary>` 스타일 추가의 정확한 위치·패턴.

**추가 위치 기준 — `.prose` 블록** (`globals.css:97-104`):
```css
/* prose 본문 line-height 1.6 — ... */
.prose {
  line-height: 1.6;
}
```
**참고할 44px 터치 타깃 + 다크모드 패턴** (`globals.css:83-95`, 복사 버튼 규칙 — `<details><summary>`에도 동일 원칙 적용: `.prose` 하위 선택자, 라이트/다크 쌍, 최소 44px):
```css
.prose pre button.rehype-pretty-copy { min-width: 44px; min-height: 44px; top: 0; margin-top: 4px; margin-right: 4px; background-color: rgba(248, 250, 252, 0.9); border: 1px solid var(--color-badge-neutral-bg); }

.dark .prose pre button.rehype-pretty-copy {
  background-color: rgba(11, 18, 32, 0.9);
  border-color: var(--color-badge-neutral-bg-dark);
}
```
`<summary>` 스타일 작성 시 이 두 규칙 쌍(라이트 기본 + `.dark` 오버라이드)을 그대로 복제하고, `min-height: 44px` 이상을 보장한다(D-61 "아이패드 터치로 펼침").

---

### `src/app/lesson/[lessonId]/page.tsx` (component/RSC, request-response)

**Analog:** 자기 자신 — `hasContent` 분기의 empty-state 카피가 갱신 대상.

**현재 empty-state 카피** (`page.tsx:54-66`):
```tsx
{lesson.hasContent ? (
  <div className="prose dark:prose-invert max-w-none">
    <MDXContent code={lesson.code} />
  </div>
) : (
  <div className="flex flex-col gap-3">
    <h2 className="text-[20px] font-semibold leading-[1.3]">콘텐츠 준비 중입니다</h2>
    <p className="text-[16px] font-normal leading-[1.6]">
      이 레슨은 아직 작성되지 않았습니다. Step 1 &quot;Python 변수·자료형&quot; 또는 Step
      2 &quot;React 컴포넌트&quot; 파일럿 레슨에서 먼저 학습 형식을 확인해보세요.
    </p>
  </div>
)}
```
**갱신 방향(Claude's Discretion):** Step 1 10편이 모두 `hasContent: true`가 되면 "Step 1 ... 파일럿 레슨에서 먼저 확인" 안내는 더 이상 맞지 않는다(Step 1은 이제 실콘텐츠 전체). Step 2·3 스텁 대상으로 문구를 조정 — 예: "Step 2 'React 컴포넌트' 파일럿 레슨 또는 Step 1의 완성된 레슨에서 학습 형식을 확인해보세요" 등, `01-UI-SPEC.md` Copywriting Contract와 함께 갱신한다. JSX 구조(className, 두 단 `h2`+`p`)는 그대로 유지 — UI-SPEC의 4-사이즈 타이포 시스템(`text-[20px]`/`text-[16px]`)을 벗어나지 않는다.

---

### `docs/making-of.md` (content/문서, batch)

**Analog:** 자기 자신 — 기존 Phase 1~3 기록 항목의 형식(이모지 헤더, "한 문장으로 말하면", 짧은 문단)을 그대로 따라 Phase 4 항목을 추가한다. PLAT-03 규칙에 따라 phase 전환마다 eli5 방식으로 갱신. 구체 문구·시점은 Claude's Discretion.

---

### `scripts/check-lesson-structure.mjs` (선택, 신설 — Wave 0 Gap)

**Analog 1(같은 zero-dependency 정규식 게이트 패턴):** `scripts/check-brand.mjs`
**Analog 2(같은 invariant-list-and-fail 패턴):** `scripts/check-manifest.mjs`

**check-brand.mjs 헤더·상수·검사 대상 패턴** (`scripts/check-brand.mjs:1-27`):
```javascript
#!/usr/bin/env node
// 공개 표면(src, docs, public, README.md)에 금지 브랜드 문자열과 개인 이메일 주소가
// 0건임을 검증하는 상시 게이트 — 외부 의존성 0, Node 표준 모듈만 사용 (D-02, D-14).
const FORBIDDEN_BRAND_STRINGS = ["kant"];
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_RELATIVE_PATHS = ["src", "docs", "public", "README.md"];
```

**check-manifest.mjs errors-배열 + fail() + exit code 패턴** (`scripts/check-manifest.mjs:27-31, 266-278`):
```javascript
const errors = [];
function fail(message) {
  errors.push(message);
}
// ...
if (errors.length > 0) {
  console.error(`check-manifest: ${errors.length} invariant(s) failed:\n`);
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  process.exit(1);
}
console.log(`check-manifest: all 13 invariants passed ...`);
process.exit(0);
```
**신설 시 적용 방식:** Step 1 10개 `.mdx` 파일 각각을 읽어 6개 헤딩(`## 1. 학습 목표` ~ `## 6. 핵심 정리 및 스스로 점검`)이 모두 정규식으로 매칭되는지 검사하고, 누락된 파일·헤딩을 `fail()`에 누적한 뒤 동일한 exit code 관례를 따른다. RESEARCH.md는 이를 필수가 아닌 선택으로 명시(Claude's Discretion) — 채택 여부는 플래너 판단.

---

## Shared Patterns

### 6단 eli5 스켈레톤 (모든 레슨 파일 공통)
**Source:** `src/content/lessons/step-1/1-3-python-variables-and-types.mdx` (전체 구조)
**Apply to:** Step 1 10개 `.mdx` 파일 전부, 예외 없음
```
## 1. 학습 목표 → ## 2. 왜 배우나 → ## 3. 개념 설명 → ## 4. 실무 예제 → ## 5. 실무 팁 → ## 6. 핵심 정리 및 스스로 점검
```

### eli5 톤(이모지 헤더·괄호 한 줄 풀이·짧은 문장·비유 표)
**Source:** `docs/making-of.md`(전체 문서가 선례)
**Apply to:** Step 1 10개 `.mdx` 파일 본문 전체

### `<details><summary>정답 보기</summary>` — 빈 줄 필수
**Source:** RESEARCH.md `## Architecture Patterns` Pattern 2, `## Common Pitfalls` Pitfall 3
**Apply to:** 모든 레슨의 "스스로 점검" 섹션(D-61)

### 코드 하이라이팅 — 언어 펜스만 정확히 쓰면 파이프라인이 처리
**Source:** `velite.config.ts`(변경 없음, rehype-pretty-code + Shiki 기존 설정)
**Apply to:** 모든 코드 블록. `python`/`bash`는 이 저장소에서 실증됨, `sql`/`powershell`은 이론상 지원되나 미실증 — 9편 착수 전 1회 스모크 빌드 권장(RESEARCH.md Pitfall 4)

### 게이트 스크립트 — 의존성 0, 정규식 파싱, errors 배열 + exit code
**Source:** `scripts/check-manifest.mjs`, `scripts/check-brand.mjs`
**Apply to:** `check-manifest.mjs` Invariant 10 갱신, 선택적 `check-lesson-structure.mjs` 신설

## No Analog Found

없음 — 이 phase의 모든 대상 파일이 저장소 내 기존 파일(자기 자신의 구 버전이거나 형제 파일럿/스크립트)을 정확한 analog로 갖는다. 새 기술·컴포넌트·라이브러리가 도입되지 않기 때문이다(D-48).

## Metadata

**Analog search scope:** `src/content/lessons/step-1/`, `src/content/lessons/step-2/`, `docs/making-of.md`, `scripts/check-manifest.mjs`, `scripts/check-brand.mjs`, `src/app/globals.css`, `src/app/lesson/[lessonId]/page.tsx`
**Files scanned:** 10개 Step 1 mdx(frontmatter 전체) + 위 6개 플랫폼 파일 전체 Read
**Pattern extraction date:** 2026-08-25
