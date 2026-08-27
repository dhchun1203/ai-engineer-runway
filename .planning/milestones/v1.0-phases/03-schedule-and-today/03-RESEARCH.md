# Phase 3: 학습 일정과 오늘의 학습 - Research

**Researched:** 2026-08-24
**Domain:** Deterministic build-time schedule generation + timezone-aware "오늘" 렌더링, 기존 Next.js/Supabase 정적 셸 + 진도 오버레이 아키텍처 확장 (신규 외부 의존성 없음)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-31:** **전 레슨 예상 소요시간 일괄 하향** — 심화 일반 레슨 270→**150min(2.5h)**, 개요 일반 레슨 180→**90min(1.5h)**, 프로젝트 준비 가이드(심화 150·개요 120)→**60min(1h)**. 총 131h→**70h**. 근거: 이 사이트의 목적은 사전학습(훑기+기초 다지기)이지 마스터가 아님 (사용자 명시). 35개 레슨 mdx의 `estimatedMinutes` 프론트매터를 이 기준으로 갱신하는 작업이 Phase 3에 포함됨 — **Reversibility:** costly — 이 수치는 Phase 4~5 레슨 본문 집필 분량의 기준이 되므로, 콘텐츠 집필 후 변경하면 35+ 레슨 본문과 일정 전체 재작업
- **D-32:** **하루 1레슨 고정 배정** — 8/25부터 커리큘럼 순서(Step→모듈→order)대로 35개 레슨을 35일간 하루 하나씩 배정, 하루 1~2.5h(평균 2h)로 "하루 3시간 이내" 기준 충족. 레슨 분할 없음, 하루 1레슨이므로 모듈 경계 자동 존중
- **D-33:** **일정은 빌드 타임 고정(정적)** — 날짜→레슨 매핑은 코드/빌드에서 결정론적으로 생성되며 진도에 따라 움직이지 않음. 밀리면 behind 표시만. 동적 리밸런싱(CONV-03)은 v2
- **D-34:** **9/29는 복습·버퍼일** — 레슨 배정 없는 날로 일정표에 명시(밀린 분량 소화·복습 용도 안내), 9/30 개강 D-day 행으로 일정표 마무리
- **D-35:** ROADMAP 성공 기준 1의 "하루 4~6시간 범위"는 이 결정으로 **"하루 3시간 이내(평균 약 2h)"로 대체**됨 — 사용자가 페이스 기준을 직접 변경함. ROADMAP.md 성공 기준 문구 갱신 필요 (PROJECT.md의 "하루 4~6시간 투자 가능" 가정도 동일 취지로 완화)
- **D-36:** **홈(/) 자체를 '오늘의 학습'으로 재편** — D-day 카운트다운, 오늘 배정 레슨(완료 상태·바로가기), 페이스 상태, 기존 전체 진행률 요약 블록(D-25 예고대로 흡수) 포함. Step 카드 대시보드는 **/curriculum**으로 이동하고 글로벌 내비 "커리큘럼"이 그리로 연결, "오늘의 학습"은 /, "일정표"는 신설 라우트로 연결되어 내비 4항목(D-09) 전부 활성화 — **Reversibility:** costly — 라우팅·내비·홈 구성이 전면 재배치되므로 되돌리면 Phase 2 홈 구조 복원 필요
- **D-37:** **일정은 공개, 진도만 게이트** — 일정표·오늘 배정 레슨·D-day는 정적 정보로 쿠키 없이도 공개(공개 포트폴리오 D-14 유지). 완료 체크·진행률·on-track/behind 등 진도 파생 UI는 시크릿 쿠키 보유 시에만 렌더 (D-20 원칙 유지)
- **D-38:** 오늘 배정 레슨을 모두 완료했거나 앞서 있으면 **축하 메시지 + 내일 레슨 미리보기** 표시, 원하면 내일 레슨으로 이동 가능 (자동 유도·강요 없음)
- **D-39:** behind일 때 오늘 배정 레슨 아래 **"밀린 레슨" 섹션 별도 표시** — 미완료 과거 배정분을 나열해 따라잡기 대상을 명확히
- **D-40:** **시간 가중 판정** — 기준일까지 배정된 레슨의 estimatedMinutes 합 vs 완료된 배정 레슨의 minutes 합으로 판정 (D-26에서 예고한 Phase 3 몫 이행)
- **D-41:** **판정 기준일은 "어제까지 배정분"** — 오늘 배정 레슨은 판정에서 제외(오늘 안에 하면 되는 분량). 어제까지 배정분을 모두 완료했으면 on-track, 오늘 이후 배정분까지 완료했으면 ahead
- **D-42:** **3단계 상태: ahead(앞서감) / on-track(순항) / behind(밀림)** — 앞서 있을 때 긍정 피드백 제공
- **D-43:** behind 표현은 **정량 + 가벼운 따라잡기 안내** — "약 N시간 분량(레슨 M개) 밀림" + "하루 30분씩 추가하면 K일이면 따라잡아요" 수준의 안내 문구. 압박이 아닌 안내 톤
- **D-44:** **주 단위(1~6주차) 세로 리스트** — 주차 그룹 아래 날짜별 행. iPad 세로/가로 모두 무난한 스크롤 동선
- **D-45:** 행은 **한 줄 요약형** — 날짜 · 레슨명 · 소요시간 · 깊이 배지 · 완료 체크(쿠키 보유 시)를 한 줄에, 행 전체가 레슨 링크(터치 타깃 44px+)
- **D-46:** **지난 날짜 완료 반영 + 오늘 강조** — 지난 날짜는 완료/미완료 표시(쿠키 보유 시)와 톤 다운, 오늘 행은 accent 강조, 페이지 진입 시 오늘 위치로 자동 스크롤

### Claude's Discretion

- "오늘" 판정의 시간대 기준 — **Asia/Seoul 고정** 권장 (사용자 1인·한국 거주). 정적 페이지 위에서 오늘 날짜를 반영하는 렌더링 전략(클라이언트 계산 vs 동적 렌더링)은 리서치·플래너 판단
- 일정 생성 방식 세부 — 빌드 타임 결정론적 생성이면 형태 자유 (매니페스트에서 파생 계산 권장, 35개 수동 매핑 하드코딩 지양)
- 오늘의 학습·일정표의 레이아웃 디테일, 주차 라벨 문구, D-day·페이스 배지의 시각 디자인 (Phase 1 디자인 토큰·Step accent D-04 준수)
- 따라잡기 안내 문구의 구체 계산식과 표현
- /curriculum 이동 시 기존 홈 컴포넌트(progress-summary, step-card) 재배치 세부

### Deferred Ideas (OUT OF SCOPE)

- 놓친 날짜 발생 시 남은 일정 자동 리밸런싱 — v2 (CONV-03, REQUIREMENTS.md에 이미 등재)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCHED-01 | 2026-08-25 ~ 09-29, 하루 4~6시간 기준(D-35로 "하루 3시간 이내" 대체)의 일자별 학습 일정표(날짜 → 레슨 매핑)가 제공된다 | `src/lib/schedule.ts` 순수 함수 설계(Pattern 2) + 36행(35레슨일+1버퍼일) 구조 확인 + `Date.UTC` 기반 오프바이원 회피(Pitfall 1) |
| SCHED-02 | "오늘의 학습" 뷰가 오늘 배정된 레슨과 완료 상태를 보여주며, 사이트의 기본 랜딩 화면이 된다 | 기존 `force-dynamic` + `hasUnlockCookie()` 게이트 패턴 재사용(Pattern 1) + `today.ts`로 오늘 행 조회 |
| SCHED-03 | 레슨마다 예상 소요시간이 표시되고, 일정은 소요시간 기반으로 배분된다 | D-31 수치 재검증 완료(Summary) + `EstimatedTime`/`velite.config.ts` 스키마 재사용 + Wave 0 갭에 합계 검증 스크립트 |
| SCHED-04 | 개강일(9/30) D-day 카운트다운과 진도 기준 on-track/behind 상태가 표시된다 | `daysUntil()` 함수(Code Examples) + `pace.ts` 3분기 알고리즘(Pattern 2, Pitfall 3) |
</phase_requirements>

## Summary

Phase 3는 새 라이브러리를 들여오는 phase가 아니라 **기존 아키텍처 패턴을 반복 적용**하는 phase다. 홈(`/`)은 이미 Phase 2에서 `export const dynamic = "force-dynamic"` + 무조건 `hasUnlockCookie()` 호출 패턴으로 동적 렌더링되고 있으므로, "오늘 날짜"라는 새 동적 축을 추가하는 데 PPR이나 `dynamicIO` 같은 별도 메커니즘이 필요 없다 — 이미 매 요청마다 서버에서 렌더링되는 페이지에 `new Date()`/`Intl.DateTimeFormat` 호출을 하나 더 추가하면 된다. 신설되는 `/schedule` 페이지도 동일 패턴(쿠키 무조건 확인 → force-dynamic)을 그대로 복제한다.

핵심 계산 로직(일정 생성, D-day, 페이스 판정)은 `src/lib/progress-math.ts`와 동일한 컨벤션 — **의존성 0의 순수 함수, `node:assert`로 직접 검증** — 으로 짜야 한다. 이 컨벤션은 이미 `scripts/check-progress-math.mjs`로 확립되어 있고, 신규 devDependency(Jest/Vitest 등) 없이 그대로 재사용 가능하다.

타임존 처리는 Asia/Seoul이 **1988년 이후 서머타임 없이 UTC+9 고정**이라는 사실 때문에 예상보다 훨씬 단순하다 — `date-fns-tz`/`luxon` 같은 타임존 라이브러리 설치가 불필요하고, `Intl.DateTimeFormat(..., { timeZone: 'Asia/Seoul' })`(플랫폼 내장, Node 어디서나 동작)만으로 "오늘"의 한국 날짜를 안전하게 구할 수 있다. 단, 일정표의 36개 날짜 배열 자체를 생성할 때는 로컬 타임존에 의존하는 `new Date('2026-08-25')` 파싱을 피하고 `Date.UTC(...)` 기반 산술을 써야 한다 (Pitfall 1 참조) — 이는 "오늘이 며칠인지" 판정과는 별개의, 순수 캘린더 날짜 배열 생성 문제다.

**콘텐츠 수치 재확인 (D-31 검증):** 이 세션에서 35개 레슨 mdx 프론트매터를 전수 grep한 결과, D-31이 명시한 "270→150 / 180→90 / 150,120→60, 총 131h→70h" 하향안은 정확히 일치한다: 심화·비프로젝트 20개(270→150), 심화·프로젝트가이드 2개(150→60), 개요·비프로젝트 10개(180→90), 개요·프로젝트가이드 3개(120→60) — 신규 합계 정확히 4,200분(70h). 하루 1레슨 배정 시 요일별 소요시간은 60/90/150분(1h/1.5h/2.5h)만 존재해 D-32의 "하루 1~2.5h" 주장과 정확히 일치한다.

**Primary recommendation:** 새 패키지를 설치하지 말 것. `src/lib/schedule.ts`(날짜→레슨 순수 매핑), `src/lib/pace.ts`(시간 가중 판정 순수 함수), `src/lib/today.ts`(Asia/Seoul "오늘" 문자열 1개 함수)를 `progress-math.ts` 스타일로 신설하고, 기존 `force-dynamic` + 쿠키 게이트 패턴을 `/`와 `/schedule`에 재사용하라.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 날짜→레슨 배정 (일정 생성) | Frontend Server (Next.js build/RSC) | Content 매니페스트 (Velite `#site/content`) | 결정론적 순수 계산(D-33), DB 저장 불필요 — `getOrderedLessons()` 산출물을 입력으로 받는 순수 함수 |
| "오늘" 날짜 판정 | Frontend Server (RSC, per-request) | — | Asia/Seoul 타임존은 클라이언트 로컬 시각에 의존하면 안 됨(사용자가 다른 타임존 기기로 접속해도 "오늘"은 KST 기준이어야 함) — 서버에서 고정 타임존으로 계산 |
| D-day 카운트다운 | Frontend Server (RSC) | — | "오늘" 판정에 의존하는 파생값, 클라이언트 상태 불필요 |
| 완료 상태 조회 | API/Backend (Supabase `progress` 테이블) | Frontend Server (오버레이 조합) | 기존 Phase 2 패턴 그대로 — `readCompletedLessonIds()` |
| 페이스(on-track/behind/ahead) 판정 | Frontend Server (RSC) | Database (completed_at 원자료) | 순수 계산이지만 입력(완료 집합)이 DB 유래이므로 진도 게이트(D-37) 적용 대상 |
| 일정표·오늘 배정 레슨 표시(공개 부분) | Frontend Server (RSC, 쿠키 무관) | Static Content (Velite) | D-37: 일정 자체는 공개 정보 — 쿠키 확인은 "완료 뱃지를 보여줄지"만 결정, 데이터 자체를 숨기지 않음 |
| 완료 체크·진행률·페이스 상태 UI | Frontend Server (RSC, 쿠키 게이트) | — | D-37: 진도 파생 UI만 시크릿 쿠키 보유 시 렌더 |

## Standard Stack

### Core

이 phase는 **신규 런타임 의존성을 추가하지 않는다.** 기존 스택을 그대로 사용:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js (App Router) | 16.3.2 [VERIFIED: package.json:15] | 정적 콘텐츠 + 요청 시 동적 오버레이 렌더링 | 이미 프로젝트 표준(`.claude/CLAUDE.md`), Phase 1·2에서 검증된 패턴 재사용 |
| `Intl.DateTimeFormat` (Node/JS 내장) | 플랫폼 내장, 버전 없음 | Asia/Seoul 타임존 기준 "오늘" 계산 | 외부 패키지 0개로 타임존 안전 변환 가능 — Node 런타임이면 어디서든(로컬/Vercel) 동작 [CITED: MDN Intl.DateTimeFormat] |

### Supporting

없음 — 이 phase는 순수 계산 로직(`schedule.ts`, `pace.ts`, `today.ts`)과 UI 컴포넌트만 추가하며, 전부 기존 스택(TypeScript, Tailwind, 기존 컴포넌트)으로 충분하다.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Intl.DateTimeFormat({ timeZone: 'Asia/Seoul' })` | `date-fns-tz`, `luxon`, `dayjs` + timezone plugin | 불필요한 추가 의존성 — Asia/Seoul이 서머타임 없는 고정 UTC+9라서(1988년 이후) 타임존 라이브러리가 해결하는 "서머타임 전환 시점 버그" 문제 자체가 이 프로젝트엔 존재하지 않음. 다국가 지원이 필요해지면(범위 밖) 그때 재검토 |
| 결정론적 빌드타임 계산(`schedule.ts` 순수 함수) | 일정을 Supabase 테이블에 저장 | ARCHITECTURE.md Anti-Pattern 1과 동일한 이유로 기각 — 일정은 콘텐츠 매니페스트에서 파생되는 정적 구조이지 가변 런타임 상태가 아님(D-33) |
| `node:assert` 스크립트 검증 | Jest/Vitest 설치 | 기존 `check-progress-math.mjs` 컨벤션과 불일치, 신규 devDependency 불필요 — 이 프로젝트 전체가 "의존성 0 순수 함수 + node:assert" 패턴을 이미 확립함 |

**Installation:**
```bash
# 신규 설치 없음 — 기존 package.json 그대로 사용
```

## Package Legitimacy Audit

**이 phase는 외부 패키지를 설치하지 않는다.** `npm install` 대상이 없으므로 legitimacy 게이트 실행 대상도 없다.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| *(없음)* | — | — | — | — | — | N/A — 신규 패키지 설치 없음 |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  Content Layer (build-time, 변경 없음)                                │
│  src/content/modules.ts (Step/Module + isProject)                    │
│  src/content/lessons/**/*.mdx (estimatedMinutes 값만 D-31로 하향)      │
│         │ getOrderedLessons() via curriculum-helpers.ts               │
└─────────┼──────────────────────────────────────────────────────────┘
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  신규 순수 계산 계층 (src/lib/, 의존성 0, node:assert로 검증)            │
│                                                                        │
│  today.ts        schedule.ts              pace.ts                    │
│  "오늘"(KST)  →  orderedLessons + START_DATE  →  scheduleRows +       │
│  문자열 1개       → scheduleRows[]              completedIds +        │
│                    { date, lessonSlug|null,      todayStr             │
│                      isBuffer, isToday }        → { status: ahead|    │
│                                                     on-track|behind,   │
│                                                     gapMinutes,        │
│                                                     missedLessons }    │
└─────────┬──────────────────────────────────────────────────────────┘
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Next.js RSC 레이어 (기존 force-dynamic + 쿠키 게이트 패턴 재사용)        │
│                                                                        │
│  app/page.tsx (재편: "오늘의 학습")   app/schedule/page.tsx (신설)      │
│  - hasUnlockCookie() 무조건 먼저 호출  - 동일 게이트 순서               │
│  - 공개: 오늘 배정 레슨, D-day        - 공개: 36행 전체 일정표          │
│  - 게이트: 완료 체크, 페이스 상태      - 게이트: 완료 표시              │
│                                                                        │
│  app/curriculum/page.tsx (신설, 기존 홈 Step 그리드 이동)               │
└─────────┬──────────────────────────────────────────────────────────┘
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Supabase progress 테이블 (변경 없음)                                  │
│  lesson_id text PK, completed_at timestamptz                         │
│  [VERIFIED: supabase/migrations/20260824120000_create_progress.sql]  │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── lib/
│   ├── today.ts            # 신설 — Asia/Seoul "오늘" YYYY-MM-DD 1개 함수, 의존성 0
│   ├── schedule.ts         # 신설 — 날짜→레슨 순수 매핑, 의존성 0 (progress-math.ts 스타일)
│   ├── pace.ts             # 신설 — on-track/behind/ahead 시간 가중 판정, 의존성 0
│   ├── progress-math.ts    # 기존, 변경 없음
│   └── progress.ts         # 기존 — schedule.ts/pace.ts는 이 파일과 나란히, curriculum-helpers 경유 원칙 동일
├── app/
│   ├── page.tsx             # 재편 — "오늘의 학습" (D-36)
│   ├── curriculum/
│   │   └── page.tsx         # 신설 — 기존 page.tsx의 Step 그리드 콘텐츠 이동
│   ├── schedule/
│   │   └── page.tsx         # 신설 — 36행 일정표
│   ├── lesson/[lessonId]/   # 기존, 변경 없음
│   └── step/[stepId]/       # 기존, 변경 없음
├── components/
│   ├── today-lesson-card.tsx    # 신설 — 오늘 배정 레슨 + 완료 상태 + 바로가기
│   ├── dday-countdown.tsx       # 신설 — D-day 배지
│   ├── pace-status.tsx          # 신설 — ahead/on-track/behind 표시 + 안내 문구
│   ├── behind-lessons-list.tsx  # 신설 — "밀린 레슨" 섹션 (D-39)
│   ├── schedule-table.tsx       # 신설 — 주 단위 세로 리스트 (D-44)
│   ├── estimated-time.tsx       # 기존 — 그대로 재사용
│   ├── depth-badge.tsx          # 기존 — 그대로 재사용
│   └── progress-badge.tsx       # 기존 — 그대로 재사용
└── content/
    └── lessons/**/*.mdx    # estimatedMinutes 값만 일괄 수정 (D-31), 스키마 불변
```

### Pattern 1: 기존 force-dynamic + 쿠키 게이트를 새 라우트에 복제

**What:** `/`와 신설 `/schedule`은 둘 다 `export const dynamic = "force-dynamic"`을 선언하고, 어떤 조회보다 먼저 `hasUnlockCookie()`를 무조건 호출한 뒤, 그 불리언으로 진도 파생 UI(완료 체크·페이스 상태)만 조건부 렌더한다. 일정 자체(날짜·레슨명·소요시간·D-day)는 쿠키 여부와 무관하게 항상 렌더한다(D-37).
**When to use:** 정적이어야 할 콘텐츠와 요청별 상태(쿠키/오늘 날짜)가 한 페이지에 공존할 때 — 이 프로젝트의 모든 페이지가 이미 이 형태.
**Example (기존 `src/app/page.tsx` 패턴 그대로 복제):**
```typescript
// Source: src/app/page.tsx (기존 코드, 그대로 재사용할 패턴) [VERIFIED: src/app/page.tsx:9-21]
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const unlocked = await hasUnlockCookie(); // 무조건, 어떤 조회보다 먼저
  const progressRead = unlocked ? await readCompletedLessonIds() : null;
  const completedIds = progressRead?.ok ? progressRead.completedIds : null;

  const today = todayInSeoul(); // 신규 today.ts
  const rows = buildSchedule(getOrderedLessons(), SCHEDULE_START, SCHEDULE_DAYS); // 신규 schedule.ts
  const todayRow = rows.find((r) => r.date === today) ?? null;

  // 일정 데이터(todayRow)는 completedIds 유무와 무관하게 항상 사용 가능(D-37).
  // completedIds가 null이면 완료 체크·페이스 UI만 생략한다.
}
```

### Pattern 2: 순수 함수 3분할 — today / schedule / pace

**What:** `progress-math.ts`가 "완료 집합 + slug 목록 → 집계"만 하고 DB/매니페스트를 모르듯, `schedule.ts`/`pace.ts`도 매니페스트나 Supabase를 직접 import하지 않고 순수 입력(정렬된 레슨 배열, 완료 집합, 오늘 날짜 문자열)만 받는다.
**When to use:** 이 프로젝트의 모든 계산 로직 — 재사용성과 `node:assert` 단위 테스트 용이성을 위해.
**Example:**
```typescript
// src/lib/today.ts — 의존성 0. import 문을 쓰지 않아 progress-math.ts처럼 Node가 트랜스파일러 없이 로드 가능.
export function todayInSeoul(now: Date = new Date()): string {
  // en-CA 로케일은 YYYY-MM-DD 순서로 포맷한다 — Asia/Seoul은 1988년 이후
  // 서머타임이 없는 고정 UTC+9라, 이 변환에 타임존 라이브러리가 필요 없다.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now);
}
```
```typescript
// src/lib/schedule.ts — 의존성 0.
export type ScheduleRow = {
  date: string;          // YYYY-MM-DD
  lessonSlug: string | null; // null = 배정 없음 (버퍼일)
  isBuffer: boolean;
};

export function buildSchedule(
  orderedSlugs: readonly string[], // getOrderedLessons().map(l => l.slug) — 매니페스트 직접 import 금지
  startDateISO: string,            // "2026-08-25"
  totalDays: number,               // 36 (35 레슨일 + 1 버퍼일)
): ScheduleRow[] {
  const [y, m, d] = startDateISO.split('-').map(Number);
  const rows: ScheduleRow[] = [];
  for (let i = 0; i < totalDays; i++) {
    // Date.UTC 기반 산술 — new Date('YYYY-MM-DD') 로컬 파싱의 오프바이원 함정을 피한다 (Pitfall 1).
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const dateStr = dt.toISOString().slice(0, 10);
    const lessonSlug = i < orderedSlugs.length ? orderedSlugs[i] : null;
    rows.push({ date: dateStr, lessonSlug, isBuffer: lessonSlug === null });
  }
  return rows;
}
```
```typescript
// src/lib/pace.ts — 의존성 0. D-40~D-43 구현.
export type PaceStatus = 'ahead' | 'on-track' | 'behind';
export type PaceResult = {
  status: PaceStatus;
  gapMinutes: number;      // behind일 때만 > 0
  missedSlugs: string[];   // behind일 때 "밀린 레슨" 목록 (D-39)
};

export function computePace(
  rows: readonly { date: string; lessonSlug: string | null }[],
  minutesBySlug: ReadonlyMap<string, number>, // slug -> estimatedMinutes
  completedIds: ReadonlySet<string>,
  todayStr: string,
): PaceResult {
  const pastRows = rows.filter((r) => r.lessonSlug !== null && r.date < todayStr);
  const assignedThroughYesterday = pastRows.reduce(
    (sum, r) => sum + (minutesBySlug.get(r.lessonSlug!) ?? 0), 0,
  );
  const completedThroughYesterday = pastRows
    .filter((r) => completedIds.has(r.lessonSlug!))
    .reduce((sum, r) => sum + (minutesBySlug.get(r.lessonSlug!) ?? 0), 0);

  const missedSlugs = pastRows
    .filter((r) => !completedIds.has(r.lessonSlug!))
    .map((r) => r.lessonSlug!);

  if (completedThroughYesterday < assignedThroughYesterday) {
    return { status: 'behind', gapMinutes: assignedThroughYesterday - completedThroughYesterday, missedSlugs };
  }

  // 양의 minutes 값만 존재하므로(min 60) completedThroughYesterday === assignedThroughYesterday는
  // "어제까지 배정분 전부 완료"와 수학적으로 동치 — D-41의 불리언 조건과 일치한다.
  const completedAllMinutes = rows
    .filter((r) => r.lessonSlug !== null && completedIds.has(r.lessonSlug))
    .reduce((sum, r) => sum + (minutesBySlug.get(r.lessonSlug!) ?? 0), 0);

  if (completedAllMinutes > assignedThroughYesterday) {
    return { status: 'ahead', gapMinutes: 0, missedSlugs: [] };
  }
  return { status: 'on-track', gapMinutes: 0, missedSlugs: [] };
}
```

### Anti-Patterns to Avoid

- **`new Date('2026-08-25')`로 일정 배열 생성:** ISO 날짜 문자열(연-월-일만, 시각 없음)은 UTC 자정으로 파싱되지만, 이후 `.getDate()`/`.getMonth()` 같은 **로컬** getter를 호출하면 빌드 서버의 로컬 타임존에 따라 하루 밀리는 버그가 생긴다. `Date.UTC(...)` + `.getUTCDate()`/`.toISOString()`만 사용할 것 (Pattern 2 예시 참조).
- **타임존 라이브러리 설치:** Asia/Seoul은 서머타임이 없는 고정 UTC+9라 `luxon`/`date-fns-tz` 도입은 이 프로젝트에서 해결할 문제가 없는 의존성 추가다.
- **일정을 Supabase에 저장:** D-33이 이미 "빌드 타임 고정"을 결정했다 — `schedule.ts`는 항상 같은 입력(매니페스트+시작일)에 대해 같은 출력을 내는 순수 함수여야 하며, DB 테이블/마이그레이션이 필요 없다.
- **`getLessonBySlug`/`getOrderedLessons` 대신 `#site/content`(Velite 산출물)를 `schedule.ts`/`pace.ts`에서 직접 import:** 기존 `progress.ts`의 명시적 경계(주석: "Velite 콘텐츠 매니페스트 모듈을 직접 import하지 않는다")를 그대로 지킬 것 — `curriculum-helpers.ts` 공개 함수만 경유.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Asia/Seoul "오늘" 계산 | 수동 `Date.getTime() + 9*3600*1000` 오프셋 산술로 "오늘" 판정 | `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })` | 오프셋 하드코딩은 읽는 사람에게 "이거 서머타임 처리했나?"라는 의문을 남긴다 — 플랫폼 API가 타임존 이름으로 의도를 명시하고, 엔진의 IANA 타임존 DB를 그대로 신뢰할 수 있다. (단, 36행 날짜 *배열 생성*은 Pattern 2처럼 `Date.UTC` 캘린더 산술로 하는 게 맞다 — 이건 타임존 변환이 아니라 순수 날짜 덧셈이라 다른 문제) |
| 일정표 캘린더 UI | react-big-calendar류 캘린더 컴포넌트 | 주 단위 세로 리스트(D-44, 순수 HTML 테이블/리스트) | PITFALLS.md Pitfall 6과 동일 결론 — 이 프로젝트는 드래그앤드롭/리밸런싱이 명시적으로 범위 밖(D-33, CONV-03)이라 캘린더 라이브러리가 제공하는 기능의 대부분이 쓰이지 않는다 |

**Key insight:** 이 phase의 "만들지 말아야 할 것"은 새 라이브러리가 아니라 **불필요한 정교함**이다 — 타임존 라이브러리, 캘린더 컴포넌트, DB에 저장되는 동적 일정 전부 이미 확정된 결정(D-33, D-44)에 의해 범위 밖이다.

## Common Pitfalls

### Pitfall 1: `new Date('YYYY-MM-DD')` 로컬 파싱 오프바이원

**What goes wrong:** `new Date('2026-08-25')`는 UTC 자정으로 파싱되지만, 이후 코드가 `.getDate()`나 로케일 포맷터를 로컬 타임존 기준으로 호출하면 빌드 서버(Vercel은 UTC)와 개발자 로컬 머신(KST, UTC+9)의 타임존 차이 때문에 날짜가 하루 밀리거나 당겨질 수 있다.
**Why it happens:** JS의 `Date` API는 "시각(instant)"을 저장할 뿐 "캘린더 날짜"라는 개념이 없다 — 문자열 파싱과 getter 호출이 각각 다른 암묵적 타임존 규칙을 쓴다.
**How to avoid:** 일정 배열 생성은 전 구간 `Date.UTC(y, m-1, d+i)` + `.toISOString().slice(0,10)`만 사용(Pattern 2). "오늘"과의 비교는 문자열(`YYYY-MM-DD`) 사전순 비교로 충분 — 두 값 모두 같은 포맷 규칙으로 생성되면 `Date` 객체로 되돌릴 필요가 없다.
**Warning signs:** 로컬(`next dev`, KST)에서는 통과하는데 Vercel 프리뷰 배포에서 "오늘" 표시가 하루 어긋남.

### Pitfall 2: 프론트매터 일괄 수정 후 Velite 재빌드 누락

**What goes wrong:** 35개 mdx 파일의 `estimatedMinutes`를 스크립트로 일괄 수정해도, `next dev`가 이미 띄워져 있지 않으면 `.velite/` 산출물이 갱신되지 않아 화면엔 여전히 이전 값(270/180/150/120)이 보인다. `scripts/check-manifest.mjs`는 `modules.ts`만 정규식 재파싱하므로 이 값 불일치를 잡아내지 못한다.
**Why it happens:** Velite는 `.mdx` 파일 변경을 감지해 `.velite/` JSON을 재생성하는데, 빌드/dev 서버가 실행 중이 아니면 트리거되지 않는다.
**How to avoid:** 프론트매터 일괄 수정 직후 `npm run build`(또는 `next dev` 재시작)로 Velite 재생성을 강제하고, 화면에서 실제 렌더된 소요시간(예: `2-4-project-ai-shop-frontend` 페이지)이 60분(EstimatedTime 컴포넌트 기준 "약 1시간")으로 바뀌었는지 눈으로 확인.
**Warning signs:** 프론트매터 파일은 수정됐는데 `EstimatedTime` 렌더 결과가 그대로.

### Pitfall 3: 페이스 계산에서 "완료된 배정 레슨"과 "완료된 전체 레슨"을 혼동

**What goes wrong:** D-40의 "완료된 배정 레슨의 minutes 합"을 전체 완료 집합의 minutes 합으로 잘못 구현하면, 사용자가 미래 레슨을 미리 완료했을 때 `behind` 판정이 실제보다 낙관적으로 나오거나(어제까지 배정분이 미완료인데도 전체 합이 커서 ahead로 오판) `ahead` 조건이 아예 발동하지 않을 수 있다.
**Why it happens:** "배정분"이라는 필터가 두 번 다른 기준(어제까지 vs 전체)으로 쓰여야 하는데(Pattern 2의 `assignedThroughYesterday` vs `completedAllMinutes`), 변수명을 통일하다 하나로 합쳐버리기 쉽다.
**How to avoid:** Pattern 2 코드처럼 `pastRows`(어제까지, `date < todayStr`)로 필터링한 합계와 `rows` 전체(버퍼일 제외)로 필터링한 합계를 별도 변수로 유지 — 함수 하나에 두 스코프가 섞이지 않도록 이름을 다르게 준다.
**Warning signs:** UAT 시나리오 "내일 레슨을 미리 완료 → ahead로 표시"가 실패하거나, "어제 레슨을 놓침 → behind"가 실패.

### Pitfall 4: 홈 재편(D-36) 중 `/curriculum`으로 이동한 컴포넌트의 `progress` prop 계약 깨짐

**What goes wrong:** 기존 `src/app/page.tsx`는 `StepCard`에 `progress={completedIds ? stepProgress(...) : undefined}`를 넘긴다. `/curriculum/page.tsx`로 그대로 옮길 때 `hasUnlockCookie()` 호출을 빠뜨리면 `completedIds`가 항상 `null`이 되어 Step 진행률 바가 영구적으로 사라진다.
**Why it happens:** 코드를 옮기면서 "무조건 먼저 호출" 게이트 순서(RESEARCH Pattern 1, D-17/D-18/D-20)를 새 파일에 복제하는 걸 잊기 쉽다.
**How to avoid:** `/curriculum/page.tsx`도 `/`, `/schedule`과 동일하게 `export const dynamic = "force-dynamic"` + `hasUnlockCookie()` 선호출 3줄을 반드시 포함.
**Warning signs:** `/curriculum` 이동 후 Step 카드 진행률 바가 로그인(쿠키) 상태와 무관하게 안 보임.

## Code Examples

### 스케줄 상수 정의 (매니페스트에서 파생, 하드코딩 지양 — CONTEXT.md Claude's Discretion)

```typescript
// src/lib/schedule.ts 상단 — 35개 레슨 수를 하드코딩하지 않고 orderedSlugs.length로 파생.
// SCHEDULE_START만 상수로 고정(D-32: 8/25 시작), totalDays도 orderedSlugs.length + 1(버퍼일)로 계산.
export const SCHEDULE_START = '2026-08-25';
export const COURSE_START_DATE = '2026-09-30'; // D-day 기준일

export function scheduleTotalDays(lessonCount: number): number {
  return lessonCount + 1; // +1 = 9/29 복습·버퍼일 (D-34)
}
```

### D-day 카운트다운 (날짜 문자열만으로 계산, Date 객체 재변환 없음)

```typescript
// src/lib/today.ts에 추가 — 두 YYYY-MM-DD 문자열의 캘린더 일수 차이.
// Date.UTC로 각각 자정 UTC 인스턴트를 만들어 뺄셈 — DST 없는 Asia/Seoul이지만
// 혹시 모를 로컬 타임존 오염을 피하기 위해 항상 UTC 인스턴트로만 계산한다.
export function daysUntil(targetDateISO: string, fromDateISO: string): number {
  const [ty, tm, td] = targetDateISO.split('-').map(Number);
  const [fy, fm, fd] = fromDateISO.split('-').map(Number);
  const targetUTC = Date.UTC(ty, tm - 1, td);
  const fromUTC = Date.UTC(fy, fm - 1, fd);
  return Math.round((targetUTC - fromUTC) / 86_400_000);
}
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 따라잡기 안내 문구 계산식 "하루 30분씩 추가하면 K일이면 따라잡아요"의 K = `Math.ceil(gapMinutes / 30)` | Common Pitfalls / Code Examples 밖, D-43 관련 | CONTEXT.md는 이 계산식을 사용자 직접 결정이 아닌 "Claude's Discretion"으로 남겼다 — 30분/일 상수와 반올림 방식은 discuss-phase 또는 planner 단계에서 확정 필요. 틀려도 UI 문구 수정만으로 복구 가능(비용 낮음) |
| A2 | 주 단위(1~6주차) 그룹은 실제 요일(월~일) 정렬이 아니라 시작일(8/25) 기준 7일 오프셋 그룹 | Architecture Patterns, D-44 | 36일/7일=6그룹으로 D-44의 "1~6주차" 문구와 수치가 맞아떨어져 이 방식을 전제했으나, 사용자가 실제 달력 주(월요일 시작)를 기대했다면 6번째 그룹이 1일짜리로 어색하게 보일 수 있음 — discuss-phase에서 확인 권장 |
| A3 | 온라인 원본 Intl.DateTimeFormat 코드 스니펫(`en-CA` 로케일로 ISO 순서 획득)은 웹 검색 1개 출처만 근거 | Code Examples (today.ts) | MDN 자체 문서로 직접 교차검증하지 않음 — 실제로는 잘 알려진 JS 관용구지만 이 세션에서 MDN 페이지를 직접 열어 확인하지는 않았음. 틀려도 로컬 실행 시 즉시 발견됨(날짜 포맷이 어긋나면 바로 눈에 띔) |

## Open Questions

1. **/curriculum으로 이동 시 ProgressSummary(전체 진행률 블록)를 완전히 제거할지, 축소된 형태로 남길지**
   - What we know: D-36은 "기존 전체 진행률 요약 블록(D-25 예고대로 흡수)"이 오늘의 학습 화면으로 흡수된다고 명시 — `/curriculum`에는 Step별 카드+진행률 바만 남는 것으로 읽힘
   - What's unclear: `/curriculum`에 전체 합산 %(예: "전체 43%")를 요약해서 다시 보여줄지, 아니면 Step 3개 카드의 개별 % 만으로 충분한지
   - Recommendation: CONTEXT.md의 "/curriculum 이동 시 기존 홈 컴포넌트 재배치 세부"가 Claude's Discretion으로 명시돼 있으므로, planner가 "Step 카드 3개 + 개별 progress bar만, 합산 % 텍스트는 생략" 안을 기본값으로 잡고 discuss-phase 후속 질문이 있으면 조정

2. **`missedSlugs`(밀린 레슨)가 매우 많아질 경우(수 주 방치) UI 축약 규칙**
   - What we know: D-39는 "밀린 레슨 섹션 별도 표시"만 요구, 개수 상한은 언급 없음
   - What's unclear: 예를 들어 10개 이상 밀렸을 때 전부 나열할지, "N개 밀림, 상세 보기" 형태로 접을지
   - Recommendation: MVP 범위에서는 전부 나열(리스트가 길어져도 스크롤로 해결) — Behind가 이 정도로 누적되는 것 자체가 예외 상황이므로 접기 UI에 시간을 쓰지 말 것 (PITFALLS.md Pitfall 1/6과 동일한 "플랫폼 폴리싱보다 콘텐츠" 원칙)

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | 없음 — `node:assert/strict` 기반 커스텀 스크립트 (기존 `scripts/check-progress-math.mjs` 컨벤션) [VERIFIED: scripts/check-progress-math.mjs:1-97] |
| Config file | 없음 — Node 22.6+ 타입 스트리핑으로 `.ts` 파일을 트랜스파일러 없이 직접 import (파일 상단 주석 근거) |
| Quick run command | `node scripts/check-schedule.mjs` (신설), `node scripts/check-pace.mjs` (신설) |
| Full suite command | `node scripts/check-manifest.mjs && node scripts/check-progress-math.mjs && node scripts/check-schedule.mjs && node scripts/check-pace.mjs` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCHED-01 | 8/25~9/29 일정표가 정확히 35레슨+1버퍼일로 구성, 각 날짜 유일 | unit | `node scripts/check-schedule.mjs` | ❌ Wave 0 |
| SCHED-02 | 오늘 배정 레슨 조회가 스케줄 배열에서 정확한 행을 찾음(경계값: 시작 전/버퍼일/개강일 이후) | unit | `node scripts/check-schedule.mjs` | ❌ Wave 0 |
| SCHED-03 | 프론트매터 일괄 수정 후 전체 합계가 정확히 4,200분(70h) | unit(수동 grep 또는 스크립트) | `node scripts/check-manifest.mjs`(확장 필요 — estimatedMinutes 합계 검증 추가) | ❌ Wave 0 (기존 스크립트 확장) |
| SCHED-04 | pace.ts의 ahead/on-track/behind 3분기 + gapMinutes 계산 | unit | `node scripts/check-pace.mjs` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** 해당 lib 파일 대상 `node scripts/check-*.mjs` 단독 실행
- **Per wave merge:** 전체 `node scripts/check-*.mjs` 스위트
- **Phase gate:** 전체 스위트 green + UAT(오늘 날짜를 시스템 클록으로 임의 변경해 각 pace 상태 수동 재현 — 이 프로젝트엔 날짜 모킹 라이브러리가 없으므로 `todayInSeoul`에 `now` 파라미터가 주입 가능해야 단위 테스트가 가능함, Code Examples처럼 옵션 인자로 설계할 것)

### Wave 0 Gaps

- [ ] `scripts/check-schedule.mjs` — SCHED-01/02 커버, 경계값 케이스(시작일 이전 날짜 없음, 마지막 레슨일=9/28, 버퍼일=9/29, 총 36행) 포함
- [ ] `scripts/check-pace.mjs` — SCHED-04 커버, ahead/on-track/behind 3케이스 + `missedSlugs` 정확성 + "양의 minutes 값 전제로 sum 비교가 all-done과 동치"라는 Pattern 2 주석의 전제를 실제로 검증하는 케이스(모든 lesson이 min 60분 이상인지 `check-manifest.mjs`가 이미 `estimatedMinutes: s.number().min(1)` [VERIFIED: velite.config.ts:35] 스키마로 보장 — 별도 검증 불필요, 참고만)
- [ ] `scripts/check-manifest.mjs` 확장 — D-31 하향 후 전체 estimatedMinutes 합계(4,200분) 및 심화/개요별 분포(20/2/10/3) 어설션 추가

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | 이 phase는 인증 방식을 변경하지 않음 — 기존 공유 시크릿 쿠키(D-17) 그대로 |
| V3 Session Management | no | 변경 없음 |
| V4 Access Control | yes | D-37의 공개/게이트 분리 자체가 접근 제어 요구사항 — 일정 데이터는 의도적으로 공개, 완료/페이스 데이터만 쿠키로 제한. `hasUnlockCookie()` 재사용(신규 게이트 로직 작성 금지) |
| V5 Input Validation | no (해당 사항 없음) | 이 phase는 사용자 입력을 받지 않음(폼/뮤테이션 없음, 순수 표시 기능) |
| V6 Cryptography | no | 변경 없음 — 쿠키 시크릿 비교는 기존 `unlock-secret.ts`가 처리 |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `/schedule`, `/`(오늘의 학습)가 `hasUnlockCookie()` 호출을 빠뜨려 완료 상태가 쿠키 없이 노출 | Information Disclosure | Pattern 1을 두 라우트 모두에 정확히 복제 — "무조건, 어떤 조회보다 먼저" 순서 준수(기존 페이지들과 동일 순서 검증을 코드 리뷰에서 확인) |
| 프론트매터 일괄 수정 스크립트가 실수로 `depth`/`moduleId` 등 다른 필드까지 건드려 커리큘럼 구조 훼손 | Tampering | 수정 스크립트는 `estimatedMinutes` 필드만 정규식/AST로 좁게 타겟팅, 수정 후 `check-manifest.mjs` 전체 재실행으로 구조 무결성 확인 |

## Sources

### Primary (HIGH confidence — 이 세션에서 직접 읽음)
- `src/app/page.tsx`, `src/components/site-nav.tsx`, `src/content/modules.ts`, `src/content/curriculum-helpers.ts`, `velite.config.ts`, `src/lib/progress-store.ts`, `src/lib/progress-math.ts`, `src/lib/progress.ts`, `src/lib/auth.ts`, `src/components/progress-summary.tsx`, `src/components/step-card.tsx`, `src/components/module-accordion.tsx`, `src/components/estimated-time.tsx`, `src/components/depth-badge.tsx`, `src/components/progress-badge.tsx`, `src/app/globals.css`, `supabase/migrations/20260824120000_create_progress.sql`, `scripts/check-progress-math.mjs`, `package.json`, 전체 35개 레슨 mdx 프론트매터(grep) — 전부 이 세션 내 Read/Bash로 직접 확인
- `.planning/phases/03-schedule-and-today/03-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`

### Secondary (MEDIUM confidence)
- Context7 `/vercel/next.js` v16.2.9 — `force-static`/`force-dynamic`, legacy prerender에서 `cookies()`/`Date()` 호출 시 `DynamicServerError` 발생 메커니즘, 요청 데이터 의존 날짜는 서버에서 포맷하라는 공식 가이드
- Web search — `Intl.DateTimeFormat` timeZone 옵션으로 특정 IANA 타임존의 오늘 날짜 획득 (MDN 등 검색 결과 기반)
- Web search — 대한민국은 1988년 이후 서머타임 미시행, 연중 고정 UTC+9 (Wikipedia "Time in South Korea" 등 검색 결과 기반)

### Tertiary (LOW confidence)
- 없음

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — 신규 의존성이 없고 기존 스택 재사용만 확인하면 되는 phase라 검증이 단순함
- Architecture: HIGH — 기존 코드(force-dynamic 패턴, progress-math.ts 컨벤션)를 직접 읽고 확장한 것이라 추측 요소가 적음
- Pitfalls: MEDIUM — 타임존/날짜 산술 함정은 잘 알려진 패턴이지만 이 특정 코드베이스에서의 재현은 실제 구현 후에야 확정 검증 가능

**Research date:** 2026-08-24
**Valid until:** 2026-09-07 (약 2주 — Next.js 마이너 업데이트나 프로젝트 결정 변경 가능성 고려, 다만 이 phase는 프레임워크 의존도가 낮아 실질적으로 더 오래 유효할 가능성 높음)
