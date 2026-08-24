---
phase: 01-deployed-curriculum-skeleton
plan: 06
subsystem: content
tags: [mdx, velite, tailwind-typography, rehype-pretty-code, shiki, korean-i18n, vercel]

# Dependency graph
requires:
  - phase: 01-deployed-curriculum-skeleton (Plan 04)
    provides: "레슨 페이지 라우트(hasContent 분기, empty state, 브레드크럼, 페이저) — src/app/lesson/[lessonId]/page.tsx"
  - phase: 01-deployed-curriculum-skeleton (Plan 05)
    provides: "글로벌 내비·다크모드·사이트 메타데이터·브랜드 게이트 — 이 Plan이 확정하는 타이포/코드 블록 규칙이 그 위에서 렌더된다"
provides:
  - "파일럿 레슨 2(React 컴포넌트)가 D-10 6단 구성 실콘텐츠로 렌더 — src/content/lessons/step-2/2-3-react-components.mdx"
  - "check-manifest.mjs의 hasContent 기대값 1→2 갱신, 두 파일럿 slug 모두 검증"
  - "실콘텐츠 기준으로 확정된 한국어 keep-all·코드 블록 44px 복사 버튼·prose line-height 1.6 — src/app/globals.css"
  - "Phase 1 전체 배포 확인 — 로컬 3게이트 + 프로덕션 5경로 200 + 404 확인, ROADMAP 5개 성공 기준 근거 기록"
affects: ["Phase 2 (진도 체크와 진행률)"]

actuals:
  tokens: 3659
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "rehype-pretty-code의 transformerCopyButton이 <code> 안에 매 코드 블록마다 동일 선택자(pre button.rehype-pretty-copy)의 인라인 <style>을 주입하므로, globals.css에서 이를 덮어쓰려면 specificity를 확실히 높여야 한다(.prose pre button.rehype-pretty-copy) — 그렇지 않으면 DOM 순서상 나중에 오는 인라인 <style>이 캐스케이드 동률에서 이긴다"
    - "Tailwind v4의 @import 이후 @layer 밖에 선언한 규칙은 @plugin이 주입하는 레이어드 유틸리티보다 캐스케이드 우선순위가 항상 높다 — .prose { line-height: 1.6 } 하나로 typography 플러그인의 기본 line-height를 안전하게 덮어썼다"
    - "pre의 padding-top을 44px 복사 버튼 높이만큼 늘려(3.25rem) 버튼이 첫 줄 코드와 겹치지 않게 하는 방식 — 버튼 위치(top/right)를 코드 줄 폭에 의존하지 않고 항상 안전하게 만든다"
    - "Plan 03~05가 로컬 커밋만 하고 origin/master에 푸시하지 않았음을 이번 Plan에서 발견 — Phase 최종 게이트가 프로덕션 URL을 검증하므로, 검증 전에 git push origin master로 15개 미반영 커밋을 배포부터 반영했다"

key-files:
  created: []
  modified:
    - src/content/lessons/step-2/2-3-react-components.mdx
    - scripts/check-manifest.mjs
    - src/app/globals.css

key-decisions:
  - "파일럿 2의 실무 예제는 '좋아요 버튼 카드' 컴포넌트로 설계 — props(name, initialLikeCount)·state(likeCount, isLiked)·라우팅(Link)을 한 예제 안에서 자연스럽게 모두 보여주면서, 이 사이트 자체의 실제 컴포넌트(SiteNav, ThemeToggle)와 같은 패턴(usePathname/useState, Link)을 참조하게 해 학습자가 '이 사이트가 이렇게 만들어졌다'는 감을 잡게 했다"
  - "복사 버튼 44px 오버라이드는 min-width/min-height만 쓰면 라이브러리의 width:24px/height:24px와 충돌 없이(min-* 이 항상 우선) 적용되지만, top/margin/background 같은 실제 충돌 속성은 반드시 selector specificity를 올려야 함을 확인 — .prose 접두사로 해결"
  - "Plan 03~05의 로컬 전용 커밋을 이번 Plan에서 origin/master에 푸시 — Task 3의 프로덕션 검증이 배포된 최신 상태를 전제하므로, 검증 전 배포 반영은 Rule 3(블로킹 이슈) 자동 조치로 처리했다"

requirements-completed: [UX-01, UX-03, CONT-06]

coverage:
  - id: D1
    description: "파일럿 레슨 2(React 컴포넌트)가 D-10 6단 구성 실콘텐츠로 렌더되고, hasContent가 true로 전환되어 복사해서 그대로 실행되는 완결 예제(tsx 코드 블록 2개, npm run dev 실행 방법 포함)를 담고 있다"
    requirement: CONT-06
    verification:
      - kind: unit
        ref: "npm run build && node scripts/check-manifest.mjs && grep -q 'hasContent: true' ... && test $(grep -c '^```tsx' ...) -ge 2 && grep -q 'npm run dev' ..."
        status: pass
    human_judgment: false
  - id: D2
    description: "check-manifest.mjs의 hasContent 기대 개수가 1에서 2로, 기대 slug 집합이 두 파일럿 모두로 갱신되어 매니페스트 게이트가 새 기대값을 강제한다"
    requirement: CONT-06
    verification:
      - kind: unit
        ref: "node scripts/check-manifest.mjs → all 11 invariants passed (35 lessons, 19 modules, total 7860 minutes)"
        status: pass
    human_judgment: false
  - id: D3
    description: "globals.css가 keep-all·overflow-wrap·overflow-x·monospace 폰트 스택·44px 복사 버튼 히트 영역·prose line-height 1.6을 모두 담고, text-overflow(말줄임)는 0건이다 — 실콘텐츠(두 파일럿) 위에서 확정"
    requirement: UX-03
    verification:
      - kind: unit
        ref: "grep -q keep-all/overflow-wrap/overflow-x/rehype-pretty-copy, grep -qE 'rehype-pretty-copy[^}]*(min-height|min-width)', grep -qE 'ui-monospace|font-mono', test text-overflow count=0, grep -qE 'line-height:\\s*1\\.6' — 전부 통과, npm run build/check-manifest/check-brand 전부 0 종료"
        status: pass
    human_judgment: true
    rationale: "44px 히트 영역·hover 없는 항상-보임·keep-all 줄바꿈·라이트/다크 대비는 iPad Safari 실기기에서만 최종 확정된다(RESEARCH Pitfall 3). workflow.human_verify_mode=end-of-phase 설정에 따라 이 Plan의 <verify><human-check> 항목은 개별 체크포인트로 중단하지 않고 Phase 종료 시 검증자가 한 번에 수집해 {phase}-UAT.md로 묶는다."
  - id: D4
    description: "Phase 1 최종 게이트 — 로컬 3게이트(build/check-manifest/check-brand) 통과, 정적 산출물 홈1·Step3·레슨35·about1, 프로덕션 5경로(홈·/step/1·파일럿1·파일럿2·/about) 200, 존재하지 않는 레슨 경로 404, 파일럿 2 프로덕션 응답에 복사 버튼+data-theme 존재"
    verification:
      - kind: unit
        ref: "node -e 프로덕션 fetch 스크립트(홈/step/1/파일럿1/파일럿2/about 전부 200, 404 경로 404, rehype-pretty-copy·data-theme 존재) — 배포 후 폴링으로 확인, ALL PRODUCTION CHECKS PASS"
        status: pass
    human_judgment: false
  - id: D5
    description: "ROADMAP Phase 1 5개 성공 기준이 배포된 URL 위에서 확인됨 — 아래 '## ROADMAP 성공 기준 대조' 참고"
    verification:
      - kind: unit
        ref: "프로덕션 홈/step/1/2/3 200, 파일럿 2개 렌더+하이라이팅+복사버튼, 심화/개요 배지+예상시간(약 4.5시간) 렌더, about.html 단계별 타임라인+github.com 링크"
        status: pass
    human_judgment: true
    rationale: "아이패드 세로/가로·라이트/다크 4조합 레이아웃 정상 동작(성공 기준 4)은 실기기 확인이 필요하다 — Phase 종료 UAT로 이월"

duration: 약 20분
completed: 2026-08-24
status: complete
---

# Phase 1 Plan 6: 파일럿 레슨 2 실콘텐츠 + 실콘텐츠 기준 타이포·코드 블록·터치 타깃 확정 + Phase 최종 게이트 Summary

**파일럿 두 편(Python 변수·자료형 / React 컴포넌트)을 모두 실콘텐츠로 세우고, 그 실콘텐츠 위에서 한국어 keep-all 줄바꿈·코드 블록 44px 복사 버튼·prose line-height 1.6을 확정한 뒤, 15개 미반영 커밋을 배포에 반영하고 Phase 1의 5개 성공 기준을 프로덕션 URL 위에서 직접 확인했다.**

## Performance

- **Duration:** 약 20분
- **Tasks:** 3/3 완료
- **Files modified:** 3 (2-3-react-components.mdx, check-manifest.mjs, globals.css)

## Accomplishments

- `src/content/lessons/step-2/2-3-react-components.mdx` — `hasContent: true`로 전환, D-10 6단 구성(학습 목표·왜 배우나·개념 설명·실무 예제·실무 팁·핵심 정리) 실콘텐츠. 실무 예제는 "좋아요 버튼 카드" 컴포넌트(props+state)와 이를 사용하는 페이지(Link 라우팅)로 구성된 두 개의 완결 tsx 파일 — 그대로 복사해 `npm run dev`로 실행 가능
- `scripts/check-manifest.mjs` — `EXPECTED_HAS_CONTENT_COUNT` 1→2, `EXPECTED_HAS_CONTENT_SLUGS`에 두 파일럿 모두 등록
- `src/app/globals.css` — `pre`에 padding-top 3.25rem(복사 버튼이 첫 줄을 가리지 않게)과 min-height 4.5rem(빈/한 줄 코드 블록 붕괴 방지) 추가, `.prose pre button.rehype-pretty-copy`에 44px 이상 히트 영역(min-width/min-height)과 라이트/다크 배경·테두리 대비 추가(hover 없이 항상 보이는 iPad 요구사항), `.prose { line-height: 1.6 }`로 typography 플러그인 기본값을 UI-SPEC 근거대로 덮어씀
- Plan 03~05의 로컬 전용 커밋(15개) 발견 → `git push origin master`로 배포 갱신, Vercel 자동 배포 완료까지 폴링 확인
- 로컬 3게이트(`npm run build`, `check-manifest.mjs`, `check-brand.mjs`) 전부 0 종료, 정적 산출물 홈 1 / Step 3 / 레슨 35 / about 1 확인
- 프로덕션 5경로(홈·`/step/1`·파일럿 1·파일럿 2·`/about`) 200, 존재하지 않는 레슨 경로 404, 파일럿 2 프로덕션 응답에 복사 버튼 마크업과 `data-theme` 속성 확인

## ROADMAP 성공 기준 대조

| # | 기준 | 확인 결과 | 근거 |
|---|------|-----------|------|
| 1 | 공개 URL에서 3 Step / 19 모듈 / 전체 레슨 목록 탐색, 레슨 이동 | PASS | 프로덕션 `/`, `/step/1`, `/step/2`, `/step/3` 전부 200. 홈에 세 Step 식별 텍스트 확인. 모듈 아코디언·레슨 목록은 Plan 04에서 구축, 이번 Plan은 라우트 존재만 재확인 |
| 2 | 파일럿 2편 렌더 + 언어별 하이라이팅 + 복사 버튼 | PASS | 프로덕션 파일럿 1·2 응답 모두 `rehype-pretty-copy`·`data-theme="github-dark-dimmed github-light"` 포함 확인 |
| 3 | 전 레슨 카드·헤더 깊이 배지 + 예상 소요시간, Step 3 개요 | PASS | 파일럿 2 빌드 출력에 `심화` 배지와 `약 4.5시간` 확인. check-manifest Invariant 3·4가 전 레슨의 depth 규칙(Step 1·2=심화, Step 3=개요)을 상시 강제 |
| 4 | 아이패드 세로/가로 정상 동작(44px, 코드 가로 스크롤, keep-all), 폰·데스크톱 반응형 | 자동 부분 PASS, 실기기 확인은 Phase UAT로 이월 | globals.css에 keep-all/overflow-wrap/overflow-x/44px 히트영역/line-height 1.6 전부 존재·`text-overflow` 0건을 정적으로 확인. 실기기 hover-없음·터치 정밀도·세로/가로 전환은 `human_verify_mode: end-of-phase` 설정에 따라 Phase 종료 시 검증자가 `{phase}-UAT.md`로 수집 |
| 5 | Making-of 페이지가 자료 수집→리서치→스택 선택 이유 기록, 갱신 구조 보유 | PASS | Plan 05에서 구축·검증 완료(about.html에 "단계"·"github.com" 확인), 이번 Plan에서 재확인만 수행 |

## Task Commits

Each task was committed atomically:

1. **Task 1: 파일럿 레슨 2 "React 컴포넌트" 실콘텐츠 작성** - `26aae9e` (feat)
2. **Task 2: 실콘텐츠 기준 한국어 타이포·코드 블록·터치 타깃 확정** - `867ebc0` (feat)
3. **Task 3: Phase 1 최종 게이트** - 검증 전용(파일 변경 없음, `<files>(none)</files>`) — 위반 없이 통과, 별도 커밋 없음

## Files Created/Modified

- `src/content/lessons/step-2/2-3-react-components.mdx` - 파일럿 2 실콘텐츠(D-10 6단 구성, tsx 완결 예제 2개)
- `scripts/check-manifest.mjs` - hasContent 기대값 1→2, 기대 slug 집합 갱신
- `src/app/globals.css` - 복사 버튼 44px, pre padding-top/min-height, prose line-height 1.6

## Decisions Made

- 파일럿 2 실무 예제를 "좋아요 버튼 카드"(props+state+Link 라우팅)로 설계 — 이 사이트 자체의 실제 컴포넌트 패턴(SiteNav의 usePathname, ThemeToggle의 useState)을 참조하게 해 학습자가 "이 사이트가 이렇게 만들어졌다"를 체감하게 함
- 복사 버튼 44px 오버라이드에서 min-width/min-height는 라이브러리 기본값(width/height 24px)과 충돌 없이 항상 적용되지만, top/margin/background 같은 진짜 충돌 속성은 selector specificity(`.prose` 접두사)를 올려야만 확실히 이긴다는 점을 확인하고 반영
- Plan 03~05가 로컬 커밋만 하고 origin/master에 푸시하지 않았음을 발견 — Task 3의 프로덕션 검증이 배포된 최신 상태를 전제하므로, 검증 전 `git push origin master`로 15개 미반영 커밋을 배포에 반영(Rule 3 자동 조치)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - 블로킹 이슈] Plan 03~05의 커밋이 origin/master에 반영되지 않아 프로덕션 URL이 구버전이었음**
- **Found during:** Task 3 (Phase 최종 게이트, 프로덕션 확인 단계)
- **Issue:** `git fetch` 결과 origin/master가 로컬 master보다 15개 커밋 뒤처져 있었음(Plan 02 이후 아무도 push하지 않음). 이 상태로 프로덕션 URL을 확인하면 파일럿 2 라우트가 404, 커리큘럼 매니페스트·글로벌 내비 등도 반영 전 상태였음
- **Fix:** `git push origin master`로 로컬 master(867ebc0까지)를 전부 반영. Vercel Production Branch=master 자동 배포가 트리거됨을 확인, 파일럿 2 경로가 200으로 응답할 때까지 폴링(약 1분 내 반영)
- **Files modified:** 없음(배포 반영만, 파일 변경 없음)
- **Verification:** 프로덕션 `/lesson/2-3-react-components` 200 + `rehype-pretty-copy`/`data-theme` 포함, 나머지 4경로 200, 존재하지 않는 레슨 경로 404 — 전부 확인
- **Committed in:** 해당 없음(git push는 새 커밋을 만들지 않음, 기존 커밋 26aae9e/867ebc0 및 이전 15개 커밋을 원격에 반영)

---

**Total deviations:** 1 auto-fixed (1 블로킹 이슈)
**Impact on plan:** Task 3의 프로덕션 검증을 의미 있게 만들기 위한 필수 조치. 계획 범위를 벗어난 추가 기능 없음.

## Issues Encountered

없음 — 위 배포 반영 편차를 처리한 뒤에는 3개 태스크 모두 계획된 자동 검증 블록을 그대로 통과함.

## Known Stubs

없음 — 이 Plan이 만든/확장한 모든 파일(파일럿 2 콘텐츠, 매니페스트 게이트, 타이포/코드블록 규칙)은 실제 동작하는 완성 기능이다. 33개 비-파일럿 레슨의 "콘텐츠 준비 중입니다" 빈 상태는 Plan 04가 이미 설계한 대로 남아 있으며(Phase 4~5에서 채워질 예정), 이 Plan의 범위가 아니다.

## User Setup Required

없음 - 외부 서비스 설정 불필요. `git push origin master`는 기존에 인증된 원격(`origin` = `https://github.com/dhchun1203/ai-engineer-runway.git`)에 대해 자동으로 성공했다.

## Next Phase Readiness

- Phase 1의 5개 ROADMAP 성공 기준이 배포된 프로덕션 URL 위에서 전부 확인됨(기준 4의 실기기 세부 확인만 Phase 종료 UAT로 이월)
- Phase 2(진도 체크와 진행률)가 얹힐 뼈대 — 커리큘럼 매니페스트, 홈/Step/레슨 라우트, 글로벌 내비·다크모드, 두 파일럿 실콘텐츠, 타이포/코드 블록 규칙 — 전부 완성되어 프로덕션에 배포됨
- `workflow.human_verify_mode: end-of-phase` 설정에 따라 이 Plan과 이전 Plan들의 `<verify><human-check>` 항목(아이패드 세로/가로·라이트/다크 4조합, 375px 내비 가로 스크롤, 복사 버튼 hover-없음 동작)은 개별 체크포인트 없이 Phase 종료 시 검증자가 한 번에 수집해 `01-UAT.md`로 묶을 것으로 예상됨
- 블로킹 항목 없음

---
*Phase: 01-deployed-curriculum-skeleton*
*Completed: 2026-08-24*

## Self-Check: PASSED

- FOUND: src/content/lessons/step-2/2-3-react-components.mdx
- FOUND: scripts/check-manifest.mjs
- FOUND: src/app/globals.css
- FOUND: .planning/phases/01-deployed-curriculum-skeleton/01-06-SUMMARY.md
- FOUND commit: 26aae9e
- FOUND commit: 867ebc0
