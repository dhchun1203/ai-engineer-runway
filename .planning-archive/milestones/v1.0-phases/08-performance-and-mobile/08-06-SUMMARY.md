---
phase: 08-performance-and-mobile
plan: 06
subsystem: performance
tags: [nextjs, static-generation, isr-avoidance, dday, playwright, prerender-manifest]

# Dependency graph
requires:
  - phase: 08-02
    provides: "진도 아일랜드 3계층 인프라(ProgressProvider/useProgress, progress-slots.tsx, progress-skeleton.tsx), GET /api/progress, STATIC_SHELL_PAGES/G9 이원 계약, renderedHtml() e2e 헬퍼"
  - phase: 08-03
    provides: "레슨 페이지에 같은 패턴을 두 번째로 적용한 선례 — /curriculum 전환이 그대로 따를 본보기"
provides:
  - "완전 정적 /curriculum 라우트 — SC1이 명시한 세 라우트(레슨·Step·커리큘럼) 전부 정적 전환 완료"
  - "src/components/dday-countdown-live.tsx — 브라우저에서 Asia/Seoul 오늘을 재계산해 D-day를 정정하는 클라이언트 아일랜드(D8-O), ISR 없이 완전 정적 + 항상 정확한 D-day 동시 달성"
  - "ProgressSummarySlot(progress-slots.tsx) — 커리큘럼 페이지 전체 진행률 요약 자리"
  - "step-card.tsx 'use client' 전환 — useProgress() 컨텍스트에서 직접 읽음, moduleCount/lessonCount prop 신설"
  - "STATIC_SHELL_PAGES 최종 3항목(레슨·Step·커리큘럼), DYNAMIC_GATED_PAGES 최종 2항목(/, /schedule) — check-route-rendering.mjs 전 항목 초록불"
  - "/·/schedule 동적 유지 결정(D8-P)을 코드 주석·게이트·이 SUMMARY 세 곳에 기록"
  - "e2e-progress.mjs i6, e2e-today.mjs D-day 정확성 시나리오 — /curriculum 정적 셸의 런타임 증명"
affects: [08-08]

# Actuals (#2632)
actuals:
  tokens: 8200
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "브라우저 재계산 D-day 아일랜드: 정적 셸에 빌드/요청 시점 초기값을 심고, 클라이언트 useEffect가 동일한 today.ts 로직으로 재계산해 다르면 갱신 — ISR의 stale-first-request 창을 구조적으로 없애면서 완전 정적을 유지하는 패턴(D8-O). 향후 날짜 의존 배지가 필요하면 이 패턴을 재사용할 수 있다"
    - "클라이언트 컴포넌트의 매니페스트 격리: step-card.tsx가 'use client' 전환되면서 getModulesByStep/getLessonCounts 호출을 페이지 레벨로 끌어올려 moduleCount/lessonCount prop으로만 받는다 — Velite 매니페스트가 클라이언트 번들에 끌려오지 않게 하는 08-02의 module-accordion.tsx 패턴과 동일"
    - "e2e 게이트의 renderedHtml() 헬퍼는 공유 모듈로 빼지 않고 파일마다 복제한다 — e2e-today.mjs에 새로 복제된 사본이 이 원칙의 세 번째 사례(e2e-progress.mjs, e2e-lesson-note.mjs에 이어)"

key-files:
  created:
    - src/components/dday-countdown-live.tsx
  modified:
    - src/app/curriculum/page.tsx
    - src/components/step-card.tsx
    - src/components/progress-slots.tsx
    - src/app/page.tsx
    - src/app/schedule/page.tsx
    - scripts/check-progress-gates.mjs
    - scripts/e2e-progress.mjs
    - scripts/e2e-today.mjs

key-decisions:
  - "D8-N/D8-O/D8-P(계획에 이미 기록된 결정)를 그대로 실행 — ISR을 어디에도 쓰지 않음, D-day는 브라우저에서 재계산, /·/schedule은 동적 유지"
  - "e2e-today.mjs의 D-day 정확성 시나리오에서 최초 구현이 문서 전체를 상대로 /D-(\\d+|DAY)/를 검색해 Next.js가 심는 다른 문자열(정확한 출처는 특정하지 않았으나 스크립트/청크 관련 문자열로 추정)에서 우연히 일치하는 부분을 주웠다(초기값 D-34인데 잘못 매칭된 값 D-02) — 실측으로 발견 후 data-schedule-ui=\"dday\" 마커 뒤 600자 윈도우로 검색 범위를 좁혀 수정했다(s3 시나리오의 500자 윈도우 관례와 동일 기법)"
  - "e2e-today.mjs의 브라우저 시각 고정은 Playwright 공식 Clock API(page.clock.setFixedTime)를 썼다 — Task 1 검증 스크립트(커밋 안 됨)에서 쓴 수동 Date 서브클래스 오버라이드보다 이 저장소 게이트에 남기기에 더 안정적이고 표준적인 방법이라 판단했다"

patterns-established:
  - "브라우저 재계산 D-day 아일랜드(dday-countdown-live.tsx) — 날짜 의존 배지 하나만 있고 나머지 화면이 전부 정적 파생값일 때, ISR 대신 이 패턴으로 완전 정적 + 항상 정확을 동시에 얻는다"
  - "e2e 게이트에서 브라우저 시각을 조작해야 할 때는 page.clock.setFixedTime()을 쓰고, 텍스트 안의 숫자를 정규식으로 뽑을 때는 반드시 관련 data-* 마커 뒤 N자 윈도우로 범위를 좁힌다 — 문서 전체 스캔은 무관한 문자열에 우연히 매칭될 위험이 있다(이 플랜이 실제로 겪음)"

requirements-completed: [SC1, SC4, TRACK-03, TRACK-04, SCHED-02, SCHED-04]

coverage:
  - id: D1
    description: "/curriculum이 빌드 시점에 미리 생성되고 .next/prerender-manifest.json의 routes에 등장하며 initialRevalidateSeconds가 숫자가 아니다 — ISR이 아니라 완전 정적이다"
    requirement: "SC1"
    verification:
      - kind: other
        ref: "npm run build && node -e '...prerender-manifest.json routes 검사...' → OK; node scripts/check-route-rendering.mjs → all route rendering contracts passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "/curriculum의 D-day 숫자가 자정을 넘긴 첫 방문에도 정확하다 — 브라우저가 Asia/Seoul 기준 오늘을 직접 계산한다"
    requirement: "SC1"
    verification:
      - kind: e2e
        ref: "scripts/e2e-today.mjs 신규 D-day 정확성 시나리오 — page.clock.setFixedTime()으로 다음 날 00:05 KST 고정 → 수화 후 D-day가 정확히 1만큼 줄어듦(D-34→D-33)을 확인. 전용 dev 서버(포트 3298)에서 스크래치 스크립트로 동일 로직 재현 검증(실 e2e-today.mjs 풀 런은 t4에서 더미 Supabase 자격 증명 오류로 이 시나리오 이전에 중단됨)"
        status: pass
    human_judgment: false
  - id: D3
    description: "잠금 쿠키를 가진 브라우저에서 전체 진행률 요약과 Step 진행률 바 3개가 여전히 정확하다"
    requirement: "TRACK-03, TRACK-04"
    verification:
      - kind: other
        ref: "Playwright route mock(스크래치, 커밋 안 됨) — 잠금 쿠키 + mocked GET /api/progress 응답으로 /curriculum 접속 → data-progress-ui=\"summary\" 1건, data-progress-ui=\"step-bar\" 3건, data-step-percent 3건, data-progress-percent 1건 확인"
        status: pass
    human_judgment: true
    rationale: "실 Supabase 자격 증명이 이 워크트리에서 접근 불가(.env.local 권한 차단, 08-01/02/03/04/05와 동일한 환경 제약) — e2e-progress.mjs i2~i6는 mock으로 렌더링 분기는 증명했지만 실 DB 왕복(진짜 완료 데이터로 퍼센트 증감)은 08-08에서 재확인 필요"
  - id: D4
    description: "잠금 쿠키가 있어도 /curriculum HTML 원문에는 진도 마커가 0건이다"
    requirement: "PLAT-02"
    verification:
      - kind: integration
        ref: "curl --cookie 'runway_unlock=...' /curriculum 원문 HTML — data-progress-ui 카운트 0 (더미 자격 증명으로도 유효 — 서버가 애초에 쿠키를 읽지 않으므로 자격 증명 실효성과 무관)"
        status: pass
    human_judgment: false
  - id: D5
    description: "/와 /schedule은 동적으로 유지되고, 그 이유가 코드 주석과 SUMMARY 양쪽에 기록된다"
    requirement: "SC1"
    verification:
      - kind: other
        ref: "src/app/page.tsx·src/app/schedule/page.tsx 주석 업데이트(설치된 Next 16.3.2 문서 파일 경로·행 번호 인용) + 이 SUMMARY 하단 표. 코드는 무변경(git diff 확인, dynamic 선언 그대로)"
        status: pass
    human_judgment: false
  - id: D6
    description: "node scripts/check-route-rendering.mjs가 0으로 종료한다 — 이 페이즈가 세운 라우트 렌더 모드 계약이 전부 충족된다"
    requirement: "SC4"
    verification:
      - kind: other
        ref: "node scripts/check-route-rendering.mjs → all route rendering contracts passed"
        status: pass
    human_judgment: false
  - id: D7
    description: "node --env-file=.env.local scripts/e2e-progress.mjs와 scripts/e2e-today.mjs가 둘 다 0으로 종료한다"
    requirement: "SC4"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs / e2e-today.mjs (미실행 — 아래 rationale)"
        status: unknown
    human_judgment: true
    rationale: "이 워크트리에서 .env.local 접근이 권한상 차단되어 있다(08-01~08-05와 동일한 환경 제약). 더미 Supabase 자격 증명으로는 e2e-progress.mjs가 i2 준비(select)에서, e2e-today.mjs가 t4(진도 조회 실패로 인한 error 상태, step-bar 0건)에서 각각 중단된다 — 이전 시나리오(i1, t1~t3)는 전부 통과했고 중단 지점 이전 어떤 시나리오도 회귀하지 않았다. node --check로 두 파일의 문법 정합성을 확인했고, renderedHtml()/D-day 정확성 로직은 별도 스크래치 스크립트(전용 dev 서버, mocked API 응답과 page.clock 오버라이드)로 동일 코드 경로를 재현해 정확성을 구조적으로 검증했다. 실 .env.local 보유 환경(08-08 예정)에서 전체 스위트 재확인이 필요하다"

duration: 약 30분
completed: 2026-08-27
status: complete
---

# Phase 8 Plan 6: 완전 정적 커리큘럼 셸 + 브라우저 계산 D-day Summary

**`/curriculum`을 완전 정적으로 전환(SC1의 세 라우트 전부 완료)하고, ISR 대신 브라우저에서 D-day를 재계산하는 클라이언트 아일랜드(D8-O)로 정적성과 날짜 정확성을 동시에 확보 — `/`·`/schedule`의 동적 유지 결정을 근거와 함께 코드·게이트에 확정**

## Performance

- **Duration:** 약 30분
- **Completed:** 2026-08-27 (UTC+9)
- **Tasks:** 3/3
- **Files modified:** 9 (신규 1, 수정 8)

## Accomplishments

- **`/curriculum` 완전 정적 전환** — route segment config `dynamic` 선언, `hasUnlockCookie()`, `readCompletedLessonIds()` 호출을 전부 제거했다. `npm run build` 산출물에서 `/curriculum`이 `initialRevalidateSeconds` 없이(완전 정적) `.next/prerender-manifest.json`에 등장하고, `/`·`/schedule`은 여전히 부재(동적 유지)함을 확인했다. `node scripts/check-route-rendering.mjs`가 08-01이 세운 계약을 마지막 항목까지 전부 초록불로 만들었다 — SC1이 명시한 레슨·Step·커리큘럼 세 라우트가 전부 완전 정적이다.
- **`DDayCountdownLive` 신설(D8-O)** — 정적 셸에 빌드/요청 시점 D-day 초기값을 심고, 마운트 후 `useEffect`가 `todayInSeoul()`/`daysUntil()`(둘 다 의존성 0 순수 모듈, G18)로 브라우저 시각 기준 재계산해 값이 다르면 정정한다. 렌더는 기존 `<DDayCountdown>`에 위임 — 표현 컴포넌트를 복제하지 않았다. 스크래치 스크립트로 브라우저 시각을 다음 날로 고정했을 때 D-34→D-33으로 정확히 1만큼 정정됨을 실측 확인했다.
- **`step-card.tsx` `'use client'` 전환** — `getModulesByStep`/`getLessonCounts` 호출을 페이지로 옮겨 `moduleCount`/`lessonCount` prop으로 받고(Velite 매니페스트가 클라이언트 번들에 끌려오지 않게), `progress` prop을 없애고 `useProgress()`의 `steps` 배열에서 직접 읽는다. `loading`→스켈레톤, `ready`→기존 바·배지, `locked`/`error`→무표시(DOM 부재 계약).
- **`ProgressSummarySlot` 신설(progress-slots.tsx)** — `loading`→`SummarySkeleton`, `ready`→기존 `<ProgressSummary>`, `error`→기존 `<ProgressReadError>`, `locked`→무표시. `progress-summary.tsx` 자체는 건드리지 않아 홈(`/`, 동적 유지)의 기존 prop 계약이 그대로 유지된다.
- **G9 게이트 확정** — `STATIC_SHELL_PAGES`가 3항목(레슨·Step·커리큘럼)으로, `DYNAMIC_GATED_PAGES`가 2항목(`/`, `/schedule`)으로 각각 확정됐다. 두 회귀(정적 셸에 쿠키 식별자 재삽입, 동적 페이지의 `force-dynamic` 선언 삭제)를 임시 편집으로 재현해 G9이 둘 다 잡는 것을 확인한 뒤 원복했다.
- **`/`·`/schedule` 동적 유지 근거를 코드에 기록(D8-P)** — 두 파일의 route segment config 주석에 설치된 Next 16.3.2 문서(`incremental-static-regeneration.md` 100~102행·238행, ISR 창 만료 후 첫 요청이 낡은 페이지를 받는다는 원문)와 icn1 리전 TTFB 59~68ms 기준선을 인용했다. 코드는 한 줄도 바뀌지 않았다(`git diff` 확인).
- **e2e 게이트 이행** — `e2e-progress.mjs` i2~i5의 커리큘럼 쪽 요청을 `renderedHtml()`(수화 완료 후 DOM)로 교체하고 신규 i6(쿠키 있어도 원문에 진도 마커 0건) 추가. `e2e-today.mjs`에 Chromium 수명주기와 `renderedHtml()` 사본을 새로 들여와 t4를 이행하고, `page.clock.setFixedTime()`으로 브라우저 시각을 다음 날 00:05 KST로 고정하는 D-day 정확성 시나리오를 신설했다.
- **성능 측정(production build, `next start`)** — `/curriculum` TTFB 중앙값 1.60ms, `/about`(정적 대조군) 3.00ms, `/step/1` 5.40ms, `/lesson/1-1-course-orientation` 2.20ms — 판정 대상 4건 전부 통과. `/`(동적 유지) 5.80ms, `/schedule`(동적 유지) 8.60ms.

## Task Commits

Each task was committed atomically:

1. **Task 1: 브라우저 계산 D-day 아일랜드 + /curriculum 정적 전환** - `38784e3` (feat)
2. **Task 2: 게이트 마무리 — G9에 커리큘럼 추가 + / · /schedule 동적 유지 근거 기록** - `034d590` (feat)
3. **Task 3: e2e-progress i 시나리오와 e2e-today t3·t4를 수화 후 DOM 검증으로 이행** - `0f45276` (test)

## Files Created/Modified

- `src/components/dday-countdown-live.tsx` - 신규. `DDayCountdownLive({ initialDaysUntil })` export
- `src/app/curriculum/page.tsx` - route segment config `dynamic` 제거, 쿠키·진도 조회 제거, `<ProgressProvider>`로 감싸고 `ProgressSummarySlot`/`DDayCountdownLive` 소비
- `src/components/step-card.tsx` - `'use client'` 전환, `progress` prop 제거, `moduleCount`/`lessonCount` prop 신설, 진도는 context에서 읽음
- `src/components/progress-slots.tsx` - `ProgressSummarySlot` 신규
- `src/app/page.tsx` / `src/app/schedule/page.tsx` - 주석만 갱신(동적 유지 근거 기록, D8-P). 코드 무변경
- `scripts/check-progress-gates.mjs` - `STATIC_SHELL_PAGES` += 커리큘럼(최종 3항목), `DYNAMIC_GATED_PAGES` 주석 보강(최종 2항목), G17 주석 시제 정정
- `scripts/e2e-progress.mjs` - i2~i5 커리큘럼 요청을 `renderedHtml()`로 교체, 신규 i6
- `scripts/e2e-today.mjs` - Chromium 수명주기 + `renderedHtml()` 사본 신설, t4 이행, 신규 D-day 정확성 시나리오

## STATIC_SHELL_PAGES / DYNAMIC_GATED_PAGES 최종 내용 (check-progress-gates.mjs G9)

```js
const STATIC_SHELL_PAGES = [
  path.join(ROOT, 'src', 'app', 'step', '[stepId]', 'page.tsx'),      // 08-02
  path.join(ROOT, 'src', 'app', 'lesson', '[lessonId]', 'page.tsx'),  // 08-03
  path.join(ROOT, 'src', 'app', 'curriculum', 'page.tsx'),            // 08-06(이 플랜)
];

const DYNAMIC_GATED_PAGES = [
  path.join(ROOT, 'src', 'app', 'page.tsx'),
  path.join(ROOT, 'src', 'app', 'schedule', 'page.tsx'),
];
```

## `/`·`/schedule` 동적 유지 결정의 최종 문구 (D8-P)

Phase 8이 레슨·Step·커리큘럼 세 라우트를 정적으로 전환했지만, 홈(`/`)과 일정표
(`/schedule`)는 동적으로 남는다. 이유는 두 갈래다:

1. **오늘 날짜가 곧 페이지 본문 전체다.** 홈은 오늘 배정 레슨·완료 상태 머신·페이스
   판정·밀린 레슨 목록·내일 정보를 담고, 일정표는 오늘 행 강조와 자동 스크롤
   앵커를 계산한다. 정적으로 만들려면 화면 대부분이 클라이언트 렌더가 되어야
   하고, 그러면 정적 셸의 이득(캐시·TTFB) 자체가 사라진다.
2. **ISR(`export const revalidate`)을 쓰지 않기로 했다(D8-N).** 설치된 Next
   16.3.2 문서(`node_modules/next/dist/docs/01-app/02-guides/incremental-static-regeneration.md`
   100~102행·238행)가 직접 말하듯, 재검증 창 만료 후 **첫 요청은 캐시된(낡은)
   페이지를 그대로 받고** 새 버전은 백그라운드에서 생성된다. 하루 한 번 여는
   1인 학습 사이트에서는 그 "창 만료 후 첫 요청"이 사실상 "그날의 유일한
   방문"이 되기 쉬워, 매일 어제의 "오늘의 학습"을 보게 될 위험이 있다.

동적 유지의 비용은 이미 낮다 — icn1 리전 이동으로 두 라우트 모두 TTFB
59~68ms(08-01 기준선)였고, 이번 측정에서도 `/` 5.80ms·`/schedule` 8.60ms로
낮은 수준을 유지한다. 두 파일의 route segment config 주석에 이 근거를
그대로 옮겨 적었다. `check-progress-gates.mjs` G9의 `DYNAMIC_GATED_PAGES`와
G17이 이 결정을 상시 지킨다.

**재론 조건(D8-N 원문):** 방문 빈도가 하루 여러 번으로 바뀌거나, Next가 만료
시 동기 재생성 옵션을 제공하면 다시 검토한다.

## `/curriculum` TTFB 전후 숫자 + 세 정적 라우트 · `/about` 대조군 비교표

전(08-01 기준선, 전환 전, 더미 자격증명):

| 라우트 | TTFB 중앙값(ms) | 비고 |
|---|---|---|
| `/curriculum` | (08-01 당시 동적, 미측정 대상 — 08-01은 판정 대상을 Step 1·레슨·커리큘럼 세 곳으로 예고했으나 실측 표는 Step/레슨 위주였다) | |

후(이 플랜, 전환 후, 더미 자격증명, production build `next start`):

| 라우트 | TTFB 중앙값(ms, 5회 방문) | 판정 | 비고 |
|---|---|---|---|
| `/about` (정적 대조군) | 3.00ms | 관측만 | 08-01부터 이미 정적 |
| `/curriculum` (이 플랜) | **1.60ms** | **판정 대상, 통과** | 완전 정적 전환 후 |
| `/step/1` | 5.40ms | 판정 대상, 통과 | 08-02 |
| `/lesson/1-1-course-orientation` | 2.20ms | 판정 대상, 통과 | 08-03 |
| `/` (동적 유지) | 5.80ms | 관측만 | D8-P |
| `/schedule` (동적 유지) | 8.60ms | 관측만 | D8-P |

`/curriculum`이 세 정적 라우트 중 가장 낮은 TTFB를 기록했고, 정적 대조군
`/about`보다도 낮다(로컬 dev/prod 빌드 노이즈 범위 내 수치 — Supabase 쿼리가
쿠키 없는 경로에서 애초에 발생하지 않는 것은 세 라우트 공통이다). 최종
배포 환경(CDN 엣지 캐시) 판단은 08-08이 담당한다.

## ISR을 쓰지 않은 근거 (Next 문서 인용 위치)

`node_modules/next/dist/docs/01-app/02-guides/incremental-static-regeneration.md`

- **100~102행:** "After 60 seconds has passed, the next request will still return
  the cached (stale) page. The cache is invalidated and a new version of the
  page begins generating in the background." — 재검증 창 만료 후 **첫 요청은
  낡은 페이지를 그대로 받는다**는 원문.
- **238행:** "After an hour has passed, the next visitor will still receive the
  cached (stale) version of the page immediately for a fast response." — 같은
  내용을 예제 섹션에서 재확인.

이 두 문장이 D8-N("ISR을 어디에도 쓰지 않는다")의 근거다 — 하루 한 번 여는
1인 학습 사이트에서는 "창 만료 후 첫 요청"이 곧 "그날의 유일한 방문"이 되기
쉬워, ISR을 붙이면 매일 어제의 상태를 보게 될 위험이 리서치 권고(`revalidate
= 3600`)보다 크다고 판단했다.

## Decisions Made

- **D8-N/D8-O/D8-P(계획에 이미 기록된 결정)를 그대로 실행** — ISR 미사용,
  브라우저 재계산 D-day, `/`·`/schedule` 동적 유지.
- **e2e-today.mjs D-day 정확성 시나리오의 정규식 검색 범위를 문서 전체에서
  `data-schedule-ui="dday"` 마커 뒤 600자 윈도우로 좁혔다** — 최초 구현이
  문서 전체를 상대로 `/D-(\d+|DAY)/`를 검색해 무관한 문자열에서 우연히
  일치하는 값(D-34가 D-02로 잘못 매칭됨)을 주웠다. 스크래치 스크립트로 이
  버그를 실측 발견한 뒤 s3 시나리오의 500자 윈도우 관례를 따라 수정했다.
- **브라우저 시각 고정에 Playwright 공식 Clock API(`page.clock.setFixedTime`)를
  사용** — Task 1 검증에서 시도한 수동 `Date` 서브클래스 오버라이드보다
  게이트 스크립트에 남기기에 더 안정적이고 표준적이다.
- **실 Supabase 자격 증명 부재를 mock + 스크래치 스크립트로 우회** —
  08-01~08-05와 동일한 환경 제약(`.env.local` 권한 차단). "ready" 상태의
  실제 마커 렌더링·D-day 재계산은 mock/clock 오버라이드로 구조적으로
  증명했지만, 실 DB 왕복은 미확인 — coverage D3·D7에 기록.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] e2e-today.mjs D-day 정확성 시나리오의 정규식이 무관한 문자열에 우연히 매칭**
- **Found during:** Task 3 (D-day 정확성 시나리오를 스크래치 스크립트로 사전 검증하는 중)
- **Issue:** `hydratedBody.match(/D-(\d+|DAY)/)`를 문서 전체에 대해 실행하자 실제 D-day 값(`D-33`)이 아니라 `D-02`가 매칭됐다 — 페이지 어딘가의 다른 문자열이 우연히 패턴에 걸렸다.
- **Fix:** `data-schedule-ui="dday"` 마커의 인덱스를 먼저 찾고 그 뒤 600자 윈도우 안에서만 정규식을 실행하는 `extractDdayNear()` 헬퍼로 교체했다(s3 시나리오의 500자 윈도우 관례와 동일 기법).
- **Files modified:** `scripts/e2e-today.mjs`
- **Verification:** 전용 dev 서버(포트 3298)에서 스크래치 스크립트로 재현 — 수정 전 `initialMatch=D-34, hydratedMatch=D-02`(오탐), 수정 후 `initialMatch=D-34, hydratedMatch=D-33, diff=1`(정확).
- **Committed in:** `0f45276` (Task 3 commit — 회귀 버전은 커밋 전에 발견·수정되어 히스토리에 남지 않음)

---

**Total deviations:** 1 auto-fixed (Rule 1 - 버그, 커밋 전 자체 검증 과정에서 발견·수정)
**Impact on plan:** 코드는 계획이 요구한 목표(SC1 세 라우트 완전 정적, D-day 항상 정확, `/`·`/schedule` 동적 유지 근거 기록)를 정확히 달성했다. 회귀는 커밋되지 않고 검증 단계에서 잡혀 히스토리를 오염시키지 않았다.

## Issues Encountered

- **실 Supabase 자격 증명(`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`)과 `UNLOCK_SECRET`을 담은 `.env.local`이 이 워크트리에서 권한상 읽기/쓰기 모두 차단됐다** — 08-01~08-05와 동일한 환경 제약. 대신:
  - `npm run build`·`check-progress-gates.mjs`·`check-route-rendering.mjs`·`check-brand.mjs`·`check-design-tokens.mjs`·`check-manifest.mjs`·`check-schedule.mjs`·`check-pace.mjs`·`check-progress-math.mjs`·`check-lesson-structure.mjs`·`check-font-glyph-coverage.mjs`는 더미 Supabase 자격 증명으로 정상 실행·통과했다.
  - `e2e-mobile-overflow.mjs`(21/21)·`e2e-typography.mjs`·`e2e-section-tape.mjs`·`e2e-perf-budget.mjs`(판정 대상 4건 전부 통과, `/curriculum` TTFB 1.60ms)는 더미 자격 증명으로 정상 실행·통과했다.
  - `e2e-mobile-readability.mjs`는 08-05가 이미 기록한 잔여 M3 위반(날짜·소요시간 배지, 내비게이션, MDX 프로즈 — 이 플랜의 파일 범위 밖)으로 계속 실패한다. `/curriculum`의 수치(M1=0 M2=0 M3=4, 375/768/1024 전부 동일)는 08-05 기준선과 정확히 일치 — 이 플랜이 회귀시키지 않았다.
  - `e2e-progress.mjs`는 i1까지 통과 후 i2 준비(select)에서, `e2e-today.mjs`는 t1~t3까지 통과 후 t4(진도 조회 실패로 인한 error 상태)에서 각각 중단됐다 — 08-02/08-03과 같은 성격의 제약. 중단 지점 이전 시나리오는 전부 통과했고, 코드 로직 자체는 스크래치 스크립트(mocked API, page.clock)로 구조적으로 검증했다.
  - `check-supabase-progress.mjs`·`check-supabase-note.mjs`는 첫 실 Supabase 호출에서 즉시 중단됐다(예상된 동작).
  - `node_modules`가 없는 fresh worktree였다 — `npm install`(532 패키지)로 복원했다. Playwright Chromium은 이미 설치돼 있었다.

## User Setup Required

None - 이 플랜은 신규 npm 패키지를 설치하지 않았다(`git diff package.json` 무변경 확인). 다만 08-01~08-05가 남긴 것과 같은 권고대로, 다음에 실 `.env.local`을 쓸 수 있는 환경에서 `e2e-progress.mjs`(i2~i6 포함)·`e2e-today.mjs`(t4·D-day 정확성 시나리오 포함)를 재확인하는 것을 권장한다 — 08-08이 이 재확인을 담당한다.

## Next Phase Readiness

- SC1이 명시한 세 라우트(레슨·Step·커리큘럼)가 전부 완전 정적으로 전환됐다 — `check-route-rendering.mjs`가 08-01이 세운 계약을 마지막 항목까지 초록불로 만들었다.
- `/`·`/schedule`의 동적 유지 결정이 근거와 함께 코드 주석·G9 게이트·이 SUMMARY 세 곳에 일관되게 기록됐다.
- **08-08(최종 성능 비교)**이 참고할 항목: `/curriculum` TTFB 1.60ms(세 정적 라우트 중 최저, `/about` 대조군보다도 낮음) — 실 배포 환경(CDN 엣지 캐시) 재측정 시 이 순위가 유지되는지 확인 필요.
- **블로커:** 실 Supabase 자격 증명으로 `e2e-progress.mjs`(i2~i6)·`e2e-today.mjs`(t4·D-day 정확성)의 실 DB 왕복을 아직 확인하지 못했다 — 위 "User Setup Required" 참고. 코드 로직 자체는 mock/clock 오버라이드 기반 검증과 정적 게이트로 뒷받침됐다.

---
*Phase: 08-performance-and-mobile*
*Completed: 2026-08-27*

## Self-Check: PASSED

- FOUND: src/components/dday-countdown-live.tsx
- FOUND: src/app/curriculum/page.tsx
- FOUND: src/components/step-card.tsx
- FOUND: src/components/progress-slots.tsx
- FOUND: src/app/page.tsx
- FOUND: src/app/schedule/page.tsx
- FOUND: scripts/check-progress-gates.mjs
- FOUND: scripts/e2e-progress.mjs
- FOUND: scripts/e2e-today.mjs
- FOUND: .planning/phases/08-performance-and-mobile/08-06-SUMMARY.md
- FOUND: commit 38784e3
- FOUND: commit 034d590
- FOUND: commit 0f45276
