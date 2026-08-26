---
phase: 08-performance-and-mobile
plan: 01
subsystem: testing
tags: [nextjs, playwright, woff2, brotli, prerender-manifest, performance-gate]

# Dependency graph
requires: []
provides:
  - "라우트 렌더 모드 계약 정적 게이트 (scripts/check-route-rendering.mjs) — 목표 상태를 코드로 고정, 현재는 의도적으로 빨간불"
  - "프로덕션 빌드 기반 성능 회귀 게이트 (scripts/e2e-perf-budget.mjs) — TTFB/전송바이트/스크롤 프레임 예산"
  - "서브셋 폰트 글리프 커버리지 상시 게이트 (scripts/check-font-glyph-coverage.mjs) — 의존성 0 WOFF2 파서"
  - "이 페이즈의 성능 기준선 숫자(TTFB 6종·전송바이트·프레임 예산) — 08-08 전후 비교 근거"
affects: [08-02, 08-03, 08-04, 08-05, 08-06, 08-07, 08-08]

# Actuals (#2632)
actuals:
  tokens: 8165
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "check-*.mjs 정적 게이트: 독립 재계산 + fail() 배열 누적 + 산출물 부재 시 skip(exit 0) — check-manifest.mjs/check-progress-gates.mjs 관례 재사용"
    - "e2e-*.mjs 런타임 게이트: FatalError + fetchWithTimeout + waitForServerReady + killServerTree(Windows taskkill /T /F) 부트스트랩 — e2e-mobile-overflow.mjs 복제, 서버 기동만 next build && next start로 교체"
    - "WOFF2 직접 파싱: zlib.brotliDecompressSync + sfnt 테이블 디렉터리(UIntBase128 가변길이 인코딩) + cmap format 4/12만 읽기 — 새 폰트 파서 패키지 없이 의존성 0 유지"

key-files:
  created:
    - scripts/check-route-rendering.mjs
    - scripts/e2e-perf-budget.mjs
    - scripts/check-font-glyph-coverage.mjs
  modified: []

key-decisions:
  - "라우트 렌더 모드 계약은 목표 상태를 적는다 — 이 플랜 직후 빨간불(전부 동적)인 것이 의도된 결과이며 결함이 아니다. 08-02~08-06 전환 플랜이 초록불로 만든다."
  - "성능 게이트는 next dev가 아니라 next build && next start를 부트스트랩한다 — 온디맨드 컴파일 타이밍이 TTFB 숫자에 섞이지 않게 하기 위함. 빌드 실패는 별도 600초 타임아웃으로 구분해 실패 원인을 서버 기동 실패와 혼동하지 않게 했다."
  - "TTFB 판정은 절대 임계값이 아니라 /about(정적 대조군) 중앙값 대비 상대 비교(2배+15ms)로 둔다 — 로컬 머신 성능 편차를 흡수한다."
  - "폰트 글리프 제외 규칙에 이모지·결합 기호 구간(U+20D0–20FF, U+2300–23FF, U+2600–27BF, U+1F000–1FFFF)과 사설 영역(BMP+보조평면)을 명시적으로 포함했다 — 레슨 콘텐츠에 실제로 등장하는 ⏰⏱⏪ 및 키캡 결합 기호(U+20E3)가 시스템 폴백이 그리는 장식용 문자이지 Pretendard 서브셋이 책임질 대상이 아니기 때문. 실측(전체 폰트를 임시 서브셋으로 사용한 테스트)으로 이 경계가 정확함을 확인했다."
  - "G9 갱신(08-VALIDATION.md Wave 0 항목 중 하나)은 이 플랜의 범위가 아니다 — 08-RESEARCH.md Pitfall 1과 이 페이즈의 결정에 따라 트레이서 플랜(08-02)이 정적 전환과 같은 커밋에서 처리한다."

patterns-established:
  - "정적 게이트 3단계: (1) 산출물 부재 시 즉시 skip+exit 0, (2) 독립 재계산, (3) fail() 배열에 누적 후 한꺼번에 보고 — 다음 페이즈의 신규 정적 게이트도 이 형태를 따를 것"
  - "런타임 성능 게이트 전용 포트 할당 관례 확장: 3212(typography)·3213(mobile-overflow)에 이어 3214(perf-budget) — 다음 신규 e2e 게이트는 3215부터 쓸 것"

requirements-completed: [SC1, SC2, SC4, SC5]

coverage:
  - id: D1
    description: "라우트 렌더 모드 계약 게이트가 .next/prerender-manifest.json 기반으로 목표 상태(완전 정적 vs 동적 유지)를 검사하고, 현재(전부 동적) 상태에 대해 정확히 위반을 보고한다"
    requirement: "SC4"
    verification:
      - kind: other
        ref: "node scripts/check-route-rendering.mjs (실제 빌드 산출물 대상 실행, 39건 위반 보고 확인)"
        status: pass
      - kind: other
        ref: "node scripts/check-route-rendering.mjs (.next/prerender-manifest.json 임시 은닉 후 실행, skip+exit 0 확인)"
        status: pass
    human_judgment: false
  - id: D2
    description: "프로덕션 빌드(next build && next start) 기반 성능 게이트가 TTFB(6종 라우트 중앙값)·첫 방문 전송 바이트(총량/폰트/비중)·스크롤 프레임 예산(총 프레임/25ms 초과/비율)을 재현 가능하게 출력하고, 3개 판정(Step 1·커리큘럼·레슨 TTFB + 프레임 예산)을 통과한다"
    requirement: "SC1"
    verification:
      - kind: e2e
        ref: "node scripts/e2e-perf-budget.mjs (더미 Supabase/UNLOCK 환경변수로 실제 next build && next start 부트스트랩, 판정 대상 4건 전부 통과 확인 — 실제 프로덕션 자격 증명은 이 워크트리에서 접근 불가하여 .env.local 대신 인라인 더미 값 사용, 상세는 Deviations 참고)"
        status: pass
    human_judgment: true
    rationale: "실제 Supabase 자격 증명이 있는 .env.local로 재실행해 진짜 프로덕션 환경 TTFB/전송량 숫자를 재확인할 필요가 있다 — 이 실행은 더미 자격 증명(hasUnlockCookie()가 false를 반환해 Supabase 쿼리 자체가 실행되지 않는 경로)으로 스크립트의 정확성만 검증했다."
  - id: D3
    description: "폰트 글리프 커버리지 게이트가 서브셋 파일 부재 시 skip하고, 실제 프로덕션 WOFF2 파일을 대상으로 Brotli 압축 해제 + cmap format 4/12 파싱에 성공한다"
    requirement: "SC2"
    verification:
      - kind: other
        ref: "node scripts/check-font-glyph-coverage.mjs (서브셋 파일 없음, skip+exit 0 확인)"
        status: pass
      - kind: other
        ref: "PretendardVariable.woff2를 PretendardVariable.subset.woff2로 임시 복사 후 node scripts/check-font-glyph-coverage.mjs 실행 — 961개 유니크 문자 전부 커버 확인, 검사 후 임시 파일 삭제"
        status: pass
    human_judgment: false
  - id: D4
    description: "신규 게이트 3종이 기존 게이트(check-manifest.mjs, check-progress-gates.mjs 16종)에 회귀를 일으키지 않는다"
    requirement: "SC4"
    verification:
      - kind: other
        ref: "node scripts/check-manifest.mjs (all 13 invariants passed), node scripts/check-progress-gates.mjs (all gates passed)"
        status: pass
    human_judgment: false

duration: 약 40분
completed: 2026-08-26
status: complete
---

# Phase 8 Plan 1: Wave 0 검증 하네스 Summary

**정적 전환 전에 목표 상태·성능 기준선·폰트 커버리지를 코드로 고정하는 신규 게이트 3종(check-route-rendering.mjs, e2e-perf-budget.mjs, check-font-glyph-coverage.mjs) — 기존 소스 코드는 한 줄도 건드리지 않음**

## Performance

- **Duration:** 약 40분
- **Completed:** 2026-08-26 (UTC)
- **Tasks:** 3/3
- **Files modified:** 3 (전부 신규 생성, 기존 파일 수정 없음)

## Accomplishments

- **라우트 렌더 모드 계약 게이트** — `.next/prerender-manifest.json`을 읽어 `/about`·`/step/1~3`·`/curriculum`·전체 레슨 라우트가 완전 정적이어야 하고 `/`·`/schedule`은 동적으로 남아야 한다는 목표 상태를 코드로 고정했다. 현재(전부 동적) 상태에 대해 실행하면 39건 위반을 정확히 보고한다 — 이 빨간불은 08-02~08-06 전환 플랜이 초록불로 만들 것이다.
- **프로덕션 빌드 기반 성능 회귀 게이트** — `next dev`가 아니라 `next build && next start`를 부트스트랩해 TTFB(6종 라우트, 5회 방문 중앙값), 첫 방문 전송 바이트(총량/폰트 비중), 스크롤 프레임 예산(768×1024, 2000px 스무스 스크롤, 25ms 초과 프레임 비율)을 측정한다. 전용 포트 3214로 기존 6개 e2e 게이트(3212·3213 등)와 충돌하지 않는다.
- **서브셋 폰트 글리프 커버리지 상시 게이트** — 외부 폰트 파서 패키지 없이 Node 내장 `zlib.brotliDecompressSync`만으로 WOFF2 컨테이너를 직접 파싱(sfnt 테이블 디렉터리 + cmap format 4/12)한다. 서브셋 파일이 아직 없는 현재 상태에서는 skip한다.
- **이 페이즈의 성능 기준선을 확보했다**(아래 "기준선 숫자" 참고) — 08-08의 전후 비교 근거.

## Task Commits

Each task was committed atomically:

1. **Task 1: 라우트 렌더 모드 계약 게이트 신설** - `8110fb9` (feat)
2. **Task 2: 성능 회귀 게이트 신설 — 프로덕션 빌드 부트스트랩** - `915be72` (feat)
3. **Task 3: 서브셋 폰트 글리프 커버리지 게이트 신설** - `fba40e7` (feat)

## Files Created/Modified

- `scripts/check-route-rendering.mjs` - `.next/prerender-manifest.json` 기반 라우트 렌더 모드 계약 정적 게이트
- `scripts/e2e-perf-budget.mjs` - 프로덕션 빌드(next build && next start) 기반 TTFB·전송 바이트·프레임 예산 게이트
- `scripts/check-font-glyph-coverage.mjs` - WOFF2 직접 파싱 기반 서브셋 폰트 글리프 커버리지 게이트

## 이 페이즈의 성능 기준선 (08-08 전후 비교 근거)

아래 숫자는 이 워크트리에서 더미 Supabase/UNLOCK 자격 증명으로 `next build && next start`를 부트스트랩해 측정한 값이다(실제 Supabase 자격 증명은 이 실행 환경에서 접근 불가 — Deviations 참고). `hasUnlockCookie()`가 쿠키 없이는 `false`를 반환해 Supabase 쿼리 자체가 호출되지 않으므로, TTFB·전송량·프레임 측정치 자체는 자격 증명의 진위와 무관하게 유효하다. 다만 실제 배포 환경(.env.local의 진짜 자격 증명)으로 재확인하는 것을 권장한다.

### TTFB 중앙값(ms, 5회 방문)

| 라우트 | 설명 | 중앙값(ms) | 판정 |
|---|---|---|---|
| `/about` | 정적 대조군 | 3.00 | 기준값(판정 제외) |
| `/` | 홈(동적 유지 결정) | 6.30 | 관측만 |
| `/curriculum` | 커리큘럼 | 5.40 | 판정 대상 — 통과 (기준 21.00ms 이하) |
| `/schedule` | 일정표(동적 유지 결정) | 6.90 | 관측만 |
| `/step/1` | Step 1 | 6.00 | 판정 대상 — 통과 |
| `/lesson/1-1-course-orientation` | 콘텐츠 레슨 | 6.50 | 판정 대상 — 통과 |

판정 기준 = `/about` 중앙값 × 2 + 15ms = 21.00ms.

### 첫 방문 전송 바이트 (`/lesson/1-1-course-orientation`, 캐시 없음)

- 총 전송 바이트: 2,697,213 bytes
- `.woff2` 폰트 합계: 2,057,688 bytes
- 폰트 비중: **76.29%** — D8-B 임계값(30% 이상 또는 폰트 단독 500KB 이상)을 크게 초과 → 08-04 서브셋 진행 근거로 확정

### 스크롤 프레임 예산 (`/lesson/1-1-course-orientation`, 768×1024, 2000px 스무스 스크롤)

- 총 프레임: 72
- 25ms 초과 프레임: 2
- 초과 비율: **2.78%** (허용치 10% 이하 — 현재 통과. 08-RESEARCH.md Pitfall 3이 지적한 Section Tape 스로틀 부재가 로컬 환경에서는 아직 이 게이트를 실패시키지 않았다 — 실기기에서는 다를 수 있으므로 08-07의 실기기 확인이 여전히 필요하다.)

## Decisions Made

- **라우트 계약은 목표 상태를 코드로 고정한다** — 이 플랜 직후 빨간불(39건 위반)이 정상이다. 08-VALIDATION.md와 08-01-PLAN.md의 objective가 명시적으로 요구한 설계다.
- **성능 게이트는 next build && next start만 사용, next dev는 절대 쓰지 않는다** — 빌드 실패와 서버 기동 실패를 구분하기 위해 빌드 타임아웃(600초)을 서버 기동 타임아웃(180초)과 별도로 뒀다.
- **TTFB 판정은 상대 비교(/about 대비 2배+15ms)** — 절대 임계값 대신 정적 대조군 대비 배율로 둬 로컬 머신 성능 편차를 흡수한다.
- **폰트 글리프 제외 구간에 이모지 인접 구간(Miscellaneous Technical U+2300–23FF, Combining Diacritical Marks for Symbols U+20D0–20FF)을 추가했다** — 최초 구현 시 전체 폰트를 임시 서브셋으로 써서 실측했더니 레슨 본문의 ⏰⏱⏪ 및 숫자 키캡 이모지(U+20E3 결합 문자)가 계획에 명시된 기본 이모지 구간(U+1F000–1FFFF, U+2600–27BF)만으로는 걸러지지 않아 오탐(false positive)이 났다 — 실제 소스를 대상으로 실행해 경계를 넓혀 바로잡았다.
- **G9 갱신은 이 플랜의 범위가 아니다** — 08-RESEARCH.md Pitfall 1과 이 페이즈의 D8-C 결정에 따라 트레이서 플랜(08-02)이 정적 전환과 같은 커밋 단위에서 처리한다.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] WOFF2 헤더 필드 오프셋 오류 (numTables/totalCompressedSize)**
- **Found during:** Task 3 (실제 프로덕션 `PretendardVariable.woff2`를 임시 서브셋으로 복사해 실행하는 acceptance 검증 중 — "Decompression failed" 에러)
- **Issue:** WOFF2 고정 헤더에서 `length`(UInt32) 필드를 건너뛰지 않고 `numTables`를 offset 8에서 읽고(실제로는 offset 12), `totalCompressedSize`를 offset 16에서 읽었다(실제로는 offset 20) — 잘못된 오프셋으로 Brotli 압축 해제 대상 바이트 범위가 어긋나 압축 해제가 실패했다.
- **Fix:** W3C WOFF2 스펙의 48바이트 고정 헤더 레이아웃을 주석으로 명시하고 올바른 오프셋(`numTables`=12, `totalCompressedSize`=20)으로 수정.
- **Files modified:** `scripts/check-font-glyph-coverage.mjs`
- **Verification:** 실제 `PretendardVariable.woff2`(2,057,688 bytes, glyf/loca transform이 실제로 적용된 진짜 프로덕션 폰트)를 임시 서브셋으로 복사해 실행 — 압축 해제 성공, cmap format 4/12 파싱 성공.
- **Committed in:** `fba40e7` (Task 3 커밋에 포함 — 커밋 전에 발견·수정해 최종본만 커밋됨)

**2. [Rule 1 - Bug] 첫 방문 전송 바이트 측정이 Content-Length 헤더 부재 응답을 0바이트로 오인**
- **Found during:** Task 2 (실제 실행 결과 검증 중 — 폰트 비중이 100%로 나와 다른 정적 자산이 전혀 집계되지 않고 있음을 발견)
- **Issue:** `page.on('response', ...)` 콜백이 `Content-Length` 헤더가 없는 응답(chunked transfer-encoding 등)을 무조건 0바이트로 처리해, HTML/CSS/JS 대부분이 집계에서 빠지고 폰트 파일만 잡혔다.
- **Fix:** Content-Length 부재 시 `response.body()`로 실제 바디 길이를 재는 폴백을 추가하고, 비동기 콜백이 `networkidle` 완료 전에 다 끝나도록 Promise 배열로 모아 `Promise.all`로 대기.
- **Files modified:** `scripts/e2e-perf-budget.mjs`
- **Verification:** 재실행 후 폰트 비중이 100% → 76.29%로 정정되고, 총 전송 바이트(2,697,213)가 폰트(2,057,688)보다 크게 나와 다른 자산도 집계됨을 확인.
- **Committed in:** `915be72` (Task 2 커밋에 포함 — 커밋 전에 발견·수정해 최종본만 커밋됨)

---

**Total deviations:** 2 auto-fixed (둘 다 Rule 1 - 버그, 커밋 전 자체 검증 과정에서 발견·수정)
**Impact on plan:** 둘 다 게이트 자체의 정확성에 필수적인 수정이었다. 스코프 확장 없음 — 신규 파일 3개 외 어떤 기존 코드도 건드리지 않았다.

## Issues Encountered

- **이 워크트리에 `node_modules`가 없었다(fresh worktree).** `npm install`로 기존 `package.json`에 이미 선언된 의존성만 복원했다 — 새 패키지를 추가하지 않았으므로 Rule 3의 "패키지 설치 제외" 조항(슬롭스쿼팅 위험)에 해당하지 않는다. `npx playwright install chromium`으로 브라우저 바이너리도 준비했다.
- **`.env.local`이 없고, `.env*` 파일은 이 세션의 권한 설정상 읽기/쓰기 모두 차단되어 있었다.** `scripts/e2e-perf-budget.mjs`의 acceptance criterion이 요구하는 `node --env-file=.env.local ...` 형태로는 실행할 수 없었다 — 대신 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`UNLOCK_SECRET`을 쉘 인라인 더미 값(실제 자격 증명 아님, 예: `https://dummy-test-project.supabase.co`)으로 주입해 `npm run build`와 `e2e-perf-budget.mjs`를 검증했다. `hasUnlockCookie()`가 쿠키 없이는 항상 `false`를 반환하므로 이 경로에서는 Supabase에 실제 네트워크 요청이 발생하지 않는다 — 측정된 TTFB/전송량/프레임 숫자 자체는 유효하지만, 실제 배포 자격 증명으로 한 번 더 재확인하는 것을 권장한다(coverage D2 참고).
- **`npm run build`가 최초 1회 위 더미 자격 증명 없이 실패했다** — `src/lib/supabase/admin.ts`가 모듈 로드 시점에 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` 존재를 검증하기 때문(기존 코드, 이 플랜이 건드리지 않음). 더미 값 주입으로 해결 — 실제 문제가 아니라 이 실행 환경의 자격 증명 부재가 원인.

## User Setup Required

None - 이 플랜은 신규 npm 패키지를 설치하지 않았고 외부 서비스 설정도 추가하지 않았다. 다만 **다음에 이 게이트들을 정식으로 재실행할 때는 실제 `.env.local`(SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/UNLOCK_SECRET)로 `node --env-file=.env.local scripts/e2e-perf-budget.mjs`를 한 번 더 돌려 위 기준선 숫자를 진짜 프로덕션 자격 증명 기준으로 재확인하는 것을 권장한다.**

## Next Phase Readiness

- 08-02(트레이서 플랜)가 `/step/[stepId]` 정적 전환 + G9 갱신을 시작할 준비가 됐다 — `check-route-rendering.mjs`가 목표 계약을 이미 코드로 고정해뒀으므로 전환 작업의 완료 여부를 이 게이트 하나로 판정할 수 있다.
- 08-04(폰트 서브셋)가 참고할 폰트 비중 숫자(76.29%, D8-B 임계값 초과)가 확정됐다 — 서브셋 진행이 근거를 갖췄다.
- 08-07(인터랙션 레이어)이 참고할 프레임 예산 기준선(2.78%)이 확정됐다 — 이 값이 이 페이즈 종료 시점에 악화되지 않았는지 비교할 수 있다.
- 블로커 없음. 다만 위 "User Setup Required"의 실자격증명 재확인은 이 페이즈 후속 플랜 어딘가에서(또는 배포 전 최종 확인으로) 한 번은 이뤄져야 한다.

---
*Phase: 08-performance-and-mobile*
*Completed: 2026-08-26*
