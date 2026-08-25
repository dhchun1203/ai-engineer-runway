---
phase: 04-step-1
verified: 2026-08-25T04:48:49Z
status: passed
score: 4/4 must-haves verified (roadmap success criteria) — 2 human items closed by UAT 2026-08-25
behavior_unverified: 0
overrides_applied: 0
human_verification_resolved: 2026-08-25 (see 04-UAT.md)
human_verification:
  - test: "Step 1 두 SQL 레슨(`1-4-relational-db-basics`, `1-4-sql-queries-and-joins`)의 모든 SQL 블록을 실제 Supabase SQL 에디터(아이패드 브라우저 포함)에 순서대로 붙여넣어 문법 오류 없이 실행되는지 확인한다"
    expected: "각 블록이 에러 없이 실행되고, 본문이 설명한 행 수·결과가 실제 출력과 일치한다 (예: 외래키 위반 에러 메시지, JOIN 결과 4행 등)"
    why_human: "이 Plan(04-05)과 종단 게이트(04-07) 모두 Supabase 자격증명이 없는 worktree에서 실행돼 실제 실행을 증명하지 못했다 — 검증자도 Supabase SQL 에디터 접근 권한이 없어 문법·의미론 검토로만 확인했다(내용은 표준 PostgreSQL 문법으로 보이나 라이브 실행 증거는 아님)"
  - test: "나머지 5편(1-1-course-orientation, 1-2-generative-ai-basics, 1-3-python-functions-and-io, 1-4-sql-queries-and-joins, 1-5-ml-metrics-and-pipeline)을 프로덕션에서 스크롤하며 코드 블록 배경·padding·`<details>` 렌더링에 시각적 결함이 없는지 최소 한 번 눈으로 훑어본다"
    expected: "04-01 파일럿에서 발견된 두 렌더 결함(배경 불일치, padding 비대칭)과 같은 종류의 새 시각 결함이 없다"
    why_human: "`check-lesson-structure.mjs`는 구조만 검사하고 시각 렌더는 검사하지 않는다. 검증자가 4개 레슨(1-1-dev-environment-setup, 1-2-git-branch-and-pr, 1-4-relational-db-basics, 1-5-ml-model-types)을 스크린샷으로 스팟체크해 결함을 찾지 못했고 모든 레슨이 같은 `globals.css` 수정을 공유하지만, 나머지 5편은 아직 사람이 눈으로 보지 않았다"
---

# Phase 4: Step 1 심화 콘텐츠 Verification Report

> **[2026-08-25 갱신] 두 human_verification 항목 종결 — status: human_needed → passed**
>
> `/gsd-verify-work 04` 세션에서 두 항목 모두 실제로 수행됐다. 원래 "격리 환경이라
> 접근 권한이 없다"는 이유로 사람에게 넘겨진 항목이었으나, 해당 세션에는 Supabase MCP와
> Playwright MCP가 붙어 있어 그 전제가 깨졌다.
>
> **항목 1 (SQL 라이브 실행) — 통과, 단 결함 1건 발견 후 수정.**
> 두 레슨의 SQL 16블록을 Supabase에 순서대로 실제 실행했다. 블록 자체는 전부 본문 주장과
> 일치했고 외래키 위반 에러 메시지까지 글자 그대로 맞았다. 다만 **1편 → 2편 순서로 이어서
> 실습하면 2편 준비 블록이 42703으로 실패**하는 결함을 찾았다 (G-04-1, major).
> commit `f750017`에서 준비 블록을 `DROP SCHEMA ... CASCADE` 선행으로 바꿔 수정하고
> 같은 경로를 재실행해 통과 확인. 성공 기준 3의 "실행 가능한"은 이제 실측으로 충족된다.
>
> **항목 2 (5편 시각 확인) — 통과, 단 결함 1건 발견 후 수정.**
> 기계 검사(가로 넘침·`data-theme`·`<details>` 누출·터치 타깃·다크모드 대비·콘솔 에러)는
> 5편 전부 통과했고, 사람이 프로덕션에서 읽힘·톤을 확인해 승인했다. 자동 검사가 추가로
> **복사 버튼이 코드 첫 줄을 가리는 결함**을 잡아냈다 (G-04-2, cosmetic) — 같은 commit에서 수정.
>
> **이월:** G-04-2의 근본 원인(코드 블록 첫 줄에 버튼 폭만큼의 우측 여유가 없는
> `globals.css` 구조)은 콘텐츠 길이로만 회피된 상태다. 첫 줄이 긴 코드 블록을 새로 추가하면
> 재발한다. Phase 06(site-wide-design-polish)에서 구조적으로 해결할 것.
>
> **함께 관찰된 것 (Phase 06 후보, 이번 범위 밖):** 레슨 페이지에 `<main>` 랜드마크 없음;
> 상단 내비 링크 3개(`일정표` 36px, `소개` 24px, `Step 1` 39px)의 가로 폭이 44px 미만.

**Phase Goal:** 학습자가 Step 1(개발 기반 구축) 전체를 사이트에서 실제로 학습하고 완료 체크할 수 있다 — 사전학습이 여기서 시작된다
**Verified:** 2026-08-25T04:48:49Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Step 1의 5개 모듈(온보딩·Git/생성형AI·Python·SQL·ML 기초) 전 레슨이 작성되어 읽을 수 있다 | ✓ VERIFIED | `src/content/lessons/step-1/*.mdx` 10개 파일 모두 `hasContent: true`, 6단 헤딩 구조 확인. `node scripts/check-lesson-structure.mjs` → "10개 레슨, 6개 검사 통과" (독립 재실행 확인). 프로덕션 `/curriculum` → Step 1 페이지에서 5개 모듈 각 2편, 전부 "레슨 시작하기" 링크(준비 중 아님) 스크린샷으로 확인 |
| 2 | 각 레슨이 비유와 핵심 정리를 포함한 쉬운 개념 설명을 제공해, 사전지식 없이 읽고 이해할 수 있다 | ✓ VERIFIED | 10개 파일 모두 `## 3. 개념 설명`에 이모지 소제목 + 비유(예: "표 하나 = 테이블", "자판기" 비유) + 용어 첫 등장 시 "한글(English, 뜻)" 병기 확인. `## 6. 핵심 정리 및 스스로 점검` 안에 `**핵심 정리**` 불릿 + `**이 레슨의 단어**` 5~8행 표 + `**스스로 점검**` 2문항, 각각 접힌 `<details>` 정답 포함 — 10개 파일 전수 grep 확인. 프로덕션 `/lesson/1-5-ml-model-types` 전체 스크린샷으로 표·비유·용어표 실제 렌더 확인 |
| 3 | 각 레슨이 커리큘럼 동일 스택(Python, SQL/PostgreSQL, Git)의 실행 가능한 실무 예제 코드를 언어별 하이라이팅과 함께 제공한다 | ⚠️ 부분 검증 (아래 참고) | 코드펜스 언어 태그 전수 확인: `python`(4편) · `powershell`(6편) · `sql`(2편) · `text`(2편), 벌거벗은 펜스 0건. Shiki 언어별 하이라이팅 실제 확인 — `python`/`sql` 코드는 다색(4색 이상: 키워드·문자열·주석·식별자) 확인(스크린샷), `powershell`은 주석 유무에 따라 2~4색(계산된 스타일로 직접 확인: `--`가 `#F47067`, 본문 `#ADBAC7`, 주석 `#768390`, 문자열/URL `#6CB6FF`) — **폴백이 아닌 실제 언어 인식 하이라이팅**이지만 PowerShell 명령 자체가 색 붙을 키워드가 적어 Python 대비 시각적으로 단조롭다(알려진 한계, 게이트 통과 대상은 아님). Python·PowerShell 실무 예제는 실제 로컬 실행 결과가 SUMMARY(04-04·04-06)에 기록돼 있다. **SQL 두 레슨은 문법·의미론 검토로만 확인됐고 실제 Supabase SQL 에디터에서 실행된 적이 없다** — 사람 검증 항목 1 참고 |
| 4 | Step 1 레슨을 진행하면 Step 1 진행률과 오늘의 학습 뷰가 실제로 채워지며 학습 루프가 끝까지 동작한다 | ✓ VERIFIED | 오케스트레이터가 병합된 master에서 `e2e-progress.mjs`·`e2e-today.mjs`를 실 Supabase 자격증명으로 실행해 통과 확인(완료 토글 브라우저→쿠키→Server Action→Supabase→재렌더 왕복, 오늘의 학습·일정표 Step 1 실콘텐츠 위에서 동작). 검증자가 독립적으로 프로덕션 홈(`/`)을 열어 "오늘의 학습" 뷰가 실제 Step 1 레슨("과정 운영 방식과 학습 준비")과 D-36 카운트다운을 렌더함을 스크린샷으로 재확인 |

**Score:** 4/4 success criteria have supporting evidence; criterion 3 carries an open human-verification item (SQL live execution) and criterion 1/2 carry a residual light-weight visual-spot-check item for 5 of 10 lessons not individually screenshotted.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/content/lessons/step-1/*.mdx` (10개) | eli5×6단 본문, `hasContent: true` | ✓ VERIFIED | 전수 확인: frontmatter 8필드(title/stepId/moduleId/order/depth/estimatedMinutes/hasContent/slug) 모두 존재, `hasContent: true`, 6단 헤딩 순서·해보기 2~3개·details 5쌍·용어표 존재 |
| `scripts/check-lesson-structure.mjs` | Step 1 구조 게이트 | ✓ VERIFIED | 독립 재실행 exit 0, "10개 레슨, 6개 검사 통과" |
| `scripts/check-manifest.mjs` | Invariant 10 (`EXPECTED_HAS_CONTENT_COUNT=11`, 슬러그 11개) | ✓ VERIFIED | 상수 직접 확인 — Step 1 10편 + `2-3-react-components` 정확히 일치. 오케스트레이터 재실행 결과 "all 13 invariants passed" |
| `src/app/lesson/[lessonId]/page.tsx` | 빈 상태 카피 갱신(Step 1 완성 반영) | ✓ VERIFIED | `<p>` 문구가 `01-UI-SPEC.md` Copywriting Contract Empty state body 행과 문자 단위 일치(HTML 엔티티 제외) |
| `.planning/phases/01-.../01-UI-SPEC.md` | Copywriting Contract·Edge-state 표 갱신 | ✓ VERIFIED | Empty state 행·빈 상태 레슨 수(33→24) 확인 |
| `docs/making-of.md` | Phase 4 4단계 기록 | ✓ VERIFIED (구조) | Phase 4 섹션 존재 확인(파일 grep). 톤·품질은 사람 판단 영역이나 phase 목표에 직접 필요하지 않음 |
| `src/app/globals.css` | `.prose details/summary` + 코드 블록 padding 수정 | ✓ VERIFIED | 규칙 존재 확인 + 브라우저 스크린샷으로 실제 렌더 결함 없음 재확인(4개 레슨 스팟체크) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `.mdx` 본문 | 프로덕션 렌더 | Velite → Shiki → `.velite/lessons.json` → `MDXContent` → `/lesson/[lessonId]` | ✓ WIRED | `npm run build` 성공(오케스트레이터 확인) + 검증자가 프로덕션 URL 5개 페이지를 직접 열어 렌더 확인 |
| `hasContent: true` (10편) | `check-manifest.mjs` Invariant 10 | `.velite/lessons.json` 카운트/슬러그 대조 | ✓ WIRED | 상수·실제 매니페스트 일치 확인 |
| Step 1 콘텐츠 | 오늘의 학습·진행률 뷰 | `getOrderedLessons()` → 홈/스케줄 컴포넌트 | ✓ WIRED | 프로덕션 홈에서 실제 Step 1 레슨명 렌더 확인 + e2e-today.mjs 통과(오케스트레이터) |
| 완료 토글 | Supabase `lesson_progress` | 브라우저 → 쿠키 게이트 → Server Action → Supabase | ✓ WIRED | e2e-progress.mjs 통과(오케스트레이터, 실 자격증명) |
| `<details>` 마크업 | 렌더된 서식(굵게·인라인 코드·코드블록) | CommonMark HTML-block 빈 줄 규칙 | ✓ WIRED | 브라우저에서 details 5개 강제 확장(JS) 후 스크린샷 — 코드 블록·굵은 글씨 정상 렌더, raw 텍스트 노출 없음 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| 홈 "오늘의 학습" | 오늘 배정 레슨 | `getOrderedLessons()` (파일 기반) + 일정 계산 | Yes | ✓ FLOWING — 스크린샷에서 "과정 운영 방식과 학습 준비"(1-1-course-orientation, 일정 1일차)가 실제로 표시됨, 하드코딩 아님 |
| `/curriculum` → Step 1 | 모듈별 레슨 목록 | `.velite/lessons.json` | Yes | ✓ FLOWING — 5개 모듈 각 2편, "레슨 시작하기" 링크(빈 상태 카피 아님) |
| 레슨 페이지 코드펜스 | 하이라이팅 색상 | rehype-pretty-code/Shiki(build-time) → 정적 HTML `span[style]` | Yes | ✓ FLOWING — `getComputedStyle` 직접 조회로 실제 색상 값 확인(단색 아님) |

### Behavioral Spot-Checks

| Behavior | Command/Action | Result | Status |
|----------|-----------------|--------|--------|
| 구조 게이트가 실제로 통과한다 | `node scripts/check-lesson-structure.mjs` | "10개 레슨, 6개 검사 통과" | ✓ PASS |
| 단일 줄 SQL 코드 블록이 정상 렌더된다(min-height 미실측 항목) | 브라우저로 `1-4-relational-db-basics`의 `INSERT ... (999, 1);` 블록 확장·스크린샷 | 패딩 균형(위/아래 여백 대칭), 복사 버튼이 텍스트와 안 겹침, 하이라이팅 정상 | ✓ PASS |
| 단일 줄 text 코드 블록이 정상 렌더된다 | 브라우저로 `1-2-git-branch-and-pr`의 `clone → branch → ... → pull` 블록 스크린샷 | 패딩 균형, 복사 버튼 안 겹침 | ✓ PASS |
| PowerShell 코드펜스가 실제 언어 인식 하이라이팅이다(폴백 아님) | `getComputedStyle` span 색상 직접 조회 | 명령만 있을 때 2색(본문/연산자), 주석 있을 때 4색(본문/연산자/주석/문자열) | ✓ PASS (한계는 있으나 폴백 아님) |
| `<details>` 안 마크다운이 raw 텍스트로 노출되지 않는다 | 브라우저 JS로 5개 details 전부 강제 확장 후 스크린샷 | 코드 블록·굵은 글씨·인라인 코드 정상 렌더 | ✓ PASS |
| 홈 "오늘의 학습"이 Step 1 실콘텐츠로 채워진다 | 프로덕션 `/` 스크린샷 | "과정 운영 방식과 학습 준비" + D-36 렌더 | ✓ PASS |
| SQL 예제가 실제 Supabase에서 실행된다 | (실행 불가 — 접근 권한 없음) | 문법·의미론 검토만 가능(표준 PostgreSQL, 별 이상 없음) | ? SKIP → 사람 검증 항목 1 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CONT-02 | 04-01~07 | 각 레슨 페이지는 쉬운 개념 설명(비유, 핵심 정리 포함)을 제공한다 | ✓ SATISFIED (Step 1 범위) | 10편 전수 구조·내용 확인. `REQUIREMENTS.md`는 아직 `[ ]`/Traceability "Pending" 상태 — 이 문서 갱신은 이 검증의 범위 밖이나, 콘텐츠 자체는 충족됨 |
| CONT-03 | 04-01~07 | 각 레슨 페이지는 실무 적용 예제 코드(언어별 문법 강조 포함)를 제공한다 | ⚠️ SATISFIED with caveat | Python/PowerShell 코드는 로컬 실행 확인됨(SUMMARY 기록). SQL 두 레슨은 실행 미검증(문법 검토만). 하이라이팅은 전 언어에서 실제 동작(단색 폴백 아님) |

REQUIREMENTS.md의 checkbox(`[ ]`)와 Traceability 표의 "Pending" 상태는 이 phase 완료 후 갱신되지 않은 상태다 — 오케스트레이터/후속 워크플로가 이 문서를 CONT-02/CONT-03 완료로 갱신해야 한다(검증자 범위 밖, 기능적 갭 아님).

### Anti-Patterns Found

None. `grep -rniE "TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER|coming soon|not yet implemented"`를 이 phase가 수정한 10개 레슨 파일 + `check-manifest.mjs` + `page.tsx`에 실행 — 매치 없음.

### Human Verification Required

#### 1. SQL 레슨 2편 실제 Supabase SQL 에디터 실행 확인

**Test:** `1-4-relational-db-basics`·`1-4-sql-queries-and-joins`의 모든 SQL 코드 블록을 순서대로 Supabase SQL 에디터(가능하면 아이패드 브라우저)에 붙여넣어 실행한다.

**Expected:** 모든 블록이 문법 오류 없이 실행되고, 본문이 설명한 결과(행 수, 에러 메시지 등)와 실제 출력이 일치한다. 마지막 `DROP SCHEMA IF EXISTS practice CASCADE;`로 정리했을 때 `public.progress`(사이트 진도 데이터)에 영향이 없다.

**Why human:** 이 Plan의 executor(04-05)도, 종단 게이트(04-07)도, 이 검증자도 Supabase 자격증명/에디터 접근 권한이 없어 실제 실행을 증명하지 못했다. 지금까지의 검증은 전부 문법·의미론 정적 검토다. SQL 문법 자체는 표준 PostgreSQL로 보이며 이상 징후는 없었으나, "실행 가능한" 이라는 성공 기준 3의 문구를 문자 그대로 충족했다고 자동으로 판정할 수 없다.

#### 2. 나머지 5개 레슨의 프로덕션 시각 검수

**Test:** `1-1-course-orientation`, `1-2-generative-ai-basics`, `1-3-python-functions-and-io`, `1-4-sql-queries-and-joins`, `1-5-ml-metrics-and-pipeline` 5편을 프로덕션에서 스크롤하며 코드 블록·`<details>`·표 렌더링을 눈으로 훑는다(아이패드 권장).

**Expected:** 04-01 파일럿에서 발견됐던 것과 같은 종류의 시각 결함(코드 블록 배경 불일치, padding 비대칭 등)이 없다.

**Why human:** `check-lesson-structure.mjs`는 구조만 검사한다(D-59의 알려진 트레이드오프). 검증자가 4개 레슨(1-1-dev-environment-setup, 1-2-git-branch-and-pr, 1-4-relational-db-basics, 1-5-ml-model-types)을 스크린샷으로 확인해 결함을 발견하지 못했고, 전 레슨이 같은 `globals.css` 수정을 공유하므로 위험도는 낮지만, 나머지 5편은 아직 사람이 실제로 보지 않았다.

### Gaps Summary

No blocking gaps. All roadmap success criteria have codebase evidence — 10/10 Step 1 lessons are written, structurally valid, render correctly wherever spot-checked, and the progress/today-view loop is confirmed working end-to-end with real Supabase credentials (by the orchestrator) and independently re-confirmed by this verifier on the production homepage. The two open items above are honest carry-overs the executors themselves flagged (SQL never executed live; structure gate can't see rendering) — neither one is a stub, missing artifact, or broken wiring; both are residual-risk items that need a human's eyes/hands, not a code fix.

---

*Verified: 2026-08-25T04:48:49Z*
*Verifier: Claude (gsd-verifier)*
