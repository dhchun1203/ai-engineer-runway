---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: 사전학습 사이트 v1.0
status: Awaiting next milestone
stopped_at: v1.0 milestone closed
last_updated: "2026-08-27T07:20:04.732Z"
last_activity: 2026-08-27
last_activity_desc: v1.0 shipped and archived (verified_closeout, 7 phases / 51 plans / 20 requirements)
progress:
  total_phases: 7
  completed_phases: 7
  total_plans: 51
  completed_plans: 51
current_phase: null
current_phase_name: null
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-27 after v1.0)

**Core value:** 개강 전까지 커리큘럼의 기초를 확실히 다질 수 있도록 — 콘텐츠를 읽고, 완료를 체크하고, 진행률과 일정을 한눈에 확인하는 흐름이 반드시 동작해야 한다.
**Current focus:** 다음 마일스톤 정의 대기 — 그 전에 사전학습을 실제로 도는 것이 1순위 (개강 2026-09-30)

## Current Position

Phase: Milestone v1.0 complete
Plan: —
Status: Awaiting next milestone
Last activity: 2026-08-27 — Milestone v1.0 completed and archived

### 다음에 할 일

v1.0이 출하·아카이브됐다. 계획된 페이즈(1~6, 8)와 요구사항 20개가 전부 닫혔다.

**지금 1순위는 사이트를 더 만드는 것이 아니라 사전학습을 실제로 도는 것이다.**
개강이 2026-09-30이고, 일정표는 8/28부터 시작한다 — 남은 기간이 곧 사용 기간이다.

새 마일스톤이 필요해지면:

- `/gsd-new-milestone` — questioning → research → requirements → roadmap

후보는 `.planning/PROJECT.md`의 Requirements § Active에 적어 뒀다 (콘텐츠 보완, lint 게이트 편입, 08-REVIEW Warning 5건, 375px 잔존 M3 120건).

## Performance Metrics

**Velocity:**

- Total plans completed: 44
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 6 | - | - |
| 02 | 4 | - | - |
| 03 | 4 | - | - |
| 05 | 13 | - | - |
| 06 | 9 | - | - |
| 08 | 8 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 20min | 3 tasks | 25 files |
| Phase 01 P02 | unknown | 3 tasks | 2 files |
| Phase 01 P03 | 20min | 2 tasks | 37 files |
| Phase 01 P04 | 약 15분 | 3 tasks | 9 files |
| Phase 01 P05 | 약 15분 | 3 tasks | 7 files |
| Phase 01 P06 | 약 20분 | 3 tasks | 3 files |
| Phase 02 P01 | 100min | 3 tasks | 8 files |
| Phase 02 P02 | 35min | 3 tasks | 11 files |
| Phase 02 P03 | 15min | 3 tasks | 8 files |
| Phase 02 P04 | 55min | 3 tasks | 9 files |
| Phase 03 P01 | 36min | 2 tasks | 11 files |
| Phase 03 P02 | ~15min | 3 tasks | 39 files |
| Phase 03 P03 | ~15min | 3 tasks | 8 files |
| Phase 03 P04 | ~40min | 3 tasks | 7 files |
| Phase 05 P01 | 49min | 3 tasks | 16 files |
| Phase 05 P07 | 25min | 2 tasks | 1 files |
| Phase 05 P08 | 45min | 3 tasks | 3 files |
| Phase 05 P13 | session | 3 tasks | 6 files |
| Phase 08 P08 | 약 52분 | 3 tasks | 2 files |

## Accumulated Context

### Roadmap Evolution

- Phase 8 범위 확장 (2026-08-27): 인터랙션·버튼 감각 다듬기를 성능 작업에 합침. `design-taste-frontend` 스킬을 부분 적용(4.5/5/6절만, 랜딩 전용 규칙 제외), Motion 라이브러리는 CSS로 안 되는 지점이 생겼을 때만 조건부 도입. 근거는 ROADMAP Phase 8 상세 참고

- Phase 8 added: 성능·스마트폰 최적화 (2026-08-27) — 리전 이동으로 TTFB 238→68ms 해결 후 남은 정적 생성·폰트·폰 UX 작업

- Phase 7 제거 (2026-08-27): 아이패드 브라우저 실습 환경 — 사용자가 "아이패드에서는 실습 안 한다"로 정리. 아래 추가 항목의 전제(주 사용 기기가 아이패드라 해보기에서 막힌다)가 더 이상 성립하지 않는다. 완료된 Phase 8과의 정합을 위해 재번호하지 않았고 7번은 재사용하지 않는다.

- Phase 7 추가: 아이패드 브라우저 실습 환경 — 2026-08-26 UAT에서 사용자가 제기. "읽기는 아이패드, 실행은 PC"(D-55/D-73)가 아이패드 주 사용자에게 실제 제약이 된다는 문제. 외부 온라인 IDE(D-73이 배제)가 아니라 페이지 내 실행(PGlite 등)으로 검토한다

- Phase 6 added (2026-08-25): 전체 페이지 디자인 정리 — frontend-design 스킬로 토큰·셸·페이지별 마감을 Phase 5 이후 한 번에 적용, 타임박스 2일. 사용자 결정: 콘텐츠 phase보다 앞에 두지 않음(플랫폼 다듬기가 콘텐츠를 잠식하는 리스크 회피)
- 결정 (2026-08-25): 소개 페이지 eli5 재작성(quick 260825-2xv) 사용자 승인 → **레슨 전체에도 eli5 방식 적용**. 단 Phase 4·5 실행 시 **첫 강의 1편을 먼저 작성해 사용자 확인(human-verify 체크포인트)을 받고, 승인되면 나머지 레슨에 적용**한다. Phase 4 계획은 이 순서를 wave 구조에 반영할 것

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 플랫폼(Phase 1~3)을 약 1주로 타임박스하고 나머지 4주를 콘텐츠 집필(Phase 4~5)에 배정 — 리서치 최대 리스크가 "플랫폼 다듬기가 콘텐츠를 잠식"이기 때문
- [Roadmap]: Vercel 배포를 마지막이 아닌 Phase 1에 배치 — 콘텐츠 스프린트 전에 환경 문제를 노출시키기 위함
- [Roadmap]: 콘텐츠를 Step 기준으로 분할(Phase 4 = Step 1, Phase 5 = Step 2·3) — Step 1 완성 즉시 실제 사전학습 시작, 나머지는 병행 집필
- [Roadmap]: 레슨별 예상 소요시간·깊이 배지를 Phase 1 커리큘럼 매니페스트 메타데이터로 확정 — Phase 3 일정 배분의 입력값이 되므로 콘텐츠보다 먼저 필요
- [Roadmap]: Making-of 페이지(PLAT-03)는 Phase 1에 스캐폴드하고 이후 모든 Phase에서 갱신하는 살아있는 문서로 취급
- [Phase ?]: Task 3 저장소 생성/push는 하네스 권한 게이트로 실행자가 자동화 못해 사용자가 직접 실행 (gh repo create ai-engineer-runway --public)
- [Phase ?]: 저장소 기본 브랜치가 main이 아닌 master로 생성됨 (init.defaultBranch 설정 이어받음) — Vercel import는 기본 브랜치 자동 감지라 영향 없음, 편차로만 기록
- [Phase ?]: [Phase 1 Plan 2]: PR 머지 액션은 하네스 권한 게이트로 실행자가 자동화 못해 사용자가 직접 수행 (Rule 3 편차, gh pr merge 차단)
- [Phase ?]: [Phase 1 Plan 2]: Vercel 대시보드 GitHub Import로 프로덕션 배포 연결, 프로젝트명 ai-engineer-runway로 명시 지정(D-15) — main(=master) push→프로덕션/PR→프리뷰 두 경로 모두 실증 완료(D-16)
- [Phase ?]: [Phase 1 Plan 3]: 모듈 title은 curriculum.md 헤더 원문 그대로(Project 태그 포함) 사용, isProject 불리언으로 프로젝트 여부 별도 신호
- [Phase ?]: [Phase 1 Plan 3]: check-manifest.mjs는 curriculum-helpers.ts를 import하지 않고 modules.ts를 독립적으로 정규식 재파싱 — 의존성 0 게이트 요구사항 유지
- [Phase ?]: [Phase 1 Plan 3]: 2-3-react-components.mdx(파일럿 2)도 이번 Plan에서는 hasContent:false로 생성, Plan 06이 본문과 check-manifest.mjs 기대값(EXPECTED_HAS_CONTENT_COUNT=2)을 함께 갱신할 예정
- [Phase ?]: [Phase 1 Plan 4]: 레슨 목록 링크에 제목과 함께 Copywriting Contract Primary CTA 문구('레슨 시작하기')를 병기 — 제목만으로는 식별성 유지, CTA 문구는 계약대로 보조 텍스트로 표시
- [Phase ?]: [Phase 1 Plan 4]: LessonBreadcrumb/LessonPager는 curriculum-helpers.ts를 확장하지 않고 modules.ts의 정적 배열을 직접 참조 — Plan 03 인터페이스 표면을 넓히지 않음
- [Phase ?]: [Phase 1 Plan 5]: docs/making-of.md에 title/slug frontmatter 2줄만 추가(본문 불변) — Velite pages 스키마 요구사항과 PLAT-03의 '원문 그대로 반영' 요구를 동시에 충족
- [Phase ?]: [Phase 1 Plan 5]: SiteNav를 클라이언트 컴포넌트로 구현(usePathname으로 활성 항목 판별) — 테마 컨텍스트 프로바이더 금지 규칙과는 별개(내비 활성 상태 표시일 뿐 테마 상태 저장이 아님)
- [Phase ?]: [Phase 1 Plan 6]: 파일럿 2 실무 예제를 좋아요 버튼 카드(props+state+Link 라우팅)로 설계해 사이트 자체의 실제 컴포넌트 패턴을 참조하게 함
- [Phase ?]: [Phase 1 Plan 6]: 복사 버튼 44px 오버라이드는 min-width/min-height는 충돌 없이 적용되지만 top/margin/background는 selector specificity(.prose 접두사)로 강제해야 함을 확인
- [Phase ?]: [Phase 1 Plan 6]: Plan 03~05가 로컬 커밋만 하고 push하지 않았던 것을 발견 — Task 3 프로덕션 검증 전 git push origin master로 15개 미반영 커밋을 배포에 반영(Rule 3)
- [Phase ?]: Exact-pinned @supabase/supabase-js@2.112.3 and server-only@0.0.1 (no caret) per SUS/ASSUMED package audit flags — Prevents unverified patch versions from silently entering a flagged dependency
- [Phase ?]: Reused existing Supabase project (ai-news-briefing) for public.progress instead of a new dedicated project — Free-tier constraint, user decision; existing tables (subscribers, search_articles) left untouched
- [Phase ?]: tracer feedback gate 인터랙티브 정지 준수 — auto_advance/_auto_chain_active 둘 다 false라 mode:yolo와 무관하게 Task1 이후 체크포인트에서 정지, 사용자가 iPad 제약을 밝히고 자동화 증거로 승인
- [Phase ?]: progress.ts는 '#site/content'를 직접 import하지 않고 Lesson 타입을 NonNullable<ReturnType<typeof getLessonBySlug>>로 파생 — G13(매니페스트 직접 import 금지)을 코드·타입 양쪽에서 지킴
- [Phase ?]: e2e-progress.mjs의 배지 숫자 추출은 React SSR의 <!-- --> 코멘트 마커를 먼저 제거한 뒤 정규식 매칭 — 인접 JSX 표현식 사이에 코멘트가 삽입되는 것이 실행 중 실제로 확인됨
- [Phase ?]: [Phase 2 Plan 4]: ProgressBadge always renders in the home summary block including empty state — only the 28px accent big percent number is suppressed at 0 completions (D-26 requires badge always, truths only forbid emphasizing the big number)
- [Phase ?]: [Phase 2 Plan 4]: Step card progress bar/badge completely omitted (not 0%-rendered) when progress prop is absent — matches D-20's DOM-absence contract over Phase 1's always-0%-bar habit
- [Phase ?]: [Phase 2 Plan 4]: e2e home scenario asserts non-probe Steps are unchanged via before/after delta, not literal zero — the shared Supabase table also backs production and will carry real progress after launch
- [Phase ?]: [Phase 3 Plan 1]: 홈을 '오늘의 학습'으로 재편, Step 대시보드는 /curriculum으로 분리 — 각 라우트가 hasUnlockCookie 게이트를 자체 복제(상속되지 않음, Pitfall 4)
- [Phase ?]: [Phase 3 Plan 1]: today.ts/schedule.ts는 progress-math.ts와 같은 이유로 import 0 유지 — 게이트 스크립트가 Node 22.6+ 타입 스트리핑으로 트랜스파일러 없이 직접 로드
- [Phase ?]: [Phase 3 Plan 1]: 일정 배정은 항상 getOrderedLessons() slug 순서에서 파생, 35개 날짜→레슨 하드코딩 상수를 쓰지 않음
- [Phase ?]: [Phase 3 Plan 2]: estimatedMinutes 목표값은 (depth, 소속 모듈 isProject) 파생 계산으로 산출 — 원본 수치 기반 순차 치환은 값 공간이 겹쳐 이중 적용 위험이 있어 구조적으로 배제
- [Phase ?]: [Phase 3 Plan 2]: check-manifest.mjs Invariant 6을 7200~10800 밴드 검사에서 총합 4200 등식 검사로 교체, 분포(Invariant 12)·파생 규칙(Invariant 13) 신설 — 13개 불변식으로 확장
- [Phase ?]: [Phase 3 Plan 2]: ROADMAP/PROJECT/REQUIREMENTS의 페이스 기준을 '하루 4~6시간'에서 D-35 '하루 3시간 이내(하루 1레슨, 평균 약 2시간)'로 통일
- [Phase ?]: [Phase 3 Plan 3]: computePace의 완료 분 합계 두 스코프(어제까지 vs 전체 배정)를 이름이 다른 변수로 강제 분리 -- Pitfall 3 오판 경로를 구조적으로 차단
- [Phase ?]: [Phase 3 Plan 3]: today-lesson-card.tsx는 pace를 직접 받지 않고 celebration 전환 판단은 page.tsx가 미리 계산해 전달 -- 컴포넌트는 이미 결정된 값만 렌더
- [Phase ?]: [Phase 3 Plan 3]: check-progress-gates.mjs에 G19 신설 -- pace.ts/schedule.ts가 Supabase.progress-store.Velite 매니페스트를 참조하지 않음을 상시 검사
- [Phase ?]: [Phase 3 Plan 4]: 일정표 행의 배지/소요시간 그룹을 고정 폭 grid(64px+88px)로 묶어 레슨 제목 줄바꿈에도 열 정렬이 흔들리지 않게 함 -- 아이패드 UAT 1라운드 실측 결함(3~5주차 정렬 흔들림)을 구조적으로 재발 방지
- [Phase ?]: [Phase 3 Plan 4]: Step 카드 3열 그리드 전환 브레이크포인트를 sm(640px)에서 lg(1024px)로 올림 -- 아이패드 세로 폭(744px)에서 3열로 눌려 헤더가 넘치던 UAT 2라운드 실측 결함을 2열 유지로 해결
- [Phase ?]: [Phase 5 Plan 1]: 세 형식(심화 승계·개요 신규·프로젝트 가이드 신규) 사용자 승인 — 22편 집필 표준으로 확정
- [Phase ?]: [Phase 5 Plan 1]: Step 3 개요 깊이 판정 = (c) 너무 깊다, 더 줄여도 된다 — D-62 기준 하향, 3-1 파일럿 트림은 Wave 4 착수 직전, 나머지 Step 3 12편은 낮아진 기준(개념+비유1개, 실무 판단 레이어 제외)으로 저작
- [Phase ?]: [Phase 5 Plan 1]: npm 패키지 3종(prisma, @prisma/client, @anthropic-ai/sdk) 정당성 사용자 확인 완료 — Plan 04·06 착수 조건 충족
- [Phase ?]: [Phase 5 Plan 1]: EXPECTED_HAS_CONTENT_COUNT 실측 13 확정 — CONTEXT.md D-78 원문(14)과 불일치, 실측이 우선
- [Phase ?]: [Phase 5 Plan 1]: L7 단락 길이(200자) 게이트 신설 + .prose line-height 1.6→1.8·문단 margin 2.4em 신설 — 가독성 사용자 피드백 대응, UI-SPEC UX-03 갱신은 Plan 05-13이 담당
- [Phase ?]: 05-07: EXPECTED_HAS_CONTENT_COUNT/SLUGS를 빌드 실측(23)으로 확정 — CONTEXT.md D-78 원문(24)과 재차 불일치, 실측 우선
- [Phase ?]: 05-07: Step 2 12편 프로덕션 배포 완료, 12/12 200 확인, e2e-today·e2e-progress 통과
- [Phase ?]: Step 3 depth bar re-approved post-trim (이제 맞다, 2026-08-26) — trimmed 3-1-vector-search-basics.mdx is now the reference standard for the remaining 12 Step 3 lessons
- [Phase ?]: 05-08: 3-1-hybrid-search-reranking + 3-2-project-rag-agent written at the re-approved depth bar (CONT-05)
- [Phase ?]: 매니페스트 최종 상수(35) 실측 확정 — CONTEXT.md D-78 원문 최종값과 정확히 일치, Wave 1·2의 불일치 이력과 대비
- [Phase ?]: UI-SPEC UX-03 line-height 근거 정정(1.8/2.4em, 비율 1.33) — 기존 '기본값 1.5' 주장이 오류였음을 확인하고 실측치로 갱신
- [Phase ?]: D-81 진행률 100% 검증을 실제 progress-math.ts aggregate() 함수로 직접 실행 — 전체·Step·19개 모듈 전부 100%, 반올림 결함 0건
- [Phase ?]: 08-08: Task 3 체크포인트 대기 중 발견된 폰 헤더 내비 결함은 quick task 260827-g6u가 플랜 범위 밖에서 이미 수정 완료 — 08-MEASUREMENTS.md 375px 표를 수정 전/후 이력으로 갱신
- [Phase ?]: 08-08: 아이패드·폰 실기기 UAT 사용자 승인 완료 — Phase 6 메모장 하단 틈 결함 재발 없음 확인

### Pending Todos

None yet.

### Blockers/Concerns

- 리서치 Gap: 레슨 소요시간 추정치의 정확도는 Phase 3~4 실사용으로만 검증 가능 — 편차가 크면 v2의 CONV-03(자동 리밸런싱)이 필요해질 수 있음
- 리서치 Gap: Step 3 "개요 훑기" 깊이 기준(rubric)을 Phase 5 착수 전에 구체화해야 범위가 팽창하지 않음
- 사전학습 시작일(2026-08-25)이 임박 — Phase 1~3이 지연되면 학습 시간이 직접 잠식됨
- Plan 05-08~05-12 착수 전 필독: Phase 5 Plan 1 SUMMARY의 Deviation 4(Step 3 깊이 하향, D-62 재조정) 반영 필요 — 개념+비유1개만, 실무 판단 레이어 제외
- 3-1-vector-search-basics.mdx를 낮아진 깊이 기준으로 트림 필요 — Wave 4 착수 직전, 아직 Plan/Task 미배정
- Plan 05-13 착수 시 UI-SPEC UX-03 항목의 line-height 근거 수치 정정 필요(1.5 오기 → 1.75 실제 기본값, 최종값 1.8 반영)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260825-2xv | 소개 페이지 eli5 재작성 — docs/making-of.md를 아무것도 모르는 사람 눈높이로 | 2026-08-25 | bc0e28c | [260825-2xv-eli5-docs-making-of-md](./quick/260825-2xv-eli5-docs-making-of-md/) |
| 260825-n7v | Phase 04 UAT 결함 2건 수정 — SQL 2편 준비 블록 스키마 충돌(G-04-1), 복사 버튼이 코드 첫 줄 가림(G-04-2) | 2026-08-25 | f750017 | [260825-n7v-phase-04-uat-gap-fixes-g-04-1-sql-lesson](./quick/260825-n7v-phase-04-uat-gap-fixes-g-04-1-sql-lesson/) |
| 260825-r4k | 코드블록 복사 버튼이 모든 레슨에서 동작하지 않던 [Critical] 결함 수정 (04-UI-REVIEW Priority Fix 1) — 문자열 onclick을 실제 React 핸들러로 교체 | 2026-08-25 | 920741e | [260825-r4k-lesson-reading-screen-design-pass](./quick/260825-r4k-lesson-reading-screen-design-pass/) |
| 260826-tbx | 학습 시작일 8/25→8/28 이동 + 35개 레슨을 8/28~9/28에 재배정(토요일 8/29·9/5·9/12만 2개), 9/29 복습일 유지 — 개강 전 완주 보존 | 2026-08-26 | 22d86ee | [260826-tbx-shift-study-start-date-from-2026-08-25-t](./quick/260826-tbx-shift-study-start-date-from-2026-08-25-t/) |
| 260827-0y8 | 레슨 하단 메모장(옥스포드 노트 스타일) — 접었다 펼치기, 스크롤 고정, 타이핑 멈추면 자동 저장, 레슨당 메모 1개 Supabase 기기 간 공유 | 2026-08-27 | 5947684 | [260827-0y8-bottom-sheet-lesson-notepad-collapsible-](./quick/260827-0y8-bottom-sheet-lesson-notepad-collapsible-/) |
| 260827-g6u | 폰(640px 미만) 헤더 내비 4항목을 햄버거+접이식 패널로 전환, 640px 이상은 게이트 실측으로 픽셀 동일성 증명(375px M3 126→120, 768/1024 완전 동일) | 2026-08-27 | eb1357b | [260827-g6u-phone-hamburger-nav-640px](./quick/260827-g6u-phone-hamburger-nav-640px/) |
| 260827-mdz | v1.0 마감 전 lint 정합성 정리 — 에러 6·경고 3 → 0·0. Phase 1 이월 3건 + Phase 8 신규 3건(effect 내 동기 setState, module 변수명, 렌더 중 재할당) + eslint 스캔에서 고아 워크트리 제외 | 2026-08-27 | 3e9bdfd | [260827-mdz-v1-0-lint-6-3-eslint-claude](./quick/260827-mdz-v1-0-lint-6-3-eslint-claude/) |
| 260828-k4t | 레슨 PDF 내보내기 — 인쇄 전용 스타일시트 + 레슨별 "PDF로 저장" 버튼 + /print 허브와 범위별 묶음 라우트 23개(전체·Step·모듈). 아이패드 인쇄 미리보기 → 공유 → Notability 경로 | 2026-08-28 | 4da9ac2 | [260828-k4t-lesson-pdf-export](./quick/260828-k4t-lesson-pdf-export/) |
| 260828-w2r | 아이패드 완료 버튼이 "완료했어요 ✓ → 회색 → 레슨 완료하기"로 되돌아가 보이던 증상 — 재조회가 화면을 비워 버튼을 언마운트하던 구조와 낙관적 값 되돌림 시점을 함께 수정, 게이트 G12 개정·G23 신설 | 2026-08-28 | e61cbaf | [260828-w2r-complete-button-revert](./quick/260828-w2r-complete-button-revert/) |
| 260828-d3n | 자매 사이트(marketing.dailyaithread.com) 디자인을 전체 이식 — 크림 종이·각진 패널·하드 오프셋 그림자·굵은 제목 팔레트로 교체, 컴포넌트 클래스 9종 신설, 타이포 게이트 허용 집합 갱신 | 2026-08-28 | 78e25e2 | [260828-d3n-design-system-port](./quick/260828-d3n-design-system-port/) |
| 260829-hof | 헤더 내비 호버 효과 — 비활성 항목 잉크 밑줄(좌→우), 활성 항목 accent 하드 그림자로 떠오르기, 로고 표식 뜨기. 기존 규칙이 @layer components에 있어 utilities 레이어에 지고 있던(= 호버가 전혀 없던) 원인까지 수정 | 2026-08-29 | f02867e | [260829-hof-nav-hover](./quick/260829-hof-nav-hover/) |

## Deferred Items

### 빈칸(클로즈) 필사 — 2026-08-27 롤백

2026-08-26에 개념 설명 구간 클로즈 필사를 구현해 배포했다가(quick 260826-uig, 35개 레슨 빈칸
111개, 게이트 2종 신설, Supabase `cloze_answer` 테이블), 사용자 판단으로 **전량 롤백했다** —
"없는 게 낫겠다". 코드·게이트·마이그레이션·테이블 모두 제거했고 되돌린 커밋은 히스토리에 남아 있다
(f7c3ccd..e2d505f).

남길 만한 조사 결과(`.planning/research/필사-transcription-ux.md`는 그대로 둔다):

- 문단을 통째로 베껴 쓰는 "완전 필사"는 아이패드에서 가장 불편하고 학습 근거도 가장 약하다 —
  보이는 글을 옮기는 것은 인출이 아니라 복사라 testing/generation effect 조건을 충족하지 않는다.

- 대안으로 만든 클로즈는 근거는 더 강했지만, 실제로 써보니 학습 흐름에 끼어드는 느낌이 컸다.
- 다음 시도는 **판정하지 않는 방향**(예: 접었다 펼치는 고정 메모장)으로 간다.

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-08-27T03:18:58.278Z
Stopped at: Completed 08-08-PLAN.md
Resume file: None

## Operator Next Steps

- Start the next milestone with /gsd-new-milestone
