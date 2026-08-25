---
phase: 05-step-2-3
plan: 05
subsystem: content
tags: [mdx, velite, nodejs, typescript, project-guide, lesson-gate]

# Dependency graph
requires:
  - phase: 05-step-2-3
    provides: "05-01이 확정한 세 형식 골격(심화·개요·프로젝트 준비 가이드) 및 확장된 구조 게이트(L1~L7)"
provides:
  - "2-3-typescript-setup — Node·npm·TypeScript 첫 설치 지점(D-74), 실측 LTS 24.x 안내"
  - "2-6-project-ai-shop-backend — 프로젝트 준비 가이드 5편 중 2번째, '재현 아님' 경계 준수"
  - "check-lesson-structure.mjs L7(200자 단락) 게이트를 신규 2편에서 실증(위반 3건 발견·수정)"
affects: [05-step-2-3 Plan 07 (매니페스트 실측 갱신), Plan 02·03·04·06 (같은 wave 병렬 실행)]

# Actuals (#2632)
actuals:
  tokens: 5612
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Node.js LTS 메이저는 로컬 node --version과 nodejs.org/dist/index.json 실측 교차 확인 후 메이저만 표기(패치 고정 표기 금지)"
    - "프로젝트 준비 가이드 ④ 절은 3열 체크리스트 표 + text 펜스(환경변수 키 이름만) — 실행 코드 펜스 0건"
    - "worktree에 node_modules가 비어 있으면 npm ci로 기존 lockfile 의존성만 설치(신규 패키지 추가 아님, Rule 3 예외 미해당)"
    - "로컬 전체 build 검증에는 SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY 더미 .env.local이 필요(admin.ts가 build-time 모듈 평가에서 throw) — 실제 값 아님, 커밋 안 됨(.gitignore)"

key-files:
  created: []
  modified:
    - src/content/lessons/step-2/2-3-typescript-setup.mdx
    - src/content/lessons/step-2/2-6-project-ai-shop-backend.mdx

key-decisions:
  - "Node LTS 메이저를 nodejs.org/dist/index.json 실측으로 확정: 24 (Krypton, 최신 v24.19.0, 로컬 node --version도 v24.13.0으로 같은 메이저) — 본문에는 'LTS 24.x 이상'으로만 표기, 세 자리 점(패치) 고정 표기 없음"
  - "2-6 복습 포인터 slug 4개: 2-1-ai-data-modeling, 2-5-express-rest-api, 2-5-auth-and-prisma(데이터·API·인증 모듈) + 2-4-project-ai-shop-frontend(짝 프론트엔드)"
  - "2-6 체크리스트 표 행 구성: PostgreSQL/Supabase 접속정보, LLM API 키, Node·npm 설치 확인, API 명세 초안(6~8개 엔드포인트), API 호출 도구 — 5행, 나머지 프로젝트 가이드 3편(3-2/3-5/3-7)이 참고 가능한 패턴"
  - "각 레슨 해보기 개수 3개로 확정(2~3 범위 안에서 재량)"

patterns-established:
  - "MDX 본문 편집 시 Write/Edit 도구가 콘텐츠 끝에 의도치 않은 '</content>' 아티팩트를 남길 수 있음 — 파일 저장 직후 tail -c 확인 또는 velite build로 즉시 검증 필요(이 Plan에서 2건 발견·수정)"

requirements-completed: [CONT-05]

coverage:
  - id: D1
    description: "2-3-typescript-setup.mdx 신규 집필 — Node·npm·TypeScript 설치 5단계, 실측 LTS 24.x 안내, 해보기 3개, 단어 표 7행"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "node scripts/check-lesson-structure.mjs (15개 레슨, 7개 검사) — pass"
        status: pass
      - kind: unit
        ref: "node scripts/check-brand.mjs — 86개 파일, 위반 0 — pass"
        status: pass
      - kind: e2e
        ref: "npm run build (velite + next build) 성공, next start + curl http://localhost:3499/lesson/2-3-typescript-setup 200, 정답 보기 블록 5개 렌더 확인"
        status: pass
    human_judgment: false
  - id: D2
    description: "2-6-project-ai-shop-backend.mdx 신규 집필 — 프로젝트 준비 가이드 형식(D-66~D-69), ④ 체크리스트 표(코드 0건), ⑥ 준비 완료 체크박스 5개, 복습 포인터 slug 3개"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "node scripts/check-lesson-structure.mjs (15개 레슨, 7개 검사) — pass"
        status: pass
      - kind: unit
        ref: "node scripts/check-brand.mjs — 86개 파일, 위반 0 — pass"
        status: pass
      - kind: e2e
        ref: "npm run build 성공, next start + curl http://localhost:3499/lesson/2-6-project-ai-shop-backend 200, '사전 준비 체크리스트' 텍스트·정답 보기 5개 렌더 확인"
        status: pass
    human_judgment: true
    rationale: "'재현 아님' 경계(완성 코드·정답 아키텍처 미포함)는 자동 grep(구현해/함수를 작성 0건, typescript/tsx/js/sql 펜스 0건 in ④)로 형식은 검증했으나, 내용이 실제로 '준비'에 머물고 '구현'으로 미끄러지지 않았는지는 05-01 체크포인트에서 승인된 사람 판정 기준(2-4 승인 선례)에 의존 — Plan 01 SUMMARY의 D3 판정과 동일 경계를 이 편에도 적용했다고 자체 판단했으나 최종 확인은 사람 검토 권장"

duration: 약 55분
completed: 2026-08-26
status: complete
---

# Phase 5 Plan 5: Step 2 TypeScript 환경 설정 + 프로젝트 준비 가이드 2 Summary

**Node.js/npm/TypeScript 첫 설치 심화 레슨(실측 LTS 24.x)과 AI 쇼핑몰 백엔드 프로젝트 준비 가이드(체크리스트 5행 + 준비 완료 체크박스 5개, 완성 코드 0건)를 신규 집필해 `hasContent: true`로 전환**

## Performance

- **Duration:** 약 55분 (worktree 셋업·의존성 설치 포함)
- **Started:** 2026-08-26 (worktree 스폰 시점)
- **Completed:** 2026-08-26
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- `2-3-typescript-setup.mdx` — Step 2에서 유일한 Node 생태계 첫 설치 지점(D-74)을 심화 형식으로 완성. Node LTS 메이저를 `nodejs.org/dist/index.json` 실측(v24.19.0, Krypton)과 로컬 `node --version`(v24.13.0) 교차 확인해 "LTS 24.x 이상"으로 안내 — 리서치의 `[ASSUMED]` 표기를 실측으로 해소(A1)
- `2-6-project-ai-shop-backend.mdx` — 프로젝트 준비 가이드 5편 중 2번째. ④ 절은 실행 코드 없이 5행 체크리스트 표만, ⑥ 절은 5개 준비 완료 체크박스로 마감 — D-67 "재현 아님" 경계 준수
- 두 레슨 모두 확장된 구조 게이트(L1~L7, 200자 단락 게이트 포함)를 통과 — 집필 중 3건의 L7 위반(200자 초과 단락)을 발견해 즉시 분리
- worktree에 비어 있던 `node_modules`를 `npm ci`로 채우고, 로컬 검증용 더미 `.env.local`을 만들어 `npm run build`·`next start` 전 구간을 실제로 검증(커밋 안 됨, `.gitignore` 대상)

## Task Commits

Each task was committed atomically:

1. **Task 1: `2-3-typescript-setup` 집필 — Node·npm·TypeScript 설치 (D-74)** - `b7c233c` (feat)
2. **Task 2: `2-6-project-ai-shop-backend` 집필 — 프로젝트 준비 가이드 (D-66~D-69)** - `9c8bc98` (feat)

**Plan metadata:** 이 SUMMARY 및 관련 파일은 orchestrator가 wave 종료 시 일괄 커밋한다(이 Plan은 STATE.md·ROADMAP.md를 직접 갱신하지 않는다).

## Files Created/Modified

- `src/content/lessons/step-2/2-3-typescript-setup.mdx` - 스텁 → 심화 형식 본문 신규 집필, `hasContent: false → true`
- `src/content/lessons/step-2/2-6-project-ai-shop-backend.mdx` - 스텁 → 프로젝트 준비 가이드 형식 본문 신규 집필, `hasContent: false → true`

## Decisions Made

- Node LTS 메이저 확정: **24** — `nodejs.org/dist/index.json`을 curl로 직접 조회해 `lts` 필드가 채워진 최신 항목이 `v24.19.0`(codename Krypton, 2026-08-03 릴리스)임을 확인했고, 로컬 `node --version`(v24.13.0)도 같은 메이저였다. 본문에는 "LTS 24.x 이상"으로만 적어 패치 단위 고정 표기를 피했다.
- 로컬 `npm --version`은 11.6.2 — 본문에 특정 버전을 강제하지 않고 "Node.js를 설치하면 함께 딸려온다"는 서술로만 다뤘다(패치 표기 회피).
- `2-6`의 복습 포인터 slug 4개(`2-1-ai-data-modeling`, `2-5-express-rest-api`, `2-5-auth-and-prisma`, `2-4-project-ai-shop-frontend`)를 데이터·API·인증·짝 프론트엔드 순으로 배치.
- `2-6` 체크리스트 표 5행(PostgreSQL 접속정보, LLM API 키, Node·npm 확인, API 명세 초안, API 호출 도구) — 05-PATTERNS.md가 제시한 3행보다 확장했다. 나머지 프로젝트 가이드 3편(3-2/3-5/3-7)이 참고할 수 있는 5행 패턴으로 기록해둔다.
- 두 레슨 모두 `### 해보기` 3개로 확정(2~3 범위 안에서 재량, D-69 형식 예외 없음 원칙 유지).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] worktree의 빈 `node_modules`를 `npm ci`로 채움**
- **Found during:** Task 1 verify 단계 (`npm run build` 최초 실행)
- **Issue:** 이 worktree는 `node_modules/`가 완전히 비어 있어(`git worktree`가 gitignore 대상을 복제하지 않음) `next build`가 "Could not find the Next.js package" 오류로 즉시 실패했다.
- **Fix:** 기존 `package-lock.json`을 그대로 사용해 `npm ci` 실행 — 신규 패키지를 추가한 것이 아니라 이미 확정된 잠금 파일의 의존성을 설치만 한 것이므로 Rule 3의 "패키지 설치 제외" 예외에 해당하지 않는다고 판단했다.
- **Files modified:** 없음(`node_modules/`는 `.gitignore` 대상, git 추적 파일 변경 없음)
- **Verification:** `npm ci` 성공(522 packages), 이후 `npm run build` 정상 진행
- **Committed in:** 커밋 없음(추적 대상 아님)

**2. [Rule 3 - Blocking] 로컬 전체 build 검증을 위한 더미 `.env.local` 생성**
- **Found during:** Task 1 verify 단계, `npm run build`가 `/lesson/[lessonId]` 페이지 데이터 수집 단계에서 `SUPABASE_URL 환경 변수가 비어 있습니다` 오류로 실패
- **Issue:** `src/lib/supabase/admin.ts`가 모듈 평가 시점에 `SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`가 없으면 즉시 throw한다. 이 값들은 리포지토리 어디에도 실제 값으로 존재하지 않는다(로컬·worktree 모두 `.env.local` 없음).
- **Fix:** `.env.local`에 `SUPABASE_URL=https://placeholder-local-build.supabase.co`, `SUPABASE_SERVICE_ROLE_KEY=placeholder-local-build-key` 형태의 더미 값만 채워 build-time throw를 피했다. 실제 키가 아니며 어떤 외부 서비스도 호출하지 않는다.
- **Files modified:** `.env.local`(신규, `.gitignore` 대상이라 커밋되지 않음)
- **Verification:** `npm run build` 전체 성공, `next start` + curl로 두 신규 레슨과 기존 파일럿 3편 모두 200 확인
- **Committed in:** 커밋 없음(`.gitignore`가 차단, 의도적으로 추적하지 않음)

**3. [Rule 1 - Bug] MDX 본문 끝에 남은 `</content>` 아티팩트 2건 제거**
- **Found during:** Task 1·Task 2 각각의 `npm run build`(velite MDX 컴파일) 단계
- **Issue:** `Write` 도구로 두 파일을 저장할 때마다 실제 의도한 콘텐츠 끝(`</details>`) 뒤에 의도하지 않은 `</content>\n` 한 줄이 파일에 추가되어 있었다. Velite는 이를 "Unexpected closing slash `/` in tag, expected an open tag first"로 보고했고, 정확한 위치는 bisection 테스트(`@mdx-js/mdx`의 `compile()`을 직접 호출해 details-close 경계별로 컴파일)로 특정했다.
- **Fix:** 각 파일에서 마지막 `</details>` 뒤의 `</content>` 줄을 제거.
- **Files modified:** `src/content/lessons/step-2/2-3-typescript-setup.mdx`, `src/content/lessons/step-2/2-6-project-ai-shop-backend.mdx`
- **Verification:** `npx velite build` 오류 없이 통과, `npm run build` 전체 성공, `next start` + curl 200 확인
- **Committed in:** `b7c233c`(Task 1), `9c8bc98`(Task 2) — 각 태스크 최초 커밋에 이미 반영된 상태로 커밋됨(별도 fix 커밋 없음, 태스크 커밋 이전에 발견·수정 완료)

**4. [Rule 1 - Bug] L7 단락 길이(200자) 게이트 위반 3건 수정**
- **Found during:** Task 1, `node scripts/check-lesson-structure.mjs` 최초 실행
- **Issue:** `2-3-typescript-setup.mdx` 본문 단락 3개가 200자 상한을 초과(219자·201자·205자)했다.
- **Fix:** 각 단락을 자연스러운 문장 경계에서 둘로 분리, 의미·내용은 변경하지 않았다.
- **Files modified:** `src/content/lessons/step-2/2-3-typescript-setup.mdx`
- **Verification:** `node scripts/check-lesson-structure.mjs` 재실행 통과
- **Committed in:** `b7c233c`(Task 1 최초 커밋에 이미 반영)

---

**Total deviations (auto-fixed):** 4 (2 Rule-3 blocking-환경 셋업, 1 Rule-1 콘텐츠 아티팩트 버그, 1 Rule-1 단락 길이 버그)
**Impact on plan:** 환경 셋업 2건은 이 worktree가 신선한 clone이라 필연적으로 필요했던 절차이며 추적 대상 파일을 변경하지 않았다. 콘텐츠 버그 2건은 배포 전 발견·수정되어 프로덕션에 영향이 없다. 계획 범위(`2-3-typescript-setup.mdx`, `2-6-project-ai-shop-backend.mdx` 본문 작성)를 벗어나지 않았다.

## Issues Encountered

- **Write 도구의 `</content>` 아티팩트:** 두 파일 모두 `Write` 도구로 초안을 저장한 직후 파일 끝에 의도하지 않은 `</content>` 줄이 남아 있었다. 원인은 확인하지 못했으나(도구 자체의 동작으로 추정), 매번 저장 직후 `tail -c` 또는 `velite build`로 즉시 검증하는 습관으로 두 건 모두 배포 전에 잡았다. 이후 Plan에서도 같은 증상이 재발할 수 있으니 저장 직후 빌드 검증을 권장한다.
- 그 외 특이사항 없음 — 두 태스크 모두 계획대로 실행됐고 재작업 없이 게이트를 통과했다.

## User Setup Required

None - 외부 서비스 설정 불필요. (로컬 검증용 더미 `.env.local`은 이 실행자가 만들고 커밋하지 않았다 — 실제 배포는 Vercel 프로젝트 환경 변수를 그대로 사용한다.)

## Next Phase Readiness

- Plan 07(매니페스트 실측 갱신)이 이 Plan이 전환한 2건(`2-3-typescript-setup`, `2-6-project-ai-shop-backend`)을 포함해 Wave 2 종료 시점의 `hasContent: true` 총 개수를 실측해야 한다.
- `check-manifest.mjs`는 이 Plan 실행 시점 기준 여전히 의도적으로 red 상태다(계획대로, 손대지 않음).
- `2-6`이 확립한 5행 체크리스트 표 패턴은 나머지 프로젝트 가이드 3편(`3-2-project-rag-agent`, `3-5-project-orchestration`, `3-7-project-ax-launch`)이 참고할 수 있다.
- 블로커 없음.

---
*Phase: 05-step-2-3*
*Completed: 2026-08-26*

## Self-Check: PASSED

Both files (`src/content/lessons/step-2/2-3-typescript-setup.mdx`, `src/content/lessons/step-2/2-6-project-ai-shop-backend.mdx`) exist on disk with `hasContent: true`, and both commits (`b7c233c`, `9c8bc98`) are present in `git log --oneline`.
