# Phase 6: 전체 페이지 디자인 정리 - Context

**Gathered:** 2026-08-26
**Status:** Ready for planning
**Source:** `/gsd-plan-phase 6` 실행 중 사용자 선택 — 별도 discuss 세션 없이 `06-DESIGN-INPUT.md`(2026-08-25 `frontend-design` 감사로 확정된 설계 8건)를 이 파일의 `<decisions>`로 전환. 미결이던 "범위 밖" 항목은 아래 D-88~D-91에서 처리 방침을 확정했다.

<domain>
## Phase Boundary

Phase 1~5로 6종 화면(홈 `/`, 커리큘럼 `/curriculum`, 일정표 `/schedule`, 레슨 `/lesson/*`, Step `/step/[n]`, 소개 `/about`)과 레슨 35편이 모두 존재한다. 이 Phase는 **새 화면·새 기능을 만들지 않는다.** 이미 있는 것을 한 벌의 디자인 시스템으로 정리한다.

정리 대상은 세 층이다:

1. **토큰층** — `src/app/globals.css`의 `@theme` 블록(현재 305줄, 18색 토큰)이 색·타이포·간격의 단일 출처가 되고, 페이지·컴포넌트가 하드코딩 값을 쓰지 않는다.
2. **셸층** — 내비(`site-nav.tsx`)·카드·여백 체계가 6종 화면에서 같은 규칙으로 읽힌다.
3. **화면별 마감** — 레슨 화면은 `06-DESIGN-INPUT.md`의 확정 설계 8건, 나머지 화면은 04-UI-REVIEW가 지적한 여백 낭비와 반응형 미검증 구간.

**측정된 현재 상태 (04-UI-REVIEW.md, 라이브 Playwright, 17/24):**

- Pillar 3 색 **4/4** — 18토큰, 하드코딩 색 0개, 양쪽 테마 전 샘플 WCAG AAA(≥9.85:1). **이 층은 이미 통과했다.**
- Pillar 5 간격 **4/4** — 768/1024px 가로 오버플로 0, 터치 타깃 44×44 실측 통과.
- Pillar 4 타이포 **2/4** — 코드가 주장하는 4종/2굵기와 달리 런타임 실측은 6종/3굵기. 원인은 `@tailwindcss/typography`의 조용한 덮어쓰기(h2가 24px/700, 표 안 인라인 코드가 12.25px).
- Pillar 6 경험 **1/4** — `<main>` 랜드마크 없음, 잠금 상태 문구 없음. (복사 버튼 [Critical]은 quick 태스크 `260825-r4k`에서 이미 수정 완료 — 이 Phase 범위 밖.)
- Pillar 2 시각 **3/4** — 인라인 코드 리터럴 백틱 58곳, 페이저 이중 글리프, 홈 아이패드 세로에서 약 55% 빈 캔버스 / `/curriculum` 약 40%.

**미검증 구간:** 폰 폭 375px. `03-VERIFICATION.md` truth #9가 "not independently re-confirmed at exactly 375px"로 남아 있다 — Phase 3의 실기기 UAT가 아이패드(744px+)만 다뤘다. 코드에 `truncate`·고정폭 클래스가 없어 위험도는 낮지만 시각 확인이 안 됐다.

**범위 밖:**
- 새 라우트·새 기능·DB 스키마 변경
- 레슨 **본문 텍스트** 재작성 (콘텐츠 작업이지 디자인이 아님)
- `depth` 프론트매터 재분류 (D-89 참조 — 콘텐츠 작업으로 이관)
- 실기기 iPad Safari 확인 (D-91 참조 — UAT로 이관)
- 새 폰트 파일·새 색 토큰 도입 (D-R4K-2, D-R4K-3이 명시적으로 금지)

**Timebox:** 2일. 초과분은 v2(CONV-01~04)로 밀어낸다.
</domain>

<decisions>
## Implementation Decisions

> D-R4K-1 ~ D-R4K-8은 2026-08-25 `frontend-design` 스킬 감사에서 확정된 뒤 "Phase 6에 디자인 리워크가 이미 있으니 그때 한 번에"라는 판단으로 구현만 보류된 항목이다. 근거·대안 기각 사유는 `06-DESIGN-INPUT.md` 원문에 그대로 남아 있다. D-88 이후는 이번 계획 단계에서 "범위 밖"으로 미뤄져 있던 항목을 닫은 것이다.

### 레슨 화면 (06-DESIGN-INPUT.md에서 승계, 구현 대기 중)

- **D-R4K-1:** **시그니처 요소 = 상단 고정 "구간 테이프"(Section Tape) 6칸** — 칸 폭이 각 구간의 실제 렌더 높이에 비례해, 테이프가 스크롤 퍼센트가 아니라 그 레슨의 구조 지도가 된다. 현재 구간만 번호+제목 표시, 탭하면 이동. 근거: Step 1 레슨 10/10이 6단 척추를 예외 없이 따르고(`grep '^## '` 측정), 사이트명이 "Runway"인데 활주로 거리표식을 아직 아무도 안 그렸다 — **Reversibility:** reversible
  - 구현 제약: 구간 목록은 마운트 후 DOM(`article h2`)에서 추출 → Velite 스키마·콘텐츠 파이프라인 무변경, 35편 자동 적용
  - 폭 = 다음 h2 `offsetTop` − 이 h2 `offsetTop`. `ResizeObserver`로 `<details>` 펼침 시 재계산
  - 높이 44px(터치 타깃), 시각적 막대는 3px
  - 하이드레이션: 초기 균등 폭 렌더 → effect에서 실제 폭 채움
  - `hasContent: false` 레슨(h2 2개 미만)은 렌더하지 않음
  - `.prose h2 { scroll-margin-top }` 필요 — 고정 테이프 아래로 숨지 않도록
  - **기각된 대안:** 좌측 세로 레일 — 768px에서 본문 measure를 28px 잡아먹고 가로 모드에서 무너짐

- **D-R4K-2:** **새 색 토큰 0개 — 기존 18토큰을 교체하지 않고 Step 색을 레슨 화면까지 확장한다** — 테이프가 Step 색(1 `#3b82f6` / 2 `#8b5cf6` / 3 `#f59e0b`)을 입어 레슨이 어느 Step 소속인지 화면이 말하게 한다. 이미 `/curriculum` 카드 레일이 쓰는 토큰이다. 청록 accent(`#0d9488`)는 상호작용·상태 전용으로 남긴다 — 테이프에 accent를 쓰면 Step 1 파랑과 인접해 "청록 = 상호작용"이라는 기존 의미가 흐려진다. 근거: 04-UI-REVIEW Pillar 3이 4/4(양쪽 테마 AAA 실측)라 손댈 이유가 없다 — **Reversibility:** costly — 새 색을 나중에 추가하면 AAA 대비 실측을 양쪽 테마에서 다시 해야 한다

- **D-R4K-3:** **새 폰트 파일 0개 — Pretendard 700을 디스플레이로 쓰고 mono를 "계기판 목소리"로 승격한다** — Pretendard는 `weight: "45 920"` 가변인데 현재 400/600만 소비하므로 700은 추가 다운로드 없이 얻는다. `ui-monospace`(이미 스택에 있음)를 구간 번호·소요시간·브레드크럼까지 확장해 "본문 Pretendard / 계기 mono" 페어링을 만든다. 한국어 디스플레이 서체를 새로 받지 않는다 — 가변 폰트 ~1MB에 얹는 추가 부담이 아이패드 읽기 사이트에서 정당화되지 않는다 — **Reversibility:** reversible

- **D-R4K-4:** **타입 계약을 4종/2굵기 → 5종/3굵기로 의도적으로 개정한다** — `01-UI-SPEC.md`의 "정확히 4종/2굵기"를 개정한다. 04-UI-REVIEW Pillar 4가 2/4인 실제 원인은 종수가 아니라 `@tailwindcss/typography`의 *선언되지 않은* 이탈(h2 24px/700, 표 안 인라인 코드 12.25px)이다 — **Reversibility:** costly — 이 표가 6종 화면 전체의 크기 결정을 지배하고, `01-UI-SPEC.md` Typography 표도 함께 갱신해야 한다

  | 역할 | 크기 | 굵기 | 용도 |
  |---|---|---|---|
  | display | 30px | 700 | 레슨 제목 (tracking -0.02em) |
  | heading | 22px | 700 | h2 구간 제목 |
  | subhead | 17px | 700 | h3 (크기 대신 굵기·여백·색으로 구분) |
  | body | 16px | 400 | 본문 |
  | label | 14px | 400/600 | 계기·표 셀·배지 |
  | inline code | 15px (`0.9375rem` **절대값**) | 400 | rem이라 중첩해도 축소 불가 |

  - `prose` h1–h4를 위 값에 못 박아 플러그인 기본값이 새지 않게 한다
  - **연동 산출물:** `01-UI-SPEC.md`의 Typography 표를 이 값으로 갱신 (문서가 코드와 어긋난 채 남지 않도록)

- **D-R4K-5:** **인라인 코드에서 리터럴 백틱 글리프를 제거하고 배경 칩으로 대체한다** — `prose code::before/after { content: "\`" }`가 `@tailwindcss/typography` 기본값 그대로다(한 레슨에 58곳). 인라인 코드 배경이 완전 투명이라 백틱이 유일한 구분자인데, 한국어 본문에서 한글을 밀어낸다. → `::before/::after` 제거 + `--color-surface` / `--color-surface-dark` 배경 칩 + 좌우 padding. 새 색 없음 — **Reversibility:** reversible

- **D-R4K-6:** **MDX `table` 컴포넌트를 `overflow-x: auto` 래퍼로 오버라이드한다** — 현재 모든 표가 우연히 들어맞지만(`scrollWidth === clientWidth`) 래퍼가 `overflow-x: visible`이라 Step 2·3 레슨의 넓은 표 하나가 페이지 전체를 가로로 민다. **`display: block`으로 때우지 말 것** — 열 너비 계산이 깨진다 — **Reversibility:** reversible

- **D-R4K-7:** **페이저의 이중 방향 글리프를 제거한다** — `lesson-nav.tsx`가 Lucide chevron **과** 리터럴 `←`/`→`를 둘 다 렌더해 `‹ ← 이전 레슨`으로 읽힌다. → 라벨 문자열에서 리터럴 화살표만 삭제, chevron 유지 — **Reversibility:** reversible

- **D-R4K-8:** **`/lesson/*`에 `<main>` 랜드마크를 추가하고, 잠금 상태에 조용한 한 줄 문구를 넣는다** — `/step/1`엔 `<main>`이 있는데 `/lesson/*`엔 없어 VoiceOver "본문으로 건너뛰기"가 불가하다. 또 잠금 해제 쿠키가 없으면 완료·진행률에 대한 문구가 화면에 하나도 없다(`완료|잠금|해제|unlock` 무매치) — 이 프로젝트의 핵심 루프가 안 보인다. **링크는 걸지 않는다** — `/unlock`은 `?key=` 시크릿이 필요한 `route.ts`라 링크가 동작하지 않는다 — **Reversibility:** reversible

### 토큰층 — 성공 기준 1 ("토큰이 한 곳에서 정의되고 모든 페이지가 그 토큰만 쓴다")

- **D-88:** **"토큰만 쓴다"의 판정을 사람 눈이 아니라 자동 게이트로 못 박는다 — `scripts/check-design-tokens.mjs`를 새로 만든다** — 검사 내용: (a) `src/**/*.tsx`와 `globals.css`의 `@theme` 블록 **밖**에 리터럴 색(`#hex`, `rgb(`, `hsl(`)이 없다, (b) 타이포 크기·굵기 리터럴이 D-R4K-4 표의 값 집합 밖으로 나가지 않는다, (c) Tailwind 임의값 대괄호 문법(`text-[13px]`, `bg-[#abc]`) 사용 0건. 근거: 04-UI-REVIEW 1차 패스가 코드 grep만으로 23/24를 줬다가 라이브 실측에서 17/24로 뒤집힌 전례가 있다 — "정리했다"는 주장이 다음 Phase에서 조용히 썩지 않으려면 실행 가능한 검사가 필요하다. 기존 `check-*.mjs` 8종과 같은 자리·같은 형식으로 놓는다 — **Reversibility:** reversible
  - **주의:** 이 게이트는 정적 검사라 `@tailwindcss/typography`가 런타임에 주입하는 값을 볼 수 없다. 그 층은 D-89가 담당한다

- **D-89:** **런타임 타이포 실측을 자동화한다 — `scripts/e2e-typography.mjs`** — Playwright로 렌더된 레슨 페이지에서 `getComputedStyle` 크기·굵기 히스토그램을 뽑아 D-R4K-4 표의 5종/3굵기 집합에 속하는지 검사한다. 근거: Pillar 4가 2/4로 떨어진 원인이 정확히 "grep으로는 안 보이는 런타임 주입"이었고, 04-UI-REVIEW가 이 측정을 이미 수동으로 한 번 수행했다 — 그 측정을 스크립트로 굳히면 회귀가 자동으로 잡힌다. 기존 `e2e-progress.mjs`·`e2e-today.mjs`와 같은 패턴을 따른다 — **Reversibility:** reversible

### 셸층·화면별 마감 — 성공 기준 2, 3

- **D-90:** **홈·`/curriculum` 빈 캔버스는 "새 기능 추가"가 아니라 "기존 정보의 재배치"로 푼다** — 04-UI-REVIEW가 지적한 홈 약 55% / `/curriculum` 약 40% 빈 화면(아이패드 세로)을 채우되, **이미 사이트가 계산하고 있는 값만** 끌어온다: 전체·Step별 진행률(`progress-summary.tsx`), D-day(`dday-countdown.tsx`), 페이스 상태(`pace-status.tsx`), 다음 레슨. 새 데이터·새 쿼리·새 DB 필드를 만들지 않는다. 근거: 2일 타임박스에서 새 기능은 회귀 위험만 늘리고, 홈이 비어 보이는 진짜 이유는 "카드 하나만 있고 나머지 정보가 다른 화면에 흩어져 있어서"다 — **Reversibility:** reversible
  - **범위 상한:** 이 항목이 타임박스를 위협하면 홈만 처리하고 `/curriculum`은 v2로 넘긴다. 성공 기준 2는 "같은 셸로 읽힌다"이지 "빈 공간이 없다"가 아니다

- **D-91:** **폰 폭 375px은 자동 게이트로 닫는다 — 사람 확인에 의존하지 않는다** — `03-VERIFICATION.md` truth #9가 아이패드만 확인된 채 남아 있다. 기존 e2e 스크립트의 뷰포트 목록에 375×667을 추가해 오늘 카드·일정표·레슨 본문에서 `document.documentElement.scrollWidth <= clientWidth`(가로 오버플로 0)를 검사한다. 근거: 코드에 `truncate`·고정폭 클래스가 없어 위험은 낮지만, 두 Phase 연속 "확인 안 됨"으로 남았다는 사실 자체가 사람 확인이 이 항목에 안 붙는다는 증거다 — **Reversibility:** reversible

- **D-92:** **`depth: "심화"` 배지 문제는 이 Phase에서 다루지 않는다 — 콘텐츠 작업으로 이관한다** — Step 1 레슨 10/10이 동일 `심화`라 정보량이 0이고 오리엔테이션 레슨엔 의미상 오류지만, 해결책이 프론트매터 재분류(콘텐츠 판단)라 디자인 정리와 층이 다르다. 배지 **컴포넌트의 시각 처리**는 이 Phase가 정리하되, **어떤 레슨이 어느 depth인가**는 건드리지 않는다 — **Reversibility:** reversible

- **D-93:** **실기기 iPad Safari 확인은 계획에 넣지 않고 UAT 항목으로 남긴다** — 지금까지 측정이 전부 Playwright Chromium이었다. 실기기에서만 드러나는 것(Safari `-webkit-` 차이, 실제 터치 히트박스, 100vh 주소창 문제)은 자동화할 수 없다. 계획 태스크가 아니라 Phase 종료 시 UAT 체크리스트로 남긴다 — **Reversibility:** reversible

### 회귀 방지 — 성공 기준 4

- **D-94:** **디자인 정리 태스크는 기존 자동 게이트 10종을 하나도 깨지 않는 것을 각 태스크의 acceptance criteria로 삼는다** — `check-brand.mjs`, `check-lesson-structure.mjs`, `check-manifest.mjs`, `check-pace.mjs`, `check-progress-gates.mjs`, `check-progress-math.mjs`, `check-schedule.mjs`, `check-supabase-progress.mjs`, `e2e-progress.mjs`, `e2e-today.mjs`. 특히 `check-brand.mjs`(KANT 금칙어)는 새로 쓰는 어떤 UI 문구에도 걸린다 — **Reversibility:** reversible

### 리서치 후 확정 (06-RESEARCH.md의 Open Questions 3건을 닫음)

> 아래 4건은 2026-08-26 리서치가 실측으로 드러낸 사실에 대응해 추가된 결정이다. D-88·D-90의 전제 일부가 실측과 어긋나 있었다.

- **D-95:** **`@theme`의 타이포 토큰이 죽어 있는 진짜 원인은 "아무도 안 써서"가 아니라 네임스페이스 오타다 — `--font-size-*` → `--text-*`로 고치고, 66곳의 임의값 대괄호를 시맨틱 클래스로 치환한다** — 리서치 실측: `globals.css:35-38`의 `--font-size-label/body/heading/display`는 Tailwind v4가 `text-{name}` 유틸리티를 생성하는 네임스페이스가 `--text-*`이기 때문에(`node_modules/tailwindcss/theme.css:347-372` 검증) 유틸리티를 하나도 만들어내지 못한다. 그래서 코드베이스 전체가 `text-[16px] leading-[1.6]` 형태로 우회했고, 그게 23개 파일 66곳이다. **중요한 함의: 코드베이스는 이미 일관된 4종/2굵기를 쓰고 있었다 — 시스템이 없던 게 아니라 토큰이 연결이 안 돼 있었다.** → `--text-display/heading/subhead/body/label`을 D-R4K-4 표대로 올바른 네임스페이스로 선언한 뒤 66곳을 치환한다 — **Reversibility:** reversible
  - **D-88 게이트와의 순서 제약:** D-88(c)의 "임의값 대괄호 0건" 게이트를 지금 실행하면 66건 실패한다. 게이트는 치환 **완료 후** 활성화되어야 한다 — 게이트 도입 태스크와 치환 태스크의 순서가 뒤바뀌면 즉시 막힌다

- **D-96:** **D-88(a) "리터럴 색 0개"의 판정 범위에 Tailwind 기본 팔레트 클래스를 포함한다** — hex/rgb/hsl 리터럴은 `.tsx`에 이미 0건이고, 기본 팔레트 사용은 `text-white` 4곳이 전부다(다른 팔레트 유틸리티 0건, 실측). 4곳을 토큰으로 바꾸는 비용이 게이트에 예외 구멍을 남기는 비용보다 싸다. 게이트 검사 범위 = hex/rgb/hsl 리터럴 + 임의값 대괄호 + Tailwind 기본 팔레트 색 유틸리티 — **Reversibility:** reversible

- **D-97:** **D-90(빈 캔버스)의 범위는 계획이 아니라 실측으로 확정한다 — 두 쿠키 상태를 모두 찍고 나서 결정한다** — 04-UI-REVIEW의 "홈 55% 빈 캔버스"는 **잠금 해제 쿠키가 없는 세션**에서 측정됐다. 쿠키가 없으면 `completedIds`가 `null`이 되어 `ProgressSummary`·`PaceStatusPanel`·`BehindLessonsList` 3개 섹션이 통째로 렌더되지 않는다(`src/app/page.tsx:100-129`). 그런데 실사용자는 1인이고 10년 만료 쿠키(`src/app/unlock/route.ts:12,29`)를 항상 갖고 있어 **일상적인 홈은 이미 5개 섹션을 렌더한다.** 즉 D-90이 고치려던 문제가 실사용 상태에는 없을 수 있다 — **Reversibility:** reversible
  - **판정 절차:** 768×1024에서 쿠키 있는 홈을 스크린샷 1장 찍는다 → 첫 화면(스크롤 없이) 하단 빈 영역이 뷰포트 높이의 30% 미만이면 홈은 **작업하지 않고** D-90을 종료한다. `/curriculum`은 쿠키와 무관하게 `StepCard` 3장 그리드뿐이라 40% 빈 캔버스가 양쪽 상태 모두에서 유효 — 여기만 남는다
  - **비용:** D-89·D-91이 어차피 Playwright를 도입하므로 이 측정은 추가 비용이 거의 없다

- **D-98:** **`@playwright/test`를 devDependency로 신규 도입한다** — 기존 `e2e-progress.mjs`·`e2e-today.mjs`는 Playwright가 아니라 순수 HTTP fetch + 문자열 매칭이라 `getComputedStyle`(D-89 타이포 실측)이나 `scrollWidth`(D-91 375px 오버플로)를 **원리적으로 측정할 수 없다** — 이 값들은 SSR HTML 문자열에 존재하지 않는다. `package-lock.json`에 이름이 보이는 것은 `next`의 미사용 peerDependency일 뿐 실제 설치돼 있지 않다. 기존 스크립트에서는 **서버 기동·대기·종료 로직만 재사용**하고 검증 층만 Playwright API로 교체한다. `npx playwright install chromium` 1회 필요 — **Reversibility:** reversible — devDependency라 프로덕션 번들에 영향 없음

- **D-99:** **성공 기준 2의 "같은 셸"은 폭 통일이 아니라 패딩·내비·카드·gap 체계의 통일로 정의한다** — 현재 `max-w-5xl`(홈·커리큘럼·일정표: 그리드/대시보드형)과 `max-w-3xl`(소개·레슨: 읽기형)의 분리는 읽기 measure를 지키려는 의도된 선택이고 04-UI-REVIEW도 이를 결함으로 지적하지 않았다. **2트랙 폭 규칙을 명시적으로 선언**해 우연이 아니라 시스템으로 만든다. 다만 실제 이탈인 레슨 페이지의 `gap-6`(나머지 5곳은 `gap-8`)은 통일한다 — **Reversibility:** reversible

### Claude's Discretion

다음은 계획·실행 단계에서 알아서 판단한다:
- 태스크 분할 단위와 웨이브 배치
- 구간 테이프 컴포넌트의 파일 위치·이름
- `@theme` 블록 안 토큰 이름 체계
- `prose` 오버라이드를 `globals.css`에 둘지 별도 CSS 레이어로 뺄지
- 새 게이트 스크립트(D-88, D-89)의 정확한 실패 메시지 형식
</decisions>

<constraints>
## Constraints

- **주 사용 기기 아이패드** — 세로 768×1024 / 가로 1024×768 양쪽 모두 1순위. 터치 타깃 44px+, 코드 블록 가로 스크롤
- **브랜딩 HARD RULE** — 공개되는 어떤 문구에도 "KANT"/"Kant" 금지, 항상 "AI Engineer 교육과정". `check-brand.mjs`가 강제
- **Tailwind v4 CSS-first** — `tailwind.config.js` 없이 `globals.css`의 `@theme`가 설정 자리
- **정적 생성 유지** — 이 Phase는 렌더링 전략을 바꾸지 않는다 (`generateStaticParams`, no ISR)
- **1인 사용** — 복잡한 상태·권한 UI 불필요
- **2일 타임박스** — 초과분은 v2(CONV-01~04)로
</constraints>

<deferred>
## Deferred Ideas

- `depth` 프론트매터 재분류 → 콘텐츠 작업 (D-92)
- 실기기 iPad Safari 확인 → Phase 6 UAT (D-93)
- `/curriculum` 빈 캔버스 → 타임박스 압박 시 v2 (D-90 범위 상한)
</deferred>

<references>
## References

- `.planning/phases/06-site-wide-design-polish/06-DESIGN-INPUT.md` — D-R4K-1~8 원문(근거·기각된 대안 포함)
- `.planning/phases/04-step-1/04-UI-REVIEW.md` — 17/24 라이브 Playwright 감사, 6 pillar 실측값
- `.planning/ui-reviews/04-ui-review/` — 감사 스크린샷 6장
- `.planning/ui-reviews/04-uat/` — UAT 스크린샷 4장(복사 버튼 수정 전후 포함)
- `.planning/phases/03-schedule-and-today/03-VERIFICATION.md:60,155` — 375px 미확인 항목 원문
- `.planning/phases/01-deployed-curriculum-skeleton/01-UI-SPEC.md` — D-R4K-4가 개정하는 Typography 표
</references>
