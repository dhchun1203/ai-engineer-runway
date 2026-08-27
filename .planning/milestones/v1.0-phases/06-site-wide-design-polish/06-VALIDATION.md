---
phase: 06
slug: site-wide-design-polish
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-26
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `06-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | 전통적 테스트 러너 없음 — Node 표준 `assert/strict` 기반 게이트 스크립트(`scripts/check-*.mjs`) + `@playwright/test`(신규, D-98) |
| **Config file** | 없음 — 기존 컨벤션은 "설정 파일 없이 인자 없는 직접 실행". Playwright도 `chromium.launch()` 직접 호출로 `playwright.config.ts` 없이 컨벤션 유지 |
| **Quick run command** | `node scripts/check-design-tokens.mjs` |
| **Full suite command** | 기존 10종 + 신규 2종 순차 실행 (통합 러너 없음 — 각 스크립트 개별 호출) |
| **Estimated runtime** | 정적 게이트 ~초 단위 / Playwright 게이트 ~30–60초(dev 서버 기동 포함) |

---

## Sampling Rate

- **After every task commit:** `node scripts/check-design-tokens.mjs` (초 단위 정적 검사)
- **After every plan wave:** SC1~SC4 전부 + 기존 게이트 10종 전체
- **Before `/gsd-verify-work`:** 전체 스위트 그린 — D-94가 명시적 acceptance criteria로 못 박음
- **Max feedback latency:** 60초

---

## Per-Task Verification Map

> 이 Phase에는 확정 요구사항 ID가 없다(`ROADMAP.md`: "Requirements: TBD"). ROADMAP.md Phase 6 **성공 기준 4개(SC1~SC4)** 를 검증 단위로 삼는다. Task ID는 계획 확정 후 채운다.

| 성공 기준 | Behavior | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|
| SC1 (토큰만 쓴다) | `@theme` 밖 리터럴 색/타이포/임의값 대괄호 + Tailwind 기본 팔레트 클래스 0건 (D-88, D-96) | static | `node scripts/check-design-tokens.mjs` | ❌ W0 | ⬜ pending |
| SC1 (런타임 이탈) | 렌더된 레슨의 `getComputedStyle` 크기·굵기가 D-R4K-4의 5종/3굵기 집합 안 (D-89) | e2e | `node scripts/e2e-typography.mjs` | ❌ W0 | ⬜ pending |
| SC2 (6화면 같은 셸) | 아이패드 세로/가로에서 내비·카드·여백 체계 일관 (D-99: 폭 통일 아님, 패딩·gap·카드 체계 통일) | manual/visual | 자동화 대상 아님 — human-verify 체크포인트 | — | ⬜ pending |
| SC3 (375px 안 깨짐) | 오늘 카드·일정표·레슨 본문에서 `scrollWidth <= clientWidth` (D-91) | e2e | `node scripts/e2e-mobile-overflow.mjs` (또는 `e2e-typography.mjs`에 통합 — 계획 재량) | ❌ W0 | ⬜ pending |
| SC4 (회귀 없음) | 기존 게이트 10종 전부 통과 (D-94) | static + e2e | `check-brand` `check-lesson-structure` `check-manifest` `check-pace` `check-progress-gates` `check-progress-math` `check-schedule` `check-supabase-progress` `e2e-progress` `e2e-today` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install -D @playwright/test && npx playwright install chromium` — D-98, D-89/D-91의 유일한 경로 (기존 `e2e-*.mjs`는 순수 HTTP라 `getComputedStyle`/`scrollWidth` 측정 불가)
- [ ] `scripts/check-design-tokens.mjs` — SC1 정적 커버 (D-88, D-96)
- [ ] `scripts/e2e-typography.mjs` — SC1 런타임 커버 (D-89)
- [ ] 375px 뷰포트 오버플로 검사 — SC3 커버 (D-91)

> **순서 제약 (D-95):** `check-design-tokens.mjs`의 "임의값 대괄호 0건" 규칙은 66곳 치환이 **끝난 뒤** 활성화되어야 한다. 게이트를 먼저 켜면 즉시 66건 실패로 막힌다. Wave 0에서 스크립트를 작성하되 이 규칙만 마지막 웨이브에서 켜거나, 치환 태스크를 게이트 활성화보다 앞 웨이브에 배치할 것.

---

## Manual-Only Verifications

| Behavior | 성공 기준 | Why Manual | Test Instructions |
|---|---|---|---|
| 6종 화면이 "같은 셸"로 읽히는가 | SC2 | 시각적 일관성 판단은 픽셀 assert로 환원되지 않는다 | 아이패드 세로(768×1024)·가로(1024×768)에서 `/` `/curriculum` `/schedule` `/lesson/1-4-sql-queries-and-joins` `/step/1` `/about` 6개를 순서대로 열고, 내비 위치·컨테이너 패딩·카드 모서리/그림자·섹션 간 여백이 같은 규칙으로 보이는지 확인 |
| 실기기 iPad Safari 동작 (D-93) | SC2, SC3 | 지금까지 측정이 전부 Playwright Chromium. Safari `-webkit-` 차이·실제 터치 히트박스·100vh 주소창 문제는 자동화 불가 | 실제 아이패드 Safari로 배포 URL 접속 → 6종 화면 세로/가로, 구간 테이프 탭 이동, 코드 블록 가로 스크롤, 44px 터치 타깃 확인 |
| 쿠키 있는 홈의 빈 캔버스 판정 (D-97) | — (D-90 범위 결정 입력) | 판정 기준이 "채워진 느낌"이라 사람 눈이 필요. 단 측정 자체(768×1024 스크린샷)는 자동화 가능 | 잠금 해제 쿠키가 있는 상태로 768×1024 홈 스크린샷 1장 → 첫 화면 하단 빈 영역이 뷰포트 높이의 30% 미만이면 홈 작업 없이 D-90 종료 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`@playwright/test`, 3 new gate scripts)
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
