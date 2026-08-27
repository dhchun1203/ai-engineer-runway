---
phase: quick-260827-g6u
plan: 01
subsystem: ui
tags: [navigation, responsive, tailwind-v4, accessibility, mobile]

requires:
  - phase: 08-performance-and-mobile
    provides: ".tap-feedback / .card-interactive press-feedback CSS classes, prefers-reduced-motion convention (globals.css), sm:contents display-tree-collapse pattern (schedule-table.tsx, 08-05)"
provides:
  - "site-nav.tsx 640px 미만 햄버거 토글 + 접히는 패널 — 640px 이상은 기존 flex-wrap 동작 픽셀 단위로 그대로 유지"
  - ".nav-panel-reveal 진입 애니메이션 (globals.css) — opacity+transform만, prefers-reduced-motion에서 무효화"
  - "260827-g6u-GATE-BASELINE.md — 변경 전/후 e2e-mobile-readability·e2e-mobile-overflow 게이트 실측값과 델타 감사 기록"
  - "06-UI-SPEC.md Nav Shell Contract 375px 계약 개정 표기"
affects: [site-nav, ui-spec, mobile-readability-gate]

actuals:
  tokens: 4768
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "isActiveHref(pathname, href) 순수 함수로 데스크톱 행과 접이식 패널이 같은 활성 판정을 공유 — 두 렌더 경로가 서로 어긋나는 것을 구조적으로 차단"
    - "sm:contents 래퍼로 640px 이상에서 신규 DOM 요소를 박스 트리에서 제거해 nav의 직계 자식 구성을 변경 전과 동일하게 유지(08-05 schedule-table.tsx 패턴의 두 번째 적용)"
    - "hidden → sm:flex 전환으로 게이트의 isHidden(offsetParent===null) 판정에 자연히 걸리게 해, 별도 게이트 예외 없이 375px 측정 대상에서 숨겨진 항목을 제외"

key-files:
  created:
    - .planning/quick/260827-g6u-phone-hamburger-nav-640px/260827-g6u-GATE-BASELINE.md
  modified:
    - src/components/site-nav.tsx
    - src/app/globals.css
    - .planning/phases/06-site-wide-design-polish/06-UI-SPEC.md

key-decisions:
  - "Task 2(tracer)의 인터랙티브 체크포인트를 자동 진행 — human_verify_mode가 end-of-phase이고 Task 3의 <human-check>가 명시적으로 '차단 체크포인트가 아니라 결과 보고에 포함'이라고 규정해, 자동화된 <verify>(build+게이트 4종+eslint+계약 grep)가 전부 통과한 시점에 Task 3의 브라우저 실측으로 넘어감"
  - "데스크톱 행과 패널 JSX를 공유 컴포넌트로 통합하지 않음(계획 지시) — 판정 로직만 isActiveHref()로 공유하고 마크업은 각자 유지해 640px 이상 픽셀 동일성이 리팩터로 흔들릴 위험을 원천 차단"

patterns-established:
  - "폭 임계값 계약 변경 시 변경 전/후 게이트 수치를 GATE-BASELINE.md류 문서로 나란히 고정하는 절차 — '위반 0'이 아니라 '기여분만큼 델타'가 성공 기준일 때 감사 가능성을 보장"

requirements-completed: [UX-01, UX-02]

coverage:
  - id: D1
    description: "375px 판정 라우트 6곳 전부에서 헤더가 한 줄이고, 내비 4항목이 햄버거 뒤로 접혀 초기 로드 시 DOM에서 측정 대상 밖(hidden)이다"
    requirement: "UX-02"
    verification:
      - kind: e2e
        ref: "scripts/e2e-mobile-readability.mjs (375px M3: 126→120, 라우트당 -1, '오늘의 학습' 링크)"
        status: pass
      - kind: e2e
        ref: "temp Playwright script (not committed) — 375px 초기 로드: btnCount=1, aria-expanded=false, #site-nav-panel count=0, nav <a> isVisible=false"
        status: pass
    human_judgment: false
  - id: D2
    description: "햄버거는 진짜 <button>이며 44x44 이상, aria-expanded/aria-controls/aria-label을 갖추고 상태와 항상 일치한다"
    requirement: "UX-02"
    verification:
      - kind: e2e
        ref: "temp Playwright script — btnBox width=44 height=44; toggle 전 aria-expanded=false, toggle 후 true"
        status: pass
    human_judgment: false
  - id: D3
    description: "패널 안 링크를 누르면 이동과 동시에 패널이 닫힌다"
    requirement: "UX-02"
    verification:
      - kind: e2e
        ref: "temp Playwright script — '커리큘럼' 링크 클릭 후 url=/curriculum, #site-nav-panel count=0, aria-expanded=false"
        status: pass
    human_judgment: false
  - id: D4
    description: "640px 이상(768/1024)에서 이 작업 전과 화면이 완전히 동일하다 — 햄버거·패널 모두 렌더되지 않고 내비 4항목이 한 줄에 보인다"
    requirement: "UX-01"
    verification:
      - kind: e2e
        ref: "scripts/e2e-mobile-readability.mjs (768/1024 관측 12행 + scheduleTitleMaxLines, before/after 완전 동일)"
        status: pass
      - kind: e2e
        ref: "temp Playwright script — 768/1024px: hamburgerVisibleCount=0, panelCount=0, 4개 링크 동일선상(y=8, height=44)"
        status: pass
    human_judgment: false
  - id: D5
    description: "prefers-reduced-motion: reduce 환경에서 패널 열림 애니메이션이 완전히 꺼진다"
    requirement: "UX-02"
    verification:
      - kind: e2e
        ref: "temp Playwright script — reducedMotion:'reduce' 컨텍스트에서 패널 open 후 computed animation-name = 'none'"
        status: pass
    human_judgment: false
  - id: D6
    description: "새 npm 패키지 0개, 새 Tailwind 임의값 대괄호 0개 — 기존 tap-feedback/lucide-react만 재사용"
    requirement: "UX-02"
    verification:
      - kind: other
        ref: "git diff package.json (empty), node scripts/check-design-tokens.mjs (exit 0)"
        status: pass
    human_judgment: false
  - id: D7
    description: "정적 프리렌더 대상 라우트(/curriculum, /step/*, /lesson/*)가 여전히 완전 정적이다"
    requirement: "UX-02"
    verification:
      - kind: other
        ref: "npm run build (SSG 마크 ● 유지), scripts/check-route-rendering.mjs"
        status: pass
    human_judgment: false
  - id: D8
    description: "실제 아이폰 Safari에서 헤더가 한 줄이고 화면 위쪽 1/4을 먹지 않으며, 엄지로 햄버거를 눌러도 빗나가지 않는다"
    requirement: "UX-02"
    verification: []
    human_judgment: true
    rationale: "헤드리스 Chromium 375px 뷰포트 실측(터치 타깃 44px, 레이아웃 겹침 없음)과 실제 iOS Safari의 렌더링·엄지 조작감은 다른 문제 — human_verify_mode=end-of-phase 정책에 따라 이 SUMMARY의 보고 항목으로 남기고 차단 체크포인트로 만들지 않았다."

duration: 약 20분
completed: 2026-08-27
status: complete
---

# Quick Task 260827-g6u Summary

**640px 미만에서 내비 4항목을 햄버거+접이식 패널로 전환, 640px 이상은 게이트 실측으로
픽셀 동일성을 증명 — 375px M3 위반 126→120(−6), 768/1024 관측 12행 완전 동일**

## Performance

- **Duration:** 약 20분 (플랜 커밋 11:48:20 KST → 마지막 태스크 커밋 11:56:38 KST, 이후
  STATE.md/최종 커밋 마무리 시간 별도)
- **Started:** 2026-08-27T02:48:20Z
- **Completed:** 2026-08-27T02:56:38Z
- **Tasks:** 3 (전부 완료)
- **Files modified:** 4 (1 created — GATE-BASELINE.md, 3 modified — site-nav.tsx, globals.css, 06-UI-SPEC.md)

## Accomplishments

- 아이폰(375px)에서 헤더가 3줄까지 늘어나 화면 위쪽을 잠식하던 문제를 없앴다 — 내비 4항목이
  640px 미만에서 햄버거 뒤로 접히고, 640px 이상에서는 기존 `flex-wrap` 동작을 한 글자도
  바꾸지 않았다.
- 햄버거 버튼은 `theme-toggle.tsx`를 본보기 삼아 만들었다(44×44 터치 타깃, `tap-feedback`
  재사용, `aria-expanded`/`aria-controls`/`aria-label` 상태 동기화).
- 패널 안 링크를 누르면 이동과 동시에 패널이 자동으로 닫힌다.
- 데스크톱 행과 패널이 `isActiveHref()` 순수 함수로 활성 판정을 공유해, 두 렌더 경로가
  나중에 어긋나는 것을 구조적으로 막았다.
- `.nav-panel-reveal` 진입 애니메이션(opacity+transform만)을 08-07이 세운
  `prefers-reduced-motion` 관례 그대로 추가했다.
- 새 npm 패키지 0개(기존 `lucide-react`의 `Menu`/`X`만 사용), 새 Tailwind 임의값
  대괄호 0개.
- 변경 전/후 `e2e-mobile-readability`·`e2e-mobile-overflow` 게이트 수치를
  `260827-g6u-GATE-BASELINE.md`에 나란히 기록해 델타 주장을 감사 가능하게 만들었다:
  375px M3가 판정 라우트 6곳 전부에서 정확히 1건씩(총 −6, 126→120, 총 위반 146→140)
  줄었고, 그 델타 전부가 헤더의 "오늘의 학습" 링크였다. 768px·1024px 관측 12행과
  `scheduleTitleMaxLines`는 기준선과 완전히 동일 — 아이패드 픽셀 동일성이 유지됐다.
  overflow 게이트는 21/21 그대로다.
- 브라우저 실측(임시 Playwright 스크립트, 커밋하지 않음) 6항목 전부 기대대로 —
  초기 접힘, 탭 열림/닫힘, 링크 클릭 시 자동 닫힘, 44px 터치 타깃, reduced-motion
  무효화, 640px 이상 렌더 부재.
- `06-UI-SPEC.md` Nav Shell Contract의 375px 계약 행에 이번 변경을 개정 표기로
  남겼다(다른 행·절은 손대지 않음).

## Task Commits

Each task was committed atomically:

1. **Task 1: 변경 전 게이트 실측값 고정** - `abfd2a9` (docs)
2. **Task 2: 640px 미만 햄버거 토글 + 접히는 패널** - `99ee783` (feat)
3. **Task 3: 게이트 델타 검증** - `eb1357b` (docs)

**Plan metadata:** (committed separately — see final commit in git log)

## Files Created/Modified

- `src/components/site-nav.tsx` - 640px 미만 햄버거+패널 분기 추가, 640px 이상 마크업 불변
- `src/app/globals.css` - `.nav-panel-reveal` 진입 애니메이션 + reduced-motion 무효화
- `.planning/quick/260827-g6u-phone-hamburger-nav-640px/260827-g6u-GATE-BASELINE.md` - 변경 전/후 게이트 실측값과 델타 감사 기록 (신규)
- `.planning/phases/06-site-wide-design-polish/06-UI-SPEC.md` - Nav Shell Contract 375px 행 개정 표기

## Decisions Made

- Task 2(tracer)의 인터랙티브 체크포인트를 자동으로 통과시켰다 — `human_verify_mode:
  "end-of-phase"`이고 Task 3의 `<human-check>`가 명시적으로 "차단 체크포인트가 아니라
  결과 보고에 포함"한다고 규정했기 때문에, 자동화된 `<verify>`(build + 정적 게이트
  4종 + eslint + 계약 grep 2종)가 전부 통과한 뒤 곧바로 Task 3의 게이트 델타·브라우저
  실측으로 진행했다.
- 데스크톱 행과 패널 JSX를 공유 컴포넌트로 통합하지 않았다(계획이 명시적으로 금지) —
  판정 로직(`isActiveHref`)만 공유하고 마크업은 각자 유지해, 리팩터가 640px 이상
  픽셀 동일성을 흔들 위험을 원천 차단했다.
- 이 실행은 오케스트레이터 지시에 따라 격리 워크트리가 아니라 main 워킹트리(브랜치
  `master`)에서 진행했다 — `.env.local`을 읽어야 하는 게이트 델타 측정이 이 작업의
  핵심 성공 기준이고, 격리 워크트리에서는 `.env.local`이 권한상 차단되는 환경 문제가
  `.planning/WINDOWS.md` #6/#7/#8에 이미 기록돼 있었기 때문이다. Task 1·3 모두 계획의
  더미 env 우회 없이 실제 `.env.local`로 실행했다.

## Deviations from Plan

None - plan executed exactly as written. 계획이 예측한 델타(라우트당 M3 −1, 총 −6,
768/1024 완전 동일)가 실측과 정확히 일치했다.

## Issues Encountered

- 임시 Playwright 검증 스크립트를 스크래치패드 경로에서 처음 실행했을 때
  `ERR_MODULE_NOT_FOUND: @playwright/test` — Node ESM이 스크립트 위치 기준으로
  `node_modules`를 찾기 때문에 저장소 바깥 경로에서는 해석되지 않았다. 스크립트를
  저장소 `scripts/` 아래로 임시 복사해 실행한 뒤 검증이 끝나자마자 삭제했다
  (커밋하지 않음, `git status`로 잔여물 없음을 확인).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 이 quick task는 독립 완결 작업이며 다음 phase를 막지 않는다.
- 아이폰 실기기(Safari) 확인은 위 coverage D8에 human_judgment로 남겨 뒀다 — 헤드리스
  Chromium 실측(레이아웃·터치 타깃 수치)은 이미 통과했으나, 실제 엄지 조작감과 iOS
  Safari 렌더링은 사용자가 실제 기기로 확인해야 한다. 확인 방법: 배포된 프로덕션
  URL(또는 `npm run dev` 후 같은 네트워크의 아이폰 Safari)에서 홈(`/`)을 열어 (1)
  헤더가 한 줄인지, (2) 햄버거를 엄지로 눌렀을 때 정확히 반응하는지, (3) 패널에서
  "커리큘럼"을 누르면 이동과 동시에 패널이 닫히는지, (4) 아이패드에서 헤더가 이전과
  똑같아 보이는지 확인.

---
*Phase: quick-260827-g6u*
*Completed: 2026-08-27*

## Self-Check: PASSED

- FOUND: `260827-g6u-GATE-BASELINE.md`
- FOUND: `260827-g6u-SUMMARY.md`
- FOUND: `src/components/site-nav.tsx`
- FOUND: `src/app/globals.css`
- FOUND: `.planning/phases/06-site-wide-design-polish/06-UI-SPEC.md`
- FOUND commit: `abfd2a9` (Task 1)
- FOUND commit: `99ee783` (Task 2)
- FOUND commit: `eb1357b` (Task 3)
