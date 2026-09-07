---
phase: 05-step-2-3
plan: 13
subsystem: infra
tags: [velite, manifest-gate, ci-invariant, vercel-deploy, e2e, docs, ui-spec, making-of]

# Dependency graph
requires:
  - phase: 05-step-2-3
    plan: "01-12"
    provides: "Step 2·3 25편 전체 hasContent:true, 프로젝트 준비 가이드 5종 완성, green 게이트(Wave 1·2), Wave 3의 5개 SUMMARY"
provides:
  - "EXPECTED_HAS_CONTENT_COUNT=35(전체) 실측 확정 — Phase 5 매니페스트 상수 3단계 변화의 마지막 단계"
  - "35편 전체 hasContent:true 프로덕션 배포 및 200+정답보기 확인"
  - "전 레슨 완료 시 전체·Step별·모듈별 진행률 = 100(반올림 결함 없음, D-81 실측)"
  - "정리된 빈 상태 카피(안전망) + UI-SPEC 기록"
  - "UX-03 line-height 근거 정정 및 L7 200자 단락 규칙 기록"
  - "docs/making-of.md Phase 4·5 기록 마감"
affects: [06-design-pass]

# Actuals (#2632)
actuals:
  tokens: 4700
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "게이트 기대 상수는 항상 npm run build 이후 .velite/lessons.json 실측에서만 도출 — 이번에는 실측(35)이 CONTEXT.md D-78 원문 최종값(35)과 정확히 일치, Wave 1·2의 두 차례 불일치(13 vs 14, 23 vs 24)와 대비됨"
    - "rehype-pretty-code/Shiki 출력은 language-* 클래스가 아니라 data-language=\"<lang>\" 속성을 남긴다 (05-07-SUMMARY.md에서 이미 확립, 이 Plan에는 해당 검증 로직이 없어 직접 마주치지 않았지만 그대로 재확인·전파)"
    - "빈 상태 UI 분기는 도달 불가가 되어도 안전망으로 유지하고, 카피만 시간에 견디는 형태(특정 레슨 수/이름 미언급)로 갱신한다"
    - "UI-SPEC 같은 계약 문서는 기존 행을 삭제하지 않고 새 행을 추가하는 방식으로 이력을 보존한다 — git diff가 추가만 보이는지로 검증 가능"

key-files:
  created:
    - .planning/phases/05-step-2-3/deferred-items.md
  modified:
    - scripts/check-manifest.mjs
    - src/app/lesson/[lessonId]/page.tsx
    - .planning/phases/01-deployed-curriculum-skeleton/01-UI-SPEC.md
    - docs/making-of.md
    - .planning/WINDOWS.md

key-decisions:
  - "EXPECTED_HAS_CONTENT_COUNT를 35로 확정 — .velite/lessons.json 실측(npm run build 직후)이 CONTEXT.md D-78 원문 최종값(35)과 정확히 일치. Wave 1(13 vs 14)·Wave 2(23 vs 24) 두 중간 단계의 불일치와 달리, 전 레슨이 채워진 최종 시점에는 손계산과 실측이 맞아떨어졌다"
  - "Invariant 10의 EXPECTED_HAS_CONTENT_SLUGS는 D-78이 허용한 동적 단순화('매니페스트 전체와 동일')를 적용하지 않고 명시 배열 35개를 유지 — 동적 비교는 매니페스트를 자기 자신과 비교하는 형태가 되어 Invariant 10을 무력화할 위험이 있다고 판단"
  - "UI-SPEC UX-03의 line-height 근거를 정정 — 기존 주석이 인용한 '@tailwindcss/typography 기본값(1.5)'는 존재하지 않는 값이었고 실제 기본값은 1.75다. 기존 1.6 오버라이드는 자기 의도(더 넓은 여백)와 반대로 오히려 좁혔던 것. 05-01이 실측·수정한 1.8/2.4em을 UI-SPEC에 반영하고 비율(1.33)까지 기록"
  - "빈 상태 카피를 특정 레슨 수·이름을 언급하지 않는 형태로 재작성 — hasContent 분기는 코드는 유지(안전망), 카피만 시간에 견디게"
  - "npm run lint 실패(theme-toggle.tsx, lesson-nav.tsx)는 Phase 1 commit(76d4824, 8ebc068)까지 거슬러 올라가는 pre-existing 이슈로 판정 — 이 Plan의 files_modified 밖이라 수정하지 않고 deferred-items.md + WINDOWS.md에 기록만"

patterns-established: []

requirements-completed: [CONT-05]

coverage:
  - id: D1
    description: "check-manifest.mjs의 Invariant 10 기대 상수(개수+slug 배열)를 빌드 실측값 35와 정확히 일치시킴, Invariant 10이 여전히 실질 검사임을 red 실증으로 확인"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "npm run build && node scripts/check-manifest.mjs → 13개 불변식 전체 통과"
        status: pass
      - kind: unit
        ref: "레슨 1개의 hasContent를 .velite/lessons.json에서 임시로 false로 바꾸고 재실행 → exit 1, Invariant 10 실패 메시지(개수 34/35 불일치) 확인 후 rebuild로 원복·재검증 exit 0"
        status: pass
      - kind: unit
        ref: "git diff scripts/check-manifest.mjs — EXPECTED_TOTAL_MINUTES/EXPECTED_MINUTES_DISTRIBUTION/EXPECTED_PROJECT_MODULE_COUNT 3개 상수는 diff에 나타나지 않음"
        status: pass
    human_judgment: false
  - id: D2
    description: "빈 상태 카피 갱신(D-79) — hasContent 분기 유지, JSX 구조·className·타이포 불변, 특정 레슨 수 미언급"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "git diff page.tsx — <p> 텍스트만 변경, className/h2 텍스트는 diff에 없음. grep -c hasContent=1, text-[20px]/text-[16px] 존재, 숫자+편/개/시간/분 패턴 0건"
        status: pass
    human_judgment: false
  - id: D3
    description: "01-UI-SPEC.md에 D-79 안전망 기록(도달 불가/안전망 문자열)과 UX-03 line-height 실측 정정이 반영되고 기존 Copywriting Contract 행이 보존됨"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "grep -c 도달 불가/안전망 각 1 이상. Copywriting Contract 섹션 git diff — 기존 Empty state 2행 삭제 없이 새 2행 추가만 확인"
        status: pass
    human_judgment: false
  - id: D4
    description: "docs/making-of.md에 Phase 5 기록 추가(3형식 이유, 파일럿-승인 리듬, Step2-먼저 배포, 게이트 확장), Phase 6 기록 없음, 프론트매터 불변"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "node scripts/check-brand.mjs exit 0. grep 디자인 정리/Phase 6 → 0건. frontmatter 2줄 diff에 없음"
        status: pass
    human_judgment: false
  - id: D5
    description: "전 레슨 완료 시 전체·Step별·모듈별 진행률이 정확히 100 — 반올림 결함 없음(D-81)"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "실제 progress-math.ts의 aggregate()를 .velite/lessons.json 전체 slug에 대해 실행 — overall 35/35=100%, Step1 10/10=100%, Step2 12/12=100%, Step3 13/13=100%, 19개 모듈 전부 100% (99 발생 지점 0건)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Step 3 13편 프로덕션 도달 확인(200+정답 보기+콘텐츠 준비 중 없음), Step 2·3 25편 전체 빈 상태 카피 0건"
    requirement: "CONT-05"
    verification:
      - kind: e2e
        ref: "로컬 next start(포트 3000, 신규 기동) + curl 35편 전수 200/정답 보기/빈 상태 없음 → 35/35 OK. git push 후 프로덕션 Step 3 13편 fetch → 13/13 OK. Step 2·3 25편 전수 → 빈 상태 카피 0건"
        status: pass
    human_judgment: false
  - id: D7
    description: "e2e-progress/e2e-today 통과, e2e 스크립트 자체는 수정하지 않음"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs exit 0 (i1-i5, b-h, g1-g5 전체). scripts/e2e-today.mjs exit 0 (t1-t8, s1-s5 전체, t8 백로그 시나리오 이번에 처음 실행되어 통과 — WINDOWS.md #4 fixed 처리)"
        status: pass
    human_judgment: false
  - id: D8
    description: "프로젝트 준비 가이드 5편의 형식 일관성과 '재현 아님' 경계 — 사람 확인 대체 심사"
    requirement: "CONT-05"
    verification:
      - kind: manual_procedural
        ref: "실행자가 5편 전문을 직접 읽고 형식(6단 헤딩 재해석, ⚠️ 경고 문구 동일, 해보기 3개+정답 보기, 핵심 정리 체크박스+단어표+스스로 점검 2문항) 일관성 확인. §4 코드펜스(python/ts/js/sql/bash) grep 0건, '구현해'/'함수를 작성' grep 0건 — 5편 전체 재현 아님 경계 자동 보강 확인 완료"
        status: pass
    human_judgment: true
    rationale: "내용 경계 판정은 완전 자동화 불가 — 실행자의 전문 읽기가 iPad Safari 사람 확인의 대체 심사 역할을 했으나, 사용자 자신의 최종 확인은 아직 이루어지지 않았다. Backstop 섹션에 남김"
duration: 단일 세션
completed: 2026-08-26
status: complete
---

# Phase 5 Plan 13: Phase 5 마감 — 매니페스트 최종화 + 문서 정리 + Step 3 배포 + 100% 진행률 확인 Summary

**`EXPECTED_HAS_CONTENT_COUNT`를 실측 35로 최종 확정(D-78 원문과 최초로 정확히 일치), Step 3 13편을 프로덕션에 배포해 25편 전체 도달 확인, 빈 상태 카피·UI-SPEC UX-03·Making-of를 마감하고, 전 레슨 완료 시 진행률이 반올림 결함 없이 정확히 100%임을 실측으로 확인 — Phase 5 종료**

## Performance

- **Duration:** 단일 세션
- **Started:** 2026-08-25 (HEAD `cdf662d`, Wave 4 병합 직후)
- **Completed:** 2026-08-26
- **Tasks:** 3/3
- **Files modified:** 6 (`check-manifest.mjs`, `page.tsx`, `01-UI-SPEC.md`, `making-of.md`, `WINDOWS.md`, 신규 `deferred-items.md`)
- **Commits:** 3 (task 1, task 2, task 3 각 1개)

## Accomplishments

- **매니페스트 최종화 (D-78 종결):** `npm run build` 직후 `.velite/lessons.json`을 실측해 `hasContent: true`가 정확히 35개(전체 레슨 수와 일치)임을 확인. `EXPECTED_HAS_CONTENT_COUNT`를 23→35로, `EXPECTED_HAS_CONTENT_SLUGS`에 Step 3 신규 12개를 추가해 35개 명시 배열을 완성. **실측 35가 CONTEXT.md D-78 원문의 최종값(35)과 정확히 일치** — Wave 1(13 vs 14)·Wave 2(23 vs 24) 두 차례의 불일치와 달리 이번에는 산수 재검증 없이 맞아떨어졌다. Invariant 10이 여전히 실질 검사임을 레슨 1개의 `hasContent`를 임시로 끄는 실증으로 확인(exit 1 → 원복 → exit 0).
- **D-78 재량 판단:** 슬러그 배열을 "매니페스트 전체와 동일"로 단순화하지 않고 명시 배열 35개를 유지 — 동적 비교로 바꾸면 Invariant 10이 매니페스트를 자기 자신과 비교하게 되어 아무것도 검사하지 못하게 될 위험이 있다고 판단.
- **빈 상태 카피 정리 (D-79):** `src/app/lesson/[lessonId]/page.tsx`의 `hasContent` 삼항 분기는 코드 그대로 유지(35편 완성으로 도달 불가가 됐지만 향후 레슨 추가를 위한 안전망), 카피만 특정 레슨 수·이름을 언급하지 않는 형태로 교체. JSX 구조·className·타이포(`text-[20px]`/`text-[16px]`) 불변.
- **UI-SPEC 정리:** `01-UI-SPEC.md` §Copywriting Contract에 빈 상태 카피의 "도달 불가·안전망" 기록을 새 행으로 추가(기존 행 보존, git diff가 추가만 보임). UX-03 line-height 항목의 잘못된 근거("기본값 1.5")를 정정 — `@tailwindcss/typography`의 실제 기본값은 1.75이며, 05-01이 이미 실측·수정한 값(1.8 line-height/28.8px 줄 간격, 2.4em/38.4px 문단 여백, 비율 1.33)을 반영. L7 200자 단락 규칙도 콘텐츠 계약의 일부로 명시 기록.
- **Making-of 마감 (D-80):** `docs/making-of.md`에 "5단계 — Step 2·3 레슨 25편 + 프로젝트 준비 가이드 5편" 섹션 신설 — 세 형식(심화·개요·프로젝트 준비 가이드)을 나눈 이유, 파일럿 3편 승인 후 나머지 22편을 늘려 쓴 리듬, Step 2를 먼저 배포한 이유, 구조 게이트를 35편 전체로 확대한 이야기, 가독성 재작업(줄 간격·문단 여백)까지 담았다. Phase 6(디자인 정리) 기록은 쓰지 않음(D-80, 살아있는 문서 규칙). 갱신 줄을 오늘 날짜로 정정.
- **Step 3 배치 배포:** 로컬에서 `npm run build` 후 새 서버(`next start`, 포트 3000 신규 기동 확인 후)로 35편 전체를 curl 전수조사 — 35/35 모두 200 + `정답 보기` 포함 + `콘텐츠 준비 중` 부재를 **본문 내용 기준**으로 확인(상태 코드만으로 판정하지 않음). `git push origin master`로 26개 이상 밀려있던 커밋(Wave 1~4 전체 + 이 Plan의 커밋)을 한 번에 배포. Vercel 배포 완료(GitHub commit status `success`) 후 프로덕션에서 Step 3 13편 전수 재확인, Step 2·3 25편 전체에서 빈 상태 카피 0건 확인.
- **D-81 100% 진행률 실측:** `e2e-progress.mjs`가 단일 프로브 레슨만 검사하는 구조임을 확인(플랜의 flagged_assumption대로) — 별도로 실제 `src/lib/progress-math.ts`의 `aggregate()` 함수(화면이 실제로 쓰는 그 함수, `progress.ts`가 얇게 감싸 재호출)를 `.velite/lessons.json`의 전체 slug에 "전부 완료"로 실행해 전체·Step별(1/2/3)·19개 모듈별 퍼센트를 계산 — **전부 정확히 100, 99가 나온 지점 0건.**
- **e2e 2종 통과:** `e2e-progress.mjs`, `e2e-today.mjs` 모두 exit 0. 특히 `e2e-today.mjs`의 t8(과거 배정 미완료 → behind + 밀린 레슨 목록) 시나리오가 실행일(2026-08-25, 첫날)엔 배정분이 없어 스킵됐었는데, 이번(2026-08-26)에는 백로그가 실제로 쌓여 처음으로 실행·통과 — `WINDOWS.md` #4를 `fixed`로 갱신.
- **프로젝트 준비 가이드 5편 심사(D8, 사람 확인 대체):** 5편(`2-4`, `2-6`, `3-2`, `3-5`, `3-7`) 전문을 직접 읽어 형식 일관성(⚠️ 동일 경고문, 해보기 3개+정답 보기, 핵심 정리 체크박스+단어표+스스로 점검)과 "재현 아님" 경계(§4 실행 코드펜스 0건, "구현해"/"함수를 작성" 0건)를 확인. 5편 모두 통과.

## Task Commits

1. **Task 1: 매니페스트 최종 상수(35) 실측 갱신 + 전체 게이트 green 복귀** - `2d68e81` (fix)
2. **Task 2: "콘텐츠 준비 중" 카피 정리 + UI-SPEC 기록 + Making-of 마감** - `88f3d56` (docs)
3. **Task 3: Step 3 배치 배포 + 전체 진행률 100% e2e 검증 + Phase 5 최종 확인** - `21a29e0` (docs, WINDOWS.md 갱신만 — 코드 변경 없음, `git push origin master`로 배포 수행)

**Plan metadata:** (this document's commit — orchestrator/final metadata commit handles STATE.md/ROADMAP.md/REQUIREMENTS.md)

## Files Created/Modified

- `scripts/check-manifest.mjs` — `EXPECTED_HAS_CONTENT_COUNT` 23→35, `EXPECTED_HAS_CONTENT_SLUGS` +12개(Step 3 신규), 이력 주석 확장. 다른 3개 상수·Invariant 10 이외 로직 불변(diff로 확인).
- `src/app/lesson/[lessonId]/page.tsx` — 빈 상태 `<p>` 문구를 시간에 견디는 형태로 교체. 분기 코드·className·타이포 불변.
- `.planning/phases/01-deployed-curriculum-skeleton/01-UI-SPEC.md` — Typography 표 Body line-height 1.6→1.8 + 근거 정정(UX-03), Copywriting Contract에 D-79 기록 2행 추가(기존 행 보존).
- `docs/making-of.md` — "5단계" 섹션 신설, 갱신 줄 갱신. 프론트매터 불변.
- `.planning/WINDOWS.md` — item 5(lint-warning, 신규) 추가, item 4(unrun-verify, e2e-today t8) `fixed`로 갱신.
- `.planning/phases/05-step-2-3/deferred-items.md` (신규) — pre-existing `npm run lint` 실패 2건(Phase 1 origin, 범위 밖) 기록.

## Decisions Made

- **매니페스트 35 = D-78 원문과 최초 완전 일치** — RESEARCH Open Question 1이 예견한 산수 재검증 패턴이 최종 단계에서는 발생하지 않았음을 명시 기록.
- **Invariant 10 slug 배열은 명시 유지** (D-78 재량으로 단순화 가능했으나 채택하지 않음) — 자기 참조 비교 위험 회피.
- **UX-03 부채 정산** — 기존 UI-SPEC의 "기본값 1.5" 근거가 틀렸음을 확인하고 실측치(1.8/2.4em, 비율 1.33)로 정정. Copywriting Contract는 append-only로 갱신해 결정 이력을 보존.
- **npm run lint pre-existing 실패는 범위 밖으로 판정** — `theme-toggle.tsx`/`lesson-nav.tsx`는 Phase 1 commit(`76d4824`/`8ebc068`)까지 거슬러 올라가는 코드이자 이 Plan의 `files_modified`에 없어 스코프 경계 규칙에 따라 수정하지 않고 `deferred-items.md`+`WINDOWS.md`에 기록만 함. 이 Plan의 배포 게이트(`<deploy_gate>`)에는 `npm run lint`가 포함되지 않아 배포를 막지 않는다.
- **D-81 검증을 실제 progress-math.ts 함수로 직접 실행** — e2e 스크립트나 progress 계산 코드는 손대지 않고, 화면이 실제로 쓰는 순수 함수를 별도 계산으로 재사용해 100% 도달을 실증.

## Deviations from Plan

### Auto-fixed Issues

None — Rule 1/2/3 자동 수정 트리거 없음. 발견된 pre-existing lint 실패는 Rule 적용 대상이 아니라 스코프 경계 규칙에 따라 기록만 하고 넘어감(아래 참고).

### Scope Boundary — pre-existing issue logged, not fixed

**1. `npm run lint` 실패 2건(Phase 1 origin, 이 Plan 범위 밖)**
- **Found during:** Task 2의 필수 verify 체인(`npm run build && ... && npm run lint`).
- **Issue:** `theme-toggle.tsx:15`(`react-hooks/set-state-in-effect`), `lesson-nav.tsx:10`(`no-assign-module-variable`) + 미사용 import 경고 1건.
- **Origin:** 두 파일 모두 Phase 1 commit(`76d4824`, `8ebc068`)에서 마지막으로 수정됨 — Phase 4·5 어느 SUMMARY도 `npm run lint`를 게이트로 실행한 기록이 없음(이 Plan이 처음).
- **판정:** 이 Plan의 `files_modified` 밖 + 이 Plan의 변경으로 발생한 것이 아님 → 스코프 경계 규칙에 따라 수정하지 않음.
- **기록:** `.planning/phases/05-step-2-3/deferred-items.md` + `WINDOWS.md` item 5(lint-warning, open).
- **배포 영향 없음:** 이 Plan의 `<deploy_gate>`(build/check-lesson-structure/check-manifest/check-brand/next-start-curl)에 `npm run lint`가 포함되지 않아 Step 3 배포를 막지 않았다.

---

**Total deviations:** 0 auto-fixed, 1 scope-boundary discovery (logged, not fixed)
**Impact on plan:** 배포·게이트·acceptance criteria 어느 것도 이 발견으로 막히지 않았다. 후속 정리는 백로그(추천: Phase 6 또는 별도 소규모 작업)로 이관.

## Issues Encountered

None beyond the scope-boundary lint discovery above.

## User Setup Required

None — 외부 서비스 설정 불필요. `.env.local`이 이미 존재해 e2e 스크립트가 정상 실행됐다.

## Backstop / 미완료 항목 (Phase 5 종료 시점 기준)

**1. 2-1 모듈 SQL 실제 실행 확인 — 여전히 미확인.**
`2-1-postgres-and-supabase.mdx`, `2-1-ai-data-modeling.mdx`의 연습 SQL(별도 `practice` 스키마, `public`의 진도 데이터와 완전히 분리됨을 코드로 확인)을 실제 Supabase SQL 에디터에서 오류 없이 실행하는 확인은 05-07-SUMMARY.md에서부터 이월된 항목이다. 이 실행자는 psql/pg 클라이언트/Supabase CLI/MCP 도구 중 어느 것도 이 환경에서 사용할 수 없었고(`@supabase/supabase-js`는 임의 DDL을 실행하는 API를 제공하지 않는다), `.env.local`의 자격증명을 직접 읽거나 노출하는 것도 권한상 허용되지 않았다. **아직 확인되지 않았다** — 사용자가 실제 Supabase SQL 에디터에서 두 레슨의 SQL을 순서대로(준비 블록 → insert → 조회 → 정리용 drop) 실행해 확인해야 한다.

**2. 프로젝트 준비 가이드 5편 형식 일관성·"재현 아님" 경계 — 실행자 심사는 완료, 사용자 최종 확인은 미완.**
이 실행자가 5편 전문을 직접 읽고 형식·경계 준수를 확인했다(위 D8 coverage 참고). 그러나 이는 iPad Safari로 사람이 직접 훑어보는 것의 완전한 대체는 아니다 — 시각적 레이아웃·터치 경험은 텍스트 읽기로는 확인할 수 없다.

**3. Making-of 흐름(Phase 1~5 끊김없이 읽히는지, 톤 일치) — 실행자 자체 검토는 완료, 사용자 최종 확인은 미완.**
Phase 4 섹션의 형식·톤을 그대로 따라 Phase 5 섹션을 작성했고, 전체 파일을 다시 읽어 흐름을 확인했다. 아이패드 실기기 확인은 아직 이루어지지 않았다.

**4. 전체 진행률 100% — 계산은 완전 확인, 화면 표시는 실제 완료 상태에서 확인되지 않음.**
D-81의 핵심(반올림 결함 없음)은 실측 계산으로 확정했다(전체/Step/모듈 전부 100, 99 발생 0건). 그러나 "실제로 35편 전부를 완료 처리한 상태의 화면"은 만들지 않았다(현재 실제 DB에 진행 중인 진도가 있어 임의로 전부 완료 처리하면 사용자의 실제 진도 기록에 영향을 준다 — 손대지 않았다). e2e-progress.mjs 실행 결과(overall=3%, steps=0/8/0%)로 현재 실제 진행률 표시 파이프라인 자체는 정상 동작함을 별도로 확인했다.

이 네 항목은 모두 배포나 게이트를 막지 않는 **backstop**이며, `/gsd-verify-work 05`의 end-of-phase UAT나 사용자의 다음 실사용 세션에서 harvest돼야 한다.

## Known Stubs

None — 이 Plan은 레슨 본문을 새로 쓰거나 고치지 않았다(`git diff --name-only`에 `src/content/lessons/` 파일 없음, 계획 prohibition 준수).

## Threat Flags

None — 새 네트워크 엔드포인트·인증 경로·스키마 변경 없음. `check-manifest.mjs`의 상수 변경은 threat_model T-05-32에 이미 등록되어 있고 red 실증으로 완화·검증됐다. `docs/making-of.md`·`page.tsx` 문구는 T-05-01에 등록된 대로 `check-brand.mjs` + grep으로 확인해 0건이다.

## Next Phase Readiness

- **Phase 5 완료.** 35편 전체 `hasContent: true`, 매니페스트 실측=D-78 원문 최종값 일치, Step 3 13편 프로덕션 배포·확인 완료, 전 레슨 완료 시 진행률 100% 실증(반올림 결함 없음), Making-of Phase 4·5 기록 마감.
- **ROADMAP 성공 기준 4 충족:** "전체 커리큘럼 진행률이 100%까지 도달 가능한 상태가 되고, Making-of 페이지가 구현→검증→배포 과정까지 기록을 마친다" — 두 조건 모두 이 Plan에서 실측 확인됨.
- **Phase 6(디자인 정리) 착수 가능** — 35편 레슨 본문이 전부 존재하는 상태에서 시작. 물려받을 것: 위 Backstop 4항목(SQL 실행·가이드 5편/Making-of 흐름 사용자 확인·100% 화면 확인), pre-existing lint 실패 2건(deferred-items.md), UI-SPEC의 line-height/paragraph-gap 최종값(1.8/2.4em).
- 블로커 없음.

---
*Phase: 05-step-2-3*
*Completed: 2026-08-26*

## Self-Check: PASSED

- FOUND: scripts/check-manifest.mjs
- FOUND: src/app/lesson/[lessonId]/page.tsx
- FOUND: .planning/phases/01-deployed-curriculum-skeleton/01-UI-SPEC.md
- FOUND: docs/making-of.md
- FOUND: .planning/WINDOWS.md
- FOUND: .planning/phases/05-step-2-3/deferred-items.md
- FOUND commit: 2d68e81
- FOUND commit: 88f3d56
- FOUND commit: 21a29e0
