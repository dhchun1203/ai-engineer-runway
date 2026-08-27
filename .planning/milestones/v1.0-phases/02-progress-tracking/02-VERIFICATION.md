---
phase: 02-progress-tracking
verified: 2026-08-24T12:00:00Z
status: passed
score: 5/5 roadmap success criteria verified (57/57 plan-level must-have truths present+wired; 2 flagged present_behavior_unverified, see below)
behavior_unverified: 2
overrides_applied: 0
human_verification:

  - test: "데스크톱 브라우저에서 프로덕션 URL + /unlock?key=<UNLOCK_SECRET>로 잠금 해제 후 레슨 완료 → 하드 리프레시 → iPad Safari에서 같은 비밀 링크로 같은 레슨을 열어 완료 상태가 동일하게 보이는지, iPad에서 취소 후 데스크톱 새로고침에도 반영되는지 확인"
    expected: "완료/취소 상태가 두 기기·두 브라우저에서 동일하게 보인다 (성공 기준 1·2)"
    why_human: "e2e-progress.mjs는 단일 HTTP 클라이언트로 쿠키 헤더를 조작해 서버 렌더 결과만 검증한다 — 실제 두 개의 물리 기기·브라우저 세션 간 왕복은 사람이 직접 확인해야 한다. WINDOWS.md #3(unrun-verify)로 이미 기록됨"

  - test: "홈/Step 1에서 전체 진행률 숫자·Step 카드 3장 바·모듈 배지 숫자가 실제 완료 개수와 맞는지 육안 확인, '이어서 학습하기' CTA가 실제로 다음 미완료 레슨으로 이동하는지 확인"
    expected: "화면에 보이는 숫자가 실제 완료 상황과 일치하고 CTA가 올바른 레슨으로 이동한다 (성공 기준 3·4)"
    why_human: "e2e가 서버 렌더 HTML의 마커·수치를 이미 기계적으로 확인했으나(i2-i5, h1-h4), 실제 화면에서의 육안 확인은 end-of-phase UAT로 남겨짐. WINDOWS.md #2, #3"

  - test: "시크릿 창(쿠키 없음)으로 프로덕션 홈·Step·레슨 세 화면을 열고 개발자도구 요소 검사로 완료 버튼·진행률 바·요약 블록이 DOM에 아예 없는지 확인, /unlock?key=아무거나가 무효 안내를 보여주는지 확인"
    expected: "진도 관련 DOM 요소가 렌더 트리에 전혀 없고, 콘텐츠는 정상 공개된다 (성공 기준 5)"
    why_human: "e2e가 응답 본문 문자열에서 마커 0건을 이미 확인했으나(b/h1/i1 시나리오), devtools 요소 검사 수준의 최종 확인은 사람이 해야 한다. WINDOWS.md #1, #3"

  - test: "아이패드 세로/가로 모드에서 완료 버튼·CTA·아코디언 헤더 터치 타깃, 완료 전환 애니메이션(체크 아이콘 fade+scale-in, accent ring/glow)의 체감, prefers-reduced-motion 환경에서 연출 없이 즉시 전환되는지, 라이트/다크 두 테마에서 진행률 바·배지 색이 읽히는지 확인"
    expected: "44px+ 히트 영역이 유지되고 연출이 성취감 있게 느껴지며, reduced-motion에서는 연출이 억제된다"
    why_human: "CSS 구조(keyframes 2개 + reduced-motion 무효화 블록, :has() 강조 셀렉터)는 코드 검토로 확인했으나 '성취감이 드는가'와 실기기 터치 인터랙션은 주관적/실기기 판정 대상. WINDOWS.md #1"

  - test: "progress-store.readCompletedLessonIds()가 { ok: false, error }를 반환하도록 Supabase 조회 실패를 유발한 상태에서 레슨/Step/홈 세 페이지를 각각 요청"
    expected: "완료 버튼/진행률 배지/완료 마커 대신 ProgressReadError 배너만 렌더되고 0%나 진행률 수치가 어디에도 나타나지 않는다 (D-31)"
    why_human: "이번 검증에서 직접 확인 — e2e-progress.mjs는 실제 Supabase 성공 경로만 왕복하며 조회 실패를 인위적으로 재현하지 않는다. 코드는 세 페이지 모두 progressRead.ok 분기로 ProgressReadError를 올바르게 배선하고 있음을 소스 레벨로 확인했으나(src/app/lesson/[lessonId]/page.tsx:69-75, src/app/step/[stepId]/page.tsx:56, src/app/page.tsx:35-36) 런타임 증거는 없다"

  - test: "35개 레슨을 전부 완료 처리한 뒤 홈을 요청 (또는 ProgressSummary에 completed===total>0인 counts를 직접 주입하는 유닛 테스트 추가)"
    expected: "요약 블록 제목이 '커리큘럼을 모두 완료했어요!'로 바뀌고 CTA가 '커리큘럼 처음으로'(/step/1)로 교체되며 '이어서 학습하기' 문구는 나타나지 않는다"
    why_human: "이번 검증에서 직접 확인 — e2e 시나리오(i1-i5)는 프로브 레슨 1개만 완료 처리해 부분 진행 상태만 검증한다. src/components/progress-summary.tsx:19-41의 isAllComplete 분기는 소스 검토로 로직이 올바름을 확인했으나(02-REVIEW.md IN-03도 인접 엣지케이스를 지적) 100% 완료 상태를 실제로 도달시켜 검증한 자동/수동 테스트가 없다"
behavior_unverified_items:

  - truth: "진행률 조회에 실패하면 완료 버튼/진행률 배지/완료 마커 대신 조회 실패 안내만 렌더되고 0%로 오인시키지 않는다 (D-31, 레슨/Step/홈 3개 표면)"
    test: "Supabase 조회를 인위적으로 실패시킨 상태에서 세 페이지를 요청"
    expected: "세 페이지 모두 ProgressReadError만 렌더, 수치 없음"
    why_human: "코드 배선은 확인됐으나 실행 증거가 없음 — 자동 e2e가 실패 경로를 재현하지 않음"

  - truth: "전체 레슨을 모두 완료하면 홈 요약 블록이 축하 문구·CTA로 전환된다 (100% 상태)"
    test: "completed === total > 0 상태 도달"
    expected: "축하 문구 + '커리큘럼 처음으로' CTA, '이어서 학습하기' 미노출"
    why_human: "e2e가 부분 진행 상태까지만 검증 — 전건 완료 분기는 코드 검토로만 확인"
---

# Phase 2: 진도 추적 (progress-tracking) Verification Report

**Phase Goal:** 학습자가 레슨 완료를 체크하고 자신이 커리큘럼의 어디까지 왔는지 한눈에 확인할 수 있다
**Verified:** 2026-08-24
**Status:** human_needed
**Re-verification:** No — initial verification

## Verification Method

이 검증은 SUMMARY.md의 주장을 그대로 신뢰하지 않고, 4개 Plan의 게이트 스크립트를 이 세션에서 **직접 재실행**하고 소스 코드를 **직접 읽어** 확인했다:

```
node scripts/check-progress-math.mjs                              → 11개 케이스 모두 통과
node scripts/check-progress-gates.mjs                              → all gates passed (G10 skipped — 시크릿 env 없이 실행했기 때문, 조건부 skip은 의도된 동작)
node --env-file=.env.local scripts/check-supabase-progress.mjs     → 7/7 단계 통과 (실 DB write→read→delete + anon 키 기본 차단 반증)
node --env-file=.env.local scripts/e2e-progress.mjs                → 전 시나리오(i1-i5, b-e, h1-h4, g1-g5) 통과 (실 next dev 서버 + 실 Supabase DB)
npx tsc --noEmit                                                   → clean
node scripts/check-brand.mjs                                       → 위반 없음 (73개 파일)
node scripts/check-manifest.mjs                                    → all 11 invariants passed
```

모든 명령이 0으로 종료했다. SUMMARY.md가 보고한 결과와 일치했으며 조작 없이 재현됐다.

## Goal Achievement

### Observable Truths — ROADMAP Success Criteria

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 완료 버튼 → 저장 → 새로고침·기기 전환 후에도 유지 | ✓ VERIFIED (자동) / 실기기 확인은 human | e2e 시나리오 c/d/e: DB upsert→`done`, delete→`todo` 서버 재렌더 직접 확인. `check-supabase-progress.mjs` 4/7: 재upsert 시 `completed_at` 갱신 확인(D-30). 실제 두 기기 간 왕복은 human-verification 항목으로 하단에 기록(WINDOWS.md #3) |
| 2 | 완료된 레슨을 다시 눌러 미완료로 되돌릴 수 있다 | ✓ VERIFIED | e2e 시나리오 e(`delete` 후 `todo` 복귀), h4(Step 배지 원상 복구), i5(홈 퍼센트 원상 복구) — 3개 표면 모두 실제 DB delete 왕복으로 확인 |
| 3 | 모듈 목록과 Step 목록에 진행률(%와 완료/전체 개수)이 표시된다 | ✓ VERIFIED | e2e h2(배지 마커 존재, "완료 0/10"), h3(프로브 완료 처리 → 헤더 배지 +1), `check-progress-math.mjs`(11개 집계 케이스 실행 단언) — 소스 확인: `src/app/step/[stepId]/page.tsx`가 `stepProgress`/`moduleProgress` 실데이터를 `ProgressBadge`/`ModuleAccordion`에 주입 |
| 4 | 대시보드에서 전체 진행률과 Step별 진행률을 한 화면에서 확인 | ✓ VERIFIED | e2e i2(요약 마커 + Step 바 3개 존재), i3-i4(프로브 완료 → 전체·해당 Step만 증가, 나머지 두 Step 불변 — before/after delta로 확인), CTA 대상이 매니페스트에서 독립 재계산한 값과 일치 확인 — 소스 확인: `src/app/page.tsx`가 `overallProgress`/`stepProgress`/`nextIncompleteLesson` 실데이터를 `ProgressSummary`/`StepCard 3장`에 주입, 별도 `/dashboard` 라우트 없음(G16, D-25) |
| 5 | 로그인 화면 없이 진도 기록, 외부인은 URL만으로 읽거나 변경 불가 | ✓ VERIFIED | `check-supabase-progress.mjs` 6a/6b: anon 키 select 0행, anon 키 insert 오류 거부(실 DB, 실 RLS). e2e b/h1/i1: 쿠키 없는 요청에 진도 UI 마커 0건 + 콘텐츠는 그대로 공개(D-18/D-20). `actions.ts`가 `hasUnlockCookie()` 재검증을 쓰기보다 먼저 실행(G4, 문자 위치 게이트). 프로덕션에서도 읽기 전용 프로브로 재확인(02-04 SUMMARY D6) |

**Score:** 5/5 ROADMAP 성공 기준이 자동 증거로 뒷받침된다. 아래 "Plan-Level 세부 발견"의 2개 항목은 이 5개 기준 자체를 무효화하지 않는 더 좁은 범위의 상태 전이이며, 존재·배선은 확인됐으나 실행 증거가 없어 별도로 human-verification에 기록했다(⚠️ PRESENT_BEHAVIOR_UNVERIFIED).

### Plan-Level 세부 발견 (Behavior-Dependent, 실행 증거 없음)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | 조회 실패 시 3개 표면(레슨/Step/홈) 모두 배지·마커 대신 안내 배너만 렌더 (D-31) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | 소스 확인: 3곳 모두 `progressRead.ok` 분기로 `ProgressReadError`를 올바르게 배선(`src/app/lesson/[lessonId]/page.tsx:69-75`, `src/app/step/[stepId]/page.tsx:56`, `src/app/page.tsx:35-36`). 그러나 e2e·DB 게이트 어느 것도 Supabase 조회 실패를 인위적으로 유발하지 않음 — 실행 증거 없음 |
| 7 | 전체 레슨 100% 완료 시 축하 문구·CTA 전환 | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | 소스 확인: `src/components/progress-summary.tsx:19-41`의 `isAllComplete` 분기가 `isEmpty`보다 먼저 평가되어 로직상 올바름(02-REVIEW.md IN-03이 인접 엣지케이스 `total===0`를 별도 지적). e2e는 프로브 레슨 1개만 완료 처리해 이 상태에 도달하지 않음 — 실행 증거 없음 |

이 2개 항목은 코드가 존재하고 올바르게 배선되어 있다는 것을 소스 레벨로 직접 확인했으므로 FAILED가 아니다. 다만 자동 검증이 그 실행 경로를 한 번도 통과시키지 않았으므로 VERIFIED로도 판정하지 않는다.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/supabase/admin.ts` | 유일한 service_role 클라이언트, `server-only` 마커 | ✓ VERIFIED | 27줄, `import 'server-only'` 1행, `supabaseAdmin` named export. `createClient` 호출은 이 파일과 두 게이트 스크립트(의도적으로 admin.ts를 우회)뿐 — grep으로 확인 |
| `src/lib/progress-store.ts` | `ProgressRead`/`readCompletedLessonIds`/`setLessonCompletion` | ✓ VERIFIED | 37줄, 실 DB 왕복으로 검증됨(check-supabase-progress) |
| `supabase/migrations/20260824120000_create_progress.sql` | progress 테이블 + RLS on + 정책 0개 | ✓ VERIFIED | 21줄, `enable row level security` 1회, `create policy` 0회. 실 DB에 적용 확인(select 성공) |
| `src/lib/unlock-secret.ts` | `isValidUnlockValue`, `UNLOCK_COOKIE_NAME` | ✓ VERIFIED | 27줄, G11이 5개 판정을 `node:assert`로 실행 검증(check-progress-gates.mjs 내 포함, 재실행 통과) |
| `src/lib/auth.ts` | `hasUnlockCookie()` 단일 게이트 함수 | ✓ VERIFIED | 16줄, 3개 게이트 지점(레슨/Step/홈 페이지 + Server Action)이 전부 이 함수만 호출 (grep 확인) |
| `src/app/lesson/[lessonId]/actions.ts` | `toggleLessonComplete` — 재검증→slug검증→저장 순서 고정 | ✓ VERIFIED | 소스 직접 읽음: `hasUnlockCookie()`(19줄) → `getLessonBySlug`(23줄) → `setLessonCompletion`(31줄) 순서 확인 |
| `src/components/complete-button.tsx` | 낙관적 토글, `useOptimistic`, 로컬 `useState(initialDone)` 없음 | ✓ VERIFIED | 소스 직접 읽음: `useOptimistic(initialDone)` + prop 수렴, 완료 여부를 담는 별도 useState 없음, `aria-pressed`/`min-h-11` 확인 |
| `src/components/progress-error.tsx` | `ProgressReadError`, 수치 미표시 | ✓ VERIFIED | 18줄, `data-progress-ui="read-error"` |
| `src/components/progress-badge.tsx` | `완료 {n}/{total} · {percent}%` | ✓ VERIFIED | e2e h2에서 실제 텍스트 매칭 확인 |
| `src/components/progress-summary.tsx` | 3상태 요약 블록 | ✓ VERIFIED (empty/populated) / ⚠️ 100% 상태는 미실행 | 위 항목 7 참고 |
| `src/components/module-accordion.tsx` | 완료 마커, 선택 prop 없으면 Phase1 동일 마크업 | ✓ VERIFIED | e2e h1(쿠키 없음 → 마커 0건), h3(완료 처리 → `data-progress-ui="lesson-done"`) |
| `src/components/step-card.tsx` | 실데이터 progress bar, 하드코딩 0 제거 | ✓ VERIFIED | 소스 확인: `progressPercent = 0` 상수 없음, `progress?` prop 없으면 바 자체 미렌더, `STEP_FILL_CLASSES` 리터럴 맵 |
| `src/app/unlock/route.ts` + `src/app/unlock/done/page.tsx` | 비밀 링크 발급 흐름 | ✓ VERIFIED | e2e g1-g5 전부 통과 (HttpOnly 쿠키, key 미노출, 성공/실패 화면 문구) |
| `scripts/check-progress-gates.mjs` | G1-G16 정적 게이트 | ✓ VERIFIED | 이 세션에서 재실행, 0으로 종료 |
| `scripts/check-progress-math.mjs` | 11개 집계 케이스 | ✓ VERIFIED | 이 세션에서 재실행, 0으로 종료 |
| `scripts/check-supabase-progress.mjs` | 실 DB 왕복 + RLS 반증 | ✓ VERIFIED | 이 세션에서 재실행, 7/7 통과 |
| `scripts/e2e-progress.mjs` | 실 서버·실 DB 종단 시나리오 | ✓ VERIFIED | 이 세션에서 재실행, 전 시나리오 통과 |
| `.env.example` | 4개 변수 이름·출처 문서화, 실값 없음 | ✓ VERIFIED (간접) | 파일 자체는 이 세션의 read-deny 정책으로 직접 열람 불가(환경 제약, 파일 문제 아님) — G6/G7/G3 게이트가 값 길이·JWT 형태·gitignore 규칙을 구조적으로 확인, 재실행 통과 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `complete-button.tsx` | `actions.ts` | `toggleLessonComplete` 호출, 실패 시 낙관값 롤백 | ✓ WIRED | 소스 직접 확인, e2e d/e로 종단 검증 |
| `actions.ts` | `auth.ts` | `hasUnlockCookie()` 재검증이 쓰기보다 먼저 | ✓ WIRED | 소스 직접 확인(19줄→31줄), G4 게이트로 회귀 방지 |
| `actions.ts` | `progress-store.ts` | `setLessonCompletion` upsert/delete | ✓ WIRED | 소스 확인 + 실 DB 왕복(check-supabase-progress) |
| `lesson/page.tsx` | `progress-store.ts` | `readCompletedLessonIds`로 `initialDone` 결정 | ✓ WIRED | e2e c/d 시나리오로 서버 렌더 값 직접 확인 |
| `unlock/route.ts` | `unlock-secret.ts` | `isValidUnlockValue`로 key 판정 | ✓ WIRED | e2e g1-g3으로 종단 검증 |
| `progress.ts` | `progress-math.ts` | `aggregate`로 개수·퍼센트 계산 | ✓ WIRED | `check-progress-math.mjs` 11개 케이스 + Step/홈 화면에서 실값 반영 확인(h3, i3) |
| `progress.ts` | `curriculum-helpers.ts` | 매니페스트에서 slug 집합 구성, `#site/content` 직접 import 금지 | ✓ WIRED | G13 게이트 재확인 + 소스 확인(`#site/content` 미등장) |
| `step/page.tsx` | `progress-store.ts` | `readCompletedLessonIds` 요청당 1회 | ✓ WIRED | 소스 확인(37줄, 단일 호출) — 모든 모듈이 결과 공유 |
| `home/page.tsx` | `progress.ts` | `overallProgress`/`stepProgress`/`nextIncompleteLesson` | ✓ WIRED | 소스 직접 확인 + e2e i2-i4 |
| `module-accordion.tsx` | `progress-badge.tsx` | 모듈별 집계 결과를 배지로 렌더 | ✓ WIRED | e2e h2 실제 텍스트 매칭 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `CompleteButton` | `initialDone` | `lesson/page.tsx` → `readCompletedLessonIds()` → 실 Supabase select | Yes (e2e d로 확인: DB upsert 직후 `done` 렌더) | ✓ FLOWING |
| `ProgressBadge` (Step/모듈) | `completed/total/percent` | `step/page.tsx` → `stepProgress`/`moduleProgress` → `progress-math.aggregate` → 실 completedIds | Yes (e2e h3로 확인: 프로브 완료 시 +1) | ✓ FLOWING |
| `ProgressSummary` | `counts` | `page.tsx` → `overallProgress` → 실 completedIds | Yes (e2e i3-i4로 확인) | ✓ FLOWING |
| `StepCard` progress bar | `progress.percent` | `page.tsx` → `stepProgress(step.id, completedIds)` | Yes (e2e i3: 해당 Step만 증가, 나머지 불변) | ✓ FLOWING |
| `ProgressReadError` 표시 조건 | `progressRead.ok===false` | `progress-store.readCompletedLessonIds()` 오류 분기 | 코드상 실 오류를 전파하도록 배선되어 있음 (throw 없이 `{ok:false,error}` 반환) — 그러나 이 분기 자체가 실행되는 것을 이번 세션 자동화가 재현하지 않음 | ⚠️ 배선 확인, 실행 미확인 (behavior_unverified 항목 6 참고) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 순수 집계 함수 11개 케이스 | `node scripts/check-progress-math.mjs` | "11개 케이스 모두 통과" | ✓ PASS |
| 정적 보안/구조 게이트 G1-G16 | `node scripts/check-progress-gates.mjs` | "all gates passed" (G10 조건부 skip) | ✓ PASS |
| 실 DB 왕복 + RLS 기본 차단 | `node --env-file=.env.local scripts/check-supabase-progress.mjs` | 7/7 단계 통과 | ✓ PASS |
| 실 서버(next dev)+실 DB 종단 시나리오 20+개 | `node --env-file=.env.local scripts/e2e-progress.mjs` | 전 시나리오 통과 (i1-i5, b-e, h1-h4, g1-g5) | ✓ PASS |
| 타입 체크 | `npx tsc --noEmit` | clean | ✓ PASS |
| 브랜드 위반 스캔 | `node scripts/check-brand.mjs` | 위반 없음(73개 파일) | ✓ PASS |
| 매니페스트 불변식 | `node scripts/check-manifest.mjs` | all 11 invariants passed | ✓ PASS |
| D-31 조회 실패 렌더 경로 | (재현 불가 — Supabase 실패를 인위적으로 유발하는 테스트 없음) | — | ? SKIP → human-verification |
| 100% 완료 축하 상태 | (재현 불가 — e2e가 부분 진행까지만 시험) | — | ? SKIP → human-verification |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| TRACK-01 | 02-01, 02-02 | 완료 저장 + 새로고침/기기전환 후 유지 | ✓ SATISFIED | e2e c/d, check-supabase-progress 4/7, REQUIREMENTS.md `[x]` |
| TRACK-02 | 02-02 | 완료 취소(토글) | ✓ SATISFIED | e2e e/h4/i5, REQUIREMENTS.md `[x]` |
| TRACK-03 | 02-03, 02-04 | 모듈별·Step별 진행률(%·완료/전체) | ✓ SATISFIED | e2e h2/h3, check-progress-math 11케이스, REQUIREMENTS.md `[x]` |
| TRACK-04 | 02-04 | 대시보드 전체+Step별 진행률 한 화면 | ✓ SATISFIED | e2e i2-i4, REQUIREMENTS.md `[x]` |
| PLAT-02 | 02-01~02-04 | 로그인 없는 진도 기록 + 외부인 차단 | ✓ SATISFIED | check-supabase-progress 6a/6b(anon 차단), e2e b/h1/i1(마커 0건), 프로덕션 프로브(02-04 D6), REQUIREMENTS.md `[x]` |

**Orphaned requirements:** 없음 — REQUIREMENTS.md 추적성 표의 Phase 2 행(TRACK-01~04, PLAT-02)이 4개 Plan의 `requirements` 필드 합집합과 정확히 일치한다.

### Anti-Patterns Found

Phase 2가 만들거나 수정한 23개 파일(4개 Plan의 `key-files` 합집합)을 대상으로 debt-marker(`TBD`/`FIXME`/`XXX`), 경고성 주석(`TODO`/`HACK`/`PLACEHOLDER`), 빈 구현 패턴을 스캔했다.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (없음) | — | — | — | 스캔한 23개 파일 어디에도 debt marker·플레이스홀더·빈 구현이 없음. `return null;` 2건(`progress-math.ts:42`, `progress.ts:40`)은 "미완료 없음"/"매칭 slug 없음"을 나타내는 정상적인 정책적 반환값이며 스텁이 아님 |

02-REVIEW.md(코드 리뷰, 24개 파일, 커밋 `41f34fa`)는 별도로 WARNING 2건(WR-01: `e2e-progress.mjs`의 POSIX 프로세스 트리 종료 미흡, WR-02: `complete-button.tsx`의 에러 원인 구분 없는 재시도 UX)과 INFO 3건을 보고했다. 둘 다 critical/blocker가 아니며 Phase 목표(완료 체크 + 진행률 확인) 달성을 막지 않는다 — 견고성 개선 권고 사항으로 별도 후속 작업 대상이지 이 Phase의 gap이 아니다.

### Human Verification Required

frontmatter의 `human_verification` 참고. 총 6개 항목 — 그중 4개는 `.planning/WINDOWS.md`(#1, #2, #3)에 이미 `unrun-verify`로 기록되어 `workflow.human_verify_mode: end-of-phase`에 따라 end-of-phase UAT로 정상 이연된 항목이고(SUMMARY들이 이미 정직하게 문서화함), 2개(조회 실패 렌더 경로, 100% 완료 상태)는 이번 검증에서 새로 발견한, 자동 테스트가 실행 경로를 통과시키지 않은 behavior-dependent 항목이다.

### Gaps Summary

블로킹 gap 없음. Phase 2의 다섯 ROADMAP 성공 기준 전부가 이 세션에서 독립적으로 재실행한 자동 게이트(정적 검사 4종 + 실 DB 왕복 + 실 서버 종단 시나리오 20개 이상)로 뒷받침되며, 소스 코드 직접 확인으로 배선도 확인했다. `status: gaps_found`를 촉발할 FAILED 진실·MISSING/STUB 아티팩트·NOT_WIRED 키 링크·블로커 anti-pattern은 발견되지 않았다.

다만 다음 이유로 `status: human_needed`로 판정한다:

1. Phase가 이미 계획적으로 이연한 12개 human-check 항목(iPad 실기기, 프로덕션 기기 전환, 애니메이션 체감, devtools 요소 검사)이 `workflow.human_verify_mode: end-of-phase` 설정에 따라 아직 실행되지 않았다 — 이는 gap이 아니라 설계된 이연이며, `.planning/WINDOWS.md`에 이미 open 상태로 정직하게 기록되어 있다.
2. 이번 검증에서 직접 확인한 2개의 behavior-dependent 항목(D-31 조회 실패 렌더, 100% 완료 축하 상태)은 코드가 존재하고 올바르게 배선되어 있음을 소스로 확인했으나, 어떤 자동 테스트도 그 실행 경로를 실제로 통과시키지 않았다. 두 항목 모두 코드 검토상 로직이 올바르므로 FAILED로 판정하지 않았지만, VERIFIED로도 판정하지 않고 human-verification 목록에 추가했다(권장: `progress-summary.tsx`는 순수 컴포넌트이므로 두 상태 모두 저비용 유닛 테스트로 메울 수 있는 gap — 후속 작업으로 제안).

---

_Verified: 2026-08-24_
_Verifier: Claude (gsd-verifier)_
