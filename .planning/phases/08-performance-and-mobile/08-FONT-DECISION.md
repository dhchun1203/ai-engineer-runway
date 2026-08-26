# Phase 8 Plan 4: 폰트 서브셋 여부 판단 기록 (D8-B)

이 문서는 "첫 방문 체감에 영향이 있는지 먼저 측정하고, 있을 때만 손댄다"는 ROADMAP 원칙에 따라
Task 1(측정 → 임계값 대조 → 판단)과 Task 3(서브셋 후 재측정 → 회귀 확인)의 결과를 함께 기록한다.
사람이 읽는 결정 기록이며 게이트가 아니다.

## 측정 방법

- 측정 대상 라우트: `/lesson/1-1-course-orientation` (실제 프로덕션 레슨 콘텐츠 페이지)
- 측정 도구: `scripts/e2e-perf-budget.mjs` (`next build && next start` 프로덕션 서버 부트스트랩)
- 측정 방식: 캐시 없는 새 Playwright 브라우저 컨텍스트로 첫 방문, `page.on('response', ...)`
  이벤트를 전부 합산해 총 전송 바이트와 `.woff2` 파일 합계를 계산
- 환경: 이 워크트리에는 `.env.local`(실제 Supabase 자격 증명)이 존재하지 않고, `.env*` 파일은
  이 세션의 권한 설정상 읽기/쓰기가 모두 차단되어 있다(08-01-SUMMARY.md와 동일한 제약). 08-01과
  같은 방식으로 인라인 더미 자격 증명(`SUPABASE_URL=https://dummy-test-project.supabase.co` 등,
  실제 자격 증명 아님)을 주입해 `next build`/`next start`를 통과시켰다. `hasUnlockCookie()`가
  쿠키 없이는 항상 `false`를 반환해 이 경로에서 Supabase 쿼리 자체가 호출되지 않으므로, 측정된
  TTFB·전송 바이트·프레임 숫자 자체는 자격 증명의 진위와 무관하게 유효하다.

## 서브셋 전 측정 (Task 1)

- 측정 일시: 2026-08-27 (이 워크트리에서 08-02·08-03 정적 전환 이후 재측정)
- 첫 방문 총 전송 바이트: **2,694,858 bytes**
- `.woff2` 폰트 합계 바이트: **2,057,688 bytes**
- 폰트 비중: **76.36%**
- 폰트 파일 디스크 크기(`fs.statSync` 실측): `public/fonts/PretendardVariable.woff2` = **2,057,688 bytes**

### D8-B 임계값 대조

| 조건 | 값 | 판정 |
|---|---|---|
| 전체 전송량의 30% 이상 | 76.36% | **참** |
| 폰트 단독 500KB(512,000 bytes) 이상 | 2,057,688 bytes | **참** |

### 결론

**서브셋 진행.** 두 조건 모두 참이며, 특히 폰트 비중이 임계값(30%)의 2.5배를 넘는 76.36%로
첫 방문 전송량의 절대다수를 차지한다. 08-01이 측정한 기준선(76.29%)과 이번 재측정(76.36%)이
거의 일치해 08-02·08-03의 정적 전환이 폰트 전송 구성에 실질적 영향을 주지 않았음도 확인했다.

## 서브셋 후 측정 (Task 3)

- 측정 일시: 2026-08-27 (Task 2 서브셋 생성·교체 직후)
- 첫 방문 총 전송 바이트: **{{AFTER_TOTAL_BYTES}} bytes**
- `.woff2` 폰트 합계 바이트: **{{AFTER_FONT_BYTES}} bytes**
- 폰트 비중: **{{AFTER_FONT_PERCENT}}%**
- 서브셋 폰트 디스크 크기: `public/fonts/PretendardVariable.subset.woff2` = **{{SUBSET_FILE_BYTES}} bytes**

### 전후 비교표

| 구분 | 총 전송 바이트 | 폰트 바이트 | 폰트 비중 |
|---|---|---|---|
| 서브셋 전 | 2,694,858 | 2,057,688 | 76.36% |
| 서브셋 후 | {{AFTER_TOTAL_BYTES}} | {{AFTER_FONT_BYTES}} | {{AFTER_FONT_PERCENT}}% |
| 감소량 | {{DELTA_TOTAL_BYTES}} bytes | {{DELTA_FONT_BYTES}} bytes ({{DELTA_FONT_PERCENT}}%) | — |

### 회귀 확인

- `node --env-file=.env.local scripts/e2e-typography.mjs`: {{TYPOGRAPHY_RESULT}}
- `node --env-file=.env.local scripts/e2e-mobile-overflow.mjs`(375·768·1024 세 뷰포트): {{MOBILE_OVERFLOW_RESULT}}
- `node scripts/check-font-glyph-coverage.mjs`: {{GLYPH_COVERAGE_RESULT}}

폰트 스택 폴백(`ui-sans-serif`, `system-ui`)은 그대로 둔다 — 서브셋에 없는 문자가 나오면 폴백이
그린다. 이 안전망이 있다는 것과 별개로 커버리지 게이트를 상시로 두는 이유는, 폴백 글꼴로 그려지면
본문 중간에 글꼴이 튀는 것이 눈에 띄는 결함이 되기 때문이다.
