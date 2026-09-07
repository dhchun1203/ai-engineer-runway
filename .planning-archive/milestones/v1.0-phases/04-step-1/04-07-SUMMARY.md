---
phase: 04-step-1
plan: 07
subsystem: content
tags: [velite, gates, e2e, mdx, copywriting, docs]

# Dependency graph
requires:
  - phase: 04-step-1
    plan: "01-06"
    provides: "Step 1 레슨 10편 전체(hasContent: true) + eli5 × 6단 표준 + scripts/check-lesson-structure.mjs"
provides:
  - "scripts/check-manifest.mjs Invariant 10 상수 갱신 — EXPECTED_HAS_CONTENT_COUNT 2 → 11, green"
  - "src/app/lesson/[lessonId]/page.tsx 빈 상태 카피 갱신 — Step 1 완성 사실 반영"
  - "01-UI-SPEC.md Copywriting Contract·Edge-state 표 정합(33 → 24)"
  - "docs/making-of.md 4단계 기록"
  - "Phase 4 종단 스위트 8/12 항목 실측 green — 나머지 4항목(e2e 2개·Supabase 확인·프로덕션 배포검증)은 이 worktree에서 구조적으로 실행 불가, 오케스트레이터 후속 조치 필요"
affects: [phase-05-step-2-3]

actuals:
  tokens: 2061
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "check-manifest.mjs Invariant 10 상수는 .velite/lessons.json에서 직접 읽어 만든다 — 기억으로 적지 않는다"

key-files:
  created: []
  modified:
    - scripts/check-manifest.mjs
    - src/app/lesson/[lessonId]/page.tsx
    - .planning/phases/01-deployed-curriculum-skeleton/01-UI-SPEC.md
    - docs/making-of.md

key-decisions:
  - "Task 3의 e2e 실측·프로덕션 배포는 이 worktree에서 실행하지 않았다 — .env.local 부재(gitignore로 worktree에 복제되지 않음)와 worktree 격리(master에 직접 push 불가, 상위 objective 지시)가 겹친 구조적 제약. Plan 01 Task 2와 동일한 패턴(구조적 편차, Rule 해당 없음)."
  - "powershell 코드펜스 2색 한계(04-01 Known Limitation)는 이번 Plan에서 손대지 않기로 결정 — globals.css는 이 Plan의 산출물 목록에 없고(prohibitions), 수정하려면 콘텐츠 자체를 바꿔야 해 범위를 벗어난다. 백로그로 남긴다."
  - "min-height 바닥값(04-01 Known Limitation)은 이제 관측 가능한 1줄 코드 블록이 2개 생겼음을 확인했으나, 이 worktree에 headless-browser 도구가 없어 계산값 실측은 못 했다 — 프로덕션 배포 후 사람 확인이 필요한 항목으로 명시적으로 이관한다."

requirements-completed: [CONT-02, CONT-03]

coverage:
  - id: D1
    description: "check-manifest.mjs Invariant 10이 실제 매니페스트(11편)와 일치해 green이다"
    requirement: "CONT-02"
    verification:
      - kind: unit
        ref: "node scripts/check-manifest.mjs → all 13 invariants passed"
        status: pass
      - kind: unit
        ref: "node -e slug-set 정확 일치 확인 (11개, .velite/lessons.json 대조) → exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "빈 상태 안내 문구가 Step 1 완성 사실을 반영하고 UI-SPEC 계약과 글자 단위로 일치한다"
    requirement: "CONT-02"
    verification:
      - kind: unit
        ref: "git diff로 page.tsx <p> 문구와 01-UI-SPEC.md Empty state body 행 대조 — 이스케이프 제외 동일 문자열 확인"
        status: pass
    human_judgment: false
  - id: D3
    description: "docs/making-of.md에 4단계 기록이 추가되고 브랜드 게이트를 통과한다"
    verification:
      - kind: unit
        ref: "node scripts/check-brand.mjs → 위반 없음, 85개 파일 검사 완료"
        status: pass
    human_judgment: false
  - id: D4
    description: "Phase 3 상시 게이트 5종(math/schedule/pace/progress-gates/brand)이 Step 1 콘텐츠 추가 후 회귀 없이 통과한다"
    verification:
      - kind: unit
        ref: "check-progress-math/check-schedule/check-pace/check-progress-gates/check-brand 5개 명령 모두 exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "e2e-progress.mjs·e2e-today.mjs가 통과해 진행률·오늘의 학습 루프가 Step 1 콘텐츠로 실제 왕복함을 실측한다 (ROADMAP 성공 기준 4)"
    requirement: "CONT-02"
    verification: []
    human_judgment: true
    rationale: "이 worktree에 .env.local(Supabase 자격증명)이 없어(gitignore로 worktree에 복제되지 않음) 실행 불가 — placeholder 값으로는 실제 네트워크 왕복을 증명할 수 없다. 오케스트레이터가 master 병합 후 실 자격증명 환경에서 실행해야 한다. 미검증 상태를 명시적으로 남긴다."
  - id: D6
    description: "Step 1 10편이 프로덕션에서 200으로 읽히고 정답 보기·빈 상태 문구가 올바르게 렌더된다"
    verification: []
    human_judgment: true
    rationale: "이 worktree는 master에 push할 권한이 없고(objective 지시) 배포도 발생시키지 않았다 — 프로덕션 URL에는 이 Plan의 변경 사항이 아직 반영되지 않았다. 오케스트레이터의 병합·배포 이후에만 확인 가능하다."

duration: 단일 세션(worktree 병렬 executor)
completed: 2026-08-25
status: complete
---

# Phase 4 Plan 7: 종단 게이트 + 매니페스트 상수 갱신 Summary

**`check-manifest.mjs`의 `EXPECTED_HAS_CONTENT_COUNT`를 2→11로 올려 매니페스트 게이트를 green으로 되돌리고, 빈 상태 카피·UI 계약·making-of를 Step 1 10편 완성 사실에 맞게 갱신했으며, Phase 4 종단 스위트 12개 항목 중 8개(빌드·구조·브랜드·매니페스트·진행률 4종 상시 게이트)를 실측 green으로 확인했다 — 나머지 4개(e2e 2개·Supabase 잔여 확인·프로덕션 배포검증)는 worktree 격리(Supabase 자격증명 부재 + master push 권한 없음)로 이 executor가 실행할 수 없어 오케스트레이터 후속 조치로 명시적으로 이관했다.**

## Performance

- **Tasks:** 3/3 실행(Task 1·2 완결, Task 3은 계획된 12개 항목 중 8개를 실측하고 4개는 구조적 제약으로 이관)
- **Files modified:** 4 (`check-manifest.mjs`, `page.tsx`, `01-UI-SPEC.md`, `making-of.md`)
- **Commits:** 2 (Task 1, Task 2 — Task 3은 파일을 만들거나 고치지 않음, 계획대로)

## Accomplishments

- `scripts/check-manifest.mjs`: `EXPECTED_HAS_CONTENT_COUNT`를 2에서 11로, `EXPECTED_HAS_CONTENT_SLUGS`를 `.velite/lessons.json`에서 직접 읽어 확인한 11개 슬러그(Step 1 10편 + Step 2 파일럿)로 갱신. 주석을 현재 사실에 맞게 재작성. Invariant 로직·다른 3개 상수(총 분·분포·프로젝트 모듈 수)는 무변경 확인
- `src/app/lesson/[lessonId]/page.tsx`: 빈 상태 `<p>` 문구를 "Step 1의 레슨 10편과 Step 2 React 컴포넌트 파일럿 레슨은 모두 작성되어 있으니 먼저 그쪽부터 학습해보세요"로 교체 — 옛 "Python 변수·자료형 파일럿" 문구 제거. `<h2>`·클래스·구조는 불변
- `01-UI-SPEC.md`: Copywriting Contract의 Empty state heading/body 행과 Edge-state 표의 빈 상태 레슨 수(33 → 24, `.velite/lessons.json`에서 실측)를 page.tsx 실제 문구와 글자 단위로 맞춤
- `docs/making-of.md`: "4단계 — Step 1 레슨 10편" 섹션을 3단계 다음, "6️⃣ 확인하기" 앞에 신설(불릿 6개, 04-01~06-SUMMARY.md에서 확인된 사실만 서술) + 마지막 갱신 줄 갱신
- Phase 4 종단 스위트 12개 항목 중 8개를 이 worktree에서 직접 실행해 green 확인: `npm run build`, `check-manifest`(13 invariants), `check-lesson-structure`(10개 레슨, 6개 검사), `check-brand`(85개 파일, 위반 0), `check-progress-math`(11케이스), `check-schedule`(18케이스), `check-pace`(18케이스), `check-progress-gates`(all gates passed, G10만 조건부 skip — 시크릿 부재 정상 동작)
- 새로 관측 가능해진 1줄 코드 블록 2개(`1-2-git-branch-and-pr.mdx` text, `1-4-relational-db-basics.mdx` sql)를 확인했지만, 이 worktree에 headless-browser 도구가 없어 `min-height` 계산값 실측은 못 함 — 아래 "알려진 발견사항 처리" 참고

## Task Commits

1. **Task 1: 매니페스트 게이트 상수 갱신 + 빈 상태 카피·UI 계약 정합** — `722501f` (feat)
2. **Task 2: making-of 4단계 기록 (PLAT-03)** — `360cae9` (docs)
3. **Task 3: Phase 4 종단 스위트 + 프로덕션 배포** — 커밋 없음(계획대로 "파일을 만들거나 고치지 않는다") — 8/12 항목 실측 완료, 나머지 4개는 이 SUMMARY의 "Deferred to Orchestrator" 섹션 참고

**Plan metadata:** 이 문서(SUMMARY.md) 커밋 — 오케스트레이터가 별도 처리(STATE.md/ROADMAP.md는 이 실행자가 건드리지 않음)

## Files Created/Modified

- `scripts/check-manifest.mjs` — `EXPECTED_HAS_CONTENT_COUNT`(2→11)·`EXPECTED_HAS_CONTENT_SLUGS`(2→11개)·주석만 변경, Invariant 로직·다른 3개 상수 불변
- `src/app/lesson/[lessonId]/page.tsx` — 빈 상태 `<p>` 문구 교체, JSX 구조·className 불변
- `.planning/phases/01-deployed-curriculum-skeleton/01-UI-SPEC.md` — Empty state heading/body 행 + Edge-state 표 빈 상태 개수(33→24) 갱신
- `docs/making-of.md` — "4단계" 섹션 신설(불릿 6개) + 마지막 갱신 줄

## Decisions Made

- **매니페스트 상수는 손으로 세지 않고 `.velite/lessons.json`을 직접 읽어 확정** — T-04-20 위협 완화. `node -e` 검증으로 11개 슬러그 집합이 정확히 일치함을 exit 0으로 확인
- **PowerShell 2색 한계는 이번에 손대지 않는다** — `globals.css`는 이 Plan의 산출물 목록/prohibitions 밖이고, 근본 수정은 콘텐츠 자체(코드 예시에 색상 붙는 키워드 추가)를 요구해 범위를 벗어난다. 백로그 항목으로 남긴다
- **e2e·프로덕션 배포는 오케스트레이터로 명시적으로 이관** — Plan 01 Task 2와 동일한 구조적 제약(worktree에 `.env.local` 없음 + master push 권한 없음, 상위 objective 지시로 확인됨). 임의로 placeholder 값을 넣어 "통과시키는" 방식은 실제 왕복을 증명하지 못하므로 채택하지 않았다

## Deviations from Plan

### 구조적 편차 (Rule 해당 없음 — 실행 환경 불일치, Plan 01 Task 2와 동일 패턴)

**Task 3의 `<precondition>`("`.env.local` 존재 + `git remote`에 `origin` + 현재 브랜치 `master` + 푸시 권한")이 worktree 격리 실행과 구조적으로 충돌했다.**

확인 결과:
- `ls -la .env*` → `.env.example`만 존재, `.env.local` 없음 (`.gitignore`의 `.env*` 규칙 때문에 worktree 생성 시 복제되지 않음 — 저장소 어디에도 실제 자격증명이 커밋된 적 없으므로 이는 정상 동작)
- `git rev-parse --abbrev-ref HEAD` → `worktree-agent-a23a10ed4919e3477` (master 아님)
- 상위 objective가 명시: "Do NOT push — the orchestrator merges your branch and pushes (worktree agents cannot push to master)"

두 조건 모두 명시적으로 불충족이며, 이 조합은 이 Plan을 병렬 worktree executor로 dispatch하는 구조 자체에서 항상 발생한다(사람이 뭔가를 놓쳐서가 아니다). Plan 01 Task 2가 이미 같은 패턴을 겪었고 오케스트레이터가 병합 후 `master` push·배포를 대신 수행했다(`792b8f5`).

**이 Plan에서 실행하지 못한 것 (Task 3 verify의 9~12번, 총 12개 중 4개):**
1. `node --env-file=.env.local scripts/e2e-progress.mjs` — Supabase 자격증명 부재로 미실행
2. `node --env-file=.env.local scripts/e2e-today.mjs` — 위와 동일
3. `node --env-file=.env.local scripts/check-supabase-progress.mjs` — 위와 동일
4. `git push origin master` + 프로덕션 확인(Step 1 10편 200·정답 보기·빈 상태 문구·`/`·`/curriculum`) — push 권한 없음

**Deferred to Orchestrator (필수 후속 조치):**
오케스트레이터가 이 브랜치를 `master`에 병합한 뒤, 실제 Supabase 자격증명이 있는 환경(메인 체크아웃의 `.env.local`)에서 아래를 순서대로 실행해야 Phase 4가 진짜로 닫힌다:
1. `node --env-file=.env.local scripts/e2e-progress.mjs` — 프로브 레슨 슬러그를 SUMMARY 또는 커밋 메시지에 기록
2. `node --env-file=.env.local scripts/e2e-today.mjs`
3. `node --env-file=.env.local scripts/check-supabase-progress.mjs` — 프로브 잔여 행 0건 확인
4. `git push origin master` → Vercel 배포 대기 → 프로덕션에서 Step 1 10편 각 `/lesson/{slug}` 200 + `정답 보기` 포함, 미작성 레슨 1편의 새 빈 상태 문구, `/`·`/curriculum` 200 확인

이 네 단계가 끝나기 전까지는 ROADMAP 성공 기준 4("진행률·오늘의 학습 루프가 Step 1 콘텐츠로 실제로 채워짐")가 자동으로는 실측되지 않은 상태다 — 8/12 게이트가 green인 것과 "루프가 끝까지 왕복함"은 다른 주장이며, 이 SUMMARY는 후자를 주장하지 않는다.

## Known Findings 처리 (05건, 04-07-PLAN 인계 사항)

**1. 04-05(SQL)이 SQL 예제를 실 Supabase에서 실행하지 못함.**
이 Plan도 같은 이유(Supabase 자격증명 부재)로 라이브 실행하지 못했다. 04-05가 이미 문법·의미론 검토로 검증했고, 이 Plan은 그 이상을 추가하지 못한다. **사람 검증 항목으로 명시 이관**: 학습자가 `1-4-relational-db-basics`·`1-4-sql-queries-and-joins`를 실제로 처음 학습할 때 SQL 에디터에서 코드를 그대로 실행해 보는 것이 이 잔여 리스크의 첫 실측이 된다.

**2. PowerShell 코드펜스 2색 한계(04-01 Known Limitation).**
"Decisions Made" 참고 — 이번 Plan에서 손대지 않기로 결정(globals.css는 산출물 목록 밖, 콘텐츠 변경 필요). 백로그로 남김.

**3. `min-height` 단일 줄 코드 블록 미실측.**
이제 관측 가능한 사례가 2개 생겼다: `1-2-git-branch-and-pr.mdx`(`text`, 1줄), `1-4-relational-db-basics.mdx`(`sql`, 1줄) — `node` 스크립트로 코드펜스 라인 수를 직접 세어 확인. 그러나 이 worktree에 Playwright/Puppeteer 등 headless-browser 도구가 설치되어 있지 않아(package.json에 없음, node_modules에도 없음) 계산된 `min-height` 값을 실측하지 못했다. **사람 검증 항목으로 명시 이관**: 프로덕션 배포 후 두 URL에서 코드 블록 높이·복사 버튼 겹침을 육안 확인 필요.

**4. `requirements-completed: [CONT-02, CONT-03]`이 Step 1 전체 기준으로 진짜 충족되는지.**
확인 결과: **Step 1 10편 기준으로는 충족됨.**
- CONT-02(쉬운 개념 설명, 비유+핵심 정리): `check-lesson-structure.mjs`가 10편 전체에서 "## 3. 개념 설명"·"## 6. 핵심 정리 및 스스로 점검" 헤딩 존재를 강제(L1) — 10/10 통과
- CONT-03(실무 예제 코드, 언어별 문법 강조): `node` 스크립트로 10편 전체의 코드펜스 언어 태그를 직접 추출 — `python`(4편)·`powershell`(6편)·`sql`(2편)·`text`(2편), 벌거벗은 펜스 0건(L6이 강제). Shiki 빌드 타임 하이라이팅은 04-01(파일럿)·04-05(SQL 25/27 색 스팬)가 실측 확인
- 단, `REQUIREMENTS.md`(91~106행)는 CONT-02/03을 "Phase 4에서 처음 완전히 충족·검증"으로 귀속시키되 "Phase 5(Step 2·3)가 동일 표준을 적용한다"고 명시한다 — 이것은 **트래킹 스코프 결정**이지 "35레슨 전체가 이미 콘텐츠로 채워졌다"는 주장이 아니다. Step 2·3의 남은 24개 스텁 레슨은 Phase 5에서 같은 표준을 적용받아야 문자 그대로의 사이트 전체 충족이 된다. 이 구분을 명확히 기록해 둔다

**5. `check-lesson-structure.mjs`는 구조만 검사하고 시각적 렌더는 검사하지 않는다.**
04-01의 파일럿 두 렌더 결함(배경 불일치, padding 비대칭)이 정확히 이 방식으로 사람 눈에만 발견됐다는 사실을 이 Plan도 그대로 인계한다. Wave 2의 9편은 04-01이 이미 수정한 `globals.css`를 공유하므로 같은 결함이 반복되지는 않지만, **새로운 시각 결함(예: 위 3번의 min-height, 표·details 렌더링)은 이 Plan의 자동 게이트로 검증되지 않았다** — 프로덕션 배포 후 사람이 최소 한 번은 눈으로 훑어봐야 한다.

## Issues Encountered

- **Fresh worktree에 `node_modules` 없음** — `npm ci`로 해결(523개 패키지, 약 27초)
- **`npm run build`가 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` 없이 실패** — `.env*` 파일을 새로 쓰지 않고 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`UNLOCK_SECRET`/`NEXT_PUBLIC_SITE_URL`을 커맨드 인라인 placeholder로만 전달해 통과시킴(Wave 2 다섯 executor 모두가 보고한 것과 동일한 fresh-worktree 인프라 조건, 이 Plan의 콘텐츠 변경과 무관)

## Known Stubs

None — 이 Plan은 레슨 콘텐츠를 만들거나 고치지 않았다(prohibitions 준수, `git diff --name-only`에 `src/content/lessons/` 파일 없음).

## Threat Flags

None — 새 네트워크 엔드포인트·인증 경로·스키마 변경 없음. `check-manifest.mjs`의 상수 변경은 threat_model T-04-20에 이미 등록되어 있고 위 방식으로 완화·검증됨.

## User Setup Required

None — 이 Plan 실행 자체는 외부 서비스 설정이 필요 없었다. 다만 위 "Deferred to Orchestrator" 4단계를 실행하려면 실 Supabase 자격증명이 담긴 `.env.local`과 `master`에 대한 push 권한이 있는 환경이 필요하다(둘 다 이 worktree 밖에 이미 존재해야 한다 — 새로 발급받을 필요는 없음).

## Next Phase Readiness

- Step 1 10편 콘텐츠·게이트 상수·카피·문서 기록은 이 Plan으로 완결됐다. Phase 5(Step 2·3 콘텐츠)는 이 Plan이 확정한 eli5 × 6단 표준·구조 게이트·매니페스트 패턴을 그대로 이어받을 수 있다
- **Phase 4를 "완전히 닫힌" 상태로 선언하려면 위 "Deferred to Orchestrator" 4단계(e2e 2개·Supabase 잔여 확인·`master` push·프로덕션 확인)가 먼저 끝나야 한다.** 이 SUMMARY는 그 단계들을 "검증됨"으로 주장하지 않는다
- 남은 리스크(우선순위 순): (1) e2e 루프 미실측 — ROADMAP 성공 기준 4 직접 관련, (2) SQL 라이브 실행 미실측(04-05부터 이어짐), (3) 새 1줄 코드 블록의 `min-height` 시각 미실측, (4) PowerShell 2색 한계(수용, 백로그)

---
*Phase: 04-step-1*
*Completed: 2026-08-25*

## Self-Check: PASSED

- FOUND: scripts/check-manifest.mjs
- FOUND: src/app/lesson/[lessonId]/page.tsx
- FOUND: .planning/phases/01-deployed-curriculum-skeleton/01-UI-SPEC.md
- FOUND: docs/making-of.md
- FOUND: .planning/phases/04-step-1/04-07-SUMMARY.md
- FOUND commit: 722501f
- FOUND commit: 360cae9
