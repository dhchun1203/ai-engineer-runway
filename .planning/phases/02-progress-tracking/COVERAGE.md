# Phase 2 — API Coverage Matrix

**Integration:** Supabase (hosted Postgres) via `@supabase/supabase-js` 2.112.3
**Decided:** 2026-08-24 (plan-phase, before plan finalization)
**Default posture:** full coverage — every capability is `INTEGRATE` unless a one-line reason justifies `OPT-OUT`

> D-17이 이 Phase의 통합 경계를 정한다: 진도의 모든 읽기/쓰기는 서버에서만, `service_role` 키로만 수행하고
> Supabase Auth는 쓰지 않는다. 아래 `OPT-OUT` 사유의 다수가 이 결정에서 파생된다.

## PostgREST (data) capabilities

| capability | decision | reason |
|---|---|---|
| `postgrest.select` — `progress` 행 조회 | INTEGRATE | 모든 진도 화면(레슨·모듈·Step·홈)의 읽기 경로 |
| `postgrest.upsert` — 완료 표시 + `completed_at` 갱신 | INTEGRATE | D-30(재완료 시 시각 갱신)이 요구하는 유일한 쓰기 경로 |
| `postgrest.delete` — 완료 취소 | INTEGRATE | TRACK-02 토글의 취소 방향 |
| `postgrest.insert` (upsert가 아닌 순수 insert) | OPT-OUT | 재완료가 중복 키 오류가 되어선 안 되므로 upsert 하나로 통일 (D-30) |
| `postgrest.update` (독립 update) | OPT-OUT | 갱신 대상 컬럼이 `completed_at` 하나뿐이라 upsert가 그대로 덮어쓴다 |
| `postgrest.count` / `head` | OPT-OUT | 진행률은 DB가 아니라 `lib/progress.ts` 순수 함수가 계산한다 (ARCHITECTURE Anti-Pattern 3) |
| `postgrest.rpc` (DB 함수 호출) | OPT-OUT | 이 Phase는 DB 함수·뷰·트리거를 만들지 않는다 (같은 근거) |
| `postgrest.filter/eq` | INTEGRATE | 완료 취소 시 `lesson_id` 단건 지정에 필요 |
| `postgrest.range` / 페이지네이션 | OPT-OUT | 전체 레슨이 35행 규모라 단일 SELECT로 충분 |

## Client / auth capabilities

| capability | decision | reason |
|---|---|---|
| `createClient(url, service_role)` — 서버 전용 클라이언트(세션 옵션 전부 off) | INTEGRATE | D-17이 지정한 유일한 애플리케이션 접근 경로 |
| 브라우저용 anon/publishable 클라이언트 | OPT-OUT | D-17 — 클라이언트에 Supabase 키를 두지 않는다 |
| `@supabase/ssr` 쿠키 세션 연동 | OPT-OUT | Supabase Auth 세션 자체가 없으므로 동기화할 세션이 없다 (D-17) |
| `auth.signInAnonymously()` / `signUp` / `signInWithOtp` | OPT-OUT | D-17이 익명 세션을 명시적으로 기각(기기마다 ID가 달라져 성공 기준 1과 충돌) |
| `auth.linkIdentity()` | OPT-OUT | Supabase Auth 미사용의 귀결 — 잠금은 공유 시크릿 쿠키(D-19)가 담당 |
| anon 키 클라이언트 (검증 전용) | INTEGRATE | 앱 코드가 아닌 `scripts/check-supabase-progress.mjs`에서만 사용 — RLS 기본 차단이 실제로 동작하는지 자동 반증하기 위함 (PLAT-02) |

## Platform capabilities

| capability | decision | reason |
|---|---|---|
| Row Level Security 활성화 (`enable row level security`) | INTEGRATE | 심층 방어 — anon 키가 유출돼도 테이블 도달 불가 |
| `anon`/`authenticated` 역할 정책 작성 | OPT-OUT | 정책 0개 = 의도된 기본 차단(default-deny). 정책을 만드는 순간 테이블이 열린다 (RESEARCH Pitfall 3) |
| 마이그레이션을 저장소 커밋 SQL로 관리 | INTEGRATE | RESEARCH Open Question 1 권고 — 대시보드 전용 변경 금지 |
| 마이그레이션 적용(Supabase MCP `apply_migration`) | INTEGRATE | Supabase CLI 미설치 환경에서 비대화형으로 스키마를 적용하는 경로 |
| `list_tables` (적용 결과 확인) | INTEGRATE | 스키마 푸시 검증 |
| `get_advisors` (security lint) | INTEGRATE | 마이그레이션 직후 RLS 오설정 경보 확인 |
| `get_project_url` | INTEGRATE | `SUPABASE_URL` 배선 확인 |
| `get_publishable_api_key` | INTEGRATE | anon 키를 RLS 기본 차단 반증 스크립트에 공급 |
| `get_logs` | OPT-OUT | 상시 통합이 아닌 디버깅 시 임시 사용 — 코드 경로 없음 |
| Realtime 구독 | OPT-OUT | 1인 사용 + Server Action `revalidatePath` 재렌더로 충분 |
| Storage | OPT-OUT | 진도 도메인에 파일 자산이 없다 |
| Edge Functions | OPT-OUT | Server Action이 이 프로젝트의 백엔드 계층이다 (ARCHITECTURE 책임 맵) |
| `supabase gen types typescript` | OPT-OUT | Supabase CLI 미설치 + 테이블 1개·컬럼 2개 — 손으로 쓴 타입이 더 싸다 |
| Supabase CLI 로컬 스택(`supabase start`) | OPT-OUT | 5주 타임라인에서 로컬 Postgres 스택 도입은 과설계 (PITFALLS Pitfall 1) |

## Summary

- INTEGRATE: 12
- OPT-OUT: 15 (전부 사유 명시)
- 미결정: 0

---
*Phase: 2-progress-tracking · API coverage decided at plan time*
