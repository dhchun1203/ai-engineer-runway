---
phase: 05-step-2-3
plan: 02
subsystem: content
tags: [mdx, velite, postgres, supabase, sql]

# Dependency graph
requires:
  - phase: 05-step-2-3
    provides: "Plan 01의 확정된 심화 형식 골격(6단 헤딩·해보기·정답 블록·단어 표) + 확장된 구조 게이트(step-1/2/3 전체, L7 200자 단락 게이트)"
provides:
  - "2-1 모듈 2편(PostgreSQL·Supabase 활용 / AI 서비스 데이터 구조 설계) 심화 본문, hasContent: true 전환"
  - "AI 서비스 맥락의 practice 연습 스키마 객체 명명 확정 — practice.ai_products, practice.ai_chat_sessions, practice.ai_messages, practice.tags, practice.message_tags (2-6 프로젝트 가이드가 참조 가능)"
affects: [05-step-2-3 Plan 07(매니페스트 실측 갱신), 05-step-2-3 Plan 04/06(2-4/2-6 프로젝트 가이드 — 같은 practice 테이블명 참조 가능)]

# Actuals (#2632)
actuals:
  tokens: 4785
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AI 서비스 연습 테이블 명명: practice.ai_products(단일 표), practice.ai_chat_sessions/practice.ai_messages(1:N, 외래키), practice.tags/practice.message_tags(N:M, 연결 테이블) — Phase 4의 practice.students류 명명을 그대로 승계하되 주제에 맞게 새로 지음(Open Question 3, Claude's Discretion)"
    - "인덱스 이름을 practice_ 접두사로 지어 스키마 격리 규칙과 시각적으로 일관되게 유지(create index practice_ai_messages_session_idx on practice.ai_messages(...))"
    - "public.progress 언급은 레슨당 정확히 1회로 제한 — 반복 언급이 오히려 acceptance criteria(대소문자 무시 카운트 <=1)를 위반하므로 두 번째 언급은 practice. 접두사 설명만으로 대체"

key-files:
  created: []
  modified:
    - src/content/lessons/step-2/2-1-postgres-and-supabase.mdx
    - src/content/lessons/step-2/2-1-ai-data-modeling.mdx

key-decisions:
  - "practice 스키마 테이블명은 Phase 4의 구체명(practice.students)을 그대로 쓰지 않고 AI 서비스 주제에 맞게 새로 지음 — Plan 프론트매터의 flagged_assumptions Open Question 3에서 이미 위임된 재량 범위, 사용자 확인 없이 처리"
  - "check-manifest.mjs는 이번 Plan에서 실행/수정하지 않음 — Wave 2 동안 의도적 red(D-78), Plan 07이 실측으로 상수를 되돌림"

patterns-established:
  - "2-1 모듈이 Step 2에서 유일한 브라우저 실행 예외(D-73)임을 두 레슨 모두 실무 예제 첫 줄에 굵게 명시"
  - "AI 서비스 데이터 구조 레슨의 A → B → C 한 줄 도식 + 표로 1:N/N:M 관계를 그림 없이 표현(D-48 준수)"

requirements-completed: [CONT-05]

coverage:
  - id: D1
    description: "2-1-postgres-and-supabase.mdx — PostgreSQL/Supabase 활용 심화 레슨(스키마·RLS·집계, practice 스키마 실습 3편, 해보기 3개, 단어 표 7행)"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "node scripts/check-lesson-structure.mjs (15개 레슨, 7개 검사 통과)"
        status: pass
      - kind: integration
        ref: "npm run build (exit 0, 44 라우트 생성)"
        status: pass
      - kind: e2e
        ref: "next start -p 4173 + curl http://localhost:4173/lesson/2-1-postgres-and-supabase → 200, 에러 다이제스트 없음"
        status: pass
    human_judgment: false
  - id: D2
    description: "2-1-ai-data-modeling.mdx — AI 서비스 데이터 구조 설계 심화 레슨(정규화/비정규화, 1:N·N:M, 인덱스, practice.ai_chat_sessions/ai_messages 실습, 해보기 3개, 단어 표 7행)"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "node scripts/check-lesson-structure.mjs (15개 레슨, 7개 검사 통과)"
        status: pass
      - kind: integration
        ref: "npm run build (exit 0, 44 라우트 생성)"
        status: pass
      - kind: e2e
        ref: "next start -p 4173 + curl http://localhost:4173/lesson/2-1-ai-data-modeling → 200, 에러 다이제스트 없음"
        status: pass
    human_judgment: false
  - id: D3
    description: "SQL 실무 예제가 실제 Supabase 프로젝트에서 정말 동작하는지(구문 정확성 이상)는 이 Plan의 게이트가 증명하지 못함 — 구조만 자동 검증됨"
    verification: []
    human_judgment: true
    rationale: "실행자·자동 게이트가 Supabase 자격증명 없이 SQL을 실제로 실행할 수 없다 — Plan 프론트매터 flagged_assumptions에 이미 기록된 알려진 한계(Phase 4 UAT 1번과 동일 사유). Phase 5 마감(Plan 13)의 human-check가 최종 사람 확인을 담당"

duration: ~15min (실집필+검증 구간, 2026-08-26 00:13~00:26 커밋 타임스탬프 기준)
completed: 2026-08-26
status: complete
---

# Phase 5 Plan 2: 2-1 모듈 PostgreSQL·Supabase 활용 + AI 서비스 데이터 구조 설계 Summary

**2-1 모듈 2편(PostgreSQL/Supabase 활용, AI 서비스 데이터 구조 설계)을 심화 형식으로 작성 — practice 스키마 격리 SQL 실습과 1:N/N:M 관계·인덱스 실습을 포함**

## Performance

- **Duration:** 약 15분(집필+게이트+빌드+서버 렌더 검증)
- **Started:** 2026-08-26T00:13:32+09:00 (base commit)
- **Completed:** 2026-08-26T00:26:04+09:00
- **Tasks:** 2 (Task 1: 2-1-postgres-and-supabase, Task 2: 2-1-ai-data-modeling)
- **Files modified:** 2

## Accomplishments

- `2-1-postgres-and-supabase.mdx` — PostgreSQL이 서버로 도는 데이터베이스라는 점, Supabase가 관리형 Postgres+API+인증을 묶어준다는 점, 스키마·RLS 개념을 다룬 심화 레슨. `practice.ai_products` 테이블로 준비·입력·조회·집계 SQL 3개 펜스 + 해보기 3개 + 단어 표 7행
- `2-1-ai-data-modeling.mdx` — 정규화/비정규화 트레이드오프, 1:N·N:M 관계 표현, AI 서비스 자주 나오는 테이블 3종, 인덱스 필요성을 다룬 심화 레슨. `practice.ai_chat_sessions`/`practice.ai_messages` 외래키·인덱스 실습 + N:M 연결 테이블(`practice.tags`/`practice.message_tags`) 해보기 + 단어 표 7행
- 두 레슨 모두 `hasContent: false → true` 한 줄만 프론트매터 변경, 나머지 7개 필드 불변 확인
- `node scripts/check-lesson-structure.mjs` 15개 레슨 7개 검사 전체 통과(step-1/2/3 확장 게이트 + L7 단락 길이 게이트 포함)
- `node scripts/check-brand.mjs` 86개 파일 위반 0건
- `npm run build` 성공, `next start` + `curl`로 두 레슨 URL 모두 실제 서버 렌더 200 확인(에러 다이제스트 없음) — Plan 01이 발견한 "build는 통과하지만 on-demand 렌더는 500" 함정을 이번엔 사전에 확인

## Task Commits

Each task was committed atomically:

1. **Task 1: 2-1-postgres-and-supabase 집필** - `394f97a` (feat)
2. **Task 2: 2-1-ai-data-modeling 집필** - `dfea692` (feat)

**Plan metadata:** (이 커밋 — `docs(05-02): complete 2-1 module plan`, 오케스트레이터가 wave 종료 시 STATE.md/ROADMAP.md와 함께 처리)

## Files Created/Modified

- `src/content/lessons/step-2/2-1-postgres-and-supabase.mdx` — 스텁 → 심화 본문 전체 작성 (프론트매터 `hasContent` 1줄만 변경)
- `src/content/lessons/step-2/2-1-ai-data-modeling.mdx` — 스텁 → 심화 본문 전체 작성 (프론트매터 `hasContent` 1줄만 변경)

## Decisions Made

- `practice` 연습 스키마의 구체 테이블명을 Phase 4의 `practice.students`류를 그대로 쓰지 않고 AI 서비스 주제에 맞게 새로 지음(`practice.ai_products`, `practice.ai_chat_sessions`, `practice.ai_messages`, `practice.tags`, `practice.message_tags`) — Plan 프론트매터가 이미 Claude's Discretion으로 위임한 범위(Open Question 3), 별도 사용자 확인 없이 처리
- 인덱스 이름에 `practice_` 접두사를 붙여(`practice_ai_messages_session_idx`) `create (table|index) [^p]` 게이트 요구를 자연스럽게 만족시키면서도 스키마 격리 규칙과 시각적으로 일관되게 유지
- `check-manifest.mjs`는 실행·수정하지 않음 — Wave 2 동안 의도적 red(D-78), Plan 07이 실측으로 상수를 되돌릴 예정

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 워크트리에 `node_modules`가 설치되어 있지 않아 `npm run build`가 즉시 실패**
- **Found during:** Task 1 verify 단계 (`npm run build` 최초 실행)
- **Issue:** git worktree는 `node_modules`를 공유하지 않고 `.gitignore`로 제외되어 있어, 이 워크트리에는 `next` 패키지 자체가 없었다. Turbopack이 "Could not find the Next.js package"로 즉시 실패.
- **Fix:** 기존 `package-lock.json`을 그대로 사용해 `npm ci` 실행 — 새 패키지를 추가하거나 버전을 바꾸지 않고, 이미 저장소에 커밋된 잠금 파일 그대로 설치만 수행했다(Rule 3의 "새 패키지 설치" 예외에 해당하지 않음 — 기존 의존성 동기화).
- **Files modified:** 없음(`node_modules`는 gitignore 대상이라 커밋 불필요)
- **Verification:** `npm ci` 성공 후 `npm run build` 재실행 통과
- **Committed in:** 커밋 없음(gitignore 대상)

**2. [Rule 3 - Blocking] 워크트리에 `.env.local`이 없어 `npm run build`가 `/schedule` 페이지에서 `SUPABASE_URL` 누락으로 실패**
- **Found during:** Task 1 verify 단계 (`npm run build`, `node_modules` 설치 이후 두 번째 실행)
- **Issue:** `src/lib/supabase/admin.ts`가 빌드 타임에 `SUPABASE_URL` 환경 변수를 요구하는데, 이 워크트리에는 `.env.local`이 없었다(`.env.local`도 gitignore 대상이라 워크트리 생성 시 복사되지 않음).
- **Fix:** 저장소 루트(`C:\Users\dhchu\dev\aiEngineerCourse\.env.local`)의 로컬 개발용 환경 파일을 워크트리로 그대로 복사. 새 값을 생성하거나 비밀키를 임의로 채워넣지 않고, 이미 로컬 개발에 쓰이던 파일을 그대로 재사용했다.
- **Files modified:** `.env.local` (워크트리 로컬, gitignore 대상이라 커밋 불필요)
- **Verification:** `npm run build` 재실행 후 44개 라우트 정상 생성 확인
- **Committed in:** 커밋 없음(gitignore 대상)

**3. [Rule 1 - Bug] `public.progress` 언급이 acceptance criteria 상한(≤1회)을 초과**
- **Found during:** Task 1 acceptance criteria grep 자체 검증 (`grep -ci 'public\.progress'`)
- **Issue:** 경고 문구 1회 외에 "스스로 점검" 정답 블록에서 같은 문자열을 다시 인용해, `public.progress` 언급이 2회로 acceptance criteria(≤1)를 위반했다.
- **Fix:** 두 번째 언급을 `public.progress`라는 구체 이름 대신 "이 사이트의 진도 데이터가 담긴 표들"이라는 일반 표현으로 바꿔 의미는 유지하면서 카운트를 1로 줄였다.
- **Files modified:** `src/content/lessons/step-2/2-1-postgres-and-supabase.mdx`
- **Verification:** 재실행한 grep이 1을 반환, 구조·브랜드 게이트와 `npm run build`·서버 렌더 재확인 통과
- **Committed in:** `394f97a` (Task 1 커밋에 포함 — 커밋 전 발견해 별도 fix 커밋 없이 정정)

---

**Total deviations:** 3 auto-fixed (2 Rule-3 blocking 환경 설정, 1 Rule-1 acceptance criteria 버그)
**Impact on plan:** 두 환경 설정 이슈는 이 워크트리에서 빌드를 실행하기 위한 필수 전제조건이었고 저장소에 이미 존재하는 값만 재사용했다(새 비밀·새 패키지 없음). acceptance criteria 위반은 커밋 전에 자체 검증으로 발견해 즉시 수정했으므로 별도 fix 커밋이 필요 없었다.

## Issues Encountered

None — 위 세 건은 모두 Deviations로 문서화됐고, 재실행 후 전부 그린.

## User Setup Required

None - 외부 서비스 설정 불필요. (워크트리의 `.env.local`은 저장소 루트에 이미 있던 로컬 개발용 파일을 복사한 것으로, 새 자격증명 발급이 필요하지 않았다.)

## Next Phase Readiness

- **Plan 07 착수 시:** 이 Plan이 2건을 `hasContent: true`로 전환했으므로, `.velite/lessons.json` 실측 카운트는 15(Plan 01의 13 + 이 Plan의 2)다. Plan 07이 `EXPECTED_HAS_CONTENT_COUNT`를 Wave 2 최종값으로 실측 갱신할 때 이 숫자를 참고해야 한다(단, 다른 Wave 2 병렬 Plan들도 동시에 카운트를 올리므로 최종 실측은 전체 wave 병합 후 다시 세야 한다).
- **Plan 04/06(2-4/2-6 프로젝트 가이드) 착수 시:** 이 Plan이 확정한 `practice.ai_products`, `practice.ai_chat_sessions`, `practice.ai_messages` 명명을 참조 포인터로 재사용할 수 있다.
- 블로커 없음

---
*Phase: 05-step-2-3*
*Completed: 2026-08-26*

## Self-Check: PASSED

Both files referenced in this SUMMARY exist on disk (`src/content/lessons/step-2/2-1-postgres-and-supabase.mdx`, `src/content/lessons/step-2/2-1-ai-data-modeling.mdx`), and both execution commits (`394f97a`, `dfea692`) are present in git history (`git log --oneline -5` confirmed above HEAD).
