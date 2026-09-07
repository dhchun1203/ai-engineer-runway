---
phase: 01-deployed-curriculum-skeleton
plan: 02
subsystem: infra
tags: [vercel, deployment, github-integration, ci-cd, making-of]

# Dependency graph
requires:
  - phase: 01-deployed-curriculum-skeleton (Plan 01)
    provides: "Next.js 16 + Velite + rehype-pretty-code 파이프라인, 파일럿 레슨 1편, 공개 GitHub 저장소 ai-engineer-runway"
provides:
  - "공개 프로덕션 URL(https://ai-engineer-runway.vercel.app)에서 사이트 접속 가능 (PLAT-01)"
  - "main(=master) push → 프로덕션 자동 배포, PR → 프리뷰 자동 배포 (D-16, 실증 완료)"
  - "Making-of 5단계(구현 기록)가 실제 내용으로 채워짐 (PLAT-03 살아있는 문서 갱신 흐름 개시)"
affects: [01-03, 01-04, 01-05, 01-06]

actuals:
  tokens: 1052
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Vercel 대시보드 GitHub Import(zero-config)로 배포 파이프라인 연결 — CLI 미설치 환경의 표준 경로"
    - "프로덕션 URL을 README.md 상단에 고정해 이후 모든 Plan의 검증 앵커로 사용"

key-files:
  created: []
  modified:
    - README.md
    - docs/making-of.md

key-decisions:
  - "프로덕션 브랜치가 main이 아닌 master 그대로 유지됨 — Plan 01에서 이미 결정된 편차를 이어받음, Vercel Import는 기본 브랜치 자동 감지라 기능적 영향 없음"
  - "Task 1(Vercel Import)은 사람이 대시보드에서 직접 수행 — CLI 미설치 + Git 브라우저 인증 플로우이므로 자동화 불가 (계획대로)"
  - "Task 3의 PR 머지를 실행자가 아닌 사용자가 직접 수행 — 하네스 권한 게이트로 gh pr merge가 실행자에게 막혀 있었음(편차, 아래 기재)"

requirements-completed: [PLAT-01]

coverage:
  - id: D1
    description: "프로덕션 URL이 200으로 응답하고 파일럿 레슨이 코드 하이라이팅·복사 버튼과 함께 렌더된다"
    requirement: "PLAT-01"
    verification:
      - kind: automated_ui
        ref: "curl https://ai-engineer-runway.vercel.app (200), curl .../lesson/1-3-python-variables-and-types (200, rehype-pretty-copy + data-theme 포함)"
        status: pass
    human_judgment: false
  - id: D2
    description: "프로덕션 호스트명에 ai-engineer-runway가 포함된다 (D-15 — 슬러그 변경 비용 회피)"
    verification:
      - kind: other
        ref: "README.md / docs/making-of.md grep -E 'https://[A-Za-z0-9.-]*ai-engineer-runway'"
        status: pass
    human_judgment: false
  - id: D3
    description: "main(master) 푸시와 PR 두 경로 모두에서 Vercel 배포가 생성된다 (D-16)"
    requirement: "PLAT-01"
    verification:
      - kind: integration
        ref: "gh api repos/dhchun1203/ai-engineer-runway/deployments — Production(ref 91273af, 8707dfb) 2건 + Preview(ref 497e42e) 1건 확인"
        status: pass
    human_judgment: false
  - id: D4
    description: "Making-of 5단계가 실제 구현·배포 기록으로 채워지고 금지 브랜드 문자열이 0건이다"
    requirement: "PLAT-03"
    verification:
      - kind: other
        ref: "docs/making-of.md 5단계 본문 + grep -rIil kant docs (0건) + grep 'AI Engineer 교육과정' (존재)"
        status: pass
    human_judgment: false

duration: 확인 불가(체크포인트 대기 포함 — 순수 작업 시간 아님)
completed: 2026-08-24
status: complete
---

# Phase 1 Plan 2: 프로덕션 배포 파이프라인 연결 Summary

**Vercel 대시보드 GitHub Import로 `ai-engineer-runway` 프로덕션 배포를 생성하고, master push→프로덕션 / PR→프리뷰 두 자동 배포 경로를 실제 커밋으로 검증한 뒤 Making-of 5단계에 기록했다.**

## Performance

- **Tasks:** 3/3 완료
- **Files modified:** 2 (README.md, docs/making-of.md)

## Accomplishments

- Vercel 프로젝트 `ai-engineer-runway`를 GitHub 저장소 Import로 생성, 프로덕션 URL `https://ai-engineer-runway.vercel.app`이 루트·파일럿 레슨 경로 모두 HTTP 200으로 응답하고 배포 환경에서도 Shiki 하이라이팅(`data-theme`)과 복사 버튼(`rehype-pretty-copy`)이 살아있음을 확인
- 프로덕션 URL을 README.md "배포 주소" 섹션에 고정 — 이후 모든 Plan/검증의 앵커
- PR #1(`docs/making-of-phase1` → master)을 통해 프리뷰 배포 경로를 실증: `gh api .../deployments`로 Preview 환경 배포 레코드(ref `497e42e`) 확인, 머지 후 새 Production 배포(ref `91273af`)가 사람 개입 없이 자동 생성됨을 확인 — D-16의 두 경로가 모두 실제로 동작한다는 증거 확보
- `docs/making-of.md`의 "5단계 — 구현"을 Walking Skeleton(Plan 01)과 배포 파이프라인(Plan 02) 실제 기록으로 채움. 금지 브랜드 문자열 0건, "AI Engineer 교육과정" 표기 확인, 남은 `🔜`는 6·7단계뿐

## Task Commits

Each task was committed atomically:

1. **Task 1: Vercel 대시보드에서 GitHub 저장소 Import** - 커밋 없음 (사람이 Vercel 대시보드에서 직접 수행한 인프라 작업; 코드 변경 없음)
2. **Task 2: 프로덕션 URL 검증 및 README에 배포 주소 기록** - `8707dfb` (docs)
3. **Task 3: PR 프리뷰 배포 확인 및 Making-of 5단계 기록** - `497e42e` (docs), 머지 커밋 `91273af`

_Note: Task 1은 인프라 설정 단계로 git 커밋 대상이 아님 — Vercel 프로젝트 생성 자체가 산출물._

## Files Created/Modified
- `README.md` - "배포 주소" 섹션 추가, 프로덕션 URL(`https://ai-engineer-runway.vercel.app`) 기록
- `docs/making-of.md` - "5단계 — 구현" 본문을 Plan 01·02 실제 기록으로 채움, `Last updated` 갱신

## Decisions Made

- Vercel 프로젝트 이름을 `ai-engineer-runway`로 명시 지정(D-15) — 자동 제안값 사용 시 슬러그 변경 비용이 크므로 Import 화면에서 직접 입력
- 환경변수를 비워둔 채 배포 성공을 확인 — 이 Phase에 비밀값이 전혀 없다는 사실 자체가 통제(T-01-05 mitigate)이며, Phase 2의 Supabase 키 도입 이전 "무비밀 배포" 기준선을 세움
- PR 프리뷰 확인 후 브랜치 유지가 아니라 즉시 머지 — 목적은 프리뷰 검증이지 별도 브랜치 보존이 아님(플랜 명시)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] PR 머지를 실행자가 아닌 사용자가 직접 수행**
- **Found during:** Task 3 (PR 프리뷰 배포 확인 및 Making-of 5단계 기록)
- **Issue:** 플랜은 실행자가 `gh pr create` 후 프리뷰 검증까지 마치고 PR을 머지하도록 지시했으나, 하네스 권한 게이트가 `gh pr merge` 실행을 차단함
- **Fix:** 프리뷰 URL/배포 레코드 확인까지는 실행자가 완료했고, 최종 머지는 사용자가 GitHub에서 직접 수행. 머지 커밋 `91273af`가 origin/master에 반영된 것을 이번 세션에서 `git pull`로 확인
- **Files modified:** 없음 (권한 우회가 아니라 사람이 대신 수행한 단계)
- **Commit:** `91273af` (사용자가 GitHub UI에서 생성한 머지 커밋)

---

**Total deviations:** 1 auto-fixed (Rule 3 — 권한 게이트로 인한 수행 주체 전환)
**Impact on plan:** 계획된 검증 내용(프리뷰 200 확인, Production/Preview 배포 레코드 확인)은 모두 실행자가 완료했다. 머지 액션 자체만 사람이 대신했으며 산출물·검증 결과에는 차이가 없다.

## Issues Encountered

None — 계획대로 진행되었고, 이전 세션의 체크포인트(사람 대기: Vercel Import → PR 머지)는 모두 정상 재개되었다.

## User Setup Required

None - 이 Plan에서 추가로 필요한 외부 서비스 설정 없음 (Vercel Import는 Task 1에서 이미 완료됨, `user_setup`으로 계획된 유일한 항목).

## Next Phase Readiness

- 프로덕션 URL과 자동 배포 파이프라인이 확정되어, 이후 모든 Plan(01-03 ~ 01-06)의 커밋은 사람 개입 없이 프로덕션에 반영된다
- README.md의 프로덕션 URL이 이후 Plan들의 검증 앵커로 사용 가능
- Making-of 문서의 "살아있는 기록" 패턴(단계별 `### N단계` 갱신)이 확립되어 이후 Phase에서 동일하게 이어갈 수 있다
