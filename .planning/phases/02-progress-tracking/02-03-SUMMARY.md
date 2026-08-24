---
phase: 02-progress-tracking
plan: 03
subsystem: progress-tracking
tags: [pure-functions, aggregation, nextjs-server-components, progress-badge, module-accordion]

requires:
  - phase: 02-progress-tracking (02-01)
    provides: "public.progress 테이블, readCompletedLessonIds/progress-store.ts"
  - phase: 02-progress-tracking (02-02)
    provides: "hasUnlockCookie() 쿠키 게이트, ProgressReadError, force-dynamic + 쿠키 게이트 우선 호출 패턴(레슨 페이지에서 검증됨)"
provides:
  - "src/lib/progress-math.ts — 의존성 0 순수 집계(aggregate/firstIncompleteSlug), 02-04가 그대로 재사용"
  - "src/lib/progress.ts — overallProgress/stepProgress/moduleProgress/nextIncompleteLesson, 02-04가 홈 대시보드에서 그대로 소비"
  - "src/components/progress-badge.tsx — 완료 {n}/{total} · {percent}% 배지, 모듈·Step·02-04 홈 요약 블록 공용"
  - "Step 페이지의 실데이터 진행률 배지 + 완료 마커 + 조회 실패 배너 (TRACK-03)"
affects: [02-04]

actuals:
  tokens: 6549
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "의존성 0 .ts 파일 + node:assert 실행 단언 게이트 — progress-math.ts를 어떤 테스트 러너도 없이 Node가 직접 로드해 11개 케이스를 검증(02-01/02-02가 세운 관례의 세 번째 적용)"
    - "완료 집합 페이지당 1회 읽기 + prop 드릴링 — Step 페이지가 readCompletedLessonIds()를 한 번만 호출하고 stepProgress/moduleProgress 결과를 각 컴포넌트에 내려보냄(T-02-21 DoS 방지)"
    - "React SSR 인접 표현식 사이 <!-- --> 코멘트 마커 — e2e 정규식 매칭 전에 반드시 스트립해야 함(이번 실행 중 실제로 걸린 회귀)"

key-files:
  created:
    - src/lib/progress-math.ts
    - src/lib/progress.ts
    - src/components/progress-badge.tsx
    - scripts/check-progress-math.mjs
  modified:
    - src/components/module-accordion.tsx
    - src/app/step/[stepId]/page.tsx
    - scripts/e2e-progress.mjs
    - scripts/check-progress-gates.mjs

key-decisions:
  - "progress.ts에서 Lesson 타입을 '#site/content'에서 직접 import하지 않고 `NonNullable<ReturnType<typeof getLessonBySlug>>`로 파생 — G13(매니페스트 직접 import 금지)을 코드뿐 아니라 타입 레벨에서도 지키기 위함"
  - "ModuleAccordion의 완료 CTA 문구('다시 보기')는 색을 바꾸지 않고 텍스트만 교체 — 계획 지시(색 교체는 제목에만)를 그대로 따름, CTA 자체는 여전히 accent 링크로 남아 재방문 동선을 유지(D-24)"

patterns-established:
  - "e2e 스크립트가 SSR 출력에서 숫자를 정규식 추출할 때는 React의 <!-- --> 텍스트 노드 구분자를 먼저 제거한다"

requirements-completed: []

coverage:
  - id: D1
    description: "의존성 0 순수 집계 함수(aggregate/firstIncompleteSlug)와 11개 케이스 실행 단언 게이트"
    requirement: "TRACK-03"
    verification:
      - kind: unit
        ref: "node scripts/check-progress-math.mjs (11개 케이스: 빈 입력, 반올림 2종, 전건 완료, 목록 밖 slug, firstIncompleteSlug 4종, 입력 불변성)"
        status: pass
    human_judgment: false
  - id: D2
    description: "progress.ts — 매니페스트 조회와 순수 집계를 조합하는 4개 함수(overallProgress/stepProgress/moduleProgress/nextIncompleteLesson), Velite 매니페스트·Supabase 직접 import 없음"
    requirement: "TRACK-03"
    verification:
      - kind: other
        ref: "node scripts/check-progress-gates.mjs G13 (매니페스트/Supabase import 금지, 주석 제외 스캔)"
        status: pass
      - kind: unit
        ref: "npx tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D3
    description: "ProgressBadge — 완료 {n}/{total} · {percent}% 렌더, whitespace-nowrap, 0%는 neutral·>0%는 accent 퍼센트 색"
    requirement: "TRACK-03"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs 시나리오 h2 (data-progress-ui=\"badge\" 존재, 완료 n/total 형식 실추출)"
        status: pass
    human_judgment: false
  - id: D4
    description: "ModuleAccordion 확장 — completedSlugs/progress 선택 prop, 두 prop 없으면 Phase 1과 완전 동일한 마크업(D-20/D-31 공용 폴백), 완료 행은 CheckCircle2 + neutral 텍스트 + '다시 보기'로 색 교체만 적용(취소선·불투명도 없음), 여전히 링크·44px 히트 영역"
    requirement: "TRACK-03"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs 시나리오 h1 (쿠키 없음 → 마커 0건 + <details 존재), h3 (완료 처리 → data-progress-ui=\"lesson-done\" 마커 존재)"
        status: pass
      - kind: unit
        ref: "npx tsc --noEmit, npx eslint (scoped)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Step 페이지 — force-dynamic, hasUnlockCookie()를 notFound()보다 먼저 무조건 호출, 완료 집합을 요청당 1회만 읽어 모든 모듈이 공유, 조회 실패 시 배지·마커 없이 ProgressReadError만 렌더, 쿠키 없으면 조회 자체를 시도하지 않고 Phase 1과 동일하게 렌더"
    requirement: "TRACK-03"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs 시나리오 h1/h2 (쿠키 유무에 따른 렌더 분기)"
        status: pass
      - kind: other
        ref: "node scripts/check-progress-gates.mjs G9(force-dynamic 확장)·G14(쿠키 게이트가 조회보다 앞섬)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Step 헤더 배지가 실제 완료 데이터에 반응 — 프로브 레슨 완료 처리 시 완료 개수 +1, 삭제 시 원상 복구"
    requirement: "TRACK-03"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs 시나리오 h3/h4 (실제 Supabase upsert/delete 왕복 + 헤더 배지 완료 개수 비교)"
        status: pass
    human_judgment: false
  - id: D7
    description: "잠금을 푼 iPad 브라우저에서 Step/모듈 배지 숫자가 실제 완료 상황과 맞고, 44px 히트 영역과 세로/가로 모드 배지 줄바꿈 없음을 육안 확인"
    requirement: "TRACK-03"
    verification: []
    human_judgment: true
    rationale: "workflow.human_verify_mode=end-of-phase(기본값) — Task 3의 <verify><human-check> 5개 항목은 지금 실행되지 않고 /gsd-verify-work의 end-of-phase UAT 흐름에서 harvest된다. 자동화된 e2e 시나리오(h1-h4)가 배지 값의 정확성·마커 존재는 이미 기계적으로 증명했으므로 이 항목은 시각적 육안 재확인 성격이다. .planning/WINDOWS.md에 unrun-verify로 기록함."

duration: "약 15분"
completed: 2026-08-24
status: complete
---

# Phase 2 Plan 3: 모듈·Step 진행률 표시 Summary

**의존성 0 순수 집계 함수(11개 실행 단언) 위에 progress.ts 얇은 조합 층과 ProgressBadge를 얹고, Step 페이지·모듈 아코디언에 실데이터 진행률과 완료 마커를 주입 — 실제 Supabase 왕복으로 배지 숫자가 완료 처리마다 오르내림을 증명**

## Performance

- **Duration:** 약 15분 (체크포인트 없음, 완전 자율 실행)
- **Started:** 2026-08-24T08:27:47Z
- **Completed:** 2026-08-24T08:42:22Z
- **Tasks:** 3 (전부 auto)
- **Files modified:** 8 (created 4, modified 4)

## Accomplishments

- `src/lib/progress-math.ts`: import 0개 순수 모듈 — `aggregate`(목록 순회 기반 완료 카운트, 반올림 퍼센트, 0으로 나누지 않음)와 `firstIncompleteSlug`(전역 순서상 첫 미완료), 입력 Set·배열 무변형
- `scripts/check-progress-math.mjs`: 11개 케이스 + 입력 불변성을 `node:assert`로 실행 검증하는 새 게이트, 새 devDependency 없음. 반올림→버림 변이 시 실제로 실패함을 수동 확인
- `src/lib/progress.ts`: `overallProgress`/`stepProgress`/`moduleProgress`/`nextIncompleteLesson` — curriculum-helpers.ts와 progress-math.ts만 조합, Velite 매니페스트·Supabase 어느 쪽도 직접 import하지 않음(G13이 상시 검증)
- `src/components/progress-badge.tsx`: `완료 {n}/{total} · {percent}%` 배지, `whitespace-nowrap`, 0%는 neutral·>0%는 accent 퍼센트 색, `data-progress-ui="badge"` 마커
- `src/components/module-accordion.tsx`: `completedSlugs`·`progress` 선택 prop 추가 — 둘 다 없으면 Phase 1과 완전히 동일한 마크업(잠금 없는 방문자·조회 실패가 공유하는 경로). 완료 레슨 행은 `CheckCircle2` 아이콘 + neutral 텍스트 + "다시 보기" CTA, 취소선·불투명도 없이 색 교체만, 여전히 `/lesson/{slug}` 링크
- `src/app/step/[stepId]/page.tsx`: `force-dynamic` 선언, `hasUnlockCookie()`를 `notFound()`보다 먼저 무조건 호출, 완료 집합을 요청당 1회만 읽어 헤더 배지·모든 모듈이 공유, 조회 실패 시 `ProgressReadError`만 렌더(배지·마커 없음), 쿠키 없으면 조회를 아예 시도하지 않음
- `scripts/e2e-progress.mjs`: Step 페이지 시나리오 h1-h4 추가(쿠키 없음 → 마커 0건+아코디언 존재, 쿠키 있음 → 배지 존재, 프로브 완료 처리 → 헤더 배지 +1, 삭제 → 원상 복구) — 실제 `next dev` + 실제 Supabase로 검증
- `scripts/check-progress-gates.mjs`: G9를 Step 페이지로 확장, G13(progress.ts 순수성) 신설, G14(Step 페이지에서 쿠키 게이트가 조회보다 먼저 등장) 신설

## Task Commits

Each task was committed atomically:

1. **Task 1: 의존성 0 순수 집계 모듈과 그 실행 단위 검증 게이트** - `73de571` (feat)
2. **Task 2: 진행률 배지와 완료 표식이 들어간 모듈 아코디언** - `7e2b999` (feat)
3. **Task 3: Step 페이지에 진도 주입 · 조회 실패 안내 · 게이트 확장** - `9faa89c` (feat)

**Plan metadata:** (다음 커밋에서 기록)

## Files Created/Modified

- `src/lib/progress-math.ts` - 의존성 0 순수 집계 함수
- `scripts/check-progress-math.mjs` - 11개 케이스 실행 단언 게이트
- `src/lib/progress.ts` - 매니페스트 조회 + 순수 집계 조합 층
- `src/components/progress-badge.tsx` - 진행률 배지 컴포넌트
- `src/components/module-accordion.tsx` - 완료 마커/배지가 들어간 모듈 아코디언
- `src/app/step/[stepId]/page.tsx` - 진도 주입 + 쿠키 게이트 + 조회 실패 분기
- `scripts/e2e-progress.mjs` - Step 페이지 종단 시나리오(h1-h4) 추가
- `scripts/check-progress-gates.mjs` - G9 확장·G13·G14 신설

## Decisions Made

- `progress.ts`의 `Lesson` 타입을 `'#site/content'`에서 직접 import하지 않고 `NonNullable<ReturnType<typeof getLessonBySlug>>`로 파생 — G13(매니페스트 직접 import 금지)의 정신을 코드뿐 아니라 타입 레벨에서도 지키기 위함(구현 중 실제로 G13이 자기 검사에 걸려 발견·수정, 아래 Deviations 참고)
- `ModuleAccordion`의 완료 CTA 문구("다시 보기")는 색을 바꾸지 않고 텍스트만 교체 — plan 지시("톤 다운은 색 교체만"이 제목에 한정)를 그대로 따름, CTA 자체는 여전히 accent 링크로 남아 재방문 동선을 유지(D-24)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] progress.ts가 자기 자신의 주석에 금지 문자열을 남겨 G13이 오탐**
- **Found during:** Task 2 검증 (첫 `node scripts/check-progress-gates.mjs` 실행)
- **Issue:** `progress.ts` 최초 구현에서 "`#site/content`를 직접 import하지 않는다"는 설명 주석이 그 금지 문자열 리터럴을 그대로 담고 있어, G13의 raw-string 검사(`s.includes('#site/content')`)가 주석까지 스캔해 실제로는 위반이 없는데도 실패로 판정
- **Fix:** 주석 문구를 "Velite 콘텐츠 매니페스트 모듈"로 바꿔 금지 문자열 리터럴을 코드베이스 어디에도 남기지 않음(타입도 `#site/content` import 자체를 제거하고 `ReturnType` 파생으로 전환해 동시에 해결)
- **Files modified:** src/lib/progress.ts
- **Verification:** 수정 후 `node scripts/check-progress-gates.mjs` G13 통과 확인
- **Committed in:** `7e2b999` (Task 2 commit — 발견과 수정이 같은 태스크 내에서 이루어져 별도 커밋 없음)

**2. [Rule 1 - Bug] e2e-progress.mjs의 배지 숫자 정규식이 React SSR 코멘트 마커에 막힘**
- **Found during:** Task 3 (`node --env-file=.env.local scripts/e2e-progress.mjs` 최초 실행, 시나리오 h2)
- **Issue:** React SSR이 인접한 JSX 표현식 사이에 `<!-- -->` 코멘트를 삽입해 실제 응답 본문이 `완료 <!-- -->0<!-- -->/<!-- -->10`처럼 나오는데, `extractHeaderBadgeCount`의 정규식(`/완료\s*(\d+)\/(\d+)/`)이 코멘트를 예상하지 못해 매칭 실패
- **Fix:** 정규식 매칭 전에 `body.replace(/<!--\s*-->/g, '')`로 코멘트 마커를 제거하는 전처리 단계 추가
- **Files modified:** scripts/e2e-progress.mjs
- **Verification:** 수정 후 실제 dev 서버 + 실제 Supabase로 전체 e2e 재실행, h1-h4 모두 통과(완료 0/10 → +1 → 원상 복구 확인)
- **Committed in:** `9faa89c` (Task 3 commit — 발견과 수정이 같은 태스크 내에서 이루어져 별도 커밋 없음)

---

**Total deviations:** 2 auto-fixed (2 bugs, 게이트/e2e 스크립트 자신의 정확성 문제이며 애플리케이션 코드 로직에는 영향 없음). **Impact:** 둘 다 검증 도구가 실제로 의도대로 동작하게 만드는 수정이며 범위 확장은 없음.

## Issues Encountered

- `npm run lint`가 이 Plan이 만들지 않은 Phase 1 파일 2곳(`src/components/lesson-nav.tsx`, `src/components/theme-toggle.tsx`)에서 사전 존재하는 오류를 계속 보고함(02-01/02-02에서 이미 확인·기록된 것과 동일, `.planning/phases/02-progress-tracking/deferred-items.md` 참고). 이 Plan이 만든/수정한 파일만 골라 `npx eslint`로 실행하면 0건 통과. 범위 밖이므로 수정하지 않음.
- Task 3의 `<verify><human-check>` 5개 항목(Step/모듈 배지 육안 확인, 완료 재방문·재토글, iPad 세로/가로 배지 줄바꿈, 44px 히트 영역, 시크릿 창 마커 0건)은 `workflow.human_verify_mode=end-of-phase`(기본값)에 따라 지금 실행되지 않음 — `/gsd-verify-work`의 end-of-phase UAT 흐름에서 harvest됨. `.planning/WINDOWS.md`에 `unrun-verify`로 기록(02-02가 남긴 항목에 이어 두 번째 항목).
- 로컬 개발 중 이전 세션이 남긴 좀비 `next dev` 프로세스(포트 3299)가 e2e 스크립트의 새 서버 기동을 한 차례 막음 — `taskkill`로 종료 후 재실행하여 해결, 애플리케이션 코드와 무관한 로컬 환경 문제였음.

## User Setup Required

None - 이 Plan 자체는 추가 외부 서비스 설정이 필요 없음(02-01의 Vercel 환경 변수 등록이 여전히 남아 있으나 이 Plan의 검증은 `.env.local` 기준으로 전부 완료됨).

## Next Phase Readiness

- `progress-math.ts`/`progress.ts`/`progress-badge.tsx`의 확정된 인터페이스가 02-04(홈 대시보드, 이어서 학습하기)가 탐색 없이 바로 소비 가능한 상태로 준비됨 — 특히 `overallProgress`·`nextIncompleteLesson`은 02-04 전용
- TRACK-03(이 Plan과 02-04 공동 소유)·PLAT-02(02-01/02-02/02-03/02-04 4개 Plan 공동 소유)는 `requirements.ready-ids` 확인 결과 0/2 ready — 02-04의 SUMMARY가 아직 없어 계속 대기 상태(의도된 shared-ID gate 동작). 02-04가 끝나면 자동으로 완료 표시됨
- iPad에서의 실제 수동 검증(Step/모듈 배지 육안 확인, 히트 영역, 세로/가로 배지 줄바꿈)이 아직 수행되지 않음 — end-of-phase UAT에서 다뤄질 예정
- 블로커 없음

## Self-Check: PASSED

- All 4 created files verified present on disk (`test -f` for each) and all 4 modified files contain the expected new symbols
- All 3 task commits (`73de571`, `7e2b999`, `9faa89c`) verified present in `git log --oneline --all`
- Re-ran plan-level `<verification>`: `npx tsc --noEmit && node scripts/check-progress-gates.mjs && node scripts/check-progress-math.mjs && node scripts/check-brand.mjs && node scripts/check-manifest.mjs && node --env-file=.env.local scripts/e2e-progress.mjs` — all exit 0
- `npx eslint` scoped to this Plan's files (all tasks) — 0 issues; full `npm run lint` still reports the same 2 pre-existing Phase 1 issues (out of scope, unrelated files, unchanged count from 02-01/02-02)
- `requirements.ready-ids` for TRACK-03/PLAT-02 — 0/2 ready (correctly deferred to shared-ID gate, no premature mark-complete)

---
*Phase: 02-progress-tracking*
*Completed: 2026-08-24*

## Self-Check: PASSED (re-verified post-write)

- 4 created files confirmed present on disk via `[ -f ]`
- 3 task commits (`73de571`, `7e2b999`, `9faa89c`) confirmed present via `git log --oneline --all`
- Re-ran static verification bundle (`tsc --noEmit && check-progress-gates && check-progress-math && check-brand && check-manifest`) — all exit 0
