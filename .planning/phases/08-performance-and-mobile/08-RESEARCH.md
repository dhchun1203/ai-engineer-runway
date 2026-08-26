# Phase 8: 성능·인터랙션·스마트폰 최적화 - Research

**Researched:** 2026-08-27
**Domain:** Next.js 16(App Router) 정적/동적 렌더링 전환, 폰트 서브셋, CSS 전용 인터랙션, Playwright 기반 성능 회귀 게이트
**Confidence:** HIGH — 이 리서치의 핵심 발견은 전부 리포지토리 소스코드를 직접 읽거나(Read), `node_modules/next/dist/docs/`(이 프로젝트에 설치된 Next.js 16.3.2 버전의 공식 문서)를 직접 읽거나, `npm view`/패키지 정당성 검사 도구로 확인했다. Pretendard 서브셋 배포 관행 1건만 WebSearch 기반이라 [CITED]로 별도 표기했다.

<user_constraints>
## User Constraints (from ROADMAP.md Phase 8 — CONTEXT.md가 없어 로드맵 본문이 그 역할을 대신한다)

### Locked Decisions (2026-08-27, 사용자와 논의 후 확정 — 재논의 대상 아님)

- **쓸 스킬: `design-taste-frontend` 부분 적용.** 4.5절(탭 피드백·스켈레톤·빈/에러 상태·버튼 대비 하드 룰), 5.A~C절(sticky-stack/가로 팬/순차 등장 뼈대 코드 — 참고용), 5.D절(스크롤 리스너 금지, 스크롤 위치 React 상태 추적 금지), 6절(`transform`/`opacity`만 애니메이트, 움직임 줄이기 존중)만 가져온다. 이 스킬의 랜딩 페이지 전용 규칙(히어로, 에어브로우, 존테스티모니얼, 마퀴 등)은 이 프로젝트(학습 대시보드)에 적용하지 않는다.
- **Motion 라이브러리는 조건부.** "새 패키지 없이" 원칙을 지켜왔다. CSS로 되는 것을 먼저 하고, 스크롤 연동 물리나 요소 간 공유 전환처럼 실제로 필요한 지점이 생겼을 때만 Motion을 넣되 이유를 남긴다. GSAP은 로드맵에 언급조차 없으므로 이 phase에서 고려 대상이 아니다.
- **검증 방침:** 아이패드에서 스크롤·전환이 60fps를 유지하는지 자동 게이트로 확인한다("보기에 괜찮다"가 아니라 숫자로). Phase 6에서 게이트 16종이 전부 초록불인 상태로 실기기 결함(메모장 하단 틈)이 나온 전례가 있으므로, 실기기 확인 항목도 함께 남긴다.
- **Phase 6 의존.** 디자인 토큰·셸이 확정된 뒤라야 폰 다듬기가 다시 뒤집히지 않는다 — Phase 6은 완료됨(2026-08-27).
- **이미 해결된 것(이 phase 범위 밖):** Vercel 서버리스 리전을 icn1(서울)로 이동 완료(커밋 bf2ab53) — 동적 라우트 TTFB 238~252ms → 59~68ms. 이 phase는 나머지 격차(정적 라우트 대비 약 30ms, 폰트 2.0MB, 폰 375px 사용성)만 다룬다.

### Claude's Discretion

- 정적 생성 전환의 구체적 구현 방식(파일 구조, 어떤 Next.js 캐싱 모델을 쓸지) — 로드맵은 "정적으로 미리 만들어 두고 진도 정보만 따로 가져온다"는 목표만 제시하고 구현 API는 지정하지 않았다. 이 리서치의 Architecture Patterns 절이 구체적 선택지를 제시한다.
- 성능 회귀 게이트의 정확한 측정 방법과 임계값 — 로드맵은 "숫자로 확인"만 요구, 도구·임계값은 위임됨.
- 폰트 서브셋 툴체인 선택 — 로드맵은 "서브셋하면 200~400KB 수준"이라는 기대치만 제시.

### Deferred Ideas (OUT OF SCOPE)

- Phase 7(아이패드 브라우저 실습 환경)의 범위 — 이 phase와 별개, 순서상 Phase 8 다음.
- 이 phase에서 다루지 않는 v2 편의 기능(CONV-01~04) — 검색/필터, 개인 노트(이미 배포됨, Phase 8 범위 아님), 자동 리밸런싱, PWA.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TBD (PROJECT.md Active "모바일·아이패드 최적화" 귀속 후보) | 확정된 REQ ID가 없다 — ROADMAP.md는 이 phase의 성공 기준 5개(SC1~SC5, 위 Locked Decisions 상단 원문)를 요구사항 단위로 명시한다. Phase 6이 같은 패턴(TBD → 성공 기준을 요구사항으로 대체)을 이미 썼다(`06-VALIDATION.md`, `06-EDGE-COVERAGE.json` 참고). | 이 리서치의 모든 절이 SC1~SC5 각각에 대응한다: SC1→Architecture Patterns Pattern 1·2, SC2→Font Subsetting 절, SC3→Phone Usability 절, SC4→Validation Architecture, SC5→Interaction Layer 절. |

계획자는 `/gsd-plan-phase 8`에서 SC1~SC5를 그대로 요구사항 ID처럼 취급하고, `08-VALIDATION.md`가 확정되면 PROJECT.md Active 항목에 소급 연결할 것을 권한다(Phase 6 선례).
</phase_requirements>

## Summary

이 phase는 서로 다른 근본 원인을 가진 세 가지 문제를 하나의 phase로 묶는다. (1) 5개 라우트가 전부 `export const dynamic = "force-dynamic"`으로 선언되어 있어 매 요청마다 서버가 페이지를 다시 그린다 — 원인은 진도 쿠키(`hasUnlockCookie()`)를 페이지 컴포넌트 최상단에서 무조건 호출하기 때문이다. (2) `PretendardVariable.woff2`가 2.0MB(한자·가나 포함 풀세트)인데 이 사이트는 한글·영문·숫자만 쓴다 — 레슨 콘텐츠 35편을 전수 스캔한 결과 한자·가나 글리프는 0건이었다. (3) 인터랙션 감각(눌림 피드백·스켈레톤·빈/에러 상태)이 없다.

가장 중요한 발견은 두 가지다. 첫째, 이 프로젝트가 설치한 Next.js 16.3.2는 `next.config.ts`에서 `cacheComponents` 플래그를 켜지 않는 한 **"이전 캐싱 모델"**로 동작한다 — `export const dynamic = "force-dynamic"`은 이 모델에서 여전히 유효한 API이고 폐기되지 않았다. 그러나 이 모델에서는 `cookies()`를 페이지 어디서든 호출하면 `<Suspense>`로 감싸더라도 라우트 전체가 동적으로 남는다(PPR은 `cacheComponents` 없이는 동작하지 않는다). 즉 정적 생성을 이루려면 페이지 컴포넌트에서 `cookies()` 호출 자체를 완전히 제거해야 하고, 그 방법은 진도 조회를 별도 Route Handler로 옮겨 클라이언트에서 fetch하는 것이다. 둘째, 홈·`/curriculum`·`/schedule` 세 라우트는 쿠키와 무관하게 **오늘 날짜(`todayInSeoul()` = `new Date()`)에도 의존한다** — 이 사실이 로드맵 원문에는 없다. 쿠키 접근만 제거하고 그대로 정적 생성하면 "오늘의 학습"이 배포 시점에 얼려진다. 이 두 라우트군은 다른 처방이 필요하다.

세 번째로 중요한 발견은 기존 자동 게이트 `scripts/check-progress-gates.mjs`의 **G9**이 정확히 이 5개 라우트에 `force-dynamic` 선언이 있는지를 검사한다는 것이다 — 이 phase가 정적 생성으로 전환하면 G9은 반드시 실패하며, 이는 phase의 계획에 포함되어야 하는 필수 작업이지 우발적 회귀가 아니다.

**Primary recommendation:** `cacheComponents`를 켜지 않는다(전역 동작 변경 폭이 크고 타임박스에 맞지 않음). 대신 (a) `/lesson/[lessonId]`·`/step/[stepId]`는 쿠키/진도 조회를 페이지에서 완전히 제거하고 완전 정적으로 전환, (b) `/`·`/curriculum`·`/schedule`은 같은 방식으로 쿠키를 제거하되 날짜 의존 콘텐츠를 위해 `export const revalidate = 3600`(ISR) 추가, (c) 진도/잠금 상태는 새 Route Handler(`GET /api/progress`) 하나로 통합해 클라이언트 컴포넌트가 마운트 후 fetch — 이 fetch 대기 구간이 정확히 design-taste-frontend 4.5절이 요구하는 스켈레톤의 자리다.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 레슨/Step/커리큘럼/일정표/홈 정적 셸(제목·본문·배지·D-day 골격) | Frontend Server (Next.js prerender) | CDN/Static (Vercel 엣지 캐시) | 콘텐츠는 git 커밋 시점에만 바뀐다 — Velite 매니페스트가 빌드 타임 산출물이므로 요청마다 다시 계산할 이유가 없다 |
| 오늘 날짜 기반 콘텐츠(D-day, 오늘 배정 레슨, 일정표 오늘 행) | Frontend Server (ISR `revalidate`) | — | 쿠키와 무관하지만 시간에 의존한다 — 순수 정적이면 배포 시점에 얼어붙는다(이 리서치의 핵심 발견) |
| 잠금 쿠키 판정 + 완료 진도 조회 | API/Backend (신규 Route Handler) | Browser/Client (마운트 후 fetch) | `cookies()` 접근이 라우트를 동적으로 만드는 유일한 원인이므로, 이 접근을 정적 셸에서 완전히 분리해 별도 엔드포인트로 격리해야 셸이 정적일 수 있다 |
| 완료 토글 쓰기(`toggleLessonComplete`) | API/Backend (기존 Server Action) | Database (Supabase `progress` 테이블) | 이미 올바른 티어 — 변경 없음. 이 phase가 건드릴 이유가 없다 |
| 폰트 파일 서빙 | CDN/Static (Vercel 정적 자산) | — | `next/font/local`이 빌드 타임에 자체 호스팅 — 이미 올바른 티어, 서브셋만 필요 |
| 눌림 피드백·스켈레톤·빈/에러 상태·prefers-reduced-motion | Browser/Client (CSS 전용) | — | 서버 왕복이 필요 없는 순수 시각 상태 — JS 없이 `:active`/`@media`로 충분 |
| Section Tape 현재 구간 추적(기존, 이 phase가 재검토) | Browser/Client (현재: `window.addEventListener("scroll")`) | — | 현재 구현이 design-taste-frontend 5.D가 명시적으로 금지하는 패턴을 이미 쓰고 있다 — Common Pitfalls 참고 |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.3.2(이미 설치됨) | 정적/ISR 라우트 전환 | 신규 채택 아님 — 기존 스택. `cacheComponents` 미활성 상태의 "이전 캐싱 모델" API(`dynamic`, `revalidate`)를 그대로 쓴다 [VERIFIED: node_modules/next/dist/next.config.ts는 cacheComponents를 설정하지 않음(next.config.ts 전체 읽음, `cacheComponents` 키 없음)] |
| `@playwright/test` | 1.62.1(이미 devDependency) | 신규 성능 게이트의 실행 엔진 | 신규 채택 아님 — `scripts/e2e-mobile-overflow.mjs` 등 기존 6개 e2e 게이트가 이미 이 패키지로 Chromium을 구동한다 [VERIFIED: package.json devDependencies, scripts/e2e-mobile-overflow.mjs 헤더] |
| `subset-font` | 2.5.0([VERIFIED: npm registry — `npm view subset-font versions` 최신 tag]) | Pretendard 서브셋 생성(빌드 타임 1회 스크립트) | HarfBuzz WASM 기반 순수 JS 구현이라 Python/fontTools 설치가 필요 없다 — 이 Windows 개발 환경에는 `python3`가 Microsoft Store 스텁뿐이고 실제 Python이 설치되어 있지 않음을 직접 확인했다(`python3 --version` → exit code 49, "Python"만 출력) [VERIFIED: 이 세션에서 `python3 --version`, `pip show fonttools` 직접 실행 — 둘 다 실패] |

### Supporting

신규 supporting 라이브러리 없음 — 이 phase는 CSS-only 인터랙션(design-taste-frontend 4.5/6절)과 두 개의 신규 devDependency 없는(또는 `subset-font` 하나뿐인) 게이트 스크립트로 충분하다.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `subset-font`(WASM, 의존성 4개, unpacked 22KB) | `glyphhanger` | glyphhanger는 `jsdom`·`@zachleat/spider-pig`(퍼펫티어 계열) 등 훨씬 무거운 의존 트리를 끌고 온다 [VERIFIED: `npm view glyphhanger dependencies` 직접 조회] — 이 프로젝트의 "새 패키지 없이" 원칙과 어긋난다 |
| `subset-font` | Pretendard 공식 GitHub의 `woff2-dynamic-subset`(92개로 쪼갠 동적 서브셋) | 이 배포 형태는 "자주 쓰는 글자 그룹별로 필요한 조각만 런타임에 로드"하는 방식으로, `next/font/local`의 단일 `localFont()` 호출 구조와 맞지 않는다(로더 스크립트가 별도로 필요) — 이 프로젝트 규모(레슨 35편, 고정 문자 집합)에는 과설계 [CITED: WebSearch, orioncactus/pretendard GitHub — 직접 fetch로 재확인하지 않았으므로 Assumptions Log에 등재] |
| `cacheComponents: true` + `<Suspense>` 기반 진도 스트리밍(Next.js가 이 정확한 문제를 위해 설계한 공식 마이그레이션 경로) | "이전 캐싱 모델" + 클라이언트 fetch Route Handler(이 리서치의 권장안) | `cacheComponents`는 React `<Activity>` 기반 네비게이션 상태 보존, `generateStaticParams` 빈 배열 금지, `dynamicParams` 동작 변경 등 **전역** 동작을 바꾼다 — `module-accordion.tsx`(네이티브 `<details open>`), `theme-toggle.tsx`, `lesson-notepad.tsx` 같은 기존 클라이언트 상태 컴포넌트가 새로운 상태 보존 동작 아래서 어떻게 행동하는지 검증되지 않았다. 5주 타임박스의 8번째(사실상 마지막) phase에서 앱 전역 렌더링 모델을 바꾸는 것은 위험 대비 효익이 낮다고 판단했다 — Open Questions에 재론 여지를 남긴다 |

**Installation:**
```bash
npm install --save-dev subset-font
```

**Version verification:** `npm view subset-font version` → `2.5.0`, 저장소 `git+https://github.com/papandreou/subset-font.git`, 주간 다운로드 206,594건, `postinstall` 스크립트 없음 [VERIFIED: 이 세션에서 package-legitimacy 검사 도구로 직접 조회, verdict `OK`].

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `subset-font` | npm | 배포일 2026-04-02(최신 2.5.0) [VERIFIED: package-legitimacy 검사 도구 `publishedAt`] | 206,594/주 | github.com/papandreou/subset-font | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                          ┌─────────────────────────────────────────┐
                          │   빌드 타임 (git push → Vercel build)     │
                          │   Velite: MDX → lessons.json/modules.json│
                          │   subset-font: PretendardVariable.woff2  │
                          │     → PretendardVariable.subset.woff2    │
                          └───────────────┬───────────────────────────┘
                                          │ 정적 HTML/CSS/폰트 산출
                                          ▼
  브라우저 첫 요청 ──▶ Vercel 엣지 캐시(icn1) ──▶ 정적 셸 HTML 즉시 응답
  (/lesson/[id], /step/[id]:                    (~40ms 목표, force-dynamic 없음)
   순수 정적 / 홈·curriculum·schedule:
   ISR revalidate=3600)
                                          │
                                          │ 셸에 포함된 <ProgressIsland> 클라이언트 컴포넌트가
                                          │ 마운트 직후 fetch (스켈레톤 표시 중)
                                          ▼
                          GET /api/progress?lesson=...  (신규 Route Handler)
                                          │
                          ┌───────────────┴───────────────┐
                          │ hasUnlockCookie() 먼저 호출      │  ← 기존 게이트 순서 그대로 재사용
                          │ (cookies() 여기서만 호출됨 —      │
                          │  이 호출이 이 핸들러만 동적으로 만듦, │
                          │  셸에는 전파되지 않음)             │
                          └───────────────┬───────────────┘
                                          ▼
                          readCompletedLessonIds()(기존, 변경 없음)
                                          │
                                          ▼ JSON { unlocked, completedIds | null }
                          클라이언트가 완료 버튼/잠금 문구/진행률 바를 채운다
                                          │
     완료 토글 클릭 ──▶ 기존 Server Action(toggleLessonComplete, 변경 없음)
                          → hasUnlockCookie() 재검증 → Supabase upsert
                          → 클라이언트가 /api/progress를 다시 fetch(또는 낙관적 갱신 유지)
```

### Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── progress/
│   │       └── route.ts          # 신규 — hasUnlockCookie() + readCompletedLessonIds() 단일 진입점
│   ├── page.tsx                  # force-dynamic 제거, revalidate=3600 추가, 쿠키 호출 제거
│   ├── curriculum/page.tsx       # 동일
│   ├── schedule/page.tsx         # 동일
│   ├── lesson/[lessonId]/page.tsx  # force-dynamic 제거, revalidate 불필요(완전 정적)
│   └── step/[stepId]/page.tsx      # 동일
├── components/
│   ├── progress-island.tsx       # 신규 'use client' — /api/progress fetch + 스켈레톤 + 에러 상태
│   └── skeleton-*.tsx            # 신규 — 레이아웃 모양을 닮은 스켈레톤(design-taste-frontend 4.5)
scripts/
├── subset-font.mjs               # 신규 — 빌드 전 1회 실행, 콘텐츠 전수 스캔 후 서브셋 생성
└── e2e-perf-budget.mjs           # 신규 — next build && next start 기반 TTFB 회귀 게이트
```

### Pattern 1: 쿠키 없는 정적 셸 + Route Handler 진도 아일랜드 (`/lesson`, `/step`)
**What:** 페이지 컴포넌트에서 `hasUnlockCookie()`/`readCompletedLessonIds()` 호출을 완전히 제거한다. 대신 `<ProgressIsland lessonId={lesson.slug} />` 같은 클라이언트 컴포넌트를 렌더하고, 그 컴포넌트가 마운트 후 `fetch('/api/progress?lesson=' + lessonId)`를 부른다.
**When to use:** 날짜에 의존하지 않고 오직 쿠키/진도에만 의존하는 라우트(`/lesson/[lessonId]`, `/step/[stepId]`).
**Why this works in "이전 캐싱 모델":** Next.js 16 공식 마이그레이션 가이드는 "`cookies()`/`headers()`/`searchParams`를 읽으면 그 라우트 전체가 동적 렌더링으로 전환된다"고 명시한다 — 이는 `cacheComponents` 활성화 여부와 무관하게 참이다. 차이는 `cacheComponents`가 켜져 있으면 이 동적 부분을 `<Suspense>`로 감싸 라우트의 나머지는 정적으로 남길 수 있다는 것이고(Partial Prerendering), 꺼져 있으면(이 프로젝트의 현재 상태) `<Suspense>`가 그 분리를 해 주지 않는다 — 동적 API 호출 자체를 라우트 밖(별도 Route Handler)으로 물리적으로 옮겨야 한다.
```ts
// Source: node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md:664-724
// (cacheComponents 활성화 시의 공식 패턴 — 이 프로젝트는 cacheComponents를 켜지 않으므로
// <Suspense>만으로는 부족하다는 근거로 인용. 아래는 이 프로젝트가 실제로 써야 하는 형태.)

// src/app/api/progress/route.ts (신규)
import { NextResponse } from 'next/server';
import { hasUnlockCookie } from '@/lib/auth';
import { readCompletedLessonIds } from '@/lib/progress-store';

export async function GET() {
  const unlocked = await hasUnlockCookie(); // 무조건 먼저 — 기존 페이지들과 동일한 게이트 순서
  if (!unlocked) {
    return NextResponse.json({ unlocked: false, completedIds: null });
  }
  const read = await readCompletedLessonIds();
  if (!read.ok) {
    return NextResponse.json({ unlocked: true, completedIds: null, error: read.error }, { status: 502 });
  }
  return NextResponse.json({ unlocked: true, completedIds: [...read.completedIds] });
}
```
```tsx
// src/app/lesson/[lessonId]/page.tsx (수정 방향 — force-dynamic 없음, cookies() 호출 없음)
export function generateStaticParams() {
  return getOrderedLessons().map((lesson) => ({ lessonId: lesson.slug }));
}
// export const dynamic = "force-dynamic";  ← 제거
export default async function LessonPage(props: PageProps<"/lesson/[lessonId]">) {
  const { lessonId } = await props.params;
  const lesson = getLessonBySlug(lessonId);
  if (!lesson) notFound();
  // hasUnlockCookie()/readCompletedLessonIds() 호출 없음 — 셸은 순수 정적
  return (
    <main>
      {/* ...정적 콘텐츠... */}
      <ProgressIsland lessonId={lesson.slug} />
    </main>
  );
}
```

### Pattern 2: ISR 재검증 (`/`, `/curriculum`, `/schedule`)
**What:** Pattern 1과 동일하게 쿠키 호출을 제거하되, `export const revalidate = 3600;`을 추가한다.
**When to use:** 오늘 날짜(`todayInSeoul()`)에 의존하는 콘텐츠(D-day, 오늘 배정 레슨, 일정표 오늘 행 강조)가 있는 라우트. 이 세 라우트가 여기 해당한다는 것은 로드맵 원문에 없는, 소스를 직접 읽어 확인한 사실이다 [VERIFIED: src/app/page.tsx:32(`todayInSeoul()`), src/app/curriculum/page.tsx:26, src/app/schedule/page.tsx:26 — 세 파일 모두 이 세션에서 Read].
**Why 3600 (1시간):** `revalidate`는 정적으로 분석 가능한 리터럴 숫자여야 한다(`60*10`처럼 계산식 불가) [VERIFIED: node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md:"The revalidate value needs to be statically analyzable"]. "오늘"이 자정(KST)에 바뀌므로 1시간 주기 재검증이면 자정 이후 최대 1시간 이내에 자연 갱신되고, on-demand `revalidatePath('/')` 같은 별도 트리거 없이도 자기 치유한다. 완료 토글은 여전히 `/api/progress`가 매 요청 다시 계산하므로 진도 표시 자체는 캐시 지연의 영향을 받지 않는다.
```ts
// src/app/page.tsx (수정 방향)
export const revalidate = 3600;
// export const dynamic = "force-dynamic";  ← 제거
export default async function Home() {
  // todayInSeoul(), getScheduleRows() 등은 그대로 유지 — 시간 의존 계산이지 쿠키 의존이 아니다
  // hasUnlockCookie()/readCompletedLessonIds() 호출만 제거, <ProgressIsland />로 대체
}
```

### Pattern 3: `:active` 눌림 피드백 — 임의값 대괄호 없이
**What:** design-taste-frontend 4.5절은 `-translate-y-[1px]`/`scale-[0.98]`를 예시로 든다. 그러나 이 프로젝트의 `scripts/check-design-tokens.mjs`는 `/[A-Za-z][A-Za-z0-9:_/-]*-\[/g` 정규식으로 **모든** `word-[...]` 형태의 Tailwind 임의값 대괄호를 파일 경로 전역에서 위반으로 잡는다(색상·타이포에 국한되지 않음) [VERIFIED: scripts/check-design-tokens.mjs:228-247, `findArbitraryValueTokens` 함수 전체를 이 세션에서 Read]. `translate-y-[1px]`를 그대로 쓰면 이 게이트가 실패한다.
**When to use:** 완료 버튼, 카드 링크, CTA 등 탭 가능한 모든 요소.
**대안(권장):** Tailwind 기본 스케일에 정확히 대응하는 논-임의값 유틸리티를 쓴다 — `translate-y-px`(정확히 1px, 대괄호 없이 이미 존재하는 명명된 스텝)와 `scale-95`(0.95, 스킬의 0.98과 시각적으로 동등한 효과)의 조합이면 게이트를 건드리지 않고 동일한 "물리적 눌림" 효과를 낸다.
```tsx
// complete-button.tsx 등 기존 버튼 클래스에 추가하는 방향 — 임의값 없음, check-design-tokens.mjs 통과
className="... active:translate-y-px active:scale-95 transition-transform duration-100"
```
만약 정확히 스킬 원문의 `scale-[0.98]` 수치가 필요하다고 판단되면, `scripts/check-design-tokens.mjs`의 `ARBITRARY_ALLOWLIST_TOKENS`(파일 경로 + 정확한 토큰 문자열로 좁게 등록하는 기존 패턴, `about/page.tsx`에 이미 2건 선례가 있다)에 추가하는 것이 이 코드베이스의 기존 관례다 [VERIFIED: scripts/check-design-tokens.mjs:64-67].

### Pattern 4: 레이아웃 모양을 닮은 스켈레톤
**What:** `/api/progress` fetch가 완료되기 전까지 완료 버튼/잠금 문구/진행률 바 자리에 최종 레이아웃과 같은 크기의 회색 블록을 렌더한다. 스피너 금지(design-taste-frontend 4.5절).
**Why now:** Pattern 1·2가 진도 표시를 클라이언트 fetch로 옮기면서 "첫 페인트에는 진도가 없다가 잠시 후 나타나는" 구간이 새로 생긴다 — 이 phase가 성능 전환을 하지 않았다면 필요 없었을 스켈레톤이, 정적 전환의 직접적 결과로 필요해진다. 완료 버튼(`complete-button.tsx`)의 `min-h-11` 클래스와 정확히 같은 높이의 스켈레톤을 쓰면 레이아웃 시프트가 없다.
```tsx
// 스켈레톤은 실제 컴포넌트와 같은 태그/높이 클래스를 공유해야 CLS가 발생하지 않는다
function CompleteButtonSkeleton() {
  return (
    <div
      className="flex min-h-11 items-center justify-center rounded-lg border border-badge-neutral-bg dark:border-badge-neutral-bg-dark animate-pulse bg-badge-neutral-bg/50 dark:bg-badge-neutral-bg-dark/50"
      aria-hidden="true"
    />
  );
}
```
`animate-pulse`는 Tailwind 내장 유틸리티(임의값 아님, 게이트 안전) — 단, `prefers-reduced-motion: reduce`에서는 펄스도 꺼야 한다(6.B). globals.css에 이미 확립된 패턴을 그대로 따른다: `.complete-check-icon`/`.complete-ring-glow`가 `@media (prefers-reduced-motion: reduce)` 블록에서 `animation: none`으로 꺼지는 것과 동일한 형태로 스켈레톤 펄스도 꺼야 한다 [VERIFIED: src/app/globals.css:554-559, 이 세션에서 Read].

### Pattern 5: `prefers-reduced-motion` — 이미 확립된 프로젝트 관례를 그대로 확장
이 코드베이스는 이미 `@media (prefers-reduced-motion: reduce)` 패턴을 두 곳에서 쓰고 있다: `.note-sheet-panel`(메모장 시트 전환)과 `.complete-check-icon`/`.complete-ring-glow::after`(완료 애니메이션) [VERIFIED: src/app/globals.css:198-202, 554-559]. 이 phase가 추가하는 모든 신규 애니메이션(스켈레톤 펄스, 순차 등장, 눌림 트랜지션)은 같은 파일의 같은 패턴을 재사용해야 한다 — 새 전략을 만들 필요가 없다.

### Pattern 6: 5.A~5.C 중 이 프로젝트에 맞는 것만 선별
| 패턴 | 이 프로젝트 적용 여부 | 근거 |
|------|----------------------|------|
| 5.A Sticky-Stack | **제외** | 스킬 원문 스켈레톤이 GSAP+`ScrollTrigger`를 전제한다 — ROADMAP은 GSAP을 언급조차 하지 않았고, 학습 대시보드에 카드가 겹쳐 쌓이는 연출은 콘텐츠 탐색을 방해한다(스킬 자체가 "대시보드·다단계 제품 UI는 아님"이라 명시) |
| 5.B Horizontal-Pan | **제외** | 같은 이유 — 스크롤 하이재킹은 이 사이트의 핵심 흐름(레슨 읽기)과 상충한다 |
| 5.C Scroll-Reveal Stagger | **부분 적용, CSS로 대체** | 스킬 원문 스켈레톤은 `motion/react`(Motion 라이브러리)를 전제하지만, ROADMAP의 "CSS로 되는 것을 먼저" 원칙에 따라 Motion 없이 CSS `animation-delay` cascade로 같은 효과를 낸다. 적용 후보: 홈 대시보드 최초 진입 시 Step 카드 3장, `/curriculum` Step 카드 — 목록형 카드가 순서대로 나타나는 정도로 범위를 좁힌다 |

```css
/* CSS 전용 순차 등장 — Motion 라이브러리 불필요.
   기존 globals.css의 keyframes/@media (prefers-reduced-motion: reduce) 패턴을 그대로 따른다. */
@keyframes card-reveal {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.step-card-reveal {
  animation: card-reveal 400ms ease-out backwards;
  animation-delay: calc(var(--reveal-index, 0) * 80ms);
}
@media (prefers-reduced-motion: reduce) {
  .step-card-reveal { animation: none; }
}
```
`--reveal-index`는 `style={{ '--reveal-index': index }}`로 각 카드에 인라인 전달 — `staggerChildren`이 요구하는 클라이언트 컴포넌트 트리 공유가 필요 없다(서버 컴포넌트에서도 동작).

### Anti-Patterns to Avoid
- **`instant = false` route segment config를 이 프로젝트에서 사용:** 이 config는 `cacheComponents`가 켜져 있을 때만 의미가 있다 [VERIFIED: node_modules/next/dist/docs 마이그레이션 가이드, `instant` 관련 절 전체가 "Cache Components" 맥락에서만 등장]. `cacheComponents`를 켜지 않기로 했으므로 이 config는 이 phase에서 아무 효과가 없다 — 혼동하지 말 것.
- **`revalidate = 60 * 60`처럼 계산식으로 작성:** 정적 분석 요구사항을 위반해 빌드 에러가 난다. 반드시 리터럴 `3600`.
- **Route Handler에서 쿠키 값을 로그에 남기는 것:** 기존 `/unlock/route.ts`가 이미 "응답·로그 어디에도 key 값이나 시크릿을 남기지 않는다"는 원칙을 지킨다 [VERIFIED: src/app/unlock/route.ts:1-7] — 신규 `/api/progress`도 동일 원칙을 따라야 한다.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TTFB 측정 | 커스텀 타이밍 로직을 서버 미들웨어에 삽입 | 브라우저 Navigation Timing API(`performance.getEntriesByType('navigation')[0].responseStart`)를 Playwright `page.evaluate()`로 읽기 | 표준 브라우저 API가 이미 정확한 TTFB를 제공한다 — 서버 측 계측을 새로 만들 필요가 없고, 이미 이 프로젝트가 프로덕션에서 curl 기반으로 측정한 방법론(ROADMAP "이미 해결된 것" 절의 238ms→68ms 수치)과 같은 종류의 측정을 로컬 게이트에서도 재현할 수 있다 |
| Section Tape 스크롤 추적 재작성 | 처음부터 새 스크롤 감지 메커니즘 설계 | 기존 `handleScroll`을 `requestAnimationFrame` 스로틀로 감싸고 `setCurrentIndex` 호출 전 변경 여부를 비교(Common Pitfalls 참고) | 문제는 메커니즘 자체(스크롤 위치로 "현재 구간"을 판정하는 것)가 아니라 스로틀 부재다 — 전면 재작성은 과함 |
| 폰트 서브셋 문자 목록 수동 작성 | 레슨 MDX 35편의 실제 사용 문자를 손으로 나열 | `scripts/subset-font.mjs`가 `src/content/lessons/**/*.mdx` + `src/**/*.tsx`를 전수 스캔해 유니크 문자 집합을 자동 추출 | 수동 목록은 레슨이 추가/수정될 때마다 어긋난다 — 이 코드베이스의 기존 관례(`e2e-mobile-overflow.mjs`가 `.velite/lessons.json`을 코드로 재파싱하는 것과 같은 원칙, 앱 코드를 import하지 않고 소스를 직접 스캔)를 그대로 따른다 |

**Key insight:** 이 phase의 신규 코드는 전부 "이미 있는 표준 API/브라우저 기능을 이 프로젝트의 기존 관례(파일 직접 스캔, `prefers-reduced-motion` 패턴, 게이트 스크립트 형태)에 맞춰 배선"하는 것이지, 새로운 메커니즘을 발명하는 것이 아니다.

## Common Pitfalls

### Pitfall 1: G9 게이트가 정적 전환과 정면으로 충돌한다
**What goes wrong:** `scripts/check-progress-gates.mjs`의 G9은 정확히 이 5개 파일에 `export const dynamic = "force-dynamic"`이 있는지를 정규식으로 검사한다 [VERIFIED: scripts/check-progress-gates.mjs:245-265, 다음을 그대로 인용 — `if (!/export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/.test(source)) { fail(...) }`, 대상 파일 목록(같은 파일 248-254행): `src/app/lesson/[lessonId]/page.tsx`, `src/app/step/[stepId]/page.tsx`, `src/app/page.tsx`, `src/app/curriculum/page.tsx`, `src/app/schedule/page.tsx`]. 이 phase가 이 선언을 제거하면 G9은 반드시 실패한다.
**Why it happens:** G9은 Phase 2~3에서 "조건부 쿠키 접근이 캐시된 응답을 내보내는 문제(Pitfall 4)"를 막기 위한 방어선으로 추가됐다 — 이 phase가 정적 전환으로 그 위험 자체를 없애므로(쿠키 접근을 페이지에서 완전히 제거) G9의 전제가 바뀐다.
**How to avoid:** 정적 전환 작업과 G9 갱신을 같은 wave/plan에 묶는다. 새 G9은 "이 5개 페이지에 `cookies()`/`hasUnlockCookie` 직접 호출이 없다"와 "`/api/progress/route.ts`가 존재하고 `hasUnlockCookie()`를 `readCompletedLessonIds()`보다 먼저 호출한다"(G4가 이미 Server Action에 대해 쓰는 것과 같은 "호출 순서를 문자 위치로 고정" 기법 [VERIFIED: scripts/check-progress-gates.mjs:131-155, G4 로직])는 형태로 다시 쓰는 것을 권한다.
**Warning signs:** `npm run` 게이트 스위트를 돌리기 전까지는 이 충돌이 드러나지 않는다 —계획 단계에서 미리 반영하지 않으면 실행 중간에 "왜 기존 게이트가 깨지는가"로 시간을 뺏긴다.

### Pitfall 2: 홈·커리큘럼·일정표를 "쿠키만 빼면 정적"이라고 오해하기
**What goes wrong:** ROADMAP 원문은 진도만 언급하지만, 세 라우트 모두 `todayInSeoul()`(`new Date()` 기반)을 호출해 D-day·오늘 배정 레슨·일정표 오늘 행을 계산한다 [VERIFIED: src/app/page.tsx:32, src/app/curriculum/page.tsx:26, src/app/schedule/page.tsx:26]. 쿠키 호출만 제거하고 `revalidate`를 붙이지 않으면, Next.js는 이 페이지를 빌드 시점에 딱 한 번 정적 생성하고 "오늘"이 배포할 때까지 얼어붙는다 — 이 사이트가 매일 배포되지 않는 한(그렇지 않다) 사용자는 항상 배포 당일의 "오늘"을 보게 된다.
**Why it happens:** "이전 캐싱 모델"에서 정적 생성 여부는 동적 API(`cookies`/`headers`/`searchParams`) 사용 여부로만 판정된다 — `new Date()` 같은 순수 JS 호출은 이 판정에 관여하지 않는다 [VERIFIED: node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md, dynamic config 절 전체].
**How to avoid:** Pattern 2(`revalidate = 3600`)를 이 세 라우트에 반드시 적용한다. `/lesson/[lessonId]`·`/step/[stepId]`는 날짜 의존이 없으므로 `revalidate` 없이 완전 정적으로 둔다 — 두 그룹을 같은 방식으로 처리하면 안 된다.
**Warning signs:** 프리뷰 배포 후 자정을 넘겨도 홈 화면의 D-day/오늘 레슨이 바뀌지 않는다.

### Pitfall 3: Section Tape가 이미 design-taste-frontend 5.D가 금지하는 패턴을 쓰고 있다
**What goes wrong:** `section-tape.tsx`의 `handleScroll`이 스로틀 없이 매 스크롤 이벤트마다 `updateCurrent()`를 호출하고, `updateCurrent()`는 모든 `<h2>`에 `getBoundingClientRect()`(레이아웃 강제 리플로우)를 부른 뒤 `setCurrentIndex()`(리렌더)를 호출한다 [VERIFIED: src/components/section-tape.tsx:112-153, `window.addEventListener("scroll", handleScroll, { passive: true })`가 148-149행, `handleScroll = () => updateCurrent()`가 148행, `updateCurrent` 내부의 `headings[i].getBoundingClientRect()` 루프가 128-133행]. 이는 정확히 design-taste-frontend 5.D가 "매 스크롤 프레임마다 실행되고 배칭이 없다"며 금지하는 패턴이다.
**Why it happens:** Phase 6(06-09)에서 신설된 컴포넌트로, 당시엔 이 phase의 인터랙션 방침(5.D)이 아직 확정되지 않았다.
**How to avoid:** `handleScroll`을 `requestAnimationFrame`으로 스로틀하고(같은 프레임 내 중복 스케줄 방지), `setCurrentIndex`는 `idx`가 실제로 바뀔 때만 호출하도록 가드를 추가한다. `IntersectionObserver`로 완전히 재작성하는 것도 고려할 수 있으나, 이미 `scroll-margin-top` 임계값과 정확히 일치해야 하는 정밀도 요구(G-06-9 재발 방지 조항)가 있어 재작성 리스크가 스로틀 추가보다 크다 — Don't Hand-Roll 절 참고.
**Warning signs:** 이 phase가 신설하는 60fps 게이트를 레슨 페이지(Section Tape가 활성인 유일한 라우트)에서 돌렸을 때 가장 먼저 걸릴 가능성이 높은 후보다 — "새 인터랙션을 추가하기 전에 기존 코드부터 측정하라"는 의미에서 이 phase의 진짜 첫 작업일 수 있다.

### Pitfall 4: 375px 일정표 행에서 레슨 제목에 남는 폭이 매우 좁다
**What goes wrong:** `/schedule` 행 레이아웃을 375px 뷰포트 기준으로 계산하면(`<main>` `px-4`=32px, `<Link>` `px-2`=16px, `gap-3` 두 번=24px, 날짜 칸 "YYYY-MM-DD" 고정폭 약 75px, 배지+소요시간 고정 그리드 `64px+88px+gap-2(8px)`=160px [VERIFIED: src/components/schedule-table.tsx:81, `style={{ gridTemplateColumns: "64px 88px" }}`]), 레슨 제목에 남는 폭은 `375 - 32 - 16 - 24 - 75 - 160 ≈ 68px`이다. "SQL 쿼리·JOIN·집계"처럼 긴 제목은 이 폭에서 여러 줄로 심하게 꺾인다.
**Why it happens:** 이 고정폭 그리드는 Phase 3(03-04-PLAN.md)이 "소요시간 문구 길이가 주차마다 달라 배지 시작 위치가 흔들리는" 정렬 결함을 막기 위해 의도적으로 도입한 것이다 [VERIFIED: src/components/schedule-table.tsx:70-80 주석]. 정렬 정확성과 375px 가용 폭이 서로 상충하는 요구다.
**How to avoid:** `e2e-mobile-overflow.mjs`는 가로 오버플로(0건)만 보장하지 "제목이 몇 줄로 꺾이는가"는 측정하지 않는다 — 이 phase가 SC3("좁아서 참고 쓰는 게 아니라 실제로 편하게 읽힌다")을 검증하려면 375px에서 실제 레슨 제목 35개를 렌더해 최대 줄 수를 측정하는 새로운 확인이 필요하다(자동 게이트 또는 실기기 UAT). 해결책 후보: 375px 전용으로 배지+소요시간 그리드를 제목 아래 별도 행으로 내리는 반응형 분기, 또는 배지를 아이콘으로 축약.
**Warning signs:** 실측 없이 "오버플로 게이트가 통과하니 문제없다"고 판단하는 것 — 오버플로 부재와 가독성은 별개다(로드맵 원문이 명시적으로 구분한 지점).

### Pitfall 5: `revalidatePath` 호출이 더 이상 필요한 일을 하지 않을 수 있다
**What goes wrong:** `actions.ts`의 `toggleLessonComplete`가 `revalidatePath('/lesson/${lessonId}')`, `revalidatePath('/step/[stepId]', 'page')`, `revalidatePath('/')`를 호출한다 [VERIFIED: src/app/lesson/[lessonId]/actions.ts:27-29]. Pattern 1·2 적용 후에는 이 세 라우트의 정적 셸에 진도 데이터가 더 이상 없다(전부 `/api/progress`로 옮겨감) — `revalidatePath`가 무효화하는 대상(정적 셸)에는 애초에 무효화할 진도 데이터가 없으므로 이 호출들의 실효성이 사라질 수 있다.
**Why it happens:** 이 호출들은 "페이지 자체가 진도를 담고 있던" 이전 아키텍처를 전제로 작성됐다.
**How to avoid:** 정적 전환 plan에서 이 호출들을 그대로 둘지 제거할지 명시적으로 결정한다 — 제거해도 안전한지(다른 무효화 목적이 숨어 있지 않은지) `revalidatePath`의 부작용 범위를 계획 단계에서 확인할 것. 성급히 지우기보다 "왜 남기는지/왜 지우는지"를 계획에 기록하는 것이 이 코드베이스의 관례(모든 결정에 근거 주석)와 맞다.
**Warning signs:** 없음(기능적으로는 무해한 no-op에 가까울 가능성이 높다) — 다만 죽은 코드로 남으면 다음 사람이 오해할 수 있다.

## Code Examples

### TTFB 측정 (Navigation Timing API, Playwright)
```js
// Source: 표준 Web API(Navigation Timing Level 2) — Next.js 특정 API 아님.
// 기존 e2e-mobile-overflow.mjs의 page.evaluate() 계측 스타일을 그대로 따른다.
async function measureTTFB(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  return page.evaluate(() => {
    const [nav] = performance.getEntriesByType('navigation');
    return nav.responseStart - nav.requestStart;
  });
}
```

### 60fps 스크롤 측정 (rAF 프레임 델타 수집)
```js
// Playwright로 프로덕션 서버(next build && next start) 대상 실행.
// Chromium CDP 트레이싱 없이도 rAF 델타만으로 "너무 긴 프레임" 비율을 잡을 수 있다 —
// 새 의존성 없음(Playwright에 이미 포함된 page.evaluate만 사용).
async function measureScrollFrameBudget(page, selector) {
  return page.evaluate(async (sel) => {
    const el = document.querySelector(sel) ?? document.scrollingElement;
    const deltas = [];
    let last = performance.now();
    const collect = () => {
      const now = performance.now();
      deltas.push(now - last);
      last = now;
    };
    const raf = () => { collect(); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    el.scrollBy({ top: 2000, behavior: 'smooth' });
    await new Promise((r) => setTimeout(r, 1200));
    const budget = 1000 / 60; // 16.67ms
    const overBudget = deltas.filter((d) => d > budget * 1.5).length; // 25ms 이상 프레임
    return { totalFrames: deltas.length, overBudgetFrames: overBudget, ratio: overBudget / deltas.length };
  }, selector);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `export const dynamic = "auto"` + `experimental_ppr = true`(부분 프리렌더링 실험 플래그) | `cacheComponents: true`(통합 플래그) — 단, 이 프로젝트는 채택하지 않음 | Next.js 16.0.0 [VERIFIED: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md Version History 표] | `experimental_ppr` route segment config는 이 버전에서 완전히 제거됐다 — 이 코드베이스는 애초에 쓴 적이 없으므로 마이그레이션 대상 아님 |
| `unstable_cache`/`unstable_noStore` | `use cache` 디렉티브 + `cacheLife`(cacheComponents 활성 시) | Next.js 16.0.0 | 이 프로젝트는 `unstable_cache`/`unstable_noStore`를 쓰지 않으므로(grep 결과 0건) 영향 없음 |
| `export const dynamic = "force-dynamic"` | 변경 없음(previous model에서 계속 유효) — `cacheComponents` 활성 시에만 "Not needed, just remove it"로 대체됨 | — | 이 프로젝트가 `cacheComponents`를 켜지 않는 한 현재 코드의 5개 `force-dynamic` 선언은 여전히 문법적으로 유효하다 — 다만 이 phase의 목표(정적 생성)와는 상충하므로 제거 대상 |

**Deprecated/outdated:**
- `runtime = 'edge'`: 이 프로젝트는 쓰지 않음(전부 Node.js 런타임 기본값) — 영향 없음.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Pretendard 공식 GitHub 저장소가 "동적 서브셋"(92조각) 형태로만 제공되고 별도의 단일 KR-only 정적 서브셋 릴리스는 없다 | Standard Stack § Alternatives Considered | 실제로 즉시 쓸 수 있는 사전 서브셋 파일이 존재한다면 `subset-font` 자체 실행 없이 파일 교체만으로 끝날 수 있다 — 리서치 시간을 아낄 기회를 놓칠 뿐 correctness에는 영향 없음(WebSearch 소스, 직접 GitHub 페이지를 fetch로 재확인하지 않음) |
| A2 | `cacheComponents` 미활성 채택이 이 phase의 타임박스와 기존 클라이언트 컴포넌트(module-accordion, theme-toggle, lesson-notepad) 안정성 면에서 올바른 선택이다 | Standard Stack § Alternatives Considered, Summary | 이는 리스크 판단이지 사실 검증이 아니다 — discuss-phase 또는 계획 단계에서 사용자에게 명시적으로 확인받아야 하는 아키텍처 결정이다(Open Questions 1번 참고) |
| A3 | `revalidate = 3600`(1시간)이 "오늘의 학습"의 신선도 요구에 충분하다 | Architecture Patterns Pattern 2 | 사용자가 자정 직후 정각에 접속해 최대 1시간까지 "어제"를 볼 수 있다 — SCHED-02(오늘의 학습이 기본 랜딩)의 체감 정확도에 영향. 더 짧은 값(예: 900초)이나 on-demand `revalidatePath` 조합으로 조정 가능 |
| A4 | 375px 일정표 행의 "레슨 제목 약 68px" 계산은 CSS 박스 모델 산술이며, 실제 폰트 렌더링(자간·최소 글자폭)까지 반영한 것은 아니다 | Common Pitfalls 4 | 실제 여유폭이 이 추정과 몇 px 다를 수 있다 — 결론(폭이 매우 좁다)의 방향성은 바뀌지 않지만 정확한 줄바꿈 횟수는 실기기/Playwright 스크린샷으로 확인 필요 |

## Open Questions

1. **`cacheComponents`를 이 phase에서 채택할 것인가, 아니면 미래로 미룰 것인가?**
   - What we know: 이 정확한 문제(정적 셸 + 쿠키 의존 부분만 동적)를 위해 Next.js 16이 공식적으로 설계한 기능이고, 이 프로젝트의 `generateStaticParams`(레슨/Step 모두 비어있지 않은 배열 반환)는 이미 새 요구사항을 충족한다.
   - What's unclear: `<Activity>` 기반 네비게이션 상태 보존이 `module-accordion.tsx`(네이티브 `<details open>`)·`lesson-notepad.tsx`(열림/닫힘 상태)·`theme-toggle.tsx`에 어떤 실사용 영향을 주는지는 코드만 읽어서는 판단할 수 없다 — 실제로 켜서 아이패드 UAT를 해봐야 안다.
   - Recommendation: 이 phase는 미채택(이 리서치의 권장 아키텍처)으로 시작하고, discuss-phase에서 사용자에게 "지금 도입 vs 다음 milestone으로 미룸"을 명시적으로 확인받는다. 미룰 경우 PROJECT.md Deferred/Backlog에 "cacheComponents 마이그레이션"을 명시적으로 남길 것을 권한다.

2. **폰트 전송량 감소가 "가치 있다"고 판단할 구체적 임계값은 무엇인가?**
   - What we know: 현재 2.0MB(비압축 woff2 파일 크기, [VERIFIED: `ls -la public/fonts/` 이 세션에서 직접 확인, 2,057,688 bytes]). 서브셋 시 통상 200~400KB(ROADMAP 원문 기대치, 리서치가 직접 검증한 수치는 아님).
   - What's unclear: "줄일 가치가 있다"의 기준선이 로드맵에 없다.
   - Recommendation: 첫 방문(콜드 캐시) 총 전송 바이트 대비 폰트가 차지하는 비중이 30% 이상이거나 폰트 단독 500KB 이상이면 서브셋을 진행하고, 서브셋 후 400KB 이하를 목표치로 삼는다 — 계획 단계에서 사용자 확인을 받을 것(이 수치는 이 리서치가 제안하는 것이지 사용자가 확정한 것이 아니다).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | 모든 게이트 스크립트, `subset-font` 실행 | ✓ | 프로젝트 기존 요구사항(Node 22.6+, 타입 스트리핑 사용 중 — 기존 게이트 주석에서 확인) | — |
| `@playwright/test`(Chromium) | 신규 TTFB/60fps 게이트 | ✓ | 1.62.1 [VERIFIED: `npx playwright --version`] | — |
| Python 3 / `fonttools`(`pyftsubset`) | (검토했으나 미채택) 대안 서브셋 툴체인 | ✗ | — | `subset-font`(WASM, Python 불필요)로 완전 대체 — 이 세션에서 `python3 --version`(exit 49, Microsoft Store 스텁) 및 `pip show fonttools`(not found) 둘 다 직접 확인 |
| `subset-font`(npm) | 폰트 서브셋 스크립트 | ✗(설치 필요) | 최신 2.5.0 | 설치 실패 시 서브셋 없이 SC2를 "측정만 하고 줄이지 않음, 근거 기록"으로 충족 가능(로드맵 원문이 이 선택지를 명시적으로 허용: "있을 때만 손댄다") |

**Missing dependencies with no fallback:** 없음.
**Missing dependencies with fallback:** `subset-font`(미설치, `npm install` 한 줄로 해결).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | 프로젝트 자체 Node 스크립트 하네스(`check-*.mjs`/`e2e-*.mjs`, 외부 테스트 러너 없음) + Playwright(Chromium) — 신규 프레임워크 도입 없음 |
| Config file | 없음 — 각 게이트가 독립 실행 가능한 `.mjs` 스크립트(package.json에 `scripts` 등록 없이 `node scripts/xxx.mjs`로 직접 실행하는 기존 관례) |
| Quick run command | `node scripts/check-design-tokens.mjs` 등 개별 정적 게이트(수 초) |
| Full suite command | 기존 10개 `check-*.mjs` + 6개 `e2e-*.mjs`를 순서대로 실행(README/AGENTS 문서에 일괄 스크립트가 없다면 이 phase가 하나 추가하는 것을 고려할 만하다 — Open Question은 아니지만 계획 단계 판단 사항) |

### Phase Requirement(SC1~SC5) → Test Map

| SC | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|-------------|
| SC1 | 콘텐츠 페이지 TTFB가 정적 라우트 수준(로컬 상대 비교), 진도 정확성 유지 | e2e(Playwright, 프로덕션 빌드) | `node scripts/e2e-perf-budget.mjs`(신규) | ❌ Wave 0 |
| SC2 | 첫 방문 폰트 전송량 측정 + 근거 기록 | e2e(Playwright 네트워크 캡처) | `node scripts/e2e-perf-budget.mjs`(같은 스크립트에 통합 가능) 또는 별도 `scripts/measure-font-transfer.mjs` | ❌ Wave 0 |
| SC3 | 375px 6종 화면 가독성(제목 줄바꿈 수 등 정량화) | e2e(Playwright, 스크린샷+DOM 측정) | 기존 `e2e-mobile-overflow.mjs`를 확장하거나 신규 `e2e-mobile-readability.mjs` | ❌ Wave 0(기존 파일 확장 여지 있음) |
| SC4 | 기존 게이트 16종 + 신규 회귀 게이트 1개 전부 통과 | 정적+e2e 전체 스위트 | 개별 스크립트 순차 실행 | ✅(기존 16개 이미 존재, 1개만 신규) |
| SC5 | 눌림 피드백·스켈레톤·빈/에러 상태 존재, 아이패드 스크롤 60fps | e2e(Playwright, DOM 클래스 검사 + 프레임 타이밍) | SC1과 같은 신규 스크립트에 프레임 예산 측정 포함 | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** 정적 게이트(`check-design-tokens.mjs` 등, 수 초) — 임의값 대괄호 오용을 즉시 잡는다.
- **Per wave merge:** `next build && node scripts/e2e-perf-budget.mjs`(프로덕션 서버 필요, 기존 dev 서버 기반 e2e 게이트보다 오래 걸림 — 이 점이 새 게이트의 하네스가 기존 6개와 다른 이유다).
- **Phase gate:** 전체 16+1개 게이트 green 후 `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `scripts/e2e-perf-budget.mjs` — TTFB 상대 비교(정적 `/about` 대비 각 라우트) + 폰트 전송 바이트 캡처 + 60fps 프레임 예산 측정을 한 스크립트에 통합할지, 세 개로 분리할지는 계획 단계 판단. 이 스크립트는 `next dev`가 아니라 `next build && next start`를 부트스트랩해야 한다(기존 `e2e-mobile-overflow.mjs`의 dev 서버 패턴을 그대로 복제하면 TTFB가 의미 없어진다 — dev 서버는 온디맨드 컴파일 때문에 프로덕션과 근본적으로 다른 타이밍을 낸다).
- [ ] `scripts/subset-font.mjs` — 콘텐츠 전수 스캔 + `subset-font` 호출 + `public/fonts/PretendardVariable.subset.woff2` 산출. 게이트라기보다 빌드 준비 스크립트이지만, "서브셋 파일이 실제로 모든 필요한 문자를 포함하는가"를 검증하는 별도의 작은 정적 게이트(전체 레슨 텍스트의 유니크 문자 집합이 서브셋 폰트의 cmap에 다 있는지)를 함께 두는 것을 권한다 — 서브셋 시 글리프 누락은 배포 후에야 눈에 띄는 조용한 결함이기 때문이다.
- [ ] `scripts/check-progress-gates.mjs`의 G9 — Pitfall 1에서 설명한 대로 갱신 필수(신규 파일은 아니지만 이 phase가 반드시 수정해야 하는 기존 파일).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | 아니오 | 이 phase는 인증 방식(공유 시크릿 쿠키)을 바꾸지 않는다 |
| V3 Session Management | 예 | 신규 `/api/progress` Route Handler가 기존 `hasUnlockCookie()`를 그대로 재사용해야 한다 — 새로운 검증 로직을 만들지 않는다(Don't Hand-Roll 원칙과 동일한 이유) |
| V4 Access Control | 예 | Route Handler가 `hasUnlockCookie()`를 `readCompletedLessonIds()`보다 먼저 호출하는 순서를 지켜야 한다 — 기존 Server Action의 G4 검증과 동일한 순서 계약이 신규 엔드포인트에도 적용되어야 한다 |
| V5 Input Validation | 예 | `/api/progress`가 쿼리 파라미터(예: `lesson=`)를 받는다면 `getLessonBySlug()`로 매니페스트 존재 여부를 검증한 뒤에만 사용 — 기존 Server Action의 "invalid lesson" 방어(actions.ts:23-26)와 동일한 패턴 |
| V6 Cryptography | 아니오 | 이 phase는 시크릿 비교 로직(`isValidUnlockValue`)을 건드리지 않는다 |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `/api/progress`를 잠금 쿠키 없이 직접 호출해 완료 진도 유무를 추론(정보 노출) | Information Disclosure | 이미 `hasUnlockCookie()`가 `false`일 때 `completedIds: null`만 반환하도록 설계됨(Pattern 1 코드 예시) — 완료 여부를 담은 실제 데이터는 쿠키 없이 절대 응답에 포함되지 않아야 한다 |
| 신규 Route Handler가 캐시되어(예: 실수로 `force-static` 부여) 한 사용자의 진도가 다른 요청자에게 그대로 응답되는 캐시 오염 | Information Disclosure / Tampering | Route Handler는 `cookies()`를 호출하므로 기본적으로 캐시되지 않는다(previous model) — 명시적으로 `export const dynamic = 'force-static'`을 붙이지 않도록 주의(Anti-Pattern) |

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md` — route segment config 옵션 표, Version History(v16.0.0에서 `cacheComponents` 활성 시에만 `dynamic`/`revalidate`/`fetchCache` 제거됨을 명시)
- `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md` — `dynamic = "force-dynamic"`/`cookies()`/`revalidate`/`generateStaticParams` 각각의 cacheComponents 활성/비활성 시 동작 차이 전문
- `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md` — "이전 캐싱 모델"의 `dynamic`/`revalidate` route segment config 전체 사양
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md` — `cacheComponents` 활성화 방법, `<Activity>` 네비게이션 상태 보존 동작
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md` — `next/font/local`의 `subsets`(Google 폰트 전용, local 폰트 미지원)/`preload`(기본값 `true`) 표
- 리포지토리 소스 직접 읽음: `src/app/{page,curriculum/page,schedule/page,lesson/[lessonId]/page,step/[stepId]/page}.tsx`, `src/lib/{auth,today,fonts}.ts`, `src/app/globals.css`, `src/components/{complete-button,step-card,theme-toggle,module-accordion,section-tape,schedule-table,today-lesson-card}.tsx`, `scripts/{check-design-tokens,check-progress-gates,e2e-mobile-overflow}.mjs`, `src/app/lesson/[lessonId]/actions.ts`, `src/app/unlock/route.ts`, `src/lib/unlock-secret.ts`, `next.config.ts`, `package.json`, `vercel.json`
- 이 세션 직접 실행: `npm view subset-font ...`, `npm view glyphhanger dependencies`, package-legitimacy 검사 도구(`subset-font` verdict `OK`), `python3 --version`/`pip show fonttools`(둘 다 미설치 확인), 레슨 콘텐츠 35편 전수 한자/가나 문자 스캔(0건), 전체 `src`+`docs` 84개 파일 전수 스캔(0건)

### Secondary (MEDIUM confidence)
- WebFetch(`github.com/papandreou/subset-font`) — `subsetFont(buffer, text, options)` API 시그니처, `targetFormat` 옵션

### Tertiary (LOW confidence)
- WebSearch("Pretendard variable font subset release KR only glyphs woff2") — Pretendard 공식 저장소의 `woff2-dynamic-subset`(92조각) 배포 형태 존재 여부. Assumptions Log A1로 등재.

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — `subset-font`는 npm 레지스트리·package-legitimacy 도구로 직접 검증, Playwright는 이미 설치된 기존 의존성
- Architecture(정적 전환): HIGH — Next.js 16.3.2 공식 문서를 이 세션에서 직접 읽고 이 리포지토리의 실제 라우트 코드와 대조해 구체적 마이그레이션 형태를 도출함. 유일한 불확실성은 `cacheComponents` 채택 여부라는 아키텍처 판단 자체(Open Question 1)
- Pitfalls: HIGH — G9 충돌, 날짜 의존성, Section Tape 스크롤 패턴, 375px 일정표 계산 4건 모두 소스 코드를 직접 읽어 확인한 사실이며 추측이 아니다
- 폰트 서브셋: MEDIUM — 툴체인 선택(subset-font)과 Windows 환경 제약은 HIGH, 서브셋 후 예상 파일 크기(200~400KB)는 로드맵 원문의 기대치를 인용한 것이지 이 세션에서 직접 서브셋을 실행해 검증하지 않았음

**Research date:** 2026-08-27
**Valid until:** 이 리서치의 핵심(Next.js 16.3.2 캐싱 모델 동작)은 이 프로젝트가 Next.js를 업그레이드하지 않는 한 유효 — 프레임워크 버전이 바뀌면(특히 `cacheComponents`가 기본값으로 전환되는 미래 메이저 버전) 재검증 필요. 리포지토리 코드 기반 발견(G9, 375px 계산, Section Tape)은 해당 파일이 수정되면 즉시 재확인 필요.
