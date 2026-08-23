# Phase 1: 배포된 커리큘럼 뼈대 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-24
**Phase:** 1-배포된 커리큘럼 뼈대
**Areas discussed:** 사이트명 & 비주얼 방향, 내비게이션 구조, 레슨 템플릿 & 파일럿 선정, 저장소/배포 세팅

---

## 사이트명 & 비주얼 방향

| Option | Description | Selected |
|--------|-------------|----------|
| PreStep (프리스텝) | 사전학습 + Step 1~3 구조와 연결 | |
| Runway (런웨이) | 이륙 전 활주로 — 개강 전 준비 | |
| AI Engineer Prep | 직관적 영문명 | |
| AI Engineer Runway (직접 입력) | 두 안을 결합한 사용자 지정명 | ✓ |

**User's choice:** AI Engineer Runway (자유 입력 — 제시안 결합)

| Option | Description | Selected |
|--------|-------------|----------|
| 차분한 딥블루/청록 | 장시간 학습 편안한 톤 + 포인트 컬러 | ✓ |
| 웜 뉴트럴 | 종이 노트 느낌 | |
| 다크 테크 | 어두운 베이스 + 네온 포인트 | |

**User's choice:** 차분한 딥블루/청록 / 다크모드: 시스템 자동 + 수동 토글 / Step별 accent 색 구분: 채택

---

## 내비게이션 구조

| Option | Description | Selected |
|--------|-------------|----------|
| 대시보드 카드 → 드릴다운 | 홈 Step 카드 → 모듈 아코디언 → 레슨 | ✓ |
| 상시 사이드바 트리 | 문서 도구 느낌 | |
| 상단 Step 탭 | 계층 얕음 | |

**User's choice:** 대시보드 카드 → 드릴다운 / 레슨 이동: 브레드크럼 + 하단 이전·다음 / 글로벌 내비: 오늘·커리큘럼·일정·소개 4항목 (오늘/일정은 Phase 3까지 비활성)

---

## 레슨 템플릿 & 파일럿 선정

| Option | Description | Selected |
|--------|-------------|----------|
| 6단 구성 | 목표→왜→개념(비유)→실무 예제→실무 팁→정리·점검 | ✓ |
| 간결 3단 구성 | 개념→예제→정리 | |

**User's choice:** 6단 구성 / 파일럿: Python 변수·자료형(Step 1) + React 컴포넌트(Step 2) / 예제: 실행 가능한 완결 코드 + 실행법 명시

---

## 저장소/배포 세팅

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub 공개 | 코드 = 포트폴리오, env로 비밀값 분리 | ✓ |
| 비공개 | 개인용 | |

**User's choice:** 공개 / 이름: `ai-engineer-runway` / 배포: GitHub 연동 자동 배포(main 푸시 + PR 프리뷰)

## Claude's Discretion

- 팔레트 구체 색값, Step accent 색, 타이포 스케일, 카드·배지 디테일
- Velite 스키마·매니페스트 구조·라우팅 설계
- Making-of 페이지 레이아웃
- 레슨별 예상 소요시간 산정

## Deferred Ideas

- 진도 저장/진행률 (Phase 2), 오늘의 학습·일정표·D-day (Phase 3), 검색·노트·PWA (v2)
