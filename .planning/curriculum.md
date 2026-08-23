# Kant AI 엔지니어 교육과정 커리큘럼 (원문)

> 개강일: 2026-09-30. 이 문서는 사용자가 제공한 커리큘럼 원문을 구조화한 것으로, 학습 사이트 콘텐츠의 원천(source of truth)이다.
> 사전학습 기간: 2026-08-25 ~ 2026-09-29 (하루 4~6시간).
> 콘텐츠 깊이 방침: Step 1·Step 2 핵심 = 심화 / Step 3 = 개념·용어 중심 훑기.

## Step 1 — AI 엔지니어링을 위한 개발 기반 구축 (200h)

키워드: Python, Git, SQL, ML 기초
목표: AI 서비스를 만들기 위해 필요한 개발 기초와 데이터 활용 능력을 익힌다.

### 1-1. 온보딩 & 학습 환경 세팅
- 개강 OT 및 과정 운영 방식 안내
- GitHub, 학습 도구, 협업 채널 세팅

### 1-2. 개발 협업 & 생성형 AI 이해
- Git 저장소 관리, 브랜치, PR 협업 흐름
- 생성형 AI 개념, 활용 방식, 윤리 이해

### 1-3. Python 프로그래밍 기초
- 변수, 자료형, 조건문, 반복문
- 함수, 예외 처리, 파일 입출력

### 1-4. SQL & 데이터베이스 기초
- 관계형 데이터베이스 구조 이해
- SQL 쿼리, JOIN, 집계, 서브쿼리

### 1-5. 머신러닝 기초 모델링
- 분류, 회귀, 군집 모델 이해
- 평가 지표와 Scikit-learn Pipeline 활용

## Step 2 — LLM 기반 풀스택 AI 서비스 구현 (336h)

키워드: Frontend, Backend, LLM API
목표: 프론트엔드와 백엔드 전반을 학습하고, 데이터베이스 및 LLM API를 연동해 실제로 동작하는 AI 서비스를 직접 구현한다.

### 2-1. 데이터베이스 & AI 활용
- PostgreSQL, SQL 쿼리, Supabase 활용
- AI 서비스에 필요한 데이터 구조 설계

### 2-2. 프론트엔드 개발
- HTML, CSS, JavaScript 핵심 학습
- 브라우저 동작 원리와 UI 구현

### 2-3. TypeScript & React/Next.js
- TypeScript 기반 개발 환경 구성
- React 컴포넌트, 상태, 라우팅 구현

### 2-4. [Project 1] AI 쇼핑몰 프론트엔드
- LLM API와 Supabase 연동
- AI 쇼핑몰 UI/UX 구현

### 2-5. 백엔드 아키텍처 & API 설계
- Express 기반 RESTful API 구현
- 인증/인가, Prisma ORM, API 문서화

### 2-6. [Project 2] AI 쇼핑몰 백엔드
- Express.js RESTful API와 PostgreSQL·Prisma ORM, LLM API를 연동해 백엔드 구현
- 팀 단위 서비스 기능 완성

### 2-7. LLM 프롬프트 엔지니어링
- 프롬프트 패턴, 구조화 출력, 검증
- PromptOps 기반 안정적 LLM 활용

## Step 3 — RAG·멀티 에이전트 시스템 고도화 (520h)

키워드: RAG, Orchestration, LLMOps, Deploy
목표: RAG, 모델 고도화, 워크플로우 오케스트레이션, LLMOps를 적용해 실무형 AX 서비스를 설계하고 배포까지 완성한다.

### 3-1. RAG 파이프라인 설계
- 벡터 검색, 메타데이터 설계
- 하이브리드 검색과 re-ranking 적용

### 3-2. [Project 3] RAG Agent 프로젝트
- Knowledge Agent 구축
- 질문-정답-근거 기반 평가셋 구성

### 3-3. 모델 고도화
- PEFT, LoRA, QLoRA 개념 이해
- 모델 튜닝 전후 성능 비교

### 3-4. 워크플로우 오케스트레이션
- 여러 AI가 함께 일하는 구조 설계
- Webhook, 스케줄, HITL 설계
- n8n, LangGraph 기반 자동화 실습

### 3-5. [Project 4] 오케스트레이션 프로젝트 (AI 업무 자동화)
- 웹훅·스케줄·HITL 트리거 기반 자동화와 외부툴 3개 연동
- 감사로그, 롤백 시나리오 설계

### 3-6. LLMOps
- 프롬프트 버전관리, 평가 자동화
- 모니터링, 알림, 보안/거버넌스 설계
- 구조화 출력 파이프라인, 카나리/롤백, 비용/지연/성공률 지표

### 3-7. [Project 5] AX 서비스 런칭 프로젝트
- JSON 구조화 출력, PII/인젝션 정책, HITL·RAG 고도화·오케스트레이션을 적용해 AX 제품 배포
- 관측/알림 환경 구성, Vercel·Cloud Run 등으로 배포
- 최종 데모 발표 및 포트폴리오 산출
