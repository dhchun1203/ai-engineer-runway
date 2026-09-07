# Phase 4: Step 1 심화 콘텐츠 - Context

**Gathered:** 2026-08-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Step 1(개발 기반 구축) 5개 모듈 × 2편 = 레슨 10편의 본문을 집필해, 학습자가 사이트에서 실제로 읽고 실습하고 완료 체크할 수 있게 한다 (CONT-02 쉬운 개념 설명, CONT-03 실행 가능한 실무 예제). 집필 표준은 **eli5 방식 + D-10 6단 템플릿**이며, 파일럿 1편을 먼저 써서 사용자 승인을 받은 뒤 나머지 9편을 쓴다. 플랫폼(Phase 1~3)은 이미 준비되어 있어 `.mdx` 파일 본문 작성 + `hasContent` 전환 + 게이트 상수 갱신만으로 동작한다. Step 2·3 본문(Phase 5), 디자인 정리(Phase 6), 새 MDX 컴포넌트 라이브러리·다이어그램 파이프라인·퀴즈 엔진은 범위 밖.

현재 상태: 10편 중 `1-3-python-variables-and-types` 1편만 작성됨(eli5 이전 스타일, 파일럿 재작성 대상), 나머지 9편은 `hasContent: false` 스텁.

</domain>

<decisions>
## Implementation Decisions

### 집필 표준 — eli5 × 6단 템플릿 (CONT-02)
- **D-47:** **6단 구조(D-10) 유지 + 각 단을 eli5 톤으로 집필** — ① 학습 목표 → ② 왜 배우나 → ③ 개념 설명(비유) → ④ 실무 예제 → ⑤ 실무 팁 → ⑥ 핵심 정리·스스로 점검 순서는 그대로. 글쓰기만 바꾼다: 짧은 문장, 전문 지식 전제 없음, 용어마다 풀이. Making-of(`docs/making-of.md`)의 문체가 톤 선례 — **Reversibility:** costly — 이 표준으로 Step 1 10편이 쓰이고 Phase 5가 같은 표준을 25편에 적용하므로 이후 변경 시 전 레슨 재작업
- **D-48:** **"큰 그림"은 마크다운만으로 표현** — 이모지 섹션 헤더, "일상 비유" 열이 있는 표, `A → B → C` 흐름 한 줄. Mermaid·SVG·이미지·ASCII 다이어그램·새 MDX 컴포넌트 없음. 플랫폼 변경 0 (PITFALLS Pitfall 4 "콘텐츠 전에 컴포넌트 라이브러리 금지" 준수)
- **D-49:** **150분(D-31) = 읽기 약 30분 + 실습·해보기 약 120분** — 본문은 현재 Python 파일럿보다 짧게. 실무 예제를 직접 돌리고 바꿔 보는 "해보기" 과제 2~3개가 나머지 시간을 채운다. 글이 시간을 채우지 않는다
- **D-50:** **용어는 첫 등장 시 "한글(English, 한 줄 풀이)" + ⑥ 안에 "이 레슨의 단어" 표** — 예: "브랜치(branch, 작업을 따로 복사해 두는 갈래)". 이후 등장은 한글만, 코드 안에서는 영어 그대로. ⑥ 핵심 정리 안에 용어 5~8개 표(단어 · 한 줄 뜻)를 넣어 복습·개강 후 참조용으로 쓴다

### 파일럿·집필 순서
- **D-51:** **파일럿 = `1-3-python-variables-and-types` eli5 재작성** — 기존 구 스타일 본문을 교체. 전후 비교가 가능하고 개념+코드+해보기 세 요소를 한 번에 검증한다. Wave 1 = 이 1편 작성 + human-verify 체크포인트, 승인 전에는 다른 레슨을 쓰지 않는다 (PROJECT.md Key Decisions 2026-08-25). 수정 요청이 오면 파일럿을 고쳐 다시 확인받는다
- **D-52:** **승인 후 나머지 9편은 병렬 집필 한 번에** — 커리큘럼 순서 wave가 아니라 모듈별 병렬로 한꺼번에 쓰고 한 번에 배포. 중간 사람 검토 없음(D-59)
- **D-53:** **1-1 "과정 운영 방식과 학습 준비" = 커리큘럼 지도 + 사전학습 사이트 사용법 + 하루 루틴** — 3 Step·19 모듈·프로젝트 5종이 어떻게 이어지는지 큰 그림, 이 사이트로 5주 공부하는 법(오늘의 학습·완료 체크·일정표·페이스), 하루 학습 루틴. 기관 정보·OT 자료는 없으며 쓰지 않는다(D-02). ④ 실무 예제 자리에는 코드 대신 비코드 산출물(예: 학습 기록 템플릿)
- **D-54:** **1-2 "생성형 AI 개념과 활용 윤리" 실무 예제 = Python Claude API 호출 최소 예제 + 키 없이도 되는 대체 경로** — API 키는 환경변수, 키가 없으면 같은 프롬프트를 채팅 UI에 붙여 넣어 비교하는 방법을 함께 안내. Step 2 LLM API 레슨의 예고편 역할. Ollama 등 로컬 모델 안내 없음

### 실습 환경 (CONT-03, D-12 "실행 방법 명시"의 기준)
- **D-55:** **읽기는 아이패드, Python·scikit-learn 실습은 PC 로컬 Python** — VS Code + `python 파일명` 한 줄로 통일. Colab 안내 없음. 1-1 환경 세팅 레슨이 설치를 다룬다
- **D-56:** **SQL 레슨(1-4)은 Supabase SQL 에디터에서 실행** — 브라우저라 아이패드에서도 가능, PostgreSQL 문법 그대로(Step 2 연결). 예제는 CREATE TABLE + INSERT + 쿼리가 한 묶음으로 자급자족. **연습용 스키마를 별도로 분리**한다 — 사이트 진도가 저장된 공유 Supabase 프로젝트(`public.progress`)를 건드리는 예제는 금지
- **D-57:** **Git 레슨(1-2)은 PC 터미널 git 명령 + GitHub 웹에서 PR** — 연습용 새 저장소를 만들어 clone→branch→commit→push→PR→merge 한 바퀴를 명령 순서대로. 이 사이트 저장소의 PR 프리뷰 배포(D-16)를 실제 사례로 언급 가능
- **D-58:** **OS 기준은 Windows(PowerShell), 다를 때만 macOS 한 줄 병기** — `python`·`git`처럼 공통인 명령은 그대로, 경로·설치처럼 다른 부분만 macOS 병기

### 검토 리듬·점검 형식
- **D-59:** **사람 검토는 파일럿 1편만, 나머지 9편은 자동 게이트로만 완료 처리** — 파일럿 승인으로 표준이 굳으면 9편은 `check-brand`(KANT·이메일 0건)·`check-manifest`(hasContent 불변식)·빌드·e2e(진행률·오늘의 학습 루프)만 통과하면 완료. 추가 human-verify 체크포인트를 두지 않는다. 사용자는 이후 실제 사전학습 중 발견하는 문제를 quick task로 고친다
- **D-60:** **파일럿 확인 장소 = master 푸시 → 프로덕션 URL을 아이패드로** — 기존 UAT 방식과 동일. 파일럿은 기존 레슨 교체라 잠시 공개되어도 해롭지 않음. 수정 요청 시 같은 경로로 재배포
- **D-61:** **"스스로 점검"·"해보기" 정답은 문제 바로 아래 접힌 `<details><summary>정답 보기</summary>`** — MDX 기본 HTML이라 컴포넌트 추가 0. 아이패드 터치로 펼침. 실행형 과제는 "예상 출력"을, 질문형은 풀이를 담는다

### Claude's Discretion
- 파일럿 승인 후 9편 병렬 wave 구성(모듈별 executor 분할 등)과 각 레슨의 이모지 헤더·표·해보기 과제 개수(2~3개 범위 안)
- `scripts/check-manifest.mjs` Invariant 10의 `EXPECTED_HAS_CONTENT_COUNT`·`EXPECTED_HAS_CONTENT_SLUGS` 갱신 방식(2 → Step 1 10편 + Step 2 파일럿 1편 = 11) — 파일럿 단계와 9편 단계에서 각각 맞춰야 함
- `src/app/lesson/[lessonId]/page.tsx`의 "콘텐츠 준비 중" 카피(현재 두 파일럿을 지목) — Step 1 완성 후 Step 2·3 스텁에 맞게 문구 조정 (01-UI-SPEC Copywriting Contract 갱신 포함)
- `<details>` 요소의 prose 안 스타일(summary 터치 타깃 44px+, 다크모드) — `globals.css` `.prose` 블록에 최소 추가
- ML 레슨(1-5) 데이터셋 — scikit-learn 내장 데이터셋(외부 다운로드 없음) 권장, 선택은 리서치·플래너 판단
- 1-1 "GitHub·학습 도구 환경 세팅" 레슨의 설치 범위 — D-55~D-58에서 파생(VS Code, Python, Git, GitHub 계정, Supabase 계정), 구체 순서는 재량
- Making-of(`docs/making-of.md`) 4단계 갱신 시점·문구 — PLAT-03 규칙(phase 전환마다 eli5 방식으로 갱신) 준수하면 됨

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 커리큘럼·레슨 파일
- `.planning/curriculum.md` §Step 1 — 5개 모듈의 주제 원문(source of truth). 각 레슨 2편은 모듈의 불릿 2개에 대응
- `src/content/lessons/step-1/*.mdx` — 집필 대상 10편. 프론트매터(title·moduleId·order·depth·estimatedMinutes 150·slug)는 확정값, 본문과 `hasContent`만 바꾼다
- `src/content/lessons/step-1/1-3-python-variables-and-types.mdx` — 현재 파일럿(구 스타일). D-51 재작성 대상이자 6단 구조의 참고
- `src/content/lessons/step-2/2-3-react-components.mdx` — Step 2 파일럿. 이 phase에서 변경 없음(hasContent 유지, 게이트 상수에 포함)

### 톤·문체 선례
- `docs/making-of.md` — eli5 톤 선례: 이모지 헤더, "한 문장으로 말하면", 괄호 한 줄 풀이, 짧은 문장, 표. D-47·D-48·D-50의 기준

### 파이프라인·게이트
- `velite.config.ts` — 레슨 스키마(`hasContent` 기본 true, rehype-pretty-code + 복사 버튼). 변경 없음
- `src/app/lesson/[lessonId]/page.tsx` — `hasContent` 분기와 "준비 중" 카피, 완료 버튼(D-21)·페이저 배치
- `scripts/check-manifest.mjs` — Invariant 10 `EXPECTED_HAS_CONTENT_COUNT`/`SLUGS` 갱신 필요
- `scripts/check-brand.mjs` — src/·docs/ 전체 KANT·이메일 0건 상시 게이트(레슨 본문 포함, D-02)
- `scripts/e2e-progress.mjs`, `scripts/e2e-today.mjs` — 성공 기준 4(진행률·오늘의 학습 루프) 검증 수단
- `src/app/globals.css` — `.prose` 커스텀(복사 버튼 44px, line-height) — `<details>` 스타일 추가 위치

### 이전 Phase 결정
- `.planning/phases/01-deployed-curriculum-skeleton/01-CONTEXT.md` — D-10(6단 템플릿), D-12(완결 코드 + 실행 방법), D-13(메타데이터 확정), D-02(KANT 금지)
- `.planning/phases/01-deployed-curriculum-skeleton/01-UI-SPEC.md` §Copywriting Contract — empty state("콘텐츠 준비 중입니다") 카피 원천
- `.planning/phases/02-progress-tracking/02-CONTEXT.md` — D-21(완료 버튼은 본문 끝, 페이저 위) — 레슨 끝 구성과 맞물림
- `.planning/phases/03-schedule-and-today/03-CONTEXT.md` — D-31(심화 레슨 150분 — D-49 배분의 총량), D-32(하루 1레슨)
- `.planning/PROJECT.md` — Constraints(KANT HARD RULE, 아이패드 1순위), Key Decisions(eli5 파일럿 우선 2026-08-25)
- `.planning/research/PITFALLS.md` §Pitfall 4 — MDX 컴포넌트 라이브러리를 콘텐츠 전에 만들지 말 것(D-48 근거)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- MDX 파이프라인(Velite → rehype-pretty-code/Shiki → `MDXContent`) — 언어별 하이라이팅(python·sql·bash·powershell·text)과 44px 복사 버튼이 이미 동작. 레슨은 `.mdx` 본문만 쓰면 됨
- `@tailwindcss/typography` `.prose` — 표·인용·`<details>` 등 마크다운 요소 기본 스타일 제공. keep-all·line-height 1.6 적용됨
- `src/content/curriculum-helpers.ts` `getOrderedLessons` — 일정·진행률이 slug 순서에서 파생되므로 본문 추가만으로 오늘의 학습·진행률이 자동으로 채워짐(성공 기준 4)

### Established Patterns
- 콘텐츠 = 파일, 진도 = Supabase — 레슨 집필은 플랫폼 코드 변경 없이 파일 추가·수정으로 완결(ARCHITECTURE.md)
- 게이트 스크립트는 의존성 0·정규식 재파싱 — `check-manifest.mjs`의 기대 상수는 실행자가 직접 갱신해야 함
- 공개 표면 KANT 0건 — 레슨 본문·코드 주석까지 `check-brand.mjs`가 검사
- 파일럿 검증 = master 푸시 → 프로덕션 → 아이패드 UAT (Phase 1~3 관행, D-60)

### Integration Points
- `src/content/lessons/step-1/*.mdx` 10편 — 본문 작성, `hasContent: true` 전환
- `scripts/check-manifest.mjs` — Invariant 10 상수 (파일럿 단계: 2 유지·본문만 교체 / 9편 단계: 11)
- `src/app/lesson/[lessonId]/page.tsx` + `01-UI-SPEC.md` Copywriting Contract — "준비 중" 카피 문구 조정
- `src/app/globals.css` `.prose` — `<details>/<summary>` 터치 타깃·다크모드 스타일
- `docs/making-of.md` — Phase 4 기록 갱신(PLAT-03)

</code_context>

<specifics>
## Specific Ideas

- "이 사이트의 목적은 사전학습이지 마스터가 아니야" (Phase 3) — 분량·톤의 기준. 글은 짧게, 해보기로 익히게
- Making-of 페이지의 eli5 결과가 마음에 들어 레슨에 확장한 것 — 같은 재료(이모지 헤더·괄호 풀이·비유 표·짧은 문장)로 쓰면 된다
- 파일럿은 Python 변수·자료형 재작성이므로 사용자가 구 버전과 새 버전을 직접 비교해 판단한다 — 승인 기준은 "읽기 쉬움 + 코드가 돌아감 + 해보기가 시간을 채움"
- SQL 예제는 사이트 진도를 저장하는 공유 Supabase 프로젝트에서 실행될 수 있으므로, 연습 스키마 분리와 `public.progress` 불간섭을 예제 안에서 명시
- 오늘(2026-08-25)이 일정표 1일차 — 파일럿·9편이 빨리 배포될수록 실제 사전학습이 빨리 시작된다

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Colab 대체 경로·Mermaid 다이어그램·모듈별 중간 검토는 대안으로 검토 후 채택하지 않음 — 필요해지면 quick task로 추가)

</deferred>

---

*Phase: 4-Step 1 심화 콘텐츠*
*Context gathered: 2026-08-25*
