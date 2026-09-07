# Phase 5: Step 2·3 콘텐츠와 프로젝트 가이드 - Pattern Map

**Mapped:** 2026-08-25
**Files analyzed:** 25편 `.mdx`(24 신규 + 1 재작성) + 5개 플랫폼 터치포인트 = 30
**Analogs found:** 30 / 30 — 이 phase는 새 스택·컴포넌트를 도입하지 않는다(RESEARCH.md `## Summary`). 모든 analog는 Phase 4가 이미 프로덕션에 배포한 파일 또는 기존 게이트 스크립트다. `04-PATTERNS.md`가 확립한 구조를 그대로 승계·확장한다.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/content/lessons/step-2/*.mdx` (심화 10편: 2-1×2, 2-2×2, 2-3-typescript-setup, 2-5×2, 2-7×2) | content(MDX) | build-time transform | `src/content/lessons/step-1/1-3-python-variables-and-types.mdx` | exact(구조) |
| `src/content/lessons/step-2/2-3-react-components.mdx` (재작성, D-70) | content(MDX) | build-time transform | 자기 자신(구 버전, 재작성 전) + `1-3-python-variables-and-types.mdx`(신표준 구조) | role-match(현재) → exact(재작성 후) |
| `src/content/lessons/step-2/2-4-project-ai-shop-frontend.mdx`, `2-6-project-ai-shop-backend.mdx` (프로젝트 가이드) | content(MDX) | build-time transform | `1-3-python-variables-and-types.mdx`(6단 헤딩 골격) — 단별 내용은 RESEARCH.md Pattern 3 신규 템플릿 | role-match(구조) / no-analog(내용 톤 — 신규 패턴) |
| `src/content/lessons/step-3/*.mdx` (개요 13편, 3-1×2, 3-3×2, 3-4×3, 3-6×3, 프로젝트 3편 제외) | content(MDX) | build-time transform | `1-3-python-variables-and-types.mdx`(6단 헤딩 골격) — 단별 내용은 RESEARCH.md Pattern 2 재해석 | role-match(구조) / no-analog(깊이 톤 — 신규 패턴) |
| `src/content/lessons/step-3/3-2-project-rag-agent.mdx`, `3-5-project-orchestration.mdx`, `3-7-project-ax-launch.mdx` (프로젝트 가이드) | content(MDX) | build-time transform | 상동(프로젝트 가이드 그룹과 동일) | role-match(구조) / no-analog(내용) |
| `scripts/check-lesson-structure.mjs` | config/gate script | batch(regex validation) | 자기 자신(현재 버전 — `STEP1_DIR` 단일 상수, `ALLOWED_FENCE_LANG_PREFIXES` 5개 언어) | exact |
| `scripts/check-manifest.mjs` | config/gate script | batch(regex + JSON validation) | 자기 자신(Invariant 10 블록, 6-22행) | exact |
| `src/app/lesson/[lessonId]/page.tsx` | component(RSC) | request-response | 자기 자신(hasContent 분기, 54-66행) | exact |
| `.planning/phases/01-deployed-curriculum-skeleton/01-UI-SPEC.md` §Copywriting Contract | docs(계획 문서) | batch(수기 갱신) | 자기 자신(기존 카피 계약 서술) | exact |
| `docs/making-of.md` | content(문서) | batch(수기 갱신) | 자기 자신(Phase 1~4 기록 항목 형식) | exact |

## Pattern Assignments

### `src/content/lessons/step-2/*.mdx` — 심화 10편 (content, build-time transform)

**Analog:** `src/content/lessons/step-1/1-3-python-variables-and-types.mdx` (Phase 4 신표준 파일럿, `04-PATTERNS.md`에서 이미 추출됨 — 여기서는 D-73/D-74/D-75(Step 2 전용 규칙)만 추가로 얹는다)

**Frontmatter — 절대 값을 바꾸지 않고 유지, `hasContent`만 `false → true`:**
```yaml
---
title: "PostgreSQL과 Supabase 활용"
stepId: 2
moduleId: "2-1"
order: 1
depth: "심화"
estimatedMinutes: 150
hasContent: false   # → true 로만 변경
slug: "2-1-postgres-and-supabase"
---
```
`[VERIFIED: src/content/lessons/step-2/2-4-project-ai-shop-frontend.mdx:1-10]` — 스텁 상태의 정확한 형태(프로젝트 가이드도 동일 골격, `estimatedMinutes: 60`만 다름).

**6단 헤딩(원문 그대로, 텍스트 절대 변경 금지 — 게이트 L1이 exact match):**
```markdown
## 1. 학습 목표
## 2. 왜 배우나
## 3. 개념 설명
## 4. 실무 예제
## 5. 실무 팁
## 6. 핵심 정리 및 스스로 점검
```

**Step 2 전용 추가 규칙(RESEARCH.md 승계 + D-73~D-75):**
- ④ 실무 예제에 "실행: PC 로컬 VS Code" 한 줄 명시(D-73), 2-1 모듈만 예외(브라우저 Supabase SQL 에디터 + `practice` 스키마 분리, `04-PATTERNS.md` §SQL 연습 스키마 자급자족 패턴 그대로 재사용)
- OS 명령은 PowerShell 기준, 다를 때만 macOS 한 줄 병기(D-75, `04-PATTERNS.md`와 동일 원칙)
- 완결 코드 + 실행 방법 명시(D-12 승계) — Step 3와 달리 실행 가능해야 함

**실증 완료 코드펜스 예시(`2-3-react-components.mdx:58-97`, tsx):**
```tsx
// components/like-card.tsx
"use client";
import { useState } from "react";

interface LikeCardProps {
  name: string;
  initialLikeCount: number;
}

export function LikeCard({ name, initialLikeCount }: LikeCardProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  // ...
}
```
이 스니펫이 이 저장소에서 `tsx` 펜스가 프로덕션 렌더까지 실증된 유일한 근거다. `typescript/javascript/jsx/json/html/css/yaml`은 미실증(RESEARCH.md Pitfall 5) — Wave 0에서 스모크 빌드 권장.

**단어 표 + `### 해보기` + `<details>`(D-50/D-61, `04-PATTERNS.md`와 완전히 동일한 형식):**
```markdown
**이 레슨의 단어**

| 단어 | 뜻 |
|------|-----|
| (용어) | (한 줄 뜻) |

### 해보기

1. (과제)

<details>
<summary>정답 보기</summary>

(빈 줄 필수 — `check-lesson-structure.mjs` L4가 강제)

</details>
```

---

### `src/content/lessons/step-2/2-3-react-components.mdx` (D-70 재작성 대상)

**Analog:** 자기 자신(현재 파일 전체를 Read함, `[VERIFIED]`) — 구 표준 진단 결과:
- 6개 헤딩은 정확히 존재(`## 1. 학습 목표` ~ `## 6. 핵심 정리 및 스스로 점검`)
- `### 해보기` 서브헤딩 없음 → L2 실패
- `<details>` 정답 블록 없음(147-151행이 번호 목록으로만 끝남) → L3 실패
- `**이 레슨의 단어**` 표 없음 → L5 실패
- frontmatter(1-10행)는 신표준과 100% 일치, **바이트 단위로 그대로 유지**해야 함(D-70)

**재작성 전략:** 현재 본문(12-151행, 학습 목표·왜 배우나·개념 설명·실무 예제·실무 팁은 이미 신표준 톤에 가까움)을 살리되, "6. 핵심 정리 및 스스로 점검" 섹션(현재 137-151행)만 `1-3-python-variables-and-types.mdx`의 §핵심 정리 + 단어 표 + `### 해보기`+`<details>` 패턴으로 교체·보강한다. 현재 "스스로 점검" 3개 질문(147-151행)을 `### 해보기` 과제로 전환하고 각각 `<details>` 정답을 붙인다.

**주의(RESEARCH.md Pitfall 3):** 재작성을 게이트 확대(`check-lesson-structure.mjs` 디렉터리 확장)보다 반드시 먼저 완료한다 — 순서를 뒤바꾸면 확대 직후 이 파일이 L2/L3/L5 세 규칙에 동시 걸린다.

---

### 프로젝트 준비 가이드 5편 (`2-4`, `2-6`, `3-2`, `3-5`, `3-7`) — no-analog(내용), role-match(구조)

**구조 Analog:** `1-3-python-variables-and-types.mdx`(6단 헤딩 골격만)
**내용 템플릿(신규, 저장소에 선례 없음 — RESEARCH.md `## Architecture Patterns` Pattern 3 + `## Code Examples`에서 이미 구체화됨, 그대로 채택):**

```markdown
## 4. 실무 예제

### 사전 준비 체크리스트

이 프로젝트를 개강 첫날 바로 시작하려면 아래를 미리 준비해둡니다.

| 준비물 | 왜 필요한가 | 지금 할 일 |
|--------|-------------|-----------|
| Supabase 프로젝트 | AI 쇼핑몰의 상품·주문 데이터를 저장 | 새 프로젝트 만들고 테이블 1개 생성해보기 |
| LLM API 키 | 상품 추천 문구를 AI가 생성 | 발급받아 `.env.local`에 저장(코드에 직접 쓰지 않기) |
| 샘플 상품 데이터 | 화면에 표시할 데이터가 있어야 UI를 확인할 수 있음 | 상품 3~5개를 표 형태로 미리 정리해두기 |

> ⚠️ 이 체크리스트는 "무엇을 준비할지"만 알려줍니다. 실제 구현 방법은 개강 후
> 본 과정에서 팀과 함께 설계합니다.
```

**단별 매핑(D-66, 절대 준수):**

| 단 | 내용 |
|---|---|
| ① 학습 목표 | 무엇을 만들고 무엇을 증명하는가 |
| ② 왜 배우나 | 앞선 모듈들이 여기서 합쳐지는가(복습 포인터, 구체 slug 언급) |
| ③ 개념 설명 | `A → B → C` 한 줄 도식 + 표(Mermaid 금지, D-48 승계) |
| ④ 실무 예제 | 사전 준비 체크리스트(코드 아님, 완성 코드 절대 금지 — D-67) |
| ⑤ 실무 팁 | 팀 프로젝트에서 막히는 지점·시간 배분·역할 분담 |
| ⑥ 핵심 정리 | 준비 완료 판정 기준(체크박스) + 단어 표 |

**금지(D-67, Pitfall 1):** 완성 코드, DB 스키마 전체, 단계별 튜토리얼, "이렇게 만들면 됩니다"류 정답 제시. `### 해보기` 과제도 "구현해보세요"가 아니라 "실제로 준비해 보기"(계정 생성, 키 발급, 샘플 수집)여야 한다.

---

### Step 3 개요 레슨 13편(프로젝트 3편 제외 → 10편: `3-1`×2, `3-3`×2, `3-4`×3, `3-6`×3) — no-analog(깊이·톤), role-match(구조)

**구조 Analog:** `1-3-python-variables-and-types.mdx`(6단 헤딩 골격만, 텍스트 불변)
**내용 재해석(D-62~D-65, RESEARCH.md Pattern 2에서 이미 구체화):**

| 단 | 심화(Step 2, 기존 승계) | 개요(Step 3, 신규) |
|---|---|---|
| ① 학습 목표 | "~할 수 있다"(구현·실행) | "~를 알아듣는다"(정의·용도·위치 3요소) |
| ③ 개념 설명 | 완전한 원리 | 용어 정의+비유, 수식/알고리즘 생략 |
| ④ 실무 예제 | 완결 실행 코드+실행 방법 | 실제 서비스 사례 + 읽기용 스니펫(10~20줄, 실행 안내 없음) |
| ⑥ 스스로 점검 | 실행형 | 판단·설계형(시나리오 판단, 설계 선택, 용어 대조표) |

**읽기용 스니펫 안내 문구(D-63, 반드시 포함):**
```markdown
> 아래 코드는 개념을 눈으로 보기 위한 예시입니다 — 지금 실행할 필요는 없습니다.
> 개강 후 본 과정에서 실제로 돌려보게 됩니다.

```typescript
// 개념 예시 — pgvector를 쓰는 Supabase 테이블에서 "비슷한 상품 5개" 찾기
const { data } = await supabase.rpc("match_products", {
  query_embedding: productEmbedding,
  match_count: 5,
});
```
```

**경계(Pitfall 2):** 학습 목표에 "직접 구현/튜닝/성능 비교"가 등장하면 즉시 삭제. 실무 예제 코드 블록 3개 이상 또는 30줄 초과 시 심화로 미끄러진 신호.

---

### `scripts/check-lesson-structure.mjs` (config/gate script, batch validation) — D-71/D-72 수정

**Analog:** 자기 자신(현재 파일 전체, `[VERIFIED]`)

**변경 지점 1 — 검사 대상 디렉터리 확대(D-71), 현재 40행:**
```javascript
// 변경 전
const STEP1_DIR = path.join(ROOT, 'src', 'content', 'lessons', 'step-1');
// ... 52-55행
const allFiles = fs.readdirSync(STEP1_DIR).filter((f) => f.endsWith('.mdx')).sort();

// 변경 후 (배열로 확장, 195행 순회 루프도 디렉터리 배열을 순회하도록 조정)
const LESSON_DIRS = ['step-1', 'step-2', 'step-3'].map((d) =>
  path.join(ROOT, 'src', 'content', 'lessons', d),
);
```

**변경 지점 2 — 허용 코드펜스 언어 확장(D-72), 현재 32행:**
```javascript
// 변경 전
const ALLOWED_FENCE_LANG_PREFIXES = ['python', 'sql', 'bash', 'powershell', 'text'];

// 변경 후
const ALLOWED_FENCE_LANG_PREFIXES = [
  'python', 'sql', 'bash', 'powershell', 'text',
  'typescript', 'tsx', 'javascript', 'jsx', 'json', 'html', 'css', 'yaml',
];
```

**변경 지점 3 — 상단 주석 갱신(D-71 부수 의무), 현재 1-13행:**
현재 주석(`[VERIFIED: 9-12행]`)이 "Step 2·3 디렉터리는 검사하지 않는다 — 2-3-react-components.mdx가 구 표준이라 오탐"이라는 근거를 담고 있다. D-70 재작성으로 이 근거가 사라지므로, 게이트 확대 커밋에서 반드시 함께 갱신한다(그렇지 않으면 코드와 주석이 모순).

**주의(Pitfall 3, 순서 고정):** ① `2-3-react-components.mdx` 재작성(본문만) → ② 이 스크립트 두 상수 갱신 → ③ 실행해 통과 확인. 검사 로직(L1~L6, 함수 전체)은 변경 불필요 — 이미 범용적으로 작성되어 있음(`[VERIFIED: 73-213행]`).

---

### `scripts/check-manifest.mjs` (config/gate script, batch validation) — Invariant 10 갱신

**Analog:** 자기 자신(6-22행, `[VERIFIED]`)

**현재 상태(Phase 4 종료 시점, 변경 전):**
```javascript
const EXPECTED_HAS_CONTENT_COUNT = 11;
const EXPECTED_HAS_CONTENT_SLUGS = [
  '1-1-course-orientation', '1-1-dev-environment-setup',
  '1-2-git-branch-and-pr', '1-2-generative-ai-basics',
  '1-3-python-variables-and-types', '1-3-python-functions-and-io',
  '1-4-relational-db-basics', '1-4-sql-queries-and-joins',
  '1-5-ml-model-types', '1-5-ml-metrics-and-pipeline',
  '2-3-react-components',
];
```

**갱신 규칙(D-78 + RESEARCH.md Pitfall 4/Open Question 1 — 산수 재검증 필요):**
- **Wave 1(파일럿 3편 배포 후):** `2-3-react-components`는 재작성만(카운트 불변, 이미 포함됨). 신규 `hasContent:true` 전환은 `2-4-project-ai-shop-frontend`, `3-1-vector-search-basics` 2건뿐 → **11 + 2 = 13** (CONTEXT.md 원문 "14"는 재검증 필요, RESEARCH.md Open Question 1 참고 — 플래너는 `.velite/lessons.json` 실측 카운트로 확정할 것)
- **Wave 2(Step 2 잔여 10편 배포 후):** 13(또는 실측값) + 10 = 23(또는 대응값)
- **Wave 3(Step 3 잔여 12편 배포 후):** 최종 11 + 24 = **35**(전 레슨) — 최종 목적지는 확정, 중간값만 매 wave 빌드 후 실측 확인

**Invariant 10 슬러그 배열 단순화(Claude's Discretion, D-78):** 최종 35 시점에는 "매니페스트 전체 슬러그와 동일" 형태로 단순화 가능.

---

### `src/app/lesson/[lessonId]/page.tsx` (component/RSC, request-response) — D-79 카피 갱신

**Analog:** 자기 자신 — `[VERIFIED: 54-66행]`, 현재 empty-state 카피:
```tsx
{lesson.hasContent ? (
  <div className="prose dark:prose-invert max-w-none">
    <MDXContent code={lesson.code} />
  </div>
) : (
  <div className="flex flex-col gap-3">
    <h2 className="text-[20px] font-semibold leading-[1.3]">콘텐츠 준비 중입니다</h2>
    <p className="text-[16px] font-normal leading-[1.6]">
      이 레슨은 아직 작성되지 않았습니다. Step 1의 레슨 10편과 Step 2 &quot;React
      컴포넌트&quot; 파일럿 레슨은 모두 작성되어 있으니 먼저 그쪽부터 학습해보세요.
    </p>
  </div>
)}
```

**갱신 방향(D-79):** 분기 코드 자체는 삭제하지 않고 유지(35편 완료 후 도달 불가 상태가 되어도 안전망으로 남김). 문구는 각 wave 진행 상황에 맞게 조정 가능(Claude's Discretion) — 최종적으로 도달 불가 카피가 되므로 문구 정교화보다 "유지" 자체가 핵심. JSX 구조(className, `h2`+`p` 2단, `text-[20px]`/`text-[16px]` 타이포)는 절대 변경하지 않는다(01-UI-SPEC.md 4-사이즈 타이포 시스템 준수).

---

### `docs/making-of.md` (content/문서, batch) — Wave 3 마감(D-80)

**Analog:** 자기 자신 — 기존 Phase 1~4 기록 항목 형식(이모지 헤더, "한 문장으로 말하면", 짧은 문단)을 그대로 따라 Phase 5 항목 추가. `04-PATTERNS.md`와 동일 지침 승계 — 구체 문구는 Claude's Discretion, PLAT-03 규칙(살아있는 문서)에 따라 Wave 3 종료 시 작성.

---

### `01-UI-SPEC.md` §Copywriting Contract — D-79 기록 추가

**Analog:** 자기 자신(기존 카피 계약 서술 형식) — "콘텐츠 준비 중입니다" 분기가 v1 완성(35편 전부 `hasContent:true`) 후 도달 불가 상태가 됨을 안전망으로 유지한다는 사실을 문서에 기록한다.

## Shared Patterns

### 6단 eli5 스켈레톤(모든 신규 레슨 파일 공통, 25편 전부)
**Source:** `src/content/lessons/step-1/1-3-python-variables-and-types.mdx`(전체 구조), `04-PATTERNS.md` §Shared Patterns
**Apply to:** Step 2 12편(심화 10 + 프로젝트 2) + Step 3 13편(개요 10 + 프로젝트 3), 예외 없음(D-65, D-66)
```
## 1. 학습 목표 → ## 2. 왜 배우나 → ## 3. 개념 설명 → ## 4. 실무 예제 → ## 5. 실무 팁 → ## 6. 핵심 정리 및 스스로 점검
```

### eli5 톤(이모지 헤더·괄호 한 줄 풀이·짧은 문장·비유 표)
**Source:** `docs/making-of.md`(전체 문서 선례), `04-PATTERNS.md`
**Apply to:** 25편 본문 전체, 세 형식(심화/개요/프로젝트 가이드) 공통

### `<details><summary>정답 보기</summary>` — 빈 줄 필수, 형식 예외 없음
**Source:** `scripts/check-lesson-structure.mjs` L3/L4 검사 로직(105-139행), D-69("프로젝트 가이드도 형식 예외 없음")
**Apply to:** 25편 전부 — 프로젝트 가이드는 "정답"이 아니라 "성공했다면 이런 화면/출력이 나옵니다"(D-68)로 내용만 다름

### 단어 표 5~8행
**Source:** `scripts/check-lesson-structure.mjs` L5 검사 로직(142-170행)
**Apply to:** 25편 전부, 프로젝트 가이드는 그 프로젝트에서 처음 등장하는 용어로 채움(D-69)

### 코드 하이라이팅 — 언어 펜스만 정확히 쓰면 파이프라인이 처리
**Source:** `velite.config.ts`(변경 없음), `[VERIFIED: rehypePrettyCodeOptions에 언어 제한 없음]`
**Apply to:** 모든 코드 블록. `tsx`/`sql`/`bash`/`python`은 실증됨, 신규 8개(`typescript/javascript/jsx/json/html/css/yaml`) 중 6개는 미실증(Pitfall 5) — Wave 0 스모크 빌드 강력 권장

### 게이트 스크립트 — 의존성 0, 정규식/원본 mdx 직접 파싱, errors 배열 + exit code
**Source:** `scripts/check-lesson-structure.mjs`, `scripts/check-manifest.mjs`(전체 재사용, 로직 변경 없음)
**Apply to:** 상수 갱신만(디렉터리 확대, 언어 확장, Invariant 10 3단계 갱신) — `.velite/` 빌드 산출물이 아니라 원본 `.mdx`를 직접 읽는 성질을 D-71 확장 시에도 유지할 것(`<details>` 마크업은 컴파일 후 확인 불가)

### 실습 환경 안내 — PC 로컬 우선, 예외만 명시
**Source:** D-73~D-75, `04-PATTERNS.md` §SQL 연습 스키마 자급자족 패턴(`practice` 스키마)
**Apply to:** Step 2 심화 10편(2-1만 브라우저 SQL 에디터 예외), Step 3는 실행 안내 자체가 없음(D-63)

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| 프로젝트 준비 가이드 5편의 "④ 사전 준비 체크리스트" 내용 | content(MDX) | build-time transform | 저장소에 완전한 선례 없음 — 6단 헤딩 골격만 재사용, 체크리스트 표 형식은 RESEARCH.md `## Code Examples`에서 신규 정의(위 §프로젝트 준비 가이드 섹션에 이미 반영) |
| Step 3 개요 레슨의 "④ 실무에서 이게 어떻게 쓰이나 + 읽기용 스니펫" 내용 | content(MDX) | build-time transform | 저장소에 "실행 불필요 스니펫" 선례 없음(기존 10편은 전부 완결 실행 코드) — RESEARCH.md `## Architecture Patterns` Pattern 2가 유일한 정의처, 위 섹션에 반영 완료 |

두 항목 모두 **구조(6단 헤딩)는 exact analog가 있으나 내용 톤이 이 phase에서 처음 정의되는 신규 패턴**이라는 점에서 "No Analog"로 분류했다 — 플래너는 RESEARCH.md `## Architecture Patterns` Pattern 2·3과 `## Code Examples`를 원출처로 참조할 것.

## Metadata

**Analog search scope:** `src/content/lessons/step-1/`, `src/content/lessons/step-2/`, `src/content/lessons/step-3/`(전 25편 frontmatter + 2-3-react-components 전체 본문), `scripts/check-lesson-structure.mjs`, `scripts/check-manifest.mjs`, `src/app/lesson/[lessonId]/page.tsx`, `docs/making-of.md`, `.planning/phases/04-step-1/04-PATTERNS.md`
**Files scanned:** 25편 mdx frontmatter(RESEARCH.md에서 이미 전수 확인됨, 이 세션은 대표 샘플 3개 직접 재확인) + `2-3-react-components.mdx` 전체 + 게이트 스크립트 2개 전체 + `page.tsx` 관련 부분 + `04-PATTERNS.md` 전체
**Pattern extraction date:** 2026-08-25
