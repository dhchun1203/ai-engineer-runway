---
phase: 08-performance-and-mobile
plan: 07
subsystem: ui
tags: [css-animation, reduced-motion, tap-feedback, scroll-throttle, rAF, retry-ui]

# Dependency graph
requires:
  - phase: 08-05
    provides: "e2e-mobile-readability.mjs 375px 가독성 게이트 — 이 플랜의 tap-feedback 클래스 추가가 375px 터치 타깃/줄바꿈 계약을 회귀시키지 않는지 검증"
  - phase: 08-06
    provides: "완전 정적 /curriculum 셸 + step-card.tsx 'use client' 전환 — 이 플랜이 step-card.tsx에 revealIndex prop을 얹는 기반"
provides:
  - "section-tape.tsx의 유일한 스크롤 리스너에 rAF 스로틀 + 값-불변 시 리렌더 스킵 — G22 게이트가 재발을 상시 차단"
  - "globals.css .card-interactive/.tap-feedback 탭 피드백 레이어 — 사이트 전체 10개 누를 수 있는 표면이 공유하는 단일 :active 변형(translateY(1px) scale(0.98)), prefers-reduced-motion: reduce에서 전부 비활성화"
  - "progress-error.tsx onRetry prop — 진도 조회 실패를 페이지 새로고침 없이 재시도할 수 있는 경로, progress-slots.tsx 세 에러 분기 전부에 useProgress().refresh로 배선"
  - ".step-card-reveal CSS 전용 순차 등장(motion/react 미도입, D8-R) — curriculum 페이지 Step 카드 3장에만 적용, 0/80/160ms 지연"
affects: [08-08]

# Actuals (#2632)
actuals:
  tokens: 6300
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "rAF 스크롤 스로틀: 핸들 변수로 예약 여부를 가드하고, 콜백 안에서 핸들을 비워 다음 이벤트가 다시 예약할 수 있게 한다 — cleanup에서 cancelAnimationFrame으로 언마운트 후 콜백 실행을 막는다. section-tape.tsx가 이 저장소의 첫 사례"
    - "탭 피드백 단일 클래스 쌍(.card-interactive/.tap-feedback)이 같은 :active 변형을 공유 — 새 CSS 임의값 대신 클래스로 구현해 check-design-tokens.mjs의 대괄호 스캐너를 건드리지 않는다(D8-Q)"
    - "CSS 전용 순차 등장: --reveal-index 인라인 커스텀 프로퍼티 + animation-delay: calc(var(--reveal-index) * 80ms) — motion/react 없이 서버 컴포넌트에서도 동작하는 stagger"

key-files:
  created: []
  modified:
    - src/components/section-tape.tsx
    - scripts/check-progress-gates.mjs
    - src/app/globals.css
    - src/components/complete-button.tsx
    - src/components/theme-toggle.tsx
    - src/components/code-block.tsx
    - src/components/lesson-nav.tsx
    - src/components/site-nav.tsx
    - src/components/today-lesson-card.tsx
    - src/components/lesson-notepad.tsx
    - src/components/progress-summary.tsx
    - src/components/progress-error.tsx
    - src/components/progress-slots.tsx
    - src/components/step-card.tsx
    - src/app/curriculum/page.tsx

key-decisions:
  - "G22의 스크롤 리스너 단일성 검사를 window.addEventListener(\"scroll\", ...)로 좁혔다 — 계획 문구는 '스크롤 이벤트 리스너를 등록하는 파일'이라고만 했지만, 그대로 구현하면 lesson-notepad.tsx의 기존 visualViewport.addEventListener(\"scroll\", sync)(키보드 인셋 보정, 08-27 quick task)를 오탐한다. 그 리스너는 5.D가 우려하는 패턴(모든 스크롤 이벤트마다 getBoundingClientRect() 루프 후 무조건 리렌더)이 아니다 — visualViewport의 scroll 이벤트는 실제 스크롤 제스처가 아니라 뷰포트 크기 변화(키보드 열림 등) 때만 드물게 발생하고, sync()는 가벼운 산술만 한다. window 스크롤로 스캔 범위를 좁혀 이 정당한 기존 패턴을 오탐하지 않게 했다(Rule 1 — 게이트 오탐 버그)"
  - "progress-error.tsx의 텍스트를 <span>으로 감쌌다 — onRetry 유무에 따라 버튼을 조건부로 붙이려면 flex 컨테이너 안에서 텍스트와 버튼을 형제로 둬야 한다. onRetry가 없는 홈 경로는 버튼만 안 붙을 뿐 data-progress-ui=\"read-error\" 마커·문구·기존 className 골격은 그대로다 — 텍스트가 <span>으로 한 겹 더 감싸졌지만 textContent와 렌더된 문구는 완전히 동일하다(저장소 어떤 게이트·e2e도 이 요소의 자식 구조를 검사하지 않음, grep으로 확인)"
  - "D8-R(계획에 이미 기록된 결정) 그대로 실행 — Motion 라이브러리를 도입하지 않았다. 이 플랜이 필요로 한 움직임(눌림 변형·순차 등장) 전부 CSS transform/opacity + animation-delay cascade로 해결됐다"

patterns-established:
  - "탭 피드백 CSS 클래스 쌍 패턴: 카드/행은 .card-interactive에 이미 있던 hover 규칙 옆에 :active를 추가하고, 그 외 버튼·링크·토글은 .tap-feedback을 붙인다 — 두 클래스가 같은 변형값을 공유해 사이트 전체가 하나의 탭 감각을 낸다"
  - "onRetry 옵셔널 패턴: 정적 셸로 전환된 페이지의 클라이언트 fetch 에러는 useProgress().refresh를 그대로 재시도 콜백으로 넘기면 되고, 서버 렌더 페이지(에러 재시도 대상이 없음)는 prop을 생략해 기존 마크업을 그대로 유지한다"

requirements-completed: [SC5, SC4, UX-01, UX-02]

coverage:
  - id: D1
    description: "section-tape.tsx의 유일한 스크롤 리스너가 rAF로 배칭되고, currentIndex는 값이 실제로 바뀔 때만 갱신되며, G22가 이 계약을 상시 검사한다(가드 제거·저장소 전체 신규 미스로틀 리스너 둘 다 탐지)"
    requirement: "SC4"
    verification:
      - kind: other
        ref: "node scripts/check-progress-gates.mjs (G22 포함, all gates passed). 회귀 테스트: rAF 가드를 임시 제거 → G22 실패 확인 후 원복; src/components/ 아래 미스로틀 window scroll 리스너를 쓰는 더미 파일 임시 생성 → G22가 파일 경로를 지목하며 실패 확인 후 삭제"
        status: pass
      - kind: e2e
        ref: "node scripts/e2e-section-tape.mjs — 30/30건 통과(구간 판정 정확도 회귀 없음)"
        status: pass
    human_judgment: false
  - id: D2
    description: "scroll-margin-top 임계값 계산 블록(G-06-9 재발 방지 조항)이 git diff 상 무변경이다"
    requirement: "SC4"
    verification:
      - kind: other
        ref: "git diff src/components/section-tape.tsx — 116~133행(threshold 계산부) 완전 무변경, 변경은 그 아래 setCurrentIndex 호출과 handleScroll 정의부에만 있음"
        status: pass
    human_judgment: false
  - id: D3
    description: "node --env-file scripts/e2e-perf-budget.mjs의 프레임 예산 판정이 통과하고, 이번 실행의 초과 프레임 비율이 08-01 기준선보다 낮다"
    requirement: "SC4"
    verification:
      - kind: e2e
        ref: "e2e-perf-budget.mjs 실행 — 총 73프레임, 25ms 초과 2프레임, 비율 2.74% (08-01 기준선: 총 72프레임, 초과 2프레임, 2.78%) — 판정 대상 4건(TTFB×3 + 프레임 예산) 전부 통과"
        status: pass
    human_judgment: true
    rationale: "로컬 dev 머신 측정 노이즈 범위 안의 숫자다(초과 프레임 절대 개수는 2건으로 동일, 총 프레임 수 차이로 비율만 미세하게 개선). 실기기 확인은 08-08 담당."
  - id: D4
    description: "누를 수 있는 모든 표면(완료 버튼 2·테마 토글·복사 버튼·브레드크럼·페이저 2·내비 링크·오늘 카드 CTA·요약 CTA·메모장 토글·구간 셀)에 탭 피드백 클래스가 붙어 있고, :active 변형이 reduced-motion에서 꺼진다"
    requirement: "UX-01"
    verification:
      - kind: other
        ref: "grep -rn 'tap-feedback' src/components — 9개 파일(theme-toggle, code-block, lesson-nav ×2, site-nav, today-lesson-card, lesson-notepad, section-tape, complete-button ×2, progress-summary, progress-error)에서 클래스 적용 확인 + card-interactive 기존 5곳(step-card, today-lesson-card row, module-accordion, schedule-table)"
        status: pass
      - kind: e2e
        ref: "scratch Playwright 스크립트(커밋 안 됨) — theme-toggle 버튼을 reducedMotion:'reduce' 컨텍스트에서 누른 상태의 computed transform=none, no-preference 컨텍스트에서는 matrix(0.98, 0, 0, 0.98, 0, 1)(translateY(1px) scale(0.98)와 수학적으로 동일)"
        status: pass
    human_judgment: false
  - id: D5
    description: "node scripts/check-design-tokens.mjs가 0으로 종료한다 — Tailwind 임의값 대괄호를 하나도 새로 쓰지 않았다"
    requirement: "UX-01"
    verification:
      - kind: other
        ref: "node scripts/check-design-tokens.mjs → 위반 없음 — 35개 파일 검사 완료"
        status: pass
    human_judgment: false
  - id: D6
    description: "node --env-file scripts/e2e-mobile-readability.mjs·e2e-mobile-overflow.mjs·e2e-typography.mjs가 tap-feedback 추가로 인한 새 위반 없이 08-05/08-06 기준선과 동일한 수치를 낸다"
    requirement: "UX-01"
    verification:
      - kind: e2e
        ref: "e2e-mobile-readability.mjs 요약표가 08-05/08-06-SUMMARY.md의 최종 수치(예: /schedule M3=74·titleMaxLines=2, /lesson M2=9·M3=15, /about M2=11·M3=21)와 정확히 일치 — tap-feedback 클래스 추가가 새 leaf 텍스트 요소를 만들지 않아 회귀 0건. e2e-mobile-overflow.mjs 21/21 통과. e2e-typography.mjs 통과(97개 요소, 크기/굵기 허용 집합 밖 값 없음)"
        status: pass
    human_judgment: false
  - id: D7
    description: "진도 조회 실패 상태(data-progress-ui=\"read-error\")에 '다시 시도' 버튼이 나타나고, 누르면 /api/progress 요청이 한 번 더 발생해 ready 상태로 회복한다. 홈의 에러 표시는 버튼 없이 그대로다"
    requirement: "SC5"
    verification:
      - kind: e2e
        ref: "scratch Playwright 스크립트(route mock, 커밋 안 됨) — /curriculum에서 GET /api/progress를 2회 연속 실패(unlocked:true, ok:false)시켜 data-progress-state=\"error\" 도달 확인, [data-progress-ui=\"read-error\"] 안 button count=1, 클릭 후 3번째 요청 발생 + data-progress-state=\"ready\" 도달 확인. 홈(/) 경로는 onRetry 없이 렌더되어 버튼 미포함(코드 확인: progress-error.tsx의 조건부 렌더, home page.tsx는 <ProgressReadError />를 인자 없이 호출)"
        status: pass
    human_judgment: true
    rationale: "실 Supabase 자격 증명이 이 워크트리에서 접근 불가(.env.local 권한 차단) — e2e-progress.mjs/e2e-today.mjs의 관련 시나리오(i2 이후, t4 이후)는 알려진 환경 제약으로 미실행이다(WINDOWS.md #7/#8, 08-02~08-06과 동일). 위 route-mock 검증으로 코드 경로(onRetry 배선, refresh() 호출, 상태 전이)는 구조적으로 증명했으나 실 DB 왕복 확인은 08-08이 담당한다."
  - id: D8
    description: "커리큘럼 Step 카드 3장의 computed animation-delay가 각각 0ms/80ms/160ms이고, reducedMotion:'reduce'에서 animation-name이 none이며, 홈의 오늘 카드·일정표 행에는 순차 등장 클래스가 없다"
    requirement: "SC5"
    verification:
      - kind: e2e
        ref: "scratch Playwright 스크립트(커밋 안 됨) — no-preference 컨텍스트: animation-delay = ['0s', '0.08s', '0.16s']. reduce 컨텍스트: animation-name = ['none', 'none', 'none'] (3장 전부). 홈(/) 페이지의 .step-card-reveal count = 0"
        status: pass
    human_judgment: false
  - id: D9
    description: "git diff package.json이 비어 있다 — Motion을 포함해 새 npm 패키지를 0개 추가했다"
    requirement: "SC5"
    verification:
      - kind: other
        ref: "git diff package.json → 빈 출력 (Task 2·3 커밋 시점 모두 확인)"
        status: pass
    human_judgment: false

duration: 약 45분
completed: 2026-08-27
status: complete
---

# Phase 8 Plan 7: 인터랙션 레이어 — 탭 피드백 · 스크롤 스로틀 · 에러 회복 · 순차 등장 Summary

**`design-taste-frontend` 4.5/5.D/6절 부분 적용 — CSS 전용 탭 피드백 레이어(사이트 전체 10개 표면), `section-tape.tsx` 유일한 스크롤 리스너의 rAF 스로틀(+ G22 상시 게이트), 진도 조회 실패의 새로고침 없는 재시도, `/curriculum` Step 카드 3장의 절제된 순차 등장 — Motion 라이브러리 미도입**

## Performance

- **Duration:** 약 45분
- **Completed:** 2026-08-27 (UTC+9)
- **Tasks:** 3/3
- **Files modified:** 15

## Accomplishments

- **`section-tape.tsx` 스크롤 리스너 rAF 스로틀 + G22 상시 게이트 신설** — 이 저장소의 유일한 스크롤 리스너가 이제 프레임당 최대 1회만 `updateCurrent()`를 실행하고(예약된 프레임이 있으면 즉시 반환), `currentIndex`는 값이 실제로 바뀔 때만 갱신한다(함수형 `setState`로 리렌더 스킵). `scripts/check-progress-gates.mjs`에 G22를 추가해 (1) rAF 스로틀이 리스너 등록보다 먼저 정의되는지, (2) 저장소 전체에서 미스로틀 `window` 스크롤 리스너가 이 컴포넌트 하나뿐인지 상시 검사한다. `scroll-margin-top` 임계값 계산 블록(G-06-9 재발 방지 조항)은 한 글자도 바꾸지 않았다.
- **탭 피드백 CSS 레이어 신설** — `globals.css`에 `.card-interactive`/`.tap-feedback` 한 쌍을 추가해 `:active`에서 `translateY(1px) scale(0.98)`(100ms ease-out)를 낸다. Tailwind `active:` 임의값 유틸리티가 아니라 CSS 클래스로 구현해(D8-Q) `check-design-tokens.mjs`의 대괄호 스캐너를 건드리지 않는다. 사이트의 누를 수 있는 표면 10곳(완료 버튼 2·테마 토글·복사 버튼·브레드크럼·페이저 2·내비 링크·오늘 카드 CTA·요약 CTA·메모장 토글·구간 셀) 전부에 클래스를 붙였고, `.card-interactive`가 이미 붙어 있던 카드·행 5곳은 JSX 변경 없이 자동으로 탭 피드백을 얻었다. `prefers-reduced-motion: reduce`에서 트랜지션과 `:active` 변형 모두 비활성화된다.
- **진도 조회 실패 회복 수단** — `progress-error.tsx`에 optional `onRetry` prop을 추가해 "다시 시도" 버튼(기존 `complete-button.tsx` 스타일 그대로)을 조건부 렌더한다. `progress-slots.tsx`의 세 에러 분기(`ProgressErrorSlot`/`CompleteButtonSlot`/`ProgressSummarySlot`) 전부에서 `useProgress().refresh`를 `onRetry`로 배선했다. 홈(`/`, 동적 유지·서버 렌더)은 `onRetry` 없이 호출되므로 버튼 없는 기존 마크업을 그대로 유지한다.
- **`/curriculum` Step 카드 3장 순차 등장** — `globals.css`에 `opacity`/`transform`만 바꾸는 `@keyframes step-card-reveal`을 추가하고, `step-card.tsx`가 optional `revealIndex` prop을 받아 `--reveal-index` 인라인 커스텀 프로퍼티로 `animation-delay: calc(var(--reveal-index) * 80ms)`를 낸다(0/80/160ms). `curriculum/page.tsx`가 `steps.map`의 인덱스를 넘긴다. 홈의 오늘 카드·일정표 행에는 적용하지 않았다 — 35행짜리 목록에 걸면 마지막 행이 2.8초 뒤에 나타난다.
- **Motion 라이브러리 미도입 확인** — `git diff package.json`이 Task 2·3 커밋 시점 모두 빈 출력. D8-R의 재론 조건(스크롤 연동 물리·라우트 간 공유 요소 전환이 실제로 필요해지면 그때 도입)이 이 페이즈에서 발견되지 않았다.

## Task Commits

Each task was committed atomically:

1. **Task 1: 스크롤 리스너 스로틀 + 5.D 금지 패턴 상시 게이트(G22) 신설** - `ef0d1dd` (feat)
2. **Task 2: 탭 피드백 레이어 — CSS 클래스 2종 + 누를 수 있는 모든 표면에 적용** - `8c0d7fb` (feat)
3. **Task 3: 에러 상태 회복 수단 + Step 카드 순차 등장(CSS 전용)** - `be6e6ea` (feat)

## Files Created/Modified

- `src/components/section-tape.tsx` - 스크롤 핸들러 rAF 스로틀, `setCurrentIndex` 값-불변 시 스킵, cleanup의 `cancelAnimationFrame`, `.tap-feedback` 클래스 추가
- `scripts/check-progress-gates.mjs` - G22 신설(rAF 스로틀 구조 계약 + 저장소 전체 미스로틀 window 스크롤 리스너 단일성)
- `src/app/globals.css` - `.card-interactive`/`.tap-feedback` 탭 피드백 규칙 + reduced-motion 오버라이드, `.step-card-reveal` 키프레임 + reduced-motion 오버라이드
- `src/components/complete-button.tsx` - 완료 토글·다시 시도 버튼에 `.tap-feedback`
- `src/components/theme-toggle.tsx` - 토글 버튼에 `.tap-feedback`
- `src/components/code-block.tsx` - 복사 버튼에 `.tap-feedback`
- `src/components/lesson-nav.tsx` - 브레드크럼 링크 2개·페이저 Link에 `.tap-feedback`
- `src/components/site-nav.tsx` - 내비 링크에 `.tap-feedback`
- `src/components/today-lesson-card.tsx` - CTA_CLASS에 `.tap-feedback`
- `src/components/lesson-notepad.tsx` - 시트 토글 버튼에 `.tap-feedback`
- `src/components/progress-summary.tsx` - CTA 링크에 `.tap-feedback`
- `src/components/progress-error.tsx` - optional `onRetry` prop + "다시 시도" 버튼
- `src/components/progress-slots.tsx` - 세 에러 분기에 `refresh`를 `onRetry`로 배선
- `src/components/step-card.tsx` - optional `revealIndex` prop + `.step-card-reveal` + `--reveal-index` 인라인 스타일
- `src/app/curriculum/page.tsx` - `steps.map` 인덱스를 `revealIndex`로 전달

## 프레임 예산 비율 전후 (08-01 기준선 대비)

| 시점 | 총 프레임 | 25ms 초과 | 비율 |
|---|---|---|---|
| 08-01 기준선(스로틀 전) | 72 | 2 | 2.78% |
| 08-07(이 플랜, rAF 스로틀 후) | 73 | 2 | **2.74%** |

초과 프레임의 절대 개수는 2건으로 동일하지만(로컬 환경에서는 08-01 시점에도 이미 여유가 있었다), 비율은 소폭 개선됐다. 판정 대상 4건(TTFB 3종 + 프레임 예산) 전부 통과.

## 탭 피드백이 붙은 표면 전체 목록

| 표면 | 파일 | 클래스 |
|---|---|---|
| 완료 토글 버튼 | complete-button.tsx | `.tap-feedback` |
| 완료 실패 다시 시도 버튼 | complete-button.tsx | `.tap-feedback` |
| 테마 토글 버튼 | theme-toggle.tsx | `.tap-feedback` |
| 코드 복사 버튼 | code-block.tsx | `.tap-feedback` |
| 브레드크럼 링크(Step N / 모듈명) | lesson-nav.tsx | `.tap-feedback` |
| 레슨 페이저(이전/다음) | lesson-nav.tsx | `.tap-feedback` |
| 사이트 내비 링크 | site-nav.tsx | `.tap-feedback` |
| 오늘 카드 CTA | today-lesson-card.tsx | `.tap-feedback` |
| 전체 진행률 요약 CTA | progress-summary.tsx | `.tap-feedback` |
| 메모장 시트 토글 | lesson-notepad.tsx | `.tap-feedback` |
| 구간 테이프 셀 | section-tape.tsx | `.tap-feedback` |
| 진도 조회 실패 다시 시도 버튼(신규, Task 3) | progress-error.tsx | `.tap-feedback` |
| StepCard / TodayLessonCard(2곳) / ModuleAccordion 레슨 행 / ScheduleTable 행 | (기존 5곳) | `.card-interactive`(이미 부착돼 있던 클래스에 :active 규칙만 추가) |

## 버튼 대비 확인 표 (WCAG AA 본문 4.5:1)

이 페이즈가 추가·이전한 문구(잠금 안내, 다시 시도, 스켈레톤 자리)의 텍스트 대비를 확인했다. 새 색 토큰은 만들지 않았으므로 기존 토큰 조합만 계산했다.

| 텍스트 | 배경 | 라이트 대비 | 다크 대비 | 판정 |
|---|---|---|---|---|
| 잠금 안내 문구(`text-badge-neutral-text`) | 페이지 배경(`--color-background`) | 4.55:1 | 7.30:1(`text-badge-neutral-text-dark`) | 통과(라이트는 AA 임계값에 근접하지만 초과) |
| "다시 시도" 버튼 텍스트(기본 전경색 상속) | 페이지 배경 | 17.1:1 | 17.1:1 | 통과(여유 큼) |
| 스켈레톤 자리(BadgeSkeleton 등) | — | 텍스트 없음, 펄스 박스만 | — | 해당 없음 |

라이트 모드 잠금 안내 문구(4.55:1)는 AA 임계값(4.5:1)을 근소하게 넘는다 — 이 조합은 이 플랜이 새로 만든 것이 아니라 08-03이 이미 쓰던 `text-badge-neutral-text` on 배경 조합을 그대로 재사용한 것이다.

## 순차 등장 적용 범위와 제외 이유

- **적용:** `/curriculum` Step 카드 3장만 — `animation-delay` 최대 160ms(3번째 카드)로 첫 화면 인지 지연이 거의 없다.
- **제외:** 홈의 오늘 카드, 일정표(`/schedule`) 행. 일정표는 35행짜리 목록이라 80ms 간격으로 걸면 마지막 행이 2.8초 뒤에야 나타난다 — 이 페이즈의 성능·가독성 목표와 상충한다.

## D8-R Motion 재론 조건 (계획 원문 그대로)

> **재론 조건:** 스크롤 연동 물리(scrub)나 라우트 간 공유 요소 전환이 실제로 필요해지면 그때 이유와 함께 도입한다. 5.A(sticky-stack)·5.B(horizontal-pan)는 스킬이 GSAP+ScrollTrigger를 전제하고 학습 대시보드의 콘텐츠 탐색을 방해하므로 적용 대상에서 제외한다.

이 페이즈(Task 1~3) 실행 중 위 재론 조건에 해당하는 지점은 발견되지 않았다 — 필요했던 움직임(눌림 변형·순차 등장) 전부 CSS `transform`/`opacity` + `animation-delay` cascade로 해결됐다.

## Decisions Made

- **G22의 스크롤 리스너 단일성 검사를 `window.addEventListener("scroll", ...)`로 좁혔다** — 계획 문구를 그대로 구현하면 `lesson-notepad.tsx`의 기존 `visualViewport.addEventListener("scroll", sync)`(키보드 인셋 보정, 08-27 quick task)를 오탐한다. 그 리스너는 5.D가 우려하는 패턴이 아니다(실제 스크롤 제스처가 아니라 뷰포트 크기 변화에만 드물게 발생, 가벼운 산술만 수행). `window` 스크롤로 스캔 범위를 좁혀 이 정당한 기존 패턴을 오탐하지 않게 했다.
- **`progress-error.tsx`의 텍스트를 `<span>`으로 감쌌다** — `onRetry` 유무에 따라 버튼을 조건부로 붙이려면 flex 컨테이너 안에서 텍스트와 버튼을 형제로 둬야 한다. 텍스트 자체(`textContent`)와 렌더된 문구, `data-progress-ui="read-error"` 마커는 완전히 동일하게 유지했다 — 이 요소의 자식 DOM 구조를 검사하는 게이트·e2e는 저장소에 없음을 grep으로 확인했다.
- **D8-R(계획에 이미 기록된 결정)을 그대로 실행** — Motion 라이브러리를 도입하지 않았다.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] G22 초안이 lesson-notepad.tsx의 정당한 visualViewport 스크롤 리스너를 오탐**
- **Found during:** Task 1 (G22 신설 직후 `check-progress-gates.mjs` 실행 중)
- **Issue:** 계획 문구대로 저장소 전체 `addEventListener("scroll", ...)`를 무차별 스캔하도록 구현하자, `lesson-notepad.tsx`가 이미 쓰고 있던 `visualViewport.addEventListener("scroll", sync)`(08-27 quick task, 아이패드 키보드 인셋 보정)가 위반으로 잡혔다.
- **Fix:** 스캔 정규식을 `window.addEventListener("scroll", ...)`로 좁혔다 — 5.D가 우려하는 패턴(main-thread 리플로우를 유발하는 window 스크롤 리스너)만 대상으로 하고, 뷰포트 크기 변화에만 드물게 발생하는 visualViewport 스크롤은 범위 밖으로 뒀다.
- **Files modified:** `scripts/check-progress-gates.mjs`
- **Verification:** 좁힌 정규식으로 `node scripts/check-progress-gates.mjs` 재실행 → all gates passed. 회귀 테스트(더미 미스로틀 window 스크롤 리스너 파일 임시 생성 → G22 실패 확인 후 삭제)로 탐지력이 여전히 유효함을 확인.
- **Committed in:** `ef0d1dd` (Task 1 commit — 오탐 버전은 커밋 전에 발견·수정되어 히스토리에 남지 않음)

---

**Total deviations:** 1 auto-fixed (Rule 1 - 게이트 오탐 버그, 커밋 전 자체 검증 과정에서 발견·수정)
**Impact on plan:** 코드는 계획이 요구한 목표(탭 피드백, 스크롤 스로틀 + 상시 게이트, 에러 회복, 절제된 순차 등장)를 정확히 달성했다. 오탐은 커밋되지 않고 검증 단계에서 잡혀 히스토리를 오염시키지 않았다.

## Issues Encountered

- **이 워크트리에 `.env.local`이 없고 `.env*` 파일은 권한상 읽기/쓰기가 모두 차단되어 있었다** — 08-01~08-06과 동일한 환경 제약. `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`UNLOCK_SECRET`을 더미 값으로 export해 `next build`/`next dev`/`e2e-*.mjs`를 실행했다.
  - `node scripts/check-progress-gates.mjs`(G22 포함)·`check-design-tokens.mjs`·`check-brand.mjs`·`check-route-rendering.mjs`·`e2e-section-tape.mjs`(30/30)·`e2e-perf-budget.mjs`(판정 대상 4건 전부 통과)·`e2e-typography.mjs`·`e2e-mobile-overflow.mjs`(21/21)는 더미 자격 증명으로 정상 실행·통과했다.
  - `e2e-mobile-readability.mjs`는 08-05/08-06이 이미 기록한 잔여 위반(날짜·소요시간 배지, 내비게이션, MDX 프로즈 — 이 플랜의 파일 범위 밖)으로 계속 실패한다. 요약표의 모든 라우트×뷰포트 수치가 08-05/08-06 기준선과 정확히 일치 — 이 플랜의 tap-feedback 클래스 추가가 회귀를 일으키지 않았다(새 leaf 텍스트 요소를 만들지 않음).
  - `e2e-progress.mjs`는 i1까지 통과 후 i2 준비(첫 실 Supabase select)에서, `e2e-today.mjs`는 t1~t3까지 통과 후 t4(진도 조회 실패로 인한 error 상태)에서, `e2e-lesson-note.mjs`는 시작 시 메모 백업 조회(첫 실 Supabase 호출)에서 각각 중단됐다 — 08-02/08-03/08-06과 같은 성격의 환경 제약(WINDOWS.md #7/#8/#9). 대신 route-mock 기반 scratch Playwright 스크립트(커밋 안 됨)로 진도 조회 실패 재시도 흐름(2회 실패 → 재시도 클릭 → 3번째 요청 → ready 회복)과 Step 카드 순차 등장(animation-delay 0s/0.08s/0.16s, reduce에서 none)을 실측 검증했다.
  - `node_modules`가 없는 fresh worktree였다 — `npm install`(532 패키지)과 `npx playwright install chromium`(추가 다운로드 없음)으로 복원했다. `.velite/lessons.json`은 첫 `npm run build`가 생성했다.
  - Playwright/next dev 스크래치 스크립트 실행 중 Windows `taskkill`로 서버 프로세스 트리를 정리하지 않으면(단순 `child.kill()`만으로는 shell:true로 spawn된 자식이 남는다) 다음 실행에서 포트 충돌이 발생했다 — 기존 e2e 게이트들의 `killServerTree(taskkill /T /F)` 패턴을 재사용해 해결했다.

## User Setup Required

None - 이 플랜은 신규 npm 패키지를 설치하지 않았다(`git diff package.json` 무변경 확인, Task 2·3 커밋 시점 모두). 다만 08-01~08-06이 남긴 것과 같은 권고대로, 다음에 실 `.env.local`을 쓸 수 있는 환경에서 `e2e-progress.mjs`·`e2e-today.mjs`·`e2e-lesson-note.mjs` 전체 스위트를 재확인하는 것을 권장한다 — 08-08이 이 재확인을 담당한다.

## Next Phase Readiness

- SC5(인터랙션 레이어)가 요구한 세 가지(탭 피드백, 에러 회복, 절제된 순차 등장)가 전부 구현됐고, 6절 가드레일(transform/opacity만 애니메이트, reduced-motion에서 전부 정지, 스크롤 rAF 배칭, 새 npm 패키지 0개)을 전부 지켰다.
- 08-01이 세운 프레임 예산 판정이 이 플랜 이후에도 통과하며, 초과 프레임 비율이 기준선 대비 소폭 개선됐다.
- **08-08(최종 그린라이트 세션)이 참고할 항목:** 실 Supabase 자격 증명으로 `e2e-progress.mjs`(전체)·`e2e-today.mjs`(전체)·`e2e-lesson-note.mjs`(전체)를 재확인할 것 — 이 플랜의 route-mock 검증은 코드 경로를 구조적으로 증명했지만 실 DB 왕복은 미확인이다. 또한 아이패드 실기기에서 탭 피드백이 실제로 "눌리는 감각"을 주는지, 순차 등장이 자연스러운지 육안 확인이 필요하다(계획의 backstop 항목).
- **블로커:** 없음. 실 Supabase 자격 증명 재확인은 이 플랜 고유의 블로커가 아니라 08-01부터 이어진 워크트리 환경 제약이다(WINDOWS.md #7/#8/#9).

---
*Phase: 08-performance-and-mobile*
*Completed: 2026-08-27*

## Self-Check: PASSED

- FOUND: src/components/section-tape.tsx
- FOUND: scripts/check-progress-gates.mjs
- FOUND: src/app/globals.css
- FOUND: src/components/complete-button.tsx
- FOUND: src/components/theme-toggle.tsx
- FOUND: src/components/code-block.tsx
- FOUND: src/components/lesson-nav.tsx
- FOUND: src/components/site-nav.tsx
- FOUND: src/components/today-lesson-card.tsx
- FOUND: src/components/lesson-notepad.tsx
- FOUND: src/components/progress-summary.tsx
- FOUND: src/components/progress-error.tsx
- FOUND: src/components/progress-slots.tsx
- FOUND: src/components/step-card.tsx
- FOUND: src/app/curriculum/page.tsx
- FOUND: commit ef0d1dd
- FOUND: commit 8c0d7fb
- FOUND: commit be6e6ea
- FOUND: commit ea2ff0d
