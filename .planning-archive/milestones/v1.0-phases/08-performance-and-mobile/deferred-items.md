# Deferred Items — Phase 8 (performance-and-mobile)

Out-of-scope discoveries logged per executor scope-boundary rule (not fixed,
not re-triggered by later builds).

## 08-05

- **`src/components/schedule-table.tsx:190` — pre-existing ESLint error** (`react-hooks/immutability`:
  "Cannot reassign variable after render completes", `seenTodayAnchor` mutation inside
  `ScheduleTable`'s `.map()`). Confirmed present before this plan's changes
  (`git show 5396e9a:src/components/schedule-table.tsx` shows the same pattern at
  lines 163/180/181). Not touched by 08-05 Task 2 (which only edited
  `ScheduleLessonRow`'s JSX inside the `<Link>`). Out of scope per Rule 3 exclusion
  ("only auto-fix issues directly caused by the current task's changes").

## 해소 (2026-08-27, quick task 260827-mdz)

위 `schedule-table.tsx:190` 항목은 v1.0 마감 전 lint 정리에서 닫혔다 — 앵커 행을
렌더 전에 `rows.find`로 한 번 찾아 객체 동일성으로 판정하도록 바꿔 렌더 중 변수
재할당을 없앴다(커밋 `3e9bdfd`).

같은 퀵 태스크가 Phase 02·05 SUMMARY가 이월 기록으로 남긴 항목(`lesson-nav.tsx:4/10`,
`theme-toggle.tsx:15`)과, 감사에는 없었지만 Phase 8이 새로 만든 3건
(`api/progress/route.ts:79`, `dday-countdown-live.tsx:27`, `progress-provider.tsx:77`)도
함께 닫았다. `npm run lint`가 0 에러 0 경고다.

상세: `.planning/quick/260827-mdz-v1-0-lint-6-3-eslint-claude/260827-mdz-SUMMARY.md`
