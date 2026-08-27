# Phase 2: 진도 체크와 진행률 - Research

**Researched:** 2026-08-24
**Domain:** Server-only progress persistence (Next.js 16 App Router + Supabase Postgres) behind a shared-secret cookie, no Supabase Auth
**Confidence:** MEDIUM-HIGH (Next.js/Supabase mechanics verified via Context7 official docs this session; project-specific composition is reasoned from those verified facts)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-17 (공유 시크릿 쿠키 방식):** 진도의 모든 읽기/쓰기는 서버(Server Component / Server Action)에서만 수행하고, Supabase 접근 키는 클라이언트에 절대 노출하지 않는다. 진도는 단일 고정 사용자 행으로 저장되어 기기 간 동기화가 보장된다. Supabase Auth(익명 세션 포함)는 사용하지 않는다 — 익명 세션은 기기마다 ID가 달라져 성공 기준 1(기기 전환 유지)과 충돌함. RLS는 심층 방어로 모든 테이블에 켜두되 앱 로직은 `auth.uid()`에 의존하지 않는다 (PITFALLS.md "even simpler alternative" 채택). **주의:** `.claude/CLAUDE.md` 스택 가이드의 "익명 로그인(signInAnonymously) 권장"은 이 결정으로 **대체**된다. — Reversibility: costly.
- **D-18 (콘텐츠 공개 + 진도만 보호):** 레슨·커리큘럼·Making-of는 누구나 읽을 수 있다. 진행률·완료 체크 UI와 데이터는 시크릿 쿠키 보유 시에만 렌더된다.
- **D-19 (비밀 링크로 잠금 해제):** `/unlock?key=...` 형태의 URL을 한 번 열면 쿠키가 설정되고 홈으로 이동. 시크릿 값은 서버 전용 환경변수로 관리.
- **D-20 (쿠키 없으면 진도 UI 완전 숨김):** 완료 버튼·진행률 바·요약 블록의 존재 자체가 DOM에 없다(시각적 숨김 아님).
- **D-21:** 완료 버튼은 레슨 본문 끝, 이전/다음 레슨 버튼 바로 위. 터치 타깃 44px+.
- **D-22:** 완료 직후 다음 레슨 CTA 강조. 자동 페이지 이동 없음.
- **D-23:** 완료 전환 애니메이션은 화려하게 — 성취감 있는 시각 연출 (구체 연출은 Claude 재량).
- **D-24:** 목록(모듈 아코디언 내)에서 완료 레슨은 체크 아이콘 + 은은한 톤 다운. 재방문·재토글 가능.
- **D-25:** 별도 대시보드 페이지 없음 — 홈 화면 강화. 전체 진행률 요약 블록 + Step 카드 3장 진행률 바 실데이터 연결.
- **D-26:** 진행률 %는 레슨 개수 기준(완료/전체). 모듈·Step 목록에 %와 완료/전체 개수 함께 표시.
- **D-27:** 홈 요약 블록에 '이어서 학습하기' CTA — 커리큘럼 순서상 첫 미완료 레슨으로 이동.
- **D-28 (낙관적 업데이트):** 누르는 즉시 체크 상태 전환, 백그라운드에서 Server Action으로 저장. 실패 시 이전 상태로 롤백. 서버가 단일 진실 원천 — localStorage 큐/오프라인 동기화 없음.
- **D-29:** 저장 실패 시 버튼 인라인 에러 + 재시도. 별도 토스트 시스템 없음.
- **D-30 (completed_at 시각 기록):** 완료 시각을 함께 저장하고 재완료 시 갱신.

### Claude's Discretion

- 완료 애니메이션의 구체 연출 (화려함·성취감 조건만 충족하면 방식 자유).
- DB 스키마 상세(테이블·컬럼 구성), RLS 정책 문구, 마이그레이션 방식.
- 쿠키 이름·수명(사실상 영구 권장)·httpOnly 등 속성, `/unlock` 라우트 세부 구현.
- 진행률 요약 블록의 레이아웃·시각 디자인 (Phase 1 디자인 토큰·Step accent 색 D-04 준수).
- 낙관적 업데이트 구현 세부(useOptimistic 등)와 캐시 무효화 전략 (revalidatePath 등).

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. (학습 일정·오늘의 학습·D-day는 Phase 3, 레슨 본문 콘텐츠는 Phase 4~5, 범위 밖.)

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRACK-01 | 레슨 완료 버튼 → Supabase 저장, 새로고침·기기 전환 후에도 유지 | `progress` 테이블 스키마(레슨 slug 기준 단일 고정 사용자 행) + Server Action upsert 패턴 + `revalidatePath` 캐시 무효화 (Architecture Patterns, Code Examples) |
| TRACK-02 | 완료 토글(취소 가능) | 동일 Server Action에서 존재 여부로 분기(upsert vs delete) — Code Examples "toggle" 패턴 |
| TRACK-03 | 모듈·Step별 진행률(%·완료/전체) 표시 | `lib/progress.ts` 순수 함수 집계, 기존 `getModulesByStep`/`getLessonsByModule`/`getLessonCounts` 헬퍼 재사용 (Architecture Patterns) |
| TRACK-04 | 대시보드에서 전체·Step별 진행률 확인 | D-25에 따라 홈(`src/app/page.tsx`) 강화 — 동일 집계 함수, `step-card.tsx`의 `progressPercent = 0` 자리에 실데이터 주입 |
| PLAT-02 | 로그인 없는 최소 마찰 + 외부인 차단 | D-17 시크릿 쿠키 + 서비스 롤 키 + RLS 기본 차단(Package Legitimacy/RLS 절 및 Common Pitfalls) |

</phase_requirements>

## Summary

이 Phase는 표준 Supabase 패턴(익명 로그인 + `@supabase/ssr` 쿠키 세션)을 쓰지 않는다 — CONTEXT.md D-17이 명시적으로 대체했다. 대신 (1) `/unlock?key=...`을 한 번 방문하면 서버가 장기 `httpOnly` 쿠키를 심어주고, (2) 이후 모든 진도 읽기/쓰기는 Server Component와 Server Action에서만, **service_role 키**로 초기화한 `supabase-js` 클라이언트로 수행하며, (3) RLS는 모든 테이블에 켜두되 `anon`/`authenticated` 역할에는 정책을 하나도 부여하지 않아 외부에서의 직접 접근을 기본 차단(default-deny)하는 구조다. `service_role` 키는 RLS를 완전히 우회하므로 앱 로직은 `auth.uid()`에 의존하지 않는다 — 이번 세션에 Supabase 공식 문서로 이 두 가지(정책 0개=완전 차단, service_role=우회)를 모두 확인했다.

가장 중요한 아키텍처 발견: 이 프로젝트의 `next.config.ts`에는 PPR/`cacheComponents`가 켜져 있지 않다(확인됨, 옵션 없는 기본 설정). 이 상태에서 Server Component가 `cookies()`를 읽으면 — D-18/D-20이 요구하는 서버 사이드 게이팅에 필수 — 그 페이지 **전체 라우트가 동적 렌더링으로 강제 전환**된다. Phase 1이 세운 "완전 정적 생성(`generateStaticParams`, revalidate 없음)" 전제가 레슨·Step·홈 페이지에서는 이 Phase부터 깨진다는 뜻이다. Suspense 경계로 정적 셸을 지키는 방법은 PPR가 필요해 이 프로젝트 범위 밖(Pitfall 1: 플랫폼 과잉 엔지니어링) — 1인 사용자 규모에서는 페이지 전체를 동적으로 렌더링하는 편이 더 단순하고 충분히 빠르다. `generateStaticParams`는 유지해도 무방하지만(라우트 목록 정의용) 더 이상 빌드타임 정적 HTML을 만들지 않는다.

두 번째 중요 발견: Next.js 15부터(이 프로젝트는 16.3.2) `fetch()`가 **기본적으로 캐시되지 않는다** — PITFALLS.md가 경고한 "체크가 안 남는 버그는 캐시 문제"의 절반은 이미 프레임워크 기본값으로 해결되어 있다. 남은 절반은 Next.js의 **Full Route Cache**(정적으로 렌더링된 페이지 자체의 캐시)인데, 위 발견대로 이 Phase의 페이지들은 `cookies()`로 인해 이미 동적 렌더링이라 Full Route Cache 대상이 아니다. 그래도 `revalidatePath`를 Server Action 마지막에 호출하는 관례는 유지 권장(명시성 + Data Cache 대비 안전망).

**Primary recommendation:** `@supabase/supabase-js` 단독 설치(`@supabase/ssr`는 설치하지 않음 — Supabase Auth 세션을 쓰지 않으므로 불필요), `lib/supabase/admin.ts`에 `service_role` 키로 서버 전용 클라이언트 하나만 두고, `lib/auth.ts`에 `cookies()` 기반 `hasUnlockCookie()` 헬퍼 하나를 두어 모든 게이트 지점(페이지·Server Action)에서 재사용한다. `middleware.ts`는 만들지 않는다(아래 Pitfall 참고).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 완료 토글 UI(버튼, 애니메이션) | Browser / Client | — | `'use client'` 아일랜드, `useOptimistic` 로컬 상태만 다룸 |
| 완료 상태 저장/취소(mutation) | API/Backend 역할을 하는 Server Action | Database | Next.js Server Action이 곧 이 프로젝트의 "백엔드" — 별도 API 레이어 없음 |
| 진도 조회(레슨/모듈/Step/홈) | Frontend Server (SSR) | Database | Server Component가 요청마다 Supabase를 읽어 정적 콘텐츠 위에 오버레이 |
| 진행률 % 계산 | Frontend Server (SSR) | — | `lib/progress.ts` 순수 함수, DB에 집계 테이블/뷰 없음 (Anti-Pattern 3 회피) |
| 시크릿 쿠키 검증(게이트) | Frontend Server (SSR) | — | `next/headers`의 `cookies()`를 Server Component/Action에서 직접 확인 — 별도 미들웨어 불필요 |
| `/unlock` 키 검증·쿠키 발급 | Frontend Server (SSR, Route Handler) | — | Route Handler가 `searchParams.key`를 서버 전용 env var와 비교 후 `cookies().set()` |
| 진도 데이터 저장소 | Database (Supabase Postgres) | — | `progress` 테이블 1개, RLS on, 정책 0개(기본 차단) + service_role 우회 |
| 커리큘럼 구조(Step/모듈/레슨 메타) | 빌드타임 콘텐츠 계층 (Velite manifest) | — | Phase 1에서 확정, 이 Phase는 조회만 함(`curriculum-helpers.ts`) — DB에 중복 저장하지 않음 |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | `2.112.3` `[VERIFIED: npm registry — npm view @supabase/supabase-js version → 2.112.3, dist-tags.latest → 2.112.3]` | 서버 전용 Postgres 클라이언트(`service_role` 키로 초기화) | D-17이 요구하는 "서버에서만 접근, 클라이언트에 키 노출 금지" 구조에 정확히 맞는 최소 의존성 — `createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })` 패턴이 공식 문서에 문서화되어 있음 `[VERIFIED: Context7 /supabase/supabase-js — createClient signature + SupabaseClientOptions.auth]` |

**`@supabase/ssr`는 이번 Phase에서 설치하지 않는다** `[ASSUMED — 논리적 추론, Supabase 공식 문서에 "Auth 미사용 시 불필요"라는 문장이 명시된 것을 이번 세션에 직접 확인하지는 않음]`. `@supabase/ssr`의 존재 이유는 Supabase **Auth** 세션 쿠키를 SSR 프레임워크와 동기화하는 것인데, D-17이 Supabase Auth(익명 세션 포함) 사용을 명시적으로 배제했으므로 이 패키지가 관리할 세션 자체가 없다. `.claude/CLAUDE.md`의 스택 가이드가 권장한 `@supabase/ssr` + 익명 로그인 조합은 D-17로 대체된 것으로 CONTEXT.md에 명시되어 있다.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (신규 없음) | — | — | React 19(`useOptimistic`)·Next.js 16(`cookies()`, `revalidatePath`, Route Handler)는 이미 설치된 `next`/`react` 안에 포함 — 별도 패키지 불필요 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| service_role 키 + 정책 0개(기본 차단) | Supabase Auth 익명 로그인 + `auth.uid()` RLS 정책 | STACK.md/CLAUDE.md의 원래 권장안이었으나 기기마다 익명 세션 ID가 달라져 성공 기준 1(기기 전환 시 진도 유지)과 정면 충돌 — D-17이 명시적으로 기각 |
| 페이지 전체 동적 렌더링(`cookies()` 자연 발생 또는 `export const dynamic = 'force-dynamic'`) | PPR(`cacheComponents`) + Suspense로 정적 셸 유지 | 1인 사용자 규모에서 얻는 이득 대비 실험적 플래그 도입 리스크·빌드 복잡도가 큼 (Pitfall 1: 플랫폼 과잉 엔지니어링) |
| Server Action 자체가 쿠키를 재검증 | 별도 `middleware.ts`가 요청을 사전 차단 | 미들웨어는 방어 계층을 하나 더 추가하지만, Server Action이 렌더된 HTML에 포함되지 않으면(D-20) 애초에 액션 참조 자체가 노출되지 않음 + 액션 내부 재검증이 어차피 필수이므로 중복 코드 대비 이득이 작음. 새 파일/개념 없이 `lib/auth.ts` 헬퍼 재사용이 더 단순 |

**Installation:**
```bash
npm install @supabase/supabase-js
```

**Version verification:** `npm view @supabase/supabase-js version` → `2.112.3`, `npm view next version` → `16.3.2`(이미 설치됨, 변경 없음). `next`/`react`/`react-dom`은 이미 `package.json`에 고정되어 있어 재검증만 수행.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@supabase/supabase-js` | npm | 최신 배포 버전(2.112.3) 게시일 2026-08-11 — 패키지 자체는 다년간 유지된 공식 SDK | 24,702,997/주 | `github.com/supabase/supabase-js` | **SUS** (사유: `too-new` — *최신 패치 버전의 게시일*이 최근이라는 신호이며, 패키지 자체의 연혁이 짧다는 의미는 아님) | 승인하되 계획에 `checkpoint:human-verify` 삽입 권장 |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `@supabase/supabase-js` — 자동화 게이트가 "too-new"로 표시했으나 실사용 신호(2,470만 주간 다운로드, 공식 GitHub 리포, postinstall 스크립트 없음, `npm view` 직접 확인)로 볼 때 오탐(false positive)에 가깝다. 그럼에도 프로토콜에 따라 플래그를 유지하며, 플래너는 `npm install @supabase/supabase-js` 실행 태스크 앞에 `checkpoint:human-verify`를 배치해 설치 직전 사용자가 한 번 더 확인하도록 한다.

*패키지명은 훈련 데이터/CLAUDE.md 문서에서 처음 발견되었으므로 `[ASSUMED]` 태그가 원칙이나, 이번 세션에 `npm view`로 레지스트리 존재·버전·postinstall 부재를 직접 확인했고 Context7 공식 문서(`/supabase/supabase-js`)로도 API 사용법을 교차 검증했다 — 패키지명 자체의 출처는 `.claude/CLAUDE.md`(WebSearch 기반 원문서)이므로 `[ASSUMED]`, 존재·버전·API 형태는 `[VERIFIED]`로 구분 표기했다.

## Architecture Patterns

### System Architecture Diagram

```
[Browser: 레슨/Step/홈 페이지 요청]
        │
        ▼
[Server Component — cookies()로 unlock 쿠키 확인]
        │                                  │
   쿠키 없음                            쿠키 있음
        │                                  │
        ▼                                  ▼
 [진도 UI 완전 미렌더                [progress 테이블 SELECT
  (Phase 1과 동일한                   (service_role 클라이언트,
   순수 콘텐츠 페이지)]                RLS 우회) → lib/progress.ts
                                       순수 함수로 %/완료-전체 집계]
                                              │
                                              ▼
                                     [완료 배지/진행률 바/
                                      완료 버튼(initialDone) 렌더]
                                              │
                                    (사용자가 완료 버튼 클릭)
                                              ▼
                              [Client: useOptimistic으로 즉시 토글]
                                              │
                                              ▼
                        ['use server' markComplete/markIncomplete
                          — cookies() 재검증 → service_role
                          upsert/delete → revalidatePath(여러 경로)]
                                         │            │
                                     성공             실패
                                         │            │
                                         ▼            ▼
                              [새 상태로 재렌더]  [낙관적 상태 롤백 +
                                                  인라인 에러 + 재시도]

[별도 흐름] /unlock?key=... (GET Route Handler)
        │
        ▼
 [key === process.env.UNLOCK_SECRET ?]
   예 → cookies().set(장기 httpOnly) → redirect(/)
   아니오 → invalid-key 안내 페이지 렌더 (redirect 없음)
```

### Recommended Project Structure

```
src/
├── lib/
│   ├── supabase/
│   │   └── admin.ts        # createClient(url, service_role) — 유일한 Supabase 클라이언트, 서버 전용
│   ├── auth.ts             # hasUnlockCookie(): Promise<boolean> — cookies() 래핑, 모든 게이트가 이 함수 하나만 호출
│   └── progress.ts         # 순수 함수: getCompletedLessonIds(), aggregateByStep(), aggregateByModule(), overallPercent()
├── app/
│   ├── unlock/
│   │   └── route.ts        # GET — key 검증, cookies().set(), redirect
│   ├── lesson/[lessonId]/
│   │   ├── page.tsx        # 기존 파일 확장 — hasUnlockCookie() 분기 + CompleteButton 삽입
│   │   └── actions.ts       # 'use server' toggleLessonComplete(lessonId)
│   ├── step/[stepId]/page.tsx   # 기존 파일 확장 — 모듈별 진행률 배지 주입
│   └── page.tsx             # 기존 파일 확장 — 진행률 요약 블록 + Step 카드 실데이터
└── components/
    ├── complete-button.tsx  # 'use client', useOptimistic + Server Action 호출
    ├── progress-summary.tsx # 홈 요약 블록(D-25~27)
    └── progress-badge.tsx   # "완료 {n}/{total} · {percent}%" (모듈/Step 공용, D-26)
```

### Structure Rationale

- **`lib/supabase/admin.ts` 단일 파일:** D-17에는 `server.ts`/`client.ts` 분리가 필요 없다 — 브라우저용 클라이언트를 아예 만들지 않기 때문. 기존 ARCHITECTURE.md의 `{server,client}` 분리 제안은 `@supabase/ssr`+Auth 전제였으므로 이 Phase에는 적용하지 않는다(D-17이 canonical_refs의 ARCHITECTURE.md를 부분적으로 override).
- **`lib/auth.ts`의 단일 함수:** `middleware.ts` 대신 모든 게이트 지점(3개 페이지 + 1개 Server Action)이 같은 `cookies()` 체크를 반복하지 않고 한 함수를 import — 실수로 게이트를 빼먹는 경우를 줄임.
- **`actions.ts`를 `lesson/[lessonId]/` 안에 유지:** Phase 1 관례(ARCHITECTURE.md Pattern 2)와 동일, 새 규칙 도입 없음.

### Pattern 1: 페이지 레벨 동적 렌더링 + 서버 전용 게이트 (D-18/D-20 구현)

**What:** 레슨/Step/홈 페이지는 `cookies()`를 호출해 unlock 쿠키 유무를 확인하고, 없으면 진도 관련 하위 트리(완료 버튼, 배지, 요약 블록)를 아예 렌더 트리에 포함하지 않는다. 이 프로젝트는 PPR이 꺼져 있으므로 이 호출은 페이지 전체를 동적 렌더링으로 전환시킨다 `[VERIFIED: Context7 /vercel/next.js — dynamic-rendering.ts "throwToInterruptStaticGeneration" 레거시 경로, PPR 미적용 시 전체 라우트 bail]`.
**When to use:** 콘텐츠는 정적으로 유지하고 싶지만 일부 UI를 요청 단위로 게이팅해야 하는 모든 페이지. 이 규모(1인 사용자, 수십~백여 레슨)에서는 페이지 전체 동적화의 성능 비용이 무시할 수준.
**Trade-offs:** Phase 1의 "완전 정적 생성" 전제가 깨지지만, PPR 도입보다 훨씬 단순하고 빌드 설정 변경이 필요 없다. `generateStaticParams`는 라우트 존재 정의용으로 유지해도 무방(`force-dynamic`과 충돌하지 않음) `[VERIFIED: Context7 /vercel/next.js — create-component-tree.tsx 주석: "force-dynamic bails out of static generation but does not affect generateStaticParams"]`.

**Example:**
```typescript
// src/lib/auth.ts
import { cookies } from 'next/headers';

const UNLOCK_COOKIE = 'unlock_key'; // 실제 이름은 discretion

export async function hasUnlockCookie(): Promise<boolean> {
  const store = await cookies();
  return store.get(UNLOCK_COOKIE)?.value === process.env.UNLOCK_SECRET;
}
```
```typescript
// src/app/lesson/[lessonId]/page.tsx — 발췌, 명시적 dynamic 선언 권장
export const dynamic = 'force-dynamic'; // cookies() 사용을 명시적으로 드러냄

export default async function LessonPage(props: PageProps<"/lesson/[lessonId]">) {
  const { lessonId } = await props.params;
  const lesson = getLessonBySlug(lessonId);
  if (!lesson) notFound();

  const unlocked = await hasUnlockCookie();
  const isDone = unlocked ? await getCompletionStatus(lesson.slug) : null;

  return (
    <article>
      {/* ...기존 콘텐츠... */}
      {unlocked && <CompleteButton lessonId={lesson.slug} initialDone={isDone} />}
    </article>
  );
}
```
*(`cookies()`/`export const dynamic`의 동작은 Context7 공식 문서로 검증했고, `CompleteButton`·`getCompletionStatus`는 이 Phase에서 신규 작성할 코드이므로 예시로 표기.)*

### Pattern 2: service_role 클라이언트 + 정책 0개 RLS (PLAT-02 구현)

**What:** `progress` 테이블에 RLS를 켜되(`alter table progress enable row level security;`) `anon`/`authenticated` 역할을 위한 정책은 하나도 만들지 않는다. 모든 서버 코드는 `service_role` 시크릿 키로 초기화한 단일 클라이언트로만 이 테이블에 접근한다.
**When to use:** D-17처럼 앱 로직이 `auth.uid()`에 의존하지 않고, 그럼에도 "혹시 anon 키가 유출되거나 실수로 클라이언트에 노출되어도" 방어선이 필요한 경우.
**Trade-offs:** `service_role` 키는 RLS를 완전히 우회하므로(공식 문서 확인) 이 키 자체가 유일하게 보호해야 할 비밀 — 절대 `NEXT_PUBLIC_` 접두사 환경 변수에 넣지 않는다. RLS는 "심층 방어"일 뿐 애플리케이션이 안전하다는 착각을 주면 안 된다 `[VERIFIED: Context7 /supabase/supabase — "Bypassing Row Level Security": service_role은 요청에 user access token이 없을 때만 우회하며 클라이언트에 절대 노출 금지 / "Troubleshooting": RLS 켜져 있고 정책 없으면 SELECT가 빈 배열 반환]`.

**Example:**
```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // 서버 전용, NEXT_PUBLIC_ 금지
  { auth: { persistSession: false, autoRefreshToken: false } },
);
```
```sql
-- migration: 정책을 하나도 만들지 않는 것이 의도된 설계 (default-deny)
alter table public.progress enable row level security;
-- 정책 없음 = anon/authenticated 완전 차단. service_role만 접근 가능(RLS 우회 속성).
```
*(`createClient` 시그니처와 `auth.persistSession`/`autoRefreshToken` 옵션은 Context7 `/supabase/supabase-js` 공식 문서에서 확인. SQL 마이그레이션 본문은 이 Phase의 신규 산출물.)*

### Pattern 3: 낙관적 토글 + Server Action 재검증 (D-28/D-29/TRACK-02)

**What:** 클라이언트는 `useOptimistic`으로 클릭 즉시 상태를 뒤집고, Server Action이 실제 DB 상태(존재하면 delete, 없으면 upsert)로 토글한 뒤 실패 시 클라이언트가 에러 UI로 전환한다.
**When to use:** 반응성이 중요한 단일 사용자 토글 인터랙션.
**Trade-offs:** `useOptimistic`의 낙관적 값은 트랜지션이 끝나면 실제 `state` 인자로 자동 수렴한다 — Server Action이 던진 에러를 낙관적 setter가 자동으로 되돌려주지 않으므로, `try/catch`로 감싸 실패 시 별도 에러 상태(D-29 인라인 에러+재시도)를 클라이언트에서 명시적으로 세팅해야 한다 `[VERIFIED: Context7 /reactjs/react.dev — useOptimistic.md 예제는 실패 케이스를 다루지 않음; useActionState.md 예제도 성공 경로만 시연. 실패 처리는 이 프로젝트가 직접 설계해야 하는 부분]`.

**Example:**
```typescript
// src/app/lesson/[lessonId]/actions.ts
'use server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hasUnlockCookie } from '@/lib/auth';

export async function toggleLessonComplete(lessonId: string, currentlyDone: boolean) {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized'); // Server Action 자체 재검증 — UI 숨김만 믿지 않는다
  }

  if (currentlyDone) {
    const { error } = await supabaseAdmin.from('progress').delete().eq('lesson_id', lessonId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin
      .from('progress')
      .upsert({ lesson_id: lessonId, completed_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/lesson/${lessonId}`);
  revalidatePath('/step/[stepId]', 'page');
  revalidatePath('/');
}
```
*(`revalidatePath` 시그니처·`'use server'` 배치는 Context7 공식 문서로 검증. 테이블/컬럼명(`progress`, `lesson_id`, `completed_at`)은 이 Phase의 discretion 항목으로 이 문서가 제안하는 설계이며 DB에 아직 존재하지 않음 — `[ASSUMED]` 설계 제안.)*

### Anti-Patterns to Avoid

- **UI 숨김만으로 보호 완료라고 착각:** 완료 버튼이 렌더되지 않는다고 해서 Server Action 엔드포인트 자체가 사라지는 것은 아니다. `toggleLessonComplete`가 자체적으로 `hasUnlockCookie()`를 재검증하지 않으면, 캡처된 요청을 재전송하는 공격에 뚫린다. **반드시 Server Action 내부에서 재검증한다.**
- **`middleware.ts`로 콘텐츠 자체를 막기:** D-18(콘텐츠는 공개)과 충돌한다. 미들웨어를 만든다면 오직 "진도 관련 Server Action 요청을 사전 차단"하는 부가 방어용으로만 검토하고, 콘텐츠 라우트에는 절대 적용하지 않는다 — 이 Phase는 미들웨어 자체를 만들지 않는 것을 권장(Pattern 1/2/3만으로 충분).
- **DB에 진행률 집계 컬럼/뷰/트리거 만들기:** ARCHITECTURE.md Anti-Pattern 3과 동일한 이유로 이 규모에서는 과함 — `lib/progress.ts` 순수 함수로 충분.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| 시크릿 비교(`/unlock` key 검증) | 커스텀 해시/HMAC 서명 URL | `process.env.UNLOCK_SECRET`와의 단순 문자열 비교 | 1인용 개인 사이트, 위협 모델이 낮음(공개 URL 유출 자체가 리스크의 전부) — 서명·만료·nonce 체계는 이 규모에서 과설계 |
| 낙관적 UI 상태 관리 | 수동 `useState` + 수동 롤백 로직 | React 19 `useOptimistic` | 트랜지션과 자동 동기화되는 표준 훅이 이미 존재(Code Examples 참고) |
| 진행률 계산 | Postgres 뷰/트리거/집계 테이블 | `lib/progress.ts`의 순수 JS 함수 | 데이터 규모(수십~백여 레슨, 1인 사용자)에서 앱 레벨 계산이 더 단순하고 빠름 |
| 세션/쿠키 서명·검증 인프라 | 커스텀 JWT 발급기 | Next.js `cookies().set()`의 `httpOnly`/`secure`/`expires`만으로 충분 | Supabase Auth를 쓰지 않으므로 "세션"이라는 개념 자체가 없음 — 단순 존재/일치 여부만 확인하는 플래그 쿠키 |

**Key insight:** 이 Phase의 진짜 위험은 "인증을 안 만들었으니 보안이 약하다"가 아니라, "쿠키 존재 == 렌더 여부"와 "Server Action 내부 재검증"을 분리해서 생각하지 않아 후자를 빠뜨리는 것이다. 두 게이트는 항상 쌍으로 존재해야 한다.

## Common Pitfalls

### Pitfall 1: Server Action이 UI 게이트만 믿고 자체 인가 검사를 생략

**What goes wrong:** 완료 버튼이 쿠키 없을 때 렌더되지 않는다고 해서 `toggleLessonComplete` Server Action이 안전해지는 것은 아니다. Next.js Server Action은 컴파일된 POST 엔드포인트로 존재하며, 렌더된 HTML에 참조가 없어도 이론상 재전송 공격이 가능하다.
**Why it happens:** "버튼이 안 보이니 안전하다"는 직관적이지만 틀린 가정 — 클라이언트 렌더 여부와 서버 엔드포인트 도달 가능성은 별개다.
**How to avoid:** Pattern 3 예시처럼 모든 Server Action 최상단에서 `hasUnlockCookie()`를 호출하고 실패 시 즉시 throw한다. 이것은 discretion이 아니라 PLAT-02 성공 기준 5("외부인이 URL만으로 진도를 쓸 수 없다")의 필수 구현 항목이다.
**Warning signs:** Server Action 코드에 `hasUnlockCookie()` 호출이 없다.

### Pitfall 2: PPR 없이 정적 셸을 유지하려다 시간을 낭비

**What goes wrong:** Phase 1의 "완전 정적 생성" 관례를 지키려고 Suspense 경계로 progress 오버레이를 분리하는 시도를 하지만, `next.config.ts`에 PPR/`cacheComponents`가 꺼져 있어(확인됨) 이 분리는 정적 셸을 만들어주지 못하고 여전히 상위 라우트 전체가 동적으로 전환된다.
**Why it happens:** Context7 문서의 "Refactoring dynamic cookie access" 예제가 Suspense 분리를 보여주지만, 그 예제는 `migrating-to-cache-components` 가이드 문서에 속해 있어 전제 조건(PPR 활성화)이 함께 필요하다는 점을 놓치기 쉽다.
**How to avoid:** PPR을 켜는 것 자체를 이 Phase의 범위에 넣지 않는다(Pitfall 1: 플랫폼 과잉 엔지니어링). 대신 `export const dynamic = 'force-dynamic'`을 명시하고 페이지 전체가 동적이라는 사실을 그대로 받아들인다.
**Warning signs:** `next.config.ts`에 `experimental: { ppr: ... }` 또는 `cacheComponents: true`를 추가하려는 계획이 등장한다.

### Pitfall 3: 정책 0개 RLS를 "버그"로 오인하고 `using (true)`로 "고침"

**What goes wrong:** RLS를 켰는데 로컬 테스트 시 `anon` 키로 조회가 빈 배열을 반환하면 "RLS가 고장났다"고 오해하고 `using (true)` 정책을 임시로 추가해버린다.
**Why it happens:** PITFALLS.md Pitfall 3이 이미 경고한 패턴과 동일 — 정책 0개=의도된 기본 차단이라는 사실을 모르면 이 결과가 "버그"처럼 보인다. `service_role` 클라이언트로 테스트하면 정상 동작하므로, 앱 코드 경로(항상 `supabaseAdmin` 사용)로만 테스트하면 이 함정 자체를 마주치지 않는다.
**How to avoid:** RLS 검증은 "익명 키로 접근 시 거부되는지"를 **의도적으로** 확인하는 것이지, 익명 키 접근이 되게 만드는 것이 목표가 아니다. UAT 항목에 "anon 키로 직접 progress 테이블 조회 시 빈 배열/거부됨을 확인"을 포함한다.
**Warning signs:** 마이그레이션 SQL에 `using (true)` 또는 `authenticated`/`anon`에 대한 새 정책이 등장한다.

### Pitfall 4: `/unlock` 리다이렉트에서 캐시된 홈 페이지를 보여줌

**What goes wrong:** `/unlock` Route Handler가 쿠키를 설정한 뒤 `redirect('/')`로 이동하는데, 홈 페이지가 (이 Phase 이전 상태의 습관대로) 캐시된 정적 응답을 반환해 방금 설정한 쿠키가 반영된 진도 UI가 즉시 보이지 않을 수 있다.
**Why it happens:** 홈 페이지도 Pitfall 2와 동일한 이유로 `cookies()`를 읽으면 동적 렌더링으로 전환되므로, 실제로는 이 문제가 발생하지 않아야 정상이다 — 발생한다면 홈 페이지 어딘가에서 `cookies()` 호출이 조건부로만 실행되어(예: early return 이전) Next.js가 이를 감지하지 못하는 경우다.
**How to avoid:** 홈 페이지 최상단에서 무조건 `hasUnlockCookie()`를 호출(조건부 실행 금지)하고, `export const dynamic = 'force-dynamic'`을 명시적으로 선언해 정적 캐시 가능성을 원천 차단한다.
**Warning signs:** `/unlock` 방문 직후 새로고침해야만 진도 UI가 나타난다.

## Code Examples

### 완료 토글 버튼 (useOptimistic + Server Action)

```typescript
// src/components/complete-button.tsx
'use client';
import { useOptimistic, useTransition, useState } from 'react';
import { toggleLessonComplete } from '@/app/lesson/[lessonId]/actions';

export function CompleteButton({ lessonId, initialDone }: { lessonId: string; initialDone: boolean }) {
  const [done, setDone] = useState(initialDone);
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      setOptimisticDone(!optimisticDone);
      setError(null);
      try {
        await toggleLessonComplete(lessonId, done);
        setDone(!done);
      } catch {
        setError('저장하지 못했습니다. 다시 시도해주세요.'); // Copywriting Contract 문구
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={optimisticDone}
        className="flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2"
      >
        {optimisticDone ? '완료했어요 ✓' : '레슨 완료하기'}
      </button>
      {error && (
        <div className="flex items-center gap-2 text-[14px]">
          <span>{error}</span>
          <button type="button" onClick={handleClick}>다시 시도</button>
        </div>
      )}
    </div>
  );
}
```
*(`useOptimistic`/`useTransition` API는 Context7 `/reactjs/react.dev` 공식 문서로 검증. 컴포넌트 전체 구현·에러 처리 흐름은 D-28/D-29/UI-SPEC Copywriting Contract를 반영한 이 Phase의 신규 설계.)*

### 진행률 집계 (순수 함수)

```typescript
// src/lib/progress.ts
import { getModulesByStep, getLessonsByModule, getOrderedLessons } from '@/content/curriculum-helpers';
import type { StepId } from '@/content/modules';

export function aggregate(completedIds: Set<string>, lessons: { slug: string }[]) {
  const total = lessons.length;
  const completed = lessons.filter((l) => completedIds.has(l.slug)).length;
  return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

export function overallProgress(completedIds: Set<string>) {
  return aggregate(completedIds, getOrderedLessons());
}

export function stepProgress(stepId: StepId, completedIds: Set<string>) {
  const lessons = getModulesByStep(stepId).flatMap((m) => getLessonsByModule(m.id));
  return aggregate(completedIds, lessons);
}

export function moduleProgress(moduleId: string, completedIds: Set<string>) {
  return aggregate(completedIds, getLessonsByModule(moduleId));
}
```
*(`getModulesByStep`/`getLessonsByModule`/`getOrderedLessons` 시그니처는 `src/content/curriculum-helpers.ts`를 이번 세션에 직접 읽어 확인 `[VERIFIED: src/content/curriculum-helpers.ts:36-46]` — `getModulesByStep(stepId: StepId): Module[]`, `getLessonsByModule(moduleId: string): Lesson[]`, `getOrderedLessons(): Lesson[]`. `aggregate`/`overallProgress`/`stepProgress`/`moduleProgress`는 이 Phase의 신규 설계 제안.)*

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Next.js `fetch()`가 기본적으로 캐시됨(Next.js 14 이하) | `fetch()`가 기본적으로 캐시되지 않음(`no-store`), `cache:'force-cache'`로만 옵트인 | Next.js 15 `[VERIFIED: Context7 /vercel/next.js — "Upgrading to Version 15 > fetch requests": "Fetch requests are no longer cached by default"]` | 이 프로젝트(Next 16.3.2)는 이미 새 기본값 적용 대상 — Supabase 클라이언트의 내부 `fetch` 호출도 별도 조치 없이 매 요청 최신값을 가져온다 |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 이전 마일스톤에 이미 deprecated 처리(STACK.md 확인 완료) | 이번 Phase에서는 둘 다 미사용(D-17이 Auth 자체를 배제) — 해당 없음이지만 기록 유지 |

**Deprecated/outdated:**
- `.claude/CLAUDE.md`의 "Supabase Anonymous Auth 권장" 절: D-17로 이 Phase에서 명시적으로 대체됨. 플래너는 해당 CLAUDE.md 절을 참조하지 않는다.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | `@supabase/ssr`는 이 Phase에서 불필요하다(공식 문서에서 "Auth 미사용 시 불필요"라는 문장을 직접 인용하지 못함, 논리적 추론) | Standard Stack | 틀렸다면 쿠키 유틸리티 일부를 놓쳐 서버 클라이언트 초기화가 번거로워질 수 있으나, `@supabase/ssr` 없이도 `createClient` 단독 호출로 동일 기능 구현 가능 — 리스크 낮음 |
| A2 | `progress` 테이블 스키마(`lesson_id text PK`, `completed_at timestamptz`)와 토글 시 delete/upsert 전략은 이 문서의 설계 제안이며 아직 DB에 존재하지 않는다 | Architecture Patterns Pattern 3, Code Examples | 플래너/실행자가 다른 컬럼명을 선택하면 이 문서의 코드 예시와 불일치 — 계획 단계에서 스키마를 명시적으로 확정해야 함(Claude's Discretion 항목으로 CONTEXT.md에 위임됨) |
| A3 | `/unlock` 키 비교를 단순 문자열 동등 비교로 충분하다고 판단(타이밍 공격 방어 불필요) | Don't Hand-Roll | 1인용 개인 사이트 위협 모델에서는 리스크 낮음이나, 향후 다중 사용자 전환 시 재검토 필요 |
| A4 | `middleware.ts`를 만들지 않고 페이지/Action 레벨 체크만으로 충분하다는 권장 | Architecture Patterns Anti-Patterns, Pitfall 1 | CONTEXT.md의 code_context가 "middleware.ts 신설"을 기존 통합 지점으로 언급했으므로, 플래너가 이 권장을 재검토할 여지를 열어둬야 함 — 최종 결정은 discretion |

## Open Questions

1. **`progress` 테이블의 정확한 컬럼 구성과 마이그레이션 방식**
   - What we know: `lesson_id`(레슨 slug 참조) + `completed_at`이 필요조건(D-30), RLS on + 정책 0개(D-17).
   - What's unclear: Supabase CLI 마이그레이션 파일로 관리할지, 대시보드 SQL 에디터로 1회 실행할지 — CONTEXT.md가 "마이그레이션 방식"을 discretion으로 명시했다.
   - Recommendation: PITFALLS.md Pitfall 8("스키마 변경 이력 없음")을 근거로 최소 1개의 `.sql` 마이그레이션 파일을 리포에 커밋하는 방식을 권장(대시보드 전용 변경 지양).

2. **`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` 환경변수를 로컬·Vercel에 어떻게 배선할지**
   - What we know: 서버 전용 env var, `NEXT_PUBLIC_` 금지, Vercel 프로젝트 설정에도 동일 값 등록 필요(PITFALLS.md Pitfall 8: env var drift).
   - What's unclear: Supabase 프로젝트를 이 세션에서 아직 생성하지 않았으므로 실제 URL/키 값 자체가 없음.
   - Recommendation: 계획의 첫 태스크로 "Supabase 프로젝트 생성 + 로컬 `.env.local` + Vercel 대시보드 양쪽에 배선"을 명시적 acceptance criterion으로 포함.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js/npm | 패키지 설치, 빌드 | ✓ (npm view 명령이 정상 응답) | 확인됨(버전 미조회, 불필요) | — |
| Supabase 프로젝트(호스티드 Postgres) | 진도 저장 전체 | ✗ — 이 리포에 Supabase 연동 흔적 없음(`package.json`에 supabase 계열 패키지 미설치, env 파일 미확인) | — | 이 Phase의 첫 태스크로 신규 생성 필요(블로킹, fallback 없음) |
| Vercel 프로젝트 env var 접근 | 배포 후 진도 동작 | 확인 안 됨(Phase 1에서 이미 배포 완료 — STATE.md 기준) | — | Vercel CLI(`vercel env add`) 또는 대시보드 수동 등록 |

**Missing dependencies with no fallback:**
- Supabase 프로젝트 자체 — 이 Phase의 선행 태스크로 반드시 생성해야 함.

**Missing dependencies with fallback:**
- 없음(Supabase는 대체 불가능한 핵심 의존성).

## Validation Architecture

> `.planning/config.json`에 `workflow.nyquist_validation`이 명시적으로 없으므로 기본 활성화로 간주하고 이 섹션을 포함한다.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | 없음 — 리포에 테스트 러너 미설치(`package.json`에 jest/vitest/playwright 부재 확인) |
| Config file | none — Wave 0에서 결정 필요 |
| Quick run command | 없음(수동 UAT로 대체, 아래 참고) |
| Full suite command | 없음 |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-----------------|-------------|
| TRACK-01 | 완료 클릭 → 저장 → 새로고침·기기 전환 후 유지 | manual-only (justification: 실제 브라우저 쿠키·Supabase 왕복이 필요해 단위 테스트로 의미 있게 검증 불가; PITFALLS.md Pitfall 5가 "hard-refresh 후 상태 일치"를 명시적 UAT 항목으로 요구) | 수동: "완료 클릭 → 하드 리프레시 → 상태 유지 확인 → 다른 브라우저/시크릿창(다른 '기기' 시뮬레이션)에서 동일 쿠키로 접속해 동일 상태 확인" | ❌ Wave 0 (테스트 인프라 자체가 없음, UAT 스크립트로 대체) |
| TRACK-02 | 완료 재클릭 시 취소 | manual-only | 수동: "완료 → 재클릭 → 미완료로 복귀 확인" | ❌ Wave 0 |
| TRACK-03 | 모듈·Step 진행률 %/개수 | manual-only (권장: `lib/progress.ts`는 순수 함수이므로 향후 단위 테스트 도입이 쉬움 — 이번 Phase 범위에서는 수동 확인으로 충분) | 수동: "레슨 3개 중 1개 완료 시 모듈 배지가 '완료 1/3 · 33%' 표시하는지 확인" | ❌ Wave 0 |
| TRACK-04 | 홈 요약 블록 전체/Step별 진행률 | manual-only | 수동: "홈에서 전체 %와 Step 카드 3장의 %가 실제 완료 수와 일치하는지 확인" | ❌ Wave 0 |
| PLAT-02 | 쿠키 없이는 진도 UI 미노출 + anon 키로 직접 쓰기 불가 | manual-only (보안 성격상 자동화 테스트보다 명시적 수동 검증이 더 신뢰도 높음) | 수동: "시크릿창(쿠키 없음)으로 레슨 페이지 방문 → 완료 버튼/진행률 요소가 DOM에 전혀 없는지 개발자도구로 확인" + "`curl`로 Supabase REST API를 anon 키로 직접 호출해 progress 테이블 쓰기가 거부되는지 확인" | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** 해당 태스크의 수동 UAT 스텝을 즉시 재현(예: 완료 버튼 구현 태스크 커밋 직후 토글 확인).
- **Per wave merge:** 위 5개 요구사항의 수동 시나리오를 전부 재실행.
- **Phase gate:** `/gsd-verify-work`에서 5개 시나리오 전체 통과 확인 후 완료 처리.

### Wave 0 Gaps

- [ ] 테스트 러너 자체가 리포에 없음 — 이 Phase 범위에서는 자동화 테스트 프레임워크 도입을 신규로 하지 않는다(Pitfall 1: 플랫폼 과잉 엔지니어링과 동일한 이유로, 1인 사용자·5주 타임라인에서 수동 UAT가 더 실용적). 단, `lib/progress.ts`가 순수 함수이므로 향후 필요 시 `vitest` 도입 비용이 낮다는 점만 기록해둔다.
- [ ] `.env.local.example` 또는 README에 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`UNLOCK_SECRET` 3개 env var 문서화 필요 — 현재 리포에 예시 파일 없음.

## Security Domain

> `security_enforcement`가 config에 명시되지 않아 기본 활성화로 간주.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | 부분 적용 — 전통적 로그인 없음(D-17 의도적 선택), 공유 시크릿 쿠키가 사실상의 인증 토큰 | 시크릿 비교는 서버에서만, 쿠키는 `httpOnly`+`secure` |
| V3 Session Management | 예 | `cookies().set({ httpOnly: true, secure: true, path: '/', expires: <far-future> })` `[VERIFIED: Context7 /vercel/next.js — cookies.mdx 및 authentication.mdx 예제]` |
| V4 Access Control | 예 | Server Action 내부 재검증(Pitfall 1) + RLS 정책 0개(Pattern 2) — 이중 방어 |
| V5 Input Validation | 예 | `lessonId`를 Server Action에 전달하기 전 `getLessonBySlug`로 커리큘럼 매니페스트에 실존하는 slug인지 검증(존재하지 않는 slug로 임의 행 삽입 방지) |
| V6 Cryptography | 최소 적용 | `UNLOCK_SECRET` 비교는 평문 문자열 동등 비교(A3 참고) — 별도 해싱/암호화 불필요(단일 정적 시크릿, 위협 모델 낮음) |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Server Action 직접 재전송(replay) — UI 비노출을 보호로 착각 | Elevation of Privilege | Pitfall 1 — Action 내부 `hasUnlockCookie()` 재검증 필수 |
| `service_role` 키의 클라이언트 번들 유출 | Information Disclosure / Elevation of Privilege | 절대 `NEXT_PUBLIC_` 접두사 사용 금지, `lib/supabase/admin.ts`는 서버 전용 파일에서만 import(클라이언트 컴포넌트에서 import 시 Next.js가 빌드 경고를 내도록 `import 'server-only'` 추가 권장) |
| RLS "임시로 `using (true)`" 되돌림 | Tampering | Pitfall 3 — 정책 0개가 정상 상태임을 팀(1인) 내부에 문서화 |
| 존재하지 않는/조작된 `lessonId`로 임의 progress 행 삽입 | Tampering | `getLessonBySlug(lessonId)`로 매니페스트 존재 여부를 Server Action 진입점에서 검증 |

## Sources

### Primary (HIGH confidence)
- `npm view @supabase/supabase-js version` / `dist-tags.latest` / `scripts.postinstall` — 직접 레지스트리 조회, 2.112.3 확인, postinstall 없음.
- `npm view next version` — 16.3.2 확인(변경 없음).
- 이번 세션에 직접 읽은 소스 파일: `src/content/curriculum-helpers.ts`, `src/content/modules.ts`, `src/components/step-card.tsx`, `src/components/module-accordion.tsx`, `src/components/lesson-nav.tsx`, `src/app/page.tsx`, `src/app/lesson/[lessonId]/page.tsx`, `src/app/step/[stepId]/page.tsx`, `velite.config.ts`, `next.config.ts`, `package.json`.

### Secondary (MEDIUM confidence)
- Context7 `/vercel/next.js` — `cookies()` 동적 렌더링 전환, `revalidatePath`, fetch 캐싱 기본값(Next 15+), Route Handler/미들웨어 쿠키 설정, `generateStaticParams`+`force-dynamic` 공존, `connection()` API.
- Context7 `/reactjs/react.dev` — `useOptimistic` + Server Action/폼 패턴.
- Context7 `/supabase/supabase-js` — `createClient(url, serviceRoleKey, options)` 시그니처, `persistSession`/`autoRefreshToken` 옵션.
- Context7 `/supabase/supabase` — RLS 활성화 시 정책 0개=기본 차단, `service_role`의 `bypassrls` 속성과 우회 조건.

### Tertiary (LOW confidence)
- WebSearch "`@supabase/supabase-js` 최신 버전" — npm 레지스트리 직접 조회로 교차 검증 완료, 참고용으로만 유지.
- `.planning/research/{ARCHITECTURE,PITFALLS,STACK}.md` (이전 마일스톤 리서치) — Supabase 익명 로그인 권장 부분은 D-17로 대체, 나머지(콘텐츠 계층 분리, Anti-Pattern 3 등)는 이번 Phase에도 유효하다고 판단해 재사용.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@supabase/supabase-js` 버전은 레지스트리 직접 조회, API 형태는 Context7 공식 문서로 교차 검증.
- Architecture: MEDIUM-HIGH — `cookies()`의 동적 렌더링 전환과 `service_role`/RLS 상호작용은 공식 문서로 검증했으나, 이를 이 프로젝트의 구체적 파일 구조에 조합하는 설계 자체는 이 세션의 신규 제안(discretion 영역).
- Pitfalls: MEDIUM — Pitfall 1·3은 이전 마일스톤 PITFALLS.md와 이번 세션 검증을 결합, Pitfall 2·4는 이번 세션에 새로 발견한 프로젝트 고유 리스크(PPR 미설정 확인에서 도출).

**Research date:** 2026-08-24
**Valid until:** 2026-09-07 (약 2주 — Next.js/Supabase 생태계가 이 프로젝트의 나머지 개강 전 기간 동안 급변할 가능성은 낮으나, `@supabase/supabase-js`는 활발히 릴리스되는 패키지이므로 실제 설치 시점에 버전 재확인 권장)

---
*Phase: 2-progress-tracking*
*Research completed: 2026-08-24*
