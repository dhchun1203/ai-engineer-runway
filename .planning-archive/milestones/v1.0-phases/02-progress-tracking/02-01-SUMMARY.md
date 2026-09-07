---
phase: 02-progress-tracking
plan: 01
subsystem: database
tags: [supabase, postgres, rls, server-only, service-role, next.js]

requires:
  - phase: 01-deployed-curriculum-skeleton
    provides: Next.js 16 App Router 스캐폴드, Vercel 배포(ai-engineer-runway), 커리큘럼 Velite 매니페스트(이 Plan은 직접 소비하지 않음 — 02-03이 소비)

provides:
  - "src/lib/supabase/admin.ts — 앱 전체에서 유일한 service_role Supabase 클라이언트(server-only 마커)"
  - "src/lib/progress-store.ts — 진도 읽기/쓰기 데이터 접근 계층, 조회 실패와 완료 0건을 타입으로 구분(ProgressRead)"
  - "public.progress 테이블(호스티드 Postgres, ai-news-briefing 프로젝트) — RLS 활성, 정책 0개(기본 차단)"
  - "supabase/migrations/20260824120000_create_progress.sql — 커밋된 단일 마이그레이션"
  - ".env.example — 서버 전용 환경 변수 4종 계약 문서"
  - "scripts/check-progress-gates.mjs — G1/G2/G3/G5/G6/G7/G8/G10 정적 보안 게이트"
  - "scripts/check-supabase-progress.mjs — 실 DB write→read→delete 왕복 + anon 키 기본 차단 반증 게이트"
affects: [02-02, 02-03, 02-04]

actuals:
  tokens: 6418
  tasks: 3
  commits: 2

tech-stack:
  added: ["@supabase/supabase-js@2.112.3", "server-only@0.0.1"]
  patterns:
    - "service_role 단일 클라이언트 + RLS 정책 0개(default-deny) — 앱 로직은 auth.uid()에 의존하지 않는다"
    - "정적 불변식 게이트(check-progress-gates.mjs)와 실 DB 왕복 게이트(check-supabase-progress.mjs)를 분리 — 서로 다른 실패 모드를 각각 좁게 검증"

key-files:
  created:
    - src/lib/supabase/admin.ts
    - src/lib/progress-store.ts
    - supabase/migrations/20260824120000_create_progress.sql
    - .env.example
    - scripts/check-progress-gates.mjs
    - scripts/check-supabase-progress.mjs
    - .planning/phases/02-progress-tracking/02-USER-SETUP.md
    - .planning/phases/02-progress-tracking/deferred-items.md
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "@supabase/supabase-js와 server-only를 caret 없이 정확한 버전(2.112.3 / 0.0.1)으로 고정 설치 — RESEARCH의 SUS/ASSUMED 패키지 감사 플래그에 대한 방어적 조치"
  - "새 전용 Supabase 프로젝트 대신 기존 프로젝트(ai-news-briefing, ref wxqteqiuihrgtxmztauc)를 재사용 — free tier 제약, 사용자 결정. public.subscribers/public.search_articles 등 기존 테이블은 건드리지 않음"
  - "마이그레이션은 이 executor가 아닌 orchestrator가 Supabase MCP apply_migration으로 적용 — 이 세션 환경에서 executor 서브에이전트에는 Supabase MCP 도구가 노출되지 않음"
  - "check-progress-gates.mjs의 G3(NEXT_PUBLIC_ 접두사 스캔)는 스크립트 자기 자신의 파일을 스캔 대상에서 제외 — 금지 문자열을 상수로 갖고 있어야 검사할 수 있으므로 자기 참조를 포함하면 게이트가 항상 실패(자기 무효화)"

patterns-established:
  - "서버 전용 Supabase 접근: src/lib/supabase/admin.ts 단일 파일만 createClient를 호출하고 파일 첫 줄에 import 'server-only' 마커를 둔다"
  - "게이트 스크립트는 앱 런타임에 의존하지 않는다 — check-supabase-progress.mjs는 server-only 마커가 붙은 admin.ts를 import하지 않고 @supabase/supabase-js의 createClient를 스크립트 안에서 직접 호출한다(check-manifest.mjs가 modules.ts를 독립 재파싱하는 것과 동일한 관례)"

requirements-completed: []

coverage:
  - id: D1
    description: "서버 전용 service_role Supabase 클라이언트 단일화(src/lib/supabase/admin.ts) — 앱 전체에서 이 파일만 createClient를 호출"
    requirement: "PLAT-02"
    verification:
      - kind: other
        ref: "node scripts/check-progress-gates.mjs (G1: server-only 마커 확인, G2: 클라이언트 컴포넌트 import 금지, G3: NEXT_PUBLIC_ 접두사 금지)"
        status: pass
    human_judgment: false
  - id: D2
    description: "진도 읽기/쓰기 데이터 접근 계층(src/lib/progress-store.ts) — 조회 실패와 완료 0건을 타입 수준(ProgressRead)에서 구분"
    requirement: "TRACK-01"
    verification:
      - kind: other
        ref: "node --env-file=.env.local scripts/check-supabase-progress.mjs (단계 1-5: select/upsert/재upsert completed_at 갱신/delete/부재 확인)"
        status: pass
    human_judgment: false
  - id: D3
    description: "public.progress 테이블에 RLS 활성 + 정책 0개(기본 차단) — 마이그레이션 SQL 커밋 및 실제 DB 적용"
    requirement: "PLAT-02"
    verification:
      - kind: other
        ref: "node scripts/check-progress-gates.mjs (G5: enable row level security 1회, create policy 0회)"
        status: pass
      - kind: other
        ref: "node --env-file=.env.local scripts/check-supabase-progress.mjs (단계 6a/6b: anon select 0행, anon insert 거부)"
        status: pass
    human_judgment: false
  - id: D4
    description: "시크릿 노출 방지 4중 게이트(server-only 마커, 클라이언트 import 금지, NEXT_PUBLIC_ 접두사 금지, .next/static 리터럴 스캔) 및 .env.example 값 형태 검증"
    requirement: "PLAT-02"
    verification:
      - kind: other
        ref: "node scripts/check-progress-gates.mjs (G1/G2/G3/G6/G7/G10, G10은 .next/static 부재 시 skipped로 통과)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Supabase Dashboard Table Editor에서 progress 테이블의 RLS 배지가 Enabled이고 Policies 탭이 비어 있는지 육안 확인 (Task 3 <verify><human-check>)"
    requirement: "PLAT-02"
    verification: []
    human_judgment: true
    rationale: "workflow.human_verify_mode=end-of-phase(기본값) — 이 <human-check> 항목은 지금 실행되지 않고 /gsd-verify-work의 end-of-phase UAT 소비 흐름에서 harvest된다. 자동 왕복 게이트(D3)가 정책 0개를 이미 기계적으로 반증했으므로 이 항목은 육안 재확인 성격이다."

duration: "≈1h40m (다중 세션, Task 1/Task 3 체크포인트 대기 2회 포함)"
completed: 2026-08-24
status: complete
---

# Phase 2 Plan 1: 진도 저장 백엔드 개통 Summary

**서버 전용 service_role Supabase 클라이언트 + RLS 정책 0개(기본 차단) progress 테이블 + 정적/실DB 이중 검증 게이트로 진도 저장 인프라를 개통**

## Performance

- **Duration:** ≈1h40m (다중 세션 — Task 1 패키지 정당성 체크포인트, Task 3 Supabase 자격증명 체크포인트에서 각각 사용자 응답 대기)
- **Started:** 2026-08-24 (STATE.md 세션 기준)
- **Completed:** 2026-08-24T07:47:47Z
- **Tasks:** 3 (Task 1 checkpoint:human-verify 승인 + Task 2 auto + Task 3 auto)
- **Files modified:** 8 (코드/설정) + 2 (계획 문서: USER-SETUP.md, deferred-items.md)

## Accomplishments

- npm 패키지 정당성 체크포인트를 사용자가 승인 — `@supabase/supabase-js@2.112.3`, `server-only@0.0.1`을 caret 없이 정확한 버전으로 설치
- `src/lib/supabase/admin.ts`: 앱에서 유일한 service_role Supabase 클라이언트, `server-only` 마커, 환경 변수 부재 시 서술적 오류
- `src/lib/progress-store.ts`: `readCompletedLessonIds`/`setLessonCompletion` 데이터 접근 계층, 조회 실패를 `{ ok: false, error }`로 명시적으로 구분 반환(빈 Set으로 위장하지 않음)
- `supabase/migrations/20260824120000_create_progress.sql`: `progress` 테이블(`lesson_id text PK`, `completed_at timestamptz not null default now()`) + RLS 활성 + 정책 0개, 근거를 담은 한국어 주석
- `.env.example`: `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_ANON_KEY`/`UNLOCK_SECRET` 4종 이름·출처만 문서화, 실값 없음
- `scripts/check-progress-gates.mjs`: G1(server-only 마커)/G2(클라이언트 컴포넌트 import 금지)/G3(NEXT_PUBLIC_ 접두사 금지)/G5(RLS 정책 수)/G6(.env.example 값 형태)/G7(.gitignore 규칙)/G8(@supabase/ssr 미설치)/G10(.next/static 시크릿 리터럴 스캔, 조건부 skip) 정적 게이트, `node scripts/check-progress-gates.mjs`로 실행
- `scripts/check-supabase-progress.mjs`: 실제 호스티드 DB에 select→upsert→재upsert(시각 갱신 확인, D-30)→delete→부재 확인 왕복 + anon 키 select 0행/insert 거부(PLAT-02) 반증, `node --env-file=.env.local scripts/check-supabase-progress.mjs`로 실행 — 이번 세션에 기존 `ai-news-briefing` Supabase 프로젝트에 적용된 마이그레이션(오케스트레이터가 Supabase MCP로 적용) 대상 실행, 모든 7단계 통과

## Task Commits

Each task was committed atomically:

1. **Task 1: npm 패키지 정당성 확인** — checkpoint (no code commit), 사용자가 "approved" 응답
2. **Task 2: 서버 전용 Supabase 접근 계층 · 마이그레이션 SQL · 정적 보안 게이트** - `e068eea` (feat)
3. **Task 3: [BLOCKING] 스키마 적용 + 실제 DB 왕복·RLS 기본 차단 자동 검증** - `8351ff8` (feat)

**Plan metadata:** (다음 커밋에서 기록)

## Files Created/Modified

- `src/lib/supabase/admin.ts` - 유일한 service_role Supabase 클라이언트
- `src/lib/progress-store.ts` - 진도 읽기/쓰기 데이터 접근 계층
- `supabase/migrations/20260824120000_create_progress.sql` - progress 테이블 + RLS 마이그레이션
- `.env.example` - 환경 변수 계약 문서
- `scripts/check-progress-gates.mjs` - 정적 보안 게이트
- `scripts/check-supabase-progress.mjs` - 실 DB 왕복 + RLS 반증 게이트
- `package.json` / `package-lock.json` - `@supabase/supabase-js@2.112.3`, `server-only@0.0.1` 정확 버전 고정
- `.planning/phases/02-progress-tracking/02-USER-SETUP.md` - Vercel 환경 변수 등록(Production+Preview)이 남은 항목으로 문서화
- `.planning/phases/02-progress-tracking/deferred-items.md` - Phase 1 파일의 무관한 사전 존재 lint 오류 2건 로그(수정하지 않음, 범위 밖)

## Decisions Made

- `@supabase/supabase-js`/`server-only`를 caret 없이 정확한 버전으로 고정 — RESEARCH의 Package Legitimacy Audit이 전자를 `[SUS]`(too-new), 후자를 신규 `[ASSUMED]`로 플래그했기 때문에, 향후 패치 업데이트로 검증되지 않은 버전이 자동으로 들어오는 것을 막기 위한 방어적 조치
- 신규 Supabase 프로젝트 대신 기존 `ai-news-briefing` 프로젝트를 재사용(사용자 결정, free tier 제약) — `public.progress` 테이블만 추가했고 기존 `public.subscribers`/`public.search_articles`는 건드리지 않음
- Task 3의 스키마 적용 단계는 이 executor가 아닌 오케스트레이터가 Supabase MCP `apply_migration`으로 수행 — 이 세션의 executor 서브에이전트에는 Supabase MCP 도구가 노출되지 않아 직접 호출 불가했음을 확인 후, 오케스트레이터가 대신 적용하고 성공을 알려온 것을 `scripts/check-supabase-progress.mjs`의 1단계(select 성공)로 재확인
- `check-progress-gates.mjs`의 G3 스캔에서 스크립트 자기 자신의 파일을 제외 — 최초 구현에서 금지 문자열 상수(`NEXT_PUBLIC_SUPABASE`, `NEXT_PUBLIC_UNLOCK`)를 스크립트 자신이 포함하고 있어 자기 스캔 시 항상 실패하는 것을 실행 중 발견하고 즉시 수정(아래 Deviations 참고)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] check-progress-gates.mjs의 G3가 자기 자신을 스캔해 항상 실패**
- **Found during:** Task 2 (`node scripts/check-progress-gates.mjs` 최초 실행)
- **Issue:** G3(`NEXT_PUBLIC_SUPABASE`/`NEXT_PUBLIC_UNLOCK` 금지 문자열 스캔)이 `scripts/` 디렉터리 전체를 스캔 대상에 포함시켰는데, 그 금지 문자열 자체를 상수로 담고 있는 `check-progress-gates.mjs` 자신도 스캔 대상에 포함되어 항상 위반으로 잡히는 자기 무효화 버그
- **Fix:** `fileURLToPath(import.meta.url)`로 얻은 자기 자신의 절대 경로를 스캔 대상 목록에서 명시적으로 제외
- **Files modified:** scripts/check-progress-gates.mjs
- **Verification:** 수정 후 `node scripts/check-progress-gates.mjs` 통과 확인, `import 'server-only';`를 의도적으로 지운 상태에서 재실행해 G1이 정상적으로 실패하는 것도 함께 확인(회귀 방지 자체 테스트) 후 원상복구
- **Committed in:** `e068eea` (Task 2 commit — 발견과 수정이 같은 태스크 내에서 이루어져 별도 커밋 없음)

**2. [Judgment — 보안 강화] npm install 결과의 caret 버전을 정확한 버전으로 고정**
- **Found during:** Task 2 (`npm install` 직후 `package.json` 확인)
- **Issue:** `npm install`이 기본적으로 `^2.112.3`/`^0.0.1` caret 범위로 기록 — RESEARCH의 Package Legitimacy Audit이 두 패키지를 각각 `[SUS]`/`[ASSUMED]`로 플래그했고 플랜 본문도 "버전을 고정해 설치"를 명시했으므로, caret 범위는 이 의도에 미치지 못한다고 판단
- **Fix:** `package.json`에서 두 항목의 caret을 제거해 정확한 버전(`2.112.3`, `0.0.1`)으로 고정하고 `npm install`을 재실행해 lockfile을 동기화
- **Files modified:** package.json, package-lock.json
- **Verification:** `npm ls @supabase/supabase-js server-only`가 두 패키지 모두 정확히 해당 버전임을 재확인
- **Committed in:** `e068eea` (Task 2 commit)

---

**Total deviations:** 2 (1 bug auto-fixed, 1 judgment-based security hardening). **Impact:** 둘 다 계획의 의도(정적 게이트가 실제로 동작할 것, 플래그된 패키지 버전을 고정할 것)를 정확히 구현하는 방향의 수정이며 범위 확장은 없음.

## Issues Encountered

- `npm run lint`가 이 Plan이 만들지 않은 Phase 1 파일 2곳(`src/components/lesson-nav.tsx`, `src/components/theme-toggle.tsx`)에서 사전 존재하는 오류 2건 + 경고 1건을 보고함. 두 파일 모두 이 Plan에서 커밋되지 않았고(git diff 확인, Phase 1 커밋 `76d4824`/`8ebc068`에서 유래) 범위 밖이므로 수정하지 않음 — `.planning/phases/02-progress-tracking/deferred-items.md`에 기록. 이 Plan이 만든 파일만 골라 `npx eslint src/lib/supabase/admin.ts src/lib/progress-store.ts scripts/check-progress-gates.mjs scripts/check-supabase-progress.mjs`로 실행하면 0건 통과.
- `npm audit`이 `sharp`(velite의 전이 의존성)에서 high severity 취약점 2건을 보고함. 이 Plan이 `velite`나 `sharp`를 건드리지 않았고(Phase 1부터 존재), `npm audit fix --force`는 velite를 breaking-change 버전으로 강제 다운그레이드하므로 이 Plan의 범위를 벗어남 — 수정하지 않고 기록만 남김(범위 밖).

## User Setup Required

**Local development is fully configured and verified.** 배포(Vercel) 환경 변수 등록만 남았습니다. See [02-USER-SETUP.md](./02-USER-SETUP.md) for:
- Vercel 프로젝트(`ai-engineer-runway`)에 4개 환경 변수를 Production + Preview 양쪽에 등록하는 절차
- 이 Plan 자체의 검증은 전부 `.env.local` 기준으로 완료됐으므로 Vercel 등록이 늦어져도 02-01은 완료 상태이나, 02-02가 배포 환경에서 검증될 때는 선행되어야 함

## Next Phase Readiness

- `supabaseAdmin`/`readCompletedLessonIds`/`setLessonCompletion`이 확정된 인터페이스로 준비되어 02-02(트레이서: 브라우저→Server Action→Supabase→새로고침 유지)가 탐색 없이 바로 소비 가능
- `public.progress` 테이블이 실제로 존재하고 RLS 기본 차단이 실 DB에서 반증됨 — 02-02의 `<verify>`가 실행될 수 있는 물리적 전제 충족
- PLAT-02/TRACK-01은 02-02(및 TRACK-03/TRACK-04는 02-03/02-04)가 함께 완성해야 하는 공유 요구사항이라 이 Plan에서는 아직 REQUIREMENTS.md에 완료 표시하지 않음(`requirements.ready-ids` 확인 결과 0/2 — 형제 Plan들의 SUMMARY가 아직 없음). 마지막으로 완료되는 형제 Plan이 끝날 때 자동으로 표시됨
- 블로커 없음. 유일한 남은 사용자 작업은 Vercel 환경 변수 등록(위 User Setup Required 참고)이며 02-02 착수를 막지 않음

## Self-Check: PASSED

- All 8 created files verified present on disk (`test -f` for each)
- Both task commits (`e068eea`, `8351ff8`) verified present in `git log --oneline --all`
- Re-ran plan-level `<verification>` commands: `node --env-file=.env.local scripts/check-supabase-progress.mjs && node scripts/check-progress-gates.mjs` — both exit 0
- Re-ran `npm ls @supabase/supabase-js server-only` — both at exact pinned versions, `@supabase/ssr` absent from dependencies
- `npx tsc --noEmit` — clean
- `requirements.ready-ids` for PLAT-02/TRACK-01 — 0/2 ready (correctly deferred to shared-ID gate, no premature mark-complete)

---
*Phase: 02-progress-tracking*
*Completed: 2026-08-24*
