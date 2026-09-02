# Deferred Items — quick 260902-wk7

## Pre-existing lint failure in site-nav.tsx (out of scope)

`npm run lint` fails with 2 errors in `src/components/site-nav.tsx` (lines 172, 189):
`react-hooks/set-state-in-effect` — "Calling setState synchronously within an effect
can trigger cascading renders."

Confirmed pre-existing: `git stash` reported "No local changes to save" before any
task edits in this quick task, and the errors reproduce identically against HEAD
before this quick task's commits. Neither `site-nav.tsx` nor any file it depends on
was touched by this plan's tasks (`globals.css`, `trace-editor.tsx`, `run-python.tsx`,
`run-sql.tsx`). Per the executor scope boundary rule, pre-existing failures in
unrelated files are logged here rather than auto-fixed.

`npx tsc --noEmit`, `node scripts/check-brand.mjs`, and
`node scripts/check-design-tokens.mjs` all pass cleanly for the files this plan
touches. Only the full-repo `npm run lint` step surfaces the unrelated site-nav.tsx
failure.

### RESOLVED

두 위반을 effect 내부 setState 대신 React "adjusting state during render" 패턴으로
옮겨 해소했다. `mountedMenu`(드롭다운)·`panelMounted`(햄버거) 마운트 게이트는
openMenu/open 변화에 맞춰 파생되는 상태이므로, effect가 아니라 렌더 중 값이 실제로
다를 때만 setState하도록 재작성했다(렌더 루프 방지 가드 포함). reduced-motion 즉시
언마운트 분기는 `prefersReducedMotion()` 헬퍼로 보존. `npm run lint`가 0에러/0경고로
통과하며, 드롭다운 reveal/전환/conceal·햄버거 펼침/접힘·onAnimationEnd 언마운트가
아이패드(768)·모바일(375) 폭에서 회귀 없이 동작함을 실측 확인했다. tsc·build·brand·
design-token 게이트도 모두 통과.
