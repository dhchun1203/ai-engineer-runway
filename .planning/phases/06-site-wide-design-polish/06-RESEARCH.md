# Phase 6: 전체 페이지 디자인 정리 - Research

**Researched:** 2026-08-26
**Domain:** Tailwind v4 CSS-first 디자인 토큰 통합 + `@tailwindcss/typography` 오버라이드 + 클라이언트 바운더리 신설 (Section Tape) — 그린필드가 아니라 **기존 코드의 실측 인벤토리**가 핵심 산출물
**Confidence:** HIGH — 모든 핵심 주장이 `Read`로 연 소스 파일과 `node_modules`에 설치된 실제 패키지 소스, 공식 문서(Context7)로 교차검증됨

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

> D-R4K-1 ~ D-R4K-8은 2026-08-25 `frontend-design` 스킬 감사에서 확정된 뒤 "Phase 6에 디자인 리워크가 이미 있으니 그때 한 번에"라는 판단으로 구현만 보류된 항목이다. 근거·대안 기각 사유는 `06-DESIGN-INPUT.md` 원문에 그대로 남아 있다. D-88 이후는 이번 계획 단계에서 "범위 밖"으로 미뤄져 있던 항목을 닫은 것이다.

**레슨 화면 (06-DESIGN-INPUT.md에서 승계, 구현 대기 중)**

- **D-R4K-1:** 시그니처 요소 = 상단 고정 "구간 테이프"(Section Tape) 6칸 — 칸 폭이 각 구간의 실제 렌더 높이에 비례. 현재 구간만 번호+제목 표시, 탭하면 이동. 구간 목록은 마운트 후 DOM(`article h2`)에서 추출. 폭 = 다음 h2 `offsetTop` − 이 h2 `offsetTop`. `ResizeObserver`로 `<details>` 펼침 시 재계산. 높이 44px(터치 타깃), 시각적 막대는 3px. 하이드레이션: 초기 균등 폭 렌더 → effect에서 실제 폭 채움. `hasContent: false` 레슨(h2 2개 미만)은 렌더하지 않음. `.prose h2 { scroll-margin-top }` 필요. 기각된 대안: 좌측 세로 레일(768px에서 measure 28px 잠식, 가로 모드 붕괴) — **Reversibility:** reversible
- **D-R4K-2:** 새 색 토큰 0개 — 기존 18토큰을 교체하지 않고 Step 색(1 `#3b82f6` / 2 `#8b5cf6` / 3 `#f59e0b`)을 레슨 화면까지 확장한다. 청록 accent(`#0d9488`)는 상호작용·상태 전용으로 남긴다 — **Reversibility:** costly
- **D-R4K-3:** 새 폰트 파일 0개 — Pretendard 700을 디스플레이로, `ui-monospace`를 계기판 목소리로 승격 — **Reversibility:** reversible
- **D-R4K-4:** 타입 계약을 4종/2굵기 → 5종/3굵기로 의도적으로 개정한다 (`01-UI-SPEC.md` 개정 대상):

  | 역할 | 크기 | 굵기 | 용도 |
  |---|---|---|---|
  | display | 30px | 700 | 레슨 제목 (tracking -0.02em) |
  | heading | 22px | 700 | h2 구간 제목 |
  | subhead | 17px | 700 | h3 (크기 대신 굵기·여백·색으로 구분) |
  | body | 16px | 400 | 본문 |
  | label | 14px | 400/600 | 계기·표 셀·배지 |
  | inline code | 15px (`0.9375rem` 절대값) | 400 | rem이라 중첩해도 축소 불가 |

  `prose` h1–h4를 위 값에 못 박아 플러그인 기본값이 새지 않게 한다 — **Reversibility:** costly
- **D-R4K-5:** 인라인 코드 리터럴 백틱 글리프 제거 + 배경 칩(`--color-surface`/`--color-surface-dark`) 대체 — **Reversibility:** reversible
- **D-R4K-6:** MDX `table` 컴포넌트를 `overflow-x: auto` 래퍼로 오버라이드. `display: block`으로 때우지 말 것 — **Reversibility:** reversible
- **D-R4K-7:** 페이저 이중 방향 글리프 제거 — 라벨 문자열에서 리터럴 화살표만 삭제, chevron 유지 — **Reversibility:** reversible
- **D-R4K-8:** `/lesson/*`에 `<main>` 랜드마크 추가 + 잠금 상태 조용한 한 줄 문구. 링크는 걸지 않는다(`/unlock`은 `?key=` 시크릿 필요) — **Reversibility:** reversible

**토큰층 — 성공 기준 1**

- **D-88:** `scripts/check-design-tokens.mjs` 신설 — (a) `src/**/*.tsx`와 `@theme` 밖 리터럴 색 0개, (b) 타이포 리터럴이 D-R4K-4 값 집합 밖으로 이탈 0건, (c) Tailwind 임의값 대괄호 문법(`text-[13px]`, `bg-[#abc]`) 사용 0건. 정적 검사라 `@tailwindcss/typography` 런타임 주입은 못 본다(D-89가 담당) — **Reversibility:** reversible
- **D-89:** `scripts/e2e-typography.mjs` 신설 — Playwright로 렌더된 레슨 페이지에서 `getComputedStyle` 크기·굵기 히스토그램을 뽑아 D-R4K-4 값 집합 검사 — **Reversibility:** reversible

**셸층·화면별 마감 — 성공 기준 2, 3**

- **D-90:** 홈·`/curriculum` 빈 캔버스는 "재배치"로 푼다 — 새 데이터·쿼리·DB 필드 금지. 이미 계산 중인 값(전체·Step별 진행률, D-day, 페이스, 다음 레슨)만 사용. **범위 상한:** 타임박스 위협 시 홈만 처리, `/curriculum`은 v2 — **Reversibility:** reversible
- **D-91:** 폰 폭 375px은 자동 게이트로 닫는다 — 기존 e2e 뷰포트 목록에 375×667 추가, `scrollWidth <= clientWidth` 검사 — **Reversibility:** reversible

**회귀 방지 — 성공 기준 4**

- **D-92:** `depth: "심화"` 배지 재분류는 이 Phase에서 다루지 않는다(콘텐츠 작업 이관). 배지 **컴포넌트의 시각 처리**만 이 Phase가 정리 — **Reversibility:** reversible
- **D-93:** 실기기 iPad Safari 확인은 UAT 항목으로 남긴다 — **Reversibility:** reversible
- **D-94:** 기존 자동 게이트 10종(`check-brand.mjs`, `check-lesson-structure.mjs`, `check-manifest.mjs`, `check-pace.mjs`, `check-progress-gates.mjs`, `check-progress-math.mjs`, `check-schedule.mjs`, `check-supabase-progress.mjs`, `e2e-progress.mjs`, `e2e-today.mjs`)를 하나도 깨지 않는 것을 각 태스크의 acceptance criteria로 삼는다 — **Reversibility:** reversible

### Claude's Discretion

- 태스크 분할 단위와 웨이브 배치
- 구간 테이프 컴포넌트의 파일 위치·이름
- `@theme` 블록 안 토큰 이름 체계
- `prose` 오버라이드를 `globals.css`에 둘지 별도 CSS 레이어로 뺄지
- 새 게이트 스크립트(D-88, D-89)의 정확한 실패 메시지 형식

### Deferred Ideas (OUT OF SCOPE)

- `depth` 프론트매터 재분류 → 콘텐츠 작업 (D-92)
- 실기기 iPad Safari 확인 → Phase 6 UAT (D-93)
- `/curriculum` 빈 캔버스 → 타임박스 압박 시 v2 (D-90 범위 상한)
- 새 라우트·새 기능·DB 스키마 변경, 레슨 본문 텍스트 재작성
</user_constraints>

---

## Project Constraints (from CLAUDE.md)

- **브랜딩 HARD RULE**: 공개 콘텐츠(레슨·about·메타데이터·OG·코드 주석 포함)에 "KANT"/"Kant" 절대 언급 금지, 항상 "AI Engineer 교육과정" — `scripts/check-brand.mjs`가 상시 강제(`src/`, `docs/`, `public/`, `README.md` 스캔). 이번 Phase가 추가하는 어떤 UI 카피(잠금 문구, 게이트 에러 메시지 등)도 이 검사를 통과해야 한다.
- **아이패드 우선**: 세로 768×1024 / 가로 1024×768 1순위, 터치 타깃 44px+, 코드 블록 가로 스크롤. 폰·데스크톱도 동작해야 함(2순위).
- **Next.js App Router 전용** — Pages Router 금지. `AGENTS.md`가 "이 Next.js는 학습한 버전과 다르다"고 명시 — 실제로 `node_modules/next/dist/docs/`를 열어 확인(아래 Sources 참고).
- **Tailwind v4 CSS-first** — `tailwind.config.js` 없음, `globals.css`의 `@theme`가 유일한 설정 자리.
- **정적 생성 유지** — 이 Phase는 렌더링 전략을 바꾸지 않는다.
- **1인 사용** — 복잡한 상태·권한 UI 불필요.

---

## Summary

이 Phase는 그린필드 빌드가 아니라 **이미 배포된 6종 화면·35개 레슨을 한 벌의 토큰 체계로 정리**하는 작업이다. 가장 값진 발견은 코드 리딩으로만 나온다: 프로젝트 전체가 이미 일관된 4-사이즈/2-굵기 타이포 값을 쓰고 있지만, **전부 Tailwind 임의값 대괄호 문법**(`text-[16px] font-normal leading-[1.6]`)으로 하드코딩돼 있다 — 66곳, 23개 파일. D-88(c)가 요구하는 "임의값 대괄호 0건" 게이트는 **오늘 실행하면 66건 위반으로 즉시 실패**한다. 동시에 `globals.css`의 `@theme` 블록에 이미 선언된 `--font-size-label/body/heading/display` 4개 토큰은 **단 한 곳에서도 참조되지 않는 죽은 코드**다 — 그리고 그 이유가 구조적이다: Tailwind v4가 `text-{name}` 유틸리티를 생성하는 네임스페이스는 `--text-*`이지 `--font-size-*`가 아니다(`node_modules/tailwindcss/theme.css:347-372`로 직접 확인, Context7 공식 문서로 교차검증). 즉 이 토큰들은 이름이 틀려서 애초에 아무 유틸리티도 만들어내지 못하고 있었다.

이 두 발견을 조합하면 Phase 6의 토큰층 작업 경로가 명확해진다: `@theme`에 `--text-display/--text-heading/--text-subhead/--text-body/--text-label`(D-R4K-4의 5종, 올바른 네임스페이스로)을 선언하면 Tailwind가 자동으로 `text-display`, `text-heading` 같은 시맨틱 유틸리티 클래스를 생성한다. 66곳의 `text-[Npx] leading-[N]` 쌍을 이 5개 클래스로 치환하면 D-88(c)를 구조적으로 만족시키는 동시에 하드코딩을 실제로 제거한다. 굵기(D-R4K-4의 3종: 400/600/700)는 **새 토큰이 전혀 필요 없다** — Tailwind 기본 `font-normal`/`font-semibold`/`font-bold`가 이미 정확히 400/600/700이고(`node_modules/tailwindcss/theme.css:374-382`), 코드베이스는 이미 앞의 둘을 66곳 모두에서 정확히 그 값으로 쓰고 있다(`font-bold`만 신규 도입).

두 번째로 중요한 발견: `@tailwindcss/typography`(설치 버전 0.5.20, Tailwind 4.3.3과 `@plugin` 디렉티브로 연결)의 모든 선택자는 `target: 'modern'` 모드에서 `:where()`로 감싸 명세성을 0으로 만든다(`node_modules/@tailwindcss/typography/src/index.js:20-45`) — 이는 **위험이 아니라 기회**다. 코드베이스가 이미 `.prose > p { margin-block: 2.4em }`, `.prose > h2 { margin-top: 3.2em }` 같은 평범한 클래스 선택자로 플러그인 기본값을 이겨왔다(`globals.css:163-180`, Phase 5에서 검증 완료). D-R4K-4의 h1–h4 크기 고정과 D-R4K-5의 백틱 제거도 **똑같은 패턴**으로, CSS 레이어나 `!important` 없이 명세성만으로 해결된다 — 배치 순서도 무관하다.

세 번째: Section Tape(D-R4K-1)는 `useMemo`가 Server Component인 `mdx-content.tsx`에서 동작하는 이유(React 19의 RSC 훅 서브셋에 `useMemo`/`useCallback`/`useId`가 포함되지만 `useEffect`는 제외 — `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md:19-24`로 확인)를 이해하면 컴포넌트 경계가 명확해진다: Section Tape는 `useEffect` + DOM 쿼리 + `ResizeObserver`가 필요하므로 **반드시** `"use client"` 컴포넌트여야 하고, 코드베이스에 유일하게 존재하는 유사 사례(`schedule-auto-scroll.tsx`)와 똑같은 형태(최소 props, `useEffect` 1개, 렌더 없음 또는 최소 렌더)로 만들면 된다. 다만 `ResizeObserver`·`scroll-margin`은 이 코드베이스에 **전례가 없다** — 신규 패턴이다.

**Primary recommendation:** (1) `@theme`에 `--text-*` 5종 토큰을 올바른 네임스페이스로 추가하고 66곳의 임의값 문법을 시맨틱 클래스로 치환 — 이것이 토큰층 전체 작업의 8할이다. (2) `prose` 오버라이드는 기존 `globals.css` 패턴(클래스 선택자, `:where()` 자동 승리)을 그대로 반복 — 새 CSS 아키텍처 불필요. (3) `@playwright/test`를 신규 devDependency로 추가해야 D-89/D-91을 구현할 수 있다 — 현재 `package.json`엔 없고 `package-lock.json`의 항목은 `next`의 미사용 peerDependency일 뿐 실제 설치돼 있지 않다.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 디자인 토큰 정의 (색·타이포·간격) | Frontend Server (SSR, 빌드 타임 CSS) | — | Tailwind v4 `@theme`는 빌드 시 CSS 변수·유틸리티 클래스로 컴파일되는 정적 자원 — 런타임 서버/클라이언트 구분과 무관 |
| Section Tape (구간 지도) | Browser / Client | Frontend Server (초기 균등 폭 SSR) | 실제 h2 `offsetTop` 측정은 레이아웃이 존재하는 브라우저에서만 가능 — `useEffect`+DOM 쿼리 필수, Server Component 불가 |
| `prose` 타이포 오버라이드 | Frontend Server (빌드 타임 CSS) | — | 순수 CSS 명세성 문제, 런타임 로직 없음 |
| MDX `table` 오버플로 래퍼 | Frontend Server (RSC, `mdx-content.tsx`의 `components` 매핑) | — | `pre`→`CodeBlock`과 동일한 정적 컴포넌트 치환, 상태 없음 |
| 잠금 상태 문구 (D-R4K-8) | Frontend Server (쿠키 읽기, RSC) | — | `hasUnlockCookie()`가 이미 서버에서 쿠키를 읽어 조건부 렌더 — 클라이언트 상태 불필요 |
| 홈/커리큘럼 빈 캔버스 재배치 (D-90) | Frontend Server (RSC, 이미 계산된 props 재배치) | — | `progress-summary.tsx`/`dday-countdown.tsx`/`pace-status.tsx` 모두 이미 서버에서 계산된 값을 받는 순수 표현 컴포넌트 — 새 데이터 페치 없음 |
| 자동 게이트(`check-design-tokens.mjs`, `e2e-typography.mjs`) | CI/빌드 스크립트 (Node, 저장소 루트) | — | `scripts/*.mjs`는 앱 런타임과 분리된 정적/E2E 검증 계층 |

---

## Standard Stack

### Core (이미 설치됨, 버전 변경 없음)

| Library | Installed Version | Purpose | Provenance |
|---------|---------|---------|--------------|
| Next.js | 16.3.2 | App Router | `[VERIFIED: node_modules/next/package.json]` |
| React / react-dom | 19.2.8 | UI 런타임 | `[VERIFIED: package.json]` |
| Tailwind CSS | 4.3.3 | 유틸리티 CSS, `@theme` 토큰 소스 | `[VERIFIED: node_modules/tailwindcss/package.json]` |
| `@tailwindcss/postcss` | ^4 | Tailwind v4 PostCSS 통합 | `[VERIFIED: package.json]` |
| `@tailwindcss/typography` | 0.5.20 | `prose` 클래스 | `[VERIFIED: node_modules/@tailwindcss/typography/package.json]` |
| `lucide-react` | ^1.33.0 | 아이콘 (chevron, copy 등) | `[VERIFIED: package.json]` — 버전 표기가 이례적이라 새로 추가하지 않는 한 재검증 불필요 |
| `rehype-pretty-code` + `shiki` | 0.14.5 / 4.4.3 | 코드 하이라이팅 | `[VERIFIED: package.json]` — 이 Phase에서 손대지 않음 |

### Supporting (신규 도입 필요)

| Library | Version to add | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@playwright/test` | `1.62.1` (npm 레지스트리 `dist-tags.latest` 확인) | D-89 `e2e-typography.mjs`, D-91 375px 뷰포트 오버플로 검사 | 이 두 게이트는 **실제 브라우저의 레이아웃 엔진**(`getComputedStyle`, `scrollWidth`)을 요구한다. 기존 `e2e-progress.mjs`/`e2e-today.mjs`는 Playwright가 아니라 순수 `fetch()` + SSR HTML 문자열 매칭이라 이 두 게이트에는 재사용할 수 없다(자세한 근거는 Common Pitfalls 참고). |

**신규 devDependency 필요성 — 근거:** `package-lock.json`에 `@playwright/test": "^1.51.1"`이 존재하지만, 이는 `next` 패키지 자체의 **미사용 optional peerDependency** 선언일 뿐이다(`[VERIFIED: package-lock.json:7300-7305]`, `next`의 `peerDependencies` 블록 안에 있음). `node_modules/.bin/`과 `node_modules/`에 Playwright 실행 파일·패키지가 전혀 없다(`[VERIFIED: 로컬 파일시스템 조회]`). 04-UI-REVIEW.md가 "live Playwright"로 6-pillar 감사를 했다는 기록이 있지만, 이는 일회성 도구 세션(예: `agent-browser`/`claude-in-chrome` 계열 MCP)이었을 가능성이 높고 저장소에 커밋된 의존성으로 남지 않았다.

**Installation:**
```bash
npm install -D @playwright/test
npx playwright install chromium  # 브라우저 바이너리 — CI/로컬 최초 1회
```

**Version verification:**
```bash
npm view @playwright/test version
# → 1.62.1 (2026-08-26 확인)
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@playwright/test`로 D-89/D-91 구현 | 순수 `fetch()` + 정규식(기존 `e2e-*.mjs` 패턴 그대로) | 불가능 — `getComputedStyle`과 실제 `scrollWidth`는 레이아웃 엔진이 있어야만 계산된다. HTML 문자열에는 계산된 스타일이 없다. |
| `globals.css`에 평범한 클래스 선택자로 `prose` 오버라이드 | `@layer`/CSS Cascade Layers로 우선순위 강제 | 불필요 — `:where()`의 명세성이 이미 0이라 평범한 클래스 선택자(명세성 0-1-0 이상)가 소스 순서와 무관하게 항상 이긴다. 코드베이스가 이미 이 패턴으로 5곳(`.prose > p`, `.prose > h2`, `.prose > h3`, `.prose details`, `.prose summary`)을 성공적으로 오버라이드했다. |

---

## Package Legitimacy Audit

| Package | Registry | Age (최신 게시) | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@playwright/test` | npm | 2026-07-30 게시(버전 1.62.1) | 56,416,711/주 | `github.com/microsoft/playwright` | **SUS** (사유: `too-new`) | 승인, 단 human-verify 체크포인트 부착 |

**신호 상세** (`[VERIFIED: gsd-tools query package-legitimacy check]`):
```json
{
  "exists": true,
  "publishedAt": "2026-07-30T16:36:55.324Z",
  "weeklyDownloads": 56416711,
  "repoUrl": "git+https://github.com/microsoft/playwright.git",
  "deprecated": false,
  "postinstall": null
}
```

**`SUS` 판정에 대한 해석:** 유일한 사유가 `too-new`이며, 이는 "패키지 자체가 새로 생겼다"가 아니라 "**이 특정 버전**이 최근에 게시됐다"는 뜻이다(Playwright는 거의 매주 패치 버전을 낸다). 주간 다운로드 5,600만·공식 Microsoft GitHub 저장소·`postinstall` 스크립트 없음이라는 신호는 슬롭스쿼팅과 정반대다. 그럼에도 프로토콜에 따라 `[SUS]`로 표기하고 human-verify 체크포인트를 요구한다 — **Disposition:** 계획 단계에서 `npm install -D @playwright/test` 태스크 직전에 `checkpoint:human-verify`를 넣을 것. 검증 항목은 "버전이 registry 최신과 일치하는지" 정도로 가볍게 처리 가능(패키지 자체의 정당성은 이미 확실).

**Packages removed due to `[SLOP]` verdict:** none
**Packages flagged as suspicious `[SUS]`:** `@playwright/test` (사유: too-new, 위 해석 참고 — 실질 위험 낮음)

---

## Hardcoded Value Inventory (성공 기준 1의 핵심 입력)

### 타이포그래피 — `text-[Npx]` / `leading-[N]` / `font-normal`|`font-semibold`

**실측(`grep -rEo` 이번 세션 실행):**

| 지표 | 값 |
|---|---|
| `text-[Npx]` 발생 수 | 66 |
| `leading-[N]` 발생 수 | 66 (1:1로 항상 짝을 이룸) |
| `font-normal` 발생 수 | 32 |
| `font-semibold` 발생 수 | 34 |
| `font-bold` 발생 수 | 0 (D-R4K-4가 신규 도입하는 값) |
| 영향받는 파일 수 | 23 |

**패턴은 완벽히 규칙적이다** — 발견된 조합은 정확히 4쌍뿐이고 전부 `01-UI-SPEC.md`의 기존 4종/2굵기 표와 정확히 일치한다:

| 조합 | UI-SPEC 역할 | D-R4K-4 신규 역할 |
|---|---|---|
| `text-[14px] font-normal leading-[1.4]` (label) / `text-[14px] font-semibold leading-[1.4]` (label 강조) | Label | label(14/400·600) — 그대로 유지 |
| `text-[16px] font-normal leading-[1.6]` / `text-[16px] font-semibold leading-[1.6]` | Body | body(16/400) — semibold 조합은 CTA 버튼류에서만 사용, D-R4K-4엔 없는 조합이라 이관 대상 재검토 필요 |
| `text-[20px] font-semibold leading-[1.3]` | Heading | heading이 22px로 변경 — **이 66곳 중 재작성이 필요한 유일한 사이즈 변경** |
| `text-[28px] font-semibold leading-[1.2]` | Display | display가 30px로 변경 — **역시 재작성 필요** |

**대표 사례(file:line, 전체 목록은 아래 "전체 발생 파일" 참고):**
- `src/app/lesson/[lessonId]/page.tsx:48` — `<h1 className="text-[28px] font-semibold leading-[1.2]">{lesson.title}</h1>` → display 30px/700로 변경 대상
- `src/components/module-accordion.tsx:40` — `<span className="text-[20px] font-semibold leading-[1.3]">{module.title}</span>` → heading 22px/700 대상
- `src/components/step-card.tsx:33,36,38,41` — Step 카드 라벨/제목 4곳, 전부 label/heading 조합
- `src/components/site-nav.tsx:24,41,52,64` — 내비 로고·항목 4곳

**전체 발생 파일(23개, `[VERIFIED: grep -rl 이번 세션]`):** `src/app/about/page.tsx`, `src/app/curriculum/page.tsx`, `src/app/lesson/[lessonId]/page.tsx`, `src/app/not-found.tsx`, `src/app/page.tsx`, `src/app/schedule/page.tsx`, `src/app/step/[stepId]/page.tsx`, `src/app/unlock/done/page.tsx`, `src/components/behind-lessons-list.tsx`, `src/components/complete-button.tsx`, `src/components/dday-countdown.tsx`, `src/components/depth-badge.tsx`, `src/components/estimated-time.tsx`, `src/components/lesson-nav.tsx`, `src/components/module-accordion.tsx`, `src/components/pace-status.tsx`, `src/components/progress-badge.tsx`, `src/components/progress-error.tsx`, `src/components/progress-summary.tsx`, `src/components/schedule-table.tsx`, `src/components/site-nav.tsx`, `src/components/step-card.tsx`, `src/components/today-lesson-card.tsx`.

**"안(inside) `@theme`" vs "밖(outside) `@theme`" 판정:** 위 66곳은 **전부 `@theme` 밖**이다 — `@theme` 블록(`globals.css:5-41`)엔 색·타이포 토큰 *선언*만 있고, 컴포넌트 파일에서의 *사용*은 전부 임의값 대괄호다. D-88(c)를 오늘 실행하면 **66건 위반으로 즉시 실패**한다 — 이것이 Phase 6 토큰층 작업의 실질 크기다.

### 색상 — 리터럴 hex/rgb/hsl

`grep -rn '#[0-9a-fA-F]{3,8}'`와 `rgb(`/`hsl(` 검색 결과, `.tsx` 파일 안의 모든 hex 코드는 **주석 안**에만 존재한다(`[VERIFIED: 이번 세션 grep, 3건 전부 `// Step ...` 주석]`) — 실제 `className`/`style` 속성 안에는 색 리터럴이 0건이다. `bg-white`/`text-white`/`bg-black`류(테마 비종속 리터럴)도 4곳(`not-found.tsx:12`, `today-lesson-card.tsx:26`, `unlock/done/page.tsx:37`, `progress-summary.tsx:72`)에서 `text-white`가 CTA 버튼의 고정 텍스트색으로 쓰이지만, `--color-*` 토큰이 아니라 Tailwind 기본 팔레트를 직접 참조한다 — 엄밀히는 D-88(a)가 "리터럴 색 0개"를 hex/rgb/hsl로만 정의했다면 통과하지만, 취지("토큰만 쓴다")로 보면 회색지대다. **계획 단계에서 게이트 스코프를 확정할 것**(Open Questions 참고).

### 간격(spacing) — 임의값 대괄호

`grep`(gap/p/px/py/m/w/h/min-*/max-w/top/left/right/bottom/inset `-\[`) 결과 **1건만 발견**: `src/app/about/page.tsx:25` — `[&_h3]:before:top-[0.4em]`(장식용 점 마커의 텍스트 기준선 정렬, `em` 단위라 폰트 크기에 상대적). 나머지 모든 간격은 Tailwind 기본 4px 스케일 유틸리티(`gap-4`, `px-4`, `py-12` 등)를 그대로 쓰고 있고, 이 값들은 이미 `01-UI-SPEC.md`의 Spacing Scale 표(xs 4 / sm 8 / md 16 / lg 24 / xl 32 / 2xl 48 / 3xl 64)와 1:1로 대응한다(Tailwind 기본 스페이싱 단위 = 4px, 인덱스 1/2/4/6/8/12/16이 각각 4/8/16/24/32/48/64px). **결론: 간격층은 이미 "토큰만 쓴다"를 만족한다 — 이 Phase에서 손댈 것이 거의 없다.**

---

## 현재 `@theme` 내용 (globals.css:5-41)

`[VERIFIED: src/app/globals.css:5-41]` — 전체 305줄을 이번 세션에 통째로 읽음.

```css
@theme {
  --color-background: #f8fafc;
  --color-background-dark: #0b1220;
  --color-surface: #e7ecf3;
  --color-surface-dark: #131b2e;
  --color-accent: #0d9488;
  --color-accent-dark: #2dd4bf;
  --color-destructive: #dc2626;
  --color-destructive-dark: #f87171;
  --color-step-1: #3b82f6;
  --color-step-1-dark: #60a5fa;
  --color-step-2: #8b5cf6;
  --color-step-2-dark: #a78bfa;
  --color-step-3: #f59e0b;
  --color-step-3-dark: #fbbf24;
  --color-badge-neutral-text: #64748b;
  --color-badge-neutral-bg: #f1f5f9;
  --color-badge-neutral-text-dark: #94a3b8;
  --color-badge-neutral-bg-dark: #1e293b;

  --font-size-label: 14px;
  --font-size-body: 16px;
  --font-size-heading: 20px;
  --font-size-display: 28px;
  --font-weight-regular: 400;
  --font-weight-semibold: 600;
}
```

### 그룹별 정리

| 그룹 | 토큰 수 | 상태 |
|---|---|---|
| 색(`--color-*`) | 18 | 전부 살아있음 — `bg-step-1`, `text-accent-dark` 등 컴포넌트 전역에서 실제로 참조됨(`[VERIFIED: step-card.tsx:9-11,18-20`, `depth-badge.tsx:7-9]` 등). 04-UI-REVIEW Pillar 3(4/4, 양쪽 테마 AAA)이 이 그룹을 이미 검증 완료 — **손대지 않는다(D-R4K-2).** |
| 타이포 크기(`--font-size-*`) | 4 | **전부 죽은 코드.** `grep`으로 `--font-size-label`/`body`/`heading`/`display`를 검색하면 선언부(`globals.css:35-38`) 외 참조가 0건(`[VERIFIED: 이번 세션 grep]`). 구조적 이유: 아래 "Don't Hand-Roll" 참고 |
| 타이포 굵기(`--font-weight-*`) | 2 | `--font-weight-semibold: 600`은 `globals.css:204`(`.prose summary`)에서 `var()`로 1곳 사용됨(`[VERIFIED: globals.css:204]`). `--font-weight-regular: 400`은 어디서도 참조되지 않는 죽은 코드. 게다가 `--font-weight-semibold: 600`은 Tailwind 기본값(`--font-weight-semibold: 600`, `node_modules/tailwindcss/theme.css:379`)과 완전히 동일한 값을 재선언한 것이라 실질적으로 무의미 |

### `@theme`가 아직 정의하지 않은 것 (D-R4K-4의 5종/3굵기에 필요)

- `--text-display` (30px), `--text-heading` (22px), `--text-subhead` (17px), `--text-body` (16px), `--text-label` (14px) — 올바른 네임스페이스(`--text-*`)로 재선언 필요. 기존 `--font-size-*` 4개는 삭제하거나 병행 유지(죽은 코드 정리 여부는 계획 재량)
- 각 사이즈의 기본 line-height는 `--text-{name}--line-height` 접미사로 함께 선언 가능(`node_modules/tailwindcss/theme.css:348` 패턴, `--text-xs--line-height: calc(1 / 0.75)`) — D-R4K-4가 명시한 line-height 값(1.2/1.3/1.6 등, `01-UI-SPEC.md` Typography 섹션)을 이 접미사에 실어 보내면 `text-display` 클래스 하나로 크기+줄높이가 동시에 적용된다
- 인라인 코드 15px(`0.9375rem`)은 굳이 `@theme` 토큰화할 필요 없음 — `.prose code { font-size: 0.9375rem }` 단일 규칙으로 충분(다른 곳에서 재사용되지 않는 값)
- `font-bold`(700)는 토큰 불필요 — Tailwind 기본 유틸리티가 이미 존재(`node_modules/tailwindcss/theme.css:380`)

---

## Architecture Patterns

### System Architecture Diagram

```
[요청] → Next.js App Router (force-dynamic RSC, 쿠키 읽기)
              │
              ├─ Server Component: page.tsx (각 라우트)
              │     │
              │     ├─ 정적 셸: <main>/<article> + Tailwind 유틸리티 클래스
              │     │     (임의값 대괄호 → 시맨틱 --text-* 클래스로 치환 대상)
              │     │
              │     ├─ MDXContent (Server Component, useMemo만 사용)
              │     │     └─ components 매핑: pre → CodeBlock("use client")
              │     │                          table → TableWrapper(신규, 서버 가능)
              │     │
              │     └─ [레슨 페이지 전용] SectionTape("use client", 신규)
              │           │  useEffect: querySelectorAll('article h2')
              │           │  → offsetTop 측정 → 폭 계산 → setState
              │           │  ResizeObserver: <details> 토글 시 재계산
              │           └─ 초기 SSR: 균등 폭 렌더 (hydration-safe)
              │
              └─ globals.css: @theme(빌드타임 CSS 변수·유틸리티 생성)
                    + .prose 오버라이드(클래스 선택자, :where() 명세성 0을 이김)
```

### Recommended Project Structure (변경 없음, 신규 파일만 추가)

```
src/
├── app/globals.css          # @theme 토큰 확장 지점 (--text-* 5종 추가)
├── components/
│   ├── mdx-content.tsx      # defaultComponents에 table 항목 추가
│   ├── section-tape.tsx     # 신규 "use client" 컴포넌트 (D-R4K-1)
│   └── ...                  # 기존 23개 파일의 text-[Npx] 치환
scripts/
├── check-design-tokens.mjs  # 신규 (D-88)
└── e2e-typography.mjs       # 신규 (D-89, D-91과 공유 가능한 Playwright 부트스트랩)
```

### Pattern 1: `--text-*` 시맨틱 토큰으로 임의값 문법 제거

**What:** Tailwind v4의 `--text-*` 네임스페이스에 이름을 선언하면 `text-{name}` 유틸리티가 자동 생성된다.
**When to use:** D-R4K-4의 5종 타입 스케일 전체.
**Example:**
```css
/* Source: node_modules/tailwindcss/theme.css:347-372 패턴 그대로 응용,
   공식 문서(Context7 /websites/tailwindcss "font-size") 확인 */
@theme {
  --text-display: 1.875rem;        /* 30px */
  --text-display--line-height: 1.2;
  --text-heading: 1.375rem;        /* 22px */
  --text-heading--line-height: 1.3;
  --text-body: 1rem;               /* 16px */
  --text-body--line-height: 1.6;
  --text-label: 0.875rem;          /* 14px */
  --text-label--line-height: 1.4;
}
```
```tsx
// Before (66곳 중 1곳, src/app/lesson/[lessonId]/page.tsx:48)
<h1 className="text-[28px] font-semibold leading-[1.2]">{lesson.title}</h1>
// After
<h1 className="text-display font-bold">{lesson.title}</h1>
```

### Pattern 2: `prose` 오버라이드는 명세성만으로 이긴다 (레이어 불필요)

**What:** `@tailwindcss/typography`의 모든 선택자가 `:where(...)`로 감싸져 명세성 0이므로, 평범한 클래스 선택자가 소스 순서와 무관하게 항상 승리한다.
**When to use:** D-R4K-4(h1–h4 고정), D-R4K-5(백틱 제거), D-R4K-6(table 래퍼는 CSS가 아니라 컴포넌트 치환).
**Example:**
```css
/* Source: node_modules/@tailwindcss/typography/src/index.js:20-45(inWhere 함수),
   src/styles.js:1541-1547(code::before/after 원본) — 직접 읽고 확인.
   기존 성공 사례: globals.css:163-180 (이미 이 패턴으로 5곳 오버라이드 완료) */
.prose h2 {
  font-size: 1.375rem;   /* 22px, :where(.prose h2)를 명세성으로 이김 */
  font-weight: 700;
}
.prose code::before,
.prose code::after {
  content: none;         /* 플러그인 기본값 content: '"`"' 제거 */
}
.prose code {
  font-weight: 400;       /* 플러그인 기본값은 600 — 함께 지정 안 하면 남는다 */
  font-size: 0.9375rem;   /* rem 절대값 — em 중첩 축소 방지(표 안 인라인 코드 12.25px 버그 재발 방지) */
}
```
**주의:** `code`의 기본 `font-weight`는 `600`이다(`node_modules/@tailwindcss/typography/src/styles.js:1541-1543`, `[VERIFIED]`). D-R4K-4가 요구하는 inline code weight 400을 실제로 얻으려면 `font-size`뿐 아니라 `font-weight`도 함께 오버라이드해야 한다 — 04-UI-REVIEW도 06-DESIGN-INPUT.md도 이 굵기 이탈은 명시적으로 언급하지 않았다(사이즈 이탈만 언급). **계획에 반영할 것.**

### Pattern 3: MDX 컴포넌트 치환으로 `table` 래퍼 추가 (기존 `pre→CodeBlock` 패턴 재사용)

**What:** `mdx-content.tsx`의 `defaultComponents`에 항목을 추가하는 것만으로 모든 MDX 렌더 지점(`/lesson`, `/about`)에 자동 적용된다.
**Example:**
```tsx
// Source: src/components/mdx-content.tsx:21-23 (기존 코드, 그대로 인용)
const defaultComponents: Record<string, ComponentType> = {
  pre: CodeBlock as ComponentType,
};
// 추가 대상 (신규):
// table: TableWrapper as ComponentType,
```
```tsx
// TableWrapper 신규 컴포넌트 — Server Component로 충분(상태 없음)
function TableWrapper(props: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  );
}
```
**근거 정정:** `@tailwindcss/typography`는 `table`에 `width: '100%'`, `table-layout: 'auto'`만 지정하고 `overflow-x`나 래퍼 div를 추가하지 않는다(`[VERIFIED: node_modules/@tailwindcss/typography/src/styles.js:1594-1597]`). 현재 코드베이스에 표 래퍼가 전혀 없다 — D-R4K-6이 말하는 "래퍼가 overflow-x: visible"은 문서상 표현이고, 실제로는 "래퍼가 아예 없어서 좁은 컨테이너(`max-w-3xl`)에 표가 그대로 부딪히는" 상태다. **금지되지 않는다:** `display: block`으로 때우면 `table-layout: auto`의 열 너비 계산이 깨진다는 D-R4K-6 경고는 정확하다 — `<table>` 자체를 block으로 바꾸지 말고 감싸는 `<div>`에만 `overflow-x-auto`를 적용해야 한다.

### Pattern 4: Section Tape의 클라이언트 경계 (신규 패턴, 코드베이스에 전례 없음)

**What:** React 19 Server Component에서 지원되는 훅은 `useMemo`/`useCallback`/`useId` 등 재렌더 없이도 동작하는 서브셋뿐이며, `useEffect`/`useState`/브라우저 API는 명시적으로 Client Component 전용이다.
**증거:** `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md:19-24`(`[VERIFIED]`, 발췌):
> Use **Client Components** when you need: [State](...) and [event handlers](...). [Lifecycle logic](...). E.g. `useEffect`. Browser-only APIs...

이것이 `src/components/mdx-content.tsx`가 `"use client"` 없이 `useMemo`를 호출하면서도(`[VERIFIED: mdx-content.tsx:1-16]`, 파일 최상단에 `"use client"` 지시어 없음 확인) Server Component로 정상 동작하는 이유다.

**When to use:** Section Tape(D-R4K-1).
**설계 함의:**
- Section Tape는 **반드시** `"use client"` 컴포넌트 — `useEffect` + `document.querySelectorAll` + `ResizeObserver` 전부 Client 전용.
- `mdx-content.tsx`나 레슨 `page.tsx`(async Server Component, `dynamic = "force-dynamic"`) 자체에 `"use client"`를 붙일 필요는 없다 — Section Tape만 별도 클라이언트 컴포넌트로 분리하고 그 안에 필요한 로직을 전부 담는다.
- 코드베이스 유일의 유사 사례는 `schedule-auto-scroll.tsx`(`[VERIFIED: src/components/schedule-auto-scroll.tsx:1-18]`, 전문 인용):
  ```tsx
  "use client";
  import { useEffect } from "react";
  export function ScheduleAutoScroll({ targetId }: { targetId: string }) {
    useEffect(() => {
      const target = document.getElementById(targetId);
      if (!target) return;
      target.scrollIntoView({ block: "center" });
    }, [targetId]);
    return null;
  }
  ```
  이 패턴(최소 props, 서버→클라이언트 직렬화 경계 최소화, `useEffect` 1개)을 Section Tape에도 그대로 적용할 수 있다 — 다만 Section Tape는 `return null`이 아니라 실제 UI(6칸 테이프)를 렌더해야 하므로 완전히 동일하진 않다.
- **`ResizeObserver`·`scroll-margin-top`은 이 코드베이스에 전례가 없다**(`[VERIFIED: 이번 세션 grep, 0 matches]`) — Phase 6이 도입하는 순수 신규 패턴이다. 표준 브라우저 API이므로 라이브러리 추가는 불필요.
- `lesson.stepId`는 이미 레슨 페이지에서 사용 가능하다(`[VERIFIED: src/app/lesson/[lessonId]/page.tsx:50]`, `<DepthBadge depth={lesson.depth} stepId={lesson.stepId as StepId} />`) — Section Tape에 Step 색을 입히기 위한 추가 조회가 필요 없다.
- Step 색 클래스 매핑은 `step-card.tsx`의 기존 패턴을 그대로 재사용해야 한다(D-R4K-2가 명시): 동적 클래스 조합이 아니라 리터럴 `Record<StepId, string>` 맵으로 고정 — Tailwind JIT이 동적 문자열 조합을 스캔하지 못하기 때문(`[VERIFIED: src/components/step-card.tsx:8-12,17-21]`, 주석에 이유 명시).
- `hasContent: false` 게이트는 레슨 페이지의 기존 조건부 렌더 안에 있다(`[VERIFIED: src/app/lesson/[lessonId]/page.tsx:54]`, `{lesson.hasContent ? (...) : (...)}`) — Section Tape는 이 `true` 분기 안, `MDXContent` 바로 위/옆에 배치되어야 자동으로 D-R4K-1의 "h2 2개 미만 렌더 안 함" 요구를 만족할 수 있다(단, "h2 2개 미만"은 `hasContent`가 아니라 실제 렌더된 h2 개수로 판정해야 하므로 클라이언트 쪽에서 `querySelectorAll('h2').length < 2`일 때 스스로 숨기는 로직도 필요 — `hasContent: false`만으로는 부족).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| `prose` 기본값을 이기는 CSS 우선순위 제어 | `!important`, CSS Cascade Layers(`@layer`), 인라인 스타일 | 평범한 클래스 선택자(`.prose h2 { ... }`) | 플러그인이 이미 `:where()`로 명세성 0을 만들어놨다 — 어떤 추가 장치도 필요 없고, 코드베이스가 이미 5곳에서 이 방법으로 성공했다 |
| 타이포 유틸리티 클래스 생성 | 커스텀 `@utility` 블록으로 `text-display` 수동 정의 | `@theme`에 `--text-display` 선언 → Tailwind가 자동 생성 | Tailwind v4의 존재 이유가 바로 이것 — `@theme` 선언만으로 유틸리티 생성·`line-height` 페어링·다크모드 변형까지 전부 자동 |
| 레이아웃 측정(offsetTop, 리사이즈 감지) | 커스텀 polling 루프, `setInterval` 기반 재계산 | `ResizeObserver` (표준 브라우저 API, 이미 모든 대상 브라우저 지원) | 폴링은 배터리·성능 낭비, `<details>` 토글 같은 불연속 레이아웃 변화를 늦게 감지 |
| 브라우저 레이아웃 검증(D-89/D-91) | 순수 HTTP+정규식 (`e2e-progress.mjs` 패턴 복제) | `@playwright/test` | `getComputedStyle`/`scrollWidth`는 레이아웃 엔진이 있어야만 존재하는 값 — SSR HTML 문자열엔 없다 |

**Key insight:** 이 Phase에서 "hand-roll하지 말아야 할 것"의 8할은 **이미 프로젝트가 hand-roll하고 있던 것**(임의값 대괄호 타이포)을 **표준 메커니즘(`@theme` 토큰)으로 되돌리는 것**이다 — 새 도구를 들여오는 문제가 아니라 이미 있는 도구(Tailwind v4 `@theme`)를 올바른 네임스페이스로 쓰는 문제다.

---

## 6개 화면의 셸 비교 (성공 기준 2)

`[VERIFIED: 각 파일 grep 결과 이번 세션]` — 컨테이너 클래스 원문 대조:

| 화면 | 최상위 태그 | `max-w-*` | `gap-*` | 비고 |
|---|---|---|---|---|
| `/` (홈) | `<main>` | `max-w-5xl` | `gap-8` | `src/app/page.tsx:101` |
| `/curriculum` | `<main>` | `max-w-5xl` | `gap-8` | `src/app/curriculum/page.tsx:21` |
| `/schedule` | `<main>` | `max-w-5xl` | `gap-8` | `src/app/schedule/page.tsx:60` |
| `/step/[stepId]` | `<main>` | **`max-w-3xl`** | `gap-8` | `src/app/step/[stepId]/page.tsx:41` — 폭이 다른 3화면과 다름 |
| `/about` | `<main>` | `max-w-3xl` | `gap-8` | `src/app/about/page.tsx:18` |
| `/lesson/[lessonId]` | **`<article>`(`<main>` 없음)** | `max-w-3xl` | **`gap-6`** | `src/app/lesson/[lessonId]/page.tsx:45` — D-R4K-8이 지적한 정확한 결함, `gap`도 다른 5화면과 다름 |

**공통:** `mx-auto flex w-full flex-1 flex-col`, `px-4 py-12 sm:px-6 lg:px-8` — 6곳 전부 동일(패딩 체계는 이미 통일돼 있다).

**실질 divergence 3가지:**
1. **폭**: `max-w-5xl`(홈·커리큘럼·일정표, 그리드/대시보드형) vs `max-w-3xl`(Step·about·레슨, 읽기형). 이건 콘텐츠 유형에 따른 **의도적** 분리로 보이며(넓은 화면=카드 그리드, 좁은 화면=산문), "동일 셸"이 반드시 "동일 폭"을 뜻하지 않는다 — 계획 단계에서 이 구분을 유지할지 통일할지 결정 필요(Open Questions).
2. **랜드마크**: `/lesson/*`만 `<main>`이 없다 — D-R4K-8이 요구하는 수정은 `<article>`을 `<main>`으로 감싸거나 바꾸는 것으로 해결 가능. 시맨틱하게는 `<main><article>...</article></main>` 형태가 적절(레슨 콘텐츠 자체는 여전히 `<article>`).
3. **gap**: 레슨만 `gap-6`(24px), 나머지 5곳은 `gap-8`(32px) — 사소하지만 "같은 셸" 판정에서 짚을 만한 편차.

**SiteNav 컨테이너**(`src/components/site-nav.tsx:37`)는 `max-w-5xl px-4 py-2 sm:px-6 lg:px-8` — 홈/커리큘럼/일정표의 `max-w-5xl`과 일치하지만 Step/about/레슨의 `max-w-3xl`과는 불일치. 내비 바 자체는 항상 5xl 폭이므로, 3xl 폭 페이지에서는 내비보다 본문이 좁게 보인다(현재도 마찬가지 — 새로 생기는 문제는 아님).

**about 페이지의 `prose` 변형 차이:** `about/page.tsx:23`는 `prose prose-slate max-w-none dark:prose-invert`를 쓰고, 레슨 페이지(`lesson/[lessonId]/page.tsx:55`)는 `prose dark:prose-invert max-w-none`(“prose-slate” 수식어 없음)을 쓴다 — 타이포그래피 플러그인의 색 팔레트가 다르다(slate vs 기본 gray, 값 차이는 미미하지만 실재). D-R4K-4의 h1–h4 크기 고정을 `globals.css`에 전역 `.prose` 선택자로 적용하면 두 페이지 모두에 자동 적용되어 이 차이는 무해해진다(색상 차이만 남고 크기·굵기는 통일됨).

---

## 기존 게이트 스크립트 컨벤션 (D-88/D-89/D-91이 따라야 할 형태)

`[VERIFIED: check-brand.mjs, check-lesson-structure.mjs, check-progress-gates.mjs(부분), e2e-today.mjs 전체를 이번 세션에 읽음]`

### 공통 규칙 (`check-*.mjs`, 정적 게이트 8종)

- **실행:** `package.json`에 npm script 항목이 **없다** — 전부 `node scripts/check-xxx.mjs`로 직접 실행(`[VERIFIED: package.json 전체 확인, "scripts"엔 dev/build/start/lint만 존재]`).
- **shebang:** `#!/usr/bin/env node` 첫 줄.
- **외부 의존성 0** — Node 표준 모듈(`fs`, `path`, `assert/strict`, `url`)만 사용한다고 각 파일 상단 주석에 명시.
- **경로 계산:** `path.dirname(fileURLToPath(import.meta.url))` → `path.resolve(__dirname, '..')`로 저장소 루트 계산(실행 위치 무관하게 동작) — `check-brand.mjs`만 예외로 `process.cwd()`를 씀(저장소 루트에서 실행해야 한다고 주석에 명시).
- **에러 수집 패턴:** `errors`/`violations` 배열에 모으고 마지막에 한꺼번에 출력 후 `process.exit(1)` — 첫 위반에서 즉시 종료하지 않는다.
- **"0건 검사"를 성공으로 위장 금지:** 대상 디렉터리가 없거나 검사 대상이 0개면 그 자체를 실패로 처리(`check-brand.mjs:126-131`, `check-lesson-structure.mjs:294-296` 둘 다 이 방어 로직을 갖고 있음) — 새 게이트도 이 규칙을 따라야 한다.
- **성공 시 출력:** `console.log('스크립트명: 요약 메시지'); process.exit(0);`
- **한국어 주석 + 영어 식별자** 컨벤션 유지.

### `e2e-*.mjs` 2종 (Playwright 아님 — 순수 HTTP)

- **실행:** `node --env-file=.env.local scripts/e2e-xxx.mjs` — `.env.local`에서 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`UNLOCK_SECRET` 등을 읽는다. 필수 환경변수 부재 시 즉시 `process.exit(1)`(기본값 폴백 금지).
- **자체 dev 서버 부팅:** `spawn(process.execPath, [nextBin, 'dev', '--port', PORT, '--hostname', HOST], { cwd: ROOT, stdio: [...], env: process.env })` — `nextBin = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next')`(`[VERIFIED: e2e-today.mjs:172-178]`). 포트는 `E2E_PORT` env var로 override 가능(기본 3211 등, 스크립트마다 다른 기본 포트 사용 — 충돌 방지).
- **서버 준비 대기:** `waitForServerReady()` — 최대 180초, 1초 간격 폴링(`fetch` status < 500이면 준비 완료로 판단).
- **정리:** `killServerTree(child)` — Windows에서는 `taskkill /pid ${pid} /T /F`(자식 프로세스 트리까지 종료), 그 외 플랫폼은 `child.kill('SIGKILL')`. `finally` 블록에서 항상 호출(`[VERIFIED: e2e-today.mjs:144-159, 515-517]`).
- **앱 코드 재사용 금지:** 두 e2e 스크립트 모두 `curriculum-helpers.ts`/`schedule.ts`/`today.ts`를 import하지 않고 매니페스트(`.velite/lessons.json`)와 `modules.ts`를 정규식으로 **독립 재파싱**한다 — "같은 함수를 재사용하면 계산이 틀려도 검증이 같이 틀린다"는 원칙(`[VERIFIED: e2e-today.mjs:11-13, 75-76]`).
- **검증 방식:** SSR HTML을 `fetch()`로 받아 `data-*` 속성 문자열 매칭·개수 세기(`countOccurrences`)로 검증한다 — **실제 브라우저를 띄우지 않는다.** React SSR이 인접 표현식 사이에 삽입하는 `<!-- -->` 주석 마커를 정규식 매칭 전에 제거해야 한다(`stripSsrComments`, `[VERIFIED: e2e-today.mjs:163-165]`, `progress-badge.tsx` 등에서 실측 확인된 이슈).
- **시나리오 번호 매기기:** `t1`, `t2`, ... 순차 번호 + `console.log`로 각 시나리오 통과 보고.

### D-89(`e2e-typography.mjs`)/D-91(375px)이 이 컨벤션과 갈라지는 지점

이 두 게이트는 **위 "부트스트랩" 절반(자체 서버 기동/대기/종료)은 그대로 재사용 가능**하지만, **"검증" 절반은 Playwright로 교체해야 한다** — `fetch()` 대신 `chromium.launch()` → `page.goto()` → `page.evaluate(() => getComputedStyle(...))`/`page.viewportSize()`+`document.documentElement.scrollWidth`. 계획 단계에서 두 스크립트가 서버 부팅 로직을 공유 모듈로 뽑을지, 각자 복제할지 결정 필요(기존 8종 게이트가 모두 "복제, 재사용 안 함" 원칙을 따르므로 후자가 컨벤션에 더 부합).

---

## Common Pitfalls

### Pitfall 1: D-88(c) 게이트를 "구현 후"가 아니라 "구현 전" 기준으로 설계하면 즉시 66건 실패로 막힌다

**What goes wrong:** `check-design-tokens.mjs`를 먼저 만들고 나중에 리팩터하면, 첫 실행에서 66건 위반이 쏟아져 게이트 자체가 "빨간 채로 방치"되는 상태가 된다.
**Why it happens:** 임의값 대괄호 문법 제거(23개 파일 66곳)가 게이트 신설보다 선행돼야 하는데, 웨이브를 잘못 나누면 순서가 뒤집힌다.
**How to avoid:** 웨이브 순서를 "① `@theme`에 `--text-*` 5종 추가 → ② 66곳 일괄 치환 → ③ 게이트 신설·그 시점부터 통과"로 고정. 게이트를 먼저 만들되 "허용 목록"에 기존 66곳을 임시로 넣고 치환 완료 후 허용 목록을 비우는 방법도 가능(계획 재량).
**Warning signs:** 게이트 스크립트를 만든 첫 커밋에서 CI가 바로 빨간불.

### Pitfall 2: `code`의 `font-weight: 600` 기본값을 놓치면 D-R4K-4의 inline code 400이 반영되지 않는다

**What goes wrong:** `font-size`만 `0.9375rem`으로 오버라이드하고 `font-weight`를 그대로 두면, 플러그인 기본값 600이 그대로 남아 D-R4K-4 표(400)와 어긋난다.
**Why it happens:** 04-UI-REVIEW와 06-DESIGN-INPUT.md 둘 다 크기 이탈(12.25px)만 언급했고 굵기 이탈은 측정하지 않았다.
**How to avoid:** `.prose code { font-size: 0.9375rem; font-weight: 400; }`를 한 규칙에 함께 넣는다.
**Warning signs:** `e2e-typography.mjs`(D-89)의 굵기 히스토그램에 `600`이 여전히 등장.

### Pitfall 3: D-90의 "재배치" 전제가 "쿠키 없는 상태"를 기준으로 설계되면 실제 사용자 경험과 어긋난다

**What goes wrong:** 04-UI-REVIEW가 측정한 "홈 55% 빈 캔버스"는 **잠금 해제 쿠키가 없는 세션**에서 관찰됐다(`[VERIFIED: src/app/page.tsx:100-129]`, 쿠키가 없으면 `completedIds`가 `null`이 되어 `PaceStatusPanel`/`BehindLessonsList`/`ProgressSummary` 3개 섹션 전체가 렌더되지 않고 `DDayCountdown` + `TodayLessonCard`만 남는다). 이 프로젝트는 1인용이고 실사용자는 최초 1회 `/unlock?key=...`를 방문한 뒤 10년 만료 쿠키(`[VERIFIED: src/app/unlock/route.ts:12,29]`)를 항상 갖고 있으므로, **일상적인 홈 화면은 이미 5개 섹션(D-day+오늘카드+페이스+밀린레슨(조건부)+전체진행률)을 렌더한다.** "55% 비어있다"는 실측은 실사용자가 거의 겪지 않는 상태일 가능성이 크다.
**Why it happens:** UI 감사가 쿠키 없는 익명 세션으로 진행됐고, 이는 신규 방문자 관점에서는 유효하지만 "1인 사용" 제약(PLAT-02)의 실제 사용 패턴과는 다르다.
**How to avoid:** 계획 단계에서 **양쪽 쿠키 상태 모두**를 스크린샷/실측하고 나서 D-90의 범위를 확정할 것. 쿠키 있는 상태가 이미 충분히 채워져 있다면 D-90의 실제 작업량은 CONTEXT.md가 가정한 것보다 작을 수 있다 — 반대로 `/curriculum`은 쿠키 유무와 무관하게 `StepCard` 3장 그리드뿐이라 이 페이지의 "40% 빈 캔버스"는 두 상태 모두에서 유효하다.
**Warning signs:** 계획이 "쿠키 있는 홈 화면"을 한 번도 스크린샷하지 않고 D-90 태스크를 확정하는 경우.

### Pitfall 4: 기존 `e2e-*.mjs` 패턴을 D-89/D-91에 그대로 복제하면 애초에 측정 불가능한 값을 요구하게 된다

**What goes wrong:** "기존 e2e 스크립트와 같은 형태로" 만들라는 D-89/D-91의 요구를 문자 그대로 해석해 `fetch()` + 문자열 매칭으로 구현을 시도하면, `getComputedStyle`이나 `scrollWidth` 같은 **레이아웃 계산 결과**는 애초에 SSR HTML 문자열에 존재하지 않으므로 검증이 불가능하다.
**Why it happens:** "같은 패턴을 따른다"는 지시가 부트스트랩(서버 기동)과 검증(HTTP fetch) 두 층을 구분하지 않고 뭉뚱그려 읽힐 수 있다.
**How to avoid:** 서버 기동/대기/종료 로직만 재사용하고, 검증 로직은 Playwright API로 교체한다(Architecture Patterns의 "Don't Hand-Roll" 표 참고).
**Warning signs:** 스크립트가 `getComputedStyle`을 정규식으로 흉내내려 시도하는 코드.

### Pitfall 5: Section Tape가 `useEffect` 없이 h2를 세려다 Server Component 제약에 부딪힌다

**What goes wrong:** `mdx-content.tsx`가 `"use client"` 없이 `useMemo`로 동작하는 것을 보고 "Section Tape도 같은 파일 안에서 useMemo로 처리하면 되겠다"고 판단하면, `document.querySelectorAll`이나 `useEffect`, `ResizeObserver`는 Server Component에서 실행 자체가 불가능해 빌드/런타임 에러가 난다.
**Why it happens:** React 19 RSC의 훅 서브셋(`useMemo`/`useCallback`/`useId`는 가능, `useEffect`/브라우저 API는 불가)이 직관적이지 않다.
**How to avoid:** Section Tape는 별도 파일, 최상단 `"use client"` 명시. `schedule-auto-scroll.tsx` 패턴을 참고 템플릿으로 삼는다.
**Warning signs:** `ReferenceError: document is not defined`(빌드 타임) 또는 훅 관련 콘솔 경고.

---

## Code Examples

### `check-design-tokens.mjs`의 임의값 대괄호 검사 (기존 컨벤션 재사용)

```js
// Source: 패턴은 check-brand.mjs:96-112(walk)와 check-lesson-structure.mjs의
// errors 배열 패턴을 조합 — 신규 작성이지만 기존 두 파일의 구조를 그대로 따른다.
const ARBITRARY_VALUE_PATTERN = /(?:text|bg|border|leading|gap|p|px|py|m|w|h|top|left|right|bottom|inset)-\[[^\]]+\]/g;
// className 문자열 안에서 이 패턴이 매치되면 위반으로 기록.
// 허용 예외: about/page.tsx의 `top-[0.4em]`처럼 em 단위 장식용 마이크로 오프셋은
// ALLOWLIST 배열로 명시적으로 열거해 스킵할지 계획 단계에서 결정할 것.
```

### Section Tape 초기 폭 계산 (하이드레이션 안전 패턴)

```tsx
"use client";
// Source: 패턴은 src/components/schedule-auto-scroll.tsx:1-18(구조)를 확장,
// D-R4K-1 구현 메모(06-DESIGN-INPUT.md) 반영.
import { useEffect, useRef, useState } from "react";

type Section = { id: string; label: string; widthPercent: number };

export function SectionTape({ articleRef }: { articleRef: React.RefObject<HTMLElement> }) {
  const [sections, setSections] = useState<Section[] | null>(null); // null = 초기 균등 폭

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;

    function measure() {
      const headings = Array.from(article!.querySelectorAll("h2"));
      if (headings.length < 2) {
        setSections([]); // D-R4K-1: h2 2개 미만이면 렌더하지 않음
        return;
      }
      const tops = headings.map((h) => (h as HTMLElement).offsetTop);
      const total = article!.scrollHeight;
      const widths = tops.map((top, i) => {
        const next = tops[i + 1] ?? total;
        return ((next - top) / total) * 100;
      });
      setSections(
        headings.map((h, i) => ({
          id: h.id,
          label: h.textContent ?? "",
          widthPercent: widths[i],
        })),
      );
    }

    measure();
    const observer = new ResizeObserver(measure); // <details> 토글 시 재계산
    observer.observe(article);
    return () => observer.disconnect();
  }, [articleRef]);

  // sections === null: 하이드레이션 이전/최초 렌더 — 균등 폭으로 그려 mismatch 방지
  // sections === []: h2 2개 미만 — 아무것도 렌더하지 않음
  // sections.length >= 2: 실제 비례 폭 렌더
  if (sections !== null && sections.length === 0) return null;
  // ... 렌더 로직은 계획 단계에서 확정
  return null;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|-----------------|--------|
| Tailwind v3 `tailwind.config.js`의 `theme.extend.fontSize` | Tailwind v4 `@theme` CSS 블록의 `--text-*` 네임스페이스 | Tailwind v4 GA(이 프로젝트는 4.3.3 사용) | 이 프로젝트의 `--font-size-*` 토큰은 v3 시절 네이밍 습관이 v4 CSS-first 문법에 그대로 옮겨오면서 네임스페이스가 틀려 죽은 코드가 된 사례로 보임(교육적 함의는 Assumptions Log 참고) |
| `@tailwindcss/typography`를 `tailwind.config.js`의 `plugins: []` 배열에 등록 | `globals.css`에서 `@plugin "@tailwindcss/typography";` 디렉티브로 등록 | Tailwind v4 | `[VERIFIED: src/app/globals.css:2]` — 이미 올바르게 적용됨, 변경 불필요 |

**Deprecated/outdated:** 없음 — 이 Phase 범위 안에서 사용 중인 모든 라이브러리 버전은 현재 최신선(next 16.3.2, tailwindcss 4.3.3, typography 0.5.20 전부 npm 레지스트리 최신과 일치).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `06-DESIGN-INPUT.md`가 말하는 "표 래퍼가 overflow-x: visible"이 실제로는 "래퍼가 아예 없는" 상태를 가리킨다는 해석 | Architecture Patterns > Pattern 3 | 낮음 — 어느 쪽이든 수정 방향(래퍼 신설/overflow-x 지정)은 동일. 표현 차이일 뿐 구현에 영향 없음 |
| A2 | Playwright 신규 devDependency 설치 시 브라우저 바이너리 다운로드(`npx playwright install`)가 CI/로컬 환경에서 네트워크 제약 없이 가능하다는 가정 | Standard Stack | 중간 — 사내/제한된 네트워크에서 실패 시 D-89/D-91 게이트가 로컬에서 돌지 않을 수 있음. 계획 단계에서 1회 확인 필요 |
| A3 | 04-UI-REVIEW.md의 "live Playwright" 감사가 커밋된 의존성이 아니라 일회성 도구 세션이었다는 추정 | Standard Stack | 낮음 — 실제로 이미 설치돼 있었다면 신규 설치 태스크가 불필요해질 뿐, 확인은 `npm ls @playwright/test`로 계획 착수 시 1초 컷 |

**전체 Assumptions는 3건뿐** — 이 Phase의 핵심 주장(하드코딩 인벤토리, `@theme` 죽은 토큰, `prose` 명세성, Section Tape 클라이언트 경계, 게이트 컨벤션)은 전부 `Read`/`grep`/`npm view`/Context7으로 이번 세션에 직접 검증됨.

---

## Open Questions

1. **6화면 폭 통일 여부 (`max-w-5xl` vs `max-w-3xl`)**
   - What we know: 현재 분리가 콘텐츠 유형(그리드형 vs 읽기형)에 따른 것으로 보이고, 04-UI-REVIEW는 이 분리 자체를 결함으로 지적하지 않았다.
   - What's unclear: 성공 기준 2("같은 셸로 읽힌다")가 폭까지 통일을 요구하는지, 패딩·gap 체계 통일로 충분한지.
   - Recommendation: 계획 단계에서 "셸 = 패딩+내비+카드 스타일 체계"로 스코프를 명시적으로 좁히고, 폭 분리는 의도된 것으로 유지 — 단, 레슨 페이지의 `gap-6`(다른 5곳은 `gap-8`)은 통일 대상으로 명시.

2. **D-88(a)의 "리터럴 색 0개" 판정 범위 — `text-white`/`bg-black` 같은 Tailwind 기본 팔레트 리터럴 포함 여부**
   - What we know: hex/rgb/hsl 코드 리터럴은 `.tsx` 안에 0건(주석 제외). `text-white`는 4곳에서 CTA 버튼 텍스트색으로 쓰임 — `--color-*` 토큰이 아니라 Tailwind 기본값.
   - What's unclear: D-88 원문이 "hex/rgb/hsl"만 명시했으므로 문자 그대로는 통과하지만, "토큰만 쓴다"는 취지로 보면 `text-white`도 위반 후보.
   - Recommendation: 정적 게이트 정규식 설계 시 스코프를 명확히 정의(hex/rgb/hsl만 vs Tailwind 기본 팔레트 클래스까지 포함) — 후자를 포함하면 4곳 추가 수정 필요.

3. **쿠키 있는 상태의 홈 화면이 이미 D-90을 충족하는가**
   - What we know: 쿠키 있는 홈은 이미 5개 섹션을 렌더한다(Pitfall 3).
   - What's unclear: 아이패드 세로 768×1024에서 5개 섹션을 다 렌더해도 실제로 "채워진" 느낌인지는 스크린샷 없이는 모른다 — 섹션이 많아도 각 섹션 padding이 커서 여전히 스크롤 없이 빈 공간이 남을 수 있음.
   - Recommendation: 계획 착수 전 쿠키 있는 상태로 홈 화면 스크린샷 1장을 먼저 찍고 D-90 태스크 범위를 확정.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | 모든 `scripts/*.mjs` (타입 스트리핑, ESM) | ✓ | 로컬 확인 필요(22.6+ 요구, 기존 스크립트 주석 근거) | — |
| `@playwright/test` | D-89, D-91 | ✗ | — (npm 레지스트리 최신 1.62.1, 로컬 미설치) | 없음 — 신규 설치 필수, Package Legitimacy Audit 참고 |
| Chromium 바이너리(Playwright) | D-89, D-91 실행 | ✗ | — | `npx playwright install chromium` 1회 실행 필요 |

**Missing dependencies with no fallback:** `@playwright/test` — D-89/D-91 구현의 유일한 경로.

---

## Validation Architecture

> `workflow.nyquist_validation: true` (`.planning/config.json` 확인) — 섹션 포함.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | 없음(전통적 테스트 러너 부재) — Node 표준 `assert/strict` 기반 게이트 스크립트(`check-*.mjs`) + `@playwright/test`(신규, D-89/D-91 전용) |
| Config file | 없음 — `check-*.mjs`는 인자 없이 직접 실행, `@playwright/test` 도입 시 `playwright.config.ts` 신설 여부는 계획 재량(스크립트에서 `chromium.launch()` 직접 호출하면 config 파일 자체가 불필요할 수 있음 — 기존 컨벤션이 "설정 파일 없이 직접 실행"이므로 이쪽이 컨벤션에 더 부합) |
| Quick run command | `node scripts/check-design-tokens.mjs` |
| Full suite command | 기존 8종 + 신규 2종을 순차 실행하는 셸 나열(기존에도 통합 러너 없음 — 각 스크립트를 개별 호출) |

### Phase Requirements → Test Map

> 이 Phase는 확정된 요구사항 ID(REQ-XX)가 없다(`ROADMAP.md`: "Requirements: TBD"). 대신 ROADMAP.md의 Phase 6 성공 기준 4개를 검증 단위로 삼는다.

| 성공 기준 | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC1 (토큰만 쓴다) | `@theme` 밖 리터럴 색/타이포/임의값 대괄호 0건 | static | `node scripts/check-design-tokens.mjs` | ❌ Wave 0 신설 |
| SC2 (6화면 같은 셸) | 아이패드 세로/가로에서 내비·카드·여백 체계 일관 | manual/visual | 스크린샷 대조(자동화 어려움 — 시각 판단) | 자동화 대상 아님, human-verify 체크포인트 권장 |
| SC3 (375px 안 깨짐) | 오늘 카드·일정표·레슨 본문 가로 오버플로 0 | e2e (Playwright) | `node scripts/e2e-typography.mjs`(또는 별도 `e2e-mobile-overflow.mjs`) | ❌ Wave 0 신설 |
| SC4 (기존 게이트 10종 통과) | 회귀 없음 | static + e2e | 기존 8종 `check-*.mjs` + `e2e-progress.mjs` + `e2e-today.mjs` 전체 재실행 | ✅ 이미 존재 |

### Sampling Rate

- **Per task commit:** `node scripts/check-design-tokens.mjs`(빠른 정적 검사, 초 단위)
- **Per wave merge:** 위 SC1~SC4 전부 + 기존 10종 게이트 전체
- **Phase gate:** `/gsd-verify-work` 전 전체 스위트 그린 — D-94가 이를 명시적 acceptance criteria로 못 박음

### Wave 0 Gaps

- [ ] `scripts/check-design-tokens.mjs` — SC1 커버 (신규, D-88)
- [ ] `scripts/e2e-typography.mjs` — SC3 일부 커버 (신규, D-89)
- [ ] 375px 뷰포트 오버플로 검사 — SC3 나머지 커버 (신규, D-91 — `e2e-typography.mjs`에 통합할지 별도 스크립트로 뺄지는 계획 재량)
- [ ] Framework install: `npm install -D @playwright/test && npx playwright install chromium`

---

## Security Domain

> `workflow.security_enforcement: true`, `security_asvs_level: 1` (`.planning/config.json` 확인) — 섹션 포함.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | 아니오 | 이 Phase는 인증 메커니즘(`hasUnlockCookie`, `/unlock` 시크릿 키 비교)을 변경하지 않는다 — 순수 CSS/컴포넌트 리팩터 |
| V3 Session Management | 아니오 | 쿠키 발급 로직(`unlock/route.ts`) 무변경 |
| V5 Input Validation | 해당 없음 | 이 Phase가 새로 받는 사용자 입력 없음(디자인 정리) |
| V6 Cryptography | 아니오 | 무변경 |
| V7 Error Handling | 경계 사례 있음 | `check-brand.mjs`의 금칙어 검사(D-94)가 이 Phase가 추가하는 모든 신규 UI 카피(잠금 문구, 게이트 에러 메시지)에 적용됨 — 새 문구를 작성할 때마다 "KANT" 계열 문자열이 섞이지 않도록 주의 |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| D-R4K-8의 잠금 상태 문구가 실수로 `/unlock` 링크를 노출 | Information Disclosure(약함) | `/unlock`은 `?key=` 시크릿 쿼리 파라미터 없이는 무의미하므로 직접적 위협은 아니지만, D-R4K-8이 명시적으로 "링크는 걸지 않는다"고 결정했다(`[VERIFIED: unlock/route.ts:16]`, key 파라미터 없으면 `state=invalid`로 리다이렉트) — 계획 단계에서 잠금 문구 구현 시 이 결정을 재확인하고 실수로 `<Link href="/unlock">`을 추가하지 않도록 코드 리뷰 포인트로 남길 것 |
| 신규 devDependency(`@playwright/test`) 공급망 리스크 | Tampering | Package Legitimacy Audit 완료 — `SUS`(too-new) 판정이지만 공식 Microsoft 저장소·5,600만 주간 다운로드로 실질 위험 낮음. `checkpoint:human-verify`로 버전 확인 절차만 추가 |

이 Phase는 보안 표면을 사실상 추가하지 않는다 — 인증/세션/입력 검증 로직 무변경, 유일한 신규 표면은 devDependency 1개(low-risk, 이미 감사 완료)와 신규 UI 카피(기존 `check-brand.mjs`가 자동으로 커버).

---

## Sources

### Primary (HIGH confidence — 이번 세션에 직접 Read/grep/명령 실행으로 검증)

- `src/app/globals.css` (전체 305줄 통독) — `@theme` 토큰 전체 목록, `prose` 오버라이드 5곳
- `src/components/mdx-content.tsx`, `src/components/code-block.tsx`, `src/components/schedule-auto-scroll.tsx`, `src/components/step-card.tsx`, `src/components/depth-badge.tsx`, `src/components/lesson-nav.tsx`, `src/components/site-nav.tsx`, `src/components/today-lesson-card.tsx`, `src/components/progress-summary.tsx`
- `src/app/page.tsx`, `src/app/curriculum/page.tsx`, `src/app/step/[stepId]/page.tsx`, `src/app/lesson/[lessonId]/page.tsx`, `src/app/about/page.tsx`, `src/app/layout.tsx`
- `src/lib/auth.ts`, `src/lib/unlock-secret.ts`, `src/app/unlock/route.ts`, `velite.config.ts`, `src/content/modules.ts`, `src/content/curriculum-helpers.ts`
- `scripts/check-brand.mjs`, `scripts/check-lesson-structure.mjs`, `scripts/check-progress-gates.mjs`(부분), `scripts/check-schedule.mjs`(부분), `scripts/e2e-today.mjs`(전체)
- `node_modules/tailwindcss/theme.css:347-382` — `--text-*`/`--font-weight-*` 네임스페이스 실제 소스
- `node_modules/@tailwindcss/typography/src/index.js`(전체 구조), `src/styles.js`(h2/code 선택자, `content: '"`"'` 원문, table 스타일)
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` — RSC 훅 서브셋 공식 안내
- `package.json`, `package-lock.json`(playwright 항목 컨텍스트 확인)
- `npm view @playwright/test version` → `1.62.1`
- `gsd-tools query package-legitimacy check --ecosystem npm @playwright/test` → SUS(too-new), 신호 상세 포함

### Secondary (MEDIUM confidence)

- Context7 `/websites/tailwindcss` — "Define custom font size in theme"(`--text-*` 문법 공식 문서로 교차검증)

### Tertiary (LOW confidence)

- 없음 — 이번 세션은 WebSearch를 사용하지 않았다(모든 주장이 로컬 소스 코드·설치된 패키지·공식 문서로 검증 가능했음)

---

## Metadata

**Confidence breakdown:**
- 하드코딩 인벤토리(성공 기준 1의 입력): HIGH — grep 실측, 파일별 카운트 재현 가능
- `@theme` 죽은 토큰 판정: HIGH — 소스 코드 직접 대조(`node_modules/tailwindcss/theme.css`) + 공식 문서 교차검증
- `prose` 오버라이드 메커니즘: HIGH — 플러그인 소스 직접 확인 + 코드베이스 기존 성공 사례 5건
- Section Tape 클라이언트 경계: HIGH — Next.js 공식 문서(로컬 설치본) + 기존 코드 패턴(`schedule-auto-scroll.tsx`) 대조. 단 `ResizeObserver`/`scroll-margin` 자체는 코드베이스 전례 없는 신규 패턴
- 게이트 스크립트 컨벤션: HIGH — 4개 스크립트 전체/부분 통독
- 6화면 셸 비교: HIGH — 6개 파일 컨테이너 클래스 직접 대조
- D-90 empty-canvas 재평가(Pitfall 3): MEDIUM — 코드 로직으로 검증됐으나 실제 스크린샷 미확인(계획 단계 권장 사항으로 명시)

**Research date:** 2026-08-26
**Valid until:** 이 Phase의 2일 타임박스 내 유효 — 코드베이스 상태에 강하게 결합돼 있어 병렬 작업(다른 Phase)이 없다면 만료 위험 낮음
