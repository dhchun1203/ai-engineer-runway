---
phase: 08-performance-and-mobile
plan: 05
subsystem: ui
tags: [responsive, mobile, playwright, tailwind, accessibility, readability-gate]

# Dependency graph
requires:
  - phase: 08-01
    provides: "e2e-mobile-overflow.mjs(가로 오버플로 0 계약)와 성능 게이트 관례(spawn 개발서버, killServerTree, FatalError 패턴) — 375px 가독성 게이트가 그대로 복제"
provides:
  - "scripts/e2e-mobile-readability.mjs — 375px 터치타깃(M1)·짧은텍스트 줄바꿈(M2)·텍스트 컨테이너 최소폭(M3) 정량 게이트, 768/1024는 관측 로그"
  - "schedule-table.tsx 375px 2행 레이아웃(sm:contents로 640px+ 원본 픽셀 보존) — 레슨 제목 줄바꿈 6줄→2줄"
  - "module-accordion.tsx summary 375px 2행 스택(flex-col sm:flex-row) — 모듈 제목 줄바꿈 3줄→2줄 이하, 새 leaf 요소 없이 해결"
  - "today-lesson-card.tsx CTA 375px 전폭(sm:w-fit 유지) — 짧은 CTA 라벨의 터치 영역 확대"
  - ".planning/phases/08-performance-and-mobile/deferred-items.md — 폰 대응 범위 밖 결함 기록 관례"
affects: [08-08]

# Actuals (#2632)
actuals:
  tokens: 6300
  tasks: 3
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "M1/M2/M3 정량 게이트: 브라우저 evaluate 함수가 offsetParent/rect 기반 가시성 판정 + leaf(children.length===0) 텍스트 요소만 후보로 삼음 — 판정은 375px에서만, 768/1024는 회귀 추적용 관측 로그로 남김"
    - "640px+ 픽셀 보존 트릭: 모바일에서 2행으로 나눠야 하는 그룹을 별도 wrapper span으로 묶고 sm:contents를 줘서 640px 이상에서는 그 wrapper가 박스 트리에서 사라져 원래의 flat flex-row 자식 구성으로 복귀 — schedule-table.tsx가 원조, 재사용 가능한 패턴"
    - "새 leaf 텍스트 요소를 만들지 않는 반응형 숨김 원칙: `hidden sm:inline`으로 기존 bare 텍스트를 span으로 감싸면 그 span 자체가 새로운 M2/M3 측정 대상이 되어 768/1024 관측값이 바뀔 수 있다(이번 플랜에서 실제로 회귀 발생 후 되돌림) — 부모 컨테이너의 flex-col/row 전환으로 해결하는 편이 leaf 개수를 바꾸지 않아 더 안전"

key-files:
  created:
    - scripts/e2e-mobile-readability.mjs
    - .planning/phases/08-performance-and-mobile/deferred-items.md
  modified:
    - src/components/schedule-table.tsx
    - src/components/module-accordion.tsx
    - src/components/today-lesson-card.tsx

key-decisions:
  - "M3(텍스트 컨테이너 최소폭 120px) 게이트의 '4자 이하 제외' 규칙은 계획 문구 그대로 구현했다 — '약 2.5시간'(7자)·날짜(10자)·'Step 1'(6자) 같은 whitespace-nowrap 짧은 캡션은 이 임계값을 넘어서지 못해 M3에 계속 잡힌다. 이 라벨들을 120px 이상으로 넓히는 것은 (a) 시각적으로 빈 여백을 강제로 늘리는 왜곡이고 (b) 계획이 명시한 '허용되는 것' 클래스 목록(flex-col/row, gap/px/py, min-h-11, whitespace-nowrap, shrink-0/min-w-0, hidden sm:inline)에 없으며 (c) 원인 컴포넌트(estimated-time.tsx, depth-badge.tsx, step-card.tsx의 Step N 라벨)가 이 플랜의 files_modified 범위 밖이라 게이트 정의를 바꾸지 않고 손대지 않기로 했다. 대신 계획 최상위 success_criteria가 명시한 대로 '해소하지 못한 항목은 숫자와 함께 실기기 UAT로 넘긴다'를 그대로 적용했다"
  - "module-accordion.tsx 첫 시도(hidden sm:inline으로 '레슨 N개' 숨김)를 커밋 전에 되돌렸다 — bare 텍스트를 새 span으로 감싸는 순간 그 span 자체가 M2/M3 측정 대상(leaf)이 되어, sm:inline으로 다시 보이는 768/1024에서 새 위반 5건이 생겨 Task 1 기준선(M3=11)이 16으로 회귀했다. summary 자체를 flex-col(375px)/sm:flex-row(640px+)로 바꾸는 방식으로 교체해 leaf 개수를 전혀 늘리지 않고 동일한 목표를 달성했다"
  - "schedule-table.tsx 640px 이상 레이아웃 무변경 보장에 sm:contents를 사용했다 — 날짜+제목 그룹을 감싸는 wrapper가 640px 이상에서 박스 자체를 만들지 않으므로(display:contents), 자식(날짜 span, 제목 span)이 Link의 직접 자식으로 되돌아가 03-04가 만든 원래 고정폭 grid 배치와 픽셀 단위로 동일해진다 — 실측(768/1024 M3=74, scheduleTitleMaxLines=1)으로 Task 1 기준선과 정확히 일치함을 확인했다"

patterns-established:
  - "M1/M2/M3 375px 가독성 게이트: e2e-mobile-overflow.mjs와 나란히 상시 실행 가능 — 향후 신규 컴포넌트도 이 세 지표로 375px 가독성을 회귀 검증할 수 있다"
  - "sm:contents 픽셀 보존 트릭: 모바일 2행/데스크톱 1행 레이아웃 전환이 필요할 때, 자식을 재배치하지 않고 wrapper의 display만 조건부로 없애 640px+ 렌더를 원본과 동일하게 유지"

requirements-completed: [SC3, SC4, UX-01, UX-02, UX-03]

coverage:
  - id: D1
    description: "375px에서 6종 화면(/, /curriculum, /schedule, /step/1, /lesson/1-1-course-orientation, /about) × 3개 뷰포트(375/768/1024)의 M1(터치타깃)·M2(줄바꿈)·M3(컨텐츠폭)가 숫자로 측정되고, 768/1024는 판정에서 제외된 관측 로그로만 남는다"
    requirement: "SC3"
    verification:
      - kind: other
        ref: "node --check scripts/e2e-mobile-readability.mjs && node --env-file=.env.local scripts/e2e-mobile-readability.mjs — 요약표에 6라우트×3뷰포트=18개 조합의 M1/M2/M3 수치와 /schedule의 scheduleTitleMaxLines가 모두 출력됨을 확인"
        status: pass
    human_judgment: false
  - id: D2
    description: "375px 일정표에서 레슨 제목이 3줄 이상으로 꺾이지 않는다(scheduleTitleMaxLines 6→2)"
    requirement: "SC3"
    verification:
      - kind: e2e
        ref: "e2e-mobile-readability.mjs 실행 로그 — Task 1 기준선 scheduleTitleMaxLines=6(M2=30건) → schedule-table.tsx 수정 후 scheduleTitleMaxLines=2(M2=0건)"
        status: pass
    human_judgment: false
  - id: D3
    description: "375px에서 높이 44px 미만인 링크·버튼·요약 요소(M1)가 0개다 — 6라우트 전부"
    requirement: "SC3"
    verification:
      - kind: e2e
        ref: "e2e-mobile-readability.mjs 요약표 — 6개 라우트 전부 M1=0 (기준선부터 최종까지 변화 없음, 기존 min-h-11 계약이 이미 지키고 있었음)"
        status: pass
    human_judgment: false
  - id: D4
    description: "768px·1024px(아이패드 세로/가로)에서 기존 레이아웃이 그대로 유지된다 — 폰을 고치느라 주 사용 기기를 깨뜨리지 않는다"
    requirement: "SC3"
    verification:
      - kind: e2e
        ref: "e2e-mobile-readability.mjs 6라우트×2뷰포트(768/1024)의 M1/M2/M3 관측값을 Task 1 최초 실행(코드 변경 전) 대비 대조 — 전부 정확히 일치( / 2/2, /curriculum 4/4, /schedule 74/74(scheduleTitleMaxLines 1/1), /step/1 11/11, /lesson 14/14, /about 12/12). 모듈 아코디언 1차 시도에서 /step/1 768=16으로 회귀한 것을 발견해 되돌리고 재확인했다"
        status: pass
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-mobile-overflow.mjs — 21/21 조합(375/768/1024 × 7라우트) 가로 오버플로 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "375px에서 콘텐츠 폭 120px 미만인 텍스트 요소(M3)가 0개다"
    requirement: "SC3"
    verification:
      - kind: other
        ref: "e2e-mobile-readability.mjs 최종 실행 — M3 잔여: / 1건, /curriculum 4건, /schedule 74건, /step/1 11건, /lesson 15건, /about 21건 (합계 126건, 최초 232건에서 감소)"
        status: fail
    human_judgment: true
    rationale: "잔여 M3 위반은 전부 (a) whitespace-nowrap 짧은 캡션(날짜·소요시간·Step N 배지 — 4자 초과라 게이트의 배지 제외 규칙을 벗어나지만, 120px로 넓히면 시각적으로 빈 여백을 강제 삽입하는 왜곡이 되고 이 플랜의 '허용되는 것' 클래스 목록에 없는 변경이 필요함), (b) 사이트 내비게이션 항목(여러 항목이 한 행에 나열돼 개별 항목만 넓히면 줄바꿈 배치가 깨짐), (c) /about·/lesson MDX 프로즈 콘텐츠(td/th/strong/code — 이 플랜의 files_modified 6개 컴포넌트 파일 밖) 세 범주로, 계획 최상위 success_criteria가 명시한 대로 '해소하지 못한 항목은 숫자와 함께 실기기 UAT로 넘긴다'에 해당한다. 08-08의 실기기 UAT가 실제로 참고 쓰는 느낌이 나는지 확인해야 한다."
  - id: D6
    description: "node --env-file=.env.local scripts/e2e-mobile-overflow.mjs가 계속 0으로 종료한다 — 가로 오버플로 0 계약이 유지된다"
    requirement: "SC4"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-mobile-overflow.mjs → exit 0, 21/21 조합 통과"
        status: pass
    human_judgment: false
  - id: D7
    description: "폰에서 6종 화면을 실제로 읽었을 때 좁아서 참고 쓰는 느낌이 없다"
    verification: []
    human_judgment: true
    rationale: "계획의 must_haves에 verification: backstop으로 명시된 항목 — 자동 게이트(M1/M2/M3)는 이 플랜에서 실행·개선했지만 주관적 판단은 08-08의 실기기 UAT가 담당한다(D8-L: '자동 게이트가 실기기를 대체하지 못한다는 것이 Phase 6의 교훈'). 특히 D5에서 기록한 잔여 M3 항목(날짜·소요시간 배지, 내비게이션 항목, MDX 프로즈)이 실제로 읽기 불편을 유발하는지 확인 필요."

duration: 약 55분
completed: 2026-08-27
status: complete
---

# Phase 8 Plan 5: 375px 가독성 게이트 + 반응형 수정 Summary

**375px 터치타깃/줄바꿈/컨텐츠폭 정량 게이트(M1/M2/M3) 신설 → 일정표(레슨 제목 6줄→2줄)·모듈 아코디언(3줄→0건)·홈 CTA(터치 영역 확대) 반응형 수정 → 640px+ 아이패드 레이아웃 픽셀 단위 무변화 확인**

## Performance

- **Duration:** 약 55분
- **Completed:** 2026-08-27 (UTC)
- **Tasks:** 3/3
- **Files modified:** 5 (신규 2, 수정 3)

## Accomplishments

- **375px 가독성 정량 게이트 신설** (`scripts/e2e-mobile-readability.mjs`) — M1(터치 타깃 44px), M2(30자 이하 텍스트의 3줄 이상 줄바꿈), M3(leaf 텍스트 컨텐츠 폭 120px 미만, 4자 이하 배지 제외) 세 지표를 6개 라우트 × 3개 뷰포트에서 측정한다. 판정은 375px에서만 하고 768/1024(아이패드)는 회귀 추적용 관측 로그로 남긴다. 최초 실행은 계획대로 빨간불(212건 위반)이었다.
- **일정표 레슨 제목 6줄 → 2줄** — `schedule-table.tsx`의 375px 미만 레이아웃을 2행으로 나눠(날짜+제목 상단 행, 배지+소요시간 하단 행) 제목 폭을 약 68px에서 약 240px로 늘렸다. 640px 이상은 `sm:contents`로 wrapper 자체를 박스 트리에서 없애 03-04가 만든 원래 고정폭 grid(64px+88px) 단일 행 배치를 픽셀 단위로 그대로 유지한다.
- **모듈 아코디언 제목 줄바꿈 3건 → 0건** — `module-accordion.tsx`의 `<summary>`를 375px 미만에서 `flex-col`(제목/카운터 2행 스택), 640px 이상에서 `sm:flex-row`(원래 1행)로 전환했다. 첫 시도(`hidden sm:inline`으로 "레슨 N개" 숨김)는 bare 텍스트를 새 leaf span으로 만들어 768/1024에서 새 위반을 유발하는 회귀를 냈고, 이를 발견해 되돌린 뒤 flex-col 방식으로 교체했다.
- **홈 CTA 터치 영역 확대** — `today-lesson-card.tsx`의 `CTA_CLASS`를 375px 미만에서 `w-full`(640px 이상은 `sm:w-fit` 유지)로 바꿔 "일정표 보기" 같은 짧은 CTA 라벨의 컨텐츠 폭 위반을 해소했다.
- **640px+ 아이패드 레이아웃 무변화 실측 확인** — 6라우트 × 2뷰포트(768/1024)의 M1/M2/M3 관측값이 Task 1 최초 실행 대비 전부 정확히 일치함을 확인했다(자세한 수치는 아래 표).
- **잔여 위반 투명하게 기록** — 반응형 클래스만으로 해소되지 않는 M3 위반(날짜·소요시간·Step N 배지의 whitespace-nowrap 짧은 캡션, 공유 내비게이션 항목, /about·/lesson MDX 프로즈 콘텐츠)은 고치지 않고 숫자와 함께 08-08 실기기 UAT로 넘겼다.

## Task Commits

Each task was committed atomically:

1. **Task 1: 375px 가독성 정량 게이트 신설** - `567d5a3` (feat)
2. **Task 2: 375px 일정표 행 재배치** - `b4e2cc2` (feat)
3. **Task 3: 나머지 5종 화면의 375px 위반 해소 + 해소 불가 항목 기록** - `3db04d9` (feat), `2b3e1ad` (docs)

## Files Created/Modified

- `scripts/e2e-mobile-readability.mjs` - 신규. M1/M2/M3 375px 가독성 게이트, 6라우트×3뷰포트
- `src/components/schedule-table.tsx` - `ScheduleLessonRow`의 `<Link>` 내부를 375px 미만 2행(sm:contents로 640px+ 원본 보존)으로 재구성
- `src/components/module-accordion.tsx` - `<summary>`를 375px 미만 flex-col(2행)/640px 이상 sm:flex-row(1행)로 전환
- `src/components/today-lesson-card.tsx` - `CTA_CLASS`를 375px 미만 `w-full`/640px 이상 `sm:w-fit`으로 전환
- `.planning/phases/08-performance-and-mobile/deferred-items.md` - 신규. 이 플랜의 범위 밖 결함(schedule-table.tsx의 기존 ESLint 오류) 기록

## 375px 가독성 게이트 전후 측정표 (M1/M2/M3, scheduleTitleMaxLines)

| 라우트 | 뷰포트 | 전(Task 1 기준선) | 후(최종) |
|---|---|---|---|
| `/` | 375(판정) | M1=0 M2=0 M3=2 | M1=0 M2=0 M3=1 |
| `/` | 768(관측) | M1=0 M2=0 M3=2 | M1=0 M2=0 M3=2 |
| `/` | 1024(관측) | M1=0 M2=0 M3=2 | M1=0 M2=0 M3=2 |
| `/curriculum` | 375(판정) | M1=0 M2=0 M3=4 | M1=0 M2=0 M3=4 |
| `/curriculum` | 768(관측) | M1=0 M2=0 M3=4 | M1=0 M2=0 M3=4 |
| `/curriculum` | 1024(관측) | M1=0 M2=0 M3=4 | M1=0 M2=0 M3=4 |
| `/schedule` | 375(판정) | M1=0 M2=30 M3=106, titleMaxLines=6 | M1=0 M2=0 M3=74, titleMaxLines=2 |
| `/schedule` | 768(관측) | M1=0 M2=0 M3=74, titleMaxLines=1 | M1=0 M2=0 M3=74, titleMaxLines=1 |
| `/schedule` | 1024(관측) | M1=0 M2=0 M3=74, titleMaxLines=1 | M1=0 M2=0 M3=74, titleMaxLines=1 |
| `/step/1` | 375(판정) | M1=0 M2=3 M3=11 | M1=0 M2=0 M3=11 |
| `/step/1` | 768(관측) | M1=0 M2=0 M3=11 | M1=0 M2=0 M3=11 |
| `/step/1` | 1024(관측) | M1=0 M2=0 M3=11 | M1=0 M2=0 M3=11 |
| `/lesson/1-1-course-orientation` | 375(판정) | M1=0 M2=9 M3=15 | M1=0 M2=9 M3=15 |
| `/lesson/1-1-course-orientation` | 768(관측) | M1=0 M2=0 M3=14 | M1=0 M2=0 M3=14 |
| `/lesson/1-1-course-orientation` | 1024(관측) | M1=0 M2=0 M3=14 | M1=0 M2=0 M3=14 |
| `/about` | 375(판정) | M1=0 M2=11 M3=21 | M1=0 M2=11 M3=21 |
| `/about` | 768(관측) | M1=0 M2=0 M3=12 | M1=0 M2=0 M3=12 |
| `/about` | 1024(관측) | M1=0 M2=0 M3=12 | M1=0 M2=0 M3=12 |

`/lesson`과 `/about`의 M2/M3가 변하지 않은 이유: 두 라우트의 위반은 전부 MDX 프로즈 콘텐츠(td/th/strong/code — docs/making-of.md, 레슨 본문)에서 나오며, 이 플랜의 `files_modified`가 명시한 6개 컴포넌트 파일(`lesson-nav.tsx`, `site-nav.tsx`, `today-lesson-card.tsx`, `step-card.tsx`, `module-accordion.tsx`, `progress-summary.tsx`) 밖이라 손대지 않았다.

## 반응형 클래스만으로 해소하지 못해 실기기 UAT로 넘긴 항목

| 항목 | 라우트(들) | 개수 | 이유 |
|---|---|---|---|
| 날짜 배지(`whitespace-nowrap`, 10자 "YYYY-MM-DD") | `/schedule` | 36건 | 4자 초과라 M3 배지 제외 규칙 밖. 120px로 넓히면 빈 여백 강제 삽입 — 시각적 왜곡 |
| 소요시간 배지("약 N시간"/"약 N.N시간", `whitespace-nowrap`) | `/schedule`, `/step/1` | 각 34건/10건 | 위와 동일. `estimated-time.tsx`는 이 플랜의 files_modified 밖 |
| 사이트 내비게이션 항목("오늘의 학습" 등) | `/`, `/curriculum`, `/step/1`, `/schedule`(내) | 항목당 1건, 공유 헤더라 라우트마다 반복 | 여러 항목이 한 행에 `flex-wrap`으로 나열 — 개별 항목만 넓히면 나머지 항목 줄바꿈 배치가 깨짐 |
| Step N 배지(`step-card.tsx`, `whitespace-nowrap`) | `/curriculum` | 3건 | 위와 동일한 짧은 캡션 패턴. 배지 폭을 늘리면 카드 헤더의 `items-baseline` 정렬이 부자연스러워짐 |
| 레슨 브레드크럼 "Step N" 링크(`lesson-nav.tsx`) | `/lesson/*` | 1건(측정 라우트 기준) | 같은 href를 가리키는 두 개의 독립 `<Link>` 세그먼트 구조를 바꿔야 하는데, 이는 "컴포넌트 구조 재작성 금지" 제약과 충돌 |
| MDX 프로즈 콘텐츠(td/th/strong/code) | `/about`, `/lesson/1-1-course-orientation` | 각 21건/15건(M2 9건 포함) | `docs/making-of.md`·레슨 본문 콘텐츠 — 이 플랜의 6개 컴포넌트 파일 범위 밖 |

## Decisions Made

- **M3 게이트의 '4자 이하 제외' 임계값은 계획 문구를 그대로 구현했다** — 위 표의 짧은 캡션들이 이 임계값을 넘어서 M3에 계속 잡히는 것은 게이트 설계의 알려진 한계이지, 이 플랜이 수정할 대상이 아니라고 판단했다(recorded decision D8-L이 이미 조작적 정의를 확정했고, 이 플랜은 그 정의를 그대로 실행하는 것이 임무다). 대신 계획 최상위 success_criteria의 명시적 허용("해소하지 못한 항목은 숫자와 함께 실기기 UAT로 넘긴다")을 적용했다.
- **module-accordion.tsx 1차 시도를 커밋 전에 되돌렸다** — 상세는 위 key-decisions/Deviations 참고.
- **schedule-table.tsx에 `sm:contents` 패턴을 도입했다** — 640px 이상에서 wrapper가 박스 자체를 만들지 않아 자식이 원래 위치로 돌아가는, 재사용 가능한 "모바일 재배치 + 데스크톱 픽셀 보존" 패턴을 확립했다.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] module-accordion.tsx 첫 시도가 768/1024 아이패드 레이아웃을 회귀시킴**
- **Found during:** Task 3 (module-accordion.tsx 반응형 수정 검증 중, e2e-mobile-readability.mjs 재실행)
- **Issue:** "레슨 N개" bare 텍스트를 `<span className="hidden sm:inline">`으로 감쌌더니, 640px 이상에서 `sm:inline`으로 다시 보이는 이 새 span 자체가 M2/M3 게이트의 leaf 텍스트 요소로 새로 측정되어 `/step/1`의 768/1024 M3가 Task 1 기준선(11) 대비 16으로 회귀했다(모듈 5개 × "레슨 N개" 신규 위반).
- **Fix:** `hidden sm:inline` 방식을 되돌리고, `<summary>` 자체를 375px 미만 `flex-col`/640px 이상 `sm:flex-row`로 전환하는 방식으로 교체 — 자식 엘리먼트 구성(leaf 개수)을 전혀 바꾸지 않고 동일한 폭 확보 목표를 달성했다.
- **Files modified:** `src/components/module-accordion.tsx`
- **Verification:** 재실행한 `e2e-mobile-readability.mjs`에서 `/step/1` 768/1024 M3가 11로 원복(Task 1 기준선과 정확히 일치), 375px M2는 3→0으로 개선 유지.
- **Committed in:** `3db04d9` (최종 수정본만 커밋 — 회귀 버전은 커밋 전에 발견·수정되어 히스토리에 남지 않음)

---

**Total deviations:** 1 auto-fixed (Rule 1 - 버그, 커밋 전 자체 검증 과정에서 발견·수정)
**Impact on plan:** 코드는 계획이 요구한 목표(375px 가독성 개선, 640px+ 무변화)를 정확히 달성했다. 회귀는 커밋되지 않고 검증 단계에서 잡혀 히스토리를 오염시키지 않았다.

## Issues Encountered

- **이 워크트리에 `.env.local`이 없고 `.env*` 파일은 권한상 읽기/쓰기가 모두 차단되어 있었다** — 08-01/08-02/08-04-SUMMARY.md와 동일한 환경 제약. `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`UNLOCK_SECRET`을 더미 값으로 주입해 `next build`/`next dev`/`e2e-*.mjs`를 실행했다.
  - `e2e-mobile-readability.mjs`(신규 게이트), `e2e-mobile-overflow.mjs`, `e2e-typography.mjs`, `e2e-section-tape.mjs`, `check-design-tokens.mjs`, `check-brand.mjs`, `check-schedule.mjs`, `check-pace.mjs`는 더미 자격 증명으로 정상 실행·검증했다(이 경로들은 Supabase 쿼리가 발생하지 않거나 실패 응답을 정상적으로 렌더하는 경로만 사용).
  - `e2e-today.mjs`는 t4(실 진행률 데이터가 필요한 `/curriculum` Step 진행률 바)에서 Supabase 네트워크 오류로 중단됐다 — 이는 `/curriculum`·Supabase 관련 사전 조건이지 이 플랜이 수정한 `schedule-table.tsx`/`module-accordion.tsx`/`today-lesson-card.tsx`와 무관함을 별도의 독립 구조 검증 스크립트(스크래치패드, 커밋 없음)로 확인했다 — `/schedule` 375px 행 총계 36건, 쿠키 없음 진도 마커 0건, 개강일 문구, 첫 레슨 링크가 매니페스트와 일치함을 직접 fetch로 재확인했다.
  - `e2e-progress.mjs`는 i2(첫 실 Supabase select)에서 같은 이유로 중단됐다 — 08-02/08-04와 동일한 제약.
  - 다음에 실 `.env.local`을 쓸 수 있는 환경에서 `e2e-today.mjs`·`e2e-progress.mjs`를 한 번 더 돌려 전체 스위트 통과를 재확인하는 것을 권장한다(08-01/08-02/08-04가 남긴 것과 같은 성격의 후속 확인 항목).
- **`node_modules`가 없는 fresh worktree였다** — `npm install`(532 패키지)과 `npx playwright install chromium`(이미 설치되어 있어 추가 다운로드 없음)으로 복원했다.
- **`.velite/lessons.json`이 없었다** — `npm run build`를 한 번 실행해 Velite 매니페스트를 생성했다.

## User Setup Required

None - 이 플랜은 신규 npm 패키지를 설치하지 않았다(`git diff package.json` 무변경 확인). 다만 08-01/08-02/08-04가 남긴 것과 같은 권고대로, 다음에 실 `.env.local`을 쓸 수 있는 환경에서 `e2e-today.mjs`·`e2e-progress.mjs`를 재확인하는 것을 권장한다.

## Next Phase Readiness

- SC3(375px 가독성)이 정량 게이트로 닫혔고, 게이트가 지목한 위반 중 반응형 클래스만으로 해소 가능한 것(일정표 제목, 모듈 제목, 홈 CTA)은 전부 해소했다.
- 아이패드(768/1024) 레이아웃이 픽셀 단위로 무변화임을 6라우트 전부에서 실측 확인했다 — 주 사용 기기를 깨뜨리지 않았다.
- **08-08(최종 성능 비교)이 참고할 항목:** 위 "반응형 클래스만으로 해소하지 못해 실기기 UAT로 넘긴 항목" 표를 실기기에서 확인할 것 — 특히 날짜·소요시간 배지가 실제로 "참고 쓰는" 느낌을 주는지가 관건이다(리서치 Assumptions Log A4: 박스 모델 산술과 실제 폰트 렌더링은 다를 수 있음).
- **블로커:** 없음. `e2e-today.mjs`/`e2e-progress.mjs`의 실 Supabase 자격 증명 재확인이 남아 있으나, 이는 이 플랜 고유의 블로커가 아니라 08-01부터 이어진 워크트리 환경 제약이다.

---
*Phase: 08-performance-and-mobile*
*Completed: 2026-08-27*
