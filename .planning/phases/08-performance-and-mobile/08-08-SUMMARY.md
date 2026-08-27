---
phase: 08-performance-and-mobile
plan: 08
subsystem: infra
tags: [performance, mobile, ttfb, static-generation, font-subsetting, ipad, uat, vercel]

requires:
  - phase: 08-performance-and-mobile
    provides: "08-01~08-07이 만든 정적 전환·폰트 서브셋·375px 반응형·프레임 스로틀·인터랙션 레이어 전부"
provides:
  - "08-MEASUREMENTS.md — 이 페이즈 전후 숫자 종합표 5종 + SC1~SC5 매핑, 375px 표는 quick g6u 반영 전/후 이력 보존"
  - "docs/making-of.md에 Phase 8 이야기(정적 전환·날짜 처리·글꼴·탭 피드백·스크롤 버벅임·폰 일정표·새 자동 검사) 반영"
  - "아이패드 세로·가로 + 폰 실기기 UAT 사용자 승인 — Phase 6 메모장 하단 틈 결함 재발 없음 확인"
affects: [ship, milestone-close]

actuals:
  tokens: 3400
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "측정 종합 문서(08-MEASUREMENTS.md)는 체크포인트 대기 중 발견된 외부 수정(quick task)의 영향을 받으면 값을 덮어쓰지 않고 전/후 이력 + 출처 각주로 남긴다"

key-files:
  created: []
  modified:
    - .planning/phases/08-performance-and-mobile/08-MEASUREMENTS.md
    - docs/making-of.md

key-decisions:
  - "Task 3 체크포인트 대기 중 사용자가 보고한 폰 헤더 내비 3줄 결함은 이 플랜이 직접 고치지 않고, 이미 quick task 260827-g6u가 플랜 범위 밖에서 수정 완료한 사실을 확인하고 08-MEASUREMENTS.md만 그 결과를 반영해 갱신했다 — 중복 수정 방지"
  - "375px 표는 수정 전(이 플랜 Task 1 실측)과 수정 후(quick g6u 실측)를 같은 표에 나란히 남기고 덮어쓰지 않았다 — 측정 기록의 이력 보존 원칙"

patterns-established:
  - "체크포인트 대기 창 안에서 외부 quick task가 측정값에 영향을 준 경우, 재실행 대신 quick task의 SUMMARY/BASELINE 문서를 1차 출처로 인용해 종합 문서를 갱신한다(재측정은 확인이 필요할 때만 선택적으로)"

requirements-completed: [SC1, SC2, SC3, SC4, SC5, PLAT-03, UX-01]

coverage:
  - id: D1
    description: "게이트 19종(신규 4종 포함 20종 실행, 19종 exit 0) 전량이 한 세션에서 실 Supabase 자격증명 기준으로 실행됐고 결과가 표로 기록됐다"
    requirement: "SC4"
    verification:
      - kind: other
        ref: "08-MEASUREMENTS.md 표 5 (게이트 실행 결과), 커밋 a2d6c3c"
        status: pass
    human_judgment: false
  - id: D2
    description: "프로덕션 배포 완료, 배포 URL에서 정적 라우트 3종 TTFB 실측(33.59~39.93ms, 정적 대조군과 동일 구간)"
    requirement: "SC1"
    verification:
      - kind: other
        ref: "08-MEASUREMENTS.md 표 1, GitHub Deployment API status=success"
        status: pass
    human_judgment: false
  - id: D3
    description: "docs/making-of.md가 Phase 8 작업(정적 전환·날짜 처리·글꼴·탭 피드백·스크롤 버벅임·폰 일정표·새 자동 검사)을 eli5 톤으로 서술하고, check-brand.mjs가 0으로 종료한다"
    requirement: "PLAT-03"
    verification:
      - kind: other
        ref: "node scripts/check-brand.mjs, npm run build — 커밋 47f4a23"
        status: pass
    human_judgment: false
  - id: D4
    description: "아이패드 세로·가로 + 폰 실기기에서 사람이 A~E 전 항목(로딩 자리표시·스크롤·탭 피드백·메모장 하단 틈·폰 6종 화면 가독성·첫 방문 글꼴 깜빡임·브랜딩)을 확인하고 결함 없이 승인했다"
    requirement: "SC3"
    verification: []
    human_judgment: true
    rationale: "실기기 체감(터치 반응·스크롤 매끄러움·메모장 하단 틈·폰 가독성)은 헤드리스 자동 측정이 대체할 수 없는 성공 기준 — Phase 6이 게이트 16종 초록불 상태로도 실기기 결함이 나왔던 선례가 이 플랜의 존재 이유. 사용자가 실기기에서 확인하고 '승인'으로 회신"

duration: 약 52분 (Task 1 첫 커밋 11:25 KST → Task 3 완료 커밋 12:17 KST)
completed: 2026-08-27
status: complete
---

# Phase 8 Plan 8: 게이트 전량 실행 + 측정 종합 + Making-of 갱신 + 실기기 UAT 승인 Summary

**게이트 19종(신규 4종 포함 실측 20종) 실 자격증명 기준 실행, 프로덕션 TTFB 실측(정적 라우트 33.59~39.93ms), Making-of PLAT-03 갱신, 아이패드·폰 실기기 UAT 사용자 승인으로 Phase 8 종료**

## Performance

- **Duration:** 약 52분 (Task 1 첫 커밋 2026-08-27T11:25:30+09:00 → Task 3 완료 커밋
  2026-08-27T12:17:09+09:00)
- **Started:** 2026-08-27T02:10:28.056Z (WINDOWS.md 최초 기록 기준)
- **Completed:** 2026-08-27T03:17:09.000Z
- **Tasks:** 3 (전부 완료 — Task 1·2는 이전 세션에 완료, 이번 세션은 Task 3 체크포인트 재개)
- **Files modified:** 2 (`08-MEASUREMENTS.md`, `docs/making-of.md` — 후자는 이전 세션 커밋)

## Accomplishments

- 게이트 20종(기존 16 + 신규 4: `check-route-rendering`·`check-font-glyph-coverage`·
  `e2e-perf-budget`·`e2e-mobile-readability`)을 실 Supabase 자격증명으로 한 세션에서 순차 실행 —
  19종 exit 0, 유일한 비-0 종료(`e2e-mobile-readability`)는 08-05가 이미 사람 판단으로 확정한
  잔존 항목(WINDOWS.md #10)이지 새 회귀가 아니다.
- 프로덕션 배포 성공(커밋 `8598ef8`, `https://ai-engineer-runway.vercel.app`), 정적 라우트
  3종(커리큘럼·Step·레슨) 실측 TTFB 33.59~39.93ms가 정적 대조군 `/about`(34.86ms)과 동일
  구간에 있음을 확인.
- `docs/making-of.md`에 Phase 8의 일곱 항목(정적 전환, 오늘/일정표는 예외로 남긴 이유, 글꼴
  서브셋, 탭 피드백, 스크롤 버벅임 수정, 폰 일정표 두 줄 배치, 새 자동 검사 3종)을 eli5 톤으로
  추가 — 금지 기관명 0건, `check-brand.mjs` 통과.
- 아이패드 세로·가로 + 폰 실기기 UAT: 사용자가 A(세로: 로딩 자리표시·스크롤·완료 토글·메모장
  하단 틈)·B(가로)·C(폰 6종 화면 가독성)·D(첫 방문 글꼴 깜빡임)·E(브랜딩)를 전부 확인하고
  **"승인"으로 회신**. 결함 0건 — 특히 Phase 6의 메모장 하단 틈 결함(커밋 b878491) 재발 없음을
  확인했다.
- Task 3 체크포인트 대기 중 사용자가 실제 아이폰에서 헤더 내비 3줄 접힘(화면 위쪽 1/4 잠식)
  결함을 발견해 보고 — 이 플랜 범위 밖에서 quick task `260827-g6u-phone-hamburger-nav-640px`가
  이미 수정 완료(640px 미만 햄버거+접이식 패널, 640px 이상 픽셀 동일)한 사실을 확인했다.
- `08-MEASUREMENTS.md` 표 4(375px 가독성)를 quick g6u 반영 전/후 값을 나란히 남기는 방식으로
  갱신 — M3 126→120(라우트당 정확히 −1, "오늘의 학습" 링크가 640px 미만에서 hidden), 총 위반
  146→140. 값을 덮어쓰지 않고 이력을 보존했다(before → after + 출처 각주).

## Task Commits

Each task was committed atomically:

1. **Task 1: 게이트 19종 전량 실행 + 배포 + 측정 종합표 작성** - `a2d6c3c` (docs), 선행 버그
   수정 `8598ef8` (fix)
2. **Task 2: Making-of 소개 페이지에 이 페이즈 반영 (PLAT-03)** - `47f4a23` (docs)
3. **Task 3: 아이패드·폰 실기기 UAT (사람 확인) — 승인 기록 + 측정 갱신** - `9fd64a5` (docs)

**Plan metadata:** (다음 커밋에서 STATE.md/ROADMAP.md/REQUIREMENTS.md와 함께 별도 기록)

## Files Created/Modified

- `.planning/phases/08-performance-and-mobile/08-MEASUREMENTS.md` - 게이트 전량 결과 + 5개 표
  + SC1~SC5 매핑(이전 세션 작성), 이번 세션에서 표 4(375px)를 quick g6u 반영 전/후로 갱신
- `docs/making-of.md` - Phase 8 이야기 추가(이전 세션 커밋, PLAT-03)

## Decisions Made

- Task 3 체크포인트 대기 중 발견된 폰 헤더 내비 결함은 이 플랜이 직접 고치지 않았다 — 이미
  quick task 260827-g6u가 플랜 범위 밖에서 완결된 수정(계획·베이스라인·구현·델타 검증 4커밋)을
  마쳤음을 확인했고, 중복 수정 대신 `08-MEASUREMENTS.md`만 그 결과를 반영해 갱신했다.
- 375px 표는 수정 전/후 값을 같은 표에 나란히 남기고 이전 값을 지우지 않았다 — 측정 종합
  문서는 감사 가능한 기록이어야 하며, "왜 숫자가 바뀌었는지"를 후속 독자가 재구성할 수 있어야
  한다는 원칙에 따름.

## Deviations from Plan

None - 계획된 세 태스크(게이트 실행+배포+측정, Making-of 갱신, 실기기 UAT)를 모두 그대로
수행했다. 체크포인트 대기 중 발생한 외부 변경(quick g6u)에 대한 대응은 플랜의 "Making-of는
docs/making-of.md 최신화, 08-MEASUREMENTS.md는 이 페이즈 숫자 종합"이라는 기존 범위 안에서
처리했으며 신규 코드 변경은 없었다.

## Issues Encountered

None beyond what Task 1의 SUMMARY 이미 기록한 것(e2e-progress g4 시나리오 버그, Rule 1 자동
수정, 커밋 8598ef8) — 이번 세션(Task 3)에서는 추가 이슈 없음.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 8의 다섯 성공 기준(SC1~SC5)이 자동 측정 + 실기기 UAT 승인으로 전부 충족됐다.
- 아이패드·폰 실기기 UAT가 결함 없이 승인됐으므로 이 플랜을 마지막으로 Phase 8 완료 조건이
  갖춰졌다 — 페이즈 완료 표시 자체는 오케스트레이터의 검증 게이트 몫이다.
- **다음 마일스톤 백로그 후보:** `cacheComponents` 마이그레이션(D8-A) — 이번 페이즈는 plain
  static generation(`generateStaticParams`, revalidate 없음)으로 충분했으나, 콘텐츠 라우트가
  실제로 빌드 후 갱신돼야 하는 요구가 생기면(예: 레슨 콘텐츠를 재배포 없이 수정) 재론 조건이
  성립한다.
- **잔존 관찰(회귀 아님):** 375px M3 120건(공유 배지 캡션·MDX 프로즈 콘텐츠) — 08-05가 이미
  사람 판단으로 확정한 항목, WINDOWS.md #10에 open으로 남아 있으며 이번 세션에서 값만 갱신했다.

---
*Phase: 08-performance-and-mobile*
*Completed: 2026-08-27*
