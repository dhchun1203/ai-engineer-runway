---
phase: 08-performance-and-mobile
verified: 2026-08-27T00:00:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 8: 성능·인터랙션·스마트폰 최적화 Verification Report

**Phase Goal:** 아이패드와 폰 모두에서 페이지가 즉시 열리고, 누르고 넘기는 감각이 "직접 만든 티"가
아니라 잘 다듬어진 제품처럼 느껴진다 — 콘텐츠 페이지를 요청마다 새로 그리지 않고 미리 만들어
두고(진도 정보만 따로 가져온다), 폰트 전송량을 줄이고, 폰(375px) 실사용 경험을 다듬는다.

**Verified:** 2026-08-27
**Status:** passed
**Re-verification:** No — initial verification

## 요구사항 추적성 관찰 (Traceability Observation)

이 Phase는 ROADMAP.md에 확정 REQ ID가 없는("TBD (PROJECT.md Active "모바일·아이패드 최적화"
귀속 후보)") 상태로 계획됐다 — Phase 6과 동일한 선례를 따라 SC1~SC5를 요구사항 단위로 대신
사용했다. 8개 PLAN의 `requirements` 프론트매터는 SC1~SC5에 더해 **이미 앞선 Phase(1~5)에서
Complete로 확정된 기존 ID**(TRACK-01~04, PLAT-02/03, UX-01~03, SCHED-02/04)를 함께 인용하는데,
이는 REQUIREMENTS.md Traceability 표에 이미 매핑된 요구사항을 이 Phase가 "심화"한다는
ROADMAP 본문의 명시적 방침("기존 요구사항 UX-01/02/03을 심화하는 플랜은 해당 ID를 함께
인용한다")과 일치한다 — 새로운 소유권 이전이 아니라서 REQUIREMENTS.md 갱신이 필요하지
않다. 08-03-PLAN.md가 v2 백로그 항목 CONV-02(레슨별 개인 노트)를 인용하는 것도 마찬가지로
계획을 앞당겨 실제로 구현했다는 의미이지, 결손이 아니다. REQUIREMENTS.md에 Phase 8 자체 행을
추가하지 않은 것은 Phase 6 선례와 일관되며 이 Phase 검증에서 미결로 취급하지 않는다.

별개로, REQUIREMENTS.md Traceability 표에서 CONT-02/CONT-03이 "Phase 4 | Pending"으로
표기돼 있는데(체크박스도 `[ ]`), ROADMAP.md는 Phase 4·5를 모두 Complete로 기록한다 — 이는
Phase 8과 무관한 기존 문서 불일치이며 이번 Phase 8 검증 범위 밖의 관찰 사항으로만 기록한다
(수정 여부는 별도 결정 필요).

## Goal Achievement

### Observable Truths (SC1~SC5)

| # | Truth (ROADMAP SC) | Status | Evidence |
|---|---|---|---|
| 1 | SC1: 콘텐츠 페이지(레슨·Step·커리큘럼) TTFB가 정적 라우트 수준(~40ms 이하)에 도달하고, 완료 토글 즉시 반영·잠금 쿠키 유무 분기가 정확 | ✓ VERIFIED | 코드: `src/app/lesson/[lessonId]/page.tsx`·`src/app/step/[stepId]/page.tsx`에 `generateStaticParams`만 있고 `force-dynamic` 없음(직접 grep 확인); `src/app/curriculum/page.tsx`도 동일. `src/app/page.tsx`·`src/app/schedule/page.tsx`에는 `export const dynamic = "force-dynamic"` 존재(의도된 유지). `node scripts/check-route-rendering.mjs` 이 세션에서 재실행 exit 0("all route rendering contracts passed"). 08-MEASUREMENTS.md 표1: 프로덕션 실측 3개 정적 라우트 33.59~39.93ms, 정적 대조군 `/about` 34.86ms와 동일 구간. 진도 정확성은 실 DB 기준 `e2e-progress.mjs` 전 시나리오 통과로 08-08이 확인(이 세션은 `.env.local` 접근이 차단돼 재실행 불가, 코드 리뷰가 `hasUnlockCookie()` 게이트 순서를 라인 단위로 재확인함) |
| 2 | SC2: 첫 방문 폰트 전송량을 측정하고, 줄일 가치가 있으면 줄인다(근거를 숫자로 남긴다) | ✓ VERIFIED | `public/fonts/PretendardVariable.subset.woff2` 존재, 파일 크기 449,284 bytes — 08-MEASUREMENTS.md 표2가 보고한 448,384(08-04 시점)와 사실상 일치(이후 마감 문서 갱신분 900 bytes 차이). `src/lib/fonts.ts`가 이 서브셋 파일을 `next/font/local`로 로드하도록 실제 배선됨(직접 읽음). `node scripts/check-font-glyph-coverage.mjs` 이 세션 재실행 exit 0("콘텐츠 유니크 문자 976개가 서브셋 cmap에 전부 있습니다"). `08-FONT-DECISION.md`가 임계값 대조(76.36% ≥ 30%, 2,057,688 bytes ≥ 512,000 bytes)와 서브셋 전후 수치(76.36%→41.50%)를 기록 |
| 3 | SC3: 폰(375px)에서 6종 화면이 "좁아서 참고 쓰는" 게 아니라 실제로 편하게 읽힌다 | ✓ VERIFIED | 자동 측정: 08-MEASUREMENTS.md 표4, 위반 총계 212건→120건(43.4% 감소), M1(터치 타깃)은 처음부터 0건, `/schedule`의 M2(줄바꿈) 최대 위반(30건)이 완전 해소(0건). `src/components/site-nav.tsx`에 640px 미만 햄버거 패널 구현 확인(코드 직접 열람, `640` 분기 로직 존재). **실기기 UAT 완료**: 08-08-SUMMARY.md에 사용자가 아이패드 세로/가로 + 폰 실기기에서 6종 화면 가독성을 포함해 확인하고 "승인"으로 회신했다고 기록 — 이는 이 Phase의 사람 검증 채널이 이미 완결된 것이며 재차 human_needed로 에스컬레이션할 항목이 아니다 |
| 4 | SC4: 기존 게이트가 전부 통과하고, 성능 회귀를 잡는 자동 게이트가 하나 추가된다 | ✓ VERIFIED | 신규 게이트 4종(`check-route-rendering.mjs`, `check-font-glyph-coverage.mjs`, `e2e-perf-budget.mjs`, `e2e-mobile-readability.mjs`) + 기존 16종 = `scripts/` 디렉터리에 정확히 20개 게이트 파일 확인(직접 `ls` 실행). 이 세션에서 자격 증명이 필요 없는 정적 게이트 10종(check-brand·check-design-tokens·check-manifest·check-progress-gates·check-route-rendering·check-font-glyph-coverage·check-lesson-structure·check-pace·check-progress-math·check-schedule) 전부 exit 0 직접 재실행 확인. 나머지 정적 게이트 2종(check-supabase-note/progress, 실 DB 자격 증명 필요)과 e2e 8종은 이 세션에서 `.env.local` 접근이 차단돼 재실행 불가 — 08-MEASUREMENTS.md 표5(20개 게이트 중 19개 exit 0, 유일한 비-0인 `e2e-mobile-readability`는 08-05가 이미 사람 판단으로 확정한 잔존 항목)를 08-08이 실 자격 증명 세션에서 직접 실행한 기록으로 채택한다 |
| 5 | SC5: 버튼·카드·토글에 눌림 감각이 있고, 로딩·빈·에러 상태가 각각 제 모습을 갖으며, 아이패드 스크롤·전환이 끊기지 않는다 | ✓ VERIFIED | `src/app/globals.css`에 `.card-interactive:active, .tap-feedback:active { transform: translateY(1px) scale(0.98); }` + `prefers-reduced-motion: reduce` 무력화 분기 직접 확인. `src/components/progress-skeleton.tsx`(64줄)·`src/components/progress-error.tsx`(40줄) 존재·실질적 구현 확인(스텁 아님). `src/components/section-tape.tsx`에 `requestAnimationFrame` 기반 스크롤 스로틀 확인(코드 직접 열람, `addEventListener("scroll", ..., {passive:true})` + rAF 배칭). 프레임 예산 1.43%(08-MEASUREMENTS.md 표3)는 이 세션에서 재현하려면 실 자격 증명 프로덕션 빌드가 필요해 직접 재실행하지 못했으나 코드 근거(G22 게이트가 유일한 스크롤 리스너의 rAF 스로틀을 상시 검사)와 일치. **실기기 UAT**가 완료 토글·스크롤·전환을 포함해 결함 없이 승인됐다(08-08-SUMMARY.md) |

**Score:** 5/5 truths verified (0 present-but-behavior-unverified)

### 코드 리뷰 발견 사항 — Advisory (블로커 아님)

`08-REVIEW.md`(status: `issues_found`, Critical 0 / Warning 5 / Info 2)를 직접 읽고 가장
심각한 항목(WR-01)을 코드로 재확인했다:

- **WR-01 재확인:** `src/components/progress-provider.tsx:75-99`의 `refresh()`가 즉시
  `status: "loading"`으로 되돌리는 것을 직접 확인(77번 줄). `src/components/lesson-notepad.tsx:96-103`의
  cleanup이 `clearTimeout`만 하고 `flush()`를 호출하지 않는 것도 직접 확인(리뷰 보고와 일치). 이
  경로는 완료 버튼을 누른 직후 메모장이 스켈레톤으로 교체(언마운트)되면서 디바운스 대기 중인
  저장 요청이 조용히 버려질 수 있는 이론적 경로다. 다만 브라우저의 표준 blur-먼저-click
  이벤트 순서(`onBlur={() => void flush()}`, lesson-notepad.tsx:205)가 통상적 상호작용에서
  실제 데이터 손실을 가리는 것도 코드로 확인했다.
- 실기기 UAT(08-08 Task 3)가 정확히 이 상호작용(완료 토글 → 메모장)을 포함해 결함 없이
  승인했으므로, 이 항목은 **이번 Phase 완료 판정을 막는 gap이 아니라 advisory 항목**으로
  분류한다 — 08-REVIEW.md가 이미 정확히 그렇게(Warning, not Critical) 분류했다. 다음 milestone
  또는 후속 quick task에서 `flush()` on-unmount 보강을 고려할 것을 권고한다(리뷰가 제시한 두
  수정안 중 하나).
- WR-02(`.ts` 파일 미스캔, 현재는 실제 노출 문자열 없음 확인됨)·WR-03(햄버거 패널 Escape/바깥
  클릭 닫기 없음)·WR-04(주석 오기)·WR-05(자정 넘김 시 D-day 미갱신) 모두 Warning/Info 등급이며
  Phase 목표("잘 다듬어진 제품처럼 느껴진다")를 실기기 승인이 이미 확인한 상태에서 이 4건이
  체감을 뒤집을 근거는 없다 — 다음 정리 사이클 후보로만 남긴다.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `public/fonts/PretendardVariable.subset.woff2` | 서브셋 폰트, ~448KB | ✓ VERIFIED | 449,284 bytes 실측(직접 `ls -la`) |
| `src/lib/fonts.ts` | 서브셋 파일을 가리키는 `next/font/local` 설정 | ✓ VERIFIED | 소스 직접 확인, `src: "../../public/fonts/PretendardVariable.subset.woff2"` |
| `src/app/lesson/[lessonId]/page.tsx`, `src/app/step/[stepId]/page.tsx`, `src/app/curriculum/page.tsx` | `force-dynamic` 제거 + `generateStaticParams` | ✓ VERIFIED | grep 직접 확인, force-dynamic 없음(lesson/step는 generateStaticParams 보유, curriculum도 동적 마커 없음) |
| `src/app/page.tsx`, `src/app/schedule/page.tsx` | `force-dynamic` 유지 (의도된 결정) | ✓ VERIFIED | grep 직접 확인 |
| `src/app/api/progress/route.ts` | 진도 아일랜드 fetch 엔드포인트 | ✓ VERIFIED | 파일 존재 확인 |
| `src/components/progress-provider.tsx`, `-slots.tsx`, `-skeleton.tsx`, `-error.tsx` | 진도 아일랜드 클라이언트 레이어 | ✓ VERIFIED | 전부 실질 구현(스텁 아님), 직접 읽음 |
| `scripts/check-route-rendering.mjs`, `e2e-perf-budget.mjs`, `check-font-glyph-coverage.mjs`, `e2e-mobile-readability.mjs` | 신규 게이트 4종 | ✓ VERIFIED | 파일 존재(120~420줄, 스텁 아님), 자격증명 불필요한 2종(route-rendering, font-glyph-coverage) 이 세션에서 직접 실행해 exit 0 확인 |
| `src/app/globals.css` `.tap-feedback`/`.card-interactive:active` | 눌림 피드백 CSS | ✓ VERIFIED | 소스 직접 확인, `prefers-reduced-motion` 예외 포함 |
| `src/components/section-tape.tsx` | rAF 스로틀 스크롤 리스너 | ✓ VERIFIED | `requestAnimationFrame` + `passive: true` 확인 |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `complete-button.tsx` / `progress-error.tsx` | `ProgressProvider.refresh()` | `onToggled`/`onRetry` 콜백 | ✓ WIRED | 08-REVIEW.md WR-01이 라인 단위로 확인, 이 세션에서 `progress-provider.tsx` 소스로 재확인 |
| `lesson/[lessonId]/page.tsx` | `GET /api/progress` | 클라이언트 아일랜드 `fetch` (마운트 시) | ✓ WIRED | `progress-provider.tsx:79-81`에서 직접 확인 |
| `site-nav.tsx` | 640px 미만 햄버거 패널 | 조건부 렌더/`hidden` 클래스 | ✓ WIRED | 소스 직접 확인, quick task 260827-g6u 커밋 이력과 일치 |
| `subset-font.mjs` | `PretendardVariable.subset.woff2` | 빌드 시 생성, `fonts.ts`가 참조 | ✓ WIRED | 서브셋 파일 실재 + `fonts.ts` 참조 확인 |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| 정적 게이트 10종(자격증명 불필요) 재실행 | `node scripts/check-{brand,design-tokens,manifest,progress-gates,route-rendering,font-glyph-coverage,lesson-structure,pace,progress-math,schedule}.mjs` | 전부 exit 0 | ✓ PASS |
| ESLint로 pre-existing 결함 확인 | `npx eslint src/components/schedule-table.tsx` | 190행 `react-hooks/immutability` 에러 1건, `git show 5396e9a` 대조 시 Phase 8 이전부터 동일 코드 존재 확인 | ✓ PASS (deferred-items.md 주장과 일치, Phase 8 결함 아님 확인) |
| 커밋 이력 검증 | `git log`/`git show 20cc21d`, `git log 1b41687..f1d6caa` | 폰트 서브셋 재생성 커밋과 quick-g6u 4커밋 전부 실재 확인 | ✓ PASS |
| 실 `.env.local` 필요 게이트(check-supabase-note/progress, 8종 e2e) 재실행 | — | 이 세션에서 `.env*` 파일 접근이 권한상 차단됨(`ls .env*` 명령 자체가 거부됨) | ? SKIP — 08-08-SUMMARY.md·08-MEASUREMENTS.md가 실 자격 증명 세션에서 실행한 기록을 1차 출처로 채택 |

### Requirements Coverage

Phase 8은 확정 REQ ID가 없어(ROADMAP TBD) SC1~SC5를 요구사항 단위로 사용한다(Phase 6 선례,
위 "요구사항 추적성 관찰" 참고). PLAN들이 인용한 기존 ID(TRACK-01~04, PLAT-02/03, UX-01~03,
SCHED-02/04, CONV-02)는 이미 이전 Phase에서 Complete로 확정된 것을 이 Phase가 심화하는
관계이며, REQUIREMENTS.md 갱신 대상이 아니다.

| SC | Description | Status | Evidence |
|---|---|---|---|
| SC1 | 정적 라우트 수준 TTFB + 진도 정확성 | ✓ SATISFIED | 위 Truth #1 |
| SC2 | 폰트 전송량 측정 + 판단 근거 + 축소 | ✓ SATISFIED | 위 Truth #2 |
| SC3 | 폰 375px 실사용 가독성 | ✓ SATISFIED | 위 Truth #3 (실기기 승인 포함) |
| SC4 | 기존 게이트 통과 + 신규 회귀 게이트 | ✓ SATISFIED | 위 Truth #4 |
| SC5 | 눌림 감각 + 상태 UI + 스크롤 무끊김 | ✓ SATISFIED | 위 Truth #5 (WR-01 advisory 첨부) |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `src/components/schedule-table.tsx` | 190 | `seenTodayAnchor` 재할당(ESLint `react-hooks/immutability`) | ℹ️ Info (Phase 8 이전부터 존재, 미변경 확인) | Phase 8 범위 밖, deferred-items.md에 이미 기록됨 — 재보고 대상 아님 |
| `src/components/lesson-notepad.tsx` | 96-103 | 언마운트 cleanup이 `flush()`를 호출하지 않음(디바운스 저장 유실 이론적 경로) | ⚠️ Warning (08-REVIEW.md WR-01) | 실사용 시 blur-먼저-click 순서로 은폐됨, 실기기 UAT가 이 경로 포함 확인 후 승인 — 다음 정리 사이클 권고 |

이 외 `TBD`/`FIXME`/`XXX` 등 미해결 부채 마커는 이 Phase가 만든 파일(08-REVIEW.md
`files_reviewed_list` 39개 + 신규 게이트 스크립트) 전체에서 발견되지 않았다.

### Human Verification Required

없음. 이 Phase가 요구하는 유일한 사람 판단 항목(SC3의 "실제로 편하게 읽힌다", SC5의 "아이패드
스크롤·전환이 끊기지 않는다")은 08-08 Task 3의 아이패드/폰 실기기 UAT로 이미 완결됐고
("승인", 결함 0건, 08-08-SUMMARY.md에 기록) — 재차 에스컬레이션할 대상이 아니다.

### Gaps Summary

Gap 없음. Phase 8의 5개 성공 기준(SC1~SC5)이 코드 근거(정적 전환 마커, 폰트 서브셋 파일,
눌림 피드백 CSS, rAF 스로틀, 진도 아일랜드 배선)와 이미 완결된 실기기 UAT 승인으로 모두
충족됨을 확인했다. 코드 리뷰가 남긴 Warning 5건(가장 주목할 것은 WR-01, 메모장 언마운트
시 미저장 편집 유실 이론적 경로)은 Critical이 아니며 실기기 승인 범위 안에서 결함으로
드러나지 않았다 — 다음 정리 사이클의 advisory 항목으로 남긴다. 이 세션은 `.env.local`
접근이 차단돼 실 Supabase 자격 증명이 필요한 8개 e2e 게이트와 정적 게이트 2종을 직접
재실행하지 못했으나, 08-08이 실 자격 증명 세션에서 실행한 기록(08-MEASUREMENTS.md 표5)과
이 세션에서 독립 확인한 정적 게이트 10종·파일 산출물·git 커밋 이력이 서로 일치해 신뢰할 수
있는 근거로 채택했다.

---

*Verified: 2026-08-27*
*Verifier: Claude (gsd-verifier)*
