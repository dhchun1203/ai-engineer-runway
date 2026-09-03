---
quick_id: 260904-2wd
slug: review-lessons-overview
title: 커리큘럼 목록에서 "더 공부할 레슨" 한눈에 — 줄 표시 + 개수 배지
status: complete
date: 2026-09-04
commits:
  - 4e6f62d
  - 9391ac2
---

# 요약

needs_review(quick 260904-241)로 표시한 레슨을 커리큘럼 목록에서 바로 보이게 했다.
사용자 선택: **목록에 표시 + 개수 배지**(전용 페이지 아님).

- **Step 페이지(/step/[stepId]) 모듈 아코디언**: 표시한 레슨 줄에 🚩 마크(완료 ✓와 공존),
  모듈 헤더에 "더 공부 N" 개수 배지(아코디언을 열지 않아도 보임).
- **커리큘럼 페이지(/curriculum) StepCard**: Step 단위 "더 공부 N" 배지(카드 맨 윗줄).

## 커밋(원자적)

- `4e6f62d` — 데이터 경로: `readNeedsReviewLessonIds()` + `/api/progress`의 `needsReviewSlugs` + provider 타입
- `9391ac2` — UI: 공용 표시자 + 모듈 아코디언 줄 마크·개수 + StepCard Step 개수 + 커리큘럼 페이지 slug 전달

## 변경 파일

- `src/lib/note-store.ts` — readNeedsReviewLessonIds(needs_review=true인 lesson_id Set)
- `src/app/api/progress/route.ts` — 응답에 needsReviewSlugs(실패 시 null 강등)
- `src/components/progress-provider.tsx` — ProgressData.needsReviewSlugs
- `src/components/needs-review-indicator.tsx` (신규) — NeedsReviewMark / NeedsReviewCount(action 색)
- `src/components/module-accordion.tsx` — 줄 🚩 + 모듈 헤더 개수
- `src/components/step-card.tsx` — stepLessonSlugs prop + Step 개수 배지
- `src/app/curriculum/page.tsx` — getOrderedLessons로 Step별 슬러그 계산해 StepCard에 전달

## 검증

- `npm run build` — Compiled successfully.
- 게이트: 신규 실패 0(잔여 G22는 선행 이슈, 별도 태스크 task_f9e3a355).
- 읽기 경로 end-to-end: Step 1 레슨 2개를 SQL로 needs_review=true → `/api/progress`의
  needsReviewSlugs에 반영 확인(curl) → 테스트 2개 원복. (관찰: 사용자가 이미 iPad에서
  1-5 모듈 레슨 2개를 표시해 둔 상태였음 — 배포된 기능이 실사용 중임을 확인.)
- 커리큘럼·Step 페이지 tablet(768) 스모크: 렌더 정상, 앱 콘솔 에러 0(HMR ws 잡음만).
- 배지 실제 표출은 잠금 해제 세션에서만 — 대화형 시각 확인은 사용자가 배포 iPad에서.

## 관련
- 표시 자체(토글·프롬프트)는 quick 260904-241.
