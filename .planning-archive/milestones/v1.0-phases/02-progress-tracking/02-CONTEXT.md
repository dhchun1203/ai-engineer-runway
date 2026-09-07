# Phase 2: 진도 체크와 진행률 - Context

**Gathered:** 2026-08-24
**Status:** Ready for planning

<domain>
## Phase Boundary

학습자가 레슨 페이지에서 완료를 토글하면 Supabase에 저장되고(새로고침·아이패드↔데스크톱 전환에도 유지), 모듈·Step·전체 진행률(%와 완료/전체 개수)이 목록과 홈 대시보드에 표시된다. 로그인 화면 없이 동작하되 외부인은 URL만으로 진도를 읽거나 쓸 수 없다 (TRACK-01~04, PLAT-02). 학습 일정·오늘의 학습·D-day(Phase 3), 레슨 본문 콘텐츠(Phase 4~5)는 범위 밖.

</domain>

<decisions>
## Implementation Decisions

### 진도 식별·보호 (PLAT-02)
- **D-17:** **공유 시크릿 쿠키 방식** — 진도의 모든 읽기/쓰기는 서버(Server Component / Server Action)에서만 수행하고, Supabase 접근 키는 클라이언트에 절대 노출하지 않는다. 진도는 단일 고정 사용자 행으로 저장되어 기기 간 동기화가 보장된다. Supabase Auth(익명 세션 포함)는 사용하지 않는다 — 익명 세션은 기기마다 ID가 달라져 성공 기준 1(기기 전환 유지)과 충돌함. RLS는 심층 방어로 모든 테이블에 켜두되 앱 로직은 `auth.uid()`에 의존하지 않는다 (PITFALLS.md "even simpler alternative" 채택). **주의:** `.claude/CLAUDE.md` 스택 가이드의 "익명 로그인(signInAnonymously) 권장"은 이 결정으로 **대체**된다. — **Reversibility:** costly — 미들웨어·서버 액션·스키마 전반에 퍼지며, 다중 사용자 전환 시 인증 계층 재설계 필요 (단, 1인용 확정이라 실질 위험 낮음)
- **D-18:** **콘텐츠 공개 + 진도만 보호** — 레슨·커리큘럼·Making-of는 누구나 읽을 수 있다(공개 포트폴리오 D-14 유지). 진행률·완료 체크 UI와 데이터는 시크릿 쿠키 보유 시에만 렌더된다 (성공 기준 5: 외부인은 읽기도 불가)
- **D-19:** 새 기기 잠금 해제는 **비밀 링크** — `/unlock?key=...` 형태의 URL을 한 번 열면 쿠키가 설정되고 홈으로 이동. 아이패드에서 북마크 탭 한 번으로 해결(최소 마찰). 시크릿 값은 서버 전용 환경변수로 관리
- **D-20:** 쿠키 없는 상태에서는 진도 UI **완전 숨김** — 완료 버튼·진행률 바·요약 블록의 존재 자체가 안 보이며, 외부인에게는 순수 콘텐츠 사이트로 동작

### 완료 버튼·완료 표시 UX (TRACK-01, TRACK-02)
- **D-21:** 완료 버튼은 **레슨 본문 끝, 이전/다음 레슨 버튼(D-08) 바로 위** — 터치 타깃 44px+, "읽기 끝 → 완료 체크 → 다음 레슨" 동선
- **D-22:** 완료 직후 **다음 레슨 CTA 강조** — 버튼이 완료 상태로 바뀌면서 다음 레슨 버튼이 시각적으로 강조됨. 자동 페이지 이동은 하지 않음
- **D-23:** 완료 전환 애니메이션은 **화려하게** — 체크 상태로 전환될 때 성취감을 주는 시각 연출 (사용자 명시 요청). 구체 연출 방식은 Claude 재량
- **D-24:** 목록(모듈 아코디언 내)에서 완료 레슨은 **체크 아이콘 + 은은한 톤 다운** — 남은 레슨이 도드라지게. 완료 레슨도 재방문·재토글 가능

### 진행률·대시보드 (TRACK-03, TRACK-04)
- **D-25:** 별도 대시보드 페이지 없음 — **홈 화면 강화**. 홈 상단에 전체 진행률 요약 블록 추가 + 기존 Step 카드 3장의 진행률 바(placeholder)에 실데이터 연결. 글로벌 내비 4항목(D-09)은 불변. Phase 3에서 홈이 '오늘의 학습'으로 재편될 때 이 요약 블록이 흡수됨
- **D-26:** 진행률 %는 **레슨 개수 기준** (완료 레슨 수 ÷ 전체 레슨 수). 모듈 목록·Step 목록에 %와 완료/전체 개수를 함께 표시(TRACK-03). 예상 소요시간 가중 계산은 Phase 3(페이스 판정)의 몫
- **D-27:** 홈 요약 블록에 **'이어서 학습하기' CTA** — 커리큘럼 순서상 첫 미완료 레슨으로 바로 이동. Phase 3 '오늘의 학습' 전까지 임시 랜딩 역할

### 저장 동작·엣지 케이스
- **D-28:** **낙관적 업데이트** — 누르는 즉시 체크 상태 전환, 백그라운드에서 Server Action으로 저장. 실패 시 이전 상태로 롤백. 서버가 단일 진실 원천 — localStorage 큐/오프라인 동기화 없음 (REQUIREMENTS Out of Scope + PITFALLS.md 경고 준수)
- **D-29:** 저장 실패 시 **버튼 인라인 에러 + 재시도** — 체크 롤백 후 버튼 자리에 실패 메시지와 재시도 버튼 표시. 별도 토스트 시스템은 만들지 않음
- **D-30:** **completed_at 시각 기록** — 완료 시각을 함께 저장하고 재완료 시 갱신. Phase 3의 on-track/behind 계산과 '오늘 완료' 표시의 입력값

### Claude's Discretion
- 완료 애니메이션의 구체 연출 (화려함·성취감 조건만 충족하면 방식 자유)
- DB 스키마 상세(테이블·컬럼 구성), RLS 정책 문구, 마이그레이션 방식
- 쿠키 이름·수명(사실상 영구 권장)·httpOnly 등 속성, `/unlock` 라우트 세부 구현
- 진행률 요약 블록의 레이아웃·시각 디자인 (Phase 1 디자인 토큰·Step accent 색 D-04 준수)
- 낙관적 업데이트 구현 세부(useOptimistic 등)와 캐시 무효화 전략 (revalidatePath 등 — PITFALLS.md "체크가 안 남는 버그는 캐시 문제" 경고 준수)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 아키텍처·스택 (리서치 확정 사항)
- `.planning/research/ARCHITECTURE.md` — 정적 셸 + 진도 오버레이 패턴, `lib/supabase/{server,client}` 분리, Server Action 변이 경계, 진행률 집계는 순수 함수
- `.planning/research/PITFALLS.md` — Pitfall 2(과잉 인증 금지)·3(RLS 양방향 함정)·"progress %는 서버에서 계산, localStorage 서버 미확인 읽기 금지, 캐시 무효화" — D-17/D-28의 근거
- `.planning/research/STACK.md` — `@supabase/ssr` 0.12.4 + `supabase-js` 2.x 버전 호환성

### 이전 Phase 결정
- `.planning/phases/01-deployed-curriculum-skeleton/01-CONTEXT.md` — D-01~D-16 (D-04 Step accent 색, D-07 Step 카드 진행률 자리, D-08 이전/다음 버튼, D-09 내비 4항목)

### 프로젝트 규칙
- `.planning/PROJECT.md` — KANT 금지 HARD RULE, iPad 1순위, 1인 사용
- `.claude/CLAUDE.md` — 스택 가이드 (단, 익명 로그인 권장 부분은 D-17이 대체)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/step-card.tsx` — 진행률 바가 이미 렌더됨(`progressPercent = 0` 하드코딩 + 주석으로 Phase 2 연결 명시). 실데이터만 주입하면 됨
- `src/components/module-accordion.tsx` — 모듈별 진행률 카운트가 들어갈 목록 UI
- `src/components/lesson-nav.tsx` — 이전/다음 버튼. 완료 버튼(D-21)이 이 바로 위에 삽입됨
- `src/content/curriculum-helpers.ts` — `getModulesByStep`, `getLessonCounts` 등 매니페스트 조회 헬퍼. 진행률 집계 함수의 기반

### Established Patterns
- 전 페이지 정적 생성(generateStaticParams) — 진도 오버레이는 서버 컴포넌트/클라이언트 아일랜드로 층을 나눠야 함 (ARCHITECTURE.md 패턴 1)
- Tailwind 커스텀 토큰(`bg-accent`, `border-step-N`, `dark:` 쌍) — 새 진도 UI도 동일 토큰 체계 사용
- 클라이언트 컴포넌트는 최소 아일랜드(site-nav, theme-toggle 수준)로 유지

### Integration Points
- Supabase 미도입 상태 — `@supabase/supabase-js`·`@supabase/ssr` 설치, Supabase 프로젝트 생성, env 배선(Vercel 포함)이 이 Phase에서 처음 발생
- `middleware.ts` 신설(시크릿 쿠키 확인), `/unlock` 라우트 신설
- 홈 `src/app/page.tsx`(요약 블록), `src/app/step/`(모듈 진행률), `src/app/lesson/`(완료 버튼) 세 표면에 진도 데이터 주입

</code_context>

<specifics>
## Specific Ideas

- 완료 체크 전환 애니메이션을 "화려하게 만들어 성취감 느끼도록" — 사용자가 직접 강조한 요청. 밋밋한 체크박스 전환이 아니라 보상감 있는 연출일 것
- 아이패드 북마크에서 탭 한 번으로 잠금 해제되는 비밀 링크 흐름 (타이핑 없음)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 2-진도 체크와 진행률*
*Context gathered: 2026-08-24*
