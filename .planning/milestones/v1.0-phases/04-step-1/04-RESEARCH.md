# Phase 4: Step 1 심화 콘텐츠 - Research

**Researched:** 2026-08-25
**Domain:** 콘텐츠 집필(교육용 MDX 레슨, eli5 톤, Python/SQL/Git/scikit-learn/Claude API 실무 예제) — 플랫폼 코드는 거의 변경 없음
**Confidence:** HIGH — 이 phase는 새 기술 스택을 도입하지 않는다. 기존에 검증된 파이프라인(Velite/rehype-pretty-code/Shiki) 위에 콘텐츠만 얹는 phase이므로, 리스크는 "기술이 되는가"가 아니라 "본문·게이트 상수·frontmatter가 정확히 일치하는가"에 있다. 모든 파일·상수를 이 세션에서 직접 Read해 확인했다.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**집필 표준 — eli5 × 6단 템플릿 (CONT-02)**
- **D-47:** 6단 구조(D-10) 유지 + 각 단을 eli5 톤으로 집필 — ① 학습 목표 → ② 왜 배우나 → ③ 개념 설명(비유) → ④ 실무 예제 → ⑤ 실무 팁 → ⑥ 핵심 정리·스스로 점검 순서는 그대로. 글쓰기만 바꾼다: 짧은 문장, 전문 지식 전제 없음, 용어마다 풀이. Making-of(`docs/making-of.md`)의 문체가 톤 선례 — **Reversibility: costly** — 이 표준으로 Step 1 10편이 쓰이고 Phase 5가 같은 표준을 25편에 적용하므로 이후 변경 시 전 레슨 재작업
- **D-48:** "큰 그림"은 마크다운만으로 표현 — 이모지 섹션 헤더, "일상 비유" 열이 있는 표, `A → B → C` 흐름 한 줄. Mermaid·SVG·이미지·ASCII 다이어그램·새 MDX 컴포넌트 없음. 플랫폼 변경 0 (PITFALLS Pitfall 4 "콘텐츠 전에 컴포넌트 라이브러리 금지" 준수)
- **D-49:** 150분(D-31) = 읽기 약 30분 + 실습·해보기 약 120분 — 본문은 현재 Python 파일럿보다 짧게. 실무 예제를 직접 돌리고 바꿔 보는 "해보기" 과제 2~3개가 나머지 시간을 채운다. 글이 시간을 채우지 않는다
- **D-50:** 용어는 첫 등장 시 "한글(English, 한 줄 풀이)" + ⑥ 안에 "이 레슨의 단어" 표 — 예: "브랜치(branch, 작업을 따로 복사해 두는 갈래)". 이후 등장은 한글만, 코드 안에서는 영어 그대로. ⑥ 핵심 정리 안에 용어 5~8개 표(단어 · 한 줄 뜻)를 넣어 복습·개강 후 참조용으로 쓴다

**파일럿·집필 순서**
- **D-51:** 파일럿 = `1-3-python-variables-and-types` eli5 재작성 — 기존 구 스타일 본문을 교체. 전후 비교가 가능하고 개념+코드+해보기 세 요소를 한 번에 검증한다. Wave 1 = 이 1편 작성 + human-verify 체크포인트, 승인 전에는 다른 레슨을 쓰지 않는다. 수정 요청이 오면 파일럿을 고쳐 다시 확인받는다
- **D-52:** 승인 후 나머지 9편은 병렬 집필 한 번에 — 커리큘럼 순서 wave가 아니라 모듈별 병렬로 한꺼번에 쓰고 한 번에 배포. 중간 사람 검토 없음(D-59)
- **D-53:** 1-1 "과정 운영 방식과 학습 준비" = 커리큘럼 지도 + 사전학습 사이트 사용법 + 하루 루틴. 3 Step·19 모듈·프로젝트 5종이 어떻게 이어지는지 큰 그림, 이 사이트로 5주 공부하는 법(오늘의 학습·완료 체크·일정표·페이스), 하루 학습 루틴. 기관 정보·OT 자료는 없으며 쓰지 않는다(D-02). ④ 실무 예제 자리에는 코드 대신 비코드 산출물(예: 학습 기록 템플릿)
- **D-54:** 1-2 "생성형 AI 개념과 활용 윤리" 실무 예제 = Python Claude API 호출 최소 예제 + 키 없이도 되는 대체 경로. API 키는 환경변수, 키가 없으면 같은 프롬프트를 채팅 UI에 붙여 넣어 비교하는 방법을 함께 안내. Step 2 LLM API 레슨의 예고편 역할. Ollama 등 로컬 모델 안내 없음

**실습 환경 (CONT-03, D-12 "실행 방법 명시"의 기준)**
- **D-55:** 읽기는 아이패드, Python·scikit-learn 실습은 PC 로컬 Python — VS Code + `python 파일명` 한 줄로 통일. Colab 안내 없음. 1-1 환경 세팅 레슨이 설치를 다룬다
- **D-56:** SQL 레슨(1-4)은 Supabase SQL 에디터에서 실행 — 브라우저라 아이패드에서도 가능, PostgreSQL 문법 그대로(Step 2 연결). 예제는 CREATE TABLE + INSERT + 쿼리가 한 묶음으로 자급자족. 연습용 스키마를 별도로 분리한다 — 사이트 진도가 저장된 공유 Supabase 프로젝트(`public.progress`)를 건드리는 예제는 금지
- **D-57:** Git 레슨(1-2)은 PC 터미널 git 명령 + GitHub 웹에서 PR — 연습용 새 저장소를 만들어 clone→branch→commit→push→PR→merge 한 바퀴를 명령 순서대로. 이 사이트 저장소의 PR 프리뷰 배포(D-16)를 실제 사례로 언급 가능
- **D-58:** OS 기준은 Windows(PowerShell), 다를 때만 macOS 한 줄 병기 — `python`·`git`처럼 공통인 명령은 그대로, 경로·설치처럼 다른 부분만 macOS 병기

**검토 리듬·점검 형식**
- **D-59:** 사람 검토는 파일럿 1편만, 나머지 9편은 자동 게이트로만 완료 처리 — 파일럿 승인으로 표준이 굳으면 9편은 `check-brand`(KANT·이메일 0건)·`check-manifest`(hasContent 불변식)·빌드·e2e(진행률·오늘의 학습 루프)만 통과하면 완료. 추가 human-verify 체크포인트를 두지 않는다
- **D-60:** 파일럿 확인 장소 = master 푸시 → 프로덕션 URL을 아이패드로 — 기존 UAT 방식과 동일
- **D-61:** "스스로 점검"·"해보기" 정답은 문제 바로 아래 접힌 `<details><summary>정답 보기</summary>` — MDX 기본 HTML이라 컴포넌트 추가 0. 아이패드 터치로 펼침. 실행형 과제는 "예상 출력"을, 질문형은 풀이를 담는다

### Claude's Discretion

- 파일럿 승인 후 9편 병렬 wave 구성(모듈별 executor 분할 등)과 각 레슨의 이모지 헤더·표·해보기 과제 개수(2~3개 범위 안)
- `scripts/check-manifest.mjs` Invariant 10의 `EXPECTED_HAS_CONTENT_COUNT`·`EXPECTED_HAS_CONTENT_SLUGS` 갱신 방식(2 → Step 1 10편 + Step 2 파일럿 1편 = 11) — 파일럿 단계와 9편 단계에서 각각 맞춰야 함
- `src/app/lesson/[lessonId]/page.tsx`의 "콘텐츠 준비 중" 카피(현재 두 파일럿을 지목) — Step 1 완성 후 Step 2·3 스텁에 맞게 문구 조정 (01-UI-SPEC Copywriting Contract 갱신 포함)
- `<details>` 요소의 prose 안 스타일(summary 터치 타깃 44px+, 다크모드) — `globals.css` `.prose` 블록에 최소 추가
- ML 레슨(1-5) 데이터셋 — scikit-learn 내장 데이터셋(외부 다운로드 없음) 권장, 선택은 리서치·플래너 판단
- 1-1 "GitHub·학습 도구 환경 세팅" 레슨의 설치 범위 — D-55~D-58에서 파생(VS Code, Python, Git, GitHub 계정, Supabase 계정), 구체 순서는 재량
- Making-of(`docs/making-of.md`) 4단계 갱신 시점·문구 — PLAT-03 규칙(phase 전환마다 eli5 방식으로 갱신) 준수하면 됨

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. (Colab 대체 경로·Mermaid 다이어그램·모듈별 중간 검토는 대안으로 검토 후 채택하지 않음 — 필요해지면 quick task로 추가)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONT-02 | 각 레슨 페이지는 쉬운 개념 설명(비유, 핵심 정리 포함)을 제공한다 | `## Architecture Patterns` §6단 스켈레톤 + 레슨별 비유 후보(§Per-Lesson Content Outline), `## Code Examples` §Term Table 패턴, D-50 준수 방법 명시 |
| CONT-03 | 각 레슨 페이지는 커리큘럼 동일 스택의 실무 적용 예제 코드(언어별 문법 강조 포함)를 제공한다 | `## Architecture Patterns` §Per-Lesson Content Outline의 "실무 예제" 열(언어·실행 방법·해보기), `## Code Examples`의 Claude API/SQL 실습 스키마/scikit-learn 코드, `## Common Pitfalls`의 rehype-pretty-code 언어 지원 확인 |

</phase_requirements>

## Summary

Phase 4는 새 기술을 들이는 phase가 아니라, Phase 1~3이 만들어 둔 파이프라인(Velite → rehype-pretty-code/Shiki → `MDXContent`, 진도 오버레이, 일정·오늘의 학습) 위에 **Step 1 레슨 10편의 본문**만 얹는 phase다. 플랫폼 변경은 정확히 다섯 곳으로 제한된다: (1) 10개 `.mdx` 파일의 본문 교체, (2) `hasContent: false → true` 전환(9편), (3) `scripts/check-manifest.mjs` Invariant 10의 `EXPECTED_HAS_CONTENT_COUNT`/`SLUGS` 갱신, (4) `globals.css` `.prose` 블록에 `<details>/<summary>` 스타일 소량 추가, (5) `docs/making-of.md` 4단계 갱신. 그 외 컴포넌트·의존성·스키마 변경은 없다(D-48).

이 세션에서 10개 레슨 파일의 frontmatter를 전부 직접 Read해 확인한 결과, **중요한 콘텐츠 범위 갭 하나를 발견했다**: `curriculum.md`의 1-3 모듈 첫 번째 불릿은 "변수, 자료형, 조건문, 반복문" 네 주제를 묶고 있는데, 파일럿 레슨(`1-3-python-variables-and-types`, 기존 구 스타일)은 변수·자료형만 다루고 조건문·반복문은 다루지 않는다. frontmatter(제목 포함)는 phase 경계상 고정값이므로 제목을 바꿀 수는 없지만, D-49("현재 파일럿보다 짧게")와 curriculum.md 원문 범위("조건문·반복문 포함") 사이에 실제 긴장이 있다 — 자세한 내용은 `## Open Questions` 참고. 이 결정 없이 파일럿을 쓰면 승인 후 재작업 리스크가 생긴다.

두 번째로 확인이 필요했던 지점은 rehype-pretty-code/Shiki의 언어별 하이라이팅 실증 범위였다. 현재 프로덕션에 반영된 두 파일럿은 `python`과 `bash` 펜스만 사용했고, `sql`·`powershell`(1-4·1-1·1-2가 필요로 하는 언어)은 아직 한 번도 실제로 렌더링된 적이 없다 — Shiki가 두 언어 모두 표준 번들 문법으로 지원하는 것은 맞지만(CITED), 이 프로젝트의 실제 빌드에서 검증된 적은 없으므로 9편 집필 시작 전에 한 번은 실제로 빌드해 확인할 가치가 있다.

세 번째, 이 개발 환경 자체에서 Windows의 Python 실행 경로 문제를 재현했다: `python` 명령이 실제 설치된 Python 3.12.10이 아니라 Microsoft Store 스텁(App Execution Alias)으로 먼저 해석되는 PATH 순서 문제가 실제로 존재한다(이 세션에서 직접 확인). 1-1 환경 세팅 레슨이 이 문제를 사전에 안내하지 않으면 학습자가 "python이 실행됐는데 아무 일도 안 일어난다"는 혼란을 겪을 가능성이 높다.

**Primary recommendation:** 파일럿(1-3-python-variables-and-types)에 조건문·반복문 요소를 짧게 포함시키는 쪽으로 curriculum.md 범위를 채우고, 9편 집필 착수 전에 `sql`/`powershell` 코드펜스가 실제로 하이라이팅되는지 로컬 빌드로 한 번 스모크 테스트하며, 1-1 환경 세팅 레슨에 Windows Python PATH 문제(App Execution Alias)를 실무 팁으로 명시한다.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 레슨 본문 콘텐츠(개념·비유·예제·용어) | 콘텐츠 파일(빌드 타임, Velite) | — | `.mdx` 파일이 유일한 소스. DB·CMS 없음(ARCHITECTURE.md 기존 결정) |
| 코드 하이라이팅 | 빌드 타임(Velite → rehype-pretty-code/Shiki) | — | `[VERIFIED: velite.config.ts:1-10]` — 빌드 시점에 정적 HTML로 굳는다. 브라우저에서 하이라이팅 엔진이 돌지 않음(Pitfall 4 이미 회피됨) |
| `hasContent` 분기·"준비 중" 카피 | Frontend Server(RSC) | — | `[VERIFIED: src/app/lesson/[lessonId]/page.tsx:54-66]` — 서버 컴포넌트가 `lesson.hasContent`로 분기 렌더 |
| 실습 코드의 실제 실행(Python 스크립트, git 명령, SQL 쿼리, Claude API 호출) | 학습자의 로컬 환경 / 브라우저(Supabase SQL 에디터) / 외부 API | — | 사이트 밖에서 일어난다 — 이 사이트는 코드를 "보여줄" 뿐 실행 환경을 제공하지 않는다(D-55~D-58 명시적 결정, Colab 등 인앱 실행 없음) |
| 완료 체크·진행률·오늘의 학습 반영 | API/Backend(Server Action) + Database(Supabase `progress`) | — | 변경 없음(Phase 2·3에서 이미 구축). Phase 4는 `getOrderedLessons()`가 파생하는 입력(콘텐츠 존재 여부)만 늘릴 뿐, 이 계층 코드는 건드리지 않는다 |
| `<details>/<summary>` 정답 접기 UI | 브라우저(순수 HTML, 클라이언트 JS 없음) | CDN/Static(전역 CSS) | `<details>`는 네이티브 HTML 요소라 별도 컴포넌트·JS 불필요. 터치 타깃·다크모드는 `globals.css` `.prose`에서 담당 |
| 게이트 검증(check-manifest/check-brand/e2e) | 빌드/CI 스크립트(Node, 의존성 0) | — | 런타임 계층이 아니라 실행자/CI가 로컬에서 도는 검증 계층 — 사용자에게 노출되지 않음 |

## Standard Stack

이 phase는 새 라이브러리를 추가하지 않는다(D-48 "플랫폼 변경 0"). 아래는 이미 확정된 기존 스택을 재확인한 것이며, 버전은 이 세션에서 `package.json`을 직접 Read해 확인했다.

### Core (변경 없음 — 재확인용)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `velite` | `^0.4.0` | MDX 프론트매터 스키마 검증 + 컴파일 | `[VERIFIED: package.json:21]` — 이미 설치·동작 중, Phase 4는 스키마를 바꾸지 않는다 |
| `rehype-pretty-code` | `^0.14.5` | 코드 하이라이팅 rehype 플러그인 | `[VERIFIED: package.json:18]` |
| `shiki` | `^4.4.3` | 하이라이팅 엔진(rehype-pretty-code의 peer) | `[VERIFIED: package.json:20]` |
| `@rehype-pretty/transformers` | `^0.13.2` | 코드 복사 버튼(`transformerCopyButton`) | `[VERIFIED: package.json:12, velite.config.ts:7-9]` |
| `@tailwindcss/typography` | `^0.5.20` | `.prose` — 레슨 본문 마크다운 스타일(표·`<details>`·인용 포함) | `[VERIFIED: package.json:25]` |

### 학습자 로컬 환경(사이트 의존성 아님, 레슨 안내용)

| Tool | Version(이 세션 확인) | Purpose | 확인 방법 |
|------|------|---------|-----------|
| Python | 3.12.10 (`py` 런처 경유) | 1-1·1-3·1-5 실습 | `[VERIFIED: 이 세션 Bash 실행 — "py --version" → "Python 3.12.10"]` — 단, `python`(스토어 스텁)과 `py`(실제 설치)가 PATH에서 충돌하는 문제를 이 세션에서 재현함(`## Common Pitfalls` 참고) |
| Git | 2.52.0.windows.1 | 1-2 실습 | `[VERIFIED: 이 세션 Bash 실행 — "git --version"]` |
| `anthropic` (PyPI) | 1.0.0(최신) | 1-2 Claude API 예제 | `[VERIFIED: PyPI registry — "pip index versions anthropic" → 최신 1.0.0, 0.2.2까지 이력 확인]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `<details><summary>` (D-61) | 별도 Accordion/Collapsible React 컴포넌트 | 상호작용 JS와 상태 관리가 추가되고 D-48(컴포넌트 0 추가) 위반 — 채택 안 함 |
| PC 로컬 Python 실습(D-55) | Google Colab 링크 | 계정 연동·업로드 마찰 추가, 이미 논의 후 기각(Deferred) |
| scikit-learn 내장 데이터셋 | 외부 CSV 다운로드(Kaggle 등) | 네트워크 의존·라이선스 확인 필요, 재현성 낮음 — 내장 데이터셋이 CONT-03 "자급자족" 기준에 더 적합 |

**Installation:** 해당 없음 — 이 phase는 `package.json`을 변경하지 않는다. 레슨 안에서 학습자에게 안내하는 설치 명령(`pip install anthropic`, `pip install scikit-learn` 등)만 존재한다.

## Package Legitimacy Audit

이 phase는 **저장소 자체에 새 npm 패키지를 설치하지 않는다.** 다만 레슨 본문이 학습자에게 로컬 설치를 안내하는 패키지가 있어(1-2의 `anthropic`, 1-5의 `scikit-learn`), 레슨에 적을 패키지명이 슬롭스쿼팅이 아닌지 이 세션에서 직접 확인했다.

| Package | Registry | Age/이력 | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `anthropic` | PyPI | 2023~ (0.2.2 → 1.0.0, 100+ 릴리스) | 매우 높음(업계 표준 SDK) | github.com/anthropics/anthropic-sdk-python | OK | 승인 — `[VERIFIED: PyPI registry 직접 조회]` |
| `scikit-learn` | PyPI | 10년 이상, 업계 표준 ML 라이브러리 | 매우 높음 | github.com/scikit-learn/scikit-learn | OK | 승인 — `[CITED: scikit-learn.org/stable, 이 세션 WebSearch로 최신 버전 1.9.0 확인]` |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*레슨 안내 문구에 정확한 패키지명("anthropic", "scikit-learn", "pip install")을 그대로 쓰면 되며, 별칭·유사 패키지명(예: "anthropic-sdk", "sklearn"이라는 이름의 별도 패키지 등)을 쓰지 않도록 집필 시 주의한다 — 참고: import 문은 관례상 `import sklearn`이지만 설치 패키지명은 `scikit-learn`이다(이름 불일치는 잘 알려진 사실이나 혼동하기 쉬우므로 레슨 실무 팁에 명시할 가치가 있다).

## Architecture Patterns

### System Architecture Diagram

```
                         [빌드 타임]
.mdx 파일(10편, src/content/lessons/step-1/)
     │  frontmatter(title/stepId/moduleId/order/depth/estimatedMinutes/hasContent/slug)
     │  + 본문(6단 구조, ```python/```sql/```bash/```powershell 펜스)
     ▼
Velite (velite.config.ts) — Zod 스키마 검증
     │  실패 시 빌드 중단(런타임 빈 상태 불가)
     ▼
rehype-pretty-code + Shiki — 코드펜스 → 정적 하이라이트 HTML
     │  (github-light/github-dark-dimmed 테마, 복사 버튼 삽입)
     ▼
.velite/lessons.json (매니페스트) ──────────────┐
     │                                          │
     ▼                                          ▼
                         [요청 타임]      scripts/check-manifest.mjs
LessonPage (src/app/lesson/[lessonId]/page.tsx)   (Invariant 10: hasContent
     │  hasContent ? <MDXContent> : "준비 중" 카피    개수·slug 일치 검증)
     │
     ├─ 쿠키 없음 → 본문만 렌더(D-20, 공개 포트폴리오)
     └─ unlock 쿠키 있음 → readCompletedLessonIds()
              │                                     scripts/e2e-progress.mjs
              ▼                                     scripts/e2e-today.mjs
        CompleteButton(완료 토글) ──▶ Server Action ──▶ Supabase progress 테이블
              │                                            │
              ▼                                            ▼
   getOrderedLessons()가 파생하는 진행률/오늘의 학습 ◀──── 완료 행 존재 여부
   (Step 카드, /curriculum, 홈 "오늘의 학습", /schedule)
```

이 흐름에서 Phase 4가 실제로 건드리는 노드는 정확히 셋: `.mdx` 파일 본문, `hasContent` 값, `check-manifest.mjs` 상수. 나머지(하이라이팅 파이프라인, 진도 오버레이, 일정·페이스 계산)는 Phase 1~3이 이미 만든 그대로 재사용된다 — 레슨이 늘어나면 `getOrderedLessons()`가 자동으로 새 항목을 포함하므로 별도 배선이 필요 없다(`[VERIFIED: .planning/phases/04-step-1/04-CONTEXT.md:90]` — "본문 추가만으로 오늘의 학습·진행률이 자동으로 채워짐").

### 10개 레슨 — 정확한 slug·모듈·현재 상태 (이 세션에 전체 frontmatter를 Read해 확인)

| Slug | Module | Order | Title(frontmatter, 고정값) | curriculum.md 대응 불릿 | 현재 hasContent | 비고 |
|------|--------|-------|-----------------------------|--------------------------|------------------|------|
| `1-1-course-orientation` | 1-1 | 1 | "과정 운영 방식과 학습 준비" | "개강 OT 및 과정 운영 방식 안내" | `false` | D-53: OT·기관 정보 제외, 커리큘럼 지도+사이트 사용법+하루 루틴으로 재정의 |
| `1-1-dev-environment-setup` | 1-1 | 2 | "GitHub·학습 도구 환경 세팅" | "GitHub, 학습 도구, 협업 채널 세팅" | `false` | D-55~D-58 파생: VS Code/Python/Git/GitHub/Supabase 계정 |
| `1-2-git-branch-and-pr` | 1-2 | 1 | "Git 브랜치와 PR 협업 흐름" | "Git 저장소 관리, 브랜치, PR 협업 흐름" | `false` | D-57 |
| `1-2-generative-ai-basics` | 1-2 | 2 | "생성형 AI 개념과 활용 윤리" | "생성형 AI 개념, 활용 방식, 윤리 이해" | `false` | D-54 Claude API 예제 |
| `1-3-python-variables-and-types` | 1-3 | 1 | "Python 변수·자료형" | **"변수, 자료형, 조건문, 반복문"** | `true`(파일럿, 구 스타일) | **범위 갭 — `## Open Questions` 참고.** D-51 재작성 대상 |
| `1-3-python-functions-and-io` | 1-3 | 2 | "Python 함수·예외·파일 입출력" | "함수, 예외 처리, 파일 입출력" | `false` | |
| `1-4-relational-db-basics` | 1-4 | 1 | "관계형 데이터베이스 구조" | "관계형 데이터베이스 구조 이해" | `false` | D-56 |
| `1-4-sql-queries-and-joins` | 1-4 | 2 | "SQL 쿼리·JOIN·집계" | "SQL 쿼리, JOIN, 집계, 서브쿼리" | `false` | D-56 |
| `1-5-ml-model-types` | 1-5 | 1 | "분류·회귀·군집 모델 이해" | "분류, 회귀, 군집 모델 이해" | `false` | scikit-learn 내장 데이터셋 |
| `1-5-ml-metrics-and-pipeline` | 1-5 | 2 | "평가 지표와 Scikit-learn Pipeline" | "평가 지표와 Scikit-learn Pipeline 활용" | `false` | |

모든 10편의 frontmatter는 `estimatedMinutes: 150`, `depth: "심화"`, `stepId: 1`이고 `[VERIFIED: src/content/lessons/step-1/*.mdx frontmatter, 이 세션 전체 Read]`, `modules.ts`상 5개 모듈 모두 `isProject: false`이므로 `check-manifest.mjs` Invariant 13(파생 규칙: 심화·비프로젝트 = 150분)과 이미 일치한다 — **frontmatter는 손댈 필요가 없다.** 본문과 `hasContent`만 바뀐다.

### Pattern 1: 6단 eli5 스켈레톤 (D-10 + D-47)

**What:** 기존 파일럿에서 실제로 쓰인 정확한 헤딩 6개를 그대로 유지하고 톤만 eli5로 바꾼다.

**정확한 헤딩(파일럿 원문에서 그대로 인용):**
`[VERIFIED: src/content/lessons/step-1/1-3-python-variables-and-types.mdx:12,21,25,53,97,104]`
- `## 1. 학습 목표`
- `## 2. 왜 배우나`
- `## 3. 개념 설명`
- `## 4. 실무 예제`
- `## 5. 실무 팁`
- `## 6. 핵심 정리 및 스스로 점검`

**When to use:** Step 1 10편 전부, 예외 없음(D-53의 1-1-course-orientation도 헤딩 구조는 동일하게 유지하고 ④의 *내용*만 비코드로 바꾼다).

**권장 스켈레톤(파일럿 구조 + D-50/D-61 반영):**
```markdown
---
title: "(frontmatter 고정값 그대로 — 변경 금지)"
stepId: 1
moduleId: "1-N"
order: N
depth: "심화"
estimatedMinutes: 150
hasContent: true
slug: "(고정값 그대로)"
---

## 1. 학습 목표

이 레슨을 마치면 다음을 할 수 있습니다.

- (동사로 끝나는 관찰 가능한 결과 3~4개, 짧은 문장)

## 2. 왜 배우나

(이 개념이 커리큘럼의 어디로 이어지는지 1~2문단, 전문 용어 없이)

## 3. 개념 설명

### (비유 제목)

(짧은 문장으로 비유 설명. 표가 필요하면 "일상 비유" 열을 포함한 표.)

용어 첫 등장: "한글(English, 한 줄 풀이)" — 이후 등장은 한글만.

## 4. 실무 예제

(완결된 실행 가능 코드 1~2블록 + 실행 방법 + 예상 출력 설명)

## 5. 실무 팁

- (실무에서 자주 겪는 함정 3~4개, 짧게)

## 6. 핵심 정리 및 스스로 점검

**핵심 정리**
- (4~5줄 요약)

**이 레슨의 단어**

| 단어 | 뜻 |
|------|-----|
| (용어) | (한 줄 뜻) |
(5~8행)

**스스로 점검**

1. (질문형 또는 실행형 과제 1)

<details>
<summary>정답 보기</summary>

(빈 줄 필수 — CommonMark HTML-block 경계 규칙. 빈 줄 없이 바로 쓰면 마크다운이
파싱되지 않고 그대로 텍스트로 노출된다.)

(정답/풀이 또는 예상 출력)

</details>

2. (해보기 과제 2 — 같은 `<details>` 패턴 반복)
3. (해보기 과제 3, 선택)
```

**Source:** 이 세션에 두 파일럿(`1-3-python-variables-and-types.mdx`, `2-3-react-components.mdx`)을 직접 Read해 구조를 추출.

### Pattern 2: `<details><summary>` 안에 마크다운 넣기 — 빈 줄 필수

**What:** MDX/CommonMark는 `<details>` 같은 블록 레벨 HTML 태그 뒤에 빈 줄이 없으면 내부를 raw HTML로 취급해 마크다운(굵게, 코드 인라인, 리스트 등)을 파싱하지 않는다.
**When to use:** D-61의 모든 "정답 보기" 블록.
**Example:**
```markdown
<details>
<summary>정답 보기</summary>

`age + 3`은 `TypeError`를 일으킵니다 — 문자열과 정수는 자동으로 더해지지 않기 때문입니다.

</details>
```
**Source:** `[CITED: CommonMark HTML-block 경계 규칙 — 웹 검색으로 교차 확인, MDX v3(Velite 내부 컴파일러)에도 동일 적용]` — 이 프로젝트에서 아직 `<details>`를 실제로 렌더한 적은 없으므로(`[VERIFIED: 이 세션 grep — 기존 10개 mdx 파일에 `<details>` 사용 0건]`), 파일럿에서 최소 1회 실제 빌드로 검증할 것을 권장.

### Pattern 3: 언어별 코드펜스 — 이 프로젝트에서 실증된 언어와 아직 안 된 언어

| 언어 펜스 | 이 저장소에서 실제 렌더 확인 여부 | 필요한 레슨 |
|-----------|-----------------------------------|-------------|
| ` ```python ` | `[VERIFIED: 1-3-python-variables-and-types.mdx, 프로덕션 배포 완료 — docs/making-of.md:97 "코드 색칠이 그대로 나왔다"]` | 1-1(설치 확인), 1-2(Claude API), 1-3 ×2, 1-5 ×2 |
| ` ```bash ` | `[VERIFIED: 1-3-python-variables-and-types.mdx:91, 2-3-react-components.mdx:124]` | 1-1, 1-2, 1-3 ×2 (실행 명령) |
| ` ```sql ` | 미실증 — 이 저장소의 어떤 mdx 파일에서도 아직 사용된 적 없음(`[VERIFIED: 이 세션 grep — 0건]`). rehype-pretty-code/Shiki는 표준 번들에 `sql` 문법을 포함하므로 동작할 것으로 예상되나(`[CITED: rehype-pretty.pages.dev, shiki 언어 번들 문서]`), **9편 착수 전 1회 스모크 빌드로 실제 확인 권장** | 1-4 ×2 |
| ` ```powershell ` | 미실증(`[VERIFIED: 이 세션 grep — 0건]`). Shiki는 `powershell`/`ps1` 별칭을 표준 지원(`[CITED]`)하나 이 저장소에서 검증된 적 없음 — 동일하게 스모크 테스트 권장 | 1-1, 1-2, 1-5(D-58 OS 명령) |
| ` ```text ` (또는 코드펜스 없이 일반 markdown) | 1-1-course-orientation의 "학습 기록 템플릿"(D-53, 비코드 산출물)에 적합 — 코드가 아니므로 언어 하이라이팅이 필요 없지만, `text` 펜스로 감싸면 복사 버튼(44px, `transformerCopyButton`)을 무료로 얻는다 | 1-1-course-orientation |

**권장 조치:** 파일럿 승인 직후, 9편 병렬 집필을 시작하기 전에 `sql` 펜스 하나와 `powershell` 펜스 하나를 포함한 임시 스모크 커밋(또는 로컬 `npm run build`)으로 실제 하이라이팅을 1회 확인한다. 실패해도 플레인 텍스트로 폴백될 뿐 빌드가 깨지지는 않지만(`[CITED: rehype-pretty-code 미지원 언어 시 plain 처리]`), 미리 확인하면 9편 전체에서 같은 문제가 반복되는 것을 막는다.

### Pattern 4: 완결형 SQL 실습 — 연습 스키마 분리 (D-56)

**What:** `public.progress`(사이트 진도 저장 테이블)와 물리적으로 분리된 스키마에서 CREATE TABLE + INSERT + SELECT가 한 블록 안에서 자급자족하는 예제.
**When to use:** 1-4-relational-db-basics, 1-4-sql-queries-and-joins.
**권장 네이밍:** `CREATE SCHEMA IF NOT EXISTS practice;` 뒤 `practice.students`, `practice.enrollments` 등 — `public` 접두사를 쓰지 않는다는 규칙을 코드 자체에 주석으로 명시.
**Example:**
```sql
-- Supabase SQL 에디터에서 실행 — 이 사이트의 진도 데이터(public.progress)와
-- 무관한 별도 연습 스키마를 만듭니다. public 스키마를 건드리지 않습니다.
CREATE SCHEMA IF NOT EXISTS practice;

CREATE TABLE practice.students (
  id serial PRIMARY KEY,
  name text NOT NULL,
  grade int
);

INSERT INTO practice.students (name, grade) VALUES
  ('지현', 90), ('민준', 85), ('서연', 78);

SELECT name, grade FROM practice.students WHERE grade >= 80;
```
**Source:** D-56(연습 스키마 분리) 원문 + 이 세션에 `public.progress` 스키마 오염 리스크를 재확인.

### Recommended Project Structure (변경 없음, 참고용)

```
src/content/lessons/step-1/
├── 1-1-course-orientation.mdx          # 본문 교체(비코드 산출물)
├── 1-1-dev-environment-setup.mdx       # 본문 교체
├── 1-2-git-branch-and-pr.mdx           # 본문 교체
├── 1-2-generative-ai-basics.mdx        # 본문 교체(Claude API 예제)
├── 1-3-python-variables-and-types.mdx  # 파일럿 — eli5 재작성(Wave 1)
├── 1-3-python-functions-and-io.mdx     # 본문 교체
├── 1-4-relational-db-basics.mdx        # 본문 교체(SQL 연습 스키마)
├── 1-4-sql-queries-and-joins.mdx       # 본문 교체(SQL 연습 스키마)
├── 1-5-ml-model-types.mdx              # 본문 교체(scikit-learn)
└── 1-5-ml-metrics-and-pipeline.mdx     # 본문 교체(scikit-learn)

scripts/check-manifest.mjs   # Invariant 10 상수 갱신 (파일럿 단계: 불변 / 9편 단계: 2→11)
src/app/globals.css          # .prose 블록에 <details>/<summary> 스타일 추가
docs/making-of.md            # 4단계 갱신(PLAT-03)
```

### Per-Lesson Content Outline (Claude's Discretion 범위 — 구체 초안)

curriculum.md 원문에서 파생. "실무 예제" 열은 CONT-03(실행 가능+언어별 하이라이팅)을 만족하는 구체 소재이며, "해보기" 개수는 D-49 기준 2~3개.

| Slug | 비유 후보 | 실무 예제(언어/소재) | 해보기(2~3개) |
|------|-----------|------------------------|----------------|
| `1-1-course-orientation` | 5주 여정을 담은 지도 | (비코드) 하루 학습 기록 템플릿 — "오늘 배운 것 / 막힌 것 / 내일 할 일" 3줄 양식, ` ```text ` 펜스로 복사 가능하게 | ① 홈("오늘의 학습")에서 오늘 배정 레슨 확인, ② 템플릿에 첫 하루 기록 작성 |
| `1-1-dev-environment-setup` | 작업대에 공구 챙기기 | `powershell`(Windows 기본)+ macOS 한 줄 병기 — VS Code/Python/Git 설치 확인 명령(`python --version` 대신 **`py --version`** 권장, `## Common Pitfalls` 참고), GitHub·Supabase 계정 생성 | ① 버전 확인 명령 실행해 결과 캡처, ② GitHub에서 빈 저장소 하나 생성 |
| `1-2-git-branch-and-pr` | 갈래길에서 새 가지 뻗기(branch) | `bash`/`powershell` — 연습용 새 GitHub 저장소로 clone→branch→commit→push→PR→merge 전체 흐름(D-57). 이 사이트 저장소의 PR 프리뷰 배포(D-16 결과)를 실제 사례로 1문장 언급 가능 | ① 브랜치 만들어 PR까지 열고 머지, ② 두 번째 브랜치로 충돌 없는 변경 한 번 더 연습 |
| `1-2-generative-ai-basics` | 아주 똑똑해진 자동완성 / 윤리 = 위임 가능한 일과 검증이 필요한 일 구분 | `python` — Claude API 최소 호출 예제(`## Code Examples` 참고) + 키 없을 때 채팅 UI로 같은 프롬프트 비교(D-54) | ① 같은 질문을 API와 채팅 UI 양쪽에 던져 답 비교, ② 프롬프트를 바꿔 답변 변화 관찰 |
| `1-3-python-variables-and-types`(파일럿) | 이름표 붙은 상자(변수), 스위치(bool), 갈림길(if), 컨베이어벨트(for) | `python` — 기존 예제(회원 정보 변수+자료형)에 조건문(프리미엄 할인 분기는 이미 있음, 확장 필요)과 반복문(회원 리스트 순회) 추가 — `## Open Questions` 참고 | ① 조건 분기 바꿔 실행, ② `for`로 회원 3명 리스트를 순회하며 출력, ③(선택) 자료형 섞어서 에러 만들어보기 |
| `1-3-python-functions-and-io` | 함수 = 자판기(입력→처리→출력), 예외 = 안전망, 파일 입출력 = 편지 쓰고 읽기 | `python` — 함수로 회원 정보 처리 + `try/except`로 잘못된 입력 방어 + 파일(txt/csv)에 결과 저장·읽기 | ① 함수에 새 매개변수 추가, ② 일부러 예외 상황을 만들어 처리 확인 |
| `1-4-relational-db-basics` | 서로 연결된 엑셀 시트 묶음 | `sql` — `practice` 스키마에 테이블 2개(FK로 연결) 생성 + INSERT(D-56 패턴) | ① 테이블 직접 만들어보기, ② 데이터 넣고 SELECT로 확인 |
| `1-4-sql-queries-and-joins` | JOIN = 서로 다른 표를 이어붙이기 | `sql` — `practice` 스키마에서 CREATE+INSERT+`JOIN`+`GROUP BY`가 한 블록에 자급자족(D-56) | ① JOIN 조건 바꿔보기, ② 서브쿼리 하나 직접 작성 |
| `1-5-ml-model-types` | 분류=우편함 나누기, 회귀=선 긋고 예측, 군집=비슷한 것끼리 묶기 | `python` — `sklearn.datasets.load_iris`로 분류(로지스틱 회귀) + `KMeans` 군집, `load_diabetes`로 짧은 회귀 스니펫(`## Code Examples` 참고) | ① 분류기를 다른 모델로 교체, ② `n_clusters` 값을 바꿔 결과 관찰 |
| `1-5-ml-metrics-and-pipeline` | 평가지표=성적표, Pipeline=조립 라인 | `python` — 같은 `load_iris` 데이터로 `Pipeline(StandardScaler + 분류기)` 구성 + accuracy/precision/recall 출력 | ① Pipeline 단계 순서 바꿔 결과 비교, ② 다른 평가지표 추가 |

같은 데이터셋(`load_iris`)을 1-5의 두 레슨에서 재사용하면 학습자가 새 데이터셋 구조를 두 번 익히지 않아도 되고, D-49의 "글이 시간을 채우지 않는다" 원칙에 맞게 데이터 탐색 시간을 줄일 수 있다.

### Anti-Patterns to Avoid

- **새 MDX 컴포넌트를 "필요해 보여서" 만드는 것:** D-48이 명시적으로 금지. `<details>`/표/이모지 헤더만으로 표현이 안 되는 것 같으면 콘텐츠를 단순화하는 쪽을 먼저 시도한다.
- **Colab/온라인 실행기 링크 추가:** D-55에서 이미 검토 후 기각(Deferred). PC 로컬 실행으로 통일.
- **1-4 SQL 예제가 `public` 스키마를 직접 참조:** D-56 위반이자 실제 진도 데이터 오염 위험. `practice` 스키마로 항상 분리.
- **`python` 명령을 그대로 안내:** 이 개발 환경에서 실제로 재현된 문제(Windows Store 스텁 우선 실행) — `## Common Pitfalls` 참고.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 정답 접기/펼치기 UI | React Accordion 컴포넌트, `useState` 기반 toggle | 네이티브 `<details><summary>` | D-61 명시 결정. 컴포넌트 0개, JS 0줄, 접근성 기본 제공 |
| 코드 하이라이팅 | 커스텀 Shiki 래퍼, 클라이언트 하이라이터 | 기존 `rehype-pretty-code` 파이프라인 그대로 사용 | 이미 빌드 타임에 동작 중(Pitfall 4 이미 회피) — 언어 펜스만 올바르게 쓰면 된다 |
| Claude API 호출 재시도/스트리밍 로직 | 커스텀 HTTP 재시도 래퍼 | `anthropic` 공식 SDK의 `client.messages.create()` 기본 호출 | 레슨은 "최소 예제"가 목적(D-54) — 재시도·스트리밍은 Step 2 LLM API 레슨의 범위 |
| ML 평가 지표 계산 | 직접 accuracy/precision 수식 구현 | `sklearn.metrics`(`accuracy_score`, `classification_report` 등) | 표준 라이브러리가 이미 검증된 구현을 제공 — 직접 구현은 1-5 레슨의 학습 목표(개념 이해)에서 벗어난 부가 작업 |
| 일정 계산 재확인용 하드코딩 | 5주 학습 일정을 레슨에 다시 나열 | `/schedule`, 홈 "오늘의 학습" 링크 언급만 | 이미 Phase 3이 만든 단일 진실 원천 — 레슨 안에 날짜를 하드코딩하면 이중 관리 위험 |

**Key insight:** 이 phase의 "hand-roll 금지" 규칙은 대부분 코드가 아니라 **콘텐츠 소재 선택**에 관한 것이다 — 새 기능을 만들 위험보다, 이미 있는 네이티브 HTML/표준 라이브러리를 두고 불필요한 소재(온라인 실행기, 별도 데이터셋 다운로드, 자체 평가지표 구현)를 예제에 끌어들이는 위험이 크다.

## Common Pitfalls

### Pitfall 1: `1-3-python-variables-and-types`의 curriculum.md 범위 갭 (조건문·반복문 누락)

**What goes wrong:** curriculum.md의 1-3 모듈 첫 불릿은 "변수, 자료형, **조건문, 반복문**" 네 주제인데, frontmatter의 title은 "Python 변수·자료형"이고 기존 파일럿 본문도 조건문·반복문을 정식으로 다루지 않는다(`if`가 실무 예제 안에 1줄 등장하지만 "조건문을 배운다"는 학습 목표로 다루지 않음).
**Why it happens:** 레슨 제목이 모듈 불릿을 축약해서 지어졌고(Phase 1에서 확정), 실제 본문 범위와 제목 사이의 괴리가 지금까지 드러나지 않았다.
**How to avoid:** 파일럿 재작성 시 학습 목표에 조건문·반복문 항목을 추가하고, "3. 개념 설명"에 조건문(if/elif/else)·반복문(for/while) 절을 짧게 넣고, "4. 실무 예제"의 코드에 조건 분기 확장 + `for` 순회를 포함시킨다. title/slug는 고정값이므로 바꾸지 않는다(제목이 범위를 다 담지 못해도 frontmatter는 phase 경계 밖).
**Warning signs:** 파일럿 승인 후 "왜 조건문/반복문이 하나도 없냐"는 재작업 요청이 들어오면 이미 9편 착수 후일 수 있다 — 파일럿 단계에서 반드시 짚어야 한다.

### Pitfall 2: Windows `python` 명령이 실제 설치가 아니라 Microsoft Store 스텁으로 해석됨

**What goes wrong:** 이 개발 환경에서 실제로 재현: `where python`이 `C:\Users\...\AppData\Local\Microsoft\WindowsApps\python.exe`(스토어 App Execution Alias)를 실제 설치본(`C:\Users\...\Python\Python312\python.exe`)보다 먼저 찾는다. PATH를 확인한 결과 `WindowsApps` 디렉터리가 `Python312` 디렉터리보다 앞선다. `py --version`은 정상적으로 실제 설치(3.12.10)를 가리킨다.
**Why it happens:** Windows 11이 기본으로 `python`/`python3` 앱 실행 별칭을 활성화해 두고, 사용자가 python.org에서 설치해도 PATH 순서가 자동으로 재정렬되지 않는 경우가 흔하다.
**How to avoid:** 1-1-dev-environment-setup 레슨의 설치 확인 단계에서 `python --version` 대신 **`py --version`**(Python 런처, Windows 표준 설치에 기본 포함)을 1차로 안내하고, "실무 팁"에 "`python`을 쳤는데 스토어가 열리거나 아무 반응이 없으면 `py`를 대신 쓰거나 Windows 설정 → 앱 실행 별칭에서 python.exe를 끄세요"라는 문장을 넣는다. macOS는 이 문제가 없으므로(`python3`가 표준) 이 팁은 D-58의 "다를 때만 병기" 원칙에 정확히 해당한다.
**Warning signs:** 학습자가 "`python variables.py`를 실행했는데 아무것도 안 나온다"고 보고하면 이 문제일 가능성이 높다.
**Source:** `[VERIFIED: 이 세션 Bash 실행 결과 — where python, py --version, $PATH 순서 직접 확인]`

### Pitfall 3: `<details>` 안 마크다운이 파싱되지 않음(빈 줄 누락)

**What goes wrong:** `<summary>` 바로 다음 줄에 빈 줄 없이 정답 텍스트를 쓰면 CommonMark가 그 블록을 raw HTML로 취급해 마크다운 서식(굵게, 인라인 코드, 리스트)이 그대로 텍스트로 노출된다.
**Why it happens:** 블록 레벨 HTML 요소는 앞뒤 빈 줄로 경계를 표시해야 마크다운 파서가 내부를 재진입한다는 규칙이 널리 알려져 있지 않다.
**How to avoid:** `## Code Examples`의 템플릿처럼 `<summary>...</summary>` 다음 반드시 빈 줄, 내용, 빈 줄, `</details>` 순서를 지킨다. 9편 병렬 집필 시 이 패턴을 모든 executor가 동일하게 따르도록 `## Code Examples`의 스니펫을 그대로 복사해 쓰게 한다.
**Warning signs:** 프리뷰에서 정답 텍스트에 별표(`**`)나 백틱이 그대로 노출되면 이 문제다.
**Source:** `[CITED: CommonMark HTML-block 경계 규칙, 웹 검색 교차 확인]`

### Pitfall 4: `sql`/`powershell` 코드펜스가 이 저장소에서 미실증 상태

**What goes wrong:** 지금까지 프로덕션에 배포된 두 파일럿은 `python`·`bash`·`tsx` 펜스만 썼다. 1-4(SQL)와 1-1/1-2/1-5(PowerShell)가 필요로 하는 언어는 아직 이 파이프라인에서 실제로 하이라이팅된 적이 없다.
**Why it happens:** velite.config.ts는 언어 허용 목록을 별도로 제한하지 않으므로(Shiki 기본 번들 전체 사용) 이론적으로는 문제 없어야 하지만, "이론상 지원"과 "이 저장소에서 실제 검증"은 다르다.
**How to avoid:** 9편 착수 전 `npm run build`로 `sql`/`powershell` 펜스가 포함된 임시 파일 하나를 빌드해 실제 HTML 출력을 확인한다(`## Architecture Patterns` Pattern 3 참고). 문제가 없으면 그대로 진행, 만약 특정 언어가 지원 목록에 없다면 rehype-pretty-code는 plain 텍스트로 조용히 폴백하므로 빌드는 깨지지 않지만 하이라이팅 없는 코드블록이 나온다 — 이 경우 언어 별칭(`shell` 대신 `bash`, `ps1` 대신 `powershell` 등)을 바꿔서 재시도한다.
**Warning signs:** 로컬 프리뷰에서 SQL/PowerShell 코드블록이 검정 단색(색상 구분 없음)으로 보이면 폴백이 발생한 것이다.

### Pitfall 5: `check-manifest.mjs` 상수를 파일럿 단계에서 잘못 건드림

**What goes wrong:** 파일럿(`1-3-python-variables-and-types`)은 이미 `hasContent: true`이므로 본문만 교체하면 `EXPECTED_HAS_CONTENT_COUNT`(현재 2)와 `EXPECTED_HAS_CONTENT_SLUGS`는 **그대로 둬야 한다.** 여기서 실수로 카운트를 올리면 Invariant 10이 실패한다.
**Why it happens:** "새 콘텐츠를 썼으니 카운트도 올려야 할 것 같다"는 직관적 오해.
**How to avoid:** Wave 1(파일럿)에서는 `check-manifest.mjs`를 건드리지 않는다. Wave 2(9편)에서만 `hasContent: false → true`를 9개 파일에 적용하면서 `EXPECTED_HAS_CONTENT_COUNT`를 2 → 11로, `EXPECTED_HAS_CONTENT_SLUGS`에 9개 slug를 추가한다(기존 `1-3-python-variables-and-types`, `2-3-react-components`는 유지).
**Source:** `[VERIFIED: scripts/check-manifest.mjs:6-9, 177-193]`

## Code Examples

### Claude API 최소 예제 (D-54, 1-2-generative-ai-basics)

```python
# claude_hello.py
# 환경변수 ANTHROPIC_API_KEY에 API 키가 설정되어 있어야 합니다.
# 키가 없다면 이 코드 대신 https://claude.ai 채팅 화면에 같은 질문을 붙여넣어
# 결과를 비교해보세요 — API와 채팅 UI가 같은 모델을 쓰는지 직접 확인하는 것도
# 좋은 "해보기" 과제입니다.

import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

response = client.messages.create(
    model="claude-opus-5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "생성형 AI를 한 문장으로 설명해줘."}
    ],
)

for block in response.content:
    if block.type == "text":
        print(block.text)
```

**실행 방법:**
```powershell
pip install anthropic
$env:ANTHROPIC_API_KEY = "여기에_발급받은_키"
python claude_hello.py
```

**Source:** `[VERIFIED: claude-api skill(이 세션 호출) → python/claude-api/README.md — client.messages.create(model="claude-opus-5", max_tokens=..., messages=[...]) 패턴, response.content 순회 후 block.type == "text" 확인 패턴을 그대로 인용]`, `[VERIFIED: PyPI registry — anthropic 최신 1.0.0]`. 모델 ID `claude-opus-5`는 세션 시점(2026-08) 기준 Anthropic의 권장 기본 모델이며, 레슨 집필 시점에 실제로 유효한지 한 번 더 확인할 것 — 모델 ID는 시간이 지나며 바뀔 수 있으므로 레슨 본문에 "최신 모델 ID는 Anthropic 공식 문서에서 확인하세요"라는 안내를 함께 적는 것을 권장(`## Assumptions Log` A1 참고).

### scikit-learn 분류+군집 최소 예제 (1-5-ml-model-types)

```python
# iris_classify_cluster.py
from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans

iris = load_iris()
X, y = iris.data, iris.target

# 1) 분류 — 정답(품종)을 알고 있을 때
clf = LogisticRegression(max_iter=200)
clf.fit(X, y)
print("첫 5개 샘플 예측:", clf.predict(X[:5]))
print("첫 5개 샘플 정답:", y[:5])

# 2) 군집 — 정답 없이 비슷한 것끼리 묶기
kmeans = KMeans(n_clusters=3, n_init=10, random_state=0)
labels = kmeans.fit_predict(X)
print("군집 결과(첫 5개):", labels[:5])
```

**실행 방법:**
```powershell
pip install scikit-learn
python iris_classify_cluster.py
```

**Source:** `[CITED: scikit-learn.org/stable/datasets/toy_dataset.html — load_iris는 150샘플·3품종 분류용 표준 내장 데이터셋, 별도 다운로드 불필요]` — 이 세션 WebSearch로 scikit-learn 1.9.0 공식 문서에서 교차 확인.

### SQL 연습 스키마 (1-4, D-56) — `## Architecture Patterns` Pattern 4 참고

## State of the Art

이 phase의 도메인(교육용 MDX 콘텐츠 집필)에는 급변하는 기술 트렌드가 없다 — Velite/rehype-pretty-code/Shiki 파이프라인은 Phase 1에서 이미 고정됐고 이 phase는 재검토 대상이 아니다. 유일하게 시간에 민감한 항목은 아래 하나다.

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Anthropic 모델 ID를 날짜 접미사와 함께 하드코딩(예: `claude-3-5-sonnet-20241022`) | 접미사 없는 모델 ID(예: `claude-opus-5`)만 사용, 최신 모델 목록은 공식 문서에서 재확인 | 지속적(모델 세대 교체마다) | 레슨에 특정 날짜 스냅샷 모델 ID를 박아두면 몇 달 안에 구식이 된다 — 레슨 본문에 "모델 ID는 바뀔 수 있으니 공식 문서를 확인하라"는 안내를 포함해 콘텐츠 수명을 늘린다 |

**Deprecated/outdated:** 없음 — 이 phase가 다루는 Python/SQL/Git/scikit-learn 기초 문법은 안정적이라 별도 폐기 예정 패턴이 없다.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | 1-2-generative-ai-basics 예제의 모델 ID `claude-opus-5`가 레슨 집필/배포 시점에도 여전히 유효한 현재 모델이다 | `## Code Examples` §Claude API 최소 예제 | 낮음 — 모델 ID가 폐기되면 API 호출이 400 에러를 내지만, 레슨 본문에 "최신 모델 ID는 공식 문서 확인" 안내를 병기하면 학습자가 직접 최신값으로 교체 가능. 집필 시점에 `client.models.list()` 또는 공식 문서로 재확인 권장 |
| A2 | `sql`/`powershell` 코드펜스가 이 저장소의 rehype-pretty-code/Shiki 설정에서 실제로 하이라이팅된다(이론상 지원되나 이 저장소에서 미실증) | `## Common Pitfalls` Pitfall 4, `## Architecture Patterns` Pattern 3 | 낮음~중간 — 실패해도 빌드는 깨지지 않고 plain 텍스트로 폴백되지만, 9편 전체에서 하이라이팅 없는 코드블록이 반복될 수 있다. 9편 착수 전 1회 스모크 빌드로 해소 가능 |
| A3 | `<details>` 안에 마크다운을 쓸 때 CommonMark의 "빈 줄 필수" 규칙이 이 프로젝트의 Velite MDX 컴파일러(mdx v3 계열)에도 동일하게 적용된다 | `## Common Pitfalls` Pitfall 3, `## Code Examples` | 낮음 — 파일럿에서 `<details>` 블록 하나를 실제로 렌더해 확인하면 9편 착수 전 해소된다. 틀렸다면 정답 텍스트의 서식(굵게/코드)이 깨져 보이는 정도로 영향 범위가 작음 |
| A4 | Windows PowerShell에서 `py --version`이 `python --version`보다 안정적으로 실제 설치를 가리킨다는 것이 모든 Windows 사용자 환경에 일반화된다(이 세션은 한 개발 머신에서만 확인) | `## Common Pitfalls` Pitfall 2 | 낮음 — `py` 런처는 python.org 공식 Windows 설치에 표준 포함되는 도구이므로 일반화 가능성이 높으나, 이 프로젝트는 사실상 1인 사용자(같은 머신)이므로 실질적 리스크는 매우 낮음 |

## Open Questions

1. **1-3-python-variables-and-types의 콘텐츠 범위를 curriculum.md 원문("변수, 자료형, 조건문, 반복문")에 맞춰 조건문·반복문까지 확장할 것인가, 아니면 title이 암시하는 대로 변수·자료형에 집중하고 조건문·반복문은 다른 곳(예: functions-and-io 레슨 도입부)에서 짧게 다룰 것인가?**
   - What we know: frontmatter title은 "Python 변수·자료형"으로 고정(변경 불가 대상), 그러나 curriculum.md 원문 불릿은 4개 주제를 묶고 있다. Step 1의 다른 어떤 레슨도 조건문·반복문을 명시적으로 다루지 않는다(1-3-python-functions-and-io는 "함수, 예외 처리, 파일 입출력"만 다룸).
   - What's unclear: 이것이 이미 알려진 채로 받아들여진 축약(제목은 짧게, 본문은 원래 4개 다 다룸)인지, 아니면 실제로 조건문·반복문이 커리큘럼에서 누락되는 것을 방치하는 것인지 discuss-phase에서 명시적으로 논의되지 않았다.
   - Recommendation: 파일럿 재작성 시 조건문·반복문을 "3. 개념 설명"과 "4. 실무 예제"에 짧게(각 1~2단락) 포함시켜 curriculum.md 범위를 완전히 충족시킨다. D-49("현재 파일럿보다 짧게")는 전체 분량 기준이지 항목 수 기준이 아니므로, 다른 절(예: 실무 팁)을 더 압축하면 총 분량은 여전히 줄일 수 있다. 이 방향을 파일럿 human-verify 체크포인트에서 사용자에게 명시적으로 확인받을 것을 권장(D-59가 파일럿에만 사람 검토를 남겨둔 이유와 정확히 부합).

2. **9편 병렬 집필 시 `check-brand.mjs`가 실제로 실행되는 시점은 언제인가(로컬 사전 검사 vs. 커밋 후 CI)?**
   - What we know: `check-brand.mjs`/`check-manifest.mjs`는 `package.json`에 npm script로 등록되어 있지 않고(`[VERIFIED: package.json 전체 Read — scripts에 check-brand/check-manifest 항목 없음]`), `node scripts/check-brand.mjs` 형태로 직접 실행하는 것이 유일한 경로다. CI 워크플로(GitHub Actions 등)가 이 저장소에 존재하는지는 이번 리서치 범위에서 확인하지 않았다.
   - What's unclear: 9편을 병렬로 쓰는 executor들이 각자 커밋 전에 이 스크립트를 로컬 실행하는지, 아니면 Wave 종료 시 한 번만 실행하는지.
   - Recommendation: 플래너가 Wave 2(9편) 완료 태스크에 `node scripts/check-brand.mjs`와 `node scripts/check-manifest.mjs` 실행을 명시적 검증 단계로 넣는다(9편 모두 병합된 뒤 최종 1회는 필수).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python(via `py` 런처) | 1-1/1-3/1-5 실습 코드 저자 확인, 학습자 로컬 실습 | ✓ | 3.12.10 | `python` alias가 스토어 스텁을 가리키면 `py` 사용(`## Common Pitfalls` Pitfall 2) |
| Git | 1-2 실습 코드 저자 확인 | ✓ | 2.52.0.windows.1 | — |
| Node/npm | `npm run build`로 스모크 테스트, 게이트 스크립트 실행 | ✓ | Node 24.13.0 / npm 11.6.2 | — |
| `anthropic`(PyPI) | 1-2 Claude API 예제 저자 확인 | ✓(레지스트리 확인) | 1.0.0 | 로컬 미설치 시 `pip install anthropic`로 즉시 설치 가능 |
| `scikit-learn`(PyPI) | 1-5 실습 코드 저자 확인 | 미확인(이 세션에서 직접 설치 시도 안 함) | — | 표준 PyPI 패키지, 설치 실패 위험 낮음 — 저자가 9편 집필 시 로컬에 1회 설치해 코드를 실제로 실행하며 확인 권장 |
| Supabase SQL 에디터 접근 | 1-4 SQL 예제 저자 확인(연습 스키마 실제 생성·삭제) | 미확인(대시보드 접근은 사용자 계정 필요, 이 세션에서 확인하지 않음) | — | 저자가 실제 Supabase 프로젝트 SQL 에디터에서 `practice` 스키마 예제를 1회 실행해 문법 오류가 없는지 확인 권장(D-56 자급자족 요구사항의 실질적 검증) |

**Missing dependencies with no fallback:** 없음.
**Missing dependencies with fallback:** `scikit-learn`, Supabase SQL 에디터 접근 — 둘 다 "실행자가 실습 코드를 실제로 돌려보고 커밋"하는 것이 이 phase의 유일한 자동화되지 않은 검증 경로이므로(D-59가 9편에 human-verify를 두지 않으므로), 저자 스스로 코드를 실행해보는 습관이 사실상의 품질 게이트다.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | 없음(Jest/Vitest 미설치) — Node 표준 모듈만 쓰는 커스텀 게이트 스크립트 체계(`[VERIFIED: package.json — devDependencies에 테스트 프레임워크 없음]`) |
| Config file | 없음 — `scripts/*.mjs` 각각이 독립 실행 파일 |
| Quick run command | `npm run build && node scripts/check-manifest.mjs && node scripts/check-brand.mjs` |
| Full suite command | 위 + `node --env-file=.env.local scripts/e2e-progress.mjs && node --env-file=.env.local scripts/e2e-today.mjs` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|--------------|
| CONT-02 | 각 레슨이 비유·핵심 정리를 포함한 쉬운 개념 설명을 제공한다 | manual(파일럿만 human-verify, 나머지는 저자 자체 검토 — D-59) | 없음(프로즈 품질은 자동 측정 불가) — `[선택 권장]` `scripts/check-lesson-structure.mjs` 신설 시 6단 헤딩 존재 여부는 자동 검증 가능 | 없음 — Wave 0 Gap |
| CONT-03 | 각 레슨이 실행 가능한 실무 예제 코드(언어별 하이라이팅 포함)를 제공한다 | manual(저자가 코드를 로컬/Supabase에서 직접 실행) + smoke(`npm run build`로 하이라이팅 렌더 확인) | `npm run build` (빌드 실패 시 MDX 컴파일 오류로 즉시 드러남) | 있음 — `npm run build` |
| CONT-02/03 공통 | KANT/이메일 등 공개 금지 문자열 0건 | automated | `node scripts/check-brand.mjs` | 있음 |
| CONT-02/03 공통 | `hasContent` 개수·slug가 기대값과 일치 | automated | `node scripts/check-manifest.mjs` | 있음 |
| 성공 기준 4(진행률·오늘의 학습 루프가 Step 1 콘텐츠로 실제로 채워짐) | e2e | `node --env-file=.env.local scripts/e2e-progress.mjs`, `node --env-file=.env.local scripts/e2e-today.mjs` | 있음 — **코드 변경 불필요.** 두 스크립트 모두 `LESSONS.find(l => l.hasContent)`로 프로브 레슨을 매니페스트에서 동적으로 뽑으므로(`[VERIFIED: scripts/e2e-progress.mjs:91]`), Step 1 레슨의 `hasContent`가 늘어나면 자동으로 새 레슨을 대상으로 재검증한다 |

### Sampling Rate
- **Per task commit(레슨 1편 완료마다):** `npm run build` (MDX 컴파일·하이라이팅 오류를 즉시 드러냄)
- **Per wave merge(파일럿 완료 시 / 9편 전체 병합 시):** Quick run 전체(`check-manifest` + `check-brand`)
- **Phase gate(Phase 4 완료 전):** Full suite 전체(e2e-progress + e2e-today 포함) — Supabase 실제 데이터로 진행률·오늘의 학습이 Step 1 콘텐츠로 왕복하는지 최종 확인

### Wave 0 Gaps

- [ ] (선택, 권장) `scripts/check-lesson-structure.mjs` — Step 1 10개 `.mdx` 파일 각각이 6개 헤딩(`## 1. 학습 목표` ~ `## 6. 핵심 정리 및 스스로 점검`)을 모두 포함하는지 정규식으로 검사하는 의존성 0 스크립트. D-59가 9편에 사람 검토를 두지 않기로 한 만큼, 구조 누락(예: 한 레슨이 실수로 5단만 쓰고 끝남)을 자동으로 잡아낼 유일한 안전망이 된다. 기존 게이트 스크립트 패턴(정규식 재파싱, 외부 의존성 0)을 그대로 따르면 추가 비용이 낮다.
- [ ] `sql`/`powershell` 코드펜스 하이라이팅 스모크 테스트(1회성, 임시 커밋 또는 로컬 빌드로 충분 — 영구 스크립트 불필요)

*(둘 다 필수는 아니다 — 사용자가 명시적으로 결정한 항목이 아니므로 Claude's Discretion으로 플래너가 채택 여부를 판단한다. 채택하지 않아도 기존 4개 게이트로 phase 완료는 가능하다.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | no | 이 phase는 인증 코드를 변경하지 않는다(기존 unlock 쿠키 메커니즘 그대로) |
| V3 Session Management | no | 동일 |
| V4 Access Control | no | 레슨 콘텐츠는 공개(D-14), 진도만 게이트 — 기존 정책 유지 |
| V5 Input Validation | no(직접) | 이 phase는 새 사용자 입력 경로를 추가하지 않는다. 다만 레슨 본문에 등장하는 SQL 예제가 학습자에게 "입력 검증 없는 쿼리"를 정상 패턴으로 가르치지 않도록 주의(아래 위협 패턴 참고) |
| V6 Cryptography | no | 변경 없음 |

이 phase는 애플리케이션 코드의 공격 표면을 넓히지 않는다(순수 콘텐츠 phase). 그러나 **콘텐츠 자체가 나쁜 보안 습관을 가르칠 위험**은 실질적이므로 아래 위협 패턴으로 다룬다.

### Known Threat Patterns for 콘텐츠 phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Claude API 키를 코드에 하드코딩하는 예제를 가르침 | Information Disclosure | D-54가 이미 환경변수 방식으로 결정. `## Code Examples`의 예제도 `os.environ.get("ANTHROPIC_API_KEY")`만 사용하고 실제 키 값을 절대 본문에 적지 않는다 — `check-brand.mjs`의 이메일 정규식과 별개로, API 키처럼 보이는 문자열(`sk-ant-...`)이 레슨 본문에 들어가지 않도록 저자가 직접 주의(자동 게이트는 이 패턴을 검사하지 않음 — Wave 0 Gap으로 추가할 수도 있으나 이번 phase 필수 항목은 아님) |
| SQL 예제가 학습자에게 문자열 결합으로 쿼리를 만드는 습관을 심음(SQL Injection의 씨앗) | Tampering | 1-4 예제는 Supabase SQL 에디터에서 직접 실행하는 정적 SQL(파라미터 바인딩 개념은 Step 2에서 다룸)이므로 인젝션 자체는 해당 없음 — 다만 "실무 팁"에 "이 SQL 에디터 예제는 값을 직접 타이핑하지만, 실제 애플리케이션 코드에서는 사용자 입력을 절대 문자열 결합으로 쿼리에 넣지 않는다"는 한 줄 경고를 넣어 Step 2로 넘어갈 때 나쁜 습관이 들지 않게 한다 |
| 연습 SQL이 실수로 `public.progress`를 손댐 | Tampering / 가용성 | D-56이 이미 `practice` 스키마 분리로 방지 — `## Architecture Patterns` Pattern 4 참고. 저자가 예제를 실제로 실행할 때 반드시 스키마 접두사를 확인 |

## Sources

### Primary (HIGH confidence)
- `C:/Users/dhchu/dev/aiEngineerCourse/.planning/phases/04-step-1/04-CONTEXT.md` — 이 phase의 모든 locked decision(D-47~D-61) 원문
- `C:/Users/dhchu/dev/aiEngineerCourse/.planning/curriculum.md` — Step 1 5개 모듈 원문 불릿(source of truth)
- `C:/Users/dhchu/dev/aiEngineerCourse/src/content/lessons/step-1/*.mdx`(10개 파일 전체) — frontmatter·기존 파일럿 본문 직접 Read
- `C:/Users/dhchu/dev/aiEngineerCourse/src/content/lessons/step-2/2-3-react-components.mdx` — 두 번째 참고 파일럿, 게이트 상수에 포함
- `C:/Users/dhchu/dev/aiEngineerCourse/velite.config.ts`, `src/app/lesson/[lessonId]/page.tsx`, `scripts/check-manifest.mjs`, `scripts/check-brand.mjs`, `scripts/e2e-progress.mjs`, `scripts/e2e-today.mjs`, `src/app/globals.css`, `src/content/modules.ts`, `package.json` — 전체 직접 Read
- `.planning/phases/01-deployed-curriculum-skeleton/01-UI-SPEC.md`, `.planning/phases/03-schedule-and-today/03-CONTEXT.md`, `.planning/research/PITFALLS.md`, `docs/making-of.md` — 전체 직접 Read
- claude-api 스킬(이 세션 호출) → `python/claude-api/README.md` — `anthropic` SDK 최소 예제, 현재 모델 ID(`claude-opus-5`) 확인
- PyPI registry(`pip index versions anthropic`, 이 세션 직접 실행) — `anthropic` 패키지 정당성·최신 버전 확인
- 이 세션 Bash 실행(`where python`, `py --version`, `$PATH` 순서, `git --version`) — Windows Python PATH 문제 직접 재현

### Secondary (MEDIUM confidence)
- scikit-learn 공식 문서(scikit-learn.org/stable/datasets/toy_dataset.html, WebSearch로 확인) — `load_iris`/`load_diabetes` 내장 데이터셋 사양
- CommonMark HTML-block 경계 규칙(웹 검색 교차 확인, GitHub/Docusaurus 등 여러 소스가 동일하게 설명) — `<details>` 빈 줄 규칙

### Tertiary (LOW confidence)
- rehype-pretty-code/Shiki의 `sql`/`powershell` 언어 지원(웹 검색만, 이 저장소에서 미실증) — `## Common Pitfalls` Pitfall 4, `## Assumptions Log` A2에서 리스크로 명시

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 새 라이브러리 없음, 기존 스택 버전을 `package.json`에서 직접 재확인
- Architecture: HIGH — 파이프라인 흐름과 게이트 상수를 코드에서 직접 확인, 레슨 매핑도 frontmatter 전체를 직접 Read
- Pitfalls: MEDIUM~HIGH — 대부분 이 세션에서 직접 재현/확인(Windows Python PATH, curriculum.md 범위 갭, check-manifest 상수 규칙)했으나, `sql`/`powershell` 하이라이팅 실증만은 아직 남아 있음(A2)

**Research date:** 2026-08-25
**Valid until:** 2026-09-08(약 2주) — 이 phase의 콘텐츠 자체는 안정적이지만, 1-2 레슨의 Claude API 모델 ID는 시간이 지나면 바뀔 수 있으므로(A1) 실제 집필 착수 직전에 재확인 권장
