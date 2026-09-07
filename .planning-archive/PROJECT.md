# AI Engineer 사전학습 사이트 (aiEngineerCourse)

## What This Is

2026-09-30 개강하는 AI Engineer 교육과정(총 1,056시간, Step 1~3)을 수강할 학습자(사용자 본인)를 위한 사전학습 웹 사이트. **v1.0 배포 완료** — 커리큘럼 3개 Step 19개 모듈을 레슨 35편으로 콘텐츠화했고(쉬운 개념 설명 + 커리큘럼 동일 스택 실무 예제), 레슨별 완료 체크와 모듈·Step·전체 진행률, 8/28~9/29 학습 일정표와 홈 "오늘의 학습"(D-day·페이스 판정·밀린 레슨), 레슨별 메모장을 제공한다. Next.js + Supabase + Vercel(서울 리전)로 서빙하며 콘텐츠 라우트는 완전 정적, 진도 정보만 클라이언트에서 따로 가져온다.

## Core Value

개강 전까지 커리큘럼의 기초를 확실히 다질 수 있도록 — 학습 콘텐츠를 읽고, 완료를 체크하고, 진행률과 일정을 한눈에 확인하는 흐름이 반드시 동작해야 한다.

## Requirements

### Validated

- ✓ Vercel 배포로 URL 접속 가능 — Phase 1 (https://ai-engineer-runway.vercel.app)
- ✓ 사이트 소개(Making-of) 페이지 — Phase 1 (/about, 1~5단계 기록 + 6~7단계 갱신 구조)
- ✓ 레슨별 완료 버튼 → 완료 상태 저장(Supabase), 섹션(모듈/Step)별 진행률 표시 — Phase 2 (UAT 6/6 통과: 기기 간 동기화·외부인 차단·조회 실패 배너·100% 축하 상태 포함)
- ✓ 9/30 이전 학습 일정표 제공, 일정-레슨 연동 + 홈 "오늘의 학습"(D-day·오늘 레슨·시간 가중 페이스 판정·밀린 레슨) — Phase 3 (검증 45/45, 아이패드 미니 실기기 UAT 승인). 이후 quick 260826-tbx로 8/28~9/28 재배정(토요일 3일만 2레슨, 9/29 복습일)
- ✓ 커리큘럼 3개 Step 전체가 모듈/레슨 구조로 콘텐츠화 — Phase 4·5 (레슨 35편, MDX 7,024줄)
- ✓ 각 레슨이 쉬운 개념 설명 + 커리큘럼 동일 스택 실무 예제 코드 제공 (CONT-02/CONT-03) — Phase 4·5. eli5 방식 채택, SQL 2편은 Supabase SQL 에디터 실제 실행으로 UAT 확인(발견된 스키마 충돌 1건은 quick 260825-n7v로 수정)
- ✓ 전체 페이지 디자인 정리 — Phase 6 (디자인 토큰·셸·타이포그래피 게이트화, 구간 테이프)
- ✓ 모바일·아이패드 최적화 — Phase 8 (콘텐츠 라우트 완전 정적 전환으로 프로덕션 TTFB 33~40ms, 폰트 서브셋 2.06MB→448KB, 폰 375px 가독성 위반 212→120건, 탭 피드백·에러 회복·스크롤 rAF 스로틀). 아이패드 세로/가로 + 폰 실기기 UAT 승인

### Active

v1.0의 요구사항 20개는 전부 충족됐다. 아래는 다음 마일스톤 후보이며 아직 확정된 범위가 아니다.

- [ ] 브라우저 내 코드 실행 파일럿 — Python(Pyodide) 지연 로드, 레슨 1편에서 검증 후 확장 (2026-09-01 사용자 결정으로 재범위화)
- [ ] 실제 사전학습을 돌리면서 드러나는 콘텐츠 보완 (개강 9/30까지가 진짜 사용 기간이다 — 지금부터는 만드는 쪽보다 쓰는 쪽이 우선)
- [ ] `npm run lint`를 배포 게이트에 편입 — v1.0 마감 직전 lint 부채 9건이 어떤 게이트에도 걸리지 않은 채 쌓여 있었다(quick 260827-mdz에서 0으로 정리)
- [ ] 08-REVIEW.md Warning 5건 정리 — 특히 WR-01(메모장 언마운트 시 미저장 디바운스 입력 유실 이론적 경로)
- [ ] 375px 잔존 M3 120건 — 짧은 캡션 배지와 MDX 프로즈 콘텐츠. 실기기에서 불편하지 않다고 승인됐으나 숫자로는 남아 있다

### Out of Scope

- 다중 사용자/소셜 기능 — 1인용 개인 학습 사이트
- 동영상 강의/퀴즈 채점 시스템 — 텍스트+코드 중심 콘텐츠로 충분, 기간 제약
- 커리큘럼 본 과정 수준의 실습 프로젝트 5종 재현 — 사전학습 목적을 벗어남 (개요/준비 가이드만 제공). v1.0에서 개요·준비 가이드로 제공 완료(CONT-05)
- ~~아이패드 브라우저 안에서 `해보기` 실행(PGlite·Pyodide 등) — 2026-08-27 사용자 결정으로 제외~~ **2026-09-01 사용자 결정으로 번복**: "코드 실행 환경을 구현할 수 있다면 더더욱 좋아" — 브라우저 내 코드 실행이 다시 범위 안이다. 단 성능 예산(아이패드에 수 MB WASM)과 정면 충돌하므로 지연 로드(실행 버튼을 누른 레슨에서만 로드) 설계를 전제로 별도 파일럿부터 진행한다
- ISR(`export const revalidate`) — Phase 8 D8-N. 하루 한 번 여는 사이트에서는 재검증 창 만료 후 첫 요청(=그날의 유일한 방문)이 낡은 페이지를 받는다. 날짜 의존 값은 브라우저 재계산으로 해결했다

## Context

- 학습자는 2026-09-30 개강 전까지 약 5주(8/25~9/29)를 사전학습에 쓸 수 있고, 하루 3시간 이내(하루 1레슨, 평균 약 2시간) 투자 가능
- 콘텐츠 깊이 배분: Step 1(Python·Git·SQL·ML 기초)과 Step 2 핵심(HTML/CSS/JS·TS/React·Express·LLM API)은 심화, Step 3(RAG·모델 고도화·오케스트레이션·LLMOps)는 개강 후 깊게 배우므로 개념·용어 중심으로 가볍게
- 실무 예제 스택은 커리큘럼과 동일: Python, PostgreSQL/SQL, Supabase, HTML/CSS/JS, TypeScript, React/Next.js, Express, Prisma, LLM API(Claude/OpenAI), LangGraph/n8n
- 사이트 자체가 Next.js + Supabase + Vercel로 만들어지므로, 구축 과정 자체가 Step 2 학습의 살아있는 예제가 된다
- 커리큘럼 원문(Step 1: 200h / Step 2: 336h / Step 3: 520h, 프로젝트 5종 포함)은 사용자 제공 자료로 확보됨

**v1.0 출하 시점 상태 (2026-08-27):**

- 배포: https://ai-engineer-runway.vercel.app (Vercel, `icn1` 서울 리전)
- 규모: 레슨 35편(MDX 7,024줄), 소스 11,839줄(TS/TSX/MJS), 커밋 403개, 4일(8/24~8/27)
- 렌더 모드: `/about`·`/curriculum`·`/step/*`·`/lesson/*`(35개)는 완전 정적, `/`·`/schedule`·`/api/progress`는 동적. 진도·완료·메모는 `GET /api/progress` 한 곳에서 클라이언트가 따로 가져온다
- 자동 게이트 20종(정적 12 + e2e 8). `npm run lint`는 아직 게이트가 아니다
- 성능: 정적 라우트 프로덕션 TTFB 33.59~39.93ms(정적 대조군 34.86ms와 동일 구간), 첫 방문 폰트 448KB(전송량의 29.32%), 스크롤 25ms 초과 프레임 1.43%
- 알려진 부채: 08-REVIEW.md Warning 5건, 375px M3 잔존 120건, git에 등록되지 않은 고아 워크트리 `.claude/worktrees/agent-*` 5개

## Constraints

- **Timeline**: 2026-09-30 개강 전 사이트 완성 + 사전학습 시간 확보 — 구축에 시간을 너무 쓰면 학습 시간이 줄어듦
- **Tech stack**: Next.js(App Router) + Supabase(진도 저장) + Vercel 배포 — 사용자 선택, 커리큘럼 스택과 일치
- **사용자 규모**: 1인 사용 — 복잡한 인증/권한 불필요, 최소한의 보호만
- **언어**: UI/콘텐츠 모두 한국어 (코드·기술 용어는 영어 병기)
- **주 사용 기기**: 아이패드 (iPad Safari) — 태블릿 우선 반응형 레이아웃, 터치 타깃 크기(44px+), 코드 블록 가로 스크롤, 세로/가로 모드 모두 지원. 데스크톱·폰도 동작해야 하나 아이패드 경험이 1순위
- **브랜딩 (HARD RULE)**: 웹페이지에 공개되는 모든 내용(레슨 본문, Making-of 페이지, 페이지 제목, 메타데이터, OG 태그, 코드 주석 등)에 교육기관명 "KANT"/"Kant"를 절대 언급하지 않는다 — 항상 "AI Engineer 교육과정"으로 표기. 사이트명·저장소·배포 URL에도 사용 금지

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + Supabase + Vercel 배포 | 커리큘럼 동일 스택으로 구축 자체가 학습, 어디서든 접속 | ✓ Good — v1.0 출하. 구축 과정을 `/about`(Making-of)에 기록해 실제로 Step 2 학습 자료가 됐다 |
| 콘텐츠 깊이: 기초 심화 + Step 3 개념 훑기 | 개강 후 깊게 배울 내용에 사전학습 시간을 과투자하지 않음 | ✓ Good — 레슨마다 깊이 배지(심화/개요) 표시(CONT-04). 실제 학습을 해 봐야 배분이 맞았는지 알 수 있다 |
| 일정표: 하루 1레슨(평균 약 2시간) 기준 5주 설계 | 사용자 가용 시간 기준 | ⚠️ Revisit — 착수가 늦어져 quick 260826-tbx로 8/28~9/28 재배정(토요일 3일만 2레슨). 실제 진도가 밀리면 다시 조정이 필요하다 |
| 진도 저장 방식(익명 vs 간단 로그인) | 1인용이므로 최소 마찰 방식 선택 — Phase 계획 시 확정 | ✓ Phase 2: 공유 시크릿 쿠키(D-17/D-19) — Supabase Auth 미사용, 모든 읽기/쓰기는 서버 전용 service_role 경로, RLS 기본 차단(정책 0개) |
| 소개(/about, Making-of) 페이지 작성 방식: `eli5` 스킬 활용 (2026-08-25 사용자 지시) | 기술 용어 나열이 아니라 "아무것도 모르는 사람 눈높이 + 큰 그림 + 적은 글"로 사이트가 만들어진 과정을 설명 | ✓ 2026-08-25 quick task 260825-2xv(`bc0e28c`)로 `docs/making-of.md` 재작성, 아이패드 미니 확인 후 사용자 승인. 이후 phase 전환마다 같은 방식으로 갱신 |
| 레슨 콘텐츠도 eli5 방식으로 작성 — 파일럿 1편 먼저 → 사용자 확인 → 승인 시 전체 적용 (2026-08-25 사용자 지시) | 35편 전체에 바로 적용하면 톤·분량이 어긋났을 때 되돌리는 비용이 크므로 1편으로 표준을 먼저 굳힌다 | ✓ Good — 파일럿 승인 후 35편 전부 이 표준으로 작성. CONT-02/CONT-03 충족 |
| **D-48 철회** — 레슨에 실제 그림을 들인다 (2026-08-31 사용자 지시) | eli5 스킬의 절반("big pictures")이 빠져 있었다. D-48이 Mermaid·SVG·다이어그램을 금지한 근거는 "콘텐츠 전에 컴포넌트 라이브러리 금지"(PITFALLS 4)였는데, 인라인 SVG는 라이브러리를 만들지 않고 의존성·클라이언트 JS 0으로 같은 목적을 달성한다 | ⏳ 파일럿 1편(1-3 Python 변수·자료형, 그림 4점) 배포 — 아이패드 확인 후 나머지 34편 확장 여부 결정 |
| 진도 정보를 정적 셸 + 클라이언트 아일랜드로 분리 (Phase 8, D8-C~F) | 콘텐츠 라우트를 요청마다 다시 그리지 않으려면 사용자별 상태가 서버 렌더 경로에 있으면 안 된다 | ✓ Good — 정적 라우트 TTFB가 정적 대조군과 같은 구간에 들어왔고, 잠금 쿠키가 있어도 HTML 원문에는 진도 마커가 0건이다 |
| 날짜 의존 값은 ISR이 아니라 브라우저 재계산으로 (Phase 8, D8-N/D8-O) | 하루 한 번 여는 사이트에서 ISR의 "창 만료 후 첫 요청"이 사실상 매일의 유일한 방문이 된다 | ✓ Good — 완전 정적을 유지하면서 D-day가 자정을 넘겨도 정확하다. 열어 둔 탭은 갱신되지 않는다는 한계는 남아 있다(08-REVIEW WR-05) |
| 자동 게이트가 실기기 판단을 대체하지 못한다 (Phase 6 교훈, Phase 8 D8-L로 명문화) | Phase 6에서 게이트 16종이 전부 초록불인 상태로 실기기 결함이 나왔다 | ✓ Good — Phase 8에서 다시 확인됐다. 게이트 20종 통과 상태에서 사용자가 폰 헤더 내비 3줄 접힘을 발견(quick 260827-g6u로 수정). 페이즈 마지막에 실기기 UAT를 두는 설계를 유지한다 |
| 아이패드 브라우저 실습 환경(Phase 7) 제거 (2026-08-27 사용자 결정) | "아이패드에서는 실습을 하지 않는다" — 페이즈를 만든 전제 자체가 사라졌다 | ✓ Good — 착수 전에 정리해 비용 0. 완료된 Phase 8과의 정합을 위해 재번호하지 않았고 7번은 재사용하지 않는다 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-27 after v1.0 milestone*
