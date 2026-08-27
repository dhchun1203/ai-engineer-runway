---
phase: 08-performance-and-mobile
plan: 03
subsystem: performance
tags: [nextjs, static-generation, route-handler, progress-tracking, lesson-notepad, playwright]

# Dependency graph
requires:
  - phase: 08-02
    provides: "진도 아일랜드 3계층 인프라(ProgressProvider/useProgress, progress-slots.tsx, progress-skeleton.tsx), GET /api/progress 확장점(lesson 필드), STATIC_SHELL_PAGES/G9 이원 계약, renderedHtml() e2e 헬퍼"
provides:
  - "완전 정적 /lesson/[lessonId] 라우트 35개 (generateStaticParams만, 쿠키/진도/메모 조회 0)"
  - "GET /api/progress?lesson=<slug> 응답의 note 필드 — { ok: true, body } | { ok: false }, hasUnlockCookie() 통과 후에만 조회"
  - "CompleteButtonSlot/LessonNoteSlot — 08-02가 만든 3계층 패턴을 레슨 완료 버튼·메모장으로 확장"
  - "CompleteButtonSkeleton/NotepadSkeleton — 레이아웃 시프트 0을 목표로 실제 컴포넌트와 치수 공유"
  - "CompleteButton의 onToggled 콜백 — 완료 토글 → ProgressProvider.refresh() 즉시 반영 경로"
  - "STATIC_SHELL_PAGES에 레슨 페이지 추가된 G9 게이트"
  - "e2e-progress.mjs 신규 시나리오 f(정적 셸 원문 무마커)·g(클릭 → 즉시 반영 → 재방문 유지)"
  - "e2e-lesson-note.mjs waitForProgressSettled() 헬퍼 + 신규 시나리오 N(빈 값 덮어쓰기 방지)"
affects: [08-06, 08-08]

# Actuals (#2632)
actuals:
  tokens: 8990
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "레슨 페이지가 08-02의 진도 아일랜드 3계층을 lessonId prop으로 그대로 확장 — 새 컴포넌트 계층을 만들지 않고 CompleteButtonSlot/LessonNoteSlot 2개만 추가"
    - "메모 읽기를 별도 엔드포인트로 만들지 않고 GET /api/progress?lesson=에 note 필드로 합침(D8-G) — 왕복 1회, 게이트 1벌"
    - "D8-H: 메모장은 fetch가 끝나기 전에는 마운트하지 않는다 — LessonNoteSlot이 loading 상태에서 NotepadSkeleton만 렌더하고, note 데이터가 ready 상태로 도착한 뒤에야 <LessonNotepad initialBody>를 마운트. initialBody를 나중에 갈아끼우는 경로 자체가 코드에 없다"
    - "완료 버튼의 onToggled?: () => void optional prop — Server Action 성공 직후에만 호출, useOptimistic/useState(initialDone) 금지 규율(G12)은 그대로 유지"

key-files:
  created: []
  modified:
    - src/app/lesson/[lessonId]/page.tsx
    - src/app/api/progress/route.ts
    - src/components/progress-provider.tsx
    - src/components/progress-slots.tsx
    - src/components/progress-skeleton.tsx
    - src/components/complete-button.tsx
    - src/components/lesson-notepad.tsx
    - scripts/check-progress-gates.mjs
    - scripts/e2e-progress.mjs
    - scripts/e2e-lesson-note.mjs

key-decisions:
  - "D8-G/D8-H(계획에 기록된 결정)를 그대로 실행 — 메모 읽기를 /api/progress?lesson=에 합치고(별도 /api/note 없음), 메모장은 데이터 도착 후에만 마운트"
  - "e2e-progress.mjs Task 2(d)가 지시한 신규 시나리오 태그를 'f'·'g'로 그대로 사용했다 — 기존 코드에 이미 'g1~g5'(/unlock 발급 플로우) 하위 번호 시나리오가 있어 사람이 로그를 훑을 때 'g'(신규 완료 토글 클릭)와 'g1~g5'(기존 /unlock)가 시각적으로 겹쳐 보일 수 있지만, 문자열 자체는 다르고(정확히 'g' vs 'g1' 등) 계획이 명시한 태그를 그대로 따르는 것이 최소 변경 경로라고 판단했다. 기존 g1~g5를 다른 문자로 재번호하는 것은 계획 범위 밖의 리네이밍이라 하지 않았다"
  - "실 Supabase 자격 증명이 이 워크트리에서 접근 불가(.env.local 권한 차단, 08-01/02/04/05와 동일한 환경 제약) — e2e-progress.mjs·e2e-lesson-note.mjs·check-supabase-note.mjs는 첫 실 Supabase 호출에서 즉시 네트워크 오류로 중단됐다. 대신 (a) npm run build 산출물의 prerender-manifest.json 직접 검사, (b) curl 기반 원문 HTML 마커 카운트, (c) Playwright route mock(스크래치 스크립트, 커밋하지 않음)으로 locked/ready/note-ok/note-error 4가지 <ProgressProvider> 상태를 전부 재현해 CompleteButtonSlot·LessonNoteSlot의 분기 렌더링을 구조적으로 검증했다"

patterns-established:
  - "진도 아일랜드 소비 슬롯을 새 도메인(레슨 완료·메모)에 확장할 때는 useProgress()의 4상태(loading/ready/error/locked)를 그대로 매핑하는 새 Slot 컴포넌트만 추가한다 — Provider/Skeleton 계층은 건드리지 않는다(08-06의 커리큘럼 페이지 전환도 같은 패턴을 재사용할 수 있다)"
  - "스켈레톤은 실제 컴포넌트가 쓰는 치수 클래스(min-h-11/rounded-lg/border, 또는 .note-sheet/.note-handle 같은 CSS 변수 기반 클래스)를 그대로 재사용해 레이아웃 시프트를 구조적으로 없앤다"

requirements-completed: [SC1, SC4, SC5, TRACK-01, TRACK-02, CONV-02]

coverage:
  - id: D1
    description: "모든 레슨 라우트(/lesson/<slug>)가 빌드 시점에 미리 생성되고 .next/prerender-manifest.json의 routes에 전부 등장한다(ISR 아님)"
    requirement: "SC1"
    verification:
      - kind: other
        ref: "npm run build && node -e '...prerender-manifest.json routes 검사...' → OK: 35 lesson routes prerendered"
        status: pass
    human_judgment: false
  - id: D2
    description: "잠금 쿠키를 가진 브라우저에서 완료 버튼이 뜨고, 누르면 즉시 반영되며, 새로고침 후에도 유지된다"
    requirement: "SC1, TRACK-01"
    verification:
      - kind: other
        ref: "Playwright route mock(스크래치, 커밋하지 않음) — 잠금 쿠키 + mocked GET /api/progress?lesson= 응답(done:true, note.ok:true)으로 /lesson/1-1-course-orientation 접속 → [data-progress-island][data-progress-state=\"ready\"] 도달 후 [data-complete-state=\"done\"]과 메모 initialBody가 정확히 일치함을 확인"
        status: pass
    human_judgment: true
    rationale: "완료 버튼을 실제로 클릭해 Server Action → Supabase 왕복 → refresh() → 슬롯 재렌더 전체 경로를 도는 e2e-progress.mjs 시나리오 g는 실 Supabase 자격 증명이 필요해 이 워크트리에서 실행하지 못했다(.env.local 권한 차단). 코드 경로(onToggled 콜백 배선, useOptimistic 유지)는 구현·리뷰했고 mock으로 ready 상태 렌더링은 증명했지만, 실제 DB 왕복을 통한 즉시 반영은 08-08(또는 실 자격 증명 보유 환경)에서 한 번 더 확인이 필요하다"
  - id: D3
    description: "잠금 쿠키가 없으면 완료 버튼 대신 잠금 안내 문구가 뜨고 메모장이 DOM에 아예 등장하지 않는다"
    requirement: "PLAT-02"
    verification:
      - kind: other
        ref: "Playwright(쿠키 없음)로 /lesson/1-1-course-orientation 접속 → data-progress-state=\"locked\" 도달, [data-locked-notice] 존재, [data-notepad] 부재 확인"
        status: pass
    human_judgment: false
  - id: D4
    description: "메모장은 저장된 메모를 다 불러온 뒤에만 입력 가능해진다 — 빈 값 자동 저장이 실제 메모를 덮어쓰지 않는다"
    requirement: "CONV-02"
    verification:
      - kind: other
        ref: "Playwright route mock(스크래치) — note.ok:true + 고유 문자열 body로 mocked 응답 → [data-notepad-input]의 최초 value가 정확히 그 문자열과 일치(빈 값→채워짐 중간 상태 없음). e2e-lesson-note.mjs 신규 시나리오 N(실 Supabase 왕복, 2500ms 대기 후 본문 보존 확인)은 미실행"
        status: unknown
    human_judgment: true
    rationale: "N 시나리오는 실 Supabase에 메모를 심고 다시 읽어 보존을 확인하는 구조라 이 워크트리의 .env.local 권한 차단으로 실행하지 못했다. 코드 구조(D8-H: LessonNoteSlot이 note.ok일 때만 LessonNotepad를 마운트, initialBody prop이 나중에 갈아끼워지는 경로 없음)와 mock 기반 등가 검증은 마쳤으나, 실제 디바운스 타이밍 하에서의 DB 보존은 실 자격 증명 환경에서 재확인이 필요하다"
  - id: D5
    description: "잠금 쿠키가 있어도 레슨 페이지 HTML 원문에는 진도 마커와 메모 본문이 0건이다"
    requirement: "PLAT-02"
    verification:
      - kind: integration
        ref: "curl --cookie 'runway_unlock=...' /lesson/1-1-course-orientation 원문 HTML — data-progress-ui 카운트 0, data-notepad 카운트 0 (데이터 없이 curl로 확인, 서버가 애초에 쿠키를 읽지 않으므로 실 자격 증명 여부와 무관하게 유효)"
        status: pass
    human_judgment: false
  - id: D6
    description: "node scripts/check-progress-gates.mjs가 all gates passed로 종료한다 — G9에 레슨 페이지가 추가된 후에도 21종 게이트 계약이 유지된다"
    requirement: "SC4"
    verification:
      - kind: other
        ref: "node scripts/check-progress-gates.mjs → all gates passed (G10만 secret env var 부재로 skip)"
        status: pass
    human_judgment: false
  - id: D7
    description: "e2e-progress.mjs·e2e-lesson-note.mjs가 실 Supabase 자격 증명으로 0 종료한다"
    requirement: "SC5"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs / e2e-lesson-note.mjs (미실행 — 아래 rationale)"
        status: unknown
    human_judgment: true
    rationale: "이 워크트리에서 .env.local 접근이 권한상 차단되어 있다(08-01/02/04/05와 동일한 환경 제약). 더미 Supabase 자격 증명으로는 첫 실 DB 호출(e2e-progress.mjs의 i2 준비 select, e2e-lesson-note.mjs의 메모 백업 조회)에서 즉시 네트워크 오류로 중단된다. node --check로 두 파일의 문법 정합성은 확인했고, e2e-progress.mjs는 서버 기동 + i1(쿠키 없음 시나리오)까지는 실행해 통과를 확인했다. 실 .env.local 보유 환경(08-08 예정)에서 전체 스위트(b~g, h1~h5, i1~i5, A~N) 재확인이 필요하다"
  - id: D8
    description: "완료 버튼 자리에 로딩 중 같은 크기의 스켈레톤이 보이고, 데이터가 도착해도 레이아웃이 밀리지 않는다"
    verification: []
    human_judgment: true
    rationale: "계획의 must_haves에 verification: backstop으로 명시된 항목 — CompleteButtonSkeleton(min-h-11/rounded-lg/border 공유)·NotepadSkeleton(.note-sheet/.note-handle 공유)은 실제 컴포넌트와 치수를 코드 레벨에서 공유하도록 구현했으나, 실제 레이아웃 시프트 없음은 시각 확인이 필요하다"

duration: 약 40분
completed: 2026-08-27
status: complete
---

# Phase 8 Plan 3: 정적 레슨 셸 + 완료·메모 아일랜드 Summary

**`/lesson/[lessonId]` 35개 라우트를 완전 정적으로 전환하고, 08-02의 진도 아일랜드 3계층을 완료 버튼·메모장으로 확장 — `GET /api/progress?lesson=`에 `note` 필드를 합쳐 왕복 1회로 완료·메모를 동시에 가져오며, 메모장은 데이터 도착 후에만 마운트해 빈 값 덮어쓰기를 구조적으로 막는다**

## Performance

- **Duration:** 약 40분
- **Completed:** 2026-08-27 (UTC+9)
- **Tasks:** 3/3
- **Files modified:** 10

## Accomplishments

- **레슨 라우트 35개 완전 정적 전환** — `src/app/lesson/[lessonId]/page.tsx`에서 route segment config `dynamic` 선언과 `hasUnlockCookie`/`readCompletedLessonIds`/`readLessonNote` 호출을 전부 제거했다. `npm run build` 산출물에서 `.velite/lessons.json`의 모든 슬러그가 `.next/prerender-manifest.json`의 `routes`에 `initialRevalidateSeconds` 없이(완전 정적) 등장함을 확인했다(35/35).
- **`GET /api/progress?lesson=`에 `note` 필드 추가** — `hasUnlockCookie()` 통과 + 슬러그 존재 검증 이후에만 `readLessonNote()`를 호출한다. 실패 시 `{ ok: false }`만 담아 DB 오류 문자열이 클라이언트로 새지 않는다. 잠금 상태에서는 `lesson`이 통째로 `null`이라 메모 본문이 응답에 등장할 경로 자체가 없다.
- **`CompleteButtonSlot`/`LessonNoteSlot` 신설** — 08-02가 만든 3계층 진도 아일랜드(Provider/Slot/Skeleton)를 레슨 완료·메모 도메인으로 확장했다. 상태별 분기: `loading`→스켈레톤, `locked`→잠금 문구(기존 텍스트 그대로 이전), `error`→기존 `ProgressReadError`, `ready`→실제 완료 버튼/메모장(또는 읽기 실패 문구).
- **`CompleteButtonSkeleton`/`NotepadSkeleton` 신설** — 각각 실제 컴포넌트의 치수 클래스(`min-h-11`/`rounded-lg`/`border`, `.note-sheet`/`.note-handle`)를 그대로 공유해 데이터 도착 시 레이아웃 시프트가 없도록 설계했다.
- **`CompleteButton`에 `onToggled` 콜백 추가** — Server Action이 성공적으로 resolve된 직후에만 호출되어 `ProgressProvider.refresh()`와 연결된다. `useOptimistic`/별도 로컬 `done` 상태 금지 규율(G12)은 그대로 유지했다.
- **`lesson-notepad.tsx`는 D8-H 계약을 헤더 주석으로 명시**만 하고 로직은 그대로 뒀다 — 메모 도착 후에만 마운트되므로 컴포넌트 내부 구조를 바꿀 필요가 없었다.
- **게이트·e2e 갱신** — G9 `STATIC_SHELL_PAGES`에 레슨 페이지 추가, `e2e-progress.mjs`의 c·d·e를 `renderedHtml()`(수화 완료 후 DOM) 기반으로 이행하고 신규 시나리오 f(정적 셸 원문 무마커)·g(클릭 → 즉시 반영 → 재방문 유지) 추가, `e2e-lesson-note.mjs`에 `waitForProgressSettled()` 헬퍼와 신규 시나리오 N(빈 값 덮어쓰기 방지) 추가.
- **성능 측정** — `/lesson/1-1-course-orientation` TTFB 중앙값이 08-01 기준선 6.50ms에서 2.50ms로 개선(둘 다 더미 자격 증명, 캐시 없는 로컬 측정 — 노이즈 범위 감안 필요). 판정 대상 4건(Step 1·커리큘럼·레슨 TTFB·프레임 예산) 전부 통과.

## Task Commits

Each task was committed atomically:

1. **Task 1: 레슨 페이지 정적 전환 + 완료·메모 아일랜드** - `d32e113` (feat)
2. **Task 2: G9 STATIC_SHELL_PAGES에 레슨 페이지 추가 + e2e-progress b~e 이행 + 신규 f·g** - `a71dbb1` (feat)
3. **Task 3: e2e-lesson-note.mjs를 fetch 지연 구간에 맞춰 조정** - `f565529` (test)

## Files Modified

- `src/app/lesson/[lessonId]/page.tsx` - 완전 정적 전환. `<ProgressProvider lessonId>`로 감싸고 `CompleteButtonSlot`/`LessonNoteSlot` 소비. `note-page-spacer`를 항상 붙임(showNotepad 조건부 제거)
- `src/app/api/progress/route.ts` - `lesson.note` 필드 추가(`{ ok: true, body } | { ok: false }`), `readLessonNote()`는 `hasUnlockCookie()` 통과 후에만 호출
- `src/components/progress-provider.tsx` - `ProgressLesson` 타입에 `note` 필드 추가
- `src/components/progress-slots.tsx` - `CompleteButtonSlot`/`LessonNoteSlot` 신규, `CompleteButton`/`LessonNotepad` import 추가
- `src/components/progress-skeleton.tsx` - `CompleteButtonSkeleton`/`NotepadSkeleton` 신규
- `src/components/complete-button.tsx` - `onToggled?: () => void` optional prop 추가, 성공 시에만 호출
- `src/components/lesson-notepad.tsx` - 헤더 주석에 D8-H 계약(도착 후 마운트, initialBody 미교체) 명시만 추가, 로직 불변
- `scripts/check-progress-gates.mjs` - G9 `STATIC_SHELL_PAGES`에 레슨 페이지 경로 추가
- `scripts/e2e-progress.mjs` - c·d·e를 `renderedHtml()` 기반으로 이행, 신규 시나리오 f·g 추가
- `scripts/e2e-lesson-note.mjs` - `waitForProgressSettled()` 헬퍼 신설, 초기 로드/F reload/L 뷰포트 루프에 적용, H 시나리오에 `locked` 상태 확인 선행, 신규 시나리오 N 추가

## `STATIC_SHELL_PAGES` 현재 내용 (check-progress-gates.mjs G9)

```js
const STATIC_SHELL_PAGES = [
  path.join(ROOT, 'src', 'app', 'step', '[stepId]', 'page.tsx'),   // 08-02
  path.join(ROOT, 'src', 'app', 'lesson', '[lessonId]', 'page.tsx'), // 08-03(이 플랜)
  // 08-06이 여기에 src/app/curriculum/page.tsx를 추가한다
];

const DYNAMIC_GATED_PAGES = [
  path.join(ROOT, 'src', 'app', 'page.tsx'),
  path.join(ROOT, 'src', 'app', 'schedule', 'page.tsx'),
];
```

## 프리렌더된 레슨 라우트 개수 (실측)

`.velite/lessons.json` 35개 슬러그 전부가 `.next/prerender-manifest.json`의 `routes`에 `initialRevalidateSeconds` 없이(완전 정적) 등장한다 — `35/35`.

## `e2e-lesson-note.mjs` 조정한 대기 지점 목록

1. 메인 컨텍스트 초기 `page.goto()` 직후 — `waitForProgressSettled(page)`를 `page.waitForSelector('[data-notepad]')` 앞에 추가
2. F 시나리오(자동 저장 왕복)의 `page.reload()` 직후 — `waitForProgressSettled(page)`를 `page.waitForSelector('[data-notepad-input]')` 앞에 추가
3. L 시나리오(뷰포트별 가로 오버플로 0) 루프의 `vpPage.goto()` 직후 — `waitForProgressSettled(vpPage)`를 `vpPage.waitForSelector('[data-notepad]')` 앞에 추가
4. H 시나리오(잠금 없이는 저장되지 않는다) — `waitForProgressSettled(lockedPage)`를 먼저 부르고 `data-progress-state === 'locked'`를 확인한 뒤에야 `data-notepad` 부재를 판정하도록 순서 변경(정적 셸의 "아직 안 그려짐"과 "잠겨서 안 그림"을 구분)
5. (신규) N 시나리오는 의도적으로 `waitForProgressSettled()`를 호출하지 **않는다** — 메모 도착 전 마운트 여부를 시험하는 것이 이 시나리오의 목적이므로, 정착을 기다리지 않은 채 곧바로 2500ms(디바운스 1000ms보다 김)를 대기한 뒤 DB 본문 보존을 확인한다

## `/lesson/*` TTFB 전후 숫자

| 시점 | 중앙값(ms, 5회 방문) | 비고 |
|---|---|---|
| 08-01 기준선(전환 전, 더미 자격증명) | 6.50ms | 08-01-SUMMARY.md |
| 08-03(이 플랜, 전환 후, 더미 자격증명) | 2.50ms | `/lesson/1-1-course-orientation`, 판정 기준(20.80ms) 이내 통과 |

로컬 dev/prod 빌드 노이즈 범위 내 수치이지만 방향은 뚜렷하다 — 정적 전환 후 Supabase 조회가 서버 렌더 경로에서 완전히 빠졌다(쿠키 없는 로컬 측정이라 애초에 쿼리가 발생하지 않던 08-01 상태와 비교해도 개선). 실 배포 환경(CDN 엣지 캐시)에서의 최종 판단은 08-08이 담당한다.

## Decisions Made

- **D8-G/D8-H(계획에 이미 기록된 결정)를 그대로 실행** — 메모 읽기를 `/api/progress?lesson=`에 합치고, 메모장은 데이터 도착 후에만 마운트.
- **e2e-progress.mjs 신규 시나리오 태그 'f'·'g'를 계획 지시대로 그대로 사용** — 기존 코드에 `/unlock` 발급 흐름의 하위 시나리오 `g1~g5`가 이미 있어 사람이 로그를 훑을 때 시각적으로 겹쳐 보일 수 있지만(`g` vs `g1`~`g5`), 실제 로그 문자열은 다르고 계획이 명시한 태그를 그대로 따르는 것이 최소 변경 경로라고 판단했다. 기존 `g1~g5`를 다른 문자로 재번호하는 것은 이 플랜의 범위 밖(불필요한 리네이밍)이라 하지 않았다.
- **실 Supabase 자격 증명 부재를 더미 값 + curl/Playwright route mock으로 우회** — 08-01/02/04/05와 동일한 환경 제약(`.env.local` 권한 차단). locked/ready/note-ok/note-error 4가지 상태의 렌더링 분기는 mock으로 증명했지만, 완료 토글·메모 저장의 실 DB 왕복은 미확인 — coverage D2·D4·D7에 기록.

## Deviations from Plan

### Auto-fixed Issues

None - 계획대로 실행. (Task 순서·파일 목록·작업 내용 모두 계획과 일치)

### Process Notes (not Rule 1-4 deviations)

**1. 시나리오 태그 'g' 재사용에 대한 판단**
- **Found during:** Task 2
- **Issue:** 계획 Task 2(d)가 신규 완료 토글 클릭 시나리오에 태그 'g'를 지정했으나, `e2e-progress.mjs`에는 이미 `/unlock` 발급 흐름을 다루는 `g1~g5` 하위 시나리오가 존재한다.
- **Judgment:** 문자열 자체는 충돌하지 않고(`g` vs `g1` 등), 계획이 명시적으로 지정한 태그를 바꾸는 것은 사용자 승인 없는 임의 리네이밍이라 판단해 지시대로 'g'를 그대로 사용했다.
- **Files modified:** `scripts/e2e-progress.mjs`
- **Verification:** 로그 출력에서 두 태그가 별개 문자열로 정상 출력됨을 확인(node --check + 부분 실행으로 구조 확인).
- **Committed in:** `a71dbb1`

---

**Total deviations:** 0 code deviations, 1 process note (documented above)
**Impact on plan:** 코드는 계획과 완전히 일치한다.

## Issues Encountered

- **실 Supabase 자격 증명(`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`)과 `UNLOCK_SECRET`을 담은 `.env.local`이 이 워크트리에서 권한상 읽기/쓰기 모두 차단됐다** — 08-01/02/04/05와 동일한 환경 제약. `node --env-file=.env.local scripts/e2e-progress.mjs`·`scripts/e2e-lesson-note.mjs`·`scripts/check-supabase-note.mjs`를 계획이 요구한 그대로 실행할 수 없었다. 대신:
  - `npm run build`·`check-progress-gates.mjs`·`check-design-tokens.mjs`·`check-brand.mjs`·`check-route-rendering.mjs`·`e2e-mobile-overflow.mjs`(21/21)·`e2e-section-tape.mjs`(30/30)·`e2e-typography.mjs`·`e2e-perf-budget.mjs`는 더미 Supabase 자격 증명으로 정상 실행·통과했다(이 경로들은 Supabase 쿼리가 발생하지 않거나 실패 응답을 정상적으로 렌더하는 경로만 사용).
  - `e2e-progress.mjs`는 서버 기동 + 시나리오 i1(쿠키 없음)까지 통과 후 i2 준비 단계(첫 실 Supabase select)에서 네트워크 오류로 중단됐다.
  - `e2e-lesson-note.mjs`는 시작 시 메모 백업 조회(첫 실 Supabase 호출)에서 즉시 중단됐다.
  - 대신 curl 기반 원문 HTML 마커 카운트(잠금 쿠키 유무에 따른 `data-progress-ui`/`data-notepad` 0건 확인)와 Playwright route mock 스크립트(스크래치 디렉토리, 커밋하지 않음 — locked/ready/note-ok/note-error 4상태 렌더링 분기, 완료 상태·메모 initialBody 정확성)로 클라이언트 로직 자체는 구조적으로 검증했다.
  - 다음에 실 `.env.local`을 쓸 수 있는 환경(08-08 예정)에서 `e2e-progress.mjs`·`e2e-lesson-note.mjs`·`check-supabase-note.mjs` 전체 스위트를 한 번 더 돌려 재확인하는 것을 권장한다.
- **`node_modules`가 없는 fresh worktree였다** — `npm install`(532 패키지)로 복원했다. `.velite/lessons.json`은 첫 `npm run build`가 생성했다.

## User Setup Required

None - 이 플랜은 신규 npm 패키지를 설치하지 않았다(`git diff package.json` 무변경 확인). 다만 08-01/02/04/05가 남긴 것과 같은 권고대로, 다음에 실 `.env.local`을 쓸 수 있는 환경에서 `e2e-progress.mjs`·`e2e-lesson-note.mjs`·`check-supabase-note.mjs`를 재확인하는 것을 권장한다.

## Next Phase Readiness

- **08-06(커리큘럼 페이지 전환)**이 재사용할 표면이 이미 08-02에서 준비돼 있고, 이 플랜은 그 패턴을 두 번째로 검증했다 — `STATIC_SHELL_PAGES`에 `/curriculum` 경로만 추가하면 된다(G17에서 이미 제외됨).
- **08-08(최종 성능 비교)**을 위한 `/lesson/*` TTFB 숫자를 남겼다(6.50ms → 2.50ms, 로컬 측정) — 실 배포 환경에서 재측정 필요.
- **블로커:** 실 Supabase 자격 증명으로 `e2e-progress.mjs` 신규 시나리오(f·g)와 `e2e-lesson-note.mjs` 신규 시나리오(N)를 아직 확인하지 못했다 — 위 "User Setup Required" 참고. 코드 로직 자체는 mock 기반 검증과 정적 게이트로 뒷받침됐지만, 실 DB 왕복 확인이 남아 있다.
- `check-route-rendering.mjs`는 예상대로 `/curriculum` 하나만 남기고 통과 — 08-06이 이 마지막 잔여 항목을 닫는다.

---
*Phase: 08-performance-and-mobile*
*Completed: 2026-08-27*
