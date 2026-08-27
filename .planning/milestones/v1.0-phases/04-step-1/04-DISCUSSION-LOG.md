# Phase 4: Step 1 심화 콘텐츠 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-25
**Phase:** 4-Step 1 심화 콘텐츠
**Areas discussed:** eli5 × 6단 템플릿 결합, 파일럿 레슨 선택·기존 파일럿 처리, 실습 환경, 검토 리듬·점검 문제 형식

---

## eli5 × 6단 템플릿 결합

### Q1. eli5와 D-10 6단 템플릿 결합 방식

| Option | Description | Selected |
|--------|-------------|----------|
| 6단 유지 + 각 단을 eli5 톤으로 | 섹션 순서 유지, 글쓰기만 짧은 문장·전문 지식 전제 없음·괄호 풀이로 | ✓ |
| eli5 도입부 추가 + 6단 | 앞에 "한 문장으로 + 큰 그림" 블록, 본문은 기존 밀도 | |
| eli5로 재구성(6단 해제) | D-10 번복, 기존 파일럿 2편 재작성 | |

**User's choice:** 6단 유지 + 각 단을 eli5 톤으로 (추천안)

### Q2. "큰 그림"의 MDX 표현

| Option | Description | Selected |
|--------|-------------|----------|
| 마크다운만: 이모지 헤더·비유 표·흐름 화살표 | Making-of와 동일 재료, 플랫폼 변경 0 | ✓ |
| 마크다운 + ASCII 다이어그램 | ```text 블록에 구조 그림 | |
| Mermaid 파이프라인 추가 | 렌더러 설정 작업 필요 | |

**User's choice:** 마크다운만 (추천안)

### Q3. 150분 분량 배분

| Option | Description | Selected |
|--------|-------------|----------|
| 읽기 짧게(~30분) + 실습·해보기가 시간을 채움 | 해보기 과제 2~3개 | ✓ |
| 읽기·실습 반반(60+90분) | 개념 설명 현재 밀도 유지 | |
| 레슨 성격별로 다르게 | 코드 레슨 실습 위주, 개념 레슨 읽기 위주 | |

**User's choice:** 읽기 짧게 + 실습 위주 (추천안)

### Q4. 기술 용어 처리

| Option | Description | Selected |
|--------|-------------|----------|
| 첫 등장 시 한글(영어) + 괄호 한 줄 풀이 | Making-of 방식 | |
| 위 방식 + 레슨 끝 "이 레슨의 단어" 표 | 6단 안에 용어 5~8개 표 | ✓ |
| 영어 우선 + 한글 병기 | "branch(브랜치)" 형태 | |

**User's choice:** 괄호 풀이 + 레슨 끝 단어 표

---

## 파일럿 레슨 선택·기존 파일럿 처리

### Q1. 파일럿 레슨

| Option | Description | Selected |
|--------|-------------|----------|
| Python 변수·자료형 재작성 | 구 스타일 존재 → 전후 비교, 개념+코드+해보기 한 번에 검증 | ✓ |
| 1-1 과정 운영 방식 (커리큘럼 첫 강의) | 일정 순서 일치, 단 코드 없음 | |
| 둘 다 | 개념형 1 + 코드형 1 세트 | |

**User's choice:** Python 변수·자료형 재작성 (추천안)
**Notes:** 2026-08-25 메모리의 "첫 강의(1-1)" 지시는 코드 없는 레슨이라 CONT-03 검증이 안 된다는 점을 짚었고, 사용자가 Python 재작성으로 확정.

### Q2. 1-1 과정 운영 방식 레슨 내용

| Option | Description | Selected |
|--------|-------------|----------|
| 커리큘럼 지도 + 사전학습 사용법 | 3 Step·19모듈·프로젝트 5종 큰 그림, 사이트 사용법, 하루 루틴 | ✓ |
| 개발자 학습법 중심 | 에러 읽기, 문서 찾기, AI 질문법 | |
| 사용자가 OT 자료 제공 | 자료 대기 후 마지막에 작성 | |

**User's choice:** 커리큘럼 지도 + 사전학습 사용법 (추천안)

### Q3. 파일럿 승인 후 집필 순서

| Option | Description | Selected |
|--------|-------------|----------|
| 커리큘럼 순서 모듈 단위 wave | 일정표 순서로 학습자가 매일 읽을 레슨 먼저 | |
| 9편 병렬 집필 한 번에 | 가장 빠름, 한 번에 검증 | ✓ |
| 코드 레슨 먼저, 개념 레슨 나중 | 코드 표준 확실히 한 뒤 | |

**User's choice:** 9편 병렬 집필 한 번에 (추천안 아님 — 사용자가 속도 우선)

### Q4. 1-2 생성형 AI 레슨 실무 예제

| Option | Description | Selected |
|--------|-------------|----------|
| Python LLM API 호출 1편 + 키 없이도 되는 대체 경로 | Claude API 최소 예제 + 채팅 UI 대체 | ✓ |
| 코드 없이 프롬프트 실습만 | CONT-03 예외 | |
| 무료 로컬 모델(Ollama) | 설치 부담, 스택 불일치 | |

**User's choice:** Python LLM API 호출 + 대체 경로 (추천안)

---

## 실습 환경

### Q1. Python·scikit-learn 실행 환경

| Option | Description | Selected |
|--------|-------------|----------|
| 읽기는 아이패드, 실습은 PC 로컬 Python | VS Code + python, 개강 후 환경과 동일 | ✓ |
| Google Colab 기본 | 아이패드 브라우저에서 실행 | |
| 로컬 기본 + Colab 대체 병기 | 두 줄 안내 | |

**User's choice:** PC 로컬 Python (추천안)

### Q2. SQL 실행 환경

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase SQL 에디터 | 브라우저, PostgreSQL 문법, 연습 스키마 분리 | ✓ |
| PC 로컬 PostgreSQL 설치 | 설치·psql 부담 | |
| Python sqlite3 | 문법 차이, 스택 불일치 | |

**User's choice:** Supabase SQL 에디터 (추천안)

### Q3. Git 예제 형태

| Option | Description | Selected |
|--------|-------------|----------|
| PC 터미널 git + GitHub 웹 PR | 연습 저장소로 한 바퀴 | ✓ |
| GitHub 웹 UI만 | 아이패드 가능, 터미널 공백 | |
| 터미널 기본 + 웹 UI 병기 | | |

**User's choice:** 터미널 git + GitHub 웹 PR (추천안)

### Q4. OS 기준

| Option | Description | Selected |
|--------|-------------|----------|
| Windows 기본, 다를 때만 macOS 한 줄 병기 | 사용자 PC(Windows 11)와 일치 | ✓ |
| macOS/Linux bash 기본 | 개강 후 문서 기준 | |
| OS 무관 명령만 + 공식 문서 링크 | | |

**User's choice:** Windows 기본 + macOS 병기 (추천안)
**Notes:** 이 질문은 사용자가 `claude doctor` 실행으로 한 번 중단한 뒤 재질문해 답변받음.

---

## 검토 리듬·점검 문제 형식

### Q1. 9편 검토 단위

| Option | Description | Selected |
|--------|-------------|----------|
| 파일럿 1회 + 끝에 전체 1회 | human-verify 2번 | |
| 파일럿 1회 + 모듈별 5회 | | |
| 파일럿만 확인, 나머지는 자동 게이트로만 | 브랜드·매니페스트·빌드·e2e 통과로 완료 | ✓ |

**User's choice:** 파일럿만 확인, 나머지는 자동 게이트로만 (추천안 아님 — 사용자가 속도 우선)

### Q2. 파일럿 확인 장소

| Option | Description | Selected |
|--------|-------------|----------|
| master 푸시 → 프로덕션 URL, 아이패드 | 기존 UAT 방식 | ✓ |
| PR 프리뷰 URL, 아이패드 | 사용자 머지 필요 | |
| 로컬 개발 서버 | 아이패드 가독성 확인 불가 | |

**User's choice:** 프로덕션 URL에서 아이패드로 (추천안)

### Q3. 정답 형식

| Option | Description | Selected |
|--------|-------------|----------|
| 문제 바로 아래 접힌 정답 (`<details>`) | 컴포넌트 추가 0 | ✓ |
| 정답 없이 문제만 + 힌트 | | |
| 레슨 맨 끝 정답 모음 | | |

**User's choice:** 접힌 정답 (추천안)

---

## Claude's Discretion

- 9편 병렬 wave 구성, 레슨별 이모지 헤더·표·해보기 과제 개수
- check-manifest Invariant 10 상수 갱신 방식
- "콘텐츠 준비 중" 카피·UI-SPEC Copywriting Contract 조정
- `<details>` prose 스타일(터치 타깃·다크모드)
- ML 레슨 데이터셋 선택, 1-1 환경 세팅 레슨 설치 범위
- Making-of 갱신 시점·문구

## Deferred Ideas

None — 논의는 phase 범위 안에 머물렀음.
