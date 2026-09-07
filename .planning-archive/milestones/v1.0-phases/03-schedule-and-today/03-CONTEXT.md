# Phase 3: 학습 일정과 오늘의 학습 - Context

**Gathered:** 2026-08-24
**Status:** Ready for planning

<domain>
## Phase Boundary

학습자가 사이트를 열면 오늘 무엇을 공부해야 하는지, 개강(2026-09-30)까지 페이스가 맞는지 즉시 알 수 있다. 8/25~9/29 일자별 학습 일정표(날짜→레슨 매핑), 기본 랜딩이 되는 "오늘의 학습" 뷰, 레슨별 예상 소요시간 기반 배분, D-day 카운트다운과 시간 가중 on-track/behind 페이스 판정 (SCHED-01~04). 레슨 본문 콘텐츠 집필(Phase 4~5), 일정 리밸런싱(CONV-03, v2)은 범위 밖.

</domain>

<decisions>
## Implementation Decisions

### 레슨 분량·일정 배분 (SCHED-01, SCHED-03)
- **D-31:** **전 레슨 예상 소요시간 일괄 하향** — 심화 일반 레슨 270→**150min(2.5h)**, 개요 일반 레슨 180→**90min(1.5h)**, 프로젝트 준비 가이드(심화 150·개요 120)→**60min(1h)**. 총 131h→**70h**. 근거: 이 사이트의 목적은 사전학습(훑기+기초 다지기)이지 마스터가 아님 (사용자 명시). 35개 레슨 mdx의 `estimatedMinutes` 프론트매터를 이 기준으로 갱신하는 작업이 Phase 3에 포함됨 — **Reversibility:** costly — 이 수치는 Phase 4~5 레슨 본문 집필 분량의 기준이 되므로, 콘텐츠 집필 후 변경하면 35+ 레슨 본문과 일정 전체 재작업
- **D-32:** **하루 1레슨 고정 배정** — 8/25부터 커리큘럼 순서(Step→모듈→order)대로 35개 레슨을 35일간 하루 하나씩 배정, 하루 1~2.5h(평균 2h)로 "하루 3시간 이내" 기준 충족. 레슨 분할 없음, 하루 1레슨이므로 모듈 경계 자동 존중
- **D-33:** **일정은 빌드 타임 고정(정적)** — 날짜→레슨 매핑은 코드/빌드에서 결정론적으로 생성되며 진도에 따라 움직이지 않음. 밀리면 behind 표시만. 동적 리밸런싱(CONV-03)은 v2
- **D-34:** **9/29는 복습·버퍼일** — 레슨 배정 없는 날로 일정표에 명시(밀린 분량 소화·복습 용도 안내), 9/30 개강 D-day 행으로 일정표 마무리
- **D-35:** ROADMAP 성공 기준 1의 "하루 4~6시간 범위"는 이 결정으로 **"하루 3시간 이내(평균 약 2h)"로 대체**됨 — 사용자가 페이스 기준을 직접 변경함. ROADMAP.md 성공 기준 문구 갱신 필요 (PROJECT.md의 "하루 4~6시간 투자 가능" 가정도 동일 취지로 완화)

### 오늘의 학습 화면 (SCHED-02)
- **D-36:** **홈(/) 자체를 '오늘의 학습'으로 재편** — D-day 카운트다운, 오늘 배정 레슨(완료 상태·바로가기), 페이스 상태, 기존 전체 진행률 요약 블록(D-25 예고대로 흡수) 포함. Step 카드 대시보드는 **/curriculum**으로 이동하고 글로벌 내비 "커리큘럼"이 그리로 연결, "오늘의 학습"은 /, "일정표"는 신설 라우트로 연결되어 내비 4항목(D-09) 전부 활성화 — **Reversibility:** costly — 라우팅·내비·홈 구성이 전면 재배치되므로 되돌리면 Phase 2 홈 구조 복원 필요
- **D-37:** **일정은 공개, 진도만 게이트** — 일정표·오늘 배정 레슨·D-day는 정적 정보로 쿠키 없이도 공개(공개 포트폴리오 D-14 유지). 완료 체크·진행률·on-track/behind 등 진도 파생 UI는 시크릿 쿠키 보유 시에만 렌더 (D-20 원칙 유지)
- **D-38:** 오늘 배정 레슨을 모두 완료했거나 앞서 있으면 **축하 메시지 + 내일 레슨 미리보기** 표시, 원하면 내일 레슨으로 이동 가능 (자동 유도·강요 없음)
- **D-39:** behind일 때 오늘 배정 레슨 아래 **"밀린 레슨" 섹션 별도 표시** — 미완료 과거 배정분을 나열해 따라잡기 대상을 명확히

### 페이스 판정·표현 (SCHED-04)
- **D-40:** **시간 가중 판정** — 기준일까지 배정된 레슨의 estimatedMinutes 합 vs 완료된 배정 레슨의 minutes 합으로 판정 (D-26에서 예고한 Phase 3 몫 이행)
- **D-41:** **판정 기준일은 "어제까지 배정분"** — 오늘 배정 레슨은 판정에서 제외(오늘 안에 하면 되는 분량). 어제까지 배정분을 모두 완료했으면 on-track, 오늘 이후 배정분까지 완료했으면 ahead
- **D-42:** **3단계 상태: ahead(앞서감) / on-track(순항) / behind(밀림)** — 앞서 있을 때 긍정 피드백 제공
- **D-43:** behind 표현은 **정량 + 가벼운 따라잡기 안내** — "약 N시간 분량(레슨 M개) 밀림" + "하루 30분씩 추가하면 K일이면 따라잡아요" 수준의 안내 문구. 압박이 아닌 안내 톤

### 일정표 뷰 (SCHED-01)
- **D-44:** **주 단위(1~6주차) 세로 리스트** — 주차 그룹 아래 날짜별 행. iPad 세로/가로 모두 무난한 스크롤 동선
- **D-45:** 행은 **한 줄 요약형** — 날짜 · 레슨명 · 소요시간 · 깊이 배지 · 완료 체크(쿠키 보유 시)를 한 줄에, 행 전체가 레슨 링크(터치 타깃 44px+)
- **D-46:** **지난 날짜 완료 반영 + 오늘 강조** — 지난 날짜는 완료/미완료 표시(쿠키 보유 시)와 톤 다운, 오늘 행은 accent 강조, 페이지 진입 시 오늘 위치로 자동 스크롤

### Claude's Discretion
- "오늘" 판정의 시간대 기준 — **Asia/Seoul 고정** 권장 (사용자 1인·한국 거주). 정적 페이지 위에서 오늘 날짜를 반영하는 렌더링 전략(클라이언트 계산 vs 동적 렌더링)은 리서치·플래너 판단
- 일정 생성 방식 세부 — 빌드 타임 결정론적 생성이면 형태 자유 (매니페스트에서 파생 계산 권장, 35개 수동 매핑 하드코딩 지양)
- 오늘의 학습·일정표의 레이아웃 디테일, 주차 라벨 문구, D-day·페이스 배지의 시각 디자인 (Phase 1 디자인 토큰·Step accent D-04 준수)
- 따라잡기 안내 문구의 구체 계산식과 표현
- /curriculum 이동 시 기존 홈 컴포넌트(progress-summary, step-card) 재배치 세부

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 커리큘럼·레슨 메타데이터
- `src/content/modules.ts` — 3 Step·19 모듈 정적 매니페스트 (스크립트가 정규식으로 파싱하므로 형태 유지 주의)
- `src/content/curriculum-helpers.ts` — `getOrderedLessons` 등 조회 헬퍼. 일정 생성의 입력
- `velite.config.ts` — 레슨 프론트매터 스키마 (`estimatedMinutes`, `depth`) — D-31 하향 시 스키마는 유지, 값만 변경
- `src/content/lessons/**/*.mdx` — 35개 레슨. `estimatedMinutes` 일괄 갱신 대상 (D-31)

### 이전 Phase 결정
- `.planning/phases/01-deployed-curriculum-skeleton/01-CONTEXT.md` — D-09(내비 4항목·"준비 중" 자리), D-13(소요시간 메타데이터), D-04(Step accent)
- `.planning/phases/02-progress-tracking/02-CONTEXT.md` — D-17~D-20(시크릿 쿠키·진도 게이트), D-25(홈 요약 블록 → Phase 3 흡수 예고), D-26(시간 가중은 Phase 3 몫), D-27('이어서 학습하기' 임시 랜딩), D-30(completed_at — 페이스 계산 입력)

### 아키텍처·스택 (리서치 확정 사항)
- `.planning/research/ARCHITECTURE.md` — 정적 셸 + 진도 오버레이 패턴, 서버 전용 진도 읽기 경계
- `.planning/research/PITFALLS.md` — 캐시 무효화·진도 표시 함정
- `.planning/PROJECT.md` — KANT 금지 HARD RULE, iPad 1순위, 1인 사용

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/site-nav.tsx` — "오늘의 학습"·"일정표" 자리가 "준비 중" 비활성으로 예약됨 (D-09). href 연결로 활성화
- `src/components/progress-summary.tsx` — 홈 진행률 요약 블록. 오늘의 학습 화면으로 흡수 (D-25→D-36)
- `src/components/step-card.tsx`, `module-accordion.tsx` — /curriculum으로 이동할 커리큘럼 대시보드 구성 요소
- `src/components/estimated-time.tsx`, `depth-badge.tsx` — 일정표 행·오늘의 학습 레슨 표시에 재사용
- `src/lib/progress-store.ts` — `completed_at` 저장됨 (D-30). 페이스 판정·완료 표시 입력
- `src/lib/progress-math.ts` — 진행률 집계 순수 함수. 시간 가중 페이스 계산 함수의 기반/동거처 후보

### Established Patterns
- 전 페이지 정적 생성 + 진도는 서버 전용 오버레이 (쿠키 게이트, D-17~D-20) — 오늘의 학습·일정표도 동일 층 분리 필요. 단 "오늘 날짜"라는 새 동적 축이 추가됨 (시간대·렌더링 전략은 리서치 대상)
- Tailwind 커스텀 토큰(`bg-accent`, `border-step-N`, `dark:` 쌍) — 새 UI도 동일 체계
- 클라이언트 컴포넌트는 최소 아일랜드 유지

### Integration Points
- `src/app/page.tsx` — 오늘의 학습으로 재편 (D-36)
- `src/app/curriculum/` 신설 — 기존 홈 대시보드 이동
- 일정표 라우트 신설 (예: `src/app/schedule/`) — 내비 "일정표" 연결
- `src/content/lessons/**/*.mdx` 프론트매터 — estimatedMinutes 일괄 하향 (D-31)

</code_context>

<specifics>
## Specific Ideas

- "이 사이트의 목적은 사전학습이지 마스터가 아니야" — 분량·톤의 기준. 일정과 안내 문구 모두 압박 없는 가벼운 페이스 유지
- behind 안내는 "하루 30분씩 추가하면 K일이면 따라잡아요" 같은 실행 가능한 안내 톤 (질책 아님)
- 앞서 있으면(ahead) 긍정 피드백 — 게이미피케이션 없이 문구·상태 표시로만

</specifics>

<deferred>
## Deferred Ideas

- 놓친 날짜 발생 시 남은 일정 자동 리밸런싱 — v2 (CONV-03, REQUIREMENTS.md에 이미 등재)

</deferred>

---

*Phase: 3-학습 일정과 오늘의 학습*
*Context gathered: 2026-08-24*
