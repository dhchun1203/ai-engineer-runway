---
phase: 08-performance-and-mobile
plan: 04
subsystem: infra
tags: [fonts, woff2, subset-font, harfbuzz, performance, next-font-local]

# Dependency graph
requires:
  - phase: 08-performance-and-mobile
    provides: "08-01의 e2e-perf-budget.mjs(첫 방문 전송 바이트 측정)와 check-font-glyph-coverage.mjs(서브셋 커버리지 게이트, 08-01에서는 skip 상태)"
provides:
  - "측정 기반 폰트 서브셋 여부 판단 기록(.planning/phases/08-performance-and-mobile/08-FONT-DECISION.md) — D8-B 임계값과의 대조 근거"
  - "재사용 가능한 폰트 서브셋 생성 스크립트(scripts/subset-font.mjs) — 콘텐츠 재스캔만으로 재실행 가능"
  - "활성화된 글리프 커버리지 상시 게이트(check-font-glyph-coverage.mjs가 이제 skip이 아니라 실검사)"
  - "축소된 프로덕션 폰트 자산(448,384 bytes, 원본 대비 78.21% 감소)"
affects: [08-05, 08-06, 08-07, 08-08]

# Actuals (#2632)
actuals:
  tokens: 5928
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added:
    - "subset-font@2.5.0 (devDependency) — HarfBuzz WASM 기반 폰트 서브셋 생성기, postinstall 스크립트 없음"
  patterns:
    - "폰트 문자 집합 = 실측(소스 직접 스캔, 앱 코드 import 없음) ∪ 표준 문자표(KS X 1001) ∪ ASCII ∪ 프로젝트 상용 기호 — 콘텐츠가 늘어도 커버리지 게이트가 깨지지 않도록 여유를 둔 합집합 전략"
    - "1차 자료 교차검증: 표준 문자표를 기억으로 재현하지 않고 권위 있는 출처(Unicode.org 공식 매핑 테이블)에서 fetch해 코드포인트 단위로 diff 검증 — 검증 불가능한 재현은 이 플랜이 막으려는 결함과 같은 종류이기 때문"

key-files:
  created:
    - .planning/phases/08-performance-and-mobile/08-FONT-DECISION.md
    - scripts/subset-font.mjs
    - public/fonts/PretendardVariable.subset.woff2
    - assets/fonts/PretendardVariable.woff2
  modified:
    - src/lib/fonts.ts
    - package.json
    - package-lock.json

key-decisions:
  - "D8-B 임계값 두 조건(30% 이상 또는 단독 500KB 이상) 모두 참(76.36%, 2,057,688 bytes) — 서브셋 진행으로 확정"
  - "KS X 1001 완성형 한글 2,350자를 기억으로 손으로 옮기지 않고 Unicode.org 공식 매핑 테이블(KSX1001.TXT)에서 fetch해 'HANGUL SYLLABLE' 주석이 붙은 행만 필터링 — 정확히 2,350행이 나와 표준값과 일치함을 확인했고, 완성된 문자열 상수를 코드포인트 단위로 원본과 diff해 0 missing/0 extra를 교차검증했다. 최초 시도(현대 한글 11,172자 전체 포함)는 서브셋이 겨우 15% 줄어(로드맵 기대치 200~400KB에 크게 못 미침) 폐기했다"
  - "variationAxes 옵션을 생략해 subset-font 호출 — 가변 축(weight 45~920) 전체를 보존, font-weight:700 강조가 서브셋 후에도 굵어지도록 유지"
  - "원본 풀세트를 public/fonts/에서 assets/fonts/로 git mv — 서빙 경로 밖으로 빼되 서브셋 생성 입력으로는 보존(D8-K)"

patterns-established:
  - "scripts/subset-font.mjs: 빌드 파이프라인 밖 수동 1회 실행 준비 스크립트. 정합성은 check-font-glyph-coverage.mjs가 상시 담당 — 재실행 시점은 콘텐츠가 크게 늘거나 커버리지 게이트가 새 문자 누락을 보고했을 때뿐"

requirements-completed: [SC2, SC4, UX-03]

coverage:
  - id: D1
    description: "첫 방문 폰트 전송 바이트가 측정되고 D8-B 임계값(30% 이상 또는 단독 500KB 이상)과 대조되어 서브셋 진행 여부가 명시적 결론(진행/미진행)으로 기록된다"
    requirement: "SC2"
    verification:
      - kind: other
        ref: "node scripts/e2e-perf-budget.mjs 실행 — 총 2,694,858 bytes, 폰트 2,057,688 bytes, 76.36% (두 조건 모두 참) → 08-FONT-DECISION.md에 기록"
        status: pass
    human_judgment: false
  - id: D2
    description: "서브셋 폰트가 생성되어 원본보다 작고(448,384 < 2,057,688 bytes), public/fonts/에 풀세트 원본이 더 이상 없으며, 원본은 assets/fonts/에 무손상 보존된다"
    requirement: "SC2"
    verification:
      - kind: other
        ref: "node scripts/subset-font.mjs && node -e 'fs.statSync 크기 비교' — subset 448,384 < original 2,057,688, public/fonts/PretendardVariable.woff2 부재 확인, assets/fonts/PretendardVariable.woff2 = 2,057,688 bytes(원본 그대로) 확인"
        status: pass
    human_judgment: false
  - id: D3
    description: "글리프 커버리지 게이트가 skip이 아니라 실검사로 전환되어 콘텐츠 유니크 문자 전부를 커버함을 확인하고, 누락 문자를 정확히 보고하며 실패하는 음성 경로도 검증된다"
    requirement: "SC2"
    verification:
      - kind: other
        ref: "node scripts/check-font-glyph-coverage.mjs — 콘텐츠 유니크 문자 961개 전부 커버, 통과. 한자(漢, U+6F22) 1자를 레슨에 임시 주입 후 재실행 — U+6F22를 정확히 보고하며 실패(exit 1), 검사 후 원복해 git diff 0 확인"
        status: pass
    human_judgment: false
  - id: D4
    description: "서브셋 후 재측정한 첫 방문 전송량이 서브셋 전보다 작고, 타이포·모바일 가로 오버플로 회귀 게이트가 모두 통과한다"
    requirement: "SC2"
    verification:
      - kind: e2e
        ref: "node scripts/e2e-perf-budget.mjs(서브셋 후) — 총 1,080,563 bytes(-59.90%), 폰트 448,384 bytes(-78.21%), 폰트 비중 76.36%→41.50%"
        status: pass
      - kind: e2e
        ref: "node scripts/e2e-typography.mjs — 크기 5+1종/굵기 3종 허용 집합 밖 값 없음(98개 요소)"
        status: pass
      - kind: e2e
        ref: "node scripts/e2e-mobile-overflow.mjs — 375/768/1024 세 뷰포트 × 7개 라우트 = 21개 조합 전부 가로 오버플로 0"
        status: pass
    human_judgment: false

duration: 약 45분
completed: 2026-08-27
status: complete
---

# Phase 8 Plan 4: 폰트 서브셋 Summary

**측정(76.36% 폰트 비중, D8-B 임계값 초과) → subset-font(HarfBuzz WASM)로 Pretendard 서브셋 생성(2,057,688 → 448,384 bytes, -78.21%) → 글리프 커버리지 게이트 활성화 → 재측정으로 회귀 없음 확인**

## Performance

- **Duration:** 약 45분
- **Completed:** 2026-08-27 (UTC)
- **Tasks:** 3/3
- **Files modified:** 7 (신규 4, 수정 3)

## Accomplishments

- **측정이 서브셋을 게이트했다** — `e2e-perf-budget.mjs`를 재실행해 `/lesson/1-1-course-orientation` 첫 방문 기준 총 전송 2,694,858 bytes 중 폰트가 2,057,688 bytes(76.36%)임을 확인. D8-B 임계값(30% 이상 또는 단독 500KB 이상) 두 조건 모두 참으로 판정되어 서브셋 진행이 결정됐다. 08-01의 기준선(76.29%)과 거의 일치해 08-02·08-03의 정적 전환이 폰트 전송 구성에 실질적 영향을 주지 않았음도 확인했다.
- **KS X 1001 완성형 2,350자를 1차 자료로 검증했다** — 처음에는 안전하게 현대 한글 음절 전체(U+AC00~U+D7A3, 11,172자)를 계산식으로 포함하려 했으나, 실행 결과 서브셋이 겨우 15.45% 밖에 줄지 않아(1,739,856 bytes) 로드맵이 기대한 200~400KB 수준에 크게 못 미쳤다. 표준 문자표를 기억으로 재현하는 대신 Unicode.org의 공식 매핑 테이블(`KSX1001.TXT`)을 이 세션에서 직접 fetch해 "HANGUL SYLLABLE" 주석이 붙은 행만 필터링했고, 정확히 2,350행이 나와 표준값과 일치함을 확인했다. 완성된 문자열 상수를 코드포인트 단위로 원본과 diff해 0 missing/0 extra까지 교차검증한 뒤 스크립트에 반영했다.
- **`scripts/subset-font.mjs`를 신설했다** — 콘텐츠 소스(레슨 MDX, `modules.ts`, 모든 `.tsx`, `docs/*.md`)를 앱 코드 import 없이 직접 스캔해 실측 문자 961개를 얻고, 여기에 KS X 1001 완성형 2,350자·ASCII 출력 가능 문자·프로젝트 상용 기호 17개를 합집합(최종 2,469개)해 `subset-font`(HarfBuzz WASM)로 서브셋을 생성한다. `variationAxes` 옵션을 생략해 가변 축(weight 45~920)을 통째로 보존했다.
- **원본 풀세트를 서빙 경로 밖으로 옮겼다** — `public/fonts/PretendardVariable.woff2`(2,057,688 bytes)를 `git mv`로 `assets/fonts/`로 이동(D8-K). `src/lib/fonts.ts`의 `localFont({ src })` 경로만 서브셋 파일로 교체.
- **커버리지 게이트가 실검사로 전환됐다** — 08-01이 skip 상태로 만들어둔 `check-font-glyph-coverage.mjs`가 이제 콘텐츠 유니크 문자 961개 전부가 서브셋 cmap에 있음을 확인하며 통과한다. 한자 1자(漢, U+6F22)를 레슨에 임시 주입해 게이트가 정확히 그 문자를 보고하며 실패하는 음성 경로도 확인했다.
- **서브셋 후 재측정으로 회귀 없음을 확인했다** — 첫 방문 총 전송 바이트가 1,080,563 bytes(-59.90%)로, 폰트 바이트가 448,384 bytes(-78.21%)로 줄었고 폰트 비중은 76.36%→41.50%가 됐다. `e2e-typography.mjs`(크기·굵기 허용 집합)와 `e2e-mobile-overflow.mjs`(375·768·1024 세 뷰포트 × 7라우트 = 21조합)가 전부 통과해 가변 축 보존이 실제로 레이아웃 회귀를 막았음을 확인했다.

## Task Commits

Each task was committed atomically:

1. **Task 1: 첫 방문 폰트 전송량 측정 + D8-B 임계값 대조 → 판단 기록** - `e540126` (feat)
2. **Task 2: 서브셋 생성 스크립트 + 폰트 교체** - `c731bb7` (feat)
3. **Task 3: 서브셋 후 재측정 + 타이포·레이아웃 회귀 확인** - `9365514` (docs)

## Files Created/Modified

- `.planning/phases/08-performance-and-mobile/08-FONT-DECISION.md` - 측정값·D8-B 대조·전후 비교표·회귀 확인 기록
- `scripts/subset-font.mjs` - 콘텐츠 스캔 + KS X 1001 2,350자 + ASCII + 상용 기호로 서브셋 생성(빌드 파이프라인 밖, 수동 1회)
- `public/fonts/PretendardVariable.subset.woff2` - 생성된 서브셋 폰트(448,384 bytes, 커밋 대상)
- `assets/fonts/PretendardVariable.woff2` - `public/`에서 이동한 원본 풀세트(2,057,688 bytes, 서빙 대상 아님)
- `src/lib/fonts.ts` - `localFont({ src })` 경로를 서브셋 파일로 교체(variable/weight/display 불변)
- `package.json`, `package-lock.json` - `subset-font@2.5.0` devDependency 추가

## Decisions Made

- **D8-B 임계값 두 조건 모두 참 → 서브셋 진행.** 폰트 비중 76.36%(임계값 30%의 2.5배 초과), 폰트 단독 2,057,688 bytes(임계값 500KB 초과).
- **KS X 1001 완성형 2,350자를 1차 자료(Unicode.org KSX1001.TXT)에서 fetch로 확보, 코드포인트 diff로 교차검증.** 최초 시도인 현대 한글 11,172자 전체 포함 방식은 서브셋이 15.45%만 줄어(1,739,856 bytes) 로드맵 기대치(200~400KB)에 크게 못 미쳐 폐기했다.
- **`variationAxes` 옵션 생략** — subset-font 문서에 따르면 명시하지 않은 축은 그대로 유지되므로, weight 45~920 전체 가변 범위를 보존해 `font-weight: 700` 강조가 서브셋 후에도 굵어지도록 했다.
- **원본을 `assets/fonts/`로 이동(D8-K)** — `public/` 아래 파일은 전부 배포 산출물에 오르므로, 서브셋 생성 입력으로만 필요한 2MB 원본을 서빙 경로 밖으로 뺐다. 삭제하지 않고 보존해 재가역적이다.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 최초 서브셋 문자 집합 선택이 기대 크기를 크게 벗어남**
- **Found during:** Task 2 (서브셋 생성 직후 검증 — 감소율이 15.45%로 로드맵 기대치 200~400KB에 크게 못 미침을 발견)
- **Issue:** D8-J가 요구하는 "KS X 1001 완성형 한글 2,350자"를 정확히 재현할 방법이 마땅치 않아, 대신 안전한 상위집합으로 현대 한글 음절 전체(U+AC00~U+D7A3, 11,172자)를 계산식으로 생성해 넣었다. 결과 서브셋이 1,739,856 bytes(15.45% 감소)에 그쳐, D8-J의 의도(대폭 축소)를 충족하지 못했다.
- **Fix:** Unicode.org 공식 매핑 테이블(`https://www.unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/KSC/KSX1001.TXT`)을 이 세션에서 직접 fetch해 "HANGUL SYLLABLE" 주석이 붙은 행만 필터링 — 정확히 2,350행이 나와 KS X 1001 표준값과 일치함을 확인했다. 완성된 문자열 상수를 코드포인트 집합으로 변환해 원본 fetch 데이터와 diff한 결과 0 missing/0 extra로 완전 일치함을 별도로 검증한 뒤 `scripts/subset-font.mjs`에 반영했다.
- **Files modified:** `scripts/subset-font.mjs`
- **Verification:** 재생성한 서브셋이 448,384 bytes(78.21% 감소, 로드맵 기대치 200~400KB에 근접), `check-font-glyph-coverage.mjs` 통과(961개 문자 전부 커버).
- **Committed in:** `c731bb7` (Task 2 커밋에 포함 — 커밋 전에 발견·수정해 최종본만 커밋됨)

---

**Total deviations:** 1 auto-fixed (Rule 1 - 버그, 커밋 전 자체 검증 과정에서 발견·수정)
**Impact on plan:** D8-J가 요구한 안전망의 문자 그대로의 부분집합을 정확한 1차 자료로 충족했다. 스코프 확장 없음.

## Issues Encountered

- **이 워크트리에 `.env.local`이 없고, `.env*` 파일은 이 세션의 권한 설정상 읽기/쓰기가 모두 차단되어 있었다** — 08-01-SUMMARY.md와 동일한 제약. `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`UNLOCK_SECRET`을 쉘 인라인 더미 값(실제 자격 증명 아님)으로 주입해 `next build`/`next start`/`e2e-*.mjs`를 실행했다. `hasUnlockCookie()`가 쿠키 없이는 항상 `false`를 반환하므로 이 경로에서 Supabase 쿼리 자체가 호출되지 않아, 측정된 TTFB·전송 바이트·프레임·타이포·오버플로 숫자 자체는 자격 증명의 진위와 무관하게 유효하다. 다만 실제 배포 자격 증명으로 한 번 더 재확인하는 것을 권장한다(08-01 SUMMARY와 동일한 권고).
- **이 워크트리에 `node_modules`가 없었다(fresh worktree)** — `npm install`로 기존 의존성을 복원하고 `npx playwright install chromium`으로 브라우저를 준비했다.

## User Setup Required

None - 이 플랜이 추가한 유일한 신규 npm 패키지(`subset-font`)는 08-RESEARCH.md § Package Legitimacy Audit에서 이미 verdict `OK`/Approved로 확인됐고, 설치 로그에 `postinstall` 스크립트 실행이 없음을 확인했다. 외부 서비스 설정 추가 없음. 다만 08-01·08-04 모두가 남긴 권고대로, 다음에 이 게이트들을 정식으로 재실행할 때는 실제 `.env.local`로 `node --env-file=.env.local scripts/e2e-perf-budget.mjs` 등을 한 번 더 돌려 진짜 프로덕션 자격 증명 기준으로 재확인하는 것을 권장한다.

## Next Phase Readiness

- SC2가 숫자로 닫혔다 — 측정했고, 임계값과 대조했고, 판단(서브셋 진행)대로 처리했고, 결과를 다시 측정했고, 타이포·레이아웃 회귀가 없음을 확인했다.
- 글리프 커버리지 게이트가 상설로 동작한다 — 앞으로 레슨 콘텐츠가 늘어나면서 서브셋에 없는 문자가 들어가면 `check-font-glyph-coverage.mjs`가 즉시 잡는다.
- 08-08(전후 비교)이 참고할 폰트 축소 숫자가 확정됐다 — 2,057,688 → 448,384 bytes(-78.21%), 첫 방문 총 전송 2,694,858 → 1,080,563 bytes(-59.90%).
- 블로커 없음. 병렬로 실행 중인 08-02(정적 전환 트레이서)와 파일 충돌 없이 완료됐다(이 플랜은 `src/lib/fonts.ts`, `scripts/subset-font.mjs`, 폰트 자산만 건드림).

## Self-Check: PASSED

All created files verified present on disk; all three task commit hashes (e540126, c731bb7, 9365514) confirmed in git log.

---
*Phase: 08-performance-and-mobile*
*Completed: 2026-08-27*
