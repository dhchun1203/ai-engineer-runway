# AI Engineer 사전학습 사이트 (aiEngineerCourse)

## What This Is

2026-09-30 개강하는 AI Engineer 교육과정(총 1,056시간, Step 1~3)을 수강할 학습자(사용자 본인)를 위한 사전학습 웹 사이트. 커리큘럼 전체를 쉬운 개념 설명 + 실무 적용 예제로 콘텐츠화하고, 레슨별 완료 체크와 섹션별 진행률, 개강 전(~9/29) 학습 일정표를 제공한다. Next.js + Supabase로 구축하고 Vercel에 배포해 어디서든 접속한다.

## Core Value

개강 전까지 커리큘럼의 기초를 확실히 다질 수 있도록 — 학습 콘텐츠를 읽고, 완료를 체크하고, 진행률과 일정을 한눈에 확인하는 흐름이 반드시 동작해야 한다.

## Requirements

### Validated

- ✓ Vercel 배포로 URL 접속 가능 — Phase 1 (https://ai-engineer-runway.vercel.app)
- ✓ 사이트 소개(Making-of) 페이지 — Phase 1 (/about, 1~5단계 기록 + 6~7단계 갱신 구조)
- ✓ 레슨별 완료 버튼 → 완료 상태 저장(Supabase), 섹션(모듈/Step)별 진행률 표시 — Phase 2 (UAT 6/6 통과: 기기 간 동기화·외부인 차단·조회 실패 배너·100% 축하 상태 포함)

### Active

- [ ] 커리큘럼 3개 Step 전체가 모듈/레슨 구조로 콘텐츠화되어 있다
- [ ] 각 레슨은 쉬운 개념 설명 + 커리큘럼 동일 스택의 실무 예제 코드를 포함한다
- [ ] 9/30 이전(2026-08-25 ~ 09-29, 하루 3시간 이내·하루 1레슨·평균 약 2시간 기준) 학습 일정표 제공, 일정-레슨 연동
- [ ] 모바일·아이패드 최적화 — 주 학습 기기가 아이패드(터치 UI, 태블릿 레이아웃, Safari 대응)

### Out of Scope

- 다중 사용자/소셜 기능 — 1인용 개인 학습 사이트
- 동영상 강의/퀴즈 채점 시스템 — 텍스트+코드 중심 콘텐츠로 충분, 기간 제약
- 커리큘럼 본 과정 수준의 실습 프로젝트 5종 재현 — 사전학습 목적을 벗어남 (개요/준비 가이드만 제공)

## Context

- 학습자는 2026-09-30 개강 전까지 약 5주(8/25~9/29)를 사전학습에 쓸 수 있고, 하루 3시간 이내(하루 1레슨, 평균 약 2시간) 투자 가능
- 콘텐츠 깊이 배분: Step 1(Python·Git·SQL·ML 기초)과 Step 2 핵심(HTML/CSS/JS·TS/React·Express·LLM API)은 심화, Step 3(RAG·모델 고도화·오케스트레이션·LLMOps)는 개강 후 깊게 배우므로 개념·용어 중심으로 가볍게
- 실무 예제 스택은 커리큘럼과 동일: Python, PostgreSQL/SQL, Supabase, HTML/CSS/JS, TypeScript, React/Next.js, Express, Prisma, LLM API(Claude/OpenAI), LangGraph/n8n
- 사이트 자체가 Next.js + Supabase + Vercel로 만들어지므로, 구축 과정 자체가 Step 2 학습의 살아있는 예제가 된다
- 커리큘럼 원문(Step 1: 200h / Step 2: 336h / Step 3: 520h, 프로젝트 5종 포함)은 사용자 제공 자료로 확보됨

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
| Next.js + Supabase + Vercel 배포 | 커리큘럼 동일 스택으로 구축 자체가 학습, 어디서든 접속 | — Pending |
| 콘텐츠 깊이: 기초 심화 + Step 3 개념 훑기 | 개강 후 깊게 배울 내용에 사전학습 시간을 과투자하지 않음 | — Pending |
| 일정표: 8/25~9/29, 하루 3시간 이내(하루 1레슨, 평균 약 2시간) 기준 5주 설계 (D-35로 하향 조정됨) | 사용자 가용 시간 기준 | — Pending |
| 진도 저장 방식(익명 vs 간단 로그인) | 1인용이므로 최소 마찰 방식 선택 — Phase 계획 시 확정 | ✓ Phase 2: 공유 시크릿 쿠키(D-17/D-19) — Supabase Auth 미사용, 모든 읽기/쓰기는 서버 전용 service_role 경로, RLS 기본 차단(정책 0개) |

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
*Last updated: 2026-08-24 after Phase 2*
