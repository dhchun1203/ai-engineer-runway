---
phase: 01-deployed-curriculum-skeleton
verified: 2026-08-24T00:18:14Z
status: human_needed
score: 4/5 must-haves verified
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "아이패드 Safari 세로/가로 모드에서 레이아웃이 정상 동작하고(터치 타깃 44px+, 코드 블록 가로 스크롤, 한국어 keep-all 줄바꿈), 폰·데스크톱에서도 반응형으로 동작한다"
    test: "iPad Safari 실기기에서 홈 → Step 1 → 모듈 아코디언 → 레슨 → 이전/다음 → 소개까지 세로/가로, 라이트/다크 4조합으로 순회하고, 파일럿 레슨 2편에서 한국어 줄바꿈·코드 가로 스크롤·복사 버튼 hover-free 동작·실제 클립보드 복사가 되는지 확인. 375px 폭에서 글로벌 내비도 확인"
    expected: "레이아웃 붕괴·가로 스크롤·터치 타깃 미스·복사 실패가 하나도 없다"
    why_human: "코드는 44px 터치 타깃(min-h-11/min-w-11), keep-all, overflow-x:auto, hover 없이 항상 보이는 복사 버튼을 정적으로 모두 갖추고 있음을 확인했으나, 실제 iPad Safari의 hover-부재 렌더링·손가락 탭 정밀도·clipboard API 동작·에뮬레이터로는 재현되지 않는 hover 오탐(RESEARCH Pitfall 3)은 grep/정적 검사로 증명할 수 없다. 이 프로젝트의 human_verify_mode=end-of-phase 설정에 따라 6개 Plan의 <human-check> 항목이 이 검증 단계로 이월되었다"
human_verification:
  - test: "iPad Safari(또는 Safari 375px 반응형 모드)에서 세로·가로 모두 열어 글로벌 내비 4항목 + 테마 토글이 가로 스크롤 없이 보이고 손가락으로 정확히 눌리는지 확인. 테마 토글 후 새로고침해 선택이 유지되고 첫 페인트에 잘못된 테마가 번쩍이지 않는지 확인 (01-05-PLAN Task 3)"
    expected: "내비·토글이 375px 폭에서 겹치거나 잘리지 않고, 테마 선택이 새로고침 후에도 유지되며 FOUC가 없다"
    why_human: "실기기 hover-부재 렌더링과 하이드레이션 타이밍은 정적 코드 검사로 확인 불가"
  - test: "iPad Safari 실기기에서 두 파일럿 레슨(Python 변수·자료형 / React 컴포넌트)을 연다. (a) 세로·가로에서 한국어 본문이 어절 중간에서 끊기지 않고 제목이 말줄임 없이 줄바꿈되는지 (b) 코드 블록 긴 줄이 가로 스크롤되며 줄바꿈·잘림이 없는지 (c) 복사 버튼이 hover 없이 항상 보이고 손가락으로 정확히 눌리며 실제로 복사되는지 (d) 라이트·다크 두 테마 모두에서 (a)~(c)가 성립하는지 확인. 데스크톱 모바일 에뮬레이션으로 대체하지 말 것(에뮬레이션은 hover 이벤트를 발생시켜 복사 버튼 함정을 가림) (01-06-PLAN Task 2)"
    expected: "네 조합(세로/가로 × 라이트/다크) 모두에서 (a)~(d)가 성립한다"
    why_human: "clipboard API 실제 쓰기 성공 여부와 hover-부재 환경에서의 버튼 가시성·탭 정밀도는 코드 정적 검사로 증명 불가"
  - test: "iPad Safari 실기기에서 홈 → Step 1 → 모듈 아코디언 → 레슨 → 이전/다음 → 소개까지 한 바퀴 돌며 세로·가로, 라이트·다크 네 조합 확인. 이어서 폰 폭·데스크톱 폭에서 같은 경로를 돌며 가로 스크롤·겹침이 없는지 확인. 소개 페이지가 자료 수집 → 리서치 → 요구사항 → 로드맵 → 구현·배포 단계를 실제로 읽히게 보여주는지 확인 (01-06-PLAN Task 3)"
    expected: "전 화면·전 뷰포트·전 테마 조합에서 레이아웃 붕괴나 가로 스크롤이 없고, 소개 페이지가 실제로 읽을 수 있는 단계별 기록을 보여준다"
    why_human: "실기기 반응형 렌더링은 grep/curl로 관찰할 수 없는 시각적 검증"
---

# Phase 1: 배포된 커리큘럼 스켈레톤 Verification Report

**Phase Goal:** 학습자가 배포된 URL에 아이패드로 접속해 커리큘럼 3단 구조를 탐색하고 실제 레슨을 읽을 수 있다
**Verified:** 2026-08-24T00:18:14Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 학습자가 공개 Vercel URL에 접속해 3 Step / 19 모듈 / 전체 레슨 목록을 탐색하고 레슨 페이지로 이동할 수 있다 | ✓ VERIFIED | 프로덕션(`https://ai-engineer-runway.vercel.app`) `/`, `/step/1`, `/step/2`, `/step/3` 전부 HTTP 200. 홈 HTML에 Step/모듈/레슨 텍스트와 `step/1·2·3` 링크 존재. `node scripts/check-manifest.mjs` → "all 11 invariants passed (35 lessons, 19 modules, total 7860 minutes)". `src/content/modules.ts`에 3 Step + 5+7+7=19 모듈 정의 확인. `find src/content/lessons -name "*.mdx" \| wc -l` = 35. `/step/1` 프로덕션 응답에 10개(Step 1 레슨 수) 레슨 링크 확인 |
| 2 | 실제 콘텐츠가 담긴 파일럿 레슨 2개(Step 1 + Step 2 각 1개)가 렌더링되고, 코드 블록이 언어별 하이라이팅과 복사 버튼을 갖는다 | ✓ VERIFIED | `hasContent: true`인 레슨이 정확히 2개(`1-3-python-variables-and-types.mdx` Step 1, `2-3-react-components.mdx` Step 2). 프로덕션 두 경로 모두 200이며 응답 본문에 `data-theme`(Shiki 이중 테마)와 `rehype-pretty-copy`(복사 버튼) 둘 다 존재. `velite.config.ts`의 `transformerCopyButton({ visibility: "always" })` 확인 |
| 3 | 모든 레슨 카드·헤더에 깊이 배지(심화/개요)와 예상 소요시간이 표시되고, Step 3 레슨은 개요로 분류되어 있다 | ✓ VERIFIED | `DepthBadge`/`EstimatedTime`이 `lesson/[lessonId]/page.tsx`와 `module-accordion.tsx` 양쪽에서 import·렌더됨. Step 3 13개 레슨 전부 `depth: "개요"`, Step 1·2 22개 레슨 전부 `depth: "심화"`(예외 0건, grep으로 전수 확인). 프로덕션 `/step/1` 응답에 "심화" 배지 20회, "5시간" 시간 표기 20회 확인(10레슨 × 헤더+카드) |
| 4 | 아이패드 Safari 세로/가로 모드에서 레이아웃이 정상 동작하고(터치 타깃 44px+, 코드 블록 가로 스크롤, 한국어 keep-all 줄바꿈), 폰·데스크톱에서도 반응형으로 동작한다 | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | 코드 레벨 요건은 전부 정적으로 확인됨: `min-h-11`(44px) 클래스가 nav/accordion/step-card/theme-toggle/lesson-nav 전 인터랙티브 요소에 적용, `word-break: keep-all` + `overflow-wrap: break-word`가 `globals.css`에 존재, `pre { overflow-x: auto }` 존재, 복사 버튼에 `min-width/min-height: 44px` 오버라이드 존재, Step 카드 그리드가 `grid-cols-1 sm:grid-cols-3`. 그러나 실제 iPad Safari 세로/가로·라이트/다크 조합에서의 시각적 렌더링·hover-부재 탭 정밀도·클립보드 복사 성공 여부는 grep/curl로 증명 불가 — `workflow.human_verify_mode: end-of-phase` 설정에 따라 6개 Plan의 `<human-check>` 항목이 이 검증 단계로 이월됨(아래 Human Verification 참고) |
| 5 | Making-of 페이지가 자료 수집 → 리서치 → 스택 선택 이유까지 기록하고 있으며, 이후 단계마다 갱신할 구조를 갖는다 | ✓ VERIFIED | `docs/making-of.md`가 `### 1단계 — 기획 & 자료 수집 ✅` ~ `### 5단계 — 구현 ✅`을 실제 기록으로 담고, `### 6단계 — 검증 🔜` / `### 7단계 — 배포 & 회고 🔜`가 남아 갱신 구조를 보여줌. "기술 스택 — 무엇을, 왜 골랐나" 표에 6개 선택과 검토했지만 안 쓴 대안까지 기록. 프로덕션 `/about`에 "단계" 28회, "리서치" 12회, "스택" 16회, GitHub 링크(`github.com/dhchun1203/ai-engineer-runway`) 확인 |

**Score:** 4/5 truths verified (1 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/content/modules.ts` | 3 Step + 19 모듈 정의 | ✓ VERIFIED | `steps`(3) / `modules`(5+7+7=19) export 확인 |
| `src/content/curriculum-helpers.ts` | 매니페스트 조회 헬퍼 | ✓ VERIFIED | `getStep`, `getModulesByStep`, `getLessonsByModule`, `getOrderedLessons`, `getLessonBySlug`, `getAdjacentLessons`, `getLessonCounts` 전부 export 확인 |
| `scripts/check-manifest.mjs` | 매니페스트 불변식 11종 게이트 | ✓ VERIFIED | 실행 결과 `all 11 invariants passed (35 lessons, 19 modules, total 7860 minutes)`, exit 0 |
| `scripts/check-brand.mjs` | 브랜드/개인정보 노출 게이트 | ✓ VERIFIED | 실행 결과 `위반 없음 — 60개 파일 검사 완료`, exit 0. 프로덕션 `/`·`/about` 응답에 금지 브랜드 문자열 0건(직접 curl로 재확인) |
| `src/app/page.tsx` | 홈 — Step 카드 3장 | ✓ VERIFIED | `grid-cols-1 sm:grid-cols-3`, `getLessonCounts` 사용 확인 |
| `src/app/step/[stepId]/page.tsx` | Step 페이지 — 아코디언 | ✓ VERIFIED | `generateStaticParams` 존재, 프로덕션 3경로 200 |
| `src/app/lesson/[lessonId]/page.tsx` | 레슨 페이지 — 35개 정적 경로 | ✓ VERIFIED | `hasContent` 분기, 브레드크럼, 페이저, empty-state 카피 확인. `npm run build` 산출물에 레슨 35개 SSG 페이지 생성 |
| `src/app/not-found.tsx` | 에러 상태 + 홈 복귀 CTA | ✓ VERIFIED | "페이지를 찾을 수 없습니다" + "커리큘럼 홈으로" 링크(44px) 존재. 프로덕션 잘못된 경로 404 확인 |
| `src/components/depth-badge.tsx`, `estimated-time.tsx`, `module-accordion.tsx`, `lesson-nav.tsx`, `step-card.tsx`, `site-nav.tsx`, `theme-toggle.tsx` | UI 컴포넌트 일체 | ✓ VERIFIED | 전부 존재, 관련 페이지에서 import·사용 확인 |
| `src/app/about/page.tsx` | Making-of 렌더 | ✓ VERIFIED | `docs/making-of.md`를 `pages` 컬렉션으로 렌더, GitHub 링크 포함(프로덕션 확인) |
| 파일럿 레슨 MDX 2편 | 실콘텐츠 | ✓ VERIFIED | `1-3-python-variables-and-types.mdx`, `2-3-react-components.mdx` 존재, `hasContent: true`, D-10 6단 구성 |
| README.md | 배포 URL 앵커 | ✓ VERIFIED | `https://ai-engineer-runway.vercel.app` 기록 확인 |
| 공개 GitHub 저장소 `ai-engineer-runway` | 배포 소스 | ✓ VERIFIED | `git remote -v` 확인, 프로덕션과 연동 |
| Vercel 프로덕션 배포 | 공개 URL | ✓ VERIFIED | 모든 경로 curl 200/404 확인(아래 Behavioral Spot-Checks) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `next.config.ts` | Velite | `VELITE_STARTED` 가드 뒤 top-level await `import('velite')` | ✓ WIRED | `npm run build` 로그에 `[VELITE] building... / build finished` 확인 |
| `src/app/lesson/[lessonId]/page.tsx` | `.velite/lessons.json` | `#site/content`에서 `lessons` import | ✓ WIRED | `tsconfig.json` paths에 `#site/content` 등록, import 확인 |
| `src/app/step/[stepId]/page.tsx` | `curriculum-helpers.ts` | `getModulesByStep`/`getLessonsByModule` | ✓ WIRED | 프로덕션 `/step/1` 응답에 10개 레슨 링크 실제 렌더 확인(데이터 실제로 흐름) |
| `src/app/about/page.tsx` | `docs/making-of.md` | velite `pages` 컬렉션 → `MDXContent` | ✓ WIRED | 프로덕션 `/about`에 실제 5단계 본문·GitHub 링크 렌더 확인 |
| `velite.config.ts` | `@rehype-pretty/transformers` | `transformerCopyButton({ visibility: "always" })` | ✓ WIRED | 빌드 산출물 및 프로덕션 두 레슨 응답에 `rehype-pretty-copy` 존재 |
| GitHub `ai-engineer-runway`(master) | Vercel 프로덕션 | GitHub 연동 | ✓ WIRED | 로컬/원격 커밋 일치, 프로덕션이 최신 콘텐츠(파일럿 2, 매니페스트 35개) 반영 확인 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| 홈 Step 카드 | `getLessonCounts(stepId)` | `.velite/lessons.json` + `modules.ts` 조인 | Yes(카운트는 실계산, 진행률만 Phase 2 전까지 0% 고정 슬롯 — 계획대로) | ✓ FLOWING |
| Step 페이지 모듈 아코디언 | `getModulesByStep`/`getLessonsByModule` | 위와 동일 | Yes | ✓ FLOWING |
| 레슨 페이지 본문 | `lesson.code` (Velite MDX 컴파일 결과) | `.velite/lessons.json` | Yes(MDXContent가 `new Function(code)`로 실제 렌더) | ✓ FLOWING |
| 레슨 이전/다음 | `getAdjacentLessons` | 정렬된 35개 레슨 배열 | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 로컬 빌드 통과 | `npm run build` | Turbopack 컴파일 성공, TypeScript 통과, 43개 정적 경로 생성(홈1+Step3+레슨35+about1+_not-found+기타) | ✓ PASS |
| 매니페스트 불변식 | `node scripts/check-manifest.mjs` | `all 11 invariants passed (35 lessons, 19 modules, total 7860 minutes)`, exit 0 | ✓ PASS |
| 브랜드 게이트 | `node scripts/check-brand.mjs` | `위반 없음 — 60개 파일 검사 완료`, exit 0 | ✓ PASS |
| 프로덕션 홈/Step 1·2·3/about 200 | `curl -o /dev/null -w '%{http_code}'` × 6경로 | 전부 200 | ✓ PASS |
| 프로덕션 파일럿 레슨 2편 200 + 하이라이팅 + 복사버튼 | curl + grep `data-theme`/`rehype-pretty-copy` | 두 레슨 모두 확인 | ✓ PASS |
| 프로덕션 존재하지 않는 레슨 경로 | `curl /lesson/does-not-exist` | 404 | ✓ PASS |
| 프로덕션 stub 레슨(33개 중 1개 표본) empty-state | curl + grep "콘텐츠 준비 중입니다" | 200, empty-state 카피 렌더 확인 | ✓ PASS |
| 브랜드 문자열 0건(프로덕션) | curl 홈/about + grep -i kant | 0건 | ✓ PASS |
| ESLint | `npx eslint src scripts` | 2 errors(`module` 변수 shadow, `set-state-in-effect`), 1 warning | ⚠️ INFO (아래 Anti-Patterns 참고, 빌드는 통과하므로 목표 미달성 아님) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| CONT-01 | 01-03, 01-04 | Step→모듈→레슨 3단 구조 탐색 | ✓ SATISFIED | 매니페스트 3/19/35 + 3개 경로 렌더 확인 |
| CONT-04 | 01-03, 01-04 | 깊이 배지(심화/개요) 전 레슨 표시, Step3=개요 | ✓ SATISFIED | 13/13 Step3=개요, 22/22 Step1·2=심화, 배지 컴포넌트 wiring 확인 |
| CONT-06 | 01-01, 01-06 | 코드 블록 복사 버튼 | ✓ SATISFIED(코드) / 실기기 클립보드 동작은 human_verification 이월 | `visibility: always`, 44px 히트영역, 프로덕션 마크업 존재 |
| PLAT-01 | 01-02 | Vercel 배포, URL 접속 | ✓ SATISFIED | 프로덕션 전 경로 200, 원격 저장소 연동 확인 |
| PLAT-03 | 01-05 | Making-of 5단계 기록·갱신 구조 | ✓ SATISFIED | `/about` 렌더 + docs/making-of.md 5단계 내용 확인 |
| UX-01 | 01-04, 01-05, 01-06 | iPad 44px+, 세로/가로 | ✓ SATISFIED(코드) / 실기기 확인 human_verification 이월 | 전 인터랙티브 요소 `min-h-11`, keep-all/overflow-x 존재 |
| UX-02 | 01-04, 01-05 | 폰·데스크톱 반응형 | ✓ SATISFIED(코드) | `grid-cols-1 sm:grid-cols-3` 등 반응형 클래스 확인, 실기기 확인은 human_verification 항목에 포함 |
| UX-03 | 01-01, 01-06 | keep-all, 코드 가로 스크롤 | ✓ SATISFIED | `word-break: keep-all`, `overflow-wrap`, `overflow-x: auto` 전부 `globals.css` 확인 |

**Orphaned requirements:** 없음 — REQUIREMENTS.md Phase 1 트레이서빌리티 표의 8개 ID(CONT-01, CONT-04, CONT-06, PLAT-01, PLAT-03, UX-01, UX-02, UX-03)가 6개 Plan의 `requirements:` 프런트매터에 전부 매핑되어 있음 (`grep -H "^requirements:" 01-0*-PLAN.md` 결과 합집합 = REQUIREMENTS.md 매핑과 정확히 일치)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/lesson-nav.tsx` | 10 | `const module = ...` — `@next/next/no-assign-module-variable` ESLint 에러 | ⚠️ Warning (advisory, REVIEW WR-01) | `npm run lint`이 실패하지만 `npm run build`는 통과 — 목표 달성에는 영향 없음. Phase 2 이전 정리 권장 |
| `src/components/theme-toggle.tsx` | 15 | `setState` in `useEffect` — `react-hooks/set-state-in-effect` ESLint 에러 | ⚠️ Warning (advisory, REVIEW WR-02) | 다크모드 토글 기능 자체는 정상 동작(빌드·런타임 정상), lint 게이트만 red |
| `package.json` | 5-10 | `check-brand.mjs`/`check-manifest.mjs`가 `npm run build`/CI에 wiring되지 않음 | ⚠️ Warning (advisory, REVIEW WR-03) | 두 게이트 모두 현재 통과하고 이 검증에서도 수동 실행해 재확인했으나, 향후 커밋이 이 게이트를 우회해 배포될 위험은 열려 있음. Phase 1 목표(현재 상태의 3단 구조 탐색·레슨 읽기)에는 영향 없어 gap으로 분류하지 않음 — 지침(REVIEW의 advisory warning은 success criterion을 깨지 않는 한 검증 실패로 취급하지 않음)에 따라 정보로만 기록 |

이 세 항목은 모두 `01-REVIEW.md`가 이미 0 critical / 6 warning / 5 info로 분류한 advisory 코드 리뷰 결과이며, ROADMAP의 5개 성공 기준 중 어느 것도 깨뜨리지 않는다.

### Human Verification Required

`workflow.human_verify_mode: end-of-phase` 설정에 따라 6개 Plan에서 개별 체크포인트로 중단하지 않고 이 검증 단계로 이월된 실기기 확인 항목 3건 (프런트매터 `human_verification` 참고):

1. **글로벌 내비 375px 반응형 + 테마 지속성** — iPad Safari(또는 375px 반응형 모드)에서 세로·가로 모두 열어 내비 4항목+테마 토글이 가로 스크롤 없이 44px로 눌리는지, 테마 선택이 새로고침 후 유지되는지, 첫 페인트 FOUC가 없는지 확인
2. **파일럿 레슨 2편 iPad 실기기 검증** — 세로·가로 × 라이트·다크 4조합에서 한국어 keep-all 줄바꿈, 코드 블록 가로 스크롤(잘림 없음), 복사 버튼 hover-free 표시 + 실제 클립보드 복사 성공 확인. 에뮬레이터 대체 금지(hover 오탐 위험)
3. **전체 사용자 흐름 + 반응형 + 소개 페이지 가독성** — 홈→Step 1→아코디언→레슨→이전/다음→소개를 iPad 세로/가로·라이트/다크로 순회, 이어서 폰·데스크톱 폭에서 동일 경로 확인. 소개 페이지가 자료 수집→리서치→요구사항→로드맵→구현·배포를 실제로 읽히게 보여주는지 확인

### Gaps Summary

없음 — FAILED로 분류된 must-have가 없다. 유일한 미확정 항목(성공 기준 4 "아이패드 실기기 레이아웃 정상 동작")은 코드 레벨에서 전부 충족되었으나 실기기 시각적 검증이 필요해 ⚠️ PRESENT_BEHAVIOR_UNVERIFIED로 분류했고, `human_verify_mode: end-of-phase` 설계에 따라 위 3건의 human_verification 항목으로 수집했다. 나머지 4개 성공 기준과 8개 요구사항(CONT-01, CONT-04, CONT-06, PLAT-01, PLAT-03, UX-01, UX-02, UX-03)은 정적 코드 검사와 프로덕션 URL 직접 curl 검증으로 확인되었다.

---

_Verified: 2026-08-24T00:18:14Z_
_Verifier: Claude (gsd-verifier)_
