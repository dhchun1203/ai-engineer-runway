---
phase: 5
slug: step-2-3
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-25
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | 없음(Phase 4와 동일) — Node 표준 모듈만 쓰는 커스텀 게이트 스크립트 체계(`scripts/*.mjs`) |
| **Config file** | none — 각 `scripts/*.mjs`가 독립 실행 파일 |
| **Quick run command** | `npm run build && node scripts/check-manifest.mjs && node scripts/check-brand.mjs && node scripts/check-lesson-structure.mjs` |
| **Full suite command** | quick run + `node --env-file=.env.local scripts/e2e-progress.mjs && node --env-file=.env.local scripts/e2e-today.mjs` |
| **Estimated runtime** | ~120 seconds (build 포함) |

---

## Sampling Rate

- **After every task commit (레슨 1편 완료마다):** Run `npm run build` (MDX 컴파일·하이라이팅 오류 즉시 노출)
- **After every plan wave (Wave 0 게이트 확대 / Wave 1 파일럿 / Wave 2 Step 2 잔여 / Wave 3 Step 3 잔여):** Run quick run command (`check-manifest` + `check-brand` + `check-lesson-structure`)
- **Before `/gsd-verify-work`:** Full suite must be green (e2e-progress + e2e-today 포함 — D-81의 100% 진행률 검증)
- **Max feedback latency:** 150 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-*-* | Wave 0 | 0 | 게이트 확대 (D-71/D-72) | — | N/A | automated | `node scripts/check-lesson-structure.mjs` (STEP1_DIR → 디렉터리 배열, `ALLOWED_FENCE_LANG_PREFIXES` 확장) | ✅ | ⬜ pending |
| 05-*-* | Wave 1 | 1 | CONT-05 (파일럿 3편) | — | N/A | manual (파일럿 human-verify, D-76) + automated 구조 게이트 | `npm run build && node scripts/check-lesson-structure.mjs` | ✅ | ⬜ pending |
| 05-*-* | all | all | CONT-05 공통 | T-05-* (API 키/시크릿 하드코딩 금지) | 예제는 환경변수 참조만 사용, 본문에 실제 키 문자열 0건 | automated | `node scripts/check-brand.mjs` (KANT·이메일 0건) | ✅ | ⬜ pending |
| 05-*-* | all | all | 매니페스트 불변식 (D-78) | — | N/A | automated | `node scripts/check-manifest.mjs` (Invariant 10 `hasContent` 개수/slug — wave별 기대값은 플래너가 빌드 실측으로 재확정) | ✅ | ⬜ pending |
| 05-*-* | last | 3 | 성공 기준 4 (전체 진행률 100% 도달, D-81) | — | N/A | e2e | `node --env-file=.env.local scripts/e2e-progress.mjs && node --env-file=.env.local scripts/e2e-today.mjs` | ✅ (코드 변경 불필요) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `2-3-react-components.mdx` 재작성 — 신규 6단 구조(`### 해보기` · `<details>` · 단어 표)를 만족시켜야 함. **게이트 확대의 선행 조건**(순서 의존성: 재작성 → 게이트 확대, RESEARCH Pitfall 3)
- [ ] `scripts/check-lesson-structure.mjs` 디렉터리 확대(D-71) + 코드펜스 언어 확장(D-72)
- [ ] `scripts/check-manifest.mjs` Invariant 10 상수 3단계 갱신(D-78) — 기대 `hasContent` 수치는 빌드 실측으로 재검증할 것 (RESEARCH Open Question 1: "11→14"가 실제로는 11→13일 가능성)
- [ ] (권장, 필수 아님) 신규 8개 코드펜스 언어 스모크 빌드 1회 — RESEARCH Pitfall 5

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 파일럿 레슨 3편의 읽기 쉬움·코드 동작·해보기 분량 | CONT-05 | 프로즈 품질은 자동 측정 불가 (D-76) | master 푸시 → 프로덕션 URL의 해당 레슨을 아이패드 Safari로 열어 확인, 코드 블록 복사→로컬 실행, `<details>` 정답 펼침 터치 확인 |
| Step 3 개요 레슨의 "알아듣기" 기준 (정의·용도·위치 3요소) | CONT-05 | 프로즈 품질은 자동 측정 불가 (D-62) | 저자(executor)가 각 개요 레슨 집필 후 3요소 체크리스트로 자체 검토 |
| 프로젝트 5종 가이드의 "재현 아님" 경계 (완성 코드 금지) | CONT-05 | 내용 경계는 자동 측정 불가 | 저자 자체 검토 + 파일럿 human-verify에서 1편 샘플 확인 |
| Making-of(/about) 페이지의 구현→검증→배포 기록 마감 | 성공 기준 4 | 서술 완결성은 자동 측정 불가 | `/about` 페이지를 아이패드 Safari로 열어 Phase 1~5 흐름이 끊김 없이 읽히는지 확인 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 150s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
