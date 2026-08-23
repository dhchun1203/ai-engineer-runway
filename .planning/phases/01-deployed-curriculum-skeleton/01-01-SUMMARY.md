---
phase: 01-deployed-curriculum-skeleton
plan: 01
subsystem: infra
tags: [nextjs, react, tailwindcss, velite, mdx, rehype-pretty-code, shiki, pretendard, github]

# Dependency graph
requires: []
provides:
  - "Next.js 16 App Router 스캐폴드 (React 19, TypeScript, Tailwind v4)"
  - "Velite -> rehype-pretty-code -> MDXContent -> /lesson/[lessonId] SSG 파이프라인"
  - "lessons 컬렉션 Zod 스키마 (title/stepId/moduleId/order/depth/estimatedMinutes/slug/hasContent/code)"
  - "Pretendard 자체 호스팅 가변 폰트 + 딥블루/청록 테마 토큰"
  - "파일럿 레슨 1 (Python 변수·자료형) 실콘텐츠"
  - "공개 GitHub 저장소 ai-engineer-runway (main 브랜치 대신 master, main에 push 완료)"
affects: ["01-02", "01-03", "01-04", "01-05", "01-06"]

# Actuals (#2632)
actuals:
  tokens: 7450
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: [next@16.3.2, react@19.2.8, tailwindcss@4, velite@0.4.0, rehype-pretty-code@0.14.5, shiki@4.4.3, "@rehype-pretty/transformers@0.13.2", lucide-react, "@tailwindcss/typography@0.5.20"]
  patterns:
    - "top-level await velite build gate via VELITE_STARTED env guard in next.config.ts (Turbopack-safe, no VeliteWebpackPlugin)"
    - "#site/content tsconfig path alias resolving to .velite output"
    - "new Function(code) MDX runtime renderer (mdx-content.tsx) instead of next-mdx-remote"
    - "class-based dark mode via @custom-variant + inline pre-hydration theme script (no React context)"

key-files:
  created:
    - package.json
    - next.config.ts
    - velite.config.ts
    - tsconfig.json
    - postcss.config.mjs
    - src/app/layout.tsx
    - src/app/globals.css
    - src/app/lesson/[lessonId]/page.tsx
    - src/components/mdx-content.tsx
    - src/lib/fonts.ts
    - public/fonts/PretendardVariable.woff2
    - src/content/lessons/step-1/1-3-python-variables-and-types.mdx
    - README.md
    - .gitignore
  modified: []

key-decisions:
  - "npm 패키지 5종(next, rehype-pretty-code, shiki, @rehype-pretty/transformers, lucide-react)을 설치 전 사람이 npmjs.com에서 직접 확인 — 전부 승인"
  - "GitHub 저장소 생성/푸시(Task 3)는 하네스 권한 게이트로 인해 실행자가 자동화하지 못하고 사용자가 gh repo create 명령을 직접 실행 — 결과 저장소는 계획과 동일하게 공개(public)이며 이름도 ai-engineer-runway로 일치"
  - "기본 브랜치명이 계획서에 명시된 main이 아니라 master로 생성됨 (로컬 git init.defaultBranch=master 설정을 gh repo create --source=. --push가 그대로 사용) — 기능적으로 동등하고 Vercel import(Plan 02)는 기본 브랜치를 자동 감지하므로 영향 없음. 계획의 '추가 push 금지' 지시에 따라 브랜치명을 main으로 되돌리는 재푸시는 수행하지 않고 편차로만 기록"

requirements-completed: [CONT-06, UX-03]

coverage:
  - id: D1
    description: "MDX 파일 한 개가 Velite 스키마 검증 -> MDX 컴파일 -> Shiki 하이라이팅 -> 복사 버튼 주입 -> 정적 라우트 렌더까지 통과"
    requirement: CONT-06
    verification:
      - kind: automated_ui
        ref: "npm run build && grep -rq 'rehype-pretty-copy' .next/server/app && grep -rq 'data-theme' .next/server/app (Task 2 <verify>, 실행 완료)"
        status: pass
    human_judgment: false
  - id: D2
    description: "코드 복사 버튼이 hover 없이 항상 보임 (iPad Safari 대응), 코드 블록 가로 스크롤"
    requirement: UX-03
    verification:
      - kind: unit
        ref: "velite.config.ts transformerCopyButton({ visibility: 'always' }) 정적 확인 + globals.css overflow-x: auto 정적 확인"
        status: pass
    human_judgment: true
    rationale: "실제 iPad Safari에서의 시각적 hover-free 동작은 배포 후 기기 확인이 필요 — 이 Plan에서는 코드 설정만 검증됨"
  - id: D3
    description: "공개 GitHub 저장소 ai-engineer-runway 생성 및 초기 커밋 push, 비밀값/빌드 산출물/금지 브랜드 문자열 미노출"
    verification:
      - kind: other
        ref: "gh repo view --json visibility --jq '.visibility' == PUBLIC; git ls-remote --heads origin; git ls-files 브랜드 문자열 스캔"
        status: pass
    human_judgment: false

# Metrics
duration: 20min
completed: 2026-08-23
status: complete
---

# Phase 1 Plan 1: 배포 커리큘럼 스켈레톤 — Walking Skeleton Summary

**Next.js 16 + Velite + rehype-pretty-code 파이프라인으로 Python 변수·자료형 파일럿 레슨을 하이라이팅된 정적 페이지로 렌더하고, 공개 GitHub 저장소 ai-engineer-runway에 첫 커밋을 푸시했다.**

## Performance

- **Duration:** 약 20분 (Task 2 첫 커밋~완료 기준)
- **Started:** 2026-08-23T22:51:41Z (Task 2 커밋 f000d37 기준)
- **Completed:** 2026-08-23T23:09:33Z
- **Tasks:** 3/3
- **Files modified:** 25 (Task 2 스캐폴드 기준, package-lock.json 포함)

## Accomplishments

- Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 스캐폴드를 저장소 루트에 생성
- Velite -> rehype-pretty-code(항상 보이는 복사 버튼, 라이트/다크 이중 Shiki 테마) -> MDXContent 런타임 렌더러 -> `/lesson/[lessonId]` SSG 라우트까지 한 줄기를 끝까지 연결하고 `npm run build` 통과 확인
- `lessons` Velite 컬렉션 스키마(title/stepId/moduleId/order/depth/estimatedMinutes/slug/hasContent/code)를 PLAN `<interfaces>`와 정확히 일치시킴
- Pretendard 가변 폰트 자체 호스팅 + 딥블루/청록 UI-SPEC 테마 토큰 + Step 1/2/3 accent 색상 + 개요 배지 중성색 적용, class 기반 다크모드(React context 없이 FOUC 방지)
- 파일럿 레슨 1(Python 변수·자료형)을 D-10 6단 구성 실콘텐츠로 작성 — 복사해서 바로 실행 가능한 Python 예제와 실행 명령(`python variables.py`) 포함
- 공개 GitHub 저장소 `ai-engineer-runway` 생성 및 초기 커밋 push 완료(사용자 직접 실행), `gh repo view` 기준 PUBLIC 확인

## Task Commits

Each task was committed atomically:

1. **Task 1: npm 패키지 정당성 확인 (설치 전 차단 게이트)** - 커밋 없음 (사람 승인만, `checkpoint:human-verify`)
2. **Task 2: TRACER — MDX 파일 한 개가 빌드를 통과해 하이라이팅된 레슨 페이지로 뜬다** - `f000d37` (feat)
3. **Task 3: 공개 GitHub 저장소 ai-engineer-runway 생성 및 초기 푸시** - 커밋 없음 (기존 커밋 f000d37/04f866f를 `gh repo create ai-engineer-runway --public --source=. --remote=origin --push`로 사용자가 직접 push, 새 커밋 생성 안 함)

**중간 동기화 커밋:** `04f866f` (chore: GSD 계획 아티팩트를 공개 저장소 push 전 동기화 — Task 3 실행 준비 과정에서 생성)

**Plan metadata:** (이 커밋 직후 생성 예정)

_Note: Task 1/3은 커밋을 만들지 않는 게이트/인프라 태스크다._

## Files Created/Modified

- `package.json`, `package-lock.json` - Next.js 16 / React 19 / Tailwind v4 / Velite / rehype-pretty-code 의존성
- `next.config.ts` - `VELITE_STARTED` 가드 뒤 top-level await로 Velite 빌드 트리거 (Turbopack 안전)
- `velite.config.ts` - `lessons` 컬렉션 Zod 스키마 + rehype-pretty-code(이중 테마) + `transformerCopyButton({ visibility: 'always' })`
- `tsconfig.json` - `#site/content` -> `./.velite` path alias
- `src/app/globals.css` - Tailwind v4 진입점, 딥블루/청록 테마 토큰, `keep-all`, 코드 블록 monospace/가로스크롤 CSS
- `src/app/layout.tsx` - 루트 레이아웃, Pretendard 폰트 클래스, 하이드레이션 이전 테마 토글 인라인 스크립트
- `src/app/lesson/[lessonId]/page.tsx` - `#site/content`에서 `lessons` import, `generateStaticParams` 기반 SSG 레슨 라우트
- `src/components/mdx-content.tsx` - `new Function(code)` 기반 MDX 런타임 렌더러, `MDXContent` export
- `src/lib/fonts.ts` - `next/font/local` Pretendard 가변 폰트 로딩
- `public/fonts/PretendardVariable.woff2` - 자체 호스팅 한국어 가변 폰트 자산
- `src/content/lessons/step-1/1-3-python-variables-and-types.mdx` - 파일럿 레슨 1, D-10 6단 구성 실콘텐츠
- `README.md`, `.gitignore` - 프로젝트 개요(한국어) + `.env*`/`.velite`/`node_modules` 제외 규칙

## Decisions Made

- npm 패키지 5종을 설치 전 사람이 npmjs.com에서 직접 확인 — SUS 오탐 3건 포함 전부 승인 후 `npm install` 진행
- Task 3의 `gh repo create` 실행이 하네스 권한 분류기에 의해 실행자 자동화 범위 밖으로 판단되어, `checkpoint:human-action`으로 전환하고 사용자가 직접 명령을 실행 — 결과는 계획과 동일(공개, 저장소명 `ai-engineer-runway` 일치)
- 저장소 기본 브랜치가 `main`이 아닌 `master`로 생성됨을 확인했으나, 계획의 "추가 push 금지" 지시에 따라 브랜치 리네임/재푸시를 하지 않고 편차로만 문서화 — Vercel import(Plan 02)는 기본 브랜치 자동 감지라 영향 없음

## Deviations from Plan

### Auto-fixed Issues

None - 코드 결함으로 인한 Rule 1~3 자동 수정은 없었음.

### Process Deviations (문서화만, 코드 수정 아님)

**1. Task 3 저장소 생성/push를 사용자가 직접 실행**
- **Found during:** Task 3 (공개 GitHub 저장소 생성 및 초기 푸시)
- **Issue:** `gh repo create ai-engineer-runway --public --source=. --remote=origin --push` 실행이 하네스 권한 게이트에 걸려 실행자가 직접 수행할 수 없었음
- **Fix:** `checkpoint:human-action`으로 전환해 사용자에게 정확한 명령을 안내, 사용자가 직접 실행
- **검증:** `git remote get-url origin` == `https://github.com/dhchun1203/ai-engineer-runway.git`, `gh repo view --json visibility` == `PUBLIC`, `git ls-remote --heads origin` 확인
- **Files modified:** 없음 (인프라 작업)
- **Commit:** 해당 없음 (기존 커밋을 push)

**2. 기본 브랜치명 `master` (계획 명시값 `main`과 불일치)**
- **Found during:** Task 3 사후 검증
- **Issue:** 계획 acceptance criteria와 verify 스크립트는 `main` 브랜치 존재를 확인하지만, 실제 저장소는 로컬 `git config init.defaultBranch=master` 설정을 그대로 이어받아 `master`로 생성됨
- **Fix:** 수정하지 않음 — 브랜치 리네임에는 재푸시가 필요한데, 이 continuation 태스크의 명시적 지시("Do NOT push")를 준수해 편차로만 기록
- **영향:** 기능적으로 동등. Vercel import(Plan 02)는 저장소의 기본 브랜치를 자동 감지하므로 배포 파이프라인에 영향 없음
- **Files modified:** 없음
- **Commit:** 해당 없음

---

**Total deviations:** 2 process deviations (0 code auto-fixes)
**Impact on plan:** 코드/콘텐츠 산출물은 계획과 완전히 일치. 인프라 실행 방식(수동 push, 브랜치명)만 계획과 다르며 둘 다 최종 상태의 정확성에는 영향 없음.

## Issues Encountered

없음 — Task 2의 자동 검증(`npm run build`, `.velite/lessons.json` 스키마 확인, `rehype-pretty-copy`/`data-theme` 산출물 확인, `.gitignore` 확인)이 모두 통과했고, Task 3의 사후 검증(공개 여부, 브랜드 문자열 0건, 추적 파일에 비밀값/빌드 산출물 없음)도 모두 통과함.

## Known Stubs

없음 — 이 Plan은 파일럿 레슨 1개만 다루며 스텁/더미 데이터를 렌더하는 UI 요소가 없다. 나머지 34개 레슨과 커리큘럼 매니페스트는 Plan 03~04의 명시적 범위다.

## User Setup Required

없음 - 외부 서비스 설정 불필요 (Supabase는 Phase 2 범위).

## Next Phase Readiness

- Velite -> rehype-pretty-code -> MDXContent -> `/lesson/[lessonId]` 파이프라인이 검증되어 Plan 03(35행 커리큘럼 매니페스트)이 이 스키마 위에 안전하게 얹을 수 있음
- 공개 저장소가 존재하므로 Plan 02(Vercel import)가 바로 이어서 진행 가능 — 단, Vercel 프로젝트 생성 시 기본 브랜치가 `master`임을 인지할 것
- `.env*`/`.velite`/`node_modules`가 첫 커밋부터 `.gitignore`에 포함되어 있어 Phase 2의 Supabase 키 도입 시 추가 조치 불필요
- 블로킹 항목 없음

---
*Phase: 01-deployed-curriculum-skeleton*
*Completed: 2026-08-23*
