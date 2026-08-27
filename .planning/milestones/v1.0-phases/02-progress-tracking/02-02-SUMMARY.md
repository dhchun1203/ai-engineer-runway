---
phase: 02-progress-tracking
plan: 02
subsystem: progress-tracking
tags: [nextjs-server-actions, cookies, useOptimistic, css-keyframes, has-selector, supabase]

requires:
  - phase: 02-progress-tracking (02-01)
    provides: "supabaseAdmin 서버 전용 클라이언트, progress-store.ts(readCompletedLessonIds/setLessonCompletion), public.progress 테이블(RLS 기본 차단)"
provides:
  - "src/lib/unlock-secret.ts — isValidUnlockValue 순수 판정 함수 + UNLOCK_COOKIE_NAME 상수, 02-03/02-04가 그대로 재사용"
  - "src/lib/auth.ts — hasUnlockCookie() 단일 게이트 헬퍼, 모든 페이지·Server Action이 이걸로만 잠금 확인"
  - "src/app/lesson/[lessonId]/actions.ts — toggleLessonComplete Server Action (재검증 → slug 검증 → 저장 → revalidate 순서 고정)"
  - "src/components/complete-button.tsx — 낙관적 완료 토글 클라이언트 아일랜드 (useOptimistic, 로컬 done state 없음)"
  - "src/components/progress-error.tsx — ProgressReadError, D-31 조회 실패 배너 (02-03/02-04가 그대로 재사용)"
  - "src/app/unlock/route.ts + src/app/unlock/done/page.tsx — 비밀 링크 잠금 해제 흐름"
  - "완료 전환 애니메이션 + 다음 레슨 CSS :has() 강조 패턴 (globals.css)"
  - "scripts/e2e-progress.mjs — 실 서버·실 DB 종단 게이트 (b~g5 시나리오)"
  - "scripts/check-progress-gates.mjs G4/G9/G11/G12 — 02-03/02-04가 확장할 정적 게이트"
affects: [02-03, 02-04]

actuals:
  tokens: 9444
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "쿠키 게이트 단일 함수(hasUnlockCookie) — 페이지·Server Action이 각자 cookies()를 다루지 않고 이 함수 하나만 호출"
    - "Server Action 자체 재검증 — UI 미노출을 인가로 착각하지 않고, 함수 최상단에서 쿠키·slug를 다시 확인한 뒤에만 쓰기"
    - "useOptimistic + prop 수렴 — 완료 여부를 담는 로컬 useState를 두지 않고 서버가 revalidatePath로 내려주는 새 prop에 수렴시켜 기기 간 정합성 유지"
    - "CSS :has() 진행률 강조 — 새 상태 관리·JS 없이 기존 data-pager DOM 계약을 그대로 활용한 점진적 향상"
    - "실 서버·실 DB 종단 게이트 스크립트 — next dev를 자식 프로세스로 띄워 쿠키 헤더 조작으로 5+5 시나리오를 왕복 검증, 테스트 러너 도입 없이 정확성 확보"

key-files:
  created:
    - src/lib/unlock-secret.ts
    - src/lib/auth.ts
    - src/app/lesson/[lessonId]/actions.ts
    - src/components/complete-button.tsx
    - src/components/progress-error.tsx
    - src/app/unlock/route.ts
    - src/app/unlock/done/page.tsx
    - scripts/e2e-progress.mjs
  modified:
    - src/app/lesson/[lessonId]/page.tsx
    - src/app/globals.css
    - scripts/check-progress-gates.mjs

key-decisions:
  - "Task 1(tracer) 완료 후 인터랙티브 체크포인트를 실제로 정지·대기 — workflow.auto_advance/_auto_chain_active가 둘 다 false라 config mode:\"yolo\"와 무관하게 tracer feedback gate가 STOP을 요구했고, 그대로 따랐다"
  - "사용자가 iPad 전용 환경이라 devtools 수동 쿠키 검증이 불가능함을 밝히고, 자동화된 e2e-progress.mjs 4단계 실 서버·실 DB 증거만으로 체크포인트를 승인 — 실제 수동 검증은 Task 2가 만드는 /unlock 링크로 iPad에서 나중에 수행하기로 함"
  - "D-19를 '/unlock/done 안내 화면 + 한 번의 탭'으로 해석 — UI-SPEC이 정의한 성공/실패 화면과 D-19 원문의 '홈으로 자동 이동'을 모두 만족시키기 위한 절충 (plan에 이미 기록된 편차, 그대로 구현)"
  - "complete-button.tsx는 useState(initialDone)을 두지 않고 useOptimistic의 prop 수렴에만 의존 — RESEARCH 예시 코드와 다른 설계, G12로 회귀 방지"
  - "check-progress-gates.mjs G12 정규식이 파일 자신의 '왜 useState(initialDone)을 안 쓰는가' 설명 주석에 오탐하는 것을 실행 중 발견 — stripJsLineComments로 주석을 제외하고 코드만 스캔하도록 즉시 수정"

patterns-established:
  - "게이트 스크립트가 .ts 순수 모듈을 별도 트랜스파일러 없이 Node 22.6+ 내장 타입 스트리핑으로 직접 import — ts-node/tsx 미도입 원칙(PITFALLS Pitfall 1) 유지하며 실행 검증 확보"
  - "정적 게이트는 자기 자신이 검사하는 파일의 설명 주석에 오탐하지 않도록 주석을 제외하고 스캔한다 (G3의 자기-경로 제외 관례를 코드 주석 제외로 확장)"

requirements-completed: [TRACK-01, TRACK-02]

coverage:
  - id: D1
    description: "isValidUnlockValue 순수 판정 함수 — 시크릿 미설정/16자 미만/불일치를 모두 false로, 정상 일치만 true로 판정"
    requirement: "PLAT-02"
    verification:
      - kind: unit
        ref: "node scripts/check-progress-gates.mjs (G11: node:assert로 5개 판정 직접 실행, 비교 로직을 뒤집으면 게이트가 실패함을 수동 확인)"
        status: pass
    human_judgment: false
  - id: D2
    description: "toggleLessonComplete Server Action — hasUnlockCookie 재검증과 getLessonBySlug 존재 검증이 setLessonCompletion 쓰기보다 항상 먼저 실행됨"
    requirement: "PLAT-02"
    verification:
      - kind: other
        ref: "node scripts/check-progress-gates.mjs (G4: 문자 위치 비교)"
        status: pass
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs 시나리오 d/e (실제 upsert/delete 왕복이 쿠키 게이트를 통과해야만 반영됨)"
        status: pass
    human_judgment: false
  - id: D3
    description: "완료 토글이 브라우저 → 쿠키 게이트 → Server Action → Supabase → 서버 재렌더까지 왕복하고 새로고침 후에도 유지된다 (TRACK-01)"
    requirement: "TRACK-01"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs 시나리오 c/d/e (쿠키+DB 조합별 data-complete-state 서버 렌더 직접 확인)"
        status: pass
    human_judgment: false
  - id: D4
    description: "완료 취소(토글 역방향)가 데이터·렌더 양쪽에서 확인된다 (TRACK-02)"
    requirement: "TRACK-02"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs 시나리오 e (DB delete 후 todo 복귀)"
        status: pass
    human_judgment: false
  - id: D5
    description: "쿠키 없는 방문자에게는 진도 UI 마커가 DOM에 0건이고 레슨 본문·제목은 Phase 1과 동일하게 공개된다 (D-18/D-20)"
    requirement: "PLAT-02"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs 시나리오 b (data-progress-ui 0건 + 레슨 제목 문자열 검사)"
        status: pass
    human_judgment: false
  - id: D6
    description: "/unlock 비밀 링크 — 올바른 key는 HttpOnly 잠금 쿠키를 발급하고 key 값을 리다이렉트 목적지 URL에 싣지 않으며, 틀린/누락 key는 쿠키를 발급하지 않는다"
    requirement: "PLAT-02"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs 시나리오 g1/g2/g3 (redirect:'manual'로 Location·Set-Cookie 헤더 직접 검사)"
        status: pass
    human_judgment: false
  - id: D7
    description: "/unlock이 발급한 쿠키를 그대로 재사용하면 레슨 페이지의 진도 UI가 실제로 렌더된다 — 발급 경로와 게이트 판정 경로가 같은 시크릿 비교 로직을 공유함을 증명"
    requirement: "PLAT-02"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs 시나리오 g4"
        status: pass
    human_judgment: false
  - id: D8
    description: "/unlock/done 성공·실패 화면이 UI-SPEC Copywriting Contract의 제목·본문·CTA를 각각 렌더한다"
    requirement: "PLAT-02"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-progress.mjs 시나리오 g5"
        status: pass
    human_judgment: false
  - id: D9
    description: "완료 전환 시 체크 아이콘 fade+scale-in과 accent ring/glow 연출이 실제로 성취감 있게 보이고, prefers-reduced-motion 환경에서는 연출 없이 상태만 즉시 바뀐다 (D-23)"
    verification: []
    human_judgment: true
    rationale: "workflow.human_verify_mode=end-of-phase(기본값) — Task 3의 <verify><human-check>는 지금 실행되지 않고 /gsd-verify-work의 end-of-phase UAT 흐름에서 harvest된다. CSS 구조(keyframes 2개 + reduced-motion 무효화 블록)는 코드 검토로 확인했으나 '성취감이 드는가'는 시각 판단이라 자동화 대상이 아니다. .planning/WINDOWS.md에 unrun-verify로 기록함."
  - id: D10
    description: "완료 전환과 동시에 다음 레슨 버튼이 시각적으로 강조되고 자동 이동은 없다 (D-22), 다시 눌러 미완료로 되돌리면 강조도 함께 풀린다"
    verification: []
    human_judgment: true
    rationale: "CSS :has() 선택자가 올바른 셀렉터 구조로 작성되었음은 코드 검토로 확인했으나(data-progress-controls 래퍼 안의 data-complete-state=done이 data-pager=next를 지목), 실제 시각적 강조 여부와 :has() 브라우저 지원 확인은 end-of-phase UAT에서 harvest."
  - id: D11
    description: "ProgressReadError가 진행률 조회 실패 시 완료 버튼/조회 실패 안내 자리에 렌더되고 0%나 수치를 함께 보여주지 않는다 (D-31)"
    requirement: "PLAT-02"
    verification: []
    human_judgment: true
    rationale: "e2e-progress.mjs는 실제 Supabase 왕복만 검증하므로 progress-store의 ok:false 실패 경로를 인위적으로 재현하지 않는다 — 코드 검토로 progressRead.ok 분기와 ProgressReadError 렌더링 조건은 확인했으나 자동 재현 테스트는 없음. 코드는 명확: unlocked && !progressRead.ok일 때만 렌더."

duration: "약 35분 (Task 1 완료 후 tracer 체크포인트 승인 대기 포함)"
completed: 2026-08-24
status: complete
---

# Phase 2 Plan 2: 완료 토글 트레이서 + 비밀 링크 + 완료 연출 Summary

**쿠키 게이트 + Server Action 재검증 + useOptimistic + revalidatePath로 완료 토글이 실제 브라우저-Supabase 왕복을 끝까지 증명하고, `/unlock` 비밀 링크와 완료 전환 애니메이션까지 완성**

## Performance

- **Duration:** 약 35분 (Task 1 tracer 커밋 후 인터랙티브 체크포인트에서 사용자 승인 대기 포함)
- **Started:** 2026-08-24 (STATE.md 세션 기준)
- **Completed:** 2026-08-24T08:24:15Z
- **Tasks:** 3 (Task 1 tracer + 체크포인트 승인, Task 2 auto, Task 3 auto)
- **Files modified:** 11 (created 8, modified 3)

## Accomplishments

- `src/lib/unlock-secret.ts`: 시크릿 미설정·16자 미만을 무조건 false로 처리하는 `isValidUnlockValue` — G11이 5개 판정을 `node:assert`로 실제 실행 검증하고, 비교 로직을 뒤집으면 게이트가 실패함을 수동으로 확인
- `src/lib/auth.ts`: `hasUnlockCookie()` 단일 게이트 함수 — 페이지·Server Action 어디서도 `cookies()`를 직접 다루지 않음
- `src/app/lesson/[lessonId]/actions.ts`: `toggleLessonComplete` Server Action — 쿠키 재검증 → slug 존재 검증(`getLessonBySlug`) → `setLessonCompletion` 저장 → 3개 경로 `revalidatePath` 순서를 G4가 문자 위치로 고정
- `src/app/lesson/[lessonId]/page.tsx`: `force-dynamic` 명시 선언, `hasUnlockCookie()`를 `notFound()`보다 먼저 무조건 호출, 완료 버튼/조회 실패 배너를 `LessonPager`와 함께 `data-progress-controls` 래퍼로 감싸 CSS `:has()` 강조의 대상 구조 확보
- `src/components/complete-button.tsx`: `useOptimistic` 낙관적 토글, 완료 여부를 담는 로컬 `useState` 없이 서버 `initialDone` prop 수렴에만 의존(G12가 회귀 방지), 완료 전환 애니메이션 클래스를 상태에 따라 조건부 적용
- `src/components/progress-error.tsx`: `ProgressReadError` — D-31 조회 실패 배너, 진행률 수치는 절대 표시하지 않음
- `src/app/unlock/route.ts` + `src/app/unlock/done/page.tsx`: 비밀 링크 발급 — 올바른 key만 `HttpOnly`/`sameSite=lax`/10년 쿠키를 발급하고, 리다이렉트 목적지 URL에는 key 값을 절대 싣지 않음(`/unlock/done?state=ok|invalid`)
- `src/app/globals.css`: 완료 체크 아이콘 fade+scale-in, accent ring/glow 확장 `@keyframes` 2개(새 애니메이션 라이브러리 없음), `prefers-reduced-motion: reduce`에서 전부 무효화, `[data-progress-controls]:has([data-complete-state="done"]) [data-pager="next"]`로 다음 레슨 CTA 강조(점진적 향상)
- `scripts/e2e-progress.mjs`: 실제 `next dev` 서버 + 실제 Supabase DB로 10개 시나리오(쿠키 없음/있음, DB done/todo 왕복, `/unlock` 발급 성공·실패·미입력, 발급 쿠키 재사용, `/unlock/done` 두 화면 문구)를 한 명령으로 재현
- `scripts/check-progress-gates.mjs`: G4(인가 검사 → 쓰기 순서), G9(force-dynamic 선언), G11(`isValidUnlockValue` 실행 검증), G12(로컬 `useState(initialDone)` 회귀 방지) 4개 정적 게이트 추가

## Task Commits

Each task was committed atomically:

1. **Task 1: 완료 토글 트레이서 (브라우저→Supabase 왕복)** — `d08103e` (feat), 이어서 인터랙티브 tracer 체크포인트에서 사용자 승인
2. **Task 2: /unlock 비밀 링크** - `176150c` (feat)
3. **Task 3: 완료 연출·다음 레슨 강조·조회 실패 안내·게이트 확장** - `aae33de` (feat)

**Plan metadata:** (다음 커밋에서 기록)

## Files Created/Modified

- `src/lib/unlock-secret.ts` - 잠금 값 판정 순수 함수
- `src/lib/auth.ts` - 쿠키 기반 잠금 해제 판정 단일 함수
- `src/app/lesson/[lessonId]/actions.ts` - 완료 토글 Server Action
- `src/app/lesson/[lessonId]/page.tsx` - force-dynamic, 게이트, 완료 버튼/조회 실패 분기, 페이저 래퍼
- `src/components/complete-button.tsx` - 낙관적 완료 토글 클라이언트 아일랜드
- `src/components/progress-error.tsx` - 진행률 조회 실패 배너
- `src/app/unlock/route.ts` - 비밀 링크 GET Route Handler
- `src/app/unlock/done/page.tsx` - 잠금 해제 성공/실패 안내 화면
- `src/app/globals.css` - 완료 연출 keyframes + `:has()` 다음 레슨 강조 + reduced-motion
- `scripts/e2e-progress.mjs` - 종단 게이트 스크립트 (b~g5 시나리오)
- `scripts/check-progress-gates.mjs` - G4/G9/G11/G12 정적 게이트 추가

## Decisions Made

- Task 1(tracer) 완료 직후 인터랙티브 체크포인트에서 실제로 정지·대기 — `.planning/config.json`의 `workflow.auto_advance`와 `workflow._auto_chain_active`가 둘 다 `false`라, `mode: "yolo"`와 무관하게 tracer feedback gate 프로토콜이 정지를 요구했고 그대로 따름
- 사용자가 iPad 전용 환경이라 devtools 수동 쿠키 검증이 불가능함을 밝히고, `e2e-progress.mjs`의 실 서버·실 DB 4단계 자동 증거만으로 체크포인트를 승인 — 실제 수동 검증은 Task 2가 만든 `/unlock` 링크로 iPad에서 나중에 수행하기로 합의
- D-19를 "`/unlock/done` 안내 화면 + 한 번의 탭"으로 해석(plan에 이미 명시된 편차, 그대로 구현) — UI-SPEC의 성공/실패 화면 정의와 D-19 원문의 "홈으로 이동"을 모두 만족
- `complete-button.tsx`는 `useState(initialDone)`을 두지 않고 `useOptimistic`의 prop 수렴에만 의존 — 다른 기기에서 바뀐 상태가 반영되지 않는 정합성 구멍을 피함, G12로 회귀 방지
- `check-progress-gates.mjs` G12 정규식이 파일 자신의 "왜 `useState(initialDone)`을 안 쓰는가" 설명 주석에 오탐하는 것을 실행 중 발견하고 즉시 수정(아래 Deviations 참고)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] check-progress-gates.mjs G12가 설명 주석의 리터럴에 오탐**
- **Found during:** Task 3 (`node scripts/check-progress-gates.mjs` 최초 실행)
- **Issue:** `complete-button.tsx` 파일 상단 주석이 "RESEARCH 예시 코드는 `useState(initialDone)`을 함께 두는데..."라고 설명하는데, G12의 정규식이 이 주석 텍스트까지 스캔해 실제로는 존재하지 않는 회귀를 있다고 판정
- **Fix:** `stripSqlComments`와 같은 패턴으로 `stripJsLineComments` 헬퍼를 추가해 `//`로 시작하는 줄을 스캔 대상에서 제외
- **Files modified:** scripts/check-progress-gates.mjs
- **Verification:** 수정 후 `node scripts/check-progress-gates.mjs` 통과 확인. 회귀 탐지 능력 자체는 별도로 `unlock-secret.ts`의 비교 로직을 임시로 뒤집어 G11이 실패함을 확인한 뒤 원상복구하는 방식으로 검증(G12는 코드 리뷰로 정규식 로직만 확인)
- **Committed in:** `aae33de` (Task 3 commit — 발견과 수정이 같은 태스크 내에서 이루어져 별도 커밋 없음)

---

**Total deviations:** 1 auto-fixed (1 bug). **Impact:** 게이트 스크립트 자신의 정확성 문제이며 애플리케이션 코드에는 영향 없음. 범위 확장 없음.

## Issues Encountered

- `npm run lint`가 이 Plan이 만들지 않은 Phase 1 파일 2곳(`src/components/lesson-nav.tsx`, `src/components/theme-toggle.tsx`)에서 사전 존재하는 오류 2건 + 경고 1건을 계속 보고함(02-01에서 이미 확인·기록된 것과 동일한 이슈, `.planning/phases/02-progress-tracking/deferred-items.md` 참고). 이 Plan이 수정한 파일만 골라 `npx eslint <이 Plan의 파일들>`로 실행하면 0건 통과 — 위 자동화 검증 로그에서 확인됨. 범위 밖이므로 수정하지 않음.
- Task 3의 `<verify><human-check>` 5개 항목(완료 연출 체감, 다음 레슨 강조, reduced-motion, iPad 히트 영역)은 `workflow.human_verify_mode=end-of-phase`(기본값)에 따라 지금 실행되지 않음 — `/gsd-verify-work`의 end-of-phase UAT 흐름에서 harvest됨. `.planning/WINDOWS.md`에 `unrun-verify`로 기록.

## User Setup Required

None - 이 Plan 자체는 추가 외부 서비스 설정이 필요 없음(02-01의 Vercel 환경 변수 등록이 여전히 남아 있으나 이 Plan의 검증은 `.env.local` 기준으로 전부 완료됨).

## Next Phase Readiness

- `unlock-secret.ts`/`auth.ts`/`progress-error.tsx`/`check-progress-gates.mjs`의 확정된 인터페이스와 게이트 패턴이 02-03(모듈·Step 진행률)·02-04(홈 대시보드)가 탐색 없이 바로 소비 가능한 상태로 준비됨
- 완료 토글의 전체 아키텍처 골격(쿠키 게이트·서버 전용 저장소·낙관적 아일랜드·revalidate)이 실 서버·실 DB로 검증된 상태로 고정됨 — 이후 Plan들이 옆으로 확장만 하면 됨
- TRACK-01(02-01·02-02 공동 소유)은 이 Plan의 SUMMARY로 형제 Plan이 모두 끝나 `requirements.ready-ids`가 ready로 판정하는 즉시 자동 완료 표시됨. TRACK-02(이 Plan 단독 소유)는 즉시 완료 표시됨. PLAT-02(4개 Plan 공동 소유)는 02-03/02-04가 아직 SUMMARY가 없어 계속 대기 상태로 남음(의도된 동작, shared-ID gate)
- iPad에서의 실제 수동 검증(잠금 해제 → 완료 토글 → 새로고침 유지 → 다음 레슨 강조 → reduced-motion)이 아직 수행되지 않음 — `/unlock` URL 형식은 최종 보고에 기록(시크릿 값 자체는 제외)
- 블로커 없음

## Self-Check: PASSED

- All 11 created/modified files verified present on disk with expected content
- All 3 task commits (`d08103e`, `176150c`, `aae33de`) verified present in `git log --oneline --all`
- Re-ran plan-level `<verification>`: `npx tsc --noEmit && node scripts/check-progress-gates.mjs && node scripts/check-brand.mjs && node scripts/check-manifest.mjs && node --env-file=.env.local scripts/e2e-progress.mjs && node --env-file=.env.local scripts/check-supabase-progress.mjs` — all exit 0
- G11 regression-catch verified manually (flipped `candidate === secret` → G11 failed; restored → passed again)
- `npx eslint` scoped to this Plan's files (all tasks) — 0 issues; full `npm run lint` still reports 2 pre-existing Phase 1 issues (out of scope, unrelated files)

---
*Phase: 02-progress-tracking*
*Completed: 2026-08-24*
