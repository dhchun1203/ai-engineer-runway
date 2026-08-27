---
phase: 05-step-2-3
plan: 04
subsystem: content
tags: [mdx, express, prisma, jwt, bcryptjs, zod, velite]

# Dependency graph
requires:
  - phase: 05-step-2-3
    provides: "Plan 01 확정 심화 형식 골격(6단 헤딩·해보기·details·단어 표) + 구조 게이트 확장(step-1/2/3, L1~L7) + npm 패키지 3종(prisma, @prisma/client, @anthropic-ai/sdk) 정당성 사용자 확인"
provides:
  - "2-5-express-rest-api.mdx 본문 신규 — Express RESTful API 구현(라우터·미들웨어·zod 검증·상태 코드)"
  - "2-5-auth-and-prisma.mdx 본문 신규 — 인증·인가·bcryptjs 해싱·JWT·Prisma ORM(SQLite 데이터소스)"
affects: [05-step-2-3 Plan 07 (EXPECTED_HAS_CONTENT_COUNT 실측 갱신), 05-step-2-3 Plan 05 (2-6-project-ai-shop-backend 복습 포인터)]

# Actuals (#2632)
actuals:
  tokens: 5902
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prisma 메이저 버전 고정 설치(prisma@^7, @prisma/client@^7) — CLI latest 태그가 RC를 가리키는 문제 회피(RESEARCH Pitfall 6)"
    - "Prisma 데이터소스로 SQLite(로컬 파일) 사용 — 외부 DB 서버 없이 예제가 끝까지 완주"
    - "bcryptjs 해시+jsonwebtoken 서명만 사용, 커스텀 인증 로직 0건"
    - "시크릿·접속 정보는 항상 process.env 참조 또는 .env 자리표시자로만 표기, 리터럴 값 0건"

key-files:
  created: []
  modified:
    - src/content/lessons/step-2/2-5-express-rest-api.mdx
    - src/content/lessons/step-2/2-5-auth-and-prisma.mdx

key-decisions:
  - "Prisma 안정 라인(^7) 명시 고정 — RESEARCH 세션 확인 시점(2026-08-25) 기준과 동일하게 이 집필 시점에도 prisma CLI latest 태그가 RC(8.0.0-rc.10)였다. Assumptions Log A3 조건(8.x 정식 배포 확인 시 SUMMARY 기록)은 발동하지 않았다 — 상태 불변"
  - "Prisma 데이터소스는 SQLite(로컬 파일) 선택 — 커리큘럼 스택은 PostgreSQL이지만, 학습자 PC에서 외부 DB 서버 없이 끝까지 실행 완주하도록 CONTEXT.md flagged_assumptions에 명시된 Claude's Discretion 범위 그대로 적용. 본문에 '실제 프로젝트에서는 PostgreSQL로 바꾼다'는 한 줄 없이도 SQLite 선택 이유(외부 서버 불필요)를 프로즈로 명시함"
  - "2-5-express-rest-api의 해보기 3개, 2-5-auth-and-prisma의 해보기 3개로 확정(2~3 범위 안에서 3 선택) — 두 레슨 모두 각 스스로 점검 2개 + 해보기 3개 = details 5개로 L3 최소 요건(taskCount+2)을 정확히 충족"
  - "2-5-auth-and-prisma의 Invoke-RestMethod 예시 이메일 필드 값을 'test@example.com'에서 'student01'로 교체 — check-brand.mjs의 EMAIL_PATTERN이 실제 개인 이메일 여부와 무관하게 이메일 형태 문자열을 전부 위반으로 잡기 때문(Deviation 1 참고)"

patterns-established: []

requirements-completed: [CONT-05]

coverage:
  - id: D1
    description: "2-5-express-rest-api.mdx — Express RESTful API 구현(§2-5 첫 불릿), 완결 실행 코드 + Windows 기준 호출 예시"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "node scripts/check-lesson-structure.mjs (15개 레슨, 7개 검사 통과 — 이 레슨 오류 목록 0건)"
        status: pass
      - kind: unit
        ref: "node scripts/check-brand.mjs (86개 파일, 위반 0건)"
        status: pass
      - kind: unit
        ref: "node -e MDX compile() 직접 실행 — @mdx-js/mdx compile(content) 성공 (npm run build의 Turbopack 단계가 이 worktree 환경 제약으로 미완주, 아래 Deviation 2 참고)"
        status: pass
    human_judgment: false
  - id: D2
    description: "2-5-auth-and-prisma.mdx — 인증·인가·Prisma ORM(§2-5 둘째 불릿), Prisma 안정 라인 고정, bcryptjs 해싱, JWT, SQLite 데이터소스"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "node scripts/check-lesson-structure.mjs (15개 레슨, 7개 검사 통과 — 이 레슨 오류 목록 0건)"
        status: pass
      - kind: unit
        ref: "node scripts/check-brand.mjs (86개 파일, 위반 0건)"
        status: pass
      - kind: unit
        ref: "node -e MDX compile() 직접 실행 — @mdx-js/mdx compile(content) 성공"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-08-26
status: complete
---

# Phase 5 Plan 4: Express·인증·Prisma 백엔드 2편 Summary

**Express RESTful API(라우터/미들웨어/zod 검증)와 인증·인가·Prisma ORM(bcryptjs 해싱, JWT, SQLite 데이터소스, Prisma `^7` 안정 라인 고정) 두 편을 심화 형식으로 신규 집필**

## Performance

- **Duration:** 약 15분 (worktree 준비 ~00:16 → 두 태스크 커밋 완료 00:31)
- **Started:** 2026-08-26T00:16:00+09:00 (worktree 생성 시점 기준 추정)
- **Completed:** 2026-08-26T00:31:46+09:00
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- `2-5-express-rest-api.mdx` — REST 자원 설계·HTTP 상태 코드·미들웨어 개념 + 완결 실행 가능한 `src/server.ts`(zod 검증, GET/GET-by-id/POST) + Windows `Invoke-RestMethod` 호출 예시
- `2-5-auth-and-prisma.mdx` — 인증/인가 구분, 비밀번호 해싱(bcryptjs), JWT 구조, Prisma 3단계(스키마→마이그레이션→클라이언트) + 완결 실행 가능한 `src/auth.ts`(signup/login/보호된 `/me`)
- Prisma를 `prisma@^7` `@prisma/client@^7`로 메이저 고정 안내, `latest` 태그(RC) 안내 0건 — RESEARCH Pitfall 6 대응
- 평문 비밀번호 저장·비교 0건, JWT 시크릿·DB 접속 정보 리터럴 0건 — 모두 `bcrypt.compare`/`process.env` 참조로만 등장
- 두 레슨 모두 구조 게이트(L1~L7) 통과, 브랜드/PII 게이트(check-brand) 통과

## Task Commits

Each task was committed atomically:

1. **Task 1: 2-5-express-rest-api 집필** - `3463d0a` (feat)
2. **Task 2: 2-5-auth-and-prisma 집필** - `39880fc` (feat)

**Plan metadata:** (이 커밋 — `docs(05-04): complete Express/auth/Prisma plan`)

## Files Created/Modified

- `src/content/lessons/step-2/2-5-express-rest-api.mdx` - `hasContent: false → true`, 본문 신규(6단 심화 형식, 해보기 3개)
- `src/content/lessons/step-2/2-5-auth-and-prisma.mdx` - `hasContent: false → true`, 본문 신규(6단 심화 형식, 해보기 3개)

프론트매터는 두 파일 모두 `hasContent` 한 줄 외 변경 없음(`git diff` 확인, title/stepId/moduleId/order/depth/estimatedMinutes/slug 불변).

## Decisions Made

- Prisma 안정 라인(`^7`) 고정 — 집필 시점 확인 결과 RESEARCH.md 조사 시점(2026-08-25)과 동일하게 CLI `latest` 태그가 여전히 release candidate 상태였다. 8.x 정식 배포 확인 시 SUMMARY에 기록하라는 Assumptions Log A3 조건은 발동하지 않았다.
- Prisma 데이터소스로 SQLite(로컬 파일) 선택 — CONTEXT.md flagged_assumptions에 명시된 Claude's Discretion 범위. 커리큘럼 실제 스택(PostgreSQL)과 다르지만, 학습자 PC에서 외부 DB 서버 없이 예제가 끝까지 완주하도록 한 선택.
- 두 레슨 모두 해보기 3개(2~3 범위 안에서 상한 선택) — 인증 레슨은 만료·인가·중복가입 3가지가 모두 실무적으로 중요해 3개가 자연스러웠고, Express 레슨도 동일 개수로 형식 일관성을 맞췄다.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 두 파일 모두 문서 끝에 의도치 않은 `</content>` 리터럴 태그가 남아 MDX 파싱이 실패함**
- **Found during:** Task 1·2 초안 작성 직후 `npm run build` 실행
- **Issue:** 초안 작성 중 실수로 각 파일 본문 맨 끝에 `</content>` 문자열이 그대로 남았다. Velite가 이를 파싱할 때 "Unexpected closing slash `/` in tag, expected an open tag first" 오류를 냈다 — 짝이 없는 닫는 태그가 MDX의 JSX 파서를 트립시킨 것.
- **Fix:** `node -e`로 `@mdx-js/mdx`의 `compile()`을 직접 호출해 정확한 오류 위치(파일별 마지막 줄)를 특정한 뒤, 두 파일 모두 `</content>` 줄을 제거했다. 이후 직접 `compile()` 재호출로 두 파일 모두 정상 컴파일을 확인했다.
- **Files modified:** `src/content/lessons/step-2/2-5-express-rest-api.mdx`, `src/content/lessons/step-2/2-5-auth-and-prisma.mdx`
- **Verification:** `node -e` 직접 `@mdx-js/mdx compile()` 성공(양쪽), `node scripts/check-lesson-structure.mjs` 통과, `npm run build`의 VELITE 단계가 오류 없이 완료됨(빌드 로그에 issues 블록 없음)
- **Committed in:** 각 태스크 커밋에 포함(별도 fix 커밋 없음 — 커밋 전 초안 단계에서 수정)

**2. [Rule 1 - Bug] `2-5-auth-and-prisma`의 예시 이메일 값이 `check-brand.mjs`의 이메일 패턴 게이트에 걸림**
- **Found during:** Task 2 `check-brand.mjs` 실행
- **Issue:** `Invoke-RestMethod` 예시의 `email="test@example.com"`가 `check-brand.mjs`의 `EMAIL_PATTERN` 정규식(실제 개인정보 여부와 무관하게 이메일 형태 문자열을 전부 위반으로 잡음)에 매칭되어 게이트가 실패했다.
- **Fix:** 예시 값을 `"student01"`(이메일 형태가 아닌 일반 문자열)로 교체 — 이 데모 코드는 이메일 형식 검증을 별도로 하지 않으므로 의미상 문제 없다.
- **Files modified:** `src/content/lessons/step-2/2-5-auth-and-prisma.mdx`
- **Verification:** `node scripts/check-brand.mjs` — 86개 파일 검사, 위반 0건
- **Committed in:** `39880fc` (Task 2 커밋에 포함 — 커밋 전 초안 단계에서 수정)

---

**Total deviations (auto-fixed):** 2 (모두 Rule 1 — 커밋 전 초안 단계에서 발견·수정, 별도 fix 커밋 불필요)
**Impact on plan:** 두 건 모두 배포 가능성에 직결되는 버그였다(하나는 빌드를 완전히 깨뜨렸고, 다른 하나는 게이트를 실패시켰다). 커밋 전에 모두 발견·수정해 최종 커밋된 코드에는 흔적이 남지 않는다.

---

### Environment Limitation (not a content defect — documented for transparency)

**3. 이 worktree에서 `npm run build`의 Turbopack(Next.js 앱 번들링) 단계가 완주하지 못함**

- **원인:** 이 worktree는 `node_modules`가 사실상 비어 있다(`.velite.config.compiled.mjs` 파일 하나만 존재). `next`/`react` 등 실제 패키지는 메인 저장소(`C:\Users\dhchu\dev\aiEngineerCourse\node_modules`)에만 설치되어 있다. Node의 CommonJS `require()`는 부모 디렉터리를 거슬러 올라가며 이 메인 `node_modules`를 찾아내지만, Turbopack의 워크스페이스 루트 감지 로직은 이 worktree 자체에 `package.json`/`package-lock.json` 실 파일이 존재한다는 이유로 worktree 디렉터리를 "워크스페이스 루트"로 간주하고, 그보다 상위 경로(`next`가 실제로 설치된 곳)를 hermetic build 정책상 참조하지 않는다.
- **범위 확인:** 이 문제는 이 worktree의 콘텐츠(내가 작성한 두 `.mdx` 파일)와 무관하다 — `npm run build`가 트리거하는 **VELITE 단계(프론트매터 Zod 스키마 검증 + MDX 컴파일)는 두 파일 모두 오류 없이 완료됐다.** VELITE 단계 자체가 이 Plan의 `<verify>`가 실제로 검증하려는 대상(MDX 파싱 가능성, frontmatter 스키마 적합성)이고, Turbopack 단계는 최종 Next.js 앱 번들링으로 콘텐츠 정확성과 무관한 별개 관심사다.
- **시도한 해결책과 되돌림:** `node_modules`를 메인 저장소로 향하는 디렉터리 정션(junction)으로 연결해봤으나, Turbopack이 `node_modules` 자체를 출력 디렉터리로 만들려다 "이미 존재하는 파일/리파스 포인트와 충돌"하는 새로운 오류가 나서 이 접근을 포기하고 **정션을 제거해 원래의 빈 `node_modules` 상태로 되돌렸다** — worktree를 병합 전 원래 상태로 유지하기 위함(destructive/risky 환경 조작을 최소화).
- **대체 검증:** `node -e`로 `@mdx-js/mdx`의 `compile()`을 두 파일에 직접 호출해 MDX 파싱 성공을 독립적으로 증명했고(Velite가 내부적으로 쓰는 것과 같은 컴파일러), `node scripts/check-lesson-structure.mjs`·`node scripts/check-brand.mjs`(둘 다 외부 의존성 0, Node 표준 모듈만 사용)를 직접 실행해 통과를 확인했다. 이 셋을 합치면 이 Plan의 `<verify>`가 요구하는 실질적 보증(MDX 렌더 가능성 + 구조 게이트 + 브랜드 게이트)을 커버한다 — 다만 Next.js 앱 전체의 실제 페이지 렌더(예: `next start` + curl)는 이 worktree에서 수행하지 못했다.
- **후속 조치 필요:** 오케스트레이터가 이 wave를 메인 브랜치로 병합한 뒤, 정상적인 `node_modules`가 있는 환경(메인 저장소)에서 `npm run build && next start`로 두 신규 URL(`/lesson/2-5-express-rest-api`, `/lesson/2-5-auth-and-prisma`)의 실제 서버 렌더를 1회 확인할 것을 권장한다 — 이 Plan의 03-01 파일럿에서 발견됐던 "빌드는 통과하지만 서버 렌더는 실패" 케이스(중첩 백틱)와 유사한 클래스의 결함이 있다면 이 단계에서만 잡힌다. 이번 두 파일은 인라인 코드 백틱 중첩을 의도적으로 피해 작성했으므로(new_standard_since_the_pilot 규칙 준수) 위험은 낮다고 판단하나, 실제 확인은 아직 수행되지 않았다.

## Issues Encountered

- worktree `node_modules`가 비어 있어 `npm run build`의 Next.js 번들링 단계를 이 환경에서 완주할 수 없었다(Deviation 3 참고). Velite 단계·구조 게이트·브랜드 게이트로 대체 검증했다.
- 그 외 특이사항 없음 — 두 태스크 모두 계획대로 실행됐다.

## User Setup Required

None - 외부 서비스 설정 불필요.

## Next Phase Readiness

- **Plan 05-04 완료** — `2-5-express-rest-api`, `2-5-auth-and-prisma` 두 편 `hasContent: true`, 구조/브랜드 게이트 통과
- **check-manifest는 이 wave 동안 의도적으로 red** — Plan 07이 Wave 2 종료 후 실측으로 상수를 되돌린다(D-78, 이 Plan은 손대지 않음)
- **병합 후 권장 확인:** 메인 저장소(정상 node_modules 보유) 환경에서 `next start` + curl로 이 두 신규 URL의 실제 서버 렌더를 1회 확인(Deviation 3 후속 조치 참고) — 이 Plan 자체는 이를 완료하지 못했다
- **2-6-project-ai-shop-backend(Plan 05)가 이 두 레슨을 복습 포인터로 참조할 예정** — slug·제목 확정값 변경 없음
- 블로커 없음 (환경 제약은 콘텐츠 결함이 아니며 병합 후 해소됨)

---
*Phase: 05-step-2-3*
*Completed: 2026-08-26*

## Self-Check: PASSED

Both files exist on disk (`src/content/lessons/step-2/2-5-express-rest-api.mdx`, `src/content/lessons/step-2/2-5-auth-and-prisma.mdx`) and both commit hashes (`3463d0a`, `39880fc`) are present in git history on branch `worktree-agent-aa5c87380c6c7fa69`.
</content>
