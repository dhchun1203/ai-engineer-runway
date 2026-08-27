---
phase: 4
slug: step-1
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-25
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | 없음(Jest/Vitest 미설치) — Node 표준 모듈만 쓰는 커스텀 게이트 스크립트 체계(`scripts/*.mjs`) |
| **Config file** | none — 각 `scripts/*.mjs`가 독립 실행 파일 |
| **Quick run command** | `npm run build && node scripts/check-manifest.mjs && node scripts/check-brand.mjs` |
| **Full suite command** | `npm run build && node scripts/check-manifest.mjs && node scripts/check-brand.mjs && node --env-file=.env.local scripts/e2e-progress.mjs && node --env-file=.env.local scripts/e2e-today.mjs` |
| **Estimated runtime** | ~90 seconds (build 포함) |

---

## Sampling Rate

- **After every task commit (레슨 1편 완료마다):** Run `npm run build` (MDX 컴파일·하이라이팅 오류 즉시 노출)
- **After every plan wave (파일럿 완료 / 9편 병합):** Run quick run command (`check-manifest` + `check-brand`)
- **Before `/gsd-verify-work`:** Full suite must be green (e2e-progress + e2e-today 포함)
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-* | 01 | 1 | CONT-02 | — | N/A | manual (파일럿 human-verify, D-59) | `npm run build` (구조 컴파일만) | ✅ | ⬜ pending |
| 04-01-* | 01 | 1 | CONT-03 | T-04-01 (API 키 하드코딩 금지) | 예제는 `os.environ.get("ANTHROPIC_API_KEY")`만 사용, 본문에 `sk-ant-` 문자열 0건 | smoke + manual (저자 로컬 실행) | `npm run build` | ✅ | ⬜ pending |
| 04-*-* | all | all | CONT-02/03 공통 | — | KANT·이메일 0건 | automated | `node scripts/check-brand.mjs` | ✅ | ⬜ pending |
| 04-*-* | all | all | CONT-02/03 공통 | T-04-02 (`public.progress` 불간섭) | SQL 예제는 `practice` 스키마만 사용 | automated | `node scripts/check-manifest.mjs` (Invariant 10 hasContent 개수/slug) | ✅ | ⬜ pending |
| 04-*-* | last | last | 성공 기준 4 (진행률·오늘의 학습 루프) | — | N/A | e2e | `node --env-file=.env.local scripts/e2e-progress.mjs && node --env-file=.env.local scripts/e2e-today.mjs` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] (선택, 권장) `scripts/check-lesson-structure.mjs` — Step 1 10개 `.mdx`가 6단 헤딩(`## 1. 학습 목표` ~ `## 6. 핵심 정리 및 스스로 점검`)을 모두 포함하는지 정규식 검사. D-59가 9편에 사람 검토를 두지 않으므로 구조 누락의 유일한 자동 안전망 — 채택 여부는 플래너 재량
- [ ] `sql`/`powershell` 코드펜스 하이라이팅 스모크 확인(1회성, 로컬 빌드로 충분 — 영구 스크립트 불필요)

*기존 4개 게이트(build · check-manifest · check-brand · e2e ×2)만으로 phase 완료 가능. 위 항목은 보강용.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 파일럿 레슨(`1-3-python-variables-and-types`) 읽기 쉬움·코드 동작·해보기 분량 | CONT-02, CONT-03 | 프로즈 품질은 자동 측정 불가 (D-51, D-59, D-60) | master 푸시 → 프로덕션 URL `/lesson/1-3-python-variables-and-types`를 아이패드 Safari로 열어 구 버전 대비 비교, 코드 블록 복사→로컬 `py 파일명` 실행, `<details>` 정답 펼침 터치 확인 |
| 9편 실습 코드의 실제 실행 (Python / scikit-learn / Supabase SQL / git) | CONT-03 | 학습자 환경(로컬 Python, Supabase SQL 에디터, GitHub)에서만 실행 가능 | 저자(executor)가 집필 중 각 예제를 1회 실행해 예상 출력을 `<details>`에 기록 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
