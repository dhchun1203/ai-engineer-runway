---
phase: 8
phase_name: "performance-and-mobile"
project: "AI Engineer 사전학습 사이트 (aiEngineerCourse)"
generated: "2026-08-27"
counts:
  decisions: 12
  lessons: 10
  patterns: 12
  surprises: 10
missing_artifacts:
  - "08-UAT.md (별도 UAT 파일 없음 — 실기기 UAT 승인 기록은 08-08-SUMMARY.md 안에 있음)"
---

# Phase 8 Learnings: performance-and-mobile

## Decisions

### 라우트 렌더 모드 계약을 "목표 상태"로 먼저 코드에 고정한다
정적 전환을 시작하기 전에 `check-route-rendering.mjs`가 완성 후의 목표 상태(레슨·Step·커리큘럼은 완전 정적, `/`·`/schedule`은 동적 유지)를 먼저 검사하도록 만들었다. 플랜 직후 39건 위반(전부 빨간불)이 정상이고, 이후 전환 플랜들이 하나씩 초록불로 만든다.

**Rationale:** 전환 작업의 완료 여부를 사람 판단이 아니라 게이트 하나로 판정할 수 있게 하려고. 목표를 코드로 적으면 중간 상태가 "미완"인지 "결함"인지 헷갈리지 않는다.
**Source:** 08-01-PLAN.md, 08-01-SUMMARY.md

### 성능 게이트는 `next dev`가 아니라 `next build && next start`를 부트스트랩한다
빌드 타임아웃(600초)을 서버 기동 타임아웃(180초)과 분리해 실패 원인을 구분한다.

**Rationale:** `next dev`의 온디맨드 컴파일 타이밍이 TTFB 숫자에 섞이면 측정 자체가 의미를 잃는다.
**Source:** 08-01-SUMMARY.md

### TTFB 판정은 절대 임계값이 아니라 `/about`(정적 대조군) 대비 상대 비교로 둔다
판정 기준 = `/about` 중앙값 × 2 + 15ms.

**Rationale:** 로컬 머신 성능 편차를 흡수하기 위해. 이 결정이 나중에 프로덕션 실측(33~40ms, 대조군 34.86ms)에서도 같은 방식의 상대 판정으로 SC1을 닫는 근거가 됐다.
**Source:** 08-01-SUMMARY.md, 08-MEASUREMENTS.md 표 1

### 진도 데이터는 단일 `GET /api/progress` Route Handler 하나로만 내려준다 (D8-C~D8-F)
전송 방식만 서버 렌더 → 클라이언트 fetch로 바꾸고 파생값 계산 소유권은 서버에 그대로 뒀다. `actions.ts`의 `revalidatePath` 3줄은 제거했다.

**Rationale:** 엔드포인트가 하나면 쿠키 게이트(`hasUnlockCookie()` 최우선 호출)도 한 벌, 게이트 검사(G14/G21)도 한 벌이다. 정적 셸 전환으로 `revalidatePath`는 의미를 잃었다.
**Source:** 08-02-PLAN.md, 08-02-SUMMARY.md

### 메모 읽기를 별도 엔드포인트로 만들지 않고 `?lesson=` 응답의 `note` 필드로 합친다 (D8-G)
그리고 메모장은 데이터가 도착한 뒤에만 마운트한다 — `initialBody`를 나중에 갈아끼우는 경로 자체를 코드에 두지 않는다 (D8-H).

**Rationale:** 왕복 1회로 완료 상태와 메모를 동시에 가져오고, "빈 값 자동 저장이 실제 메모를 덮어쓰는" 사고를 타이밍 조정이 아니라 구조로 막기 위해.
**Source:** 08-03-PLAN.md, 08-03-SUMMARY.md

### 폰트 서브셋은 "먼저 측정하고 임계값을 넘을 때만" 진행한다 (D8-B)
임계값 두 조건(전송량의 30% 이상 / 폰트 단독 500KB 이상)을 실측(76.36%, 2,057,688 bytes)과 대조해 둘 다 참임을 확인한 뒤에야 서브셋에 착수했고, 그 판단 과정을 `08-FONT-DECISION.md`에 남겼다.

**Rationale:** ROADMAP의 "첫 방문 체감에 영향이 있는지 먼저 측정하고, 있을 때만 손댄다" 원칙. 결과가 아니라 판단 근거가 남아야 나중에 재론할 수 있다.
**Source:** 08-FONT-DECISION.md, 08-04-SUMMARY.md

### 표준 문자표는 기억으로 재현하지 않고 1차 자료에서 fetch해 코드포인트 단위로 교차검증한다
KS X 1001 완성형 2,350자를 Unicode.org 공식 매핑 테이블(`KSX1001.TXT`)에서 받아 "HANGUL SYLLABLE" 행만 필터링(정확히 2,350행)하고, 완성된 상수를 원본과 diff해 0 missing / 0 extra를 확인했다.

**Rationale:** 검증 불가능한 재현은 이 플랜이 막으려는 결함(잘못된 글리프 집합)과 같은 종류다.
**Source:** 08-04-SUMMARY.md

### 서브셋 시 `variationAxes`를 생략해 가변 축(weight 45~920)을 통째로 보존하고, 원본은 `assets/fonts/`로 옮긴다 (D8-K)
삭제가 아니라 이동이라 되돌릴 수 있고, `public/` 밖이라 배포 산출물에 오르지 않는다.

**Rationale:** 가변 축을 잘라내면 `font-weight: 700` 강조가 서브셋 후에 굵어지지 않는다. 원본은 재서브셋의 입력으로 계속 필요하다.
**Source:** 08-04-SUMMARY.md

### ISR을 어디에도 쓰지 않고, 대신 D-day를 브라우저에서 재계산한다 (D8-N/D8-O), `/`·`/schedule`은 동적 유지 (D8-P)
근거로 설치된 Next 16.3.2 문서(`incremental-static-regeneration.md` 100~102행·238행)의 "재검증 창 만료 후 첫 요청은 낡은 페이지를 받는다"를 코드 주석에 직접 인용했다.

**Rationale:** 하루 한 번 여는 1인 학습 사이트에서는 "창 만료 후 첫 요청"이 곧 "그날의 유일한 방문"이라 매일 어제 상태를 보게 될 위험이 있다. 홈·일정표는 오늘 날짜가 곧 본문 전체라 정적화 이득 자체가 사라진다.
**Source:** 08-06-PLAN.md, 08-06-SUMMARY.md

### M3 게이트의 "4자 이하 제외" 임계값을 바꾸지 않고, 해소 못한 위반은 숫자와 함께 실기기 UAT로 넘긴다
날짜·소요시간·Step N 배지 같은 `whitespace-nowrap` 짧은 캡션은 120px로 넓히면 시각적 왜곡이 되고, 원인 컴포넌트가 플랜의 파일 범위 밖이라 손대지 않았다.

**Rationale:** 게이트가 불편하다고 게이트 정의를 바꾸면 그 게이트는 더 이상 아무것도 지키지 않는다. 대신 남은 판단을 사람에게 정확한 숫자와 함께 넘긴다.
**Source:** 08-05-SUMMARY.md coverage D5, 08-MEASUREMENTS.md 표 4

### Motion 라이브러리를 도입하지 않는다 (D8-R), 탭 피드백은 Tailwind 임의값이 아니라 CSS 클래스로 (D8-Q)
필요했던 움직임(눌림 변형·순차 등장) 전부 CSS `transform`/`opacity` + `animation-delay` cascade로 해결됐다. `git diff package.json`이 빈 출력임을 커밋 시점마다 확인했다.

**Rationale:** 재론 조건(스크롤 연동 물리, 라우트 간 공유 요소 전환)이 이 페이즈에서 발견되지 않았다. CSS 클래스로 구현하면 `check-design-tokens.mjs`의 대괄호 스캐너를 건드리지 않는다.
**Source:** 08-07-PLAN.md, 08-07-SUMMARY.md

### 측정 종합 문서는 값을 덮어쓰지 않고 전/후 이력 + 출처 각주로 남긴다
Task 3 체크포인트 대기 중 quick task `260827-g6u`가 375px 수치를 바꿨을 때, 재측정 대신 그 quick task의 BASELINE 문서를 1차 출처로 인용해 "수정 전 / 수정 후"를 같은 표에 나란히 적었다. 중복 수정도 하지 않았다.

**Rationale:** 측정 문서는 감사 가능한 기록이어야 하고, 후속 독자가 "왜 숫자가 바뀌었는지"를 재구성할 수 있어야 한다.
**Source:** 08-08-SUMMARY.md, 08-MEASUREMENTS.md 표 4 갱신 안내

---

## Lessons

### 자격증명 없는 검증은 코드 경로만 증명하고, 실 DB 왕복은 증명하지 못한다
08-01~08-07 전부가 워크트리에서 `.env.local` 접근이 차단된 채 실행됐다. 더미 자격증명 + Playwright route mock으로 렌더링 분기는 구조적으로 증명했지만, 8개 플랜에 걸쳐 `human_judgment: true` + `status: unknown` 커버리지 항목이 계속 쌓였고 전부 "08-08에서 재확인"으로 미뤄졌다.

**Context:** 08-08이 실제 자격증명 세션에서 게이트 20종을 한 번에 돌려서야 이 부채가 정산됐다(19종 exit 0). 병렬 워크트리 실행을 쓸 때는 "실 자격증명이 필요한 검증을 모아 닫는 플랜"이 페이즈 안에 반드시 하나 있어야 한다.
**Source:** 08-01~08-07-SUMMARY.md의 Issues Encountered, 08-08-SUMMARY.md

### 게이트 스크립트는 "앞 시나리오가 먼저 실패하면" 뒤 시나리오가 사실상 미실행 상태로 방치된다
`e2e-progress.mjs`의 시나리오 g4가 08-03의 레슨 정적 전환 이후 계속 깨져 있었다 — 정적 셸은 원문 HTML에 진도 마커를 담지 않는데 g4는 원문 fetch로 그 마커를 기대했다. 더미 자격증명 실행은 항상 i2에서 먼저 멈춰서 g4까지 도달하지 못했고, 08-08의 첫 실 자격증명 실행에서야 드러났다.

**Context:** Rule 1 자동 수정으로 `renderedHtml()` 기반으로 교체(커밋 `8598ef8`). 전제 조건이 필요한 e2e 스위트는 "끝까지 도달한 적이 있는가"를 별도로 추적해야 한다.
**Source:** 08-MEASUREMENTS.md 표 5, 08-08-SUMMARY.md

### 반응형 수정에서 새 leaf 텍스트 요소를 만들면 게이트 지표가 조용히 회귀한다
`module-accordion.tsx`에서 "레슨 N개" bare 텍스트를 `<span className="hidden sm:inline">`으로 감쌌더니, 640px 이상에서 다시 보이는 그 span 자체가 M2/M3 측정 대상이 되어 `/step/1`의 768/1024 M3가 11 → 16으로 회귀했다.

**Context:** 부모 컨테이너의 `flex-col`/`sm:flex-row` 전환으로 교체해 leaf 개수를 전혀 늘리지 않고 같은 목표를 달성했다. 회귀 버전은 커밋 전에 잡혀 히스토리에 남지 않았다.
**Source:** 08-05-SUMMARY.md Deviations

### 한글 서브셋에서 "안전한 상위집합"은 안전하지도 않고 효과도 없다
현대 한글 음절 전체(11,172자)를 계산식으로 넣은 첫 시도는 서브셋이 15.45%(1,739,856 bytes)만 줄어 로드맵 기대치(200~400KB)에 크게 못 미쳤다. KS X 1001 완성형 2,350자로 좁히자 78.21% 감소(448,384 bytes)했다.

**Context:** 폴백 스택(`ui-sans-serif`, `system-ui`)이 있고 커버리지 게이트가 누락을 상시 잡으므로, 문자 집합을 넓게 잡을 이유가 애초에 없었다.
**Source:** 08-04-SUMMARY.md Deviations, 08-FONT-DECISION.md

### 바이너리 포맷 파서는 스펙 레이아웃을 주석으로 적고 실제 프로덕션 파일로 검증해야 한다
WOFF2 고정 헤더에서 `length`(UInt32)를 건너뛰지 않아 `numTables`를 offset 8(정답 12), `totalCompressedSize`를 offset 16(정답 20)에서 읽었고, Brotli 압축 해제 자체가 실패했다. 실제 `PretendardVariable.woff2`(glyf/loca transform이 적용된 진짜 파일)를 임시 서브셋으로 복사해 실행하는 검증 단계에서 발견했다.

**Context:** 합성 테스트 파일이었으면 못 잡았을 결함이다.
**Source:** 08-01-SUMMARY.md Deviations

### 전송량 측정은 `Content-Length` 부재 응답을 반드시 폴백으로 처리해야 한다
`page.on('response')` 콜백이 `Content-Length` 없는 응답(chunked 등)을 0바이트로 처리해 HTML/CSS/JS 대부분이 집계에서 빠졌고, 폰트 비중이 100%로 나왔다. `response.body()` 길이 폴백 + `Promise.all` 대기를 추가하자 76.29%로 정정됐다.

**Context:** 측정값이 "100%"처럼 극단적으로 깔끔하면 측정 코드를 먼저 의심할 것.
**Source:** 08-01-SUMMARY.md Deviations

### 문서 전체를 대상으로 한 정규식은 무관한 문자열에 우연히 매칭된다
`hydratedBody.match(/D-(\d+|DAY)/)`가 실제 D-day(`D-33`)가 아니라 `D-02`를 주웠다. `data-schedule-ui="dday"` 마커 뒤 600자 윈도우로 범위를 좁혀 해결했다(같은 파일 s3 시나리오의 500자 윈도우 관례와 동일 기법).

**Context:** HTML 문서에는 스크립트·청크 이름 등 예상 못 한 문자열이 항상 섞여 있다.
**Source:** 08-06-SUMMARY.md Deviations

### 게이트 정규식은 정당한 기존 패턴을 오탐할 수 있으므로 범위를 좁혀 도입해야 한다
G22 초안이 `addEventListener("scroll", ...)`를 무차별 스캔해 `lesson-notepad.tsx`의 `visualViewport.addEventListener("scroll", sync)`(아이패드 키보드 인셋 보정)를 위반으로 잡았다. 실제 우려 대상인 `window.addEventListener("scroll", ...)`로 좁혔고, 더미 미스로틀 파일을 임시 생성해 탐지력이 유지됨을 확인했다.

**Context:** 게이트를 좁힐 때는 "탐지력이 살아 있는가"를 음성 테스트로 같이 확인해야 한다.
**Source:** 08-07-SUMMARY.md Deviations

### 자동 게이트 20종 초록불도 실기기 결함을 대체하지 못한다 (Phase 6 교훈의 재확인)
게이트가 전부 통과하고 375px M1/M2/M3까지 측정한 상태에서, 사용자가 실제 아이폰에서 헤더 내비가 3줄로 접혀 화면 위쪽 1/4을 잠식하는 결함을 발견해 보고했다. quick task `260827-g6u`(햄버거 전환)로 수정됐고, 그 결과 M3가 라우트당 정확히 −1씩 줄었다.

**Context:** M3 게이트는 "요소가 좁다"는 것만 보지 "여러 요소가 쌓여 화면을 잠식한다"는 것은 보지 못한다. 실기기 UAT를 페이즈 마지막 플랜에 넣은 설계(D8-L)가 실제로 값을 했다.
**Source:** 08-08-SUMMARY.md, 08-MEASUREMENTS.md 표 4 갱신 안내

### 로컬 TTFB 숫자는 판정 근거가 아니라 방향 지표일 뿐이다
정적 전환 전후 `/step/1` TTFB가 6.00ms → 6.10ms로 사실상 동일했다. 최종 판정은 프로덕션 배포 URL 실측(정적 3종 33.59~39.93ms vs 정적 대조군 34.86ms, `X-Nextjs-Prerender: 1` + `X-Vercel-Cache: HIT`)에서만 가능했다.

**Context:** 로컬에서는 쿠키 없는 경로라 Supabase 쿼리가 애초에 발생하지 않아 전환 전후가 같은 코드 경로를 탄다. 정적 전환의 실제 이득은 CDN 엣지 캐시에서 나온다.
**Source:** 08-02-SUMMARY.md, 08-MEASUREMENTS.md 표 1

---

## Patterns

### 정적 게이트 3단계 골격
(1) 산출물 부재 시 즉시 skip + exit 0 → (2) 독립 재계산(앱 코드 import 금지) → (3) `fail()` 배열에 누적 후 한꺼번에 보고.

**When to use:** 신규 `check-*.mjs` 정적 게이트를 만들 때 항상. 기존 `check-manifest.mjs`/`check-progress-gates.mjs` 관례와 일치한다.
**Source:** 08-01-SUMMARY.md

### 진도 아일랜드 3계층
Route Handler(`GET /api/progress`, 쿠키 게이트 최우선) → Provider(`useEffect` + fetch, 4상태 loading/ready/error/locked) → Slot 소비자(상태별 스켈레톤/실제값/무표시). 확장할 때는 Provider/Skeleton 계층을 건드리지 않고 새 Slot만 추가한다.

**When to use:** 정적 셸로 전환한 페이지에 사용자별 상태를 얹을 때. 08-02가 만들고 08-03(완료·메모)·08-06(요약·Step 바)이 새 컴포넌트 계층 없이 그대로 확장했다.
**Source:** 08-02-SUMMARY.md, 08-03-SUMMARY.md, 08-06-SUMMARY.md

### `renderedHtml()` 수화 후 DOM 검증 헬퍼 (공유 모듈 대신 파일마다 복제)
Chromium 새 컨텍스트 생성 → `[data-progress-island]` 대기 → `data-progress-state !== 'loading'` 대기 → `page.content()` 반환. 반환 타입이 기존 `res.text()`와 같은 HTML 문자열이라 downstream 문자열 어설션을 바꾸지 않고 이행할 수 있다.

**When to use:** 서버 렌더 → 정적 셸 + 클라이언트 fetch로 전환된 라우트를 e2e가 검증해야 할 때. `e2e-progress.mjs`·`e2e-lesson-note.mjs`·`e2e-today.mjs` 세 곳에 복제됐다.
**Source:** 08-02-SUMMARY.md, 08-06-SUMMARY.md

### G9 이원 계약 (`STATIC_SHELL_PAGES` vs `DYNAMIC_GATED_PAGES`)
정적 전환 페이지는 "주석 제거 후 dynamic export 부재 + 쿠키 식별자 부재"를 검사하고, 동적 유지 페이지는 "force-dynamic 존재"를 검사한다. 페이지를 전환할 때 배열에 한 줄만 추가한다.

**When to use:** 라우트별로 렌더 모드가 갈리는 프로젝트에서 그 경계를 상시 지킬 때. 08-02가 만들고 08-03·08-06이 한 줄씩 추가해 최종 3+2 항목으로 확정됐다.
**Source:** 08-02-SUMMARY.md, 08-06-SUMMARY.md

### `sm:contents` 픽셀 보존 트릭
모바일에서 2행으로 나눠야 하는 그룹을 wrapper로 묶고 `sm:contents`를 주면 640px 이상에서 wrapper가 박스 트리에서 사라져 자식들이 원래의 flat 배치로 정확히 복귀한다.

**When to use:** 모바일만 재배치하고 데스크톱/태블릿 렌더를 픽셀 단위로 보존해야 할 때. `/schedule` 768/1024 관측값이 기준선과 정확히 일치함으로 검증됐다.
**Source:** 08-05-SUMMARY.md

### 브라우저 재계산 아일랜드 (ISR 대체)
정적 셸에 빌드/요청 시점 초기값을 심고, 마운트 후 `useEffect`가 같은 순수 로직으로 재계산해 다르면 갱신한다. ISR의 "창 만료 후 첫 요청이 낡은 값을 받는" 구멍을 구조적으로 없앤다.

**When to use:** 페이지 대부분이 정적 파생값이고 날짜 의존 배지 하나만 신선해야 할 때. `dday-countdown-live.tsx`가 원조이며 렌더는 기존 표현 컴포넌트에 위임한다.
**Source:** 08-06-SUMMARY.md

### rAF 스크롤 스로틀 + 값-불변 리렌더 스킵
핸들 변수로 예약 여부를 가드하고, 콜백 안에서 핸들을 비워 다음 이벤트가 다시 예약하게 한다. cleanup에서 `cancelAnimationFrame`으로 언마운트 후 실행을 막고, `setState`는 값이 실제로 바뀔 때만 갱신한다. G22가 이 계약을 상시 검사한다.

**When to use:** `window` 스크롤 리스너를 새로 만들 때 예외 없이.
**Source:** 08-07-SUMMARY.md

### 탭 피드백 CSS 클래스 쌍 (`.card-interactive` / `.tap-feedback`)
두 클래스가 같은 `:active` 변형(`translateY(1px) scale(0.98)`, 100ms)을 공유하고 `prefers-reduced-motion: reduce`에서 함께 꺼진다. 카드·행은 이미 붙어 있던 `.card-interactive`에 규칙만 추가하면 JSX 변경 없이 피드백을 얻는다.

**When to use:** 누를 수 있는 표면이 여러 컴포넌트에 흩어져 있고 사이트 전체가 하나의 탭 감각을 내야 할 때.
**Source:** 08-07-SUMMARY.md

### CSS 전용 순차 등장 (stagger)
인라인 `--reveal-index` 커스텀 프로퍼티 + `animation-delay: calc(var(--reveal-index) * 80ms)`. 애니메이트 대상은 `opacity`/`transform`만.

**When to use:** 항목이 소수(3장 내외)일 때만. 35행짜리 목록에 걸면 마지막 행이 2.8초 뒤에 나타나므로 제외한다.
**Source:** 08-07-SUMMARY.md

### 스켈레톤은 실제 컴포넌트의 치수 클래스를 그대로 공유한다
`CompleteButtonSkeleton`은 `min-h-11`/`rounded-lg`/`border`를, `NotepadSkeleton`은 `.note-sheet`/`.note-handle`을 실제 컴포넌트와 공유한다.

**When to use:** fetch 지연 구간이 생기는 모든 자리. 레이아웃 시프트를 눈으로 맞추지 않고 코드 레벨에서 구조적으로 없앤다.
**Source:** 08-03-SUMMARY.md

### 클라이언트 컴포넌트의 매니페스트 격리
`'use client'` 전환 시 Velite 매니페스트 조회(`getLessonsByModule`, `getModulesByStep`)를 페이지 레벨로 끌어올리고 `lessons`/`moduleCount`/`lessonCount` prop만 넘긴다.

**When to use:** 서버 컴포넌트를 클라이언트로 전환할 때마다. 매니페스트가 클라이언트 번들에 끌려오는 것을 막는다.
**Source:** 08-02-SUMMARY.md, 08-06-SUMMARY.md

### e2e 런타임 게이트 전용 포트 순차 할당
3212(typography) · 3213(mobile-overflow) · 3214(perf-budget) — 다음 신규 게이트는 3215부터.

**When to use:** 새 e2e 게이트를 추가할 때. 병렬 실행 시 포트 충돌을 방지한다. Windows에서는 `killServerTree`(`taskkill /T /F`)를 함께 쓸 것 — `child.kill()`만으로는 `shell:true` 자식이 남는다.
**Source:** 08-01-SUMMARY.md, 08-07-SUMMARY.md

---

## Surprises

### `/curriculum`이 정적 대조군 `/about`보다 TTFB가 낮게 나왔다
로컬 프로덕션 빌드에서 `/curriculum` 1.60ms, `/about` 3.00ms.

**Impact:** 판정에 영향은 없지만(둘 다 통과), 로컬 측정이 노이즈 지배적이라는 것을 보여주는 신호였다 — 이후 프로덕션 실측을 최종 근거로 삼는 결정으로 이어졌다.
**Source:** 08-06-SUMMARY.md

### 폰트 하나가 첫 방문 전송량의 76%였다
2,697,213 bytes 중 `.woff2`가 2,057,688 bytes(76.29%). D8-B 임계값(30%)의 2.5배.

**Impact:** 서브셋 진행 여부에 대한 논의 자체가 불필요해졌다 — 측정 한 번이 판단을 대신했다.
**Source:** 08-01-SUMMARY.md, 08-FONT-DECISION.md

### 현대 한글 전체를 넣은 서브셋이 겨우 15%만 줄었다
11,172자 포함 시 1,739,856 bytes(-15.45%), 2,350자로 좁히자 448,384 bytes(-78.21%).

**Impact:** "안전하게 넓게 잡자"는 직관이 정확히 반대 결과를 냈다. 폴백 스택 + 커버리지 게이트라는 안전망이 이미 있었으므로 넓게 잡을 이유도 없었다.
**Source:** 08-04-SUMMARY.md

### 정적 전환 후 로컬 TTFB가 6.00 → 6.10ms로 "나빠졌다"
`/step/1` 기준. 반면 `/lesson/*`은 6.50 → 2.50ms로 뚜렷이 개선됐다.

**Impact:** 같은 종류의 변경인데 라우트마다 방향이 갈렸다 — 로컬 숫자로 성패를 판정하지 않기로 하고 프로덕션 실측까지 판단을 유보하는 계기가 됐다.
**Source:** 08-02-SUMMARY.md, 08-03-SUMMARY.md

### `e2e-progress.mjs` g4 시나리오가 08-03 이후 계속 깨진 채 아무도 몰랐다
더미 자격증명 실행이 항상 앞 시나리오(i2)에서 먼저 멈춰 g4까지 도달한 적이 없었다. 08-08의 첫 실 자격증명 실행에서 드러났다.

**Impact:** "게이트가 있다"와 "게이트가 실행된다"는 다른 이야기라는 것. 커밋 `8598ef8`로 수정.
**Source:** 08-MEASUREMENTS.md 표 5

### `hidden sm:inline` 한 줄이 아이패드 관측값을 회귀시켰다
숨기려던 텍스트를 span으로 감싼 순간 그 span이 새 측정 대상이 되어 768/1024 M3가 11 → 16.

**Impact:** 반응형 게이트를 쓸 때 "숨기는 방법"이 지표를 바꾼다는 것을 실측으로 확인했다. leaf 개수를 바꾸지 않는 `flex-col`/`flex-row` 전환으로 교체.
**Source:** 08-05-SUMMARY.md

### D-day 정규식이 `D-34`를 `D-02`로 잘못 읽었다
문서 전체 대상 `/D-(\d+|DAY)/`가 페이지 어딘가의 무관한 문자열에 먼저 매칭됐다.

**Impact:** 검증 스크립트 자체가 거짓 통과/거짓 실패를 낼 수 있다는 것. 마커 뒤 600자 윈도우로 좁혀 해결.
**Source:** 08-06-SUMMARY.md

### 서브셋 이후 총 전송 바이트가 오히려 늘었다 (1,080,563 → 1,529,310)
폰트 절대량은 448,384 bytes로 고정인데, 08-07의 인터랙션 레이어와 최종 프로덕션 빌드 구성 변화로 다른 자산이 늘었다. 폰트 비중만 41.50% → 29.32%로 내려갔다.

**Impact:** "비중이 내려갔다"와 "전송량이 줄었다"가 같은 말이 아니라는 것 — 종합 표에 두 숫자를 함께 남긴 이유다.
**Source:** 08-MEASUREMENTS.md 표 2

### 게이트 20종이 초록불인 상태에서 실기기 결함이 나왔다
사용자가 아이폰에서 헤더 내비 3줄 접힘(화면 위쪽 1/4 잠식)을 발견. 게이트 수정 후 M3가 라우트당 정확히 −1씩(총 126 → 120) 줄었다.

**Impact:** 게이트가 잡은 것과 사람이 느낀 것의 크기가 정반대였다 — 자동 측정으로는 위반 1건이지만 실사용에서는 가장 큰 결함이었다. Phase 6 교훈(D8-L)이 두 번째로 확인됐다.
**Source:** 08-08-SUMMARY.md, 08-MEASUREMENTS.md 표 4

### 8개 플랜 전부가 30~55분 안에 끝났고 코드 이탈(deviation)이 거의 없었다
auto-fixed 이슈 총 6건은 전부 Rule 1(버그)이었고 전부 커밋 전 자체 검증에서 잡혀 히스토리에 남지 않았다. 계획 대비 스코프 확장은 0건.

**Impact:** 페이즈 앞단(08-01)에 게이트를 먼저 세워 목표 상태를 코드로 고정한 설계가, 뒤따르는 7개 플랜의 판단 비용을 실제로 줄였다는 증거로 볼 수 있다.
**Source:** 08-01~08-08-SUMMARY.md의 Deviations 섹션 전체
