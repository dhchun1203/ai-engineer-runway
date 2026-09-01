---
phase: quick-260901-r9t
plan: 01
subsystem: content
tags: [velite, glossary, curriculum-helpers, next-static, korean-sort]

requires:
  - phase: 01-platform
    provides: velite lessons collection, curriculum-helpers.ts 헬퍼, modules.ts
provides:
  - "velite.config.ts parseTermTable(content) — 용어 표 파서, lessons.terms 필드"
  - "curriculum-helpers.ts getAllTerms() — word 완전일치 그룹핑 + ㄱㄴㄷ/A-Z 섹션"
  - "/glossary 완전 정적 페이지 (247개 정의, 214개 용어 그룹)"
  - "site-nav.tsx 5번째 항목(용어집)"
  - "check-route-rendering.mjs /glossary 정적 계약 등록"
affects: [round2-h-review, glossary-followups]

actuals:
  tokens: 4140
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "velite transform 2번째 인자 { meta }로 meta.content(레슨 원문)에 접근해 본문 파싱 — frontmatter 이관 불필요"
    - "파서-게이트 이중 구현에 상호참조 주석(velite.config.ts ↔ check-lesson-structure.mjs L5)"
    - "word 완전일치 그룹핑으로 다의어 정의 배열 보존(병합 금지)"

key-files:
  created:
    - src/app/glossary/page.tsx
  modified:
    - velite.config.ts
    - scripts/check-lesson-structure.mjs
    - src/content/curriculum-helpers.ts
    - src/components/site-nav.tsx
    - scripts/check-route-rendering.mjs

key-decisions:
  - "meta.content가 string|undefined로 추론되는 tsc 오류를 ?? '' 가드로 수정(Task 1 파서의 타입 버그, Task 2 tsc 검증 중 발견)"
  - "check-glossary.mjs 별도 게이트 미생성 — velite throw + L5 + check-route-rendering 3중이 이미 충분(플래너 결정 그대로 실행)"
  - "글로서리 페이지는 .prose 미사용 — 구조화 데이터라 panel/chip 컴포넌트 클래스 직접 조합, @tailwindcss/typography 다크박스 함정 원천 회피"

patterns-established:
  - "완전 정적 페이지는 curriculum/step 페이지처럼 ProgressProvider 없이 panel/panel-hero/chip만으로 구성 가능"

requirements-completed: [round2-j-glossary]

coverage:
  - id: D1
    description: "/glossary 페이지가 열리고 전 35편 레슨의 247개 정의(214개 용어 그룹)가 섹션별로 나열된다"
    requirement: round2-j-glossary
    verification:
      - kind: e2e
        ref: "agent-browser: http://100.89.68.120:3411/glossary 실측, 총 214개/247개 헤더 텍스트 확인"
        status: pass
    human_judgment: false
  - id: D2
    description: "라틴 시작 용어는 A–Z 섹션에, 한글 시작 용어는 ㄱㄴㄷ(초성) 섹션에 배치된다"
    requirement: round2-j-glossary
    verification:
      - kind: e2e
        ref: "agent-browser: 점프 인덱스 스냅샷(ㄱ~ㅎ, A~W) + A/ㅎ 섹션 스크린샷 실측"
        status: pass
    human_judgment: false
  - id: D3
    description: "같은 단어의 여러 정의가 자동 병합되지 않고 그룹(정의 목록)으로 보존된다"
    requirement: round2-j-glossary
    verification:
      - kind: e2e
        ref: "agent-browser read 덤프: 회귀(4개 정의, 4개 출처 레슨), 형식 통과율(2개), 환경변수(3개) 그룹 확인"
        status: pass
    human_judgment: false
  - id: D4
    description: "각 정의에 출처 레슨 역링크(레슨 permalink 최상단)가 붙어 이동할 수 있다"
    requirement: round2-j-glossary
    verification:
      - kind: e2e
        ref: "agent-browser click: '분류·회귀·군집 모델 이해' 칩 클릭 → /lesson/1-5-ml-model-types 이동 확인"
        status: pass
    human_judgment: false
  - id: D5
    description: "내비게이션(데스크톱·폰)에서 /glossary로 진입할 수 있다"
    requirement: round2-j-glossary
    verification:
      - kind: e2e
        ref: "agent-browser snapshot: NAV_ITEMS에 '용어집' 링크 확인(데스크톱·폰 햄버거 동일 배열 순회)"
        status: pass
    human_judgment: false
  - id: D6
    description: "빌드 시 어떤 레슨의 용어 표를 파싱하지 못하면(0개) 빌드가 throw로 실패한다"
    requirement: round2-j-glossary
    verification:
      - kind: unit
        ref: "node -e 검증 스크립트: terms 총합 247, 각 hasContent 레슨 5~8개 확인(0건 시 throw 코드 경로는 정적 코드 리뷰로 확인, 실제 파손 표 없어 트리거 안 됨)"
        status: pass
    human_judgment: false
  - id: D7
    description: "/glossary가 완전 정적으로 프리렌더되고 check-route-rendering 게이트에 등록된다"
    requirement: round2-j-glossary
    verification:
      - kind: integration
        ref: "npx next build 실측(/glossary = ○ Static) + node scripts/check-route-rendering.mjs 통과"
        status: pass
    human_judgment: false
  - id: D8
    description: "라이트·다크 모드 모두 결함 없이 렌더된다(다크박스 회귀 없음)"
    requirement: round2-j-glossary
    verification:
      - kind: e2e
        ref: "agent-browser --color-scheme light/dark 스크린샷 6장(상단·ㅎ섹션·A섹션 각 2모드)"
        status: pass
    human_judgment: false

duration: 약 40분
completed: 2026-09-01
status: complete
---

# Quick Task 260901-r9t: /glossary 용어집 페이지 Summary

**velite 빌드타임 용어 표 파서 + word-완전일치 그룹핑 헬퍼 + 완전 정적 /glossary 페이지 — 전 35편 247개 정의를 ㄱㄴㄷ·A-Z 섹션과 다의어 그룹(회귀 4정의, 환경변수 3정의)으로 노출**

## Performance

- **Duration:** 약 40분
- **Tasks:** 3/3 완료
- **Files modified:** 5 modified + 1 created (velite.config.ts, scripts/check-lesson-structure.mjs, src/content/curriculum-helpers.ts, src/components/site-nav.tsx, scripts/check-route-rendering.mjs, src/app/glossary/page.tsx)

## Accomplishments

- velite.config.ts에 parseTermTable(content) 이식 — L5(check-lesson-structure.mjs)의 라벨/헤더/구분행/데이터행 로직을 추출용으로 재구현, 파싱 0개 시 throw로 빌드 실패
- lessons transform에 terms 필드 추가(hasContent:false는 terms: [] 유지) — 실측 35편 전체 247개 용어 정확히 파싱
- curriculum-helpers.ts getAllTerms() — word 완전일치 그룹핑(다의어 정의 배열 보존, 병합·중복제거 없음), ㄱㄴㄷ 초성 19버킷·A-Z 26버킷 분리·정렬
- src/app/glossary/page.tsx — 완전 정적 단일 페이지(ProgressProvider 없음), .prose 미사용(panel/chip 컴포넌트 클래스 조합), 점프 인덱스 + 출처 레슨 역링크 칩
- site-nav.tsx NAV_ITEMS에 '용어집' 추가(데스크톱·폰 햄버거 동시 반영)
- check-route-rendering.mjs EXPECTED_STATIC_ROUTES에 /glossary 등록, next build 실측 ○(Static) 확인

## Task Commits

Each task was committed atomically:

1. **Task 1: velite terms 파서(L5 이식) + 스키마 terms 필드 + 게이트 상호참조 주석** - `22eadba` (feat)
2. **Task 2: getAllTerms() 헬퍼 + /glossary 정적 페이지 + 내비 링크** - `a07814f` (feat)
3. **Task 3: /glossary 라우트 게이트 등록 + 정적 프리렌더 및 회귀 확인** - `abd165e` (feat)

_Plan metadata commit skipped per constraints — orchestrator handles docs commit._

## Files Created/Modified

- `velite.config.ts` - parseTermTable(content) 함수 + lessons transform terms 필드(hasContent 스텁은 [])
- `scripts/check-lesson-structure.mjs` - L5(checkTermTable) 위에 parseTermTable 상호참조 주석
- `src/content/curriculum-helpers.ts` - TermSource/TermDefinition/TermGroup/GlossarySection/Glossary 타입 + getAllTerms()
- `src/app/glossary/page.tsx` - 완전 정적 용어집 페이지(점프 인덱스 + 섹션 + 그룹 + 역링크)
- `src/components/site-nav.tsx` - NAV_ITEMS에 '용어집'(/glossary) 추가, D-09 주석 갱신
- `scripts/check-route-rendering.mjs` - EXPECTED_STATIC_ROUTES에 /glossary 추가 + 목표 계약 주석 갱신

## Decisions Made

- meta.content가 `string | undefined`로 추론되는 tsc 오류를 `?? ''` 가드로 수정 — Task 1에서 만든 파서의 타입 결함을 Task 2의 `tsc --noEmit` 검증 중 발견해 즉시 수정(Rule 1)
- 별도 `check-glossary.mjs` 게이트를 만들지 않음 — 플랜에 명시된 플래너 결정을 그대로 따름(velite throw + L5 + check-route-rendering 3중 방어가 이미 충분, 총량 247 단언은 레슨 편집마다 흔들려 취약)
- 글로서리 페이지에 `.prose`를 쓰지 않음 — 구조화 데이터(용어·정의·출처)라 curriculum/step 페이지의 `.panel`/`.chip` 컴포넌트 클래스를 직접 조합, `@tailwindcss/typography` 기본 `pre`/`table` 다크 배경 라이트모드 누출 함정을 원천 회피

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] velite.config.ts meta.content 타입 가드 추가**
- **Found during:** Task 2 (`npx tsc --noEmit` 검증)
- **Issue:** Task 1에서 작성한 `parseTermTable(meta.content)` 호출이 velite 0.4 타입 상 `meta.content: string | undefined`로 추론돼 tsc 오류(TS2345) 발생
- **Fix:** `parseTermTable(meta.content ?? "")`로 가드 — 실제로 undefined가 오면 라벨 탐색 실패로 명확한 에러를 던져 빌드가 실패하므로 안전
- **Files modified:** velite.config.ts
- **Verification:** `npx tsc --noEmit` 0 에러, `velite build --clean` 통과(247개 용어 실측 유지)
- **Committed in:** a07814f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - 버그 수정)
**Impact on plan:** 파서 자체의 로직 변경 없음, 타입 안전성만 보강. 스코프 확장 없음.

## Issues Encountered

- 워크트리에 `node_modules`가 없어 `npm install --prefer-offline`로 설치 후 진행(빌드/게이트 실행을 위한 선행 조건, 32초 소요)
- 로컬 `.env.local`이 없어 `next build`가 `src/lib/supabase/admin.ts`의 module-level throw(SUPABASE_URL 누락)로 실패 — `.env*`는 gitignore 대상이라 파일 쓰기가 권한상 막혀 있었고, 대신 셸 환경변수(`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` placeholder 값)로 `next build` 실행 시에만 주입해 우회. 파일을 생성하지 않았으므로 워크트리에 아무 흔적도 남지 않음. `/` `/api/progress` 등은 이 태스크 범위 밖이라 Supabase 실연결 여부는 검증하지 않음
- agent-browser Chrome 세션이 `localhost`/`127.0.0.1`로 dev 서버에 접근 불가(`ERR_NAME_NOT_RESOLVED`, 별도 네트워크 네임스페이스로 추정) — 머신의 LAN IP(`100.89.68.120:3411`)로 우회해 정상 접속. `eval` 서브커맨드는 하네스가 셸 `eval`로 오인해 항상 차단되어, DOM 검증은 `agent-browser read`(렌더 텍스트 덤프) + 스크린샷 조합으로 대체
- 테마 토글 버튼 클릭이 이 헤드리스 세션에서 `localStorage` 접근 제약으로 상태를 바꾸지 못함(라벨이 계속 "자동"으로 고정) — `--color-scheme light/dark` CDP 에뮬레이션 플래그로 우회해 두 모드 모두 스크린샷 확보

## User Setup Required

None - no external service configuration required. (로컬 `next build` 검증용 placeholder Supabase 환경변수는 셸 세션에만 존재했고 파일로 저장하지 않았음 — 실제 프로덕션 배포는 기존 Vercel 환경변수를 그대로 사용)

## Next Phase Readiness

- `/glossary`는 즉시 사용 가능(정적 프리렌더, 내비 진입점 확보)
- 남은 후보는 여전히 `.planning/research/edu-sites/FINAL-REPORT.md`(round2-h V2, `/review/[module]` 등) — round2-j의 `/review/[module]` 부분(권장 경로 4)은 이번 태스크 범위 밖이라 미착수
- 다의어 그룹 표시가 실제 데이터(회귀 4정의, 환경변수 3정의, 형식 통과율 2정의)로 검증됨 — 후속 레슨 추가 시에도 word 완전일치 그루핑이 자동으로 반영됨(수동 갱신 불필요)

---
*Phase: quick-260901-r9t*
*Completed: 2026-09-01*

## Self-Check: PASSED

- FOUND: velite.config.ts, scripts/check-lesson-structure.mjs, src/content/curriculum-helpers.ts, src/app/glossary/page.tsx, src/components/site-nav.tsx, scripts/check-route-rendering.mjs, .planning/quick/260901-r9t-glossary-247-a-z/260901-r9t-SUMMARY.md
- FOUND commits: 22eadba, a07814f, abd165e
