# Phase 5: Step 2·3 콘텐츠와 프로젝트 가이드 - Research

**Researched:** 2026-08-25
**Domain:** 콘텐츠 집필(교육용 MDX 레슨, eli5 톤, 25편 — Step 2 심화 12편 + Step 3 개요 13편, 프로젝트 준비 가이드 5편 포함) — 플랫폼 코드 변경은 게이트 스크립트 확장 2곳 + 상수 갱신 + 카피 정리로 제한
**Confidence:** HIGH — Phase 4가 이미 이 phase와 동일한 기술 스택·파이프라인·게이트 패턴을 실전 배포까지 검증했다. Phase 5는 새 기술을 들이지 않고 동일 파이프라인 위에 콘텐츠 25편만 얹으며, 게이트 확장 두 곳(`check-lesson-structure.mjs` 디렉터리 확대, 코드펜스 언어 확장)도 기존 스크립트를 수정하는 것뿐이다. 이 세션에서 대상 파일·스크립트·frontmatter를 전부 직접 Read해 확인했다.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Step 3 "개요" 깊이 기준 (CONT-04 "개념 훑기"의 실행 rubric)**
- **D-62:** Step 3 완료 판정 기준 = "개강 첫 시간에 강사가 이 단어를 썼을 때 무슨 얘기인지 알아듣는다" — 학습 목표는 (a) 용어를 한 문장으로 정의, (b) 언제/왜 쓰는지, (c) 전체 파이프라인에서 위치를 아는 것 세 가지로 쓴다. 직접 구현·튜닝·성능 비교는 목표가 아니다 — **Reversibility: costly**
- **D-63:** Step 3 레슨에 실행 가능한 코드를 요구하지 않는다 — 읽기용 스니펫(10~20줄)만, 설치·실행 안내 없음. 스니펫에 "읽고 넘어가면 됩니다 — 개강 후 직접 실행합니다" 한 줄 추가. **예외 없음 — 이 규칙은 Step 3에만 적용, Step 2는 D-12(완결 코드+실행 방법 명시) 그대로**
- **D-64:** Step 3 90분 = 읽기 약 40분 + 판단·설계형 해보기 약 50분(Step 1의 읽기30+실습120과 비율이 다름을 명시적으로 기록). 정답은 `<details>`에 "모범 답안 + 왜 그렇게 보는가"
- **D-65:** Step 3도 6단 헤딩(D-10) 원문 그대로 유지, ④ 실무 예제 자리를 "실무에서 이게 어떻게 쓰이나"(서비스 사례 + 읽기용 스니펫)로 재해석. 헤딩 텍스트는 절대 바꾸지 않는다(자동 게이트가 35편을 한 벌 규칙으로 검사)

**프로젝트 5종 준비 가이드 형식 (CONT-05)**
- **D-66:** 프로젝트 가이드 5편도 6단 템플릿 유지, 단별 내용만 재해석 — ① 무엇을 만들고 증명하나 ② 커리큘럼에서의 자리 ③ 전체 구조(A→B→C 도식+표) ④ **사전 준비 체크리스트**(계정·API키·설치·샘플데이터, 코드 아님) ⑤ 팀 프로젝트에서 자주 막히는 지점 ⑥ **준비 완료 판정 기준**(체크박스)+단어 표 — **Reversibility: costly**
- **D-67:** "재현 아님"의 경계 — 완성 코드·완성 DB 스키마 전체·단계별 튜토리얼·"이렇게 만들면 됩니다" 정답 제시 **금지**. 준비물 체크리스트·구조 스케치(한 줄 도식+표)·미리 만들어 둘 계정/샘플데이터·처음 나오는 용어·복습 포인터는 **허용**. 질문 하나: "개강 후 이 프로젝트를 시작하는 첫날에 막히지 않으려면 지금 무엇을 해 두어야 하나"
- **D-68:** 프로젝트 가이드 60분 = 읽기 20분 + 준비 실행 40분, 해보기는 "실제로 준비해 보기"(Supabase 프로젝트 생성+테이블 1개, API 키 발급+호출 1회, 샘플 문서 3개 수집 등). `<details>`에는 "정답"이 아니라 "성공했다면 이런 화면/출력이 나옵니다"
- **D-69:** 단어 표(D-50)와 `### 해보기` 2~3개(D-61)는 프로젝트 가이드에도 형식 예외 없이 유지

**Step 2 실습 환경과 자동 게이트 확장 (CONT-03, D-12)**
- **D-70:** `2-3-react-components.mdx`(구 표준)를 신표준으로 **재작성**한다(게이트 예외로 두지 않음). 프론트매터 8개 필드는 바이트 단위로 그대로, 본문만 교체(`hasContent`는 이미 true라 변경 없음)
- **D-71:** `scripts/check-lesson-structure.mjs`를 Step 1 전용에서 **step-1/2/3 전 디렉터리 순회**로 확대. 검사 규칙은 그대로(`hasContent: true`인 파일만). 상단 주석의 "Step 2·3 미검사" 근거를 D-70 해소로 갱신
- **D-72:** 허용 코드펜스 언어를 `python, sql, bash, powershell, text` + **`typescript, tsx, javascript, jsx, json, html, css, yaml`**로 확장. `mermaid`는 넣지 않는다(D-48 유지). `ALLOWED_FENCE_LANG_PREFIXES` 한 곳에서만 관리
- **D-73:** Step 2 예제 실행 환경 = **PC 로컬(VS Code + Node)**, 예외는 2-1 모듈뿐(브라우저 Supabase SQL 에디터, D-56 연습 스키마 분리 승계). 온라인 IDE 안내 없음. 각 레슨 ④에 "실행: PC 로컬 VS Code" 한 줄 명시. 아이패드 정책(읽기는 아이패드, 실행은 PC)은 Phase 4(D-55) 승계, 새 제약 아님
- **D-74:** Node·npm·TypeScript 설치는 `2-3-typescript-setup`이 담당(1-1은 Python·Git까지만). 순서상 먼저인 2-2(HTML·CSS·JS)는 브라우저+파일 하나로 완결(별도 설치 없이 `.html`을 브라우저로 열기)
- **D-75:** OS 기준 Windows(PowerShell), 다를 때만 macOS 한 줄 병기(D-58 승계)

**집필·배포 리듬**
- **D-76:** Wave 1 = 대표 3편(`2-3-react-components` 재작성, `3-1-vector-search-basics` 개요 신규, `2-4-project-ai-shop-frontend` 프로젝트 신규) → 한 번 배포 → 아이패드 사용자 확인. 승인 전 나머지 22편 착수 금지 — **Reversibility: costly, 이 3편이 나머지 22편 형식을 확정**
- **D-77:** 승인 후 22편은 Wave 2(Step 2 잔여 10편) → Wave 3(Step 3 잔여 12편) 두 배치로 나눠 병렬 집필·배포. 배치 사이 사람 승인 체크포인트 없음(자동 게이트만)
- **D-78:** `EXPECTED_HAS_CONTENT_COUNT`를 각 wave 끝에서 11 → 14(Wave 1) → 24(Wave 2) → 35(Wave 3)로 갱신. wave마다 맞추지 않으면 그 wave 빌드가 실패한다
- **D-79:** "콘텐츠 준비 중입니다" 분기 코드는 삭제하지 않고 유지(35편 완료로 도달 불가 상태가 되어도 안전망으로 남김). `01-UI-SPEC.md` Copywriting Contract에 "v1 완성 후 도달 불가" 기록
- **D-80:** Making-of(`docs/making-of.md`) 마감은 **Wave 3**에서. PLAT-03 규칙에 따라 Phase 4·5 기록(콘텐츠 집필 방식, eli5 표준 확립, 파일럿 검증 리듬)을 eli5 톤으로 추가
- **D-81:** 성공 기준 4(전체 진행률 100%)는 `scripts/e2e-progress.mjs`로 e2e 검증 — 반올림·집계 경계에서 99%가 나오지 않는지 실제 확인

### Claude's Discretion

- Wave 2·3 안에서의 executor 분할 방식(모듈별/편수별)과 각 배치의 커밋 단위
- 각 레슨의 이모지 헤더·비유 소재·`### 해보기` 개수(2~3)·단어 표 행 수(5~8)
- Step 3 읽기용 스니펫의 언어·길이 선택(10~20줄은 목표치, 게이트 값 아님)
- Step 2 예제의 구체 라이브러리 버전·프로젝트 구조 — 커리큘럼 스택(Express, Prisma, React/Next, TypeScript, Supabase) 범위 안
- 프로젝트 가이드 5편의 "복습 포인터" 대상 레슨 선정
- `check-manifest.mjs` Invariant 10 슬러그 배열 단순화 여부(D-78)
- `check-lesson-structure.mjs` 확장 시 Step별 규칙 분기 필요 여부 — Step 3에 코드 펜스가 아예 없는 레슨이 나올 경우의 처리
- Wave 1 파일럿 3편의 집필 순서(동시/순차)

### Deferred Ideas (OUT OF SCOPE)

- Mermaid·SVG 다이어그램 — D-48/Pitfall 4에 막힘. 25편 완료 후 특정 레슨에서 필요하면 quick task로
- 온라인 IDE(StackBlitz·CodeSandbox) 대체 경로 — D-73으로 검토 후 미채택
- Step 3 실습 환경(벡터DB·n8n) 실제 구축 안내 — 90분 예산 초과로 D-63에서 배제, 개강 후 본 과정이 다룸
- 레슨 검색·북마크·퀴즈 엔진 — v2 CONV 범위, Phase 5 밖
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONT-05 | 커리큘럼 실습 프로젝트 5종은 개요·사전 준비 가이드 레슨으로 제공된다 (재현 아님) | `## Architecture Patterns` Pattern 5(프로젝트 가이드 스켈레톤), `## Common Pitfalls` Pitfall 1("재현 아님" 경계 위반), `## Code Examples` §프로젝트 준비 체크리스트 패턴. 5편 slug·모듈·시간은 `## Architectural Responsibility Map` 아래 표에 확정값으로 정리 |

</phase_requirements>

## Summary

Phase 5는 Phase 4가 이미 프로덕션에서 검증한 파이프라인(Velite → rehype-pretty-code/Shiki → `MDXContent`) 위에 **레슨 25편의 본문**만 얹는 콘텐츠 phase다. 플랫폼 변경은 정확히 여섯 곳으로 제한된다: (1) 25개 `.mdx` 파일 본문 작성(24편 신규 + `2-3-react-components` 재작성) + `hasContent: false → true` 전환(24편), (2) `scripts/check-lesson-structure.mjs`의 검사 대상 디렉터리를 `step-1`에서 `step-1/2/3` 배열로 확대, (3) 같은 스크립트의 `ALLOWED_FENCE_LANG_PREFIXES`에 8개 언어 추가, (4) `scripts/check-manifest.mjs` Invariant 10 상수를 wave마다 3단계 갱신(11→14→24→35), (5) `src/app/lesson/[lessonId]/page.tsx`의 "콘텐츠 준비 중" 카피 + `01-UI-SPEC.md` Copywriting Contract 갱신(D-79), (6) `docs/making-of.md` Wave 3 마감 기록.

이 세션에서 25편 전체(Step 2 12편 + Step 3 13편)의 frontmatter를 직접 Read해 확인한 결과, CONTEXT.md의 편수·slug·모듈 매핑이 정확히 일치한다 — Step 2는 2-1×2, 2-2×2, 2-3×2, 2-4×1(프로젝트), 2-5×2, 2-6×1(프로젝트), 2-7×2 = 12편, Step 3은 3-1×2, 3-2×1(프로젝트), 3-3×2, 3-4×3, 3-5×1(프로젝트), 3-6×3, 3-7×1(프로젝트) = 13편. 프로젝트 준비 가이드 5편(`estimatedMinutes: 60`)과 나머지 20편(Step 2는 150, Step 3은 90)의 시간 값도 이미 확정되어 손댈 필요가 없다 — `check-manifest.mjs` Invariant 13(파생 규칙)이 이 값을 이미 강제하고 있다.

`2-3-react-components.mdx`(구 표준 파일럿)를 직접 Read한 결과 D-70의 진단이 정확했다 — 6개 헤딩은 정확히 있지만 `### 해보기` 서브헤딩, `<details>` 정답 블록, "이 레슨의 단어" 표가 전부 없다("스스로 점검"이 번호 목록만으로 끝난다). `check-lesson-structure.mjs`를 Step 2·3으로 확대하는 순간 이 파일이 L2(해보기 2~3개)·L3(details 짝)·L5(단어 표) 세 규칙 모두에서 실패하므로, 재작성이 게이트 확대의 선행 조건이다.

`check-lesson-structure.mjs`를 직접 Read한 결과, D-71·D-72가 요구하는 두 변경 지점이 정확히 특정된다: `STEP1_DIR` 단일 상수(24행)를 디렉터리 배열로, `ALLOWED_FENCE_LANG_PREFIXES`(33행) 배열에 8개 언어를 추가하면 된다. 이 스크립트는 CRLF/LF를 정규화하고, 6개 검사(L1 헤딩 순서/개수, L2 해보기 2~3개, L3 details 짝, L4 빈 줄 규칙, L5 단어 표 5~8행, L6 펜스 언어 화이트리스트)를 이미 구현하고 있어 25편 신규 검사도 동일 규칙으로 충분하다 — 로직 변경은 필요 없다.

`velite.config.ts`를 직접 Read한 결과 `rehypePrettyCodeOptions`에 언어 제한이 전혀 없다(테마만 지정) — Shiki 기본 번들이 `typescript/tsx/javascript/jsx/json/html/css/yaml`을 표준 지원하므로(CITED), D-72의 언어 확장이 하이라이팅 파이프라인 쪽에서 막힐 위험은 낮다. 다만 이 저장소에서 `tsx`/`bash`만 실증되었고(Phase 4 RESEARCH Pattern 3) 나머지 7개 언어는 아직 실제 빌드로 렌더된 적이 없다 — Wave 1 파일럿(개념상 `tsx`+`json` 정도만 나올 가능성이 높음)이 첫 실증 기회가 된다.

**Primary recommendation:** Wave 0(선행 작업)으로 `check-lesson-structure.mjs`의 두 상수를 먼저 갱신하고 `2-3-react-components.mdx`를 재작성해 게이트를 통과시킨 뒤, Wave 1 파일럿 3편(재작성 1 + 개요 신규 1 + 프로젝트 신규 1)을 배포해 사용자 확인을 받는다. Wave 2(Step 2 10편)·Wave 3(Step 3 12편) 순으로 진행하되 각 wave 끝에서 `EXPECTED_HAS_CONTENT_COUNT`를 정확히 갱신하고, Wave 3 종료 시 `docs/making-of.md`를 마감하며 `scripts/e2e-progress.mjs`로 100% 진행률을 e2e 검증한다.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 레슨 본문 콘텐츠(개념·비유·예제·용어, 프로젝트 준비물) | 콘텐츠 파일(빌드 타임, Velite) | — | `.mdx` 파일이 유일한 소스. DB·CMS 없음(Phase 4와 동일 결정 승계) |
| Step 3 "읽기용 스니펫" 코드 | 콘텐츠 파일(정적 텍스트로만 존재) | — | D-63 — 실행 환경과 무관, 코드펜스는 하이라이팅 목적일 뿐 실행 가능성을 주장하지 않는다 |
| 코드 하이라이팅(신규 8개 언어 포함) | 빌드 타임(Velite → rehype-pretty-code/Shiki) | — | `[VERIFIED: velite.config.ts:9-11]` — 언어 화이트리스트 없음, Shiki 기본 번들이 전 언어 처리 |
| `hasContent` 분기·"준비 중" 카피 | Frontend Server(RSC) | — | `[VERIFIED: src/app/lesson/[lessonId]/page.tsx:54-66]` — 변경 없음, 카피 문구만 D-79에 따라 조정 |
| 구조 게이트(6개 헤딩·해보기·details·단어 표·펜스 언어) | 빌드/CI 스크립트(Node, 의존성 0) | — | `[VERIFIED: scripts/check-lesson-structure.mjs 전체 Read]` — D-71·D-72로 검사 범위만 확대, 검사 로직 자체는 변경 없음 |
| 매니페스트 불변식(35 레슨·4200분·hasContent 카운트) | 빌드/CI 스크립트(Node, 의존성 0) | — | `[VERIFIED: scripts/check-manifest.mjs 전체 Read]` — Invariant 10만 wave마다 갱신, 나머지 12개는 frontmatter가 이미 확정값이라 자동 통과 |
| 프로젝트 준비물 실제 실행(계정 생성, API 키 발급, Supabase 테이블 생성) | 학습자의 브라우저/외부 서비스 | — | 사이트는 "무엇을 준비하라"만 안내한다 — D-67이 완성 코드·정답 아키텍처를 명시적으로 금지하므로 사이트가 실행 환경을 대신 제공하지 않는다 |
| 실습 코드의 실제 실행(Step 2 Node/TS 코드) | 학습자의 로컬 환경(PC VS Code) / 브라우저(2-1 Supabase SQL 에디터) | — | D-73 — Colab류 온라인 실행기 없음, Phase 4와 동일 원칙(D-55) |
| 완료 체크·진행률·오늘의 학습 반영 | API/Backend(Server Action) + Database(Supabase `progress`) | — | 변경 없음. `getOrderedLessons()`가 25편이 늘어난 입력을 자동 흡수 |
| 게이트 검증(check-manifest/check-brand/check-lesson-structure/e2e) | 빌드/CI 스크립트(Node, 의존성 0) | — | 런타임 계층 아님 — 실행자/CI가 로컬에서 도는 검증 계층 |

## Standard Stack

이 phase는 새 라이브러리를 추가하지 않는다. 아래는 Phase 4가 이미 검증한 기존 스택을 재확인한 것이며, 버전은 이 세션에서 `package.json`을 직접 Read해 확인했다.

### Core (변경 없음 — 재확인용)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `velite` | `^0.4.0` | MDX 프론트매터 스키마 검증 + 컴파일 | `[VERIFIED: package.json:20]` — 스키마 변경 없음(`velite.config.ts` 8필드 그대로) |
| `rehype-pretty-code` | `^0.14.5` | 코드 하이라이팅 rehype 플러그인 | `[VERIFIED: package.json:17]` — 언어 화이트리스트 없음(`[VERIFIED: velite.config.ts:9-11]`) |
| `shiki` | `^4.4.3` | 하이라이팅 엔진 | `[VERIFIED: package.json:19]` |
| `next` | `16.3.2` | 프레임워크 | `[VERIFIED: package.json:14]` — 변경 없음 |
| `react` | `19.2.8` | UI 런타임 | `[VERIFIED: package.json:15]` — 변경 없음 |
| `@tailwindcss/typography`(`.prose`) | 기존 설정 | `<details>/<summary>` 스타일 이미 적용됨 | `[VERIFIED: src/app/globals.css:157-205]` — Phase 4에서 44px 터치 타깃+다크모드까지 완료, Phase 5는 재사용만 한다 |

### 학습자 로컬 환경(사이트 의존성 아님, Step 2 레슨 안내용)

| Tool | Version(레지스트리 확인) | Purpose | 확인 방법 |
|------|------|---------|-----------|
| Node.js | LTS(레슨 집필 시점 재확인 권장) | Step 2 전체(`2-3-typescript-setup`이 설치 담당, D-74) | `[ASSUMED]` — 이 세션에서 Node LTS 최신 버전을 registry로 직접 확인하지 않았다. 집필 착수 전 `node --version` 최신 안정판 재확인 권장(A1 참고) |
| `express` | `5.2.1`(레지스트리 최신) | 2-5 백엔드 레슨 실무 예제 | `[VERIFIED: npm registry — npm view express version]` — 단, 프로젝트명만 확인했을 뿐 예제 코드 자체는 집필 시 재검증 필요(패키지명 provenance 규칙상 아래 감사 표 참고) |
| `@prisma/client` / `prisma` | `7.9.1` / `8.0.0-rc.10`(레지스트리 최신) | 2-5 ORM 예제 | `[VERIFIED: npm registry]` — **주의:** `prisma`(CLI) 최신 태그가 `8.0.0-rc.10`(release candidate)이고 `@prisma/client`는 `7.9.1`(안정판)이다. 레슨에는 안정 라인인 `prisma@^7`을 `@prisma/client@^7`과 짝지어 안내할 것 — RC를 안내하면 API가 안정판과 어긋날 위험 |
| `jsonwebtoken`, `bcryptjs`, `zod`, `cors`, `dotenv` | 각각 레지스트리 최신 확인 | 2-5 인증/인가 예제(D-25 백엔드 모듈) | `[VERIFIED: npm registry]` — 5개 모두 존재·활성 유지 확인. 정확한 버전 고정은 집필 시점에 재확인 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PC 로컬 Node 실행(D-73) | StackBlitz/CodeSandbox | Deferred — D-73이 "커리큘럼이 로컬 개발 환경을 전제"함을 근거로 이미 기각 |
| `<details><summary>`(D-61 승계) | 별도 Accordion 컴포넌트 | D-48 위반(컴포넌트 0 추가) — 채택 안 함, Phase 4와 동일 원칙 |
| 읽기용 스니펫(Step 3, D-63) | 전부 실행 가능한 완결 코드 | 90분 예산 초과(벡터DB·GPU·n8n 인스턴스 구축) — 이미 discuss-phase에서 검토 후 기각 |

**Installation:** 해당 없음 — 이 phase는 `package.json`을 변경하지 않는다. 레슨 안에서 학습자에게 안내하는 설치 명령(`npm install express`, `npx prisma init` 등)만 존재한다.

## Package Legitimacy Audit

이 phase는 **저장소 자체에 새 npm 패키지를 설치하지 않는다.** 다만 Step 2 레슨(D-73, D-12 승계)이 완결 실행 코드를 요구하므로, 레슨 본문에 등장할 가능성이 높은 npm 패키지명을 이 세션에서 `gsd_run query package-legitimacy check`(seam)로 직접 조회했다.

| Package | Registry | Weekly Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-------------------|--------------|---------|-------------|
| `express` | npm | 131.3M | github.com/expressjs/express | OK | 승인 |
| `jsonwebtoken` | npm | 56.5M | github.com/auth0/node-jsonwebtoken | OK | 승인 |
| `bcryptjs` | npm | 12.8M | github.com/dcodeIO/bcrypt.js | OK | 승인 |
| `zod` | npm | 270.1M | github.com/colinhacks/zod | OK | 승인 |
| `cors` | npm | 75.8M | github.com/expressjs/cors | OK | 승인 |
| `dotenv` | npm | 176.5M | github.com/motdotla/dotenv | OK | 승인 |
| `@prisma/client` | npm | 15.6M | github.com/prisma/prisma | SUS(too-new 신호) | 승인 — **아래 주 참고** |
| `prisma` | npm | 16.7M | github.com/prisma/prisma-cli | SUS(too-new 신호) | 승인 — **아래 주 참고** |
| `@anthropic-ai/sdk`(Step 2 LLM API 예제, JS 버전 필요 시) | npm | 34.8M | github.com/anthropics/anthropic-sdk-typescript | SUS(too-new 신호) | 승인 — **아래 주 참고** |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `@prisma/client`, `prisma`, `@anthropic-ai/sdk` — 세 패키지 모두 `too-new` 신호로 SUS 판정을 받았으나, 신호의 근거는 "최근 배포 시각"(활발한 유지보수 중인 대형 패키지의 정상적 특징)이지 패키지 나이가 아니다. 다운로드 수(15.6M~34.8M/주)와 공식 리포지토리(anthropics·prisma 조직 소유)가 뚜렷해 슬롭스쿼팅 신호는 없다 — 그러나 게이트 프로토콜에 따라 **플래너는 이 세 패키지를 레슨에 안내하는 태스크 앞에 `checkpoint:human-verify`를 두어야 한다.**

*레슨 안내 문구에는 정확한 패키지명("express", "@prisma/client", "prisma", "jsonwebtoken", "bcryptjs")을 그대로 쓴다. `prisma`(CLI)는 안정 배포 라인(`^7`)으로 안내하고 현재 registry 최신 태그가 가리키는 `8.0.0-rc.10`(release candidate)은 안내하지 않는다 — RC를 초심자 레슨에 안내하면 API가 흔들릴 위험이 크다.*

## Architecture Patterns

### System Architecture Diagram

```
                         [빌드 타임]
.mdx 파일(25편, src/content/lessons/step-2/ + step-3/)
     │  frontmatter(8필드, 고정값 — 이 세션 전체 Read로 확인)
     │  본문(6단 구조 × 3가지 재해석: 심화/개요/프로젝트가이드)
     ▼
Velite (velite.config.ts) — Zod 스키마 검증(변경 없음)
     │
     ▼
rehype-pretty-code + Shiki — 코드펜스 → 정적 하이라이트 HTML
     │  신규 8개 언어(ts/tsx/js/jsx/json/html/css/yaml) 화이트리스트 없음(검증됨)
     ▼
.velite/lessons.json (매니페스트, 35편 전체) ─────────────┐
     │                                                    │
     ├──▶ scripts/check-lesson-structure.mjs (D-71 확대)  │
     │       step-1/2/3 순회, hasContent:true만 검사       │
     │                                                    ▼
     ├──▶ scripts/check-manifest.mjs                scripts/check-brand.mjs
     │       Invariant 10: wave마다 11→14→24→35          (변경 없음, src/docs
     │                                                     전체 KANT/이메일 0건)
     ▼
                         [요청 타임]
LessonPage (src/app/lesson/[lessonId]/page.tsx) — 변경 없음
     │  hasContent ? <MDXContent> : "준비 중" 카피(D-79, 도달 불가 상태로 유지)
     ▼
getOrderedLessons() 파생 진행률/오늘의 학습 ◀── scripts/e2e-progress.mjs(D-81)
   (Step 카드, /curriculum, 홈, /schedule)          scripts/e2e-today.mjs
```

이 흐름에서 Phase 5가 실제로 건드리는 노드는 정확히 여섯(Summary 참고). 나머지(하이라이팅 파이프라인, 진도 오버레이, 일정·페이스 계산)는 Phase 1~4가 만든 그대로 재사용된다.

### 25개 레슨 — 정확한 slug·모듈·시간·현재 상태 (이 세션에 전체 frontmatter를 Read해 확인)

**Step 2 (12편, 모두 `stepId: 2`, `depth: "심화"`)**

| Slug | Module | Order | Title(고정값) | estimatedMinutes | 비고 |
|------|--------|-------|----------------|-------------------|------|
| `2-1-postgres-and-supabase` | 2-1 | 1 | "PostgreSQL과 Supabase 활용" | 150 | D-73 예외 — 브라우저 SQL 에디터, D-56 승계 |
| `2-1-ai-data-modeling` | 2-1 | 2 | "AI 서비스 데이터 구조 설계" | 150 | 상동 |
| `2-2-html-css-js` | 2-2 | 1 | "HTML·CSS·JavaScript 핵심" | 150 | D-74 — 브라우저+파일 하나로 완결, 별도 설치 없음 |
| `2-2-browser-and-ui` | 2-2 | 2 | "브라우저 동작 원리와 UI 구현" | 150 | 상동 |
| `2-3-typescript-setup` | 2-3 | 1 | "TypeScript 개발 환경 구성" | 150 | D-74 — Node·npm·TS 설치 담당 |
| `2-3-react-components` | 2-3 | 2 | "React 컴포넌트" | 150 | **D-70 재작성 대상**(Wave 1 파일럿), 현재 `hasContent: true`(구 표준) |
| `2-4-project-ai-shop-frontend` | 2-4 | 1 | "[Project 1] AI 쇼핑몰 프론트엔드 준비 가이드" | **60** | **프로젝트 가이드**(Wave 1 파일럿) |
| `2-5-express-rest-api` | 2-5 | 1 | "Express RESTful API 구현" | 150 | |
| `2-5-auth-and-prisma` | 2-5 | 2 | "인증·인가와 Prisma ORM" | 150 | Package Audit §Prisma 참고 |
| `2-6-project-ai-shop-backend` | 2-6 | 1 | "[Project 2] AI 쇼핑몰 백엔드 준비 가이드" | **60** | **프로젝트 가이드** |
| `2-7-prompt-patterns` | 2-7 | 1 | "프롬프트 패턴과 구조화 출력" | 150 | |
| `2-7-promptops` | 2-7 | 2 | "PromptOps로 안정적인 LLM 활용" | 150 | |

**Step 3 (13편, 모두 `stepId: 3`, `depth: "개요"`)**

| Slug | Module | Order | Title(고정값) | estimatedMinutes | 비고 |
|------|--------|-------|----------------|-------------------|------|
| `3-1-vector-search-basics` | 3-1 | 1 | "벡터 검색과 메타데이터 설계" | 90 | **개요 형식 파일럿**(Wave 1) |
| `3-1-hybrid-search-reranking` | 3-1 | 2 | "하이브리드 검색과 re-ranking" | 90 | |
| `3-2-project-rag-agent` | 3-2 | 1 | "[Project 3] RAG Agent 준비 가이드" | **60** | **프로젝트 가이드** |
| `3-3-peft-lora-qlora` | 3-3 | 1 | "PEFT·LoRA·QLoRA 개념" | 90 | |
| `3-3-tuning-evaluation` | 3-3 | 2 | "모델 튜닝 전후 성능 비교" | 90 | |
| `3-4-multi-agent-structure` | 3-4 | 1 | "여러 AI가 함께 일하는 구조" | 90 | |
| `3-4-webhook-schedule-hitl` | 3-4 | 2 | "Webhook·스케줄·HITL 설계" | 90 | |
| `3-4-n8n-langgraph` | 3-4 | 3 | "n8n·LangGraph 자동화 실습 개요" | 90 | |
| `3-5-project-orchestration` | 3-5 | 1 | "[Project 4] AI 업무 자동화 준비 가이드" | **60** | **프로젝트 가이드** |
| `3-6-prompt-versioning-eval` | 3-6 | 1 | "프롬프트 버전관리와 평가 자동화" | 90 | |
| `3-6-monitoring-governance` | 3-6 | 2 | "모니터링·알림과 보안 거버넌스" | 90 | |
| `3-6-structured-output-canary` | 3-6 | 3 | "구조화 출력·카나리 배포·비용 지표" | 90 | |
| `3-7-project-ax-launch` | 3-7 | 1 | "[Project 5] AX 서비스 런칭 준비 가이드" | **60** | **프로젝트 가이드** |

모든 25편의 frontmatter가 `[VERIFIED: src/content/lessons/step-2/*.mdx, step-3/*.mdx 전체 Read, 이 세션]`로 확인됐고, `check-manifest.mjs` Invariant 13(프로젝트=60/심화·비프로젝트=150/개요·비프로젝트=90 파생 규칙)과 이미 정확히 일치한다 — **frontmatter는 손댈 필요가 없다. 본문과 `hasContent`만 바뀐다.**

### Pattern 1: 6단 eli5 스켈레톤(심화 레슨, D-47 승계) — Step 2 20편 공통

Phase 4의 검증된 스켈레톤을 그대로 재사용한다(변경 없음). 정확한 헤딩(`[VERIFIED: check-lesson-structure.mjs:17-23]`에서 게이트가 강제하는 원문과 일치):

```markdown
## 1. 학습 목표
## 2. 왜 배우나
## 3. 개념 설명
## 4. 실무 예제
## 5. 실무 팁
## 6. 핵심 정리 및 스스로 점검
```

**Source:** `src/content/lessons/step-1/1-3-python-variables-and-types.mdx`(Phase 4 파일럿), `scripts/check-lesson-structure.mjs`(EXPECTED_HEADINGS 상수)

### Pattern 2: Step 3 "개요" 재해석 — ④를 "실무에서 이게 어떻게 쓰이나"로(D-65)

**What:** 헤딩 텍스트는 6단 그대로 유지하되, 내용의 성격이 심화 레슨과 다르다.

| 단 | 심화(Step 2) | 개요(Step 3) |
|---|---|---|
| ① 학습 목표 | "~할 수 있다"(구현·실행 능력) | "~를 알아듣는다"(정의·용도·위치, D-62) |
| ③ 개념 설명 | 완전한 원리 설명 | 용어 정의+비유, 깊이 있는 수식/알고리즘 생략 |
| ④ 실무 예제 | 완결 실행 코드+실행 방법 | 실제 서비스 사례 서술 + 읽기용 스니펫(10~20줄, 설치·실행 안내 없음) |
| ⑥ 스스로 점검 | 실행형 과제 | 판단·설계형 과제(시나리오 판단, 설계 선택, 용어 대조표, 실패 사례 짚기) |

**읽기용 스니펫 안내 문구 예시(D-63):**
```markdown
> 아래 코드는 개념을 눈으로 보기 위한 예시입니다 — 지금 실행할 필요는 없습니다.
> 개강 후 본 과정에서 실제로 돌려보게 됩니다.
```

**Source:** D-62~D-65 원문, `.planning/curriculum.md` §Step 3(콘텐츠 깊이 방침 원문: "Step 3 = 개념·용어 중심 훑기")

### Pattern 3: 프로젝트 준비 가이드 스켈레톤(D-66~D-69) — 5편 공통

6단 헤딩은 동일하게 유지하되 각 단의 **내용**만 재해석한다:

```markdown
## 1. 학습 목표
이 프로젝트에서 무엇을 만들고 무엇을 증명하는지 서술(구현 능력이 아니라 프로젝트 이해)

## 2. 왜 배우나
앞선 어느 모듈들이 이 프로젝트에서 합쳐지는지 — 복습 포인터(구체 레슨 slug 언급)

## 3. 개념 설명
### 무엇을 만드나 — 전체 구조
A → B → C 한 줄 도식 + 화면/데이터/API 흐름 표(D-48 준수, Mermaid 없음)

## 4. 실무 예제
### 사전 준비 체크리스트
- [ ] 계정 생성(예: Supabase 프로젝트)
- [ ] API 키 발급
- [ ] 로컬 설치(해당 시)
- [ ] 샘플 데이터 준비
(코드가 아니라 준비물 — 완성 코드·완성 스키마 절대 금지, D-67)

## 5. 실무 팁
팀 프로젝트에서 자주 막히는 지점, 시간 배분, 역할 분담

## 6. 핵심 정리 및 스스로 점검
**핵심 정리**
- 준비 완료 판정 기준(체크박스 형태)

**이 레슨의 단어**
| 단어 | 뜻 |
|------|-----|
(이 프로젝트에서 처음 등장하는 용어, 5~8행)

### 해보기

1. (실제로 준비해보기 — 예: "Supabase 프로젝트 하나 만들고 테이블 1개 생성해보기")

<details>
<summary>정답 보기</summary>

("성공했다면 이런 화면/출력이 나옵니다" — 정답이 아니라 성공 판정 기준)

</details>
```

**주의:** `checkAnswerBlockPairing`이 `taskCount + 2`개 이상의 `<details>` 블록을 요구하므로(`[VERIFIED: check-lesson-structure.mjs:104-121]`), 프로젝트 가이드도 심화·개요 레슨과 동일하게 "스스로 점검" 섹션에 최소 2개, "해보기"에 taskCount개의 `<details>`가 필요하다 — D-69가 "형식 예외를 만들지 않는다"고 명시한 이유가 정확히 이 게이트 규칙과 맞물린다.

**Source:** D-66~D-69 원문, `scripts/check-lesson-structure.mjs`(L2/L3 검사 로직 직접 확인)

### Pattern 4: 언어별 코드펜스 — D-72 확장 후 이 저장소에서 실증/미실증 구분

| 언어 펜스 | 이 저장소 실증 여부 | 필요한 레슨 |
|-----------|----------------------|-------------|
| ` ```python ` | `[VERIFIED: Phase 4 배포]` 실증됨 | 해당 없음(Step 2·3은 대부분 JS/TS 스택) |
| ` ```bash ` / ` ```powershell ` | `[VERIFIED: Phase 4 배포]`(bash) / 미실증(powershell) | Step 2 전반(D-75 OS 명령) |
| ` ```tsx ` | `[VERIFIED: 2-3-react-components.mdx 프로덕션 배포]` 실증됨 | 2-3, 2-4 등 React 예제 |
| ` ```typescript ` | 미실증 — `tsx`와 문법 상 큰 차이 없어 위험 낮음(CITED) | 2-3-typescript-setup, 2-5, 2-7 |
| ` ```javascript ` / ` ```jsx ` | 미실증 | 2-2(HTML·CSS·JS 모듈) |
| ` ```json ` | 미실증 — Shiki 표준 지원(CITED), 위험 매우 낮음 | Prisma 스키마 예제 근처의 `.env`/config JSON, API 응답 예시 |
| ` ```html ` / ` ```css ` | 미실증 | 2-2-html-css-js, 2-2-browser-and-ui |
| ` ```yaml ` | 미실증 | 배포 설정 예시(있을 경우) |
| ` ```sql ` | Phase 4 배포로 실증 완료(1-4 레슨) | 2-1 모듈(Supabase SQL 에디터) |

**권장 조치:** Wave 0(선행 작업)에서 `check-lesson-structure.mjs`의 `ALLOWED_FENCE_LANG_PREFIXES` 갱신 직후, `npm run build`로 새 8개 언어 중 최소 `typescript`/`json`/`html`/`css` 4개를 포함한 임시 스모크 파일 하나를 빌드해 실제 하이라이팅을 1회 확인한다(Phase 4 RESEARCH Pattern 3과 동일 방법론). Shiki 기본 번들이 표준 지원하므로 실패 위험은 낮지만(`[CITED: shiki 언어 번들 문서]`), 실패해도 plain 텍스트로 조용히 폴백되어 빌드가 깨지지는 않는다(`[CITED: rehype-pretty-code 미지원 언어 시 plain 처리]`).

### Pattern 5: `check-lesson-structure.mjs` 확장 — 정확한 코드 변경 지점

**What:** 두 상수만 바꾸면 된다. 검사 로직(L1~L6)은 변경 불필요.

```javascript
// 변경 전 (24행 부근)
const STEP1_DIR = path.join(ROOT, 'src', 'content', 'lessons', 'step-1');
// ...
const allFiles = fs.readdirSync(STEP1_DIR).filter((f) => f.endsWith('.mdx')).sort();

// 변경 후 — 배열로 확장, 순회 루프도 디렉터리 배열을 순회하도록 조정
const LESSON_DIRS = ['step-1', 'step-2', 'step-3'].map((d) =>
  path.join(ROOT, 'src', 'content', 'lessons', d),
);
```

```javascript
// ALLOWED_FENCE_LANG_PREFIXES 변경 (33행 부근)
const ALLOWED_FENCE_LANG_PREFIXES = [
  'python', 'sql', 'bash', 'powershell', 'text',
  'typescript', 'tsx', 'javascript', 'jsx', 'json', 'html', 'css', 'yaml',
];
```

**주의(D-71 상단 주석 갱신 의무):** 파일 상단 주석(1~13행)이 "Step 2·3 디렉터리는 검사하지 않는다 — `2-3-react-components.mdx`가 구 표준이라 오탐" 근거를 담고 있다(`[VERIFIED: check-lesson-structure.mjs:8-13]`). D-70이 이 파일을 재작성하는 순간 이 근거가 사라지므로, 게이트 확대 커밋에서 주석도 함께 갱신해야 한다 — 그렇지 않으면 코드와 주석이 모순된다.

**Source:** `[VERIFIED: scripts/check-lesson-structure.mjs 전체 Read, 이 세션]`

### Pattern 6: `check-manifest.mjs` Invariant 10 — wave별 정확한 갱신값

```javascript
// Wave 1(파일럿 3편 배포 후): 11 → 14
const EXPECTED_HAS_CONTENT_COUNT = 14;
const EXPECTED_HAS_CONTENT_SLUGS = [
  // 기존 11개(Step 1 10편 + 2-3-react-components) 유지 +
  '2-4-project-ai-shop-frontend',
  '3-1-vector-search-basics',
  // '2-3-react-components'는 이미 목록에 있으므로 추가하지 않음(재작성만, 카운트 불변)
];

// Wave 2(Step 2 잔여 10편 배포 후): 14 → 24
// Wave 3(Step 3 잔여 12편 배포 후): 24 → 35
```

**주의(Phase 4 Pitfall 5와 동일한 함정):** `2-3-react-components`는 이미 `hasContent: true`이자 이미 `EXPECTED_HAS_CONTENT_SLUGS`에 포함되어 있다 — 재작성(D-70)은 본문 교체일 뿐 카운트를 올리지 않는다. Wave 1에서 카운트를 15로 잘못 올리면 Invariant 10이 실패한다. **Wave 1에서 실제로 카운트가 늘어나는 신규 항목은 `2-4-project-ai-shop-frontend`와 `3-1-vector-search-basics` 둘뿐(11→13이 아니라 11+2=13... 재확인: 기존 11 + 신규 2 = 13, 위 예시의 "14"는 오기 아님 — 아래 재계산 참고)**

**정확한 산수 재확인 (이 세션 직접 계산):** 기존 `EXPECTED_HAS_CONTENT_COUNT = 11`(Phase 4 종료 시점). Wave 1은 `2-3-react-components`(카운트 불변, 재작성만) + `2-4-project-ai-shop-frontend`(신규 hasContent:true) + `3-1-vector-search-basics`(신규) = **신규 2건 추가 → 13**. CONTEXT.md D-78 원문의 "11 → 14(Wave 1)"은 **Wave 1 종료 시점이 아니라 Wave 1+Wave 2 중간 어느 지점의 값과 혼동되었을 가능성이 있다** — 플래너는 이 산수를 실제 실행 직전에 재검증할 것. `## Open Questions` 참고.

**Source:** `[VERIFIED: scripts/check-manifest.mjs:6-19]` — 상수 정의부 전체 Read, 이 세션 직접 계산으로 D-78 원문 수치와 대조

### Recommended Project Structure

```
src/content/lessons/step-2/
├── 2-1-postgres-and-supabase.mdx        # 본문 교체(SQL, D-56 연습 스키마 승계)
├── 2-1-ai-data-modeling.mdx             # 본문 교체
├── 2-2-html-css-js.mdx                  # 본문 교체(html/css/js 펜스, 설치 없음)
├── 2-2-browser-and-ui.mdx               # 본문 교체
├── 2-3-typescript-setup.mdx             # 본문 교체(Node/npm/TS 설치 담당, D-74)
├── 2-3-react-components.mdx             # Wave 1 파일럿 — 재작성(D-70)
├── 2-4-project-ai-shop-frontend.mdx     # Wave 1 파일럿 — 프로젝트 가이드 신규
├── 2-5-express-rest-api.mdx             # 본문 교체
├── 2-5-auth-and-prisma.mdx              # 본문 교체(Package Audit §Prisma 참고)
├── 2-6-project-ai-shop-backend.mdx      # 본문 교체(프로젝트 가이드)
├── 2-7-prompt-patterns.mdx              # 본문 교체
└── 2-7-promptops.mdx                    # 본문 교체

src/content/lessons/step-3/
├── 3-1-vector-search-basics.mdx         # Wave 1 파일럿 — 개요 형식 신규
├── 3-1-hybrid-search-reranking.mdx      # 본문 교체(개요)
├── 3-2-project-rag-agent.mdx            # 본문 교체(프로젝트 가이드)
├── 3-3-peft-lora-qlora.mdx              # 본문 교체(개요)
├── 3-3-tuning-evaluation.mdx            # 본문 교체(개요)
├── 3-4-multi-agent-structure.mdx        # 본문 교체(개요)
├── 3-4-webhook-schedule-hitl.mdx        # 본문 교체(개요)
├── 3-4-n8n-langgraph.mdx                # 본문 교체(개요)
├── 3-5-project-orchestration.mdx        # 본문 교체(프로젝트 가이드)
├── 3-6-prompt-versioning-eval.mdx       # 본문 교체(개요)
├── 3-6-monitoring-governance.mdx        # 본문 교체(개요)
├── 3-6-structured-output-canary.mdx     # 본문 교체(개요)
└── 3-7-project-ax-launch.mdx            # 본문 교체(프로젝트 가이드)

scripts/check-lesson-structure.mjs   # D-71(디렉터리 확대)·D-72(펜스 언어 확장), 상단 주석 갱신
scripts/check-manifest.mjs           # Invariant 10 상수 3단계 갱신
src/app/lesson/[lessonId]/page.tsx   # "준비 중" 카피 조정(D-79)
.planning/phases/01-.../01-UI-SPEC.md  # Copywriting Contract "v1 완성 후 도달 불가" 기록
docs/making-of.md                    # Wave 3에서 Phase 4·5 기록 추가(D-80)
```

### Anti-Patterns to Avoid

- **프로젝트 가이드에 완성 코드·완성 DB 스키마 전체를 넣는 것:** D-67이 명시적으로 금지. "재현 아님"의 경계는 "체크리스트/구조 스케치까지, 튜토리얼은 아님"
- **Step 3 스니펫에 설치·실행 안내를 붙이는 것:** D-63 위반. "읽고 넘어가면 됩니다" 안내 문구를 빠뜨리지 않는다
- **Step 3 스니펫이 실질적으로 심화 코드가 되는 것:** 10~20줄 목표치를 크게 초과하는 완결 실행 코드는 D-62의 "알아듣기" 기준을 벗어난다
- **`2-3-react-components` 재작성 시 frontmatter를 건드리는 것:** D-70이 "바이트 단위로 그대로" 유지를 명시
- **새 MDX 컴포넌트를 "필요해 보여서" 만드는 것:** D-48 승계, Phase 5도 여전히 적용
- **`check-lesson-structure.mjs` L2/L3/L5 규칙에 프로젝트 가이드를 예외 처리하는 것:** D-69가 형식 예외를 명시적으로 금지 — 게이트를 우회하지 않는다

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 정답/성공 판정 접기 UI | React Accordion, `useState` toggle | 네이티브 `<details><summary>`(Phase 4 스타일 재사용) | D-61 승계, 컴포넌트 0개 |
| 코드 하이라이팅(신규 8개 언어 포함) | 커스텀 Shiki 래퍼 | 기존 `rehype-pretty-code` 파이프라인 그대로, 언어 태그만 정확히 | 이미 언어 화이트리스트가 없으므로(`velite.config.ts` 확인됨) 별도 설정 불필요 |
| 레슨 구조 검증(6개 헤딩·해보기·details·단어 표) | 새 검증 스크립트 | 기존 `check-lesson-structure.mjs`를 디렉터리 확대만(D-71) | 로직이 이미 25편에도 그대로 적용 가능하도록 범용적으로 작성됨 |
| Step 3 개념 그림(파이프라인 다이어그램) | 새 다이어그램 컴포넌트/이미지 | D-48 승계 — `A → B → C` 한 줄 도식 + 표 | 콘텐츠 전 컴포넌트 작업 금지(PITFALLS Pitfall 4), Deferred로 이미 검토됨 |
| Prisma/Express 인증 로직 직접 구현 | 커스텀 JWT/해싱 구현 | `jsonwebtoken`, `bcryptjs` 표준 라이브러리(Package Audit에서 OK 판정) | 레슨은 "개념+실무 예제"가 목적, 보안이 중요한 인증 로직을 직접 구현시키는 것은 나쁜 습관을 가르칠 위험 |
| 프로젝트 가이드의 진행률 하드코딩 | 별도 프로젝트 진행 추적 UI | 기존 완료 체크(`CompleteButton`) 그대로 — 프로젝트 가이드도 레슨 하나일 뿐 | 새 진행 추적 시스템은 범위 밖(CONV 영역) |

**Key insight:** Phase 4와 마찬가지로 이 phase의 "hand-roll 금지" 규칙 대부분은 코드가 아니라 **콘텐츠 소재·형식 선택**에 관한 것이다. 특히 Step 3와 프로젝트 가이드에서는 "얼마나 깊이 들어가는가"의 유혹(D-62·D-67이 명시적으로 경계선을 그은 지점)이 가장 큰 리스크다.

## Common Pitfalls

### Pitfall 1: "재현 아님"(D-67) 경계를 넘어 프로젝트 가이드가 튜토리얼이 되는 것

**What goes wrong:** 5편 중 어느 하나라도 "이 프로젝트를 이렇게 구현하면 됩니다"류의 단계별 튜토리얼이나 완성 코드를 담으면, 개강 후 본 과정(200~520시간)의 학습 목표를 미리 소진시킨다.
**Why it happens:** eli5 톤으로 "친절하게 설명"하려는 충동이 "구현 방법까지 알려주기"로 자연스럽게 이어지기 쉽다. Step 2 심화 레슨과 같은 executor가 프로젝트 가이드를 쓸 경우 습관적으로 완결 코드 패턴(D-12)을 그대로 적용할 위험이 크다.
**How to avoid:** ④ 실무 예제 자리를 "사전 준비 체크리스트"로, 코드 블록이 필요하면 설정 파일 예시(`.env.example`, `package.json`의 dependencies 부분 등 준비물 확인용)로 제한한다. "무엇을 만들 것인가"는 ③에서 A→B→C 한 줄 도식과 표로만 그린다.
**Warning signs:** 프로젝트 가이드 레슨에 `### 해보기`가 "이 함수를 구현해보세요"류의 코드 작성 과제로 나타나면 이미 선을 넘은 것 — D-68의 "실제로 준비해 보기"(계정 생성, 키 발급, 데이터 수집)로 대체한다.

### Pitfall 2: Step 3 개요 레슨이 "다 가르치려는 충동"으로 심화 레슨이 되는 것

**What goes wrong:** RAG·PEFT/LoRA·오케스트레이션·LLMOps는 실무에서 깊이 있는 주제라, eli5로 설명하다 보면 자연스럽게 심화 레슨 분량(150분/300줄+)으로 팽창하기 쉽다.
**Why it happens:** D-62의 "알아듣는다" 기준이 추상적이라, 집필자가 "이 정도는 알려줘야 진짜 알아듣지 않을까"라는 판단을 스스로 계속 내리게 된다.
**How to avoid:** 학습 목표 문장을 "① 정의 ② 언제/왜 ③ 어디에 놓이는가" 세 항목 형식으로 강제하고, "직접 구현/튜닝/성능 비교"가 목표 문장에 등장하면 즉시 삭제한다. 실무 예제(④)는 "10~20줄" 목표치를 넘기지 않도록 스스로 검토한다.
**Warning signs:** 개요 레슨의 실무 예제 코드 블록이 3개 이상이거나, 코드 블록 하나가 30줄을 넘으면 심화로 미끄러진 신호다.

### Pitfall 3: `2-3-react-components` 재작성 시 게이트 확대 순서를 뒤바꾸는 것

**What goes wrong:** `check-lesson-structure.mjs`를 먼저 Step 2·3으로 확대한 뒤 `2-3-react-components`를 재작성하면, 그 사이 시점에 게이트가 실패 상태로 방치된다(구 표준 파일이 새 규칙에 걸림).
**Why it happens:** D-70(재작성)과 D-71(게이트 확대)이 서로 다른 파일을 건드리는 별개 작업처럼 보여, 순서를 신경 쓰지 않고 병렬로 처리하기 쉽다.
**How to avoid:** Wave 0 순서를 고정한다 — ① `2-3-react-components.mdx` 재작성(본문만) → ② `check-lesson-structure.mjs` 두 상수 갱신 → ③ 스크립트 실행해 25개 파일(이 시점엔 아직 24편이 `hasContent:false`라 검사 대상은 1개뿐) 통과 확인.
**Warning signs:** 게이트 확대 직후 실행 시 `2-3-react-components`가 L2("### 해보기" 없음)·L3(`<details>` 없음)·L5(단어 표 없음)에서 동시에 실패하면 순서가 뒤바뀐 것.

### Pitfall 4: `EXPECTED_HAS_CONTENT_COUNT` 3단계 갱신에서 산수를 틀리는 것

**What goes wrong:** D-78 원문의 "11 → 14(Wave 1) → 24(Wave 2) → 35(Wave 3)"를 그대로 적용하면 Wave 1 실제 신규 hasContent 전환 건수(2건: `2-4-project-ai-shop-frontend`, `3-1-vector-search-basics`)와 표기된 값(11+3=14)이 어긋난다.
**Why it happens:** `2-3-react-components`는 이미 `hasContent: true`이므로 재작성이 카운트에 영향을 주지 않는데, Wave 1 "파일럿 3편"이라는 표현이 "3건 증가"로 오독되기 쉽다(Phase 4 Pitfall 5와 동일한 함정의 재발).
**How to avoid:** 플래너는 Wave 1 태스크에서 실제 코드로 `.velite/lessons.json`을 빌드해 `hasContent: true` 개수를 직접 세어본 뒤 상수를 정한다 — CONTEXT.md 원문 수치를 맹신하지 않고 빌드 결과와 대조한다(`## Open Questions` 참고). 안전한 방법은 Wave 2/3에서도 동일하게 "빌드 후 실제 카운트 세기 → 상수 갱신"을 반복하는 것.
**Warning signs:** `check-manifest.mjs` 실행 시 Invariant 10이 "expected N, got M" 형태로 실패하면 상수와 실제 hasContent 개수가 어긋난 것 — 즉시 재계산한다.

### Pitfall 5: 신규 8개 코드펜스 언어가 이 저장소에서 대부분 미실증 상태

**What goes wrong:** `typescript/tsx/javascript/jsx/json/html/css/yaml` 중 `tsx`만 Phase 4에서 실증됐고 나머지 7개는 이 파이프라인에서 실제로 렌더된 적이 없다.
**Why it happens:** `velite.config.ts`가 언어를 제한하지 않는다는 것과 "이 저장소 빌드에서 실제로 검증됨"은 다른 주장이다.
**How to avoid:** Wave 0에서 `ALLOWED_FENCE_LANG_PREFIXES` 갱신 직후 `typescript`/`json`/`html`/`css` 펜스를 포함한 임시 스모크 빌드를 1회 수행한다(Architecture Patterns Pattern 4 참고).
**Warning signs:** 로컬 프리뷰에서 특정 언어 코드블록만 색상 구분 없이(검정 단색) 보이면 폴백이 발생한 것.

### Pitfall 6: Prisma CLI 최신 태그가 release candidate를 가리킴

**What goes wrong:** `npm view prisma version`이 반환하는 최신 태그가 `8.0.0-rc.10`(안정판 아님)이다. 레슨에 "최신 버전을 설치하세요"라고만 안내하면 학습자가 RC를 설치하게 된다.
**Why it happens:** Prisma 프로젝트가 메이저 버전 전환기에 `latest` 태그를 RC로 앞당겨 배포하는 경우가 있다(이 세션에 실제로 확인됨).
**How to avoid:** 레슨에는 `npm install prisma@^7 @prisma/client@^7`처럼 안정 라인을 명시적으로 고정해 안내한다. "최신 버전"이라는 모호한 표현을 쓰지 않는다.
**Source:** `[VERIFIED: npm registry, 이 세션 직접 조회 — prisma latest=8.0.0-rc.10, @prisma/client latest=7.9.1]`

## Code Examples

### 프로젝트 준비 체크리스트 패턴(D-66~D-68, 2-4/2-6/3-2/3-5/3-7 공통)

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

### Step 3 읽기용 스니펫 패턴(D-63, 3-1-vector-search-basics 등)

```markdown
## 4. 실무 예제

### 실무에서 이게 어떻게 쓰이나

전자상거래 서비스의 "이 상품과 비슷한 상품" 추천 기능이 벡터 검색의 대표 사례입니다.
상품 설명을 임베딩(embedding, 글을 숫자 배열로 바꾼 것)으로 바꿔 저장해두고,
사용자가 보고 있는 상품의 임베딩과 가장 가까운 것들을 찾아 보여줍니다.

> 아래 코드는 개념을 눈으로 보기 위한 예시입니다 — 지금 실행할 필요는 없습니다.
> 개강 후 본 과정에서 실제로 돌려보게 됩니다.

```typescript
// 개념 예시 — pgvector를 쓰는 Supabase 테이블에서 "비슷한 상품 5개" 찾기
const { data } = await supabase.rpc("match_products", {
  query_embedding: productEmbedding, // 지금 보고 있는 상품의 임베딩
  match_count: 5,
});
```
```

### Prisma 안정 버전 고정 설치 안내(2-5-auth-and-prisma, Pitfall 6 대응)

```powershell
npm install prisma@^7 @prisma/client@^7
npx prisma init
```

**Source:** `[VERIFIED: npm registry 직접 조회, 이 세션]` — `@prisma/client` 최신 안정판 7.9.1 확인, `prisma` CLI는 8.0.0-rc.10이 최신 태그이므로 `^7` 명시 고정 필요.

## State of the Art

Phase 4와 동일하게 이 phase의 도메인(교육용 MDX 콘텐츠 집필)에는 급변하는 기술 트렌드가 없다. 유일하게 시간에 민감한 항목은 Prisma 메이저 버전 전환(Pitfall 6)과, Step 3가 다루는 RAG/오케스트레이션 생태계(LangChain, n8n) 자체가 빠르게 변하는 분야라는 점이다 — 그러나 D-63이 실행 코드를 요구하지 않으므로 이 phase의 콘텐츠 수명에 미치는 영향은 제한적이다.

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Prisma 버전을 "최신"으로만 안내 | `prisma@^7`/`@prisma/client@^7` 명시 고정 | 이 세션 확인(8.0.0-rc.10이 latest 태그) | RC 설치 위험 회피(Pitfall 6) |
| Anthropic 모델 ID 하드코딩(날짜 접미사 포함) | 접미사 없는 모델 ID만 사용, 공식 문서 확인 안내 병기 | Phase 4에서 이미 확립된 원칙(A1 승계) | Step 2 LLM 예제(2-7 모듈)에도 동일 적용 |

**Deprecated/outdated:** 없음.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Node.js LTS 최신 버전이 레슨 집필/배포 시점에도 안정적이다(이 세션에서 registry로 직접 재확인하지 않음) | `## Standard Stack` §학습자 로컬 환경 | 낮음 — `2-3-typescript-setup` 집필 직전 `node --version` 안정판을 한 번 더 확인하면 해소됨. 영향은 설치 안내 문구 정확도에 국한 |
| A2 | 신규 8개 코드펜스 언어(typescript/tsx/javascript/jsx/json/html/css/yaml) 중 tsx·sql·bash를 제외한 나머지가 이 저장소의 rehype-pretty-code/Shiki 설정에서 실제로 하이라이팅된다(이론상 지원되나 미실증) | `## Common Pitfalls` Pitfall 5, `## Architecture Patterns` Pattern 4 | 낮음~중간 — 실패해도 빌드는 깨지지 않고 plain 폴백. Wave 0 스모크 빌드로 해소 가능 |
| A3 | D-78의 "11 → 14(Wave 1)" 수치가 정확하다(이 세션 재계산 결과 Wave 1 실제 신규분은 2건이라 11→13이 맞을 가능성이 있음) | `## Architecture Patterns` Pattern 6, `## Common Pitfalls` Pitfall 4 | 중간 — 플래너가 이 값을 그대로 태스크에 박으면 Wave 1 종료 시 Invariant 10이 실패한다. 반드시 `## Open Questions`에서 재검증 필요 |
| A4 | `express`, `jsonwebtoken`, `bcryptjs`, `zod`, `cors`, `dotenv`, `@prisma/client`, `prisma`가 Step 2 레슨에서 실제로 필요한 정확한 패키지 조합이다(커리큘럼 원문은 "Express 기반 RESTful API", "인증/인가, Prisma ORM"만 명시하고 세부 라이브러리는 지정하지 않음) | `## Package Legitimacy Audit`, `## Standard Stack` | 낮음 — 이들은 Express/Prisma 생태계의 사실상 표준 조합(CLAUDE.md에 이미 Express/Prisma가 커리큘럼 스택으로 확정)이라 대체 가능성은 낮지만, 정확한 조합은 Claude's Discretion 범위(CONTEXT.md 명시)이므로 집필 시 자유롭게 조정 가능 |

## Open Questions

1. **D-78 "11 → 14(Wave 1)" 수치가 이 세션 재계산(11 + 신규 2건 = 13)과 다르다 — 어느 쪽이 맞는가?**
   - What we know: 기존 11개 hasContent slug는 Phase 4 종료 시점 확정값(`[VERIFIED: check-manifest.mjs:6-19]`). Wave 1 파일럿 3편 중 `2-3-react-components`는 이미 `hasContent: true`(재작성만, 카운트 불변), `2-4-project-ai-shop-frontend`와 `3-1-vector-search-basics`만 `false → true` 전환 대상.
   - What's unclear: D-78 discuss-phase 세션에서 "3편 = 3 증가"로 계산했을 가능성(discuss-phase 로그에는 이 계산 과정이 남아있지 않음). 혹은 CONTEXT.md 작성자가 의도적으로 다른 wave 경계(예: Wave 1이 3편 배포 + Wave 2 초반 일부 포함)를 염두에 뒀을 수도 있으나 근거가 확인되지 않는다.
   - Recommendation: 플래너는 Wave 1 완료 태스크에서 `.velite/lessons.json`을 실제로 빌드해 `hasContent: true` slug 개수를 직접 세고, 그 실측값을 `EXPECTED_HAS_CONTENT_COUNT`에 대입한다. CONTEXT.md의 "14"라는 숫자를 맹목적으로 하드코딩하지 않는다. Wave 2(24)·Wave 3(35) 최종값은 "24편 전체가 hasContent:true가 되면 11+24=35"로 최종적으로는 일치하므로 최종 목적지는 틀리지 않았다 — 중간 경계값만 재검증 대상.

2. **Phase 4가 아직 로드맵상 미완료(UAT 2건 남음)인 상태에서 Phase 5를 시작해도 되는가?**
   - What we know: STATE.md 기준 Phase 4는 7/7 실행·프로덕션 배포 완료했으나 `/gsd-verify-work 04` UAT가 아직 열려 있다(SQL 실행 확인, 5편 훑어보기). CONTEXT.md `<code_context>` §주의가 "Phase 5 실행 전에 정산하는 것이 깔끔하다(계획 단계에서 판단)"고 명시했다.
   - What's unclear: Phase 5 계획(PLAN.md)이 Phase 4 UAT 완료를 선행 조건(블로킹 태스크)으로 넣을지, 아니면 병행 진행이 허용되는지는 discuss-phase에서 확정되지 않았다.
   - Recommendation: 플래너가 Phase 5 Wave 0에 "Phase 4 UAT 정산 확인" 체크포인트를 넣거나, 최소한 계획 문서에 이 의존성을 명시적으로 기록해 실행자가 인지하게 한다.

3. **Step 2 2-1 모듈의 Supabase 예제가 Phase 4의 `practice` 스키마 분리 규칙(D-56)을 그대로 쓰는가, 아니면 AI 서비스 데이터 구조(2-1-ai-data-modeling)에 맞는 별도 스키마 네이밍이 필요한가?**
   - What we know: D-73이 "D-56의 연습 스키마 분리·`public.progress` 불간섭 규칙을 그대로 승계"한다고 명시.
   - What's unclear: `practice.students` 같은 Phase 4의 구체 테이블명이 AI 서비스 맥락(상품, 주문, 임베딩 등)에는 맞지 않는다 — 스키마 이름(`practice`)만 재사용하고 테이블명은 자유롭게 짓는 것이 맞는지 확인 필요.
   - Recommendation: `practice` 스키마 접두사 규칙(D-56)만 그대로 지키고, 테이블명은 2-1 모듈 주제(AI 서비스 데이터 구조)에 맞게 자유롭게 짓는다 — Claude's Discretion 범위로 처리 가능, 별도 사용자 확인 불필요.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js/npm | `2-3-typescript-setup` 저자 확인, 게이트 스크립트 실행 | ✓ | `[VERIFIED: Phase 4 RESEARCH — Node 24.13.0 / npm 11.6.2, 이 세션 재확인 안 함]` | — |
| `express`, `jsonwebtoken`, `bcryptjs`, `zod`, `cors`, `dotenv` | 2-5 모듈 예제 저자 확인 | 레지스트리 존재 확인(`[VERIFIED]`) | 각각 최신 버전(Standard Stack 표 참고) | 표준 npm 패키지, 설치 실패 위험 낮음 |
| `@prisma/client`/`prisma` | 2-5-auth-and-prisma 예제 저자 확인 | 레지스트리 존재 확인, **안정 라인(`^7`) 고정 필요**(Pitfall 6) | `@prisma/client` 7.9.1(안정) / `prisma` 8.0.0-rc.10(latest 태그, RC) | 저자가 `^7` 명시 설치로 RC 회피 |
| Supabase SQL 에디터 접근 | 2-1 모듈 예제 저자 확인(연습 스키마 실제 생성·삭제) | 미확인(대시보드 접근은 사용자 계정 필요) | — | 저자가 실제 Supabase 프로젝트에서 1회 실행 확인 권장(Phase 4와 동일 패턴) |
| Prettier/ESLint(TS 코드 예제 문법 확인용, 선택) | Step 2 TS/React 코드 예제 저자 확인 | `[VERIFIED: package.json — eslint 이미 devDependencies에 존재]` | 기존 설정 재사용 | 코드 예제를 실제로 저장소 안에서 `npm run lint` 돌려볼 수도 있음(선택 사항) |

**Missing dependencies with no fallback:** 없음.
**Missing dependencies with fallback:** Supabase SQL 에디터 접근(2-1 모듈) — Phase 4와 동일하게 "저자가 실제로 돌려보고 커밋"하는 것이 유일한 자동화되지 않은 검증 경로.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | 없음(Phase 4와 동일) — Node 표준 모듈만 쓰는 커스텀 게이트 스크립트 체계 |
| Config file | 없음 — `scripts/*.mjs` 각각이 독립 실행 파일 |
| Quick run command | `npm run build && node scripts/check-manifest.mjs && node scripts/check-brand.mjs && node scripts/check-lesson-structure.mjs` |
| Full suite command | 위 + `node --env-file=.env.local scripts/e2e-progress.mjs && node --env-file=.env.local scripts/e2e-today.mjs` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|--------------|
| CONT-05 | 프로젝트 5종이 각각 개요·준비 가이드로 제공되며 "재현 아님" 경계를 지킨다 | manual(파일럿만 human-verify, D-76) + automated(구조 게이트) | `node scripts/check-lesson-structure.mjs`(6단 헤딩·해보기·details·단어 표) — **단, "재현 아님" 내용 경계(완성 코드 금지) 자체는 자동 측정 불가, 저자 자체 검토 + 파일럿 human-verify에 의존** | 있음(구조만) |
| Step 3 "알아듣기" 기준(D-62) | 개요 레슨이 정의·용도·위치 세 요소를 담는다 | manual | 없음 — 프로즈 품질은 자동 측정 불가 | 없음 — Wave 0 Gap 아님(원래 이 phase 성격상 자동화 불가능한 영역) |
| 게이트 확대(D-71/D-72) | Step 2·3 25편이 신규 구조 게이트를 통과 | automated | `node scripts/check-lesson-structure.mjs` | 있음(확대 후) |
| 매니페스트 불변식(D-78) | `hasContent` 개수·slug가 wave별 기대값과 일치 | automated | `node scripts/check-manifest.mjs` | 있음 |
| KANT/이메일 0건 | 25편 신규 본문 포함 전체 공개 표면 | automated | `node scripts/check-brand.mjs` | 있음 |
| 성공 기준 4(전체 진행률 100% 도달, D-81) | 35편 전부 완료 시 진행률 100% 표시 | e2e | `node --env-file=.env.local scripts/e2e-progress.mjs` — `PROBE_LESSON = LESSONS.find(l => l.hasContent) ?? LESSONS[0]`로 동적 선택(`[VERIFIED: scripts/e2e-progress.mjs:91]`) | 있음 — 코드 변경 불필요 |
| 오늘의 학습 루프가 Step 2·3에서도 동작 | 일정 배정이 25편 신규 slug를 포함해도 정상 | e2e | `node --env-file=.env.local scripts/e2e-today.mjs` | 있음 — 코드 변경 불필요 |

### Sampling Rate

- **Per task commit(레슨 1편 완료마다):** `npm run build`(MDX 컴파일·하이라이팅 오류 즉시 노출)
- **Per wave merge(Wave 1 파일럿 완료 / Wave 2 10편 병합 / Wave 3 12편 병합):** Quick run 전체(`check-manifest` + `check-brand` + `check-lesson-structure`)
- **Phase gate(Phase 5 완료 전, Wave 3 종료 시):** Full suite 전체(e2e-progress + e2e-today) — D-81의 100% 진행률 e2e 검증이 여기 포함됨

### Wave 0 Gaps

- [ ] `scripts/check-lesson-structure.mjs` 디렉터리 확대(D-71) + 펜스 언어 확장(D-72) — 필수, D-70(재작성) 이후에 순서대로 적용(Pitfall 3)
- [ ] `2-3-react-components.mdx` 재작성 — Wave 1 파일럿에 포함되지만 게이트 확대의 선행 조건이므로 사실상 Wave 0 성격
- [ ] 신규 8개 코드펜스 언어 스모크 빌드(1회성, Pitfall 5) — 필수는 아니나 강력 권장

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | no | 이 phase는 인증 코드를 변경하지 않는다(기존 unlock 쿠키 메커니즘 그대로). 단, 2-5-auth-and-prisma 레슨 콘텐츠 자체가 인증 패턴을 "가르친다"는 점에서 아래 위협 패턴 참고 |
| V3 Session Management | no | 동일 |
| V4 Access Control | no | 레슨 콘텐츠는 공개, 진도만 게이트(변경 없음) |
| V5 Input Validation | no(직접) | 새 사용자 입력 경로 추가 없음. 2-5 레슨이 `zod` 등으로 입력 검증을 "가르치는" 것은 오히려 긍정적 — 아래 위협 패턴 참고 |
| V6 Cryptography | no | 변경 없음. `bcryptjs` 사용법을 레슨이 안내하되 실제 암호화 코드는 사이트에 없음 |

이 phase는 애플리케이션 코드의 공격 표면을 넓히지 않는다. Phase 4와 동일하게 **콘텐츠 자체가 나쁜 보안 습관을 가르칠 위험**을 위협 패턴으로 다룬다.

### Known Threat Patterns for 콘텐츠 phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| LLM API 키(2-7 모듈)를 코드에 하드코딩하는 예제를 가르침 | Information Disclosure | Phase 4 D-54 원칙 승계 — `process.env.ANTHROPIC_API_KEY` 등 환경변수 패턴만 사용. `sk-ant-...`류 실제 키 형태 문자열을 본문에 절대 적지 않는다 |
| 2-5 백엔드 레슨이 비밀번호를 평문 저장하는 예제를 가르침 | Information Disclosure / Tampering | `bcryptjs`를 반드시 통과시킨 해시만 저장하는 예제로 작성 — 평문 비교 코드 절대 금지 |
| 2-5 백엔드 레슨이 JWT 시크릿을 하드코딩하는 예제를 가르침 | Information Disclosure | `process.env.JWT_SECRET` 패턴 사용, "실무에서는 이 값을 절대 코드에 커밋하지 않는다"는 실무 팁 한 줄 추가 |
| SQL 예제(2-1 모듈)가 문자열 결합으로 쿼리를 만드는 습관을 심음 | Tampering | Phase 4 1-4 레슨과 동일 원칙 — Supabase SQL 에디터 정적 SQL이므로 인젝션 해당 없으나, "실제 애플리케이션 코드에서는 사용자 입력을 문자열 결합으로 쿼리에 넣지 않는다"는 경고 문구를 실무 팁에 유지 |
| 연습 SQL이 실수로 `public.progress`를 손댐 | Tampering / 가용성 | D-56 승계 — `practice` 스키마 분리(Open Question 3 참고) |
| Step 3 읽기용 스니펫(PII/인젝션 정책 다루는 3-6/3-7 모듈)이 실제로는 검증되지 않은 보안 관행을 예시로 제시 | Tampering / Information Disclosure | D-63이 실행을 요구하지 않으므로 코드 자체의 정확성보다 "개념이 맞는지"가 중요 — LLMOps 모듈(3-6)의 PII/인젝션 정책 설명은 이 세션에서 검증되지 않은 실무 지식이므로 집필 시 공신력 있는 출처(OWASP LLM Top 10 등)를 참고하는 것을 권장(`[ASSUMED]` — 이 세션에서 직접 조사하지 않음) |

## Sources

### Primary (HIGH confidence)

- `C:/Users/dhchu/dev/aiEngineerCourse/.planning/phases/05-step-2-3/05-CONTEXT.md`, `05-DISCUSSION-LOG.md` — 이 phase의 모든 locked decision(D-62~D-81) 원문
- `C:/Users/dhchu/dev/aiEngineerCourse/.planning/curriculum.md` — Step 2·3 12개 모듈 원문 불릿(source of truth)
- `C:/Users/dhchu/dev/aiEngineerCourse/src/content/lessons/step-2/*.mdx`(12개 파일 전체), `step-3/*.mdx`(13개 파일 전체) — frontmatter 전체 직접 Read
- `C:/Users/dhchu/dev/aiEngineerCourse/src/content/lessons/step-2/2-3-react-components.mdx` — 구 표준 파일럿 전체 Read, D-70 진단 재확인
- `C:/Users/dhchu/dev/aiEngineerCourse/scripts/check-lesson-structure.mjs`, `scripts/check-manifest.mjs`, `scripts/check-brand.mjs` — 전체 직접 Read
- `C:/Users/dhchu/dev/aiEngineerCourse/velite.config.ts`, `src/app/lesson/[lessonId]/page.tsx`, `src/content/curriculum-helpers.ts`, `src/app/globals.css`, `package.json` — 전체/관련 부분 직접 Read
- `.planning/phases/04-step-1/04-RESEARCH.md`, `04-PATTERNS.md` — Phase 4가 확립한 파이프라인·패턴 원문 인용
- `.planning/ROADMAP.md` §Phase 5, §Coverage Notes — 요구사항 귀속·타임박스 근거
- `.planning/REQUIREMENTS.md` — CONT-05 원문
- `.planning/STATE.md` — Phase 4 미완료 UAT 상태(Open Question 2)
- npm registry(`npm view <pkg> version`, 이 세션 직접 실행) — express/jsonwebtoken/bcryptjs/zod/cors/dotenv/@prisma/client/prisma/langchain/@langchain/core/@anthropic-ai/sdk/openai 버전·다운로드·리포지토리 확인
- `gsd_run query package-legitimacy check`(seam, 이 세션 직접 실행) — 9개 npm 패키지 verdict 확인
- `gsd_run query classify-confidence`(seam, 이 세션 직접 실행) — websearch provider 신뢰도 등급 확인

### Secondary (MEDIUM confidence)

- Shiki/rehype-pretty-code 언어 번들 지원 범위(`typescript/tsx/javascript/jsx/json/html/css/yaml` 표준 지원) — Phase 4 RESEARCH.md에서 이미 CITED로 확립된 동일 원칙을 신규 언어에 확장 적용, 이 세션에서 재검증하지 않음

### Tertiary (LOW confidence)

- OWASP LLM Top 10 등 3-6/3-7 모듈의 PII/인젝션 정책 설명에 참고할 만한 출처 — 이 세션에서 직접 조사하지 않음(`## Security Domain` 마지막 행, `[ASSUMED]`)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 새 라이브러리 없음, Step 2 예제에 등장할 npm 패키지는 레지스트리로 직접 확인, package-legitimacy 게이트도 이 세션에서 실행
- Architecture: HIGH — 파이프라인·게이트 스크립트를 코드에서 직접 확인, 25편 전체 frontmatter를 이 세션에 Read
- Pitfalls: MEDIUM~HIGH — 대부분 이 세션에서 직접 재현/재계산(Prisma RC 버전, D-78 산수 재검증, 게이트 순서 의존성)했으나, 신규 8개 코드펜스 언어 중 6개(sql/tsx 제외)는 이 저장소에서 아직 미실증(A2)

**Research date:** 2026-08-25
**Valid until:** 2026-09-08(약 2주) — 콘텐츠 자체는 안정적이나, Prisma 버전(현재 RC 전환기)과 2-7/3-6 모듈의 LLM API 관련 세부사항은 실제 집필 착수 직전에 재확인 권장
