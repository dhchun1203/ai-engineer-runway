# Roadmap: AI Engineer 사전학습 사이트

## Overview

2026-09-30 개강까지 5주. 로드맵의 축은 하나다 — **플랫폼은 짧게, 콘텐츠에 길게.** Phase 1~3(뼈대·진도·일정)이 학습 루프 전체를 배포된 URL 위에서 동작하게 만들고, 여기까지를 약 1주 안에 끝낸다. 남은 4주는 Phase 4~5의 콘텐츠 집필(35+ 한국어 레슨, 70~100h)에 쓴다. Phase 1에서 Vercel 배포와 파일럿 레슨 2개를 먼저 세워 환경 문제를 콘텐츠 스프린트 전에 털어내고, Phase 4에서 Step 1 콘텐츠가 완성되는 즉시 실제 사전학습을 시작하면서 Phase 5의 Step 2·3 콘텐츠를 병행 집필한다. 주 학습 기기는 아이패드이므로 반응형·터치 기준은 Phase 1에서 확립하고 이후 모든 화면이 그 기준을 따른다.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: 배포된 커리큘럼 뼈대** - Vercel URL에서 Step→모듈→레슨을 아이패드로 탐색하고 파일럿 레슨을 읽는다 (completed 2026-08-24)
- [x] **Phase 2: 진도 체크와 진행률** - 레슨 완료를 토글하고 모듈·Step·전체 진행률을 확인한다 (completed 2026-08-24)
- [x] **Phase 3: 학습 일정과 오늘의 학습** - 8/25~9/29 일정표와 오늘 배정 레슨, D-day·페이스 상태를 본다 (completed 2026-08-25)
- [ ] **Phase 4: Step 1 심화 콘텐츠** - Python·Git·SQL·ML 기초 전 레슨을 개념 설명 + 실무 예제로 학습한다
- [x] **Phase 5: Step 2·3 콘텐츠와 프로젝트 가이드** - 풀스택·LLM 심화와 RAG·오케스트레이션 개요, 프로젝트 5종 준비 가이드를 학습한다 (completed 2026-08-26)
- [ ] **Phase 6: 전체 페이지 디자인 정리** - 모든 화면이 존재하는 상태에서 디자인 토큰·셸·페이지 마감을 한 번에 다듬는다
- [ ] **Phase 7: 아이패드 브라우저 실습 환경** - 레슨 해보기를 PC 없이 아이패드 브라우저에서 실행한다

## Phase Details

### Phase 1: 배포된 커리큘럼 뼈대

**Goal**: 학습자가 배포된 URL에 아이패드로 접속해 커리큘럼 3단 구조를 탐색하고 실제 레슨을 읽을 수 있다
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: CONT-01, CONT-04, CONT-06, PLAT-01, PLAT-03, UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):

  1. 학습자가 공개 Vercel URL에 접속해 3 Step / 19 모듈 / 전체 레슨 목록을 탐색하고 레슨 페이지로 이동할 수 있다
  2. 실제 콘텐츠가 담긴 파일럿 레슨 2개(Step 1 + Step 2 각 1개)가 렌더링되고, 코드 블록이 언어별 하이라이팅과 복사 버튼을 갖는다
  3. 모든 레슨 카드·헤더에 깊이 배지(심화/개요)와 예상 소요시간이 표시되고, Step 3 레슨은 개요로 분류되어 있다
  4. 아이패드 Safari 세로/가로 모드에서 레이아웃이 정상 동작하고(터치 타깃 44px+, 코드 블록 가로 스크롤, 한국어 keep-all 줄바꿈), 폰·데스크톱에서도 반응형으로 동작한다
  5. Making-of 페이지가 자료 수집 → 리서치 → 스택 선택 이유까지 기록하고 있으며, 이후 단계마다 갱신할 구조를 갖는다

**Plans**: 6/6 plans executed (웨이브 1~6, 완전 직렬 — 단일 빌드 디렉터리·단일 git 워크트리 공유)
**Wave 1**

- [x] 01-01-PLAN.md — Walking Skeleton: MDX 한 편이 Velite→Shiki→정적 라우트를 통과해 렌더되고 공개 저장소에 푸시된다

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Vercel 배포: 프로덕션 URL 개통, main 푸시 자동 배포와 PR 프리뷰 확인, Making-of 5단계 기록

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — 커리큘럼 매니페스트: 19개 모듈 + 35개 레슨 메타데이터(깊이 배지·예상 소요시간)와 불변식 게이트

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-04-PLAN.md — 탐색 라우트: 홈 Step 카드 → 모듈 아코디언 → 레슨 목록 → 레슨 페이지(브레드크럼·이전/다음·준비 중 상태)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 01-05-PLAN.md — 글로벌 셸: 내비 4항목·다크모드 토글·사이트 메타데이터/OG, Making-of 소개 페이지, 브랜드 노출 게이트

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 01-06-PLAN.md — 파일럿 레슨 2 실콘텐츠 + 실콘텐츠 기준 한국어 타이포·코드 블록·터치 타깃 확정 + Phase 최종 게이트

**UI hint**: yes

### Phase 2: 진도 체크와 진행률

**Goal**: 학습자가 레슨 완료를 체크하고 자신이 커리큘럼의 어디까지 왔는지 한눈에 확인할 수 있다
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: TRACK-01, TRACK-02, TRACK-03, TRACK-04, PLAT-02
**Success Criteria** (what must be TRUE):

  1. 학습자가 레슨 페이지에서 완료 버튼을 누르면 상태가 저장되고, 새로고침·아이패드↔데스크톱 기기 전환 후에도 유지된다
  2. 완료된 레슨을 다시 눌러 미완료로 되돌릴 수 있다
  3. 모듈 목록과 Step 목록에 진행률(%와 완료/전체 개수)이 표시된다
  4. 대시보드에서 전체 진행률과 Step별 진행률을 한 화면에서 확인할 수 있다
  5. 로그인 화면 없이 바로 진도를 기록할 수 있으면서도, 외부인이 URL만으로 내 진도를 읽거나 변경할 수 없다

**Plans**: 4/4 plans executed (웨이브 1~4, 완전 직렬 — 단일 빌드 디렉터리·단일 git 워크트리 공유)

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — 진도 저장소 개통: Supabase 프로젝트·progress 테이블(RLS 정책 0개)·서버 전용 접근 계층·시크릿/왕복 게이트

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — 트레이서: 잠금 쿠키 → 게이트된 레슨 페이지 → 낙관적 완료 토글 → Server Action → Supabase 저장 → 새로고침 유지, `/unlock` 비밀 링크

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03-PLAN.md — 모듈·Step 진행률: 의존성 0 순수 집계와 단위 게이트, 진행률 배지, 완료 표식 아코디언, Step 페이지 주입

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 02-04-PLAN.md — 홈 대시보드: 전체 진행률 요약 블록·이어서 학습하기 CTA·Step 카드 실데이터, Phase 종단 게이트

**UI hint**: yes

### Phase 3: 학습 일정과 오늘의 학습

**Goal**: 학습자가 사이트를 열면 오늘 무엇을 공부해야 하는지, 개강까지 페이스가 맞는지 즉시 알 수 있다
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: SCHED-01, SCHED-02, SCHED-03, SCHED-04
**Success Criteria** (what must be TRUE):

  1. 2026-08-25 ~ 09-29 일자별 학습 일정표가 제공되고, 각 날짜에 배정된 레슨과 그날의 총 소요시간이 하루 3시간 이내(하루 1레슨, 평균 약 2시간) 기준에 들어온다
  2. 사이트 기본 화면이 "오늘의 학습"이며, 오늘 배정 레슨과 각 레슨의 완료 여부를 보여주고 레슨 페이지로 바로 이동할 수 있다
  3. 모든 레슨에 예상 소요시간이 표시되고, 일정 배분이 그 수치를 근거로 계산된다
  4. 개강일(2026-09-30) D-day 카운트다운과 함께, 오늘까지 배정된 분량 대비 완료 진도를 비교한 on-track/behind 상태가 표시된다

**Plans**: 4/4 plans executed (웨이브 1~4, 완전 직렬 — 단일 빌드 디렉터리·단일 git 워크트리 공유)

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — 트레이서: 매니페스트 → today/schedule 순수 계산 → 홈 '오늘의 학습'(D-day·오늘 레슨) → /curriculum 이전 → 내비 4항목 점등

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — 예상 소요시간 D-31 일괄 하향(총 70시간)과 총합·분포·파생 규칙 매니페스트 불변식, D-35 문구 반영

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03-PLAN.md — 시간 가중 페이스 판정(ahead/on-track/behind)·밀린 레슨·축하 상태와 쿠키 유/무 종단 검증

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 03-04-PLAN.md — /schedule 36행 주 단위 일정표·오늘 행 자동 스크롤, phase 종단 게이트, 아이패드 실기기 UAT

**UI hint**: yes

### Phase 4: Step 1 심화 콘텐츠

**Goal**: 학습자가 Step 1(개발 기반 구축) 전체를 사이트에서 실제로 학습하고 완료 체크할 수 있다 — 사전학습이 여기서 시작된다
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CONT-02, CONT-03
**Success Criteria** (what must be TRUE):

  1. Step 1의 5개 모듈(온보딩·Git/생성형AI·Python·SQL·ML 기초) 전 레슨이 작성되어 읽을 수 있다
  2. 각 레슨이 비유와 핵심 정리를 포함한 쉬운 개념 설명을 제공해, 사전지식 없이 읽고 이해할 수 있다
  3. 각 레슨이 커리큘럼 동일 스택(Python, SQL/PostgreSQL, Git)의 실행 가능한 실무 예제 코드를 언어별 하이라이팅과 함께 제공한다
  4. Step 1 레슨을 진행하면 Step 1 진행률과 오늘의 학습 뷰가 실제로 채워지며 학습 루프가 끝까지 동작한다

**Plans**: 6/7 plans executed (Wave 1: 파일럿 + 승인 / Wave 2: 9편 병렬 집필 / Wave 3: 게이트·카피·배포)

Plans:
**Wave 1**

- [x] 04-01-PLAN.md — 파일럿 레슨 eli5 재작성 + `<details>` 스타일 + 구조 게이트 신설 + 아이패드 승인 (tracer, wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02-PLAN.md — 1-1 모듈 2편: 커리큘럼 지도·하루 루틴 / 개발 환경 세팅 (wave 2)
- [x] 04-03-PLAN.md — 1-2 모듈 2편: Git 브랜치·PR / 생성형 AI 개념·활용 윤리 (wave 2)
- [x] 04-04-PLAN.md — 1-3 모듈 1편: Python 함수·예외·파일 입출력 (wave 2)
- [x] 04-05-PLAN.md — 1-4 모듈 2편: 관계형 DB 구조 / SQL 쿼리·JOIN·집계 (wave 2)
- [x] 04-06-PLAN.md — 1-5 모듈 2편: 분류·회귀·군집 / 평가 지표·Pipeline (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 04-07-PLAN.md — 매니페스트 상수 갱신·빈 상태 카피·making-of·종단 e2e·배포 (wave 3)

**Cross-cutting constraints:**

- 두 레슨 모두 6개 헤딩이 원문 그대로 순서대로 있고, `### 해보기` 2~3개와 접힌 `<details><summary>정답 보기</summary>` 정답 블록, `**이 레슨의 단어**` 5~8행 표를 갖는다 (D-47, D-49, D-50, D-61)
- 두 레슨의 `hasContent`가 `false`에서 `true`로 바뀌고, 그 외 프론트매터 7개 필드는 바이트 단위로 동일하다 (D-13)
- `node scripts/check-lesson-structure.mjs`와 `node scripts/check-brand.mjs`가 exit 0이고, `npm run build`가 성공한다
- 두 레슨의 읽기 산문이 30분 안쪽으로 읽히고 나머지 시간은 해보기 과제가 채운다 (D-49)

### Phase 5: Step 2·3 콘텐츠와 프로젝트 가이드

**Goal**: 학습자가 커리큘럼 전체(Step 2 풀스택·LLM 심화 + Step 3 RAG·오케스트레이션 개요)와 실습 프로젝트 5종 준비 가이드를 사이트에서 학습할 수 있다
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: CONT-05
**Success Criteria** (what must be TRUE):

  1. Step 2의 7개 모듈(DB/Supabase, 프론트엔드, TypeScript·React/Next, 백엔드·Express/Prisma, 프롬프트 엔지니어링 포함) 전 레슨이 심화 콘텐츠로 작성되어 읽을 수 있다
  2. Step 3의 7개 모듈(RAG, 모델 고도화, 오케스트레이션, LLMOps)이 개념·용어 중심 개요 콘텐츠로 작성되어, 개강 후 학습에 필요한 용어를 미리 알 수 있다
  3. 커리큘럼 실습 프로젝트 5종이 각각 개요·사전 준비 가이드 레슨으로 제공된다 (본 과정 재현이 아닌 준비 안내)
  4. 전체 커리큘럼 진행률이 100%까지 도달 가능한 상태가 되고, Making-of 페이지가 구현→검증→배포 과정까지 기록을 마친다

**Plans**: 13/13 plans executed (5 waves)

Plans:
**Wave 1**

- [x] 05-01-PLAN.md — [wave 1] 파일럿 3편(2-3 재작성·3-1 개요 신규·2-4 프로젝트 가이드 신규) + 게이트 Step 2·3 확대 + 아이패드 승인 체크포인트

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 05-02-PLAN.md — [wave 2] 2-1 모듈 2편 (PostgreSQL·Supabase, AI 데이터 구조 설계)
- [x] 05-03-PLAN.md — [wave 2] 2-2 모듈 2편 (HTML·CSS·JS, 브라우저 동작 원리)
- [x] 05-04-PLAN.md — [wave 2] 2-5 모듈 2편 (Express REST API, 인증·인가·Prisma)
- [x] 05-05-PLAN.md — [wave 2] 2-3-typescript-setup + 2-6 프로젝트 가이드
- [x] 05-06-PLAN.md — [wave 2] 2-7 모듈 2편 (프롬프트 패턴·구조화 출력, PromptOps)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 05-07-PLAN.md — [wave 3] Step 2 배치 마감 — 매니페스트 상수 실측 갱신 + 12편 배포

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 05-08-PLAN.md — [wave 4] 3-1-hybrid 개요 + 3-2 프로젝트 가이드
- [x] 05-09-PLAN.md — [wave 4] 3-3 모듈 2편 (PEFT·LoRA·QLoRA, 튜닝 전후 비교)
- [x] 05-10-PLAN.md — [wave 4] 3-4 모듈 3편 (멀티 에이전트 구조, Webhook·스케줄·HITL, n8n·LangGraph)
- [x] 05-11-PLAN.md — [wave 4] 3-5 + 3-7 프로젝트 가이드 — CONT-05 완성
- [x] 05-12-PLAN.md — [wave 4] 3-6 모듈 3편 (프롬프트 버전관리·평가, 모니터링·거버넌스, 구조화 출력·카나리)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 05-13-PLAN.md — [wave 5] Phase 마감 — 최종 상수 35 + 준비 중 카피·UI-SPEC + Making-of + 진행률 100% e2e

**Cross-cutting constraints:**

- 두 레슨의 프론트매터에서 `hasContent: false → true` 한 줄 외에는 어떤 필드도 바뀌지 않았다 (D-13)
- 읽기 산문이 150분을 채우지 않고, 늘어난 분량은 해보기·정답 블록·단어 표가 차지한다 (D-49 승계)
- 두 레슨 모두 `### 해보기` 2~3개 + 해보기 개수 + 2 이상의 접힌 정답 블록 + `**이 레슨의 단어**` 표 5~8행을 갖고 `node scripts/check-lesson-structure.mjs`를 통과한다 (D-69)
- 두 레슨 모두 6단 헤딩 원문 유지 + `### 해보기` 2~3개 + 해보기 개수 + 2 이상의 접힌 정답 블록 + `**이 레슨의 단어**` 표 5~8행을 갖고 `node scripts/check-lesson-structure.mjs`를 통과한다 (D-65, D-69)
- 세 레슨 모두 코드가 읽기용 스니펫 하나씩뿐이고 '지금 실행할 필요 없습니다' 취지의 안내가 붙어 있으며 설치·실행 명령이 0건이다 (D-63)
- 세 레슨 모두 6단 헤딩 원문 유지 + `### 해보기` 2~3개 + 해보기 개수 + 2 이상의 접힌 정답 블록 + `**이 레슨의 단어**` 표 5~8행을 갖고 `node scripts/check-lesson-structure.mjs`를 통과한다 (D-65, D-69)
- 세 레슨의 프론트매터에서 `hasContent: false → true` 한 줄 외에는 어떤 필드도 바뀌지 않았다 (D-13)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 배포된 커리큘럼 뼈대 | 6/6 | Complete    | 2026-08-24 |
| 2. 진도 체크와 진행률 | 4/4 | Complete    | 2026-08-24 |
| 3. 학습 일정과 오늘의 학습 | 4/4 | Complete    | 2026-08-25 |
| 4. Step 1 심화 콘텐츠 | 6/7 | In Progress|  |
| 5. Step 2·3 콘텐츠와 프로젝트 가이드 | 13/13 | Complete    | 2026-08-26 |
| 6. 전체 페이지 디자인 정리 | 5/8 | In Progress|  |

## Coverage Notes

**교차 요구사항 처리 (CONT-02, CONT-03, CONT-04)**

이 세 요구사항은 "모든 레슨"에 걸치는 품질 기준이라 단일 Phase에 딱 떨어지지 않는다. 중복 매핑을 피하기 위해 각 기준이 **처음 완전히 충족되고 검증되는 Phase**에 귀속시켰다:

| 요구사항 | 귀속 Phase | 이유 | 이후 Phase에서 |
|---|---|---|---|
| CONT-04 (깊이 배지) | Phase 1 | 배지·깊이 방침은 커리큘럼 매니페스트 메타데이터 — 레슨 본문 없이도 Phase 1에서 전 레슨에 적용·표시됨 | 변경 없음 |
| CONT-02 (쉬운 개념 설명) | Phase 4 | Step 1 전체에서 표준이 확립·검증됨 | Phase 5가 같은 표준을 적용 |
| CONT-03 (실무 예제 코드) | Phase 4 | Step 1 전체에서 표준이 확립·검증됨 | Phase 5가 같은 표준을 적용 |

Phase 5는 CONT-05를 단독 소유하지만 소요 시간 기준으로는 가장 큰 Phase다 (14개 모듈, 콘텐츠 집필의 대부분). 요구사항 개수가 적은 것은 얇은 Phase여서가 아니라 위 교차 기준이 Phase 4에 귀속됐기 때문이다.

**타임박스 의도**

Phase 1~3(플랫폼)은 합쳐서 약 1주가 목표다. 리서치가 지목한 최대 리스크는 "플랫폼을 다듬느라 콘텐츠를 못 쓰는 것"이므로, Phase 1~3에서 범위가 늘어나면 v2(CONV-01~04)로 밀어낸다.

### Phase 6: 전체 페이지 디자인 정리

**Goal**: 모든 화면이 존재하는 상태에서 `frontend-design` 스킬로 사이트 전체를 한 번에 다듬는다 — 디자인 토큰(색·타이포·간격)·셸(내비·카드)·페이지별 마감을 정리해 아이패드에서 "템플릿 같지 않은" 일관된 경험을 만든다
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: TBD (PROJECT.md Active "모바일·아이패드 최적화" 귀속 후보; 초과 범위는 v2 CONV-01~04로) — 확정 ID가 없으므로 **아래 성공 기준 4개(SC1~SC4)를 요구사항 단위로 사용한다.** `06-VALIDATION.md`·`06-EDGE-COVERAGE.json`·8개 PLAN의 `requirements` 필드가 모두 이 치환을 따른다
**Timebox**: 2일 — 개강(9/30) 전에 끝나도록 Phase 5 목표일을 9월 셋째 주 안으로 잡는다. 초과분은 v2로 밀어낸다
**Inputs**: Phase 3 `/gsd-ui-review` 결과(있다면), 03-VERIFICATION.md 후속 항목(폰 폭 375px 오늘 카드 레이아웃 미확인), Phase 4·5 UI-SPEC
**Success Criteria** (what must be TRUE):

  1. `globals.css` `@theme` 토큰(색·타이포·간격)이 한 곳에서 정의되고 모든 페이지가 그 토큰만 쓴다 — 페이지별 하드코딩 색/크기 없음
  2. 홈·커리큘럼·일정표·레슨·Step·소개 6종 화면이 아이패드 세로/가로에서 같은 셸(내비·카드·여백 체계)로 읽힌다
  3. 폰 폭(375px)에서도 오늘 카드·일정표·레슨 본문이 깨지지 않는다 (Phase 3 검증 후속 항목 해소)
  4. Phase 1~5의 자동 게이트(check-*.mjs, e2e-*.mjs)가 전부 통과한다 — 디자인 정리가 기능 회귀를 만들지 않는다

**Plans**: 5/8 plans executed (웨이브 1~4 — 웨이브 2에서 4개 플랜 병렬, 파일 소유권 무충돌)

Plans:

**Wave 1** — 트레이서: 토큰 사슬을 한 파일로 끝까지 관통시킨다

- [x] 06-01-PLAN.md — `@theme` 네임스페이스 정정(`--text-*` 5종) + `.prose` 봉쇄 + 레슨 페이지 1파일 치환 + 정적/런타임 게이트 2종 신설 (SC1, SC4)

**Wave 2** *(blocked on Wave 1)* — 임의값 66곳 중 63곳 치환 + 실측 정산, 4개 플랜 병렬

- [x] 06-02-PLAN.md — `01-UI-SPEC.md` Typography 표 개정 + D-97 빈 캔버스 실측(쿠키 유무 양쪽) (SC1, SC2)
- [x] 06-03-PLAN.md — 카드·행 계약 통일(`.card-interactive` hover, padding) + 4개 컴포넌트 치환 19곳 (SC1, SC2, SC4)
- [x] 06-04-PLAN.md — 라우트 페이지 7종 + 홈 대시보드 4종 치환 31곳, CTA 타이포 표준 확정 (SC1, SC2, SC4)
- [x] 06-05-PLAN.md — 내비·페이저·배지·버튼 7종 치환 13곳 + 페이저 이중 글리프 제거 + mono 승격 (SC1, SC2, SC4)

**Wave 3** *(blocked on Wave 2)* — 레슨 화면 마감 + 빈 캔버스 재배치

- [ ] 06-06-PLAN.md — 표 가로 스크롤 래퍼 + `<main>` 랜드마크·gap 통일·잠금 문구 + 구간 테이프(Section Tape) 신설 (SC1~SC4)
- [ ] 06-07-PLAN.md — `/curriculum` 재배치 + 홈 재배치(D-97 판정 조건부). **타임박스 초과 시 첫 번째 드롭 후보** (SC2, SC4)

**Wave 4** *(blocked on Wave 3)* — 게이트 활성화 + 최종 검증

- [ ] 06-08-PLAN.md — 375px 오버플로 게이트 신설 + 임의값 게이트 활성화 + 게이트 13종 스위트 + UAT 기록 + 시각 검수 체크포인트 (SC1~SC4)

### Phase 7: 아이패드 브라우저 실습 환경

**Goal**: 학습자가 PC 없이 아이패드 브라우저만으로 레슨의 `해보기` 과제를 실행하고 결과를 확인할 수 있다
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: TBD (PROJECT.md "주 사용 기기: 아이패드" 귀속 후보)
**Timebox**: 미정 — 개강(9/30) 전 학습 시간을 잠식하지 않는 선에서만. 초과 시 v2로 밀어낸다

**왜 필요한가**: D-55/D-73이 "읽기는 아이패드, 실행은 PC"로 정리했으나, 주 사용 기기가 아이패드인
학습자는 레슨을 읽다가 `해보기`에서 매번 막힌다. 2026-08-26 UAT에서 사용자가 직접 제기했다.

**후보 방식** (Phase 7 계획 단계에서 결정):

| 대상 레슨 | 방식 | 비고 |
|---|---|---|
| 2-2 HTML·CSS·JS | 페이지 내 브라우저 실행 | 가장 쉬움 — 원래 ".html 파일 열기" 예제 |
| 1-4 SQL, 2-1 SQL | PGlite (Postgres WASM) | 외부 서비스·계정·CSP 의존 없음 |
| 1-3 Python | Pyodide | 무겁다 — 비용 대비 효과 검토 필요 |
| 2-5 Express 등 서버 필요 | 불가 — 로컬 유지 | 범위 밖 |

**결정 이력**: D-73이 StackBlitz·CodeSandbox 등 외부 온라인 IDE를 명시적으로 배제했다. 이 phase는
그 결정을 뒤집는 것이 아니라 **외부 서비스 의존 없이 페이지 안에서 실행**하는 다른 경로를 검토한다 —
서비스 중단·정책 변경·계정 요구가 학습을 막지 않아야 한다.

**Success Criteria** (what must be TRUE):

  1. 대상 레슨의 `해보기`를 아이패드 Safari에서 PC 없이 끝까지 수행할 수 있다
  2. 실행 환경이 외부 서비스에 의존하지 않는다 — 계정·네트워크 서비스 없이 동작한다
  3. 실행 UI가 기존 레슨 읽기 경험을 해치지 않는다 — 읽기만 할 때는 방해되지 않는다
  4. Phase 1~6의 자동 게이트가 전부 통과한다 — 실습 환경 추가가 기능 회귀를 만들지 않는다

**Plans**: TBD

Plans:

- [ ] TBD (run /gsd-plan-phase 7 to break down)

---
*Roadmap created: 2026-08-24*
