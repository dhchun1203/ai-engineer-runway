# Phase 1: 배포된 커리큘럼 뼈대 - Context

**Gathered:** 2026-08-24
**Status:** Ready for planning

<domain>
## Phase Boundary

배포된 Vercel URL에서 아이패드로 접속해 커리큘럼 3단 구조(Step → 모듈 → 레슨)를 탐색하고 실제 파일럿 레슨 2개를 읽을 수 있는 사이트 뼈대. Next.js 스캐폴드 + 커리큘럼 매니페스트(19개 모듈, 깊이 배지·예상 소요시간 메타데이터 포함) + MDX 콘텐츠 파이프라인 + iPad 우선 반응형 셸 + Making-of 페이지 스캐폴드 + GitHub 연동 Vercel 자동 배포. 진도 저장(Phase 2), 일정표/오늘의 학습(Phase 3), 본격 콘텐츠 집필(Phase 4~5)은 이 Phase 범위 밖.

</domain>

<decisions>
## Implementation Decisions

### 사이트명 & 브랜딩
- **D-01:** 사이트명은 **AI Engineer Runway** — 헤더 로고, 브라우저 탭 `<title>`, OG 태그에 사용 — **Reversibility:** costly — 배포 URL·OG·Making-of 문서 등 노출면 전체에 퍼지므로 변경 시 전면 수정
- **D-02:** 웹에 공개되는 어떤 표면에도 "KANT" 언급 금지 (HARD RULE, PROJECT.md Constraints) — 과정명은 항상 "AI Engineer 교육과정" — **Reversibility:** one-way — 공개 배포 후 노출되면 회수 불가

### 비주얼 방향
- **D-03:** 차분한 딥블루/청록 계열 베이스 — 장시간 학습에 편안한 톤, 진행률·완료 상태가 눈에 띄는 포인트 컬러
- **D-04:** Step 1/2/3에 각기 다른 상징 색(accent) 부여 — 카드·배지·진행률 바에 적용해 현재 위치 인지 지원
- **D-05:** 다크모드: 시스템 설정 자동 + 수동 토글 — iPad 야간 학습 대비
- **D-06:** 한국어 타이포그래피: Pretendard + `word-break: keep-all` (UX-03, 리서치 확정 사항)

### 내비게이션 구조
- **D-07:** 커리큘럼 탐색은 대시보드 카드 → 드릴다운: 홈에 Step 카드 3장(진행률 표시 자리 포함) → Step 페이지에서 모듈 아코디언 → 레슨 목록 → 레슨 페이지
- **D-08:** 레슨 페이지 이동: 상단 브레드크럼(Step > 모듈) + 본문 끝 큰 이전/다음 레슨 버튼 (터치 타깃 44px+)
- **D-09:** 글로벌 내비 4항목: 오늘의 학습 · 커리큘럼 · 일정표 · 소개(Making-of) — Phase 1에서는 커리큘럼·소개만 활성, 오늘/일정은 자리만 잡고 "준비 중" 비활성 표시 (Phase 3에서 활성화)

### 레슨 템플릿
- **D-10:** 모든 레슨은 6단 구성 표준 템플릿을 따름: ① 학습 목표 → ② 왜 배우나 → ③ 개념 설명(비유 포함) → ④ 실무 예제 → ⑤ 실무 팁 → ⑥ 핵심 정리·스스로 점검 — **Reversibility:** costly — Phase 4~5에서 35+ 레슨이 이 템플릿으로 집필되므로 이후 변경 시 전체 레슨 수정
- **D-11:** 파일럿 레슨 2개: Step 1 "Python 변수·자료형" + Step 2 "React 컴포넌트" — 템플릿·파이프라인 검증용이자 실제 학습 콘텐츠
- **D-12:** 실무 예제는 복사해서 돌아가는 완결 코드 + 실행 방법 명시 (예: `python variables.py`) — 읽기 전용 스니펫 금지
- **D-13:** 깊이 배지(심화/개요)와 예상 소요시간은 커리큘럼 매니페스트 메타데이터로 전 레슨에 확정 (CONT-04, Phase 3 일정 배분의 입력값)

### 저장소/배포
- **D-14:** GitHub 저장소 **공개** — 코드 자체가 포트폴리오, Making-of에서 저장소 링크 가능. 비밀값은 env로 분리
- **D-15:** 저장소·Vercel 프로젝트명 `ai-engineer-runway` (URL: ai-engineer-runway.vercel.app 계열) — **Reversibility:** costly — 배포 URL 변경은 링크·OG 캐시에 영향
- **D-16:** GitHub 연동 자동 배포 — main 푸시마다 프로덕션 배포, PR 프리뷰 활성 (커리큘럼 표준 CI/CD 흐름 경험 목적)

### Claude's Discretion
- 딥블루/청록 팔레트의 구체 색값, Step별 accent 색 선정, 타이포 스케일, 카드/배지 디테일
- Velite 스키마 설계, 매니페스트 파일 구조, 라우팅 세그먼트 구성
- Making-of 페이지 레이아웃 (docs/making-of.md 내용을 렌더링, 단계별 타임라인 형태 권장)
- 레슨별 예상 소요시간 수치 산정 (커리큘럼 시간 배분 200h/336h/520h과 깊이 방침 기반)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 커리큘럼 & 콘텐츠
- `.planning/curriculum.md` — 커리큘럼 원문 source of truth (3 Steps / 19 모듈 / 프로젝트 5종) — 매니페스트는 이 구조를 그대로 반영해야 함
- `docs/making-of.md` — Making-of 페이지의 원천 문서 — Phase 1에서 이 내용을 렌더링하는 페이지 스캐폴드 필요

### 리서치 (스택·아키텍처 확정 사항)
- `.planning/research/STACK.md` — Next.js 16/React 19, Velite, rehype-pretty-code/Shiki, Tailwind v4, Pretendard, 버전 호환성
- `.planning/research/ARCHITECTURE.md` — 콘텐츠=파일/진도=Supabase 분리, SSG + Server Action 패턴, 빌드 순서
- `.planning/research/PITFALLS.md` — RLS 함정, MDX 파이프라인 함정, 한국어 폰트 서브셋, 배포 조기화 근거

### 프로젝트 규칙
- `.planning/PROJECT.md` — Constraints의 KANT 금지 HARD RULE, iPad 1순위 규칙
- `.claude/CLAUDE.md` — 프로젝트 가이드

</canonical_refs>

<code_context>
## Existing Code Insights

그린필드 — 기존 코드 없음. 저장소에는 `.planning/`(GSD 산출물)과 `docs/making-of.md`만 존재.

### Integration Points
- `docs/making-of.md` → 사이트의 소개 페이지 콘텐츠로 연결 (MDX/마크다운 렌더링)
- `.planning/curriculum.md` → 커리큘럼 매니페스트(TypeScript)로 변환되는 원천

</code_context>

<specifics>
## Specific Ideas

- 홈 대시보드의 Step 카드에는 Phase 2에서 진행률 바가 들어올 자리를 미리 설계 (0% 상태로 렌더링해도 됨)
- 레슨 카드/헤더: 깊이 배지(심화=Step accent 색, 개요=중성색)와 예상 소요시간(예: "약 2h") 병기
- 개강 D-day는 Phase 3 범위지만, 헤더에 "2026-09-30 개강" 정적 표기는 Phase 1에서 넣어도 좋음 (Claude 재량)

</specifics>

<deferred>
## Deferred Ideas

- 진도 저장·진행률 실데이터 — Phase 2
- 오늘의 학습·일정표·D-day on-track 계산 — Phase 3
- 레슨 검색/필터, 레슨 노트, PWA — v2 (REQUIREMENTS.md)

</deferred>

---

*Phase: 1-배포된 커리큘럼 뼈대*
*Context gathered: 2026-08-24*
