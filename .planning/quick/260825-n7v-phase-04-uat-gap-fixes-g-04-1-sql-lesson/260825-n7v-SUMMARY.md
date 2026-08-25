---
quick_id: 260825-n7v
slug: phase-04-uat-gap-fixes-g-04-1-sql-lesson
status: complete
date: 2026-08-25
gap_closure: true
gap_ids: [G-04-1, G-04-2]
commits: [f750017]
files_modified:
  - src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx
---

# Summary: Phase 04 UAT 결함 2건 수정

두 결함 모두 한 파일, 한 커밋(`f750017`)으로 닫혔다. 9줄 추가 / 7줄 삭제.

## G-04-1 (major) — 2편 준비 블록의 스키마 충돌

준비 블록을 `DROP SCHEMA IF EXISTS practice CASCADE;`로 시작하게 바꾸고, 뒤따르는
`CREATE TABLE`에서 `IF NOT EXISTS`를 뗐다. 52행·96행 서술도 새 동작에 맞춰 교체.

`DROP` 선행을 고른 이유는 본문이 **이미 약속하고 있던** 두 문장 — "앞 레슨을 건너뛰었어도
이 블록 하나로 준비가 끝납니다", "몇 번을 실행해도 안전합니다" — 을 문장 약화가 아니라
동작 수정으로 참으로 만들기 때문이다. 1편 정리 SQL을 '필수'로 격상하는 대안은 버렸다:
학습자가 그 한 줄을 건너뛰는 순간 다시 깨지므로 근본 수정이 아니다.

**재검증 (Supabase 실행):**
- 1편 잔재(`score` 없는 `enrollments`)를 만든 뒤 새 준비 블록 실행 → 성공. 예전엔 42703.
- 같은 블록 2회 연속 실행 → students/subjects/enrollments = 3/3/5 유지. 중복 INSERT 없음.
- 하위 9개 쿼리 행 수 2/5/5/3/3/3, 수학 평균 73.3333 — 전부 본문 주장과 일치.
- 정리 후 `practice` 잔여 0, `public.progress` 무영향.

## G-04-2 (cosmetic) — 복사 버튼이 코드 첫 줄을 가림

첫 줄 주석을 두 줄로 나눠 655px 예산 안에 넣었다. 실측 첫 줄 350px, 버튼 시작점 714px.

**재검증 (Playwright, 로컬 프로덕션 빌드):** Step 1 10편 39개 코드 블록 전부 겹침 0건.
증거: `.planning/ui-reviews/04-uat/after-fix-portrait-light.png`

## 게이트

| 게이트 | 결과 |
|--------|------|
| `check-lesson-structure.mjs` | 통과 (10개 레슨, 6개 검사) |
| `check-brand.mjs` | 통과 (85개 파일, 위반 0) |
| `npm run build` | 통과 (44 페이지) |
| `npm run lint` | **실패 6건 — 전부 기존 문제, 이번 변경과 무관** |

## 남긴 것 (의도적)

- **G-04-2 근본 원인 이월 → Phase 06.** 코드 블록 첫 줄에 버튼 폭만큼의 우측 여유가 없는
  `globals.css` 구조는 그대로다. 지금은 콘텐츠 길이가 예산 안이라 발현되지 않을 뿐이므로,
  첫 줄이 긴 코드 블록을 새로 추가하면 재발한다. 전역 CSS 수정은 site-wide-design-polish의 일.
- **lint 실패 6건.** `src/components/lesson-nav.tsx`, `src/components/theme-toggle.tsx`의
  `react-hooks/set-state-in-effect` 등. 이번 작업 전부터 있던 문제라 범위 밖으로 두었다.
  `.claude/worktrees/agent-*` 에 남은 옛 사본까지 린트돼 같은 오류가 3배로 계상되고 있다 —
  worktree 정리도 함께 필요하다.
- **Phase 06 후보 2건.** 레슨 페이지에 `<main>` 랜드마크 없음. 상단 내비 링크 3개
  (`일정표` 36px, `소개` 24px, `Step 1` 39px) 가로 폭이 44px 미만 — 아이패드 우선 원칙 대비 미달.

## 연쇄 갱신

- `04-UAT.md`: 두 gap `status: resolved`, 테스트 1 `pass`(+`result_history`), `status: complete`
- `04-VERIFICATION.md`: `human_needed` → `passed`, 두 human_verification 항목의 종결 경위 기록
- `phase uat-passed 04 --require-verification` → `passed: true`, blockers 0
