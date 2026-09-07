---
phase: 2
slug: progress-tracking
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-24
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | 전용 테스트 러너 없음 — Node 표준 모듈 기반 게이트 스크립트 4종 (`check-progress-math.mjs`, `check-progress-gates.mjs`, `check-supabase-progress.mjs`, `e2e-progress.mjs`). RESEARCH.md Validation Architecture가 근거: 데이터 규모(35레슨, 1인 사용자)와 5주 타임라인에서 jest/vitest 도입은 과설계, 실 서버·실 DB 왕복 게이트가 더 신뢰도 높음 |
| **Config file** | none — Node 22.6+ 내장 타입 스트리핑으로 `.ts` 순수 모듈을 별도 트랜스파일러 없이 직접 import (ts-node/tsx 미설치, PITFALLS Pitfall 1) |
| **Quick run command** | `node scripts/check-progress-math.mjs && node scripts/check-progress-gates.mjs` |
| **Full suite command** | `node scripts/check-progress-math.mjs && node scripts/check-progress-gates.mjs && node --env-file=.env.local scripts/check-supabase-progress.mjs && node --env-file=.env.local scripts/e2e-progress.mjs` |
| **Estimated runtime** | 정적 게이트(math+gates) ~1초, `check-supabase-progress` ~2초(실 DB 왕복), `e2e-progress`는 `next dev` 콜드 스타트를 포함해 ~30-60초(실 서버 기동 + 다수 실 DB 왕복 시나리오) |

---

## Sampling Rate

- **After every task commit:** Run `node scripts/check-progress-math.mjs && node scripts/check-progress-gates.mjs` (quick run, ~1초)
- **After every plan wave:** Run full suite (`+ check-supabase-progress.mjs + e2e-progress.mjs`)
- **Before `/gsd-verify-work`:** Full suite must be green — confirmed in this task (`npm run build && ` + full suite + `tsc --noEmit && npm run lint` scoped)
- **Max feedback latency:** ~60초 (e2e-progress.mjs의 `next dev` 콜드 스타트가 지배적 비용 — Nyquist 2초 권장치를 넘지만, 실 서버·실 DB 왕복이라는 검증 성격상 단위 테스트로 대체 불가능하다는 것이 RESEARCH.md의 명시적 결론)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | PLAT-02 | T-02-SC | npm 설치 직전 패키지 정당성 확인, blocking-human 체크포인트로 자동 승인 차단 | other | `checkpoint:human-verify` (계획 단계 게이트) | ✅ | ✅ green |
| 02-01-02 | 01 | 1 | PLAT-02 | T-02-01 / T-02-04 / T-02-07 | server-only 마커, 클라이언트 import 금지, 클라이언트 노출 접두사 금지, RLS 정책 0개 | unit | `node scripts/check-progress-gates.mjs` (G1/G2/G3/G5/G6/G7) | ✅ | ✅ green |
| 02-01-03 | 01 | 1 | PLAT-02, TRACK-01 | T-02-04 / T-02-11 | 실 DB 왕복, anon 키 select 0행·insert 거부 반증, 시크릿 미노출 로그 | integration | `node --env-file=.env.local scripts/check-supabase-progress.mjs` | ✅ | ✅ green |
| 02-02-01 | 02 | 2 | TRACK-01, TRACK-02 | T-02-02 / T-02-10 | 완료 토글 브라우저→쿠키 게이트→Server Action 재검증→Supabase→서버 재렌더 왕복, 쿠키 없으면 진도 UI 마커 0건 | e2e | `node --env-file=.env.local scripts/e2e-progress.mjs` (시나리오 b/c/d/e) | ✅ | ✅ green |
| 02-02-02 | 02 | 2 | PLAT-02 | T-02-14 / T-02-06 | `/unlock` 키 검증→HttpOnly 쿠키 발급, key를 리다이렉트 목적지에 싣지 않음 | e2e | `node --env-file=.env.local scripts/e2e-progress.mjs` (시나리오 g1-g5) | ✅ | ✅ green |
| 02-02-03 | 02 | 2 | TRACK-01 | T-02-15 / T-02-17 | 완료 연출·다음 레슨 강조, `isValidUnlockValue` 시크릿 부재 시 무조건 false | unit + human | `node scripts/check-progress-gates.mjs` (G11/G12) + human-check (D-23 체감, end-of-phase UAT) | ✅ | ✅ green (자동) / ⬜ pending (human) |
| 02-03-01 | 03 | 3 | TRACK-03 | T-02-20 | 의존성 0 순수 집계(`aggregate`/`firstIncompleteSlug`), 목록 밖 slug가 집계를 오염시키지 않음 | unit | `node scripts/check-progress-math.mjs` (11개 케이스) | ✅ | ✅ green |
| 02-03-02 | 03 | 3 | TRACK-03 | T-02-20 | 진행률 배지·완료 마커, Velite/Supabase 직접 import 금지(집계 계층 순수성) | unit + e2e | `node scripts/check-progress-gates.mjs` (G13) + `node --env-file=.env.local scripts/e2e-progress.mjs` (h1) | ✅ | ✅ green |
| 02-03-03 | 03 | 3 | TRACK-03, PLAT-02 | T-02-18 / T-02-21 | Step 페이지 쿠키 게이트→조회 순서 고정, 완료 집합 요청당 1회 읽기 공유 | unit + e2e | `node scripts/check-progress-gates.mjs` (G9/G14) + `node --env-file=.env.local scripts/e2e-progress.mjs` (h1-h4) | ✅ | ✅ green |
| 02-04-01 | 04 | 4 | TRACK-04 | — | 홈 요약 블록 3상태 문구, 서버 렌더 전용(use client 금지), a11y progressbar 속성 | unit | inline Node 검증 스크립트(Task 1 `<verify>`) + `node scripts/check-brand.mjs` | ✅ | ✅ green |
| 02-04-02 | 04 | 4 | TRACK-03, TRACK-04 | T-02-22 | Step 카드 실데이터 + Step 상징 색, 홈 force-dynamic + 쿠키 게이트 우선 호출 | unit | inline Node 검증 스크립트(Task 2 `<verify>`) + `node scripts/check-manifest.mjs` | ✅ | ✅ green |
| 02-04-03 | 04 | 4 | TRACK-01~04, PLAT-02 | T-02-22 / T-02-01b / T-02-12 / T-02-23 | 홈 시나리오 e2e(i1-i5), G10 실제 발동(빌드 산출물 시크릿 스캔), G15/G16 회귀 방지, 프로덕션 배선 확인 | e2e + human | `npm run build && node scripts/check-progress-gates.mjs && node scripts/check-progress-math.mjs && node scripts/check-brand.mjs && node scripts/check-manifest.mjs && node --env-file=.env.local scripts/check-supabase-progress.mjs && node --env-file=.env.local scripts/e2e-progress.mjs && npx tsc --noEmit && npm run lint` + human-check A-D (end-of-phase UAT) | ✅ | ✅ green (자동) / ⬜ pending (human) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — 리포에 이미 존재하던 4개 게이트 스크립트(`check-progress-math.mjs`, `check-progress-gates.mjs`, `check-supabase-progress.mjs`, `e2e-progress.mjs`)가 02-01~02-04 각 Plan에서 점진적으로 확장되며 전 Phase 요구사항을 커버했다. 새 테스트 프레임워크 설치는 이 Phase 범위에서 하지 않는다(RESEARCH.md Pitfall 1, 플랫폼 과잉 엔지니어링 회피).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 완료 전환 애니메이션이 실제로 성취감 있게 느껴지는지 (D-23 "화려하게") | TRACK-01 | 시각적 체감은 자동화된 검증 대상이 아니다 — CSS 구조(keyframes 2개 + reduced-motion 무효화)는 코드 검토로 확인했으나 "성취감이 드는가"는 사용자 본인의 주관적 판정만이 유효한 기준 | `/lesson/{slug}`에서 완료 버튼을 눌러 체크 아이콘 fade+scale-in과 accent ring/glow 연출을 육안 확인, `prefers-reduced-motion: reduce` 환경에서 연출 없이 즉시 전환되는지 확인 |
| 아이패드 세로/가로 모드에서 완료 버튼·CTA·아코디언 헤더의 터치 타깃과 다음 레슨 강조(D-22)가 실기기에서 정상 동작하는지 | UX-01, TRACK-01 | 실기기 터치 인터랙션과 CSS `:has()` 강조는 헤드리스 자동화로 재현 비용이 크고, 아이패드 Safari가 이 프로젝트의 1순위 기기라 실기기 확인이 가장 신뢰도 높은 검증 수단 | 아이패드 Safari에서 레슨 완료 → 다음 레슨 버튼 강조 확인 → 세로/가로 모드 전환 → 배지·버튼 줄바꿈 없이 44px+ 히트 영역 유지되는지 확인 |
| 기기 전환(데스크톱↔아이패드) 후 진도 유지, 외부인 차단(개발자도구 요소 검사로 진도 UI가 DOM에 아예 없는지) | TRACK-01, PLAT-02 | 브라우저 간 실 쿠키 왕복과 "DOM에 존재하지 않음"의 육안/devtools 확인은 e2e 스크립트가 이미 HTTP 레벨에서 증명하지만, 실제 사용자가 실기기에서 겪는 최종 경험 확인은 사람이 직접 봐야 신뢰도가 완전해진다 | 프로덕션 URL + `/unlock` 링크를 데스크톱과 아이패드 양쪽에서 열어 완료 상태 동기화 확인, 시크릿 창(쿠키 없음)으로 개발자도구 요소 검사 → 진도 UI 요소가 렌더 트리에 전혀 없는지 확인 |

위 3개 항목은 `workflow.human_verify_mode: end-of-phase`(기본값)에 따라 개별 Plan 실행 중 즉시 확인하지 않고, `/gsd-verify-work`의 end-of-phase UAT 흐름에서 harvest된다. `.planning/WINDOWS.md`에 `unrun-verify`로 누적 기록됨(02-02/02-03/02-04 각 1건씩, 총 3건).

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Wave 0 requirements: none needed)
- [x] No watch-mode flags
- [x] Feedback latency < 2s for the quick-run tier (`check-progress-math.mjs && check-progress-gates.mjs`); the full-suite tier intentionally exceeds 2s because it exercises a real dev server + real DB round trips (documented above, not a Nyquist violation — RESEARCH.md explicitly justifies this trade-off for a 1-person-scale app)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-24 (retroactively filled by Plan 02-04 Task 3, per plan instruction to replace template placeholders with actual Phase 2 values)
