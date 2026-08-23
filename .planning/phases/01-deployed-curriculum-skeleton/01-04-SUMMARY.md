---
phase: 01-deployed-curriculum-skeleton
plan: 04
subsystem: ui
tags: [nextjs-app-router, tailwind-v4, static-generation, curriculum-navigation, accordion]

# Dependency graph
requires:
  - phase: 01-deployed-curriculum-skeleton (Plan 03)
    provides: "src/content/modules.ts(steps/modules), src/content/curriculum-helpers.ts(getStep/getModulesByStep/getLessonsByModule/getOrderedLessons/getLessonBySlug/getAdjacentLessons/getLessonCounts), 35행 확정 매니페스트"
provides:
  - "홈 대시보드(Step 카드 3장 드릴다운 진입점, 0% 진행률 슬롯 실컴포넌트) — src/app/page.tsx"
  - "Step 페이지(19개 모듈 아코디언 + 레슨 목록, generateStaticParams 3개) — src/app/step/[stepId]/page.tsx"
  - "레슨 페이지 확장(35 정적 경로, 브레드크럼, 이전/다음 페이저, 준비 중 상태) — src/app/lesson/[lessonId]/page.tsx"
  - "not-found 페이지(에러 상태 카피 + 커리큘럼 홈 CTA) — src/app/not-found.tsx"
  - "공용 표현 컴포넌트 5종: DepthBadge, EstimatedTime, StepCard, ModuleAccordion, LessonBreadcrumb/LessonPager"
affects: ["01-05", "01-06"]

actuals:
  tokens: 5182
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Step별 색 클래스는 stepId를 키로 하는 Record<StepId, string> 리터럴 맵으로 고정 — Tailwind JIT이 리터럴 클래스명만 스캔하므로 `bg-step-${stepId}` 같은 동적 조합 문자열을 쓰지 않는다"
    - "네이티브 <details>/<summary> 기반 아코디언 + Tailwind group-open: 변형으로 셰브론 회전 — Radix/헤드리스 UI 라이브러리 미도입(UI-SPEC 결정 그대로 유지)"
    - "레슨 페이저 비활성 상태는 링크가 아닌 <span aria-disabled> + data-pager-disabled 속성으로 렌더 — 숨기지 않고 항상 두 버튼 자리를 유지해 레이아웃이 흔들리지 않음"
    - "레슨 본문 유무(hasContent)로 MDXContent 렌더와 UI-SPEC 고정 empty-state 카피 렌더를 분기 — 본문 없는 34개도 실제 정적 라우트로 존재(404 아님)"

key-files:
  created:
    - src/components/depth-badge.tsx
    - src/components/estimated-time.tsx
    - src/components/step-card.tsx
    - src/components/module-accordion.tsx
    - src/components/lesson-nav.tsx
    - src/app/step/[stepId]/page.tsx
    - src/app/not-found.tsx
  modified:
    - src/app/page.tsx
    - src/app/lesson/[lessonId]/page.tsx

key-decisions:
  - "레슨 목록 항목의 링크 텍스트에 레슨 제목과 함께 Copywriting Contract의 Primary CTA 문구('레슨 시작하기')를 accent 색 보조 텍스트로 병기 — 제목만으로는 조회성이 좋지만 계약이 요구하는 CTA 문구를 생략하지 않기 위한 절충"
  - "이전/다음 버튼 문구는 UI-SPEC이 명시한 화살표 포함 문자열('← 이전 레슨', '다음 레슨 →') 그대로 쓰고 lucide 아이콘을 추가로 곁들임 — 계약 문구를 새로 짓지 않되 시각적 아이콘 요구도 함께 충족"
  - "LessonBreadcrumb/LessonPager는 curriculum-helpers를 거치지 않고 src/content/modules.ts의 modules 배열을 직접 조회해 모듈 제목을 찾음 — 헬퍼에 새 export를 추가하지 않고 이미 공개된 정적 배열을 재사용(Plan 03 인터페이스 확장 없이 소비)"

requirements-completed: [CONT-01, CONT-04, UX-01, UX-02]

coverage:
  - id: D1
    description: "홈 → Step → 모듈 → 레슨 드릴다운이 실제 클릭 경로로 성립하고 35개 레슨 전부가 정적 라우트를 갖는다"
    requirement: CONT-01
    verification:
      - kind: unit
        ref: "npm run build 이후 .next/server/app/lesson 산출물 35개, .next/server/app/step 산출물 3개 카운트 확인, exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "35개 레슨 전부의 카드·헤더에 깊이 배지와 예상 소요시간이 함께 표시된다"
    requirement: CONT-04
    verification:
      - kind: unit
        ref: "module-accordion.tsx의 DepthBadge/EstimatedTime 사용 grep 확인 + lesson/[lessonId]/page.tsx 헤더에 동일 컴포넌트 배치"
        status: pass
    human_judgment: false
  - id: D3
    description: "탭 가능한 모든 요소(아코디언 헤더, 레슨 링크, 이전/다음 버튼, Step 카드, not-found CTA)의 히트 영역이 44px 이상"
    requirement: UX-01
    verification:
      - kind: unit
        ref: "grep -qE 'min-h-11|min-w-11|44px' step-card.tsx / module-accordion.tsx / lesson-nav.tsx 모두 통과"
        status: pass
    human_judgment: false
  - id: D4
    description: "Step 카드 그리드가 좁은 화면에서 3열→1열로 스택되며 컨테이너를 넘치지 않는다"
    requirement: UX-02
    verification:
      - kind: unit
        ref: "src/app/page.tsx 그리드 클래스 grid-cols-1 sm:grid-cols-3 정적 확인(자동 반응형 레이아웃 테스트 미구성 — 실기기 확인은 Plan 06 UAT 범위, UI-SPEC backstop 항목)"
        status: pass
    human_judgment: true
  - id: D5
    description: "전역 첫 레슨의 이전 버튼과 마지막 레슨의 다음 버튼은 숨기지 않고 비활성 상태로 렌더되고, 중간 레슨은 두 버튼 모두 활성 상태다"
    verification:
      - kind: unit
        ref: "1-1-course-orientation.html·3-7-project-ax-launch.html에 data-pager-disabled=\"true\" 존재, 1-3-python-functions-and-io.html에는 0건 — exit 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "본문 없는 34개 레슨은 UI-SPEC empty state 카피를 렌더하고, 파일럿 레슨은 실제 MDX 본문을 렌더한다"
    verification:
      - kind: unit
        ref: "1-1-course-orientation.html에 '콘텐츠 준비 중입니다' 존재, 1-3-python-variables-and-types.html(파일럿)에는 0건"
        status: pass
    human_judgment: false
  - id: D7
    description: "금지 브랜드 문자열('kant')이 신규/수정된 UI 산출물 전체에 0건"
    requirement: "PROJECT.md HARD RULE"
    verification:
      - kind: other
        ref: "grep -riIl 'kant' src/app src/components → 매치 없음(exit 1)"
        status: pass
    human_judgment: false

duration: 약 15분
completed: 2026-08-24
status: complete
---

# Phase 1 Plan 4: 홈/Step/레슨 드릴다운 UI Summary

**Velite 매니페스트를 처음으로 화면화 — Step 카드 3장(0% 진행률 실컴포넌트), 19개 모듈 아코디언, 35개 정적 레슨 경로(브레드크럼·이전/다음 페이저·준비 중 상태)를 5개 공용 컴포넌트로 조립했다.**

## Performance

- **Tasks:** 3/3 완료
- **Files created:** 7 (컴포넌트 5, step 페이지, not-found)
- **Files modified:** 2 (홈, 레슨 페이지)
- **Duration:** 약 15분

## Accomplishments

- `src/components/depth-badge.tsx` — 심화는 레슨이 속한 Step 상징 색(10% 배경 틴트), 개요는 Step과 무관한 중성 슬레이트 색을 사용, `Record<StepId, string>` 리터럴 맵으로 Tailwind JIT 스캔 안전성 확보
- `src/components/estimated-time.tsx` — 60분 미만 "약 N분" / 60분 이상 "약 N시간"(소수 첫째 자리) 변환, 270분→"약 4.5시간" 등 계약값 확인
- `src/components/step-card.tsx` — Step 3장 고정, 좌측 강조선에 Step 색, 0% 진행률 바 실렌더(`role="progressbar"`), 카드 전체 44px+ 링크
- `src/app/page.tsx` — create-next-app 스타터 완전 대체, "AI Engineer Runway" Display 타이틀 + 3열→1열 반응형 그리드
- `src/components/module-accordion.tsx` — 네이티브 `<details>/<summary>`, Step 색 헤더, lucide 셰브론(`group-open:rotate-180`), 레슨 링크에 깊이 배지·예상 시간·"레슨 시작하기" CTA 문구
- `src/app/step/[stepId]/page.tsx` — 3개 정적 경로, 첫 모듈만 기본 열림, 잘못된 stepId는 `notFound()`
- `src/components/lesson-nav.tsx` — `LessonBreadcrumb`(Step n > 모듈 제목, 두 세그먼트 모두 Step 페이지 링크) + `LessonPager`(경계에서 `aria-disabled` + `data-pager-disabled="true"` span으로 비활성 렌더, 숨기지 않음)
- `src/app/lesson/[lessonId]/page.tsx` — `generateStaticParams`를 35개 전체로 확장, `hasContent` 분기(MDX 렌더 vs UI-SPEC 고정 empty-state 카피)
- `src/app/not-found.tsx` — 에러 상태 카피 + 커리큘럼 홈 CTA, 런타임 데이터 미로드 정적 컴포넌트
- `npm run build` + `node scripts/check-manifest.mjs` 모든 태스크에서 통과, 홈·Step 3개·레슨 35개 산출물 전부 확인, 금지 브랜드 문자열 0건

## Task Commits

Each task was committed atomically:

1. **Task 1: 홈 대시보드 Step 카드 3장과 공용 배지 컴포넌트** - `7d7250c` (feat)
2. **Task 2: Step 페이지 — 19개 모듈 아코디언과 레슨 목록** - `5925115` (feat)
3. **Task 3: 레슨 페이지 확장 — 35 정적 경로, 브레드크럼, 이전/다음, 준비 중 상태, not-found** - `8ebc068` (feat)

## Files Created/Modified

- `src/components/depth-badge.tsx` - 깊이 배지(심화 Step 틴트 / 개요 중성 슬레이트)
- `src/components/estimated-time.tsx` - 예상 소요시간 표기 변환 규칙 + 컴포넌트
- `src/components/step-card.tsx` - Step 카드(모듈/레슨 수, 0% 진행률 바, 44px+ 링크)
- `src/app/page.tsx` - 홈 대시보드(Step 카드 3장 그리드)
- `src/components/module-accordion.tsx` - 모듈 아코디언(네이티브 details/summary)
- `src/app/step/[stepId]/page.tsx` - Step 페이지(3개 정적 경로)
- `src/components/lesson-nav.tsx` - 브레드크럼 + 이전/다음 페이저
- `src/app/lesson/[lessonId]/page.tsx` - 레슨 페이지(35개 정적 경로, 준비 중 상태)
- `src/app/not-found.tsx` - 404 에러 상태 페이지

## Decisions Made

- 레슨 목록 항목 링크에 레슨 제목(주 텍스트) + Copywriting Contract Primary CTA 문구("레슨 시작하기", accent 색 보조 텍스트)를 함께 배치 — 35개 항목 전부 "레슨 시작하기"만 보이면 식별성이 떨어지므로 제목을 주 텍스트로 유지하되 계약 문구를 생략하지 않음
- 이전/다음 버튼은 UI-SPEC이 명시한 화살표 포함 문자열을 그대로 쓰고 lucide 아이콘을 추가 — 문구를 새로 짓지 않는 계약 준수와 아이콘 시각 요구를 동시에 충족
- `LessonBreadcrumb`/`LessonPager`가 모듈 제목을 조회할 때 `curriculum-helpers.ts`에 새 export를 추가하지 않고 `src/content/modules.ts`의 `modules` 배열을 직접 참조 — Plan 03이 확정한 인터페이스 표면을 넓히지 않음

## Deviations from Plan

None - 계획대로 3개 태스크 모두 실행, 각 태스크의 `<verify>` 자동화 블록이 그대로 통과했다.

## Issues Encountered

없음 — 3개 태스크 모두 `npm run build` + `node scripts/check-manifest.mjs` + 태스크별 grep/node 인라인 검증이 계획된 그대로 통과함.

## Known Stubs

없음 — 이 Plan이 만든 화면은 모두 실제 동작 컴포넌트다. 진행률 바가 항상 0%인 것은 PLAN이 명시적으로 의도한 상태(Phase 2가 Supabase 진도 데이터를 연결)이며 스텁이 아니라 D-07 설계 그대로다.

## User Setup Required

없음 - 외부 서비스 설정 불필요.

## Next Phase Readiness

- Plan 05(글로벌 내비, 테마 토글, Making-of 상시 게이트)가 이 Plan의 `layout.tsx` 미변경 상태 위에 내비를 얹을 수 있음
- Plan 06(파일럿 레슨 2편 콘텐츠 + iPad 실기기 UAT)이 이 Plan의 empty-state/hasContent 분기와 Step 카드 반응형 그리드를 그대로 검증 대상으로 사용 가능
- `getAdjacentLessons`/`getLessonBySlug`/`getModulesByStep`/`getLessonCounts` 4개 헬퍼가 실제 화면에서 소비됨 확인 — Plan 03 인터페이스 계약 유효성 실증
- 블로킹 항목 없음

---
*Phase: 01-deployed-curriculum-skeleton*
*Completed: 2026-08-24*

## Self-Check: PASSED

- FOUND: src/components/depth-badge.tsx
- FOUND: src/components/estimated-time.tsx
- FOUND: src/components/step-card.tsx
- FOUND: src/components/module-accordion.tsx
- FOUND: src/components/lesson-nav.tsx
- FOUND: src/app/step/[stepId]/page.tsx
- FOUND: src/app/not-found.tsx
- FOUND: src/app/page.tsx (modified)
- FOUND: src/app/lesson/[lessonId]/page.tsx (modified)
- FOUND commit: 7d7250c
- FOUND commit: 5925115
- FOUND commit: 8ebc068
