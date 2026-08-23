# Requirements: AI Engineer 사전학습 사이트

**Defined:** 2026-08-24
**Core Value:** 개강 전까지 커리큘럼의 기초를 확실히 다질 수 있도록 — 콘텐츠를 읽고, 완료를 체크하고, 진행률과 일정을 한눈에 확인하는 흐름이 반드시 동작해야 한다.

## v1 Requirements

### 콘텐츠 (CONT)

- [ ] **CONT-01**: 학습자는 Step → 모듈 → 레슨 3단 구조로 전체 커리큘럼(3 Steps, 19 모듈)을 탐색할 수 있다
- [ ] **CONT-02**: 각 레슨 페이지는 쉬운 개념 설명(비유, 핵심 정리 포함)을 제공한다
- [ ] **CONT-03**: 각 레슨 페이지는 커리큘럼 동일 스택의 실무 적용 예제 코드(언어별 문법 강조 포함)를 제공한다
- [ ] **CONT-04**: Step 1·2 핵심 레슨은 심화 콘텐츠로, Step 3 레슨은 개념 훑기 콘텐츠로 작성되며 레슨마다 깊이 배지(심화/개요)가 표시된다
- [ ] **CONT-05**: 커리큘럼 실습 프로젝트 5종은 개요·사전 준비 가이드 레슨으로 제공된다 (재현 아님)
- [x] **CONT-06**: 학습자는 코드 블록을 복사 버튼으로 복사할 수 있다

### 진도 추적 (TRACK)

- [ ] **TRACK-01**: 학습자는 레슨 완료 버튼을 눌러 완료 상태를 저장할 수 있고, 상태는 Supabase에 저장되어 새로고침·기기 전환 후에도 유지된다
- [ ] **TRACK-02**: 학습자는 완료를 다시 눌러 취소(토글)할 수 있다
- [ ] **TRACK-03**: 모듈별·Step별 진행률(% 및 완료/전체 개수)이 표시된다
- [ ] **TRACK-04**: 대시보드에서 전체 진행률과 Step별 진행률을 한눈에 확인할 수 있다

### 학습 일정 (SCHED)

- [ ] **SCHED-01**: 2026-08-25 ~ 09-29, 하루 4~6시간 기준의 일자별 학습 일정표(날짜 → 레슨 매핑)가 제공된다
- [ ] **SCHED-02**: "오늘의 학습" 뷰가 오늘 배정된 레슨과 완료 상태를 보여주며, 사이트의 기본 랜딩 화면이 된다
- [ ] **SCHED-03**: 레슨마다 예상 소요시간이 표시되고, 일정은 소요시간 기반으로 배분된다
- [ ] **SCHED-04**: 개강일(9/30) D-day 카운트다운과 진도 기준 on-track/behind 상태가 표시된다

### 플랫폼 (PLAT)

- [ ] **PLAT-01**: 사이트는 Vercel에 배포되어 URL로 어디서든 접속 가능하다
- [ ] **PLAT-02**: 진도 저장은 로그인 화면 없는 최소 마찰 방식(익명 세션 + RLS 등)으로 동작하되 외부인이 함부로 쓸 수 없게 보호된다
- [ ] **PLAT-03**: Making-of 소개 페이지가 자료 수집 → 리서치 → 설계 → 구현 → 검증 → 배포 과정과 스택 선택 이유를 문서화하며, 작업 진행에 따라 계속 갱신된다 (포트폴리오)

### 사용자 경험 (UX)

- [ ] **UX-01**: iPad(Safari) 최적화 — 태블릿 레이아웃, 터치 타깃 44px 이상, 세로/가로 모드 모두 지원 (주 학습 기기)
- [ ] **UX-02**: 폰·데스크톱에서도 반응형으로 정상 동작한다
- [x] **UX-03**: 한국어 타이포그래피 최적화(Pretendard, `word-break: keep-all`)와 코드 블록 가로 스크롤이 적용된다

## v2 Requirements

핵심 루프 검증 후, 9/30 전 여유가 있을 때만.

### 편의 기능

- **CONV-01**: 레슨 검색/필터 (예: "React", "SQL"로 점프)
- **CONV-02**: 레슨별 개인 노트(메모) 저장
- **CONV-03**: 놓친 날짜 발생 시 남은 일정 자동 리밸런싱
- **CONV-04**: PWA 매니페스트 (홈 화면 추가)

## Out of Scope

| Feature | Reason |
|---------|--------|
| 다중 사용자/소셜/리더보드 | 1인용 개인 학습 사이트 — 인증·RLS 복잡도만 증가 |
| 퀴즈 엔진/자동 채점 | 기간 제약, 완료 자가 체크로 충분 |
| 동영상 강의 호스팅 | 텍스트+코드 중심으로 충분 |
| 게이미피케이션(배지·스트릭·포인트) | 동기 부여는 D-day/on-track 표시로 대체 |
| 간격 반복(플래시카드) 엔진 | 사전학습은 1회 통과 목적, 별도 서브시스템 과함 |
| 커리큘럼 프로젝트 5종 재현 | 본 과정 내용 — 개요 가이드만 제공 |
| 외부 캘린더 연동(Google/Apple) | 사이트 내 일정 뷰로 충분, OAuth 과설계 |
| 관리자/CMS UI | 작성자=개발자 1인, MDX 직접 편집이 더 빠름 |
| 오프라인 동기화 | 데이터 일관성 복잡도 과함, 반응형 웹으로 충분 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONT-01 | Phase 1 | Pending |
| CONT-04 | Phase 1 | Pending |
| CONT-06 | Phase 1 | Complete |
| PLAT-01 | Phase 1 | Pending |
| PLAT-03 | Phase 1 | Pending |
| UX-01 | Phase 1 | Pending |
| UX-02 | Phase 1 | Pending |
| UX-03 | Phase 1 | Complete |
| TRACK-01 | Phase 2 | Pending |
| TRACK-02 | Phase 2 | Pending |
| TRACK-03 | Phase 2 | Pending |
| TRACK-04 | Phase 2 | Pending |
| PLAT-02 | Phase 2 | Pending |
| SCHED-01 | Phase 3 | Pending |
| SCHED-02 | Phase 3 | Pending |
| SCHED-03 | Phase 3 | Pending |
| SCHED-04 | Phase 3 | Pending |
| CONT-02 | Phase 4 | Pending |
| CONT-03 | Phase 4 | Pending |
| CONT-05 | Phase 5 | Pending |

**Coverage:**

- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

**교차 요구사항 메모:**

CONT-02(개념 설명)와 CONT-03(예제 코드)는 모든 레슨에 걸치는 품질 기준이다. 중복 매핑을 피하기 위해
기준이 처음 완전히 충족·검증되는 Phase 4(Step 1 콘텐츠)에 귀속시켰고, Phase 5(Step 2·3 콘텐츠)는
동일 표준을 적용한다. CONT-04(깊이 배지)는 커리큘럼 매니페스트 메타데이터이므로 레슨 본문 집필
이전에 Phase 1에서 전 레슨에 적용된다.

---
*Requirements defined: 2026-08-24*
*Last updated: 2026-08-24 after roadmap traceability mapping*
