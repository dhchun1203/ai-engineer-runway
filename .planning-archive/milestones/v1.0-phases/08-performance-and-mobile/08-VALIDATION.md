---
phase: 8
slug: performance-and-mobile
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-27
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `08-RESEARCH.md` → `## Validation Architecture`. Per-task rows are filled by `/gsd-validate-phase` once plans exist.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | 프로젝트 자체 Node 스크립트 하네스(`scripts/check-*.mjs` 정적 게이트 10종 + `scripts/e2e-*.mjs` Playwright 게이트 6종). 외부 테스트 러너 없음 — 신규 프레임워크 도입 금지 |
| **Config file** | none — 각 게이트가 `node scripts/<name>.mjs`로 독립 실행되는 기존 관례 |
| **Quick run command** | `node scripts/check-design-tokens.mjs` (및 관련 정적 게이트) |
| **Full suite command** | `check-*.mjs` 10종 + `e2e-*.mjs` 6종 순차 실행 (일괄 러너 부재 — 이 phase에서 하나 추가할지는 계획 단계 판단) |
| **Estimated runtime** | 정적 게이트 ~수 초 / e2e 전체 ~수 분 |

---

## Sampling Rate

- **After every task commit:** 정적 게이트(`check-design-tokens.mjs` 등) — Tailwind 임의값 대괄호 오용을 즉시 잡는다
- **After every plan wave:** `next build && next start` 부트스트랩 후 신규 성능 게이트 실행
- **Before `/gsd-verify-work`:** 16종 기존 게이트 + 신규 게이트 전부 green
- **Max feedback latency:** 정적 ~10s / wave e2e ~180s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| _(filled by `/gsd-validate-phase` after plans exist)_ | | | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

### Success-Criteria → Test Map (from RESEARCH)

| SC | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|-------------|
| SC1 | 콘텐츠 페이지 TTFB가 정적 라우트 수준(로컬 상대 비교), 진도 정확성 유지 | e2e (Playwright, 프로덕션 빌드) | `node scripts/e2e-perf-budget.mjs` (신규) | ❌ W0 |
| SC2 | 첫 방문 폰트 전송량 측정 + 판단 근거 기록 | e2e (Playwright 네트워크 캡처) | 위 스크립트 통합 또는 `scripts/measure-font-transfer.mjs` | ❌ W0 |
| SC3 | 375px 6종 화면 가독성 정량화(제목 줄바꿈 수 등) | e2e (Playwright, DOM 측정) | `e2e-mobile-overflow.mjs` 확장 또는 신규 `e2e-mobile-readability.mjs` | ❌ W0 |
| SC4 | 기존 게이트 16종 + 신규 회귀 게이트 1개 전부 통과 | 정적 + e2e 전체 스위트 | 개별 스크립트 순차 실행 | ✅ (기존 16종 존재) |
| SC5 | 눌림 피드백·스켈레톤·빈/에러 상태 존재 + 아이패드 스크롤 60fps | e2e (DOM 클래스 검사 + 프레임 타이밍) | SC1 스크립트에 프레임 예산 측정 포함 | ❌ W0 |

---

## Wave 0 Requirements

- [ ] `scripts/e2e-perf-budget.mjs` — TTFB 상대 비교(정적 `/about` 대비) + 폰트 전송 바이트 캡처 + 60fps 프레임 예산. **`next dev`가 아니라 `next build && next start`를 부트스트랩해야 한다** — dev 서버는 온디맨드 컴파일 때문에 프로덕션과 근본적으로 다른 타이밍을 낸다(기존 `e2e-mobile-overflow.mjs`의 dev 서버 패턴을 그대로 복제하면 TTFB 숫자가 무의미해진다)
- [ ] 서브셋 폰트 글리프 커버리지 정적 게이트 — 전체 레슨 텍스트의 유니크 문자 집합이 서브셋 폰트 `cmap`에 전부 있는지 검사. 글리프 누락은 배포 후에야 눈에 띄는 조용한 결함이다
- [ ] `scripts/check-progress-gates.mjs`의 **G9 갱신 (필수)** — G9은 현재 5개 파일에 `force-dynamic` 선언이 있는지 검사한다. 정적 전환 시 반드시 실패하므로 이 phase가 함께 수정해야 한다

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 아이패드 실기기 스크롤·전환 체감 | SC5 | Phase 6에서 게이트 16종 전부 초록불인 상태로 실기기 결함(메모장 하단 틈)이 나온 전례가 있다 — 자동 게이트가 실기기를 대체하지 못한다 | 배포 URL을 아이패드 Safari에서 열고 세로/가로 모두에서 레슨·Step·커리큘럼·일정 스크롤, 완료 토글, 페이지 전환을 직접 수행 |
| 폰(375px) 실사용 가독성 | SC3 | "깨지지 않는다"(자동 측정 가능)와 "쓰기 좋다"(주관)는 다른 문제 | 폰에서 6종 화면을 실제로 읽어보고 좁아서 참고 쓰는 느낌이 남는 지점을 기록 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
