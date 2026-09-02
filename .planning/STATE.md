---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: 사전학습 사이트 v1.0
status: Awaiting next milestone
stopped_at: v1.0 milestone closed
last_updated: "2026-09-02T05:50:00.000Z"
last_activity: 2026-09-02
last_activity_desc: 260902-kau — 이메일+비밀번호 로그인 도입(시크릿 쿠키 게이트 위에 additive), 소유자 계정 생성, 아이패드 로그인 왕복 실측·게이트/빌드 통과
current_phase: null
current_phase_name: null
progress:
  total_phases: 7
  completed_phases: 7
  total_plans: 51
  completed_plans: 51
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-27 after v1.0)

**Core value:** 개강 전까지 커리큘럼의 기초를 확실히 다질 수 있도록 — 콘텐츠를 읽고, 완료를 체크하고, 진행률과 일정을 한눈에 확인하는 흐름이 반드시 동작해야 한다.
**Current focus:** 다음 마일스톤 정의 대기 — 그 전에 사전학습을 실제로 도는 것이 1순위 (개강 2026-09-30)

## Current Position

Phase: Milestone v1.0 complete
Plan: —
Status: Awaiting next milestone
Last activity: 2026-09-03 — Completed quick task 260902-wk7: RunPython·RunSQL 따라 치기(고스트 코드 오버레이) 모드

### 다음에 할 일

**2026-09-01 코드 실행 파일럿 아이패드 UAT 승인 완료(quick 260901-iqk)**: 브라우저 안
파이썬 실행 — Pyodide 지연 로드(실행 전 0바이트, CDN script 주입, npm 의존성 0),
RunPython 컴포넌트(실행/고쳐 보기/원래대로, 에러 원문 표시), 1-3 Python 변수·자료형
레슨 실무 예제에서 실증. 아이패드 사파리 실기기 통과(WASM 메모리·터치 키보드 문제 없음).
후속 수정: 라이트 모드 출력 박스가 어둡게 뜨던 문제 수리(86ee7e9) — 내장 브라우저
라이트/다크 실측 + 프로덕션 실측 확인. 프로덕션 배포 완료.

**2026-09-01 Python 레슨 확장 완료 + 배포**: 실행 가능성 심사 결과, 브라우저(Pyodide)
에서 순수 파이썬으로 실제로 도는 예제는 1-3 두 편뿐이었다:
- 1-3-python-variables-and-types (파일럿, 완료)
- 1-3-python-functions-and-io (이번 확장, c0d6d3e) — open() 파일 입출력이 Pyodide
  가상 파일시스템(MEMFS)에서 그대로 돌아감. 프로덕션 실측 확인 완료
- **제외**(RunPython 안 감쌈): 1-2 생성 AI(anthropic SDK 필요), 1-5 ML 2편(sklearn —
  아이패드 WASM 메모리 초과 위험, 파일럿 핵심 제약 위반), 3-3 PEFT·3-4 멀티에이전트
  (anthropic/무거운 라이브러리). 이들은 브라우저 실행이 부적합 — 실행 버튼을 붙이면
  눌러도 실패하므로 버튼 없는 편이 낫다.
- 결론: Pyodide 기반 "Python 레슨 전체 확장"은 사실상 완료.

**2026-09-01 SQL(PGlite) 파일럿 아이패드 UAT 승인 + 나머지 SQL 레슨 확장 완료**:
- 파일럿(1-4-sql-queries-and-joins, quick 260901-ksv): PGlite 지연 로드(dynamic import
  ESM·실행 전 0바이트·npm 의존성 0), 페이지 단위 지속 인스턴스, RunSQL(결과 HTML 표·
  Postgres 에러 원문). 아이패드 UAT 통과. 후속: 셋업 출력 정리·누적 행 수 버그 제거(cd8c915).
- **확장 3편**(f9df735): 1-4-relational-db-basics, 2-1-ai-data-modeling,
  2-1-postgres-and-supabase — 레슨당 7블록 래핑, 총 29 RunSQL 블록(4편). 셋 다
  practice 스키마 표준 Postgres라 PGlite에서 그대로 돎. 셋업 블록을 DROP CASCADE로
  시작해 재실행 안전화. 콘텐츠 정확성 수정: 2-1-ai-data-modeling의 EXPLAIN 예제가
  "인덱스 후 Index Scan" 단언 → 실제론 6행이라 Seq Scan 유지, 정정함.
- 내장 브라우저에서 세 레슨 전부 위→아래 실행 실측(결과 표·집계·EXPLAIN·FK 에러·
  teardown·재실행 모두 본문과 일치). 게이트·lint 통과.

**남은 SQL 후보 = 없음**: Step 1~3에서 sql 블록 보유 레슨은 이 4편이 전부. Pyodide·
PGlite 두 런타임 기반 "브라우저 안 코드 실행" 재범위화 작업은 사실상 완료.

**주의(향후 SQL/코드 레슨 편집 시)**: 로컬 dev는 .velite stale하면 RunSQL/RunPython이
안 뜬다 — mdx 수정 후 `node node_modules/velite/bin/velite.js build --clean` 재생성
(프로덕션은 매 빌드 velite clean이라 영향 없음).

**2026-09-01 리서치 2단 착수 — /glossary 용어집 완료(quick 260901-r9t)**: 247용어를
velite 빌드타임 파서(parseTermTable, L5 게이트 로직 이식·실패 시 throw)로 뽑아 정적
/glossary 페이지 렌더. 214개 고유 단어·다의어 27개 그룹 표시(병합 금지 — 예: 런타임·
프롬프트가 정의별로 출처 레슨 역링크와 함께). ㄱㄴㄷ + A~W 점프 인덱스, 내비 "용어집"
링크(커리큘럼·일정표 사이). check-route-rendering에 /glossary 등록. 내장 브라우저
라이트/다크 실측 확인. 이 페이지는 콘텐츠 무편집·순수 정적이라 아이패드 UAT 불필요.

**2026-09-01 완료 예측일 완료(quick 260901-s8b, acfe445)**: pace.ts에 순수 함수
computeProjection 추가(computePace 불변·의존성 0), 홈 페이스 패널에 "이 속도면 M월
D일 완주 예정" 한 줄. behind는 예측 미표시(두 겹 방어)로 낙담 방지. check-pace 38 통과.

**2026-09-01 힌트 사다리 완료 — 35편 70문항 전부(8df2b80 파일럿 + 4a44589 확장 33편)**:
자기 점검 문항의 "정답 보기" 앞에 "힌트 보기" 접기를 추가해 방향만 한 줄 제공(답 노출
금지 — 힌트가 정답이면 인출 0). 파일럿 2편 승인 후 나머지 33편(66문항)을 병렬 저작
(배치 5개)으로 확장. 표본 점검: 정답을 말하지 않고 "떠올려 보라"로만 유도 확인. 게이트
인프라는 1단(260901-etq)에서 준비 완료라 게이트 변경 0, 462줄 순수 추가(문항·정답
무변경), 구조·브랜드·토큰 게이트 통과.

**2026-09-01 홈·접근성 폴리시 완료(quick 260901-v4u, cab7ddb)**: PWA manifest(src/app/
manifest.ts·icon.ts·apple-icon.ts, 아이패드 홈 화면 추가 시 앱처럼 실행)+apple-web-app
메타, skip link("본문으로 건너뛰기" 포커스 시 표시, #main-content), 이어서 읽기(마지막
연 레슨 localStorage 기록→홈에서 오늘 배정과 다를 때만 복귀 링크). Safari Reader용
article/h1 시맨틱 확인. 게이트 전부 통과. 아이패드 실기기 UAT(홈 화면 추가·Reader)는
사용자 몫으로 남김.

**사용자 지시(2026-09-01)**: 2단 나머지는 되묻지 말고 전부 자율 진행·배포. 시기
게이트/조건은 리서치 근거로 자율 판단하되 파괴적이지 않은 선에서 진행.

**2026-09-01 복습 세션 /review + O/△/X + 오답 모아보기 완료(quick 260901-w04, b84b888)**:
리서치 2단 플래그십. velite에 selfCheck 추출(parseSelfCheck, 스스로 점검 마커 이후·
힌트/정답 접기 건너뛰고 번호 문항만·레슨당 정확히 2개·throw) 70개. lesson_review에
missed_q int[] 컬럼 추가(라이브 마이그레이션 적용 완료 + repo 파일). /review 페이지
(force-dynamic): 약한 것(missed_q)→만기→나머지, 날짜 시드 셔플+레슨 라운드로빈, 12문항
컷. **정답 세션 미렌더**(두 번째 마크다운 렌더러 부채 회피) — "레슨에서 확인" 앵커
링크(SELF_CHECK_ANCHOR)로만. O/△/X 3버튼(△="맞았지만 불안", "한 군데라도 머뭇거렸으면
△" 기준 상주), O=missed_q 제거·△/X=추가. 오답 모아보기 섹션. 9/29 버퍼 CTA 연결(F8).
selectReviewQuestions 순수 함수, check-review 22케이스. 내가 dev에서 잠금 해제 후
전체 흐름 실검증(12문항·정답 미노출·△→오답 모아보기 등장→O로 제거, 흔적 없음),
라이트 모드 실측. 아이패드 실기기 UAT(터치·세로/가로)는 사용자 몫.

**2026-09-02 수집 그룹 완료(quick 260901-x62, 병합)**: /notes 단권화(전 레슨 lesson_note를
모듈 순으로 읽는 readAllLessonNotes + 읽기 전용 집계 페이지, 레슨 링크)·/inbox 궁금한 것
인박스(inbox_item 테이블 신설·라이브 적용+repo 파일, 추가·done 토글·"클로드에 물어보기"
클립보드 복사, 서버 액션 unlock 게이트+검증). 내비에 "노트"·"질문함" 추가. 실행자 내장
브라우저에서 추가·토글·복사·집계 확인(테스트 인박스행은 삭제해 흔적 없음). 아이패드 실기기
UAT는 사용자 몫.

**2026-09-02 학습 인출 장치 완료(quick 260902-0rz, 병합)**: (1) 예측 프롬프트 —
`<PredictPrompt>` 공유 콜아웃(의례 문구 baked-in, 항상 보임), 4장에 코드/쿼리 예제가
있는 레슨 33편 전량에 균일 삽입("전량 승격" — 부분 적용 유해 규칙 준수, 코드 없는 2편은
경계 밖 제외). mdx-content 매핑·멱등 삽입 스크립트. (2) TIL 한 줄 + 코넬 큐 — lesson_note에
til 컬럼 추가(라이브+repo 파일, WR-01: body에 결합 안 함), 완료 흐름에 "오늘 배운 것 한 줄?"
입력(코넬 큐 "내 말로 한 문장으로 설명하면?", 건너뛰기 가능), til-actions 서버 액션(unlock
게이트+검증). 게이트 전부 통과(경계 33/33 assert). 실행자 브라우저 확인(예측 프롬프트 렌더·
TIL 저장/복원 흔적 없음). 아이패드 실기기 UAT는 사용자 몫.

**2026-09-02 은유 앵커 6점 완료(quick 260902-1jk, 병합 d2904fd)**: Step 3 추상 개념 중
은유가 프로즈로만 있고 시각 앵커가 없던 6개에 인라인 SVG 은유 그림 + "이 비유가 안 맞는
부분은 ~" 한계 한 줄 추가 — re-ranking(채용 깔때기)·LoRA(얇은 조끼)·과적합(벼락치기)·
카나리(탄광 카나리아)·감독자(오케스트라 지휘자)·멱등성(재입장 스탬프). 이미 앵커된 개념은
중복 제외. 기존 data-diagram SVG 패턴·--diagram-* 토큰 그대로, 라이트/다크·아이패드 폭
확인. 게이트 전부 통과. 9/15 마감 항목 조기 완료.

**2026-09-02 필기 여백 PDF 완료(quick 260902-cet, 병합)**: 사용자 확인("Notability로 종종
필기") 후 진행. 기존 "PDF로 저장" 옆에 "필기 여백으로 저장" 버튼 추가 — data-print-annotate
표식 → @media print에서 .prose에 우측 40mm 필기 컬럼(+옅은 경계선), 코드·표·그림은 -40mm
역여백으로 전체 폭 유지. print-mode.tsx가 인쇄 후 표식 해제(일반 인쇄에 안 새어듦). 레슨·
/print 묶음 양쪽 버튼. 게이트 통과, CDP printToPDF로 두 모드 차이 실측. 아이패드 Notability
반입은 사용자 UAT.
- **주의(인시던트·해결)**: cet 워크트리 정리 중 정크션 rm -rf가 메인 node_modules/.bin을
  삭제 → npm install로 복구, 빌드·게이트 정상화. 향후 워크트리 정리는 git worktree remove
  우선, rm -rf는 .bin 손상 위험.

**2026-09-02 반전 박스+안테피스 예고 소급 완료(quick 260902-czv 파일럿 d530117 + 확장 e39ad0e)**:
사용자가 소급 적용 가능 여부 문의 → 진행. TwistBox·NextTeaser 컴포넌트 2종 신설(mdx-content
매핑). **안테피스 예고**: "다음"이 있는 34편 전부(마지막 3-7 제외)에 질문형 미니 문제(스포일러
금지). **반전 박스**: 진짜 경계 사례가 있는 20편에만 선택적(git force-push·한국어 토큰·open("w")·
FK 삭제·LogisticRegression 이름·DummyClassifier 99점·service_role 우회·float·explicit any·배열
mutate·truthiness·bcrypt 솔트·zod 여분필드·임베딩 반의어·BM25 스케일·LoRA<1%·인젝션 구분자·
카나리 표본). 프로젝트 가이드·ops 레슨은 억지 반전 없이 예고만. 병렬 배치 5개 저작, 458줄 순수
추가, 게이트 통과. 아이패드 실기기 UAT는 사용자 몫.

**★ 리서치 2단 15/15 전부 완료·배포.** (빈칸 파일럿만 클로즈 필사 8/27 롤백 이력·사용자
아버전으로 기각 — Deferred Items)

새 마일스톤으로 묶으려면 /gsd-new-milestone.

## Performance Metrics

**Velocity:**

- Total plans completed: 44
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 6 | - | - |
| 02 | 4 | - | - |
| 03 | 4 | - | - |
| 05 | 13 | - | - |
| 06 | 9 | - | - |
| 08 | 8 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 20min | 3 tasks | 25 files |
| Phase 01 P02 | unknown | 3 tasks | 2 files |
| Phase 01 P03 | 20min | 2 tasks | 37 files |
| Phase 01 P04 | 약 15분 | 3 tasks | 9 files |
| Phase 01 P05 | 약 15분 | 3 tasks | 7 files |
| Phase 01 P06 | 약 20분 | 3 tasks | 3 files |
| Phase 02 P01 | 100min | 3 tasks | 8 files |
| Phase 02 P02 | 35min | 3 tasks | 11 files |
| Phase 02 P03 | 15min | 3 tasks | 8 files |
| Phase 02 P04 | 55min | 3 tasks | 9 files |
| Phase 03 P01 | 36min | 2 tasks | 11 files |
| Phase 03 P02 | ~15min | 3 tasks | 39 files |
| Phase 03 P03 | ~15min | 3 tasks | 8 files |
| Phase 03 P04 | ~40min | 3 tasks | 7 files |
| Phase 05 P01 | 49min | 3 tasks | 16 files |
| Phase 05 P07 | 25min | 2 tasks | 1 files |
| Phase 05 P08 | 45min | 3 tasks | 3 files |
| Phase 05 P13 | session | 3 tasks | 6 files |
| Phase 08 P08 | 약 52분 | 3 tasks | 2 files |

## Accumulated Context

### Roadmap Evolution

- Phase 8 범위 확장 (2026-08-27): 인터랙션·버튼 감각 다듬기를 성능 작업에 합침. `design-taste-frontend` 스킬을 부분 적용(4.5/5/6절만, 랜딩 전용 규칙 제외), Motion 라이브러리는 CSS로 안 되는 지점이 생겼을 때만 조건부 도입. 근거는 ROADMAP Phase 8 상세 참고

- Phase 8 added: 성능·스마트폰 최적화 (2026-08-27) — 리전 이동으로 TTFB 238→68ms 해결 후 남은 정적 생성·폰트·폰 UX 작업

- Phase 7 제거 (2026-08-27): 아이패드 브라우저 실습 환경 — 사용자가 "아이패드에서는 실습 안 한다"로 정리. 아래 추가 항목의 전제(주 사용 기기가 아이패드라 해보기에서 막힌다)가 더 이상 성립하지 않는다. 완료된 Phase 8과의 정합을 위해 재번호하지 않았고 7번은 재사용하지 않는다.

- Phase 7 추가: 아이패드 브라우저 실습 환경 — 2026-08-26 UAT에서 사용자가 제기. "읽기는 아이패드, 실행은 PC"(D-55/D-73)가 아이패드 주 사용자에게 실제 제약이 된다는 문제. 외부 온라인 IDE(D-73이 배제)가 아니라 페이지 내 실행(PGlite 등)으로 검토한다

- Phase 6 added (2026-08-25): 전체 페이지 디자인 정리 — frontend-design 스킬로 토큰·셸·페이지별 마감을 Phase 5 이후 한 번에 적용, 타임박스 2일. 사용자 결정: 콘텐츠 phase보다 앞에 두지 않음(플랫폼 다듬기가 콘텐츠를 잠식하는 리스크 회피)
- 결정 (2026-08-25): 소개 페이지 eli5 재작성(quick 260825-2xv) 사용자 승인 → **레슨 전체에도 eli5 방식 적용**. 단 Phase 4·5 실행 시 **첫 강의 1편을 먼저 작성해 사용자 확인(human-verify 체크포인트)을 받고, 승인되면 나머지 레슨에 적용**한다. Phase 4 계획은 이 순서를 wave 구조에 반영할 것

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 플랫폼(Phase 1~3)을 약 1주로 타임박스하고 나머지 4주를 콘텐츠 집필(Phase 4~5)에 배정 — 리서치 최대 리스크가 "플랫폼 다듬기가 콘텐츠를 잠식"이기 때문
- [Roadmap]: Vercel 배포를 마지막이 아닌 Phase 1에 배치 — 콘텐츠 스프린트 전에 환경 문제를 노출시키기 위함
- [Roadmap]: 콘텐츠를 Step 기준으로 분할(Phase 4 = Step 1, Phase 5 = Step 2·3) — Step 1 완성 즉시 실제 사전학습 시작, 나머지는 병행 집필
- [Roadmap]: 레슨별 예상 소요시간·깊이 배지를 Phase 1 커리큘럼 매니페스트 메타데이터로 확정 — Phase 3 일정 배분의 입력값이 되므로 콘텐츠보다 먼저 필요
- [Roadmap]: Making-of 페이지(PLAT-03)는 Phase 1에 스캐폴드하고 이후 모든 Phase에서 갱신하는 살아있는 문서로 취급
- [Phase ?]: Task 3 저장소 생성/push는 하네스 권한 게이트로 실행자가 자동화 못해 사용자가 직접 실행 (gh repo create ai-engineer-runway --public)
- [Phase ?]: 저장소 기본 브랜치가 main이 아닌 master로 생성됨 (init.defaultBranch 설정 이어받음) — Vercel import는 기본 브랜치 자동 감지라 영향 없음, 편차로만 기록
- [Phase ?]: [Phase 1 Plan 2]: PR 머지 액션은 하네스 권한 게이트로 실행자가 자동화 못해 사용자가 직접 수행 (Rule 3 편차, gh pr merge 차단)
- [Phase ?]: [Phase 1 Plan 2]: Vercel 대시보드 GitHub Import로 프로덕션 배포 연결, 프로젝트명 ai-engineer-runway로 명시 지정(D-15) — main(=master) push→프로덕션/PR→프리뷰 두 경로 모두 실증 완료(D-16)
- [Phase ?]: [Phase 1 Plan 3]: 모듈 title은 curriculum.md 헤더 원문 그대로(Project 태그 포함) 사용, isProject 불리언으로 프로젝트 여부 별도 신호
- [Phase ?]: [Phase 1 Plan 3]: check-manifest.mjs는 curriculum-helpers.ts를 import하지 않고 modules.ts를 독립적으로 정규식 재파싱 — 의존성 0 게이트 요구사항 유지
- [Phase ?]: [Phase 1 Plan 3]: 2-3-react-components.mdx(파일럿 2)도 이번 Plan에서는 hasContent:false로 생성, Plan 06이 본문과 check-manifest.mjs 기대값(EXPECTED_HAS_CONTENT_COUNT=2)을 함께 갱신할 예정
- [Phase ?]: [Phase 1 Plan 4]: 레슨 목록 링크에 제목과 함께 Copywriting Contract Primary CTA 문구('레슨 시작하기')를 병기 — 제목만으로는 식별성 유지, CTA 문구는 계약대로 보조 텍스트로 표시
- [Phase ?]: [Phase 1 Plan 4]: LessonBreadcrumb/LessonPager는 curriculum-helpers.ts를 확장하지 않고 modules.ts의 정적 배열을 직접 참조 — Plan 03 인터페이스 표면을 넓히지 않음
- [Phase ?]: [Phase 1 Plan 5]: docs/making-of.md에 title/slug frontmatter 2줄만 추가(본문 불변) — Velite pages 스키마 요구사항과 PLAT-03의 '원문 그대로 반영' 요구를 동시에 충족
- [Phase ?]: [Phase 1 Plan 5]: SiteNav를 클라이언트 컴포넌트로 구현(usePathname으로 활성 항목 판별) — 테마 컨텍스트 프로바이더 금지 규칙과는 별개(내비 활성 상태 표시일 뿐 테마 상태 저장이 아님)
- [Phase ?]: [Phase 1 Plan 6]: 파일럿 2 실무 예제를 좋아요 버튼 카드(props+state+Link 라우팅)로 설계해 사이트 자체의 실제 컴포넌트 패턴을 참조하게 함
- [Phase ?]: [Phase 1 Plan 6]: 복사 버튼 44px 오버라이드는 min-width/min-height는 충돌 없이 적용되지만 top/margin/background는 selector specificity(.prose 접두사)로 강제해야 함을 확인
- [Phase ?]: [Phase 1 Plan 6]: Plan 03~05가 로컬 커밋만 하고 push하지 않았던 것을 발견 — Task 3 프로덕션 검증 전 git push origin master로 15개 미반영 커밋을 배포에 반영(Rule 3)
- [Phase ?]: Exact-pinned @supabase/supabase-js@2.112.3 and server-only@0.0.1 (no caret) per SUS/ASSUMED package audit flags — Prevents unverified patch versions from silently entering a flagged dependency
- [Phase ?]: Reused existing Supabase project (ai-news-briefing) for public.progress instead of a new dedicated project — Free-tier constraint, user decision; existing tables (subscribers, search_articles) left untouched
- [Phase ?]: tracer feedback gate 인터랙티브 정지 준수 — auto_advance/_auto_chain_active 둘 다 false라 mode:yolo와 무관하게 Task1 이후 체크포인트에서 정지, 사용자가 iPad 제약을 밝히고 자동화 증거로 승인
- [Phase ?]: progress.ts는 '#site/content'를 직접 import하지 않고 Lesson 타입을 NonNullable<ReturnType<typeof getLessonBySlug>>로 파생 — G13(매니페스트 직접 import 금지)을 코드·타입 양쪽에서 지킴
- [Phase ?]: e2e-progress.mjs의 배지 숫자 추출은 React SSR의 <!-- --> 코멘트 마커를 먼저 제거한 뒤 정규식 매칭 — 인접 JSX 표현식 사이에 코멘트가 삽입되는 것이 실행 중 실제로 확인됨
- [Phase ?]: [Phase 2 Plan 4]: ProgressBadge always renders in the home summary block including empty state — only the 28px accent big percent number is suppressed at 0 completions (D-26 requires badge always, truths only forbid emphasizing the big number)
- [Phase ?]: [Phase 2 Plan 4]: Step card progress bar/badge completely omitted (not 0%-rendered) when progress prop is absent — matches D-20's DOM-absence contract over Phase 1's always-0%-bar habit
- [Phase ?]: [Phase 2 Plan 4]: e2e home scenario asserts non-probe Steps are unchanged via before/after delta, not literal zero — the shared Supabase table also backs production and will carry real progress after launch
- [Phase ?]: [Phase 3 Plan 1]: 홈을 '오늘의 학습'으로 재편, Step 대시보드는 /curriculum으로 분리 — 각 라우트가 hasUnlockCookie 게이트를 자체 복제(상속되지 않음, Pitfall 4)
- [Phase ?]: [Phase 3 Plan 1]: today.ts/schedule.ts는 progress-math.ts와 같은 이유로 import 0 유지 — 게이트 스크립트가 Node 22.6+ 타입 스트리핑으로 트랜스파일러 없이 직접 로드
- [Phase ?]: [Phase 3 Plan 1]: 일정 배정은 항상 getOrderedLessons() slug 순서에서 파생, 35개 날짜→레슨 하드코딩 상수를 쓰지 않음
- [Phase ?]: [Phase 3 Plan 2]: estimatedMinutes 목표값은 (depth, 소속 모듈 isProject) 파생 계산으로 산출 — 원본 수치 기반 순차 치환은 값 공간이 겹쳐 이중 적용 위험이 있어 구조적으로 배제
- [Phase ?]: [Phase 3 Plan 2]: check-manifest.mjs Invariant 6을 7200~10800 밴드 검사에서 총합 4200 등식 검사로 교체, 분포(Invariant 12)·파생 규칙(Invariant 13) 신설 — 13개 불변식으로 확장
- [Phase ?]: [Phase 3 Plan 2]: ROADMAP/PROJECT/REQUIREMENTS의 페이스 기준을 '하루 4~6시간'에서 D-35 '하루 3시간 이내(하루 1레슨, 평균 약 2시간)'로 통일
- [Phase ?]: [Phase 3 Plan 3]: computePace의 완료 분 합계 두 스코프(어제까지 vs 전체 배정)를 이름이 다른 변수로 강제 분리 -- Pitfall 3 오판 경로를 구조적으로 차단
- [Phase ?]: [Phase 3 Plan 3]: today-lesson-card.tsx는 pace를 직접 받지 않고 celebration 전환 판단은 page.tsx가 미리 계산해 전달 -- 컴포넌트는 이미 결정된 값만 렌더
- [Phase ?]: [Phase 3 Plan 3]: check-progress-gates.mjs에 G19 신설 -- pace.ts/schedule.ts가 Supabase.progress-store.Velite 매니페스트를 참조하지 않음을 상시 검사
- [Phase ?]: [Phase 3 Plan 4]: 일정표 행의 배지/소요시간 그룹을 고정 폭 grid(64px+88px)로 묶어 레슨 제목 줄바꿈에도 열 정렬이 흔들리지 않게 함 -- 아이패드 UAT 1라운드 실측 결함(3~5주차 정렬 흔들림)을 구조적으로 재발 방지
- [Phase ?]: [Phase 3 Plan 4]: Step 카드 3열 그리드 전환 브레이크포인트를 sm(640px)에서 lg(1024px)로 올림 -- 아이패드 세로 폭(744px)에서 3열로 눌려 헤더가 넘치던 UAT 2라운드 실측 결함을 2열 유지로 해결
- [Phase ?]: [Phase 5 Plan 1]: 세 형식(심화 승계·개요 신규·프로젝트 가이드 신규) 사용자 승인 — 22편 집필 표준으로 확정
- [Phase ?]: [Phase 5 Plan 1]: Step 3 개요 깊이 판정 = (c) 너무 깊다, 더 줄여도 된다 — D-62 기준 하향, 3-1 파일럿 트림은 Wave 4 착수 직전, 나머지 Step 3 12편은 낮아진 기준(개념+비유1개, 실무 판단 레이어 제외)으로 저작
- [Phase ?]: [Phase 5 Plan 1]: npm 패키지 3종(prisma, @prisma/client, @anthropic-ai/sdk) 정당성 사용자 확인 완료 — Plan 04·06 착수 조건 충족
- [Phase ?]: [Phase 5 Plan 1]: EXPECTED_HAS_CONTENT_COUNT 실측 13 확정 — CONTEXT.md D-78 원문(14)과 불일치, 실측이 우선
- [Phase ?]: [Phase 5 Plan 1]: L7 단락 길이(200자) 게이트 신설 + .prose line-height 1.6→1.8·문단 margin 2.4em 신설 — 가독성 사용자 피드백 대응, UI-SPEC UX-03 갱신은 Plan 05-13이 담당
- [Phase ?]: 05-07: EXPECTED_HAS_CONTENT_COUNT/SLUGS를 빌드 실측(23)으로 확정 — CONTEXT.md D-78 원문(24)과 재차 불일치, 실측 우선
- [Phase ?]: 05-07: Step 2 12편 프로덕션 배포 완료, 12/12 200 확인, e2e-today·e2e-progress 통과
- [Phase ?]: Step 3 depth bar re-approved post-trim (이제 맞다, 2026-08-26) — trimmed 3-1-vector-search-basics.mdx is now the reference standard for the remaining 12 Step 3 lessons
- [Phase ?]: 05-08: 3-1-hybrid-search-reranking + 3-2-project-rag-agent written at the re-approved depth bar (CONT-05)
- [Phase ?]: 매니페스트 최종 상수(35) 실측 확정 — CONTEXT.md D-78 원문 최종값과 정확히 일치, Wave 1·2의 불일치 이력과 대비
- [Phase ?]: UI-SPEC UX-03 line-height 근거 정정(1.8/2.4em, 비율 1.33) — 기존 '기본값 1.5' 주장이 오류였음을 확인하고 실측치로 갱신
- [Phase ?]: D-81 진행률 100% 검증을 실제 progress-math.ts aggregate() 함수로 직접 실행 — 전체·Step·19개 모듈 전부 100%, 반올림 결함 0건
- [Phase ?]: 08-08: Task 3 체크포인트 대기 중 발견된 폰 헤더 내비 결함은 quick task 260827-g6u가 플랜 범위 밖에서 이미 수정 완료 — 08-MEASUREMENTS.md 375px 표를 수정 전/후 이력으로 갱신
- [Phase ?]: 08-08: 아이패드·폰 실기기 UAT 사용자 승인 완료 — Phase 6 메모장 하단 틈 결함 재발 없음 확인

### Pending Todos

None yet.

### Blockers/Concerns

- 리서치 Gap: 레슨 소요시간 추정치의 정확도는 Phase 3~4 실사용으로만 검증 가능 — 편차가 크면 v2의 CONV-03(자동 리밸런싱)이 필요해질 수 있음
- 리서치 Gap: Step 3 "개요 훑기" 깊이 기준(rubric)을 Phase 5 착수 전에 구체화해야 범위가 팽창하지 않음
- 사전학습 시작일(2026-08-25)이 임박 — Phase 1~3이 지연되면 학습 시간이 직접 잠식됨
- Plan 05-08~05-12 착수 전 필독: Phase 5 Plan 1 SUMMARY의 Deviation 4(Step 3 깊이 하향, D-62 재조정) 반영 필요 — 개념+비유1개만, 실무 판단 레이어 제외
- 3-1-vector-search-basics.mdx를 낮아진 깊이 기준으로 트림 필요 — Wave 4 착수 직전, 아직 Plan/Task 미배정
- Plan 05-13 착수 시 UI-SPEC UX-03 항목의 line-height 근거 수치 정정 필요(1.5 오기 → 1.75 실제 기본값, 최종값 1.8 반영)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260825-2xv | 소개 페이지 eli5 재작성 — docs/making-of.md를 아무것도 모르는 사람 눈높이로 | 2026-08-25 | bc0e28c | [260825-2xv-eli5-docs-making-of-md](./quick/260825-2xv-eli5-docs-making-of-md/) |
| 260825-n7v | Phase 04 UAT 결함 2건 수정 — SQL 2편 준비 블록 스키마 충돌(G-04-1), 복사 버튼이 코드 첫 줄 가림(G-04-2) | 2026-08-25 | f750017 | [260825-n7v-phase-04-uat-gap-fixes-g-04-1-sql-lesson](./quick/260825-n7v-phase-04-uat-gap-fixes-g-04-1-sql-lesson/) |
| 260825-r4k | 코드블록 복사 버튼이 모든 레슨에서 동작하지 않던 [Critical] 결함 수정 (04-UI-REVIEW Priority Fix 1) — 문자열 onclick을 실제 React 핸들러로 교체 | 2026-08-25 | 920741e | [260825-r4k-lesson-reading-screen-design-pass](./quick/260825-r4k-lesson-reading-screen-design-pass/) |
| 260826-tbx | 학습 시작일 8/25→8/28 이동 + 35개 레슨을 8/28~9/28에 재배정(토요일 8/29·9/5·9/12만 2개), 9/29 복습일 유지 — 개강 전 완주 보존 | 2026-08-26 | 22d86ee | [260826-tbx-shift-study-start-date-from-2026-08-25-t](./quick/260826-tbx-shift-study-start-date-from-2026-08-25-t/) |
| 260827-0y8 | 레슨 하단 메모장(옥스포드 노트 스타일) — 접었다 펼치기, 스크롤 고정, 타이핑 멈추면 자동 저장, 레슨당 메모 1개 Supabase 기기 간 공유 | 2026-08-27 | 5947684 | [260827-0y8-bottom-sheet-lesson-notepad-collapsible-](./quick/260827-0y8-bottom-sheet-lesson-notepad-collapsible-/) |
| 260827-g6u | 폰(640px 미만) 헤더 내비 4항목을 햄버거+접이식 패널로 전환, 640px 이상은 게이트 실측으로 픽셀 동일성 증명(375px M3 126→120, 768/1024 완전 동일) | 2026-08-27 | eb1357b | [260827-g6u-phone-hamburger-nav-640px](./quick/260827-g6u-phone-hamburger-nav-640px/) |
| 260827-mdz | v1.0 마감 전 lint 정합성 정리 — 에러 6·경고 3 → 0·0. Phase 1 이월 3건 + Phase 8 신규 3건(effect 내 동기 setState, module 변수명, 렌더 중 재할당) + eslint 스캔에서 고아 워크트리 제외 | 2026-08-27 | 3e9bdfd | [260827-mdz-v1-0-lint-6-3-eslint-claude](./quick/260827-mdz-v1-0-lint-6-3-eslint-claude/) |
| 260828-k4t | 레슨 PDF 내보내기 — 인쇄 전용 스타일시트 + 레슨별 "PDF로 저장" 버튼 + /print 허브와 범위별 묶음 라우트 23개(전체·Step·모듈). 아이패드 인쇄 미리보기 → 공유 → Notability 경로 | 2026-08-28 | 4da9ac2 | [260828-k4t-lesson-pdf-export](./quick/260828-k4t-lesson-pdf-export/) |
| 260828-w2r | 아이패드 완료 버튼이 "완료했어요 ✓ → 회색 → 레슨 완료하기"로 되돌아가 보이던 증상 — 재조회가 화면을 비워 버튼을 언마운트하던 구조와 낙관적 값 되돌림 시점을 함께 수정, 게이트 G12 개정·G23 신설 | 2026-08-28 | e61cbaf | [260828-w2r-complete-button-revert](./quick/260828-w2r-complete-button-revert/) |
| 260828-d3n | 자매 사이트(marketing.dailyaithread.com) 디자인을 전체 이식 — 크림 종이·각진 패널·하드 오프셋 그림자·굵은 제목 팔레트로 교체, 컴포넌트 클래스 9종 신설, 타이포 게이트 허용 집합 갱신 | 2026-08-28 | 78e25e2 | [260828-d3n-design-system-port](./quick/260828-d3n-design-system-port/) |
| 260829-hof | 헤더 내비 호버 효과 — 비활성 항목 잉크 밑줄(좌→우), 활성 항목 accent 하드 그림자로 떠오르기, 로고 표식 뜨기. 기존 규칙이 @layer components에 있어 utilities 레이어에 지고 있던(= 호버가 전혀 없던) 원인까지 수정 | 2026-08-29 | f02867e | [260829-hof-nav-hover](./quick/260829-hof-nav-hover/) |
| 260831-0f5 | 구간 테이프가 스크롤 시 안 보이던 문제 — sticky top-0이 같은 자리의 불투명한 헤더(z-20) 뒤로 들어가 통째로 가려졌다. --site-header-height 단일 소스 신설(실측 갱신), h2 착지 오프셋에 헤더 높이 반영, 옛 동작을 고정하던 e2e 게이트 판정 개정 | 2026-08-31 | d56d836 | [260831-0f5-section-tape-under-header](./quick/260831-0f5-section-tape-under-header/) |
| 260831-mih | 레슨에 실제 그림 들이기 파일럿 — 35편 전수에 다이어그램 0건이던 원인(D-48 금지 결정)을 확인하고 철회. 인라인 SVG 방식으로 1-3 Python 변수·자료형에 그림 4점 추가, 테마·인쇄·아이패드 폭 실측. 나머지 34편은 승인 대기 | 2026-08-31 | feccb67 | [260831-mih-lesson-diagram-pilot](./quick/260831-mih-lesson-diagram-pilot/) |
| 260831-n5r | 파일럿 승인 후 나머지 34편으로 확장 — 레슨 35편 전편에 개념 그림 115점(편당 2~4점). 함께: 그림 강조색이 Step을 안 따라가던 문제(prose data-step + globals.css 오버라이드), 파일럿이 남긴 서브셋 폰트 ≥ 글리프 구멍. 계약 검사기·768px 런타임 스윕 전수 통과 | 2026-08-31 | 5095e76, 5920835, 7fbeb93, 336d7eb, 883b2b4 | [260831-n5r-lesson-diagram-rollout](./quick/260831-n5r-lesson-diagram-rollout/) |
| 260831-rly | 전 화면 우측 하단 맨 위로 가기 플로팅 버튼 — 480px 이상 스크롤 시 등장. 레슨 메모장 시트를 :has()로 피해 손잡이 위로 올라섬(z 30 vs 40). 도중에 .btn 재사용 시 레이어 밖 transform이 @layer components의 호버 떠오름을 죽이던 문제 발견·수정 | 2026-08-31 | 7398e80 | [260831-rly-scroll-to-top](./quick/260831-rly-scroll-to-top/) |
| 260831-wlw | 본문 세리프 전환 — 클로드의 "제목 산세 + 본문 세리프" 배치를 OFL 서체로 재현(Newsreader·Noto Serif KR·JetBrains Mono, 제목은 Pretendard 유지). 클로드 실제 서체는 상용 라이선스 + 한글 부재로 사용 불가. Hahmlet은 serif 분류지만 한글이 고딕이라 물림. 서브셋·커버리지 게이트를 다중 폰트로 확장, 그림 확장 때부터 깨져 있던 e2e-typography도 수정 | 2026-08-31 | 5e8fc9c | [260831-wlw-claude-serif-typography](./quick/260831-wlw-claude-serif-typography/) |
| 260901-edu | 교육 사이트 전수 리서치 — 6라운드·17에이전트·~90곳 조사, 후보 51+8건을 반대 심문 3렌즈(기회비용·학습 효과·유지보수)로 재판해 3단 목록(바로 10건/고려 15건/기록만)으로 추림. 핵심 진단: 읽기·설명은 상위권인데 기억 장치가 0 — 복습 사다리가 최우선. 원문 18편 .planning/research/edu-sites/ | 2026-09-01 | e62ad36~ | [edu-sites](../research/edu-sites/FINAL-REPORT.md) |
| 260901-etq | 리서치 1단 10건 일괄 구현 — 복습 사다리(1·3·7·21일 자기 신고+홈 카드+13케이스 게이트), 튜터 프롬프트 v2(모드 메뉴·Feynman·진도 동봉 고장 수리), Step 2 실행 결과 16블록, 문항 11개 왜-형 재작성, 다크 3단 결함 수리, 페이저 제목, 마지막 주 B안 재배정(9/27~29 복습). 코드 실행 재범위화 기록 | 2026-09-01 | a272fc7 외 8 | [260901-etq-tier1-rollout](./quick/260901-etq-tier1-rollout/) |
| 260901-fast | 레슨 메모장 맞춤법 검사 밑줄 끄기 — 메모 내용이 기술 용어·코드 조각이라 브라우저 사전에 없는 낱말이 계속 걸리고, 빨간 물결선이 노트 괘선 위에 깔려 표면이 지저분해짐 (/gsd-fast) | 2026-09-01 | 4e1a823 | — | 2026-08-31 | 4e1a823 | — |
| 260901-iqk | 브라우저 안 파이썬 실행 파일럿 — Pyodide 지연 로드(실행 전 0바이트, CDN script 주입·npm 의존성 0), RunPython 컴포넌트(실행/고쳐 보기/원래대로, 에러 원문 표시), 1-3 Python 변수·자료형 레슨 실무 예제에서 실증. e2e-code-run.mjs 게이트 5건·기존 4게이트 회귀 없음. 아이패드 UAT 승인 + 라이트 모드 출력 박스 수리(86ee7e9). Python 확장 1편(1-3 함수·파일 입출력, c0d6d3e) | 2026-09-01 | c880057 | [260901-iqk-python-pyodide-1-3-python](./quick/260901-iqk-python-pyodide-1-3-python/) |
| 260901-ksv | 브라우저 안 SQL 실행 파일럿 — PGlite 지연 로드(dynamic import ESM·실행 전 0바이트·npm 의존성 0), 페이지 단위 지속 인스턴스(셋업 한 번→쿼리 여러 번), RunSQL 컴포넌트(결과 HTML 표·에러 Postgres 원문), 1-4 SQL 쿼리·조인 레슨 8블록 래핑. 출력 정리(셋업=한 줄, 누적 행 수 버그 제거). 아이패드 UAT 승인. 나머지 SQL 레슨 3편 확장(f9df735, DROP-first 재실행 안전화+EXPLAIN 콘텐츠 정정) | 2026-09-01 | cd8c915 | [260901-ksv-sql-pglite-1-4-sql](./quick/260901-ksv-sql-pglite-1-4-sql/) |
| 260901-r9t | 리서치 2단 — /glossary 용어집. 247용어를 velite 빌드타임 파서(L5 게이트 로직 이식·실패 시 throw)로 뽑아 정적 페이지 렌더. 214 고유 단어·다의어 27개 그룹 표시(병합 금지, 정의별 출처 레슨 역링크), ㄱㄴㄷ+A~W 점프 인덱스, 내비 링크. check-route-rendering 등록. 라이트/다크 실측 | 2026-09-01 | 8d7d83c | [260901-r9t-glossary-247-a-z](./quick/260901-r9t-glossary-247-a-z/) |
| 260901-s8b | 리서치 2단 — 완료 예측일. pace.ts에 순수 함수 computeProjection 추가(computePace 불변·의존성 0 유지, UTC 산술로 타임존 오프바이원 차단), 홈 페이스 패널에 "이 속도면 M월 D일 완주 예정 · 개강 전에 끝나요" 한 줄. 낙담 방지: behind는 예측 미표시(함수 show 플래그 + 컴포넌트 분기 부재 두 겹 방어), 노이즈 가드(완료 0·경과 2일 미만 미표시), ahead=accent·on-track=중성. check-pace 9케이스 신설(38 통과) | 2026-09-01 | acfe445 | [260901-s8b-m-d](./quick/260901-s8b-m-d/) |
| 260902-iig | 헤더 내비를 대메뉴 4개 + 소메뉴 2단 구조로 재정리 — 8개 평면 나열을 단독 링크 2개(오늘의 학습·커리큘럼) + 클릭 드롭다운 2개(학습 도구▾: 복습·용어집·노트·질문함 / 일정·정보▾: 일정표·PDF 내보내기·소개)로 압축. 숨어있던 /print를 "일정·정보"로 승격. 아이패드 터치 대응(hover 아닌 클릭 토글·바깥클릭·Esc·상호배타), 모바일 햄버거는 소제목+들여쓴 아코디언, 부모 활성 판정(자식 경로 매치 시 대메뉴 활성). site-nav.tsx 단일 파일. 내장 브라우저 아이패드/모바일 실측(드롭다운·전환·활성·아코디언·/print 확인). tsc·lint·토큰·build 게이트 통과 | 2026-09-02 | b82592f | [260902-iig-2](./quick/260902-iig-2/) |
| 260902-j1i | 모바일 햄버거 패널 펼침(unfold) 애니메이션 — opacity+translateY 페이드인을 grid-template-rows 0fr→1fr 펼침으로 교체(콘텐츠 auto 높이를 JS 없이 부드럽게 펴는 표준 CSS 기법; max-height 하드코딩·scaleY 왜곡 대비). .nav-panel-clip(overflow:hidden·min-height:0) 래퍼로 0fr 구간 클립, prefers-reduced-motion 존중 유지. globals.css·site-nav.tsx 2파일. 내장 브라우저 모바일 폭 실측: 패널 높이 1px→288px→467px(~180ms) 펼침 확인 | 2026-09-02 | 344f013 | [260902-j1i-mobile-menu-unfold-anim](./quick/260902-j1i-mobile-menu-unfold-anim/) |
| 260902-j7t | 모바일 햄버거 패널 닫힘(접힘) 애니메이션 — 조건부 렌더라 닫자마자 사라지던 것을 접힘 끝까지 유지 후 언마운트로 전환. open(논리)/panelMounted(DOM) 분리, data-state=open\|closed로 reveal/conceal 키프레임 분기(conceal forwards로 재확장 깜빡임 차단), onAnimationEnd 언마운트. reduced-motion은 animationend 미발화라 즉시 언마운트 경로 별도 처리(패널이 클릭 가로채는 함정 방어). 내장 브라우저 375px 실측: 닫기 476→316→언마운트(~180ms), 닫힘 후 DOM 부재 확인 | 2026-09-02 | 4ca54ce | [260902-j7t-mobile-menu-collapse-anim](./quick/260902-j7t-mobile-menu-collapse-anim/) |
| 260902-kau | 이메일+비밀번호 로그인 도입 — 새 기기마다 시크릿 키 찾던 불편 제거. 기존 공유 시크릿 쿠키 게이트를 제거하지 않고 additive하게 확장: hasUnlockCookie()가 (a)소유자(OWNER_EMAIL) 로그인 세션 또는 (b)기존 runway_unlock 시크릿 중 하나라도 참이면 통과(함수명·순서검사 G4/G14/G17 보존, e2e 하네스·/unlock 존치). @supabase/ssr 서버 사이드 전용(server client + Next16 proxy 세션 리프레시, NEXT_PUBLIC_ 미사용 G3 보존, 게이트 G8 "금지→존재요구" 전환). 소유자 계정 auth.users 직접 생성(email_confirm, 트리거 없음 확인). /login·계정 내비·잠금 문구 로그인화. 데이터 무손상(진도/노트 그대로, ai-news-briefing 테이블 미접촉). 아이패드 크기 로그인/로그아웃 왕복 실측, 빌드·게이트 통과. 배포 후속: Vercel에 OWNER_EMAIL·SUPABASE_ANON_KEY 필요 | 2026-09-02 | d86a94d 외 2 | [260902-kau-email-password-login](./quick/260902-kau-email-password-login/) |
| 260902-wk7 | RunPython·RunSQL에 "따라 치기"(고스트 코드 오버레이) 모드 추가 — 원본을 흐리게(0.3) 깔고 그 위 투명 입력면에 손으로 따라 치는 연습. 공유 TraceEditor(오버레이·scrollTop/scrollLeft 미러링·줄 끝 공백 관대 'N/M줄 일치'→'완성!' aria-live), mode: view\|edit\|trace 유니언으로 고쳐 보기와 상호배타. 실행은 친 코드를 돌리고 원래대로는 참조 화면 복귀. 내장 브라우저 아이패드 실측: 픽셀 정렬(폰트·행간·패딩·위치 동일)·세로 스크롤 동기·한글 IME·44px, 빈 입력 0/N 시작(아직 안 친 줄 미집계 버그 수정). e2e-code-run·e2e-sql-run 5/5 무회귀 | 2026-09-02 | 17b98f2 외 3 | [260902-wk7-runpython-runsql](./quick/260902-wk7-runpython-runsql/) |

## Deferred Items

### 빈칸(클로즈) 필사 — 2026-08-27 롤백

2026-08-26에 개념 설명 구간 클로즈 필사를 구현해 배포했다가(quick 260826-uig, 35개 레슨 빈칸
111개, 게이트 2종 신설, Supabase `cloze_answer` 테이블), 사용자 판단으로 **전량 롤백했다** —
"없는 게 낫겠다". 코드·게이트·마이그레이션·테이블 모두 제거했고 되돌린 커밋은 히스토리에 남아 있다
(f7c3ccd..e2d505f).

남길 만한 조사 결과(`.planning/research/필사-transcription-ux.md`는 그대로 둔다):

- 문단을 통째로 베껴 쓰는 "완전 필사"는 아이패드에서 가장 불편하고 학습 근거도 가장 약하다 —
  보이는 글을 옮기는 것은 인출이 아니라 복사라 testing/generation effect 조건을 충족하지 않는다.

- 대안으로 만든 클로즈는 근거는 더 강했지만, 실제로 써보니 학습 흐름에 끼어드는 느낌이 컸다.
- 다음 시도는 **판정하지 않는 방향**(예: 접었다 펼치는 고정 메모장)으로 간다.

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-08-27T03:18:58.278Z
Stopped at: Completed 08-08-PLAN.md
Resume file: None

## Operator Next Steps

- Start the next milestone with /gsd-new-milestone
