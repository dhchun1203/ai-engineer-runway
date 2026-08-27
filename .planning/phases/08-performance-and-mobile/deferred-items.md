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
