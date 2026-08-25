---
phase: 05-step-2-3
plan: 01
subsystem: content
tags: [mdx, velite, tailwind-typography, next.js, lesson-gate, shiki]

# Dependency graph
requires:
  - phase: 04-step-1
    provides: 6단 헤딩 표준·해보기/정답 블록 형식·이 레슨의 단어 표(D-49~D-61) — 이 Plan이 Step 2·3으로 승계
provides:
  - "3형식(심화 승계·개요 신규·프로젝트 준비 가이드 신규) 확정 골격 — Plan 02~13이 그대로 승계"
  - "step-1/2/3 전체를 검사하는 확장 구조 게이트(L1~L7, 13개 허용 펜스 언어)"
  - "실측 기반 EXPECTED_HAS_CONTENT_COUNT=13 매니페스트 상수"
  - "prose 문단 간격 CSS 패턴(line-height 1.8 + 직계 자식 p만 margin-block 2.4em)"
  - "L7 단락 길이(200자) 자동 게이트 — 남은 22편이 상시 강제받음"
affects: [05-step-2-3 Plan 02~13, 06-design-pass]

# Actuals (#2632)
actuals:
  tokens: 20977
  tasks: 3
  commits: 7

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "6단 헤딩(D-10) 고정 + 형식별 재해석(심화=실습형 해보기, 개요=판단형 해보기, 프로젝트 가이드=준비형 해보기)"
    - "구조 게이트 L1~L6 로직 무변경 + 디렉터리 배열(LESSON_DIRS)로 스코프만 확장"
    - "L7 단락 길이 게이트: maximal run of non-blank lines를 단락으로 취급, 헤딩/목록/표/인용/코드펜스/HTML태그/frontmatter 제외"
    - ".prose > p 직계 자식 한정 margin — 중첩 문단(li/details/blockquote)은 플러그인 기본값 유지"
    - "MDX 본문에서 인라인 코드 안에 백틱을 중첩하지 않는다 — 코드 span이 조기 종료되어 JSX가 그대로 노출되며 npm run build는 이를 잡지 못한다"
    - "next start + curl 전수조사가 실질적 pre-push 게이트 — /lesson/[lessonId]는 on-demand 서버 렌더라 build가 MDX 렌더 실패를 못 잡는다"

key-files:
  created:
    - src/content/lessons/step-3/3-1-vector-search-basics.mdx
    - src/content/lessons/step-2/2-4-project-ai-shop-frontend.mdx
    - .planning/phases/05-step-2-3/COVERAGE.md
  modified:
    - src/content/lessons/step-2/2-3-react-components.mdx
    - scripts/check-lesson-structure.mjs
    - scripts/check-manifest.mjs
    - src/app/globals.css
    - src/content/lessons/step-1/1-1-course-orientation.mdx
    - src/content/lessons/step-1/1-1-dev-environment-setup.mdx
    - src/content/lessons/step-1/1-2-generative-ai-basics.mdx
    - src/content/lessons/step-1/1-2-git-branch-and-pr.mdx
    - src/content/lessons/step-1/1-3-python-functions-and-io.mdx
    - src/content/lessons/step-1/1-3-python-variables-and-types.mdx
    - src/content/lessons/step-1/1-4-relational-db-basics.mdx
    - src/content/lessons/step-1/1-5-ml-metrics-and-pipeline.mdx
    - src/content/lessons/step-1/1-5-ml-model-types.mdx

key-decisions:
  - "세 형식(심화 승계·개요 신규·프로젝트 가이드 신규) 사용자 승인 — 22편 집필 표준으로 확정 (승인 답변: '승인')"
  - "Step 3 개요 깊이 판정 = (c) 너무 깊다, 더 줄여도 된다 — D-62 depth 기준이 파일럿 작성 후 아래로 재조정됨. 3-1-vector-search-basics.mdx 자체는 이번 라운드에서 트림하지 않았고, Wave 4 착수 직전 Step 2 배치 완료 후 트림 예정"
  - "npm 패키지 3종(prisma, @prisma/client, @anthropic-ai/sdk) 정당성 사용자 확인 완료 — Plan 04·06 착수 조건 충족"
  - "EXPECTED_HAS_CONTENT_COUNT 실측 13 확정 — CONTEXT.md D-78 원문 '11 → 14(Wave 1)'과 불일치, 실측이 우선(RESEARCH Open Question 1 예견대로)"
  - "L7 단락 길이 게이트(200자) 신설 — 사용자 리뷰(문단 구분 없이 장문 나열)에 대응, 남은 22편에 상시 적용"
  - ".prose line-height 1.6→1.8, 문단 margin 신설(2.4em) — 기존 UI-SPEC UX-03 근거 문구가 부정확했음을 발견하고 정정. UI-SPEC 문서 자체는 Plan 05-13이 갱신할 것"

patterns-established:
  - "형식별 ④ 실무 예제 재해석: 심화=실행 코드, 개요=읽기 전용 스니펫+실행 불필요 안내, 프로젝트 가이드=준비물 체크리스트 표(코드 없음)"
  - "형식별 해보기 성격: 심화=실습형, 개요=판단·설계형, 프로젝트 가이드=준비 실행형(정답 대신 '성공 시 이런 결과' 서술)"
  - "MDX 재작성/편집 시 인라인 코드 안에 백틱 중첩 금지 — 대신 문장을 풀어써서 표현"
  - "prose CSS 여백 변경 시 로컬 next start + curl로 실제 렌더를 확인한 뒤 푸시 — build 통과는 렌더 성공의 증거가 아님"

requirements-completed: [CONT-05]

coverage:
  - id: D1
    description: "2-3-react-components.mdx를 구 표준에서 신표준(해보기 2~3개, 접힌 정답 블록, 단어 표)으로 재작성하고 구조 게이트를 step-1/2/3 전체로 확장"
    requirement: "CONT-05"
    verification:
      - kind: automated_ui
        ref: "node scripts/check-lesson-structure.mjs (13개 레슨, 7개 검사) + npm run build + curl production 200"
        status: pass
    human_judgment: false
  - id: D2
    description: "3-1-vector-search-basics.mdx — Step 3 개요 형식 신규 파일럿(임베딩/벡터 검색/청크/메타데이터, 읽기용 typescript 스니펫, 판단형 해보기 3개)"
    requirement: "CONT-05"
    verification:
      - kind: manual_procedural
        ref: "Task 3 checkpoint 항목 2 — 사용자 답변 '2. c' (너무 깊다, 더 줄여도 된다)"
        status: pass
    human_judgment: true
    rationale: "깊이 적정성은 자동 검증 불가 — 사용자가 (c)로 판정, 다음 depth 조정 필요(Deviation 3 참고)"
  - id: D3
    description: "2-4-project-ai-shop-frontend.mdx — 프로젝트 준비 가이드 형식 신규 파일럿(준비물 체크리스트, 준비 완료 판정 체크박스, 준비형 해보기 3개)"
    requirement: "CONT-05"
    verification:
      - kind: manual_procedural
        ref: "Task 3 checkpoint 항목 5 — 승인(블랭킷 승인, 별도 경계 이의 없음)"
        status: pass
    human_judgment: true
    rationale: "'재현 아님' 경계 판정은 사람 눈으로만 확인 가능 — 이의 없이 통과"
  - id: D4
    description: "readability rework — L7 단락 길이 게이트 신설 + prose CSS 문단 간격 재조정, 13편 전체 재문단화"
    verification:
      - kind: unit
        ref: "node scripts/check-lesson-structure.mjs (7개 검사, 13개 레슨 전체 green)"
        status: pass
      - kind: e2e
        ref: "next start + curl 13개 hasContent:true URL 전수 200, production 4개 URL 200 확인"
        status: pass
    human_judgment: false
  - id: D5
    description: "npm 패키지 3종 정당성 확인 (prisma, @prisma/client, @anthropic-ai/sdk)"
    verification:
      - kind: manual_procedural
        ref: "Task 3 checkpoint 항목 9 — 사용자 답변 '9. 확인했어'"
        status: pass
    human_judgment: true
    rationale: "패키지 정당성은 npm 레지스트리 페이지를 사람이 직접 눈으로 확인해야 하는 blocking-human 게이트(Rule 3 예외)"

duration: 3h 08min (23:07 첫 커밋 ~ 익일 02:15 체크포인트 재확인 마감; 실집필 구간은 49분)
completed: 2026-08-26
status: complete
---

# Phase 5 Plan 1: Step 2·3 형식 확정 파일럿 3편 + 구조 게이트 확장 + 가독성 재작업 Summary

**세 형식(심화 승계·개요 신규·프로젝트 가이드 신규)을 파일럿 3편으로 실증하고 구조 게이트를 step-1/2/3 전체로 확장 — 사용자 승인 후 가독성 결함(문단 간격 역전 + 장문 단락)을 발견해 CSS·L7 게이트·13편 전체 재문단화로 재작업, 재승인 대기 중 최종 승인 완료**

## Performance

- **Duration:** 실행 구간 약 49분(2026-08-25 23:07~23:56, 6개 작업 커밋) + 체크포인트 대기·재확인
- **Started:** 2026-08-25T23:07:27+09:00
- **Completed:** 2026-08-26 (Task 3 체크포인트 재확인 승인 완료)
- **Tasks:** 3 (Task 1 재작성+게이트 확장, Task 2 신규 형식 2편+매니페스트, Task 3 체크포인트 — 승인 완료)
- **Files modified:** 16 (신규 2, 게이트/CSS/매니페스트 3, Step 2 재작성 1, Step 1 편차 편집 10, 문서 선언 1)

## Accomplishments

- 3형식(심화·개요·프로젝트 준비 가이드) 골격을 파일럿 3편으로 실증하고 **사용자 승인 완료** — 22편 집필 표준 확정
- 구조 게이트(`check-lesson-structure.mjs`)를 Step 1 전용에서 step-1/2/3 전체로 확장(D-71), 허용 펜스 언어 5→13개(D-72), 로직은 무변경 유지
- 매니페스트 상수(`EXPECTED_HAS_CONTENT_COUNT`)를 CONTEXT.md 원문이 아닌 `.velite/lessons.json` 실측(13)으로 확정 — 원문(14)과 불일치를 명시적으로 기록
- 프로덕션 배포 중 발견된 MDX 렌더링 500 결함(중첩 백틱)을 즉시 수정하고 재검증
- 사용자 가독성 피드백("문단 띄어쓰기가 너무 소극적")에 대응해 근본 원인 2건(CSS 문단/줄 간격 역전, 장문 단락)을 모두 수정하고 재배포
- L7 단락 길이(200자) 자동 게이트를 신설해 남은 22편이 같은 결함을 재발시키지 못하도록 상시 강제
- Task 3 체크포인트 승인 완료 — 세 형식 확정, Step 3 깊이 하향 조정 필요, 패키지 3종 정당성 확인, Plan 04·06 착수 가능

## Task Commits

Each task was committed atomically (Task 2 required one Rule-1 bug-fix commit, and the post-approval readability rework added three more commits):

1. **Task 1: 2-3-react-components 재작성 + 게이트 확장 + 배포** - `bcd8deb` (feat)
2. **Task 2: 신규 형식 2편(3-1, 2-4) + 매니페스트 갱신 + 배포** - `8146d41` (feat)
   - Rule 1 bug-fix (server-render 500): `44a517e` (fix) — 중첩 백틱이 MDX 코드 span을 조기 종료시켜 `<Link>` JSX가 그대로 노출됨
3. **Readability rework (사용자 체크포인트 피드백 대응, Task 3 재확인 전 삽입)**:
   - `13cb004` (fix) — `.prose` line-height 1.6→1.8, 문단 margin 2.4em 신설, 잘못된 UX-03 주석 정정
   - `cfd780e` (feat) — L7 단락 길이(200자) 게이트 신설
   - `9d1d66c` (fix) — 13편 전체 재문단화(의미·표현 불변, 단락 분리만)
4. **Task 3: 아이패드 프로덕션 확인 체크포인트** — 승인 완료 (커밋 없음, 사용자 응답 기반)

**Plan metadata:** (이 커밋 — `docs(05-01): complete Step 2·3 pilot plan`)

_Note: 6개 실행 커밋 + 1개 메타데이터 커밋 = 총 7개._

## Files Created/Modified

- `src/content/lessons/step-3/3-1-vector-search-basics.mdx` - Step 3 개요 형식 신규 파일럿 (hasContent: false → true)
- `src/content/lessons/step-2/2-4-project-ai-shop-frontend.mdx` - 프로젝트 준비 가이드 형식 신규 파일럿 (hasContent: false → true)
- `src/content/lessons/step-2/2-3-react-components.mdx` - 구 표준 → 신표준 전면 재작성 (프론트매터 불변)
- `scripts/check-lesson-structure.mjs` - LESSON_DIRS 3디렉터리 확장, 13개 허용 펜스 언어, L7 단락 길이 게이트 신설
- `scripts/check-manifest.mjs` - EXPECTED_HAS_CONTENT_COUNT 11→13(실측), EXPECTED_HAS_CONTENT_SLUGS 2개 추가
- `src/app/globals.css` - `.prose` line-height 1.8, 직계 자식 `p`/`h2`/`h3` margin 재조정
- `.planning/phases/05-step-2-3/COVERAGE.md` - 외부 API 미연동 선언
- `src/content/lessons/step-1/*.mdx` (10편) - **범위 외 편집** — 재문단화만(의미·프론트매터·코드·표 불변). Phase 4 소유 파일이나 사용자 명시 지시로 편집(Deviation 1 참고)

## Decisions Made

- 세 형식(심화·개요·프로젝트 가이드) 사용자 승인 — Plan 02~13이 이 골격을 그대로 승계
- Step 3 개요 깊이 하향 조정 필요(항목 2 = (c)) — `3-1-vector-search-basics.mdx` 자체 트림과 Plan 05-08~05-12(나머지 12편) 저작 기준 모두에 적용되는 후속 의무로 기록(Deviation 3)
- npm 패키지 3종(prisma, @prisma/client, @anthropic-ai/sdk) 정당성 확인 완료 → Plan 04·06 착수 조건 충족
- `EXPECTED_HAS_CONTENT_COUNT` 실측(13) 확정, CONTEXT.md D-78 원문(14)과의 불일치를 이 SUMMARY에 명시 기록
- L7 단락 길이 게이트(200자) 신설 — 향후 22편에 상시 적용

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] MDX 인라인 코드 백틱 중첩으로 인한 프로덕션 500**
- **Found during:** Task 2 배포 직후 프로덕션 검증
- **Issue:** `2-3-react-components.mdx` 해보기 3 본문에서 인라인 코드 안에 백틱을 중첩(`` `<Link href={`/lesson/${slug}`}>` ``)해 코드 span이 조기 종료됨. 남은 `<Link>...</Link>`가 해석되지 않은 MDX JSX로 남아 `/lesson/[lessonId]`가 서버 렌더 시점에 500을 냈다. `npm run build`는 이 페이지가 on-demand 서버 렌더라 이 실패를 잡지 못했다.
- **Fix:** 문장을 백틱 중첩 없이 풀어써서 같은 내용을 전달하도록 재작성
- **Files modified:** `src/content/lessons/step-2/2-3-react-components.mdx`
- **Verification:** `next start` 로컬 실행 후 세 파일럿 slug 모두 에러 다이제스트 없이 200 확인
- **Committed in:** `44a517e`

---

**Total deviations (auto-fixed):** 1 (1 Rule-1 bug)
**Impact on plan:** 프로덕션 500을 배포 직후 발견·즉시 수정. 이후 재작업 라운드(readability rework)에서는 이 결함을 재발시키지 않기 위해 Unit 4에서 `next start` + curl 전수조사를 pre-push 게이트로 명시적으로 추가했다.

---

### Scope Deviations (user-directed rework, not auto-fixed)

**2. Step 1 레슨 10편 편집 — 이 Plan의 `files_modified` 범위 밖**

- **트리거:** 사용자 체크포인트 피드백 원문: "내용은 좋은데 문단이 띄어쓰기가 너무 소극적으로 되어있어서 없던 난독증도 올거 같다. 장문을 너무 문단 분리도 없이 나열해뒀어. 지금 구현된 모든 레슨들 말이야" — "지금 구현된 모든 레슨들"이 Phase 4가 쓴 Step 1 10편까지 포함함을 명시.
- **범위:** `src/content/lessons/step-1/` 10개 파일에서 장문 단락(200자 초과)을 자연스러운 문장 경계에서 분리. 의미·표현·프론트매터·코드·표·헤딩은 전혀 바꾸지 않았다.
- **근거:** 이 Plan의 `files_modified`에는 없지만 사용자가 이 세션에서 명시적으로 지시한 작업이며, `1-4-sql-queries-and-joins.mdx`(이미 195자 이하로 통과)를 제외한 9편 전부가 L7 게이트에 걸렸던 실측 결과가 트리거의 정당성을 뒷받침한다.
- **후속 조치 필요 없음** — Phase 4는 이미 완료 처리된 콘텐츠이므로 이 편집이 Phase 4 SUMMARY를 소급 수정하지는 않는다. 이 SUMMARY가 그 편집의 기록이다.

**3. `.prose` line-height 변경으로 UI-SPEC UX-03 항목이 stale해짐**

- **발견:** 기존 `globals.css`의 `.prose { line-height: 1.6 }` 주석이 "@tailwindcss/typography 기본값(1.5)보다 크게 잡았다"고 UX-03을 근거로 들었으나, 실측 결과 플러그인 실제 기본값은 1.75였다 — 즉 기존 오버라이드는 UX-03의 의도(더 넓은 여백)와 반대로 오히려 좁혔다.
- **조치:** `globals.css`의 값(1.8)과 주석은 이번 Plan에서 정정했다. **UI-SPEC 문서(`01-UI-SPEC.md`) 자체는 건드리지 않았다** — Plan 05-13이 UI-SPEC 갱신을 소유하므로, 그 Plan이 착수할 때 UX-03 항목을 이 실측치로 갱신해야 한다.
- **다음 담당:** Plan 05-13.

**4. (가장 중요) Step 3 깊이 기준(D-62)이 파일럿 작성 이후 하향 조정됨**

- **체크포인트 항목 2 판정:** (c) 너무 깊다, 더 줄여도 된다.
- **의미:** `3-1-vector-search-basics.mdx`가 이미 쓰인 채로 승인됐지만, 승인의 조건이 "이 정도면 됐다"가 아니라 "이보다 얕춰야 한다"는 것이었다. 즉 현재 파일럿은 새 기준을 만족하지 못한 상태로 승인만 받은 것이다.
- **후속 의무 (실행하지 않음 — 기록만):**
  1. `3-1-vector-search-basics.mdx` 자체를 더 얕게 트림해야 한다. **이 Plan에서는 트림을 수행하지 않았다** — Step 2 배치(Plan 02~06)가 끝나고 Wave 4 착수 직전에 트림한다(사용자 지시 순서).
  2. 나머지 Step 3 12편(Plan 05-08~05-12)은 낮아진 기준으로 저작해야 한다: **개념 정의 + 비유 1개**까지만 담고, "실무 판단" 레이어(청크 크기 튜닝, 임베딩 모델 교체 비용 같은 트레이드오프 논의)는 **넣지 않는다** — 이런 자료는 개강 후 본 과정이 다룬다.
  3. 읽기용 코드 스니펫(D-63)은 그대로 유지 — 체크포인트 항목 3(코드 부담 여부)에는 이의가 없었다.
- **영향받는 Plan:** 05-08, 05-09, 05-10, 05-11, 05-12 (Step 3 12편 저작 Plan), 그리고 `3-1-vector-search-basics.mdx` 자체를 다룰 트림 작업(Wave 4 직전, 아직 별도 Plan/Task로 배정되지 않음 — 실행자가 착수 시 이 SUMMARY를 참조해야 함).

---

**Total deviations:** 1 auto-fixed (Rule 1 bug) + 4 scope/follow-on deviations (2건은 완료된 편집, 2건은 향후 실행 의무 기록)
**Impact on plan:** 자동 수정 1건은 배포 안정성에 필수적이었다. 범위 외 편집(Step 1)은 사용자 명시 지시였고 의미 변경이 없어 저위험이다. UI-SPEC 항목은 문서 전용 후속 작업이라 코드 영향 없음. Step 3 깊이 하향은 나머지 12편 저작 기준을 바꾸는 실질적 영향이 있으며, 이 SUMMARY가 그 의무의 유일한 기록이므로 Plan 05-08 착수자는 반드시 이 문서를 먼저 읽어야 한다.

## Issues Encountered

- **체크포인트 승인 시점과 배포 반영 시점의 어긋남:** 사용자가 "승인 2.c 9.확인했어"를 보낸 시점은 가독성 재작업(L7 게이트 + CSS + 13편 재문단화)이 아직 배포 중이었다. **사용자는 새 문단 간격을 직접 확인하고 승인한 것이 아니다** — 승인은 원래 세 파일럿(형식·깊이·경계·패키지)에 대한 것이었고, 가독성 재작업은 그 승인 전에 별도로 트리거되어 이미 배포까지 완료된 상태였다. 사용자가 다음에 아이패드로 세 페이지를 열었을 때 문단 간격이 달라져 있는 것을 확인은 못 한 채 승인했다는 사실을 정확히 기록해둔다 — 필요하면 다음 세션에서 재확인을 요청해야 한다.
- 그 외 특이사항 없음 — Task 1·2는 계획대로 실행됐고, Task 3는 한 번의 재작업 라운드(가독성) 후 승인으로 종료됐다.

## User Setup Required

None - 외부 서비스 설정 불필요.

## Next Phase Readiness

- **Plan 04, 06 착수 가능** — 패키지 3종(prisma, @prisma/client, @anthropic-ai/sdk) 정당성 확인 완료(체크포인트 항목 9)
- **Plan 02~13 착수 가능** — 세 형식 골격 확정, D-77(배치 사이 재확인 없음) 적용
- **Plan 05-08~05-12 착수 전 필독:** 이 SUMMARY의 "Deviation 4"(Step 3 깊이 하향)를 반드시 반영해서 저작할 것 — 개념 정의 + 비유 1개만, 실무 판단 레이어 제외
- **Wave 4 착수 직전 별도 트림 필요:** `3-1-vector-search-basics.mdx`를 낮아진 깊이 기준으로 얕게 다시 편집 — 아직 Plan/Task로 배정되지 않음, 이 SUMMARY가 유일한 추적 기록
- **Plan 05-13 착수 시 UI-SPEC 갱신 필요:** UX-03 항목의 line-height 근거 수치를 1.5(오기) → 1.75(플러그인 실제 기본값)로 정정하고 최종 값 1.8을 반영
- 블로커 없음

---
*Phase: 05-step-2-3*
*Completed: 2026-08-26*

## Self-Check: PASSED

All 8 files referenced in this SUMMARY exist on disk, and all 6 execution commits (`bcd8deb`, `44a517e`, `8146d41`, `13cb004`, `cfd780e`, `9d1d66c`) are present in git history.
