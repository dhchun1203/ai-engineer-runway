---
phase: 2
slug: progress-tracking
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-24
---

# Phase 2 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| 서버 프로세스 → Supabase Postgres | service_role 키가 RLS를 우회해 진도 테이블에 전권 접근 | 진도 행(레슨 slug, completed_at) |
| 공개 인터넷 → Supabase REST 엔드포인트 | anon 키는 항상 공개 취급, 누구나 같은 엔드포인트 접근 가능 | (RLS 기본 차단으로 0행) |
| 저장소(공개) → 시크릿 | `.env.example`·소스·빌드 산출물이 공개 저장소/배포본으로 나감 | 환경 변수 이름(값 금지) |
| npm 레지스트리 → 빌드 | 설치 패키지 코드가 빌드·런타임에 실행됨 | 서드파티 코드 |
| 공개 인터넷 → 레슨/`/unlock`/Step/홈 라우트 | 익명 요청이 쿼리 파라미터·쿠키를 임의 제어 | UNLOCK_SECRET(쿼리), 잠금 쿠키 |
| 브라우저 → Server Action POST 엔드포인트 | HTML에 참조가 없어도 컴파일된 엔드포인트는 존재 | lessonId, 완료 토글 |
| 요청 쿠키 → 서버의 인가 판정/진도 렌더 여부 | 쿠키 값 하나가 진도 읽기·쓰기·DOM 존재를 결정 | runway_unlock 쿠키 |
| 로컬 환경 → Vercel 프로덕션 환경 | 같은 코드가 다른 환경 변수로 실행 | SUPABASE_URL/KEY, UNLOCK_SECRET |
| 빌드 산출물 → 브라우저 | `.next/static`에 실린 것은 전부 공개 | 정적 JS/CSS |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-01 | Information Disclosure | `SUPABASE_SERVICE_ROLE_KEY` 브라우저 번들 유출 | critical | mitigate | `server-only` 마커 + 게이트 G1/G2/G3/G10 4중 방어 — check-progress-gates.mjs 2026-08-24 실행 all pass | closed |
| T-02-15 | Elevation of Privilege | 시크릿 미설정 서버에서 쿠키 없는 요청이 잠금 해제 판정 | critical | mitigate | `isValidUnlockValue` 시크릿 부재·16자 미만 무조건 false, G11이 실제 실행 검증 (gates pass) | closed |
| T-02-01b | Information Disclosure | 프로덕션 빌드 산출물에 시크릿 리터럴 | critical | mitigate | 빌드 후 G10 `.next/static` 시크릿 스캔 (02-04 검증 명령에 고정; 이번 gates 실행에서는 빌드 산출물 부재로 정상 skip) | closed |
| T-02-04 | Information Disclosure | anon 키로 `progress` 테이블 직접 조회 | high | mitigate | RLS 활성화 + 정책 0개(기본 차단), `check-supabase-progress.mjs`가 anon select 0행·insert 거부 반증 | closed |
| T-02-05 | Tampering | RLS 정책 0개를 버그로 오인해 `using (true)` 회귀 | high | mitigate | G5(마이그레이션 SQL 정책 수 0 계수) pass + SQL 근거 주석 | closed |
| T-02-07 | Information Disclosure | 시크릿 파일의 공개 저장소 커밋 | high | mitigate | G6(.env.example 플레이스홀더 검사)·G7(.gitignore `.env*` 규칙) pass | closed |
| T-02-SC | Tampering | npm 공급망 (`@supabase/supabase-js`, `server-only`) | high | mitigate | Package Legitimacy blocking-human 체크포인트 통과, postinstall 스크립트 없음 확인 (02-01 실행 기록) | closed |
| T-02-02 | Elevation of Privilege | Server Action 재전송 — UI 미노출을 인가로 착각 | high | mitigate | 액션 최상단 `hasUnlockCookie()` 재검증 후 throw (actions.ts:19 확인), G4가 호출 순서 고정 | closed |
| T-02-10 | Information Disclosure | 잠금 없는 방문자 레슨 HTML에 진도 UI 잔존 | high | mitigate | 서버 조건부 렌더(DOM 부재) — UAT Test 3에서 프로덕션 시크릿 창 DOM 검사로 `data-progress-ui` 0건 실측 | closed |
| T-02-18 | Information Disclosure | 잠금 없는 방문자 Step 페이지의 배지·완료 마커 | high | mitigate | 동일 서버 조건부 렌더 — UAT Test 3 /step/1 실측 0건 | closed |
| T-02-22 | Information Disclosure | 잠금 없는 방문자 홈의 요약 블록·진행률 바 | high | mitigate | 동일 서버 조건부 렌더 — UAT Test 3 홈 실측 0건 | closed |
| T-02-11 | Information Disclosure | 게이트 스크립트·오류 메시지에 시크릿 값 노출 | medium | mitigate | 스크립트가 변수 이름·경로만 출력 (check-supabase-progress.mjs 등 확인) | closed |
| T-02-03 | Tampering | 조작된 `lessonId`로 임의 progress 행 삽입 | medium | mitigate | 액션에서 `getLessonBySlug` 매니페스트 실존 검증 후에만 저장 (actions.ts:23 확인) | closed |
| T-02-14 | Information Disclosure | 잠금 key의 히스토리·Referer·로그 잔존 | medium | mitigate | 검증 즉시 리다이렉트(목적지에 key 없음) + `HttpOnly; SameSite=lax` 쿠키 — 2026-08-24 프로덕션 응답 헤더 실측(307 → /unlock/done?state=ok) | closed |
| T-02-12 | Tampering | Vercel 환경 변수 미배선·드리프트 | medium | mitigate | 4종 등록 완료 — 프로덕션 /unlock 잠금·저장·기기 전환이 UAT Test 1·2에서 실동작 확인 | closed |
| T-02-20 | Tampering | 집계에 매니페스트 밖 slug 혼입 | low | mitigate | `aggregate`가 slug 목록 순회로 계수, check-progress-math.mjs "목록 밖 slug" 케이스 pass | closed |
| T-02-21 | Denial of Service | 모듈마다 DB 재조회(요청당 19회) | low | mitigate | 완료 집합 페이지당 1회 조회 후 prop 전달 (02-03 acceptance criterion) | closed |
| T-02-23 | Tampering | '이어서 학습하기' CTA 오링크 | low | mitigate | e2e가 매니페스트에서 기대 slug를 독립 재계산해 비교 + UAT Test 2 육안 확인 | closed |
| T-02-08 | Repudiation | `completed_at` 시각 위조·누락 | low | accept | 1인용 자가 체크 데이터, 감사 요구 없음 (R-01) | closed |
| T-02-13 | Denial of Service | service_role 키 노출 시 진도 전량 삭제 | medium | accept | T-02-01 4중 방어가 노출 경로 차단, 35행·재입력 가능 규모라 백업 과설계 (R-02) | closed |
| T-02-06 | Spoofing | 비밀 링크 유출로 제3자 진도 읽기·쓰기 | medium | accept | 1인용 위협 모델에서 서명·만료 과설계, 유출 시 UNLOCK_SECRET 교체로 전 기기 무효화 (R-03) | closed |
| T-02-16 | Denial of Service | 완료 버튼 연타로 Server Action 폭주 | low | accept | 전환 중 버튼 비활성 + 단일 사용자 규모 (R-04) | closed |
| T-02-17 | Information Disclosure | Server Action 오류 메시지의 DB 내부 정보 노출 | low | accept | 클라이언트는 고정 문구만 표시, 원문은 서버 로그 (R-05) | closed |
| T-02-19 | Information Disclosure | `/step/{임의값}` 파라미터 조작 | low | accept | `getStep` undefined 시 `notFound()`, 순회 표면 없음 (R-06) | closed |
| T-02-24 | Denial of Service | 홈이 요청마다 진도 테이블 전체 읽기 | low | accept | 35행 단일 SELECT·1인 사용, 캐시 과설계 (R-07) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-01 | T-02-08 | 1인용 자가 체크 데이터 — 시각은 페이스 판정 입력값일 뿐 권한 판단에 미사용 | plan-phase (owner) | 2026-08-24 |
| R-02 | T-02-13 | 노출 경로는 T-02-01 4중 방어로 차단, 데이터 규모상 백업 체계는 과설계 | plan-phase (owner) | 2026-08-24 |
| R-03 | T-02-06 | 1인용 위협 모델 — 유출 시 UNLOCK_SECRET 교체가 복구 경로 | plan-phase (owner) | 2026-08-24 |
| R-04 | T-02-16 | 전환 중 버튼 비활성 + 단일 사용자 규모 — 레이트 리밋 과설계 | plan-phase (owner) | 2026-08-24 |
| R-05 | T-02-17 | 노출 정보가 테이블 존재 여부 수준 — 고정 문구 대체로 충분 | plan-phase (owner) | 2026-08-24 |
| R-06 | T-02-19 | 파라미터가 파일 경로·DB 키로 미사용, notFound() 처리 | plan-phase (owner) | 2026-08-24 |
| R-07 | T-02-24 | 35행 단일 SELECT·1인 사용 — 캐시 계층은 D-28과 상충하는 과설계 | plan-phase (owner) | 2026-08-24 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-24 | 25 | 25 | 0 | gsd-secure-phase (L1 short-circuit: plan-time register, gates 실행 + 프로덕션 실측 + UAT 교차 증거) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-24
