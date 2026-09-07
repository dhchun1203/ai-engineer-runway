# Phase 2: 진도 체크와 진행률 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-24
**Phase:** 2-진도 체크와 진행률
**Areas discussed:** 진도 식별·보호 방식, 완료 버튼·완료 표시 UX, 대시보드 구성, 저장 실패·엣지 케이스

---

## 진도 식별·보호 방식

| Option | Description | Selected |
|--------|-------------|----------|
| 공유 시크릿 쿠키 | 기기마다 최초 1회 인증 → 쿠키. 읽기/쓰기는 서버 전용, 단일 고정 사용자 행 | ✓ |
| 단일 계정 로그인 | Supabase Auth 계정 1개, 기기마다 최초 1회 로그인, RLS auth.uid() | |
| 익명 세션 + 기기 링크 | signInAnonymously + linkIdentity — 기기 간 동기화 취약 | |

**User's choice:** 공유 시크릿 쿠키 (추천안)
**Notes:** 스택 가이드의 익명 로그인 권장은 기기 간 동기화(성공 기준 1)와 충돌해 이 결정으로 대체.

| Option | Description | Selected |
|--------|-------------|----------|
| 콘텐츠 공개 + 진도만 보호 | 레슨·Making-of 공개, 진행률·완료 체크는 쿠키 보유 시만 | ✓ |
| 사이트 전체 잠금 | 미들웨어가 전체 페이지 차단 — 포트폴리오 목적과 충돌 | |
| 진행률 공개, 쓰기만 보호 | 성공 기준 5(읽기도 차단)와 어긋남 | |

**User's choice:** 콘텐츠 공개 + 진도만 보호 (추천안)

| Option | Description | Selected |
|--------|-------------|----------|
| 비밀 링크(북마크) | /unlock?key=... 1회 방문으로 쿠키 설정 | ✓ |
| 잠금 해제 페이지 직접 입력 | /unlock에서 코드 타이핑 | |
| 둘 다 지원 | 링크+폼 모두 | |

**User's choice:** 비밀 링크(북마크) (추천안)

| Option | Description | Selected |
|--------|-------------|----------|
| 완전히 숨김 | 쿠키 없으면 진도 기능 존재 자체 비노출 | ✓ |
| 0%·비활성 상태로 표시 | 잠금 아이콘으로 기능 존재는 보임 | |

**User's choice:** 완전히 숨김 (추천안)

---

## 완료 버튼·완료 표시 UX

| Option | Description | Selected |
|--------|-------------|----------|
| 본문 끝, 이전/다음 위 | 읽기 완료 동선의 끝에 큰 버튼(44px+) | ✓ |
| 헤더(제목 옆) 고정 | 진입 즉시 보이나 실수 탭 가능 | |
| 둘 다 | 헤더 상태 배지 + 하단 토글 | |

**User's choice:** 본문 끝, 이전/다음 위 (추천안)

| Option | Description | Selected |
|--------|-------------|----------|
| 다음 레슨 CTA 강조 | 완료 상태 전환 + 다음 레슨 버튼 강조, 이동은 수동 | ✓ |
| 상태 변경만 | 체크 전환이 전부 | |
| 자동으로 다음 레슨 이동 | 실수 탭 시 당황, 취소 동선 꼬임 | |

**User's choice:** 다음 레슨 CTA 강조 (추천안)

| Option | Description | Selected |
|--------|-------------|----------|
| 체크 아이콘 + 은은한 톤 다운 | 남은 레슨이 도드라짐, 재토글 가능 | ✓ |
| 체크 아이콘만 | 모든 레슨 동등 비중 | |
| Step 상징색 체크 + 카운트 | accent 색 체크 + 모듈 헤더 N/M | |

**User's choice:** 체크 아이콘 + 은은한 톤 다운 (추천안)

---

## 대시보드 구성

| Option | Description | Selected |
|--------|-------------|----------|
| 홈 화면 강화 | 홈 상단 요약 + Step 카드 실데이터, 새 페이지 없음 | ✓ |
| 별도 대시보드 페이지 | /dashboard 신설 — 내비 4항목 구조 변경 필요 | |

**User's choice:** 홈 화면 강화 (추천안)

| Option | Description | Selected |
|--------|-------------|----------|
| 레슨 개수 기준 | 완료 수 ÷ 전체 수 — TRACK-03 표기와 일치 | ✓ |
| 예상 소요시간 가중 | 체감 진도와 가깝지만 개수 표기와 불일치 발생 | |
| 개수 기본 + 시간 병기 | %는 개수, 시간 정보는 보조 | |

**User's choice:** 레슨 개수 기준 (추천안)

| Option | Description | Selected |
|--------|-------------|----------|
| 이어서 학습하기 CTA | 첫 미완료 레슨으로 바로 이동 | ✓ |
| 진행률 숫자만 | 최소 구성 | |
| CTA + 최근 완료 레슨 | 맥락 회복용 최근 완료 1~2개 병기 | |

**User's choice:** 이어서 학습하기 CTA (추천안)

---

## 저장 실패·엣지 케이스

| Option | Description | Selected |
|--------|-------------|----------|
| 낙관적 업데이트 | 즉시 체크 전환, 백그라운드 저장, 실패 시 롤백 | ✓ |
| 저장 확인 후 반영 | 로딩 후 체크 — 느린 회선에서 답답 | |

**User's choice:** 낙관적 업데이트 + **완료 전환 애니메이션을 화려하게 만들어 성취감을 느끼도록** (자유 서술 추가 요청)

| Option | Description | Selected |
|--------|-------------|----------|
| 버튼 인라인 에러 + 재시도 | 롤백 + 버튼 자리에 실패 메시지·재시도 | ✓ |
| 토스트 알림 | 전역 토스트 시스템 신규 구축 필요 | |
| 자동 재시도 후 안내 | 1~2회 재시도 후 인라인 에러 | |

**User's choice:** 버튼 인라인 에러 + 재시도 (추천안)

| Option | Description | Selected |
|--------|-------------|----------|
| completed_at 기록 | Phase 3 페이스 계산·오늘 완료 표시 재료 | ✓ |
| 불리언만 | 스키마 최소화 | |

**User's choice:** 기록한다 (추천안)

## Claude's Discretion

- 완료 애니메이션 구체 연출(화려함·성취감 조건 충족 전제)
- DB 스키마·RLS 정책 상세, 쿠키 속성·수명, /unlock 라우트 구현
- 진행률 요약 블록 레이아웃, 낙관적 업데이트·캐시 무효화 구현 세부

## Deferred Ideas

None — discussion stayed within phase scope
