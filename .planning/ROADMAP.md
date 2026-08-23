# Roadmap: AI Engineer 사전학습 사이트

## Overview

2026-09-30 개강까지 5주. 로드맵의 축은 하나다 — **플랫폼은 짧게, 콘텐츠에 길게.** Phase 1~3(뼈대·진도·일정)이 학습 루프 전체를 배포된 URL 위에서 동작하게 만들고, 여기까지를 약 1주 안에 끝낸다. 남은 4주는 Phase 4~5의 콘텐츠 집필(35+ 한국어 레슨, 70~100h)에 쓴다. Phase 1에서 Vercel 배포와 파일럿 레슨 2개를 먼저 세워 환경 문제를 콘텐츠 스프린트 전에 털어내고, Phase 4에서 Step 1 콘텐츠가 완성되는 즉시 실제 사전학습을 시작하면서 Phase 5의 Step 2·3 콘텐츠를 병행 집필한다. 주 학습 기기는 아이패드이므로 반응형·터치 기준은 Phase 1에서 확립하고 이후 모든 화면이 그 기준을 따른다.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: 배포된 커리큘럼 뼈대** - Vercel URL에서 Step→모듈→레슨을 아이패드로 탐색하고 파일럿 레슨을 읽는다
- [ ] **Phase 2: 진도 체크와 진행률** - 레슨 완료를 토글하고 모듈·Step·전체 진행률을 확인한다
- [ ] **Phase 3: 학습 일정과 오늘의 학습** - 8/25~9/29 일정표와 오늘 배정 레슨, D-day·페이스 상태를 본다
- [ ] **Phase 4: Step 1 심화 콘텐츠** - Python·Git·SQL·ML 기초 전 레슨을 개념 설명 + 실무 예제로 학습한다
- [ ] **Phase 5: Step 2·3 콘텐츠와 프로젝트 가이드** - 풀스택·LLM 심화와 RAG·오케스트레이션 개요, 프로젝트 5종 준비 가이드를 학습한다

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

**Plans**: 6 plans (웨이브 1~6, 완전 직렬 — 단일 빌드 디렉터리·단일 git 워크트리 공유)
**Wave 1**

- [ ] 01-01-PLAN.md — Walking Skeleton: MDX 한 편이 Velite→Shiki→정적 라우트를 통과해 렌더되고 공개 저장소에 푸시된다

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 01-02-PLAN.md — Vercel 배포: 프로덕션 URL 개통, main 푸시 자동 배포와 PR 프리뷰 확인, Making-of 5단계 기록

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 01-03-PLAN.md — 커리큘럼 매니페스트: 19개 모듈 + 35개 레슨 메타데이터(깊이 배지·예상 소요시간)와 불변식 게이트

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 01-04-PLAN.md — 탐색 라우트: 홈 Step 카드 → 모듈 아코디언 → 레슨 목록 → 레슨 페이지(브레드크럼·이전/다음·준비 중 상태)

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 01-05-PLAN.md — 글로벌 셸: 내비 4항목·다크모드 토글·사이트 메타데이터/OG, Making-of 소개 페이지, 브랜드 노출 게이트

**Wave 6** *(blocked on Wave 5 completion)*

- [ ] 01-06-PLAN.md — 파일럿 레슨 2 실콘텐츠 + 실콘텐츠 기준 한국어 타이포·코드 블록·터치 타깃 확정 + Phase 최종 게이트

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

**Plans**: TBD
**UI hint**: yes

### Phase 3: 학습 일정과 오늘의 학습

**Goal**: 학습자가 사이트를 열면 오늘 무엇을 공부해야 하는지, 개강까지 페이스가 맞는지 즉시 알 수 있다
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: SCHED-01, SCHED-02, SCHED-03, SCHED-04
**Success Criteria** (what must be TRUE):

  1. 2026-08-25 ~ 09-29 일자별 학습 일정표가 제공되고, 각 날짜에 배정된 레슨과 그날의 총 소요시간이 하루 4~6시간 범위에 들어온다
  2. 사이트 기본 화면이 "오늘의 학습"이며, 오늘 배정 레슨과 각 레슨의 완료 여부를 보여주고 레슨 페이지로 바로 이동할 수 있다
  3. 모든 레슨에 예상 소요시간이 표시되고, 일정 배분이 그 수치를 근거로 계산된다
  4. 개강일(2026-09-30) D-day 카운트다운과 함께, 오늘까지 배정된 분량 대비 완료 진도를 비교한 on-track/behind 상태가 표시된다

**Plans**: TBD
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

**Plans**: TBD

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

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 배포된 커리큘럼 뼈대 | 0/6 | Planned | - |
| 2. 진도 체크와 진행률 | 0/TBD | Not started | - |
| 3. 학습 일정과 오늘의 학습 | 0/TBD | Not started | - |
| 4. Step 1 심화 콘텐츠 | 0/TBD | Not started | - |
| 5. Step 2·3 콘텐츠와 프로젝트 가이드 | 0/TBD | Not started | - |

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

---
*Roadmap created: 2026-08-24*
