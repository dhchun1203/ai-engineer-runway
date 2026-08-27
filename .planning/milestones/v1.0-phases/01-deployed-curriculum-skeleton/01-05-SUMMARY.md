---
phase: 01-deployed-curriculum-skeleton
plan: 05
subsystem: ui
tags: [global-nav, dark-mode, metadata-og, mdx-timeline, brand-gate]

# Dependency graph
requires:
  - phase: 01-deployed-curriculum-skeleton (Plan 01)
    provides: "src/app/layout.tsx(하이드레이션 이전 인라인 테마 스크립트), src/components/mdx-content.tsx(MDXContent 런타임 렌더러), velite.config.ts(lessons 컬렉션)"
  - phase: 01-deployed-curriculum-skeleton (Plan 04)
    provides: "src/app/layout.tsx 미변경 상태(헤더 슬롯을 얹을 여지), 홈/Step/레슨 라우트 전체"
provides:
  - "글로벌 내비 4항목(2 활성/2 준비 중) + 다크모드 토글이 모든 라우트에 공통 렌더 — src/components/site-nav.tsx, src/components/theme-toggle.tsx"
  - "사이트 메타데이터(title 템플릿, OG 태그, metadataBase) — src/app/layout.tsx"
  - "Making-of 소개 페이지(/about) — docs/making-of.md를 velite pages 컬렉션으로 렌더 — src/app/about/page.tsx"
  - "공개 표면 브랜드·개인정보 상시 게이트 — scripts/check-brand.mjs"
affects: ["01-06"]

actuals:
  tokens: 3792
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "SiteNav는 클라이언트 컴포넌트로 usePathname을 읽어 활성 내비 항목에 accent 밑줄을 준다 — 서버 컴포넌트로는 현재 경로를 알 수 없어 불가피하게 클라이언트화, React 컨텍스트 프로바이더는 아님"
    - "ThemeToggle은 layout.tsx의 하이드레이션 이전 인라인 스크립트와 정확히 같은 localStorage.theme 키/documentElement.dark 클래스를 읽고 쓴다 — 별도 상태 저장소나 컨텍스트를 두지 않아 두 코드가 항상 같은 진실을 공유"
    - "velite pages 컬렉션의 pattern을 docs/making-of.md 단일 파일로 고정 — 글로브를 넓히지 않아 계획 산출물이 사이트에 렌더될 여지를 원천 차단(T-01-14)"
    - "check-brand.mjs는 ROOT를 process.cwd()로 잡아 저장소 루트 밖에서 실행하면 대상 부재로 즉시 실패 — 부재를 통과로 처리하지 않는 게이트 원칙을 셸 레벨에서 강제"

key-files:
  created:
    - src/components/site-nav.tsx
    - src/components/theme-toggle.tsx
    - src/app/about/page.tsx
    - scripts/check-brand.mjs
  modified:
    - src/app/layout.tsx
    - velite.config.ts
    - docs/making-of.md

key-decisions:
  - "docs/making-of.md에 title/slug frontmatter 2줄을 추가 — Velite pages 스키마가 두 필드를 요구하는데 원문 파일에는 frontmatter가 없었음. 본문 내용은 한 글자도 바꾸지 않고 메타데이터만 얹음(PLAT-03의 '원문 그대로 반영' 요구 유지)"
  - "SiteNav를 서버 컴포넌트가 아닌 클라이언트 컴포넌트로 구현 — 활성 내비 항목 밑줄(D-09/UI-SPEC accent 사용처)이 현재 경로를 알아야 하는데, App Router 서버 컴포넌트는 usePathname 없이 이를 얻기 어려움. React 컨텍스트 테마 프로바이더 금지 규칙과는 무관(내비게이션 활성 상태일 뿐 테마 상태가 아님)"
  - "Making-of 타임라인은 h3 헤딩마다 accent 색 원형 마커 + 좌측 세로선을 CSS로 얹는 방식으로 구현 — 애니메이션·스크롤 연동 없이 RESEARCH Pitfall 6(시각 다듬기 과투자 경고)을 지키면서 '단계별 타임라인' 요구를 충족"

requirements-completed: [PLAT-03, UX-01, UX-02]

coverage:
  - id: D1
    description: "모든 페이지 상단에 글로벌 내비 4항목이 고정 노출되고 2개만 활성, 2개는 준비 중 배지로 비활성"
    requirement: UX-01
    verification:
      - kind: unit
        ref: "index.html/about.html/step/1.html/lesson/*.html 전부에서 '준비 중' 2회, 'AI Engineer Runway' 노출 확인, npm run build exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "탭 제목과 OG 태그에 사이트명 AI Engineer Runway가 들어가고 환경변수 없이 빌드가 성공한다"
    requirement: PLAT-03
    verification:
      - kind: unit
        ref: "grep 'AI Engineer Runway'/'property=\"og:' .next/server/app/index.html, metadataBase 존재, 환경변수 미설정 상태로 npm run build exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "다크모드가 인라인 스크립트로 첫 페인트 이전에 결정되고, createContext 기반 프로바이더가 아니다"
    requirement: UX-02
    verification:
      - kind: unit
        ref: "theme-toggle.tsx/layout.tsx 합산 createContext 0건, localStorage 키 공유 확인"
        status: pass
    human_judgment: true
  - id: D4
    description: "/about이 docs/making-of.md를 단계별 타임라인으로 렌더하고 GitHub 저장소 링크를 포함한다"
    requirement: PLAT-03
    verification:
      - kind: unit
        ref: "about.html에 '단계'·'github.com' 존재, page.tsx에 noopener 포함, MDXContent 사용 확인"
        status: pass
    human_judgment: false
  - id: D5
    description: "velite.config.ts와 about 페이지에 GSD 계획 산출물 디렉터리 참조가 0건"
    requirement: "PLAT-03 threat T-01-14"
    verification:
      - kind: unit
        ref: "grep -c '\\.planning' velite.config.ts src/app/about/page.tsx 둘 다 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "node scripts/check-brand.mjs가 저장소 루트에서 0으로 종료하고, 대상이 없는 위치(임시 디렉터리)에서는 실패한다"
    requirement: "D-02"
    verification:
      - kind: unit
        ref: "node scripts/check-brand.mjs → 위반 없음/60개 파일, tmp 디렉터리에서 실행 시 exit != 0 확인, 스크립트 소스에 리터럴 이메일/외부 import/'.planning' 0건"
        status: pass
    human_judgment: false
  - id: D7
    description: "44px 이상 터치 타깃 — 내비 항목, 테마 토글, GitHub 링크 모두"
    requirement: UX-01
    verification:
      - kind: unit
        ref: "grep -qE 'min-h-11|min-w-11' site-nav.tsx / theme-toggle.tsx / about/page.tsx 전부 통과 (backstop 항목은 iPad 실기기 UAT로 Plan 06에서 재확인 예정)"
        status: pass
    human_judgment: true

duration: 약 15분
completed: 2026-08-24
status: complete
---

# Phase 1 Plan 5: 글로벌 내비·다크모드·Making-of·브랜드 게이트 Summary

**모든 라우트가 공유하는 사이트 껍데기(4항목 내비 + 다크모드 토글 + OG 메타데이터)를 완성하고, docs/making-of.md를 velite pages 컬렉션으로 렌더하는 /about 타임라인 페이지와 공개 표면 브랜드·개인정보 노출을 매번 검증하는 상시 게이트를 추가했다.**

## Performance

- **Tasks:** 3/3 완료
- **Files created:** 4 (SiteNav, ThemeToggle, about 페이지, check-brand.mjs)
- **Files modified:** 3 (layout.tsx, velite.config.ts, docs/making-of.md)
- **Duration:** 약 15분

## Accomplishments

- `src/components/site-nav.tsx` — 로고 + 4항목(오늘의 학습·일정표 비활성/준비 중 배지, 커리큘럼·소개 활성), `usePathname`으로 현재 경로와 일치하는 항목에 accent 밑줄, 모든 항목 44px+ 히트 영역
- `src/components/theme-toggle.tsx` — 클라이언트 컴포넌트, lucide 해/달 아이콘, `layout.tsx` 인라인 스크립트와 동일한 `localStorage.theme` 키·`documentElement.dark` 클래스 공유, `createContext` 미사용
- `src/app/layout.tsx` — `metadata` export(title 템플릿 "%s | AI Engineer Runway", OG siteName/locale/type, `metadataBase`는 `NEXT_PUBLIC_SITE_URL` 환경변수 또는 프로덕션 URL 기본값), `<body>` 상단에 `SiteNav` 헤더 슬롯 추가, 인라인 테마 스크립트는 그대로 유지
- `velite.config.ts` — `pages` 컬렉션 추가(pattern은 `docs/making-of.md` 단일 파일), lessons와 동일한 MDX 옵션(rehype-pretty-code) 적용
- `docs/making-of.md` — Velite 스키마가 요구하는 `title`/`slug` frontmatter 2줄만 추가, 본문은 그대로 유지
- `src/app/about/page.tsx` — `pages` 컬렉션에서 making-of 항목을 찾아 `MDXContent`로 렌더, `### N단계` 헤딩마다 accent 원형 마커 + 좌측 세로선으로 타임라인 표현, "GitHub에서 코드 보기" CTA(외부 링크 아이콘, `rel="noopener noreferrer"`, 44px+)
- `scripts/check-brand.mjs` — 외부 의존성 0, `src`/`docs`/`public`/`README.md` 4곳을 재귀 스캔해 금지 브랜드 문자열(대소문자 무관)과 이메일 형태 정규식을 검사, 위반 시 파일:줄번호 출력 + 비정상 종료, 검사 대상 경로 부재 시 통과 대신 즉시 오류 종료(`process.cwd()` 기준이라 저장소 루트 밖에서 실행하면 자동으로 이 경로를 탄다)
- `npm run build` + `node scripts/check-manifest.mjs` + `node scripts/check-brand.mjs` 모든 태스크에서 통과, 홈·Step 3개·레슨 35개·about 1개 산출물 전부 확인, 금지 브랜드 문자열 0건

## Task Commits

Each task was committed atomically:

1. **Task 1: 글로벌 내비 4항목, 다크모드 토글, 사이트 메타데이터** - `76d4824` (feat)
2. **Task 2: Making-of 소개 페이지 — 단계별 타임라인 렌더** - `c1601f7` (feat)
3. **Task 3: 공개 표면 브랜드·개인정보 노출 상시 게이트** - `3a474c4` (feat)

## Files Created/Modified

- `src/components/site-nav.tsx` - 글로벌 내비(로고 + 4항목, 2 활성/2 준비 중)
- `src/components/theme-toggle.tsx` - 다크모드 수동 토글(localStorage + .dark 클래스)
- `src/app/layout.tsx` - 헤더 슬롯(SiteNav) 추가, `metadata` export(title 템플릿, OG, metadataBase)
- `velite.config.ts` - `pages` 컬렉션 추가(docs/making-of.md 단일 패턴)
- `docs/making-of.md` - title/slug frontmatter 추가(본문 불변)
- `src/app/about/page.tsx` - Making-of 타임라인 페이지, GitHub 저장소 링크
- `scripts/check-brand.mjs` - 브랜드·개인정보 노출 상시 검증 게이트

## Decisions Made

- docs/making-of.md에 title/slug frontmatter만 추가하고 본문은 한 글자도 바꾸지 않음 — Velite 스키마 요구사항과 "원문이 갱신되면 그대로 반영된다"는 PLAT-03 요구를 동시에 충족
- SiteNav를 클라이언트 컴포넌트로 구현(usePathname으로 활성 항목 판별) — 테마 프로바이더 금지 규칙과는 별개 사안(내비게이션 활성 상태 표시일 뿐 테마 상태 저장이 아님)이므로 RESEARCH의 "React 컨텍스트 금지"에 저촉되지 않는다고 판단
- Making-of 타임라인은 h3 헤딩 단위로 CSS 마커·세로선만 추가하는 방식을 선택 — 애니메이션·스크롤 연동 등 시각 다듬기에 시간을 쓰지 않기로 한 RESEARCH Pitfall 6 경고를 그대로 따름

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - 블로킹 이슈] docs/making-of.md에 frontmatter 부재로 Velite 빌드 실패**
- **Found during:** Task 2
- **Issue:** `velite.config.ts`의 `pages` 스키마가 `title`/`slug` 필드를 요구하는데, 원문 `docs/making-of.md`에는 YAML frontmatter가 전혀 없어 `npm run build`가 "Required slug/title" 오류로 실패
- **Fix:** 파일 최상단에 `title`/`slug` frontmatter 2줄만 추가(본문 내용은 원문 그대로 유지)
- **Files modified:** `docs/making-of.md`
- **Commit:** `c1601f7`

**2. [Rule 1 - 버그] 스크립트/컴포넌트 주석에 리터럴 `.planning` 문자열이 남아 verify 자기모순 유발**
- **Found during:** Task 2
- **Issue:** `velite.config.ts`와 `src/app/about/page.tsx`의 설명 주석에 ".planning/" 문자열을 그대로 적어, 같은 태스크의 `<verify>`가 요구하는 "두 파일에 `.planning` 참조 0건" 조건을 스스로 위반
- **Fix:** 주석 문구를 "GSD 계획 산출물 디렉터리"로 바꿔 의미는 유지하고 리터럴 문자열만 제거
- **Files modified:** `velite.config.ts`, `src/app/about/page.tsx`
- **Commit:** `c1601f7`

## Issues Encountered

없음 — 위 두 편차를 즉시 수정한 뒤에는 3개 태스크 모두 `npm run build` + 태스크별 `<verify>` 자동화 블록이 계획된 그대로 통과함.

## Known Stubs

없음 — 이 Plan이 만든 모든 화면(내비, 테마 토글, Making-of 페이지, 브랜드 게이트)은 실제 동작하는 완성 기능이다. Phase 3에서 켜질 "오늘의 학습"/"일정표" 두 내비 항목은 D-09가 명시적으로 의도한 준비 중 비활성 상태이며, 숨기지 않고 배지로 자리를 표시하는 것이 설계 그대로다.

## User Setup Required

없음 - 외부 서비스 설정 불필요. `NEXT_PUBLIC_SITE_URL` 환경변수는 선택 사항이며 미설정 시 프로덕션 URL 기본값으로 빌드가 정상 성공함을 확인했다.

## Next Phase Readiness

- Plan 06(파일럿 레슨 콘텐츠 + iPad 실기기 UAT)이 이 Plan이 완성한 사이트 껍데기(내비·테마 토글·메타데이터) 위에서 실기기 확인을 진행할 수 있음
- UI-SPEC의 backstop 항목(375px 폭 내비 가로 스크롤 없음)은 자동 검증되지 않았으므로 Plan 06의 iPad 실기기 UAT 범위로 이월
- `scripts/check-brand.mjs`가 이후 모든 Plan·Phase가 재사용할 수 있는 재현 가능한 검증 커맨드로 확립됨
- 블로킹 항목 없음

---
*Phase: 01-deployed-curriculum-skeleton*
*Completed: 2026-08-24*

## Self-Check: PASSED

- FOUND: src/components/site-nav.tsx
- FOUND: src/components/theme-toggle.tsx
- FOUND: src/app/about/page.tsx
- FOUND: scripts/check-brand.mjs
- FOUND: src/app/layout.tsx (modified)
- FOUND: velite.config.ts (modified)
- FOUND: docs/making-of.md (modified)
- FOUND commit: 76d4824
- FOUND commit: c1601f7
- FOUND commit: 3a474c4
