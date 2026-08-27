# Walking Skeleton — AI Engineer Runway

**Phase:** 1
**Generated:** 2026-08-24

## Capability Proven End-to-End

MDX 파일 한 편이 스키마 검증 → 컴파일 → 문법 하이라이팅 → 정적 라우트를 거쳐, 공개 Vercel URL의 레슨 페이지로 아이패드에서 읽힌다.

이 한 줄기(Plan 01의 tracer 태스크 → Plan 02의 배포)가 Phase 1의 나머지 모든 슬라이스가 얹히는 뼈대다. 35행 매니페스트도, 4개 라우트도, 글로벌 셸도 전부 이 경로 위에 붙는 확장이다.

> 이 Phase에는 DB 계층이 없다. 진도 저장(Supabase)은 Phase 2 범위이므로 스켈레톤의 "데이터 계층" 자리는 **빌드 타임 콘텐츠 파이프라인(Velite)** 이 대신한다. Supabase 패키지는 Phase 1에서 설치조차 하지 않는다.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router, `src/` 디렉터리) | 커리큘럼 Step 2에서 배울 스택과 동일 — 사이트를 만드는 과정이 곧 예습이 된다. Pages Router는 쓰지 않는다 |
| UI 런타임 | React 19 | `next@16`의 필수 peer |
| 렌더 전략 | 전면 정적 생성 (`generateStaticParams`, ISR 없음) | 콘텐츠는 git push로만 바뀐다 — ISR의 "재배포 없이 갱신"이 필요한 시나리오가 없다. 아이패드 초기 로드도 정적이 가장 빠르다 |
| 콘텐츠 계층 | MDX 파일 + Velite (Zod 스키마) | 레슨 본문을 코드처럼 git으로 버전 관리하고, 누락 필드(`depth`/`estimatedMinutes`)를 런타임이 아니라 빌드에서 잡는다. CMS를 만들지 않는다 |
| Velite 통합 방식 | `next.config.ts`의 top-level await (`VeliteWebpackPlugin` 아님) | Next 16의 기본 dev 번들러가 Turbopack이고, 웹팩 플러그인은 그 아래에서 조용히 동작하지 않는다 |
| 코드 하이라이팅 | rehype-pretty-code + Shiki (빌드 타임) | 클라이언트에 하이라이터 JS를 0바이트 보낸다. 커리큘럼이 Python·SQL·TS·React를 넘나들어 문법 정확도가 중요하다 |
| 코드 복사 | `transformerCopyButton({ visibility: 'always' })` | CONT-06을 설정만으로 충족. `hover`는 금지 — 주 사용 기기에 hover 상태가 없다 |
| 스타일링 | Tailwind CSS v4 (`@theme` CSS-first) + `@tailwindcss/typography` | 태블릿 우선 반응형을 유틸리티로 빠르게. 장문 레슨 프로즈는 `prose`에 맡기고 손으로 스타일하지 않는다 |
| 다크모드 | `@custom-variant dark` + 하이드레이션 이전 인라인 스크립트 + `localStorage.theme` | React 컨텍스트 프로바이더는 첫 페인트 깜빡임(FOUC)의 원인이라 쓰지 않는다 |
| 한국어 타이포 | Pretendard 가변 폰트 (`next/font/local` 자체 호스팅) + 전역 `word-break: keep-all` | 한국어 웹에서 OS 네이티브에 가장 가까운 가독성. `code`/`pre`는 이 폰트를 상속하지 않는다 |
| 컴포넌트 라이브러리 | 없음 — 네이티브 HTML(`<details>`/`<summary>`, `<nav>`) + 손으로 쓴 Tailwind 컴포넌트 | Phase 1의 상호작용 표면(카드·아코디언·배지·토글·복사 버튼)이 헤드리스 a11y 프리미티브를 필요로 할 만큼 복잡하지 않다. 아이콘만 `lucide-react` |
| Auth | 없음 (Phase 1) | 사이트 전체가 공개 읽기 전용이다. 익명 세션 + RLS는 Phase 2에서 진도 저장과 함께 들어온다 |
| Deployment target | Vercel — GitHub 연동 자동 배포 (main → 프로덕션, PR → 프리뷰) | 커리큘럼 최종 배포 스택과 동일. 대시보드 import가 zero-config 정공법(로컬에 Vercel CLI 없음) |
| 저장소 | 공개 GitHub `ai-engineer-runway` | 코드 자체가 포트폴리오. 비밀값은 env로 분리하고 `.env*`는 첫 커밋부터 gitignore |
| Directory layout | `src/app` 라우트 · `src/components` 표현 · `src/content` 매니페스트/레슨 · `src/lib` 유틸 · `scripts/` 검증 게이트 · `docs/` 문서 원천 | 라우트/표현/데이터/검증을 최상위에서 분리 — Phase 2가 `src/lib/supabase`를 추가해도 기존 구획이 흔들리지 않는다 |
| Import alias | `@/*` → `src/*`, `#site/content` → `.velite` | 생성 산출물과 소스를 별칭 수준에서 구분 |
| 검증 게이트 | 의존성 0 Node 스크립트 2개 (`check-manifest.mjs`, `check-brand.mjs`) + `npm run build` | 테스트 프레임워크를 도입하지 않고도 매니페스트 불변식과 브랜드 노출 금지를 기계 검증한다 |

## Stack Touched in Phase 1

- [x] **Project scaffold** — Next.js 16 + TypeScript + Tailwind v4 + ESLint (Plan 01 Task 2)
- [x] **Routing** — `/`, `/step/[stepId]`, `/lesson/[lessonId]`, `/about`, 404 폴백 (Plan 01, 04, 05)
- [x] **데이터 계층** — DB 대신 빌드 타임 콘텐츠 파이프라인: Velite Zod 스키마가 35개 레슨 frontmatter를 검증(쓰기 = MDX 저작, 읽기 = `.velite/lessons.json` 조회) (Plan 01, 03)
- [x] **UI 상호작용** — 코드 복사 버튼(클립보드 쓰기), 모듈 아코디언 열림/닫힘, 다크모드 토글 (Plan 01, 04, 05)
- [x] **Deployment** — Vercel 프로덕션 URL + PR 프리뷰, main 푸시 자동 배포 (Plan 02)
- [x] **검증 게이트** — `npm run build` · `node scripts/check-manifest.mjs` · `node scripts/check-brand.mjs` (Plan 03, 05)

## Out of Scope (Deferred to Later Slices)

Phase 1의 최소성을 이후 Phase가 다시 논쟁하지 않도록 명시한다.

- **진도 저장·완료 토글·진행률 실데이터** — Phase 2 (TRACK-01~04, PLAT-02). Step 카드의 진행률 바는 Phase 1에서 0% 값으로 실제 렌더되고, Phase 2가 그 자리에 Supabase 데이터를 연결한다
- **Supabase 클라이언트·익명 인증·RLS** — Phase 2. Phase 1은 `@supabase/*` 패키지를 설치조차 하지 않는다
- **일정표·오늘의 학습·D-day·on-track 계산** — Phase 3 (SCHED-01~04). 글로벌 내비의 해당 두 항목은 Phase 1에서 준비 중 비활성으로 자리만 잡는다
- **33개 비파일럿 레슨의 본문** — Phase 4(Step 1) / Phase 5(Step 2·3). Phase 1은 그 35행의 메타데이터(제목·모듈·깊이·예상 시간)만 확정한다
- **레슨 검색/필터, 레슨 노트, 일정 자동 리밸런싱, PWA** — v2 (CONV-01~04)
- **테스트 프레임워크(vitest/playwright)** — 도입하지 않는다. 이 Phase의 자동 검증은 `npm run build` + 의존성 0 노드 스크립트 2개로 충분하고, 시각·반응형 확인은 실기기 human-check가 맡는다
- **디자인 시스템 라이브러리(shadcn/Radix)** — UI-SPEC이 명시적으로 거절했다. Phase 2의 대시보드 위젯에서 컴포넌트 표면이 커지면 그때 UI-SPEC 패스에서 재검토한다
- **OG 이미지 생성, 애니메이션, 스크롤 연동 타임라인** — 어떤 결정 문서도 요구하지 않는다. RESEARCH Pitfall 6이 지목한 시간 잠식 지점

## Subsequent Slice Plan

각 이후 Phase는 위 아키텍처 결정을 바꾸지 않고 그 위에 세로 슬라이스 하나씩을 얹는다.

- **Phase 2 — 진도 체크와 진행률:** 학습자가 레슨 완료를 토글하고 그 상태가 기기를 넘어 유지되며, 모듈·Step·전체 진행률이 채워진다. 스켈레톤에 추가되는 것: Supabase 클라이언트(`@supabase/ssr`), 익명 세션 + RLS, `lesson_progress` 테이블, 미들웨어 세션 갱신, Server Action 기반 mutation. **콘텐츠 파이프라인은 그대로** — DB에는 진도만 들어간다
- **Phase 3 — 학습 일정과 오늘의 학습:** 학습자가 사이트를 열면 오늘 배정 레슨과 D-day·페이스 상태를 본다. Phase 1이 확정한 35개 `estimatedMinutes`가 그대로 일정 배분의 입력이 된다. 글로벌 내비의 준비 중 두 항목이 켜진다
- **Phase 4 — Step 1 심화 콘텐츠:** Step 1의 10개 레슨 본문이 파일럿 1과 동일한 6단 구성으로 채워지고 `hasContent`가 true로 올라간다. 라우트도 스키마도 바뀌지 않는다 — 매니페스트 게이트의 기대값만 올라간다
- **Phase 5 — Step 2·3 콘텐츠와 프로젝트 가이드:** 나머지 23개 레슨 본문이 같은 방식으로 채워지고, Making-of가 검증·배포·회고까지 기록을 마친다
