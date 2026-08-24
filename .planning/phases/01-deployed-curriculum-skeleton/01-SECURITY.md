---
phase: 01
slug: deployed-curriculum-skeleton
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-24
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register source: 6개 PLAN.md의 plan-time `<threat_model>` 블록 (register_authored_at_plan_time: true).
> 검증 방식: ASVS L1 grep-depth — 완화 증거를 저장소·게이트 스크립트 실행 결과로 확인.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| 로컬 개발 환경 → npm 레지스트리 | 서드파티 코드가 빌드·실행 환경으로 유입 | 설치 스크립트 포함 패키지 코드 |
| 로컬 저장소 → 공개 GitHub 저장소 | 커밋 내용이 공개 웹에 영구 노출 (D-14) | 소스·문서·계획 산출물 |
| 콘텐츠 파일(MDX) → 빌드 파이프라인 | Velite/MDX가 빌드 타임에 파일을 코드로 컴파일 | 저장소 소유자 작성 MDX |
| 공개 인터넷 → Vercel 프로덕션/프리뷰 | 익명 사용자가 사이트 전체를 읽음 (쓰기 경로 없음) | 정적 HTML/CSS/JS |
| 공개 인터넷 → 정적 라우트 파라미터 | URL 세그먼트 임의 조작 접근 | `stepId`, `lessonId` |
| 브라우저 `localStorage` → 렌더 결정 | 사용자 조작 가능 값이 첫 페인트 클래스 결정 | `theme` 표시 전용 값 |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-SC | Tampering | npm installs (next, rehype-pretty-code, shiki, @rehype-pretty/transformers, lucide-react) | high | mitigate | 설치 전 blocking-human 패키지 정당성 체크포인트 — 사용자가 npmjs.com에서 5개 전부 확인 후 "approved" (01-01 Task 1) | closed |
| T-01-01 | Information Disclosure | 공개 저장소 초기 커밋 | high | mitigate | `.gitignore`에 `.env*`/`.velite`/`node_modules` 등록, `git ls-files` 추적 0건 재확인 (이번 감사에서 재실행) | closed |
| T-01-02 | Information Disclosure | 공개 산출물의 브랜드명 노출 | high | mitigate | `scripts/check-brand.mjs` — 이번 감사 재실행 결과 "위반 없음 — 60개 파일 검사 완료" | closed |
| T-01-03 | Tampering | 빌드 타임 MDX 컴파일 | low | accept | 전 MDX가 저장소 소유자 작성, 사용자 제출·원격 fetch 경로 없음 | closed |
| T-01-04 | Tampering | 클라이언트 `localStorage.theme` 조작 | low | accept | 표시 전용, 알 수 없는 값은 시스템 설정 폴백 흡수 | closed |
| T-01-05 | Information Disclosure | Vercel 프로젝트 환경변수 | high | mitigate | Vercel MCP로 프로젝트 생성 시 환경변수 0개로 배포 성공 확인 — 비밀값 부재가 Phase 2 기준선 | closed |
| T-01-06 | Information Disclosure | Vercel 프리뷰 URL 색인 가능성 | low | accept | 콘텐츠 비기밀, D-14가 저장소 공개 확정 | closed |
| T-01-07 | Tampering | Vercel GitHub 연동의 프로덕션 브랜치 | medium | accept | 프로덕션 브랜치는 `master` 단일(생성 시 확인), 저장소 쓰기 권한 소유자 단독 | closed |
| T-01-08 | Denial of Service | 공개 URL 트래픽 급증 | low | accept | 전 페이지 정적, Vercel 무료 티어 한도 내 | closed |
| T-01-09 | Tampering | 매니페스트 메타데이터 무결성 | high | mitigate | `scripts/check-manifest.mjs` 11개 불변식 — 이번 감사 재실행 "all 11 invariants passed (35 lessons, 19 modules, 7860 minutes)" | closed |
| T-01-10 | Denial of Service | 35개 정적 경로 빌드 시간 | low | accept | 정적 생성에서 사소한 규모 | closed |
| T-01-11 | Information Disclosure | 라우트 파라미터 조작 | medium | mitigate | `generateStaticParams` + `notFound()` — step/lesson 페이지 양쪽에 존재 확인, 프로덕션 미존재 경로 404 확인(01-VERIFICATION.md) | closed |
| T-01-12 | Information Disclosure | 공개 표면(메타데이터·OG·/about·레슨 본문) 브랜드명 | high | mitigate | `scripts/check-brand.mjs` 상시 게이트 0건 (T-01-02와 동일 게이트, 표면 확장) | closed |
| T-01-13 | Tampering | 아코디언 등 클라이언트 표시 상태 | low | accept | 표시 전용, 서버 전송 없음 | closed |
| T-01-14 | Information Disclosure | Velite 글로브 확장으로 `.planning/` 렌더 위험 | high | mitigate | pages 컬렉션 pattern이 `docs/making-of.md` 단일 파일로 고정, `velite.config.ts`·`about/page.tsx`에 `.planning` 참조 0건 재확인 | closed |
| T-01-15 | Information Disclosure | 공개 표면 개인 이메일 노출 | medium | mitigate | `check-brand.mjs` 이메일 정규식 검사 0건 | closed |
| T-01-16 | Spoofing | OG `metadataBase` 오설정 | low | accept | D-15 고정 도메인 + 환경변수 오버라이드 가능, 권한 상승 경로 없음 | closed |
| T-01-17 | Information Disclosure | 레슨 예제 코드에 실 API 키 유입 | high | mitigate | 이번 감사에서 35개 레슨 전체 키 패턴 grep 0건, `.env*` gitignore 보조 방어선 | closed |
| T-01-18 | Denial of Service | clipboard 쓰기 실패로 페이지 오류 | low | accept | 실패 시 버튼 피드백만 누락, 정적 렌더 무영향 — 01-UAT Test 2 실기기 통과로 백스톱 확인 | closed |
| T-01-19 | Tampering | 최종 게이트가 캐시된 옛 배포 검증 | low | accept | push 기반 배포 즉시 갱신, 판정 항목이 캐시 시점에 비민감 | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01-1 | T-01-03 | 전 MDX가 저장소 소유자 작성 — 외부 입력 경로 부재 | plan-time threat model (사용자 승인 플랜) | 2026-08-24 |
| AR-01-2 | T-01-04, T-01-13 | 표시 전용 클라이언트 상태 — 권한·데이터 접근 무관 | plan-time threat model | 2026-08-24 |
| AR-01-3 | T-01-06, T-01-08, T-01-10 | 비기밀 정적 콘텐츠 + 무료 티어 규모 — 통제 추가는 과설계 | plan-time threat model | 2026-08-24 |
| AR-01-4 | T-01-07 | 1인 프로젝트, 쓰기 권한 소유자 단독 — 브랜치 보호 이득 없음 (실제 프로덕션 브랜치는 `master`) | plan-time threat model | 2026-08-24 |
| AR-01-5 | T-01-16, T-01-18, T-01-19 | 오설정·실패 시 영향이 표시 품질에 국한, 권한 상승 경로 없음 | plan-time threat model | 2026-08-24 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-24 | 19 (unique) | 19 | 0 | gsd-secure-phase orchestrator (ASVS L1 grep-depth, 게이트 스크립트 재실행 포함) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
