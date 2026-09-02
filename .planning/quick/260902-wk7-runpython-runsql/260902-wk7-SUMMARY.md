---
phase: quick-260902-wk7
plan: 01
subsystem: ui
tags: [react, textarea-overlay, ime, accessibility, pyodide, pglite]

requires: []
provides:
  - "TraceEditor 공유 컴포넌트(고스트 코드 오버레이 + 스크롤 미러링 + 줄 일치 계산)"
  - "RunPython/RunSQL의 view/edit/trace 3모드 유니언 구조"
  - "globals.css .trace-overlay/.trace-guide/.trace-input 토큰 쌍"
affects: [코드 실행 블록이 있는 레슨 전체(1-3, 1-4, 2-1 등)]

actuals:
  tokens: 4479
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "mode: 'view' | 'edit' | 'trace' 유니언으로 상호 배타 모드를 구조적으로 보장"
    - "두 겹 절대 위치 오버레이(투명 입력 위 흐린 안내)는 CSS 그룹 셀렉터로 텍스트 메트릭을 강제 동기화"
    - "controlled textarea(순수 value/onChange, onKeyDown 재작성 없음)로 한국어 IME 보존"

key-files:
  created:
    - src/components/trace-editor.tsx
  modified:
    - src/app/globals.css
    - src/components/run-python.tsx
    - src/components/run-sql.tsx

key-decisions:
  - "기존 isEditing 불리언을 mode 유니언으로 교체 — 두 모드가 동시에 참이 되는 버그를 타입 레벨에서 차단"
  - ".code-editor를 재사용하지 않고 .trace-overlay/.trace-guide/.trace-input을 신설 — 배경 투명성·리사이즈 금지·pre/textarea 기본 메트릭 차이 세 가지 이유로 별도 클래스가 필요"
  - "일치 판정은 줄 끝 공백만 무시(줄 중간 공백·들여쓰기는 그대로 채점)"

patterns-established:
  - "고스트 오버레이 정렬 불변식: .trace-guide와 .trace-input은 반드시 같은 그룹 셀렉터로 텍스트 메트릭(font/size/line-height/tab-size/white-space/padding/box-sizing)을 선언한다 — 개별 선언 금지"

requirements-completed: [QUICK-260902-wk7]

coverage:
  - id: D1
    description: "RunPython·RunSQL 두 블록에 '따라 치기' 버튼과 고스트 오버레이 입력면이 나타난다"
    requirement: "QUICK-260902-wk7"
    verification:
      - kind: unit
        ref: "npx tsc --noEmit"
        status: pass
      - kind: unit
        ref: "node scripts/check-design-tokens.mjs (globals.css + trace-editor.tsx + run-python.tsx + run-sql.tsx)"
        status: pass
    human_judgment: true
    rationale: "오버레이 정렬·스크롤 미러링·한국어 IME·44px 터치 타깃 실측은 브라우저·아이패드 실기기에서만 검증 가능 — 플랜 범위 밖(오케스트레이터 담당)"
  - id: D2
    description: "'N/M줄 일치' 실시간 갱신 및 '완성!' aria-live 알림"
    requirement: "QUICK-260902-wk7"
    verification:
      - kind: unit
        ref: "npx tsc --noEmit (countMatchingLines 타입 검증)"
        status: pass
    human_judgment: true
    rationale: "실시간 갱신 체감·aria-live 스크린리더 동작은 브라우저 UAT 대상 — 플랜 범위 밖"
  - id: D3
    description: "기존 고쳐 보기 모드·실행 계약에 회귀 없음(e2e-code-run/e2e-sql-run)"
    requirement: "QUICK-260902-wk7"
    verification:
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-code-run.mjs"
        status: unknown
      - kind: e2e
        ref: "node --env-file=.env.local scripts/e2e-sql-run.mjs"
        status: unknown
    human_judgment: true
    rationale: "e2e 게이트는 로컬 dev 서버·Supabase 접속이 필요해 실행자 권한 밖 — 오케스트레이터가 실행"

duration: 약 15분
completed: 2026-09-02
status: complete
---

# Quick Task 260902-wk7: RunPython/RunSQL 따라 치기(고스트 코드 오버레이) Summary

**RunPython·RunSQL 두 실행 블록에 손으로 코드를 재생성하는 세 번째 모드("따라 치기")를 추가 — 공유 TraceEditor 컴포넌트가 흐린 원본 위에 투명 입력면을 절대 위치로 겹치고, 스크롤 미러링과 줄 단위 일치 판정(aria-live)을 제공한다.**

## Performance

- **Duration:** 약 15분
- **Tasks:** 3/3 완료
- **Files modified:** 4 (1개 신규 생성 + 3개 수정)

## Accomplishments

- globals.css에 `.trace-overlay`/`.trace-guide`/`.trace-input` 클래스 쌍 신설 — 라이트·다크 모두, 두 겹이 동일 텍스트 메트릭(font-family·size·line-height·tab-size·white-space·padding·box-sizing)을 그룹 셀렉터로 공유해 정렬 불변식을 강제
- `TraceEditor` 공유 컴포넌트 신설 — controlled guide/value/onChange/ariaLabel API, `countMatchingLines` 순수 함수(줄 끝 공백만 무시), scrollTop/scrollLeft 미러링(onScroll + 값 변경 후 rAF), aria-live 'N/M줄 일치'/'완성!' 상태줄
- `run-python.tsx`·`run-sql.tsx`에 `mode: 'view' | 'edit' | 'trace'` 유니언 배선 — 기존 `isEditing` 불리언을 대체해 두 모드 동시 참 버그를 구조적으로 차단, "따라 치기" 버튼 추가, "원래대로"가 edit·trace 양쪽에서 노출되도록 조건 확장, 실행은 모드별 소스(`editedCode`/`tracedCode`/추출된 원본)를 그대로 실행

## Task Commits

1. **Task 1: globals.css에 따라 치기 오버레이 클래스 쌍 신설** - `17b98f2` (feat)
2. **Task 2: 공유 TraceEditor 컴포넌트 신설** - `c42d9f4` (feat)
3. **Task 3: run-python.tsx·run-sql.tsx에 따라 치기 모드 배선** - `72499ef` (feat)

_TDD 아님(일반 auto 태스크) — 각 커밋은 파일 스코프 단위로 원자적._

## Files Created/Modified

- `src/app/globals.css` - `.trace-overlay`/`.trace-guide`/`.trace-input` 클래스 쌍(라이트+다크), `.code-editor` 바로 뒤 삽입
- `src/components/trace-editor.tsx` (신규) - 고스트 오버레이 렌더·스크롤 미러링·줄 일치 계산을 담은 공유 컴포넌트
- `src/components/run-python.tsx` - `isEditing` → `mode` 유니언 전환, `handleTraceClick` 추가, TraceEditor 배선
- `src/components/run-sql.tsx` - 동일 구조 변경(ariaLabel만 "따라 친 SQL"로 다름)

## Decisions Made

- 기존 `isEditing` 불리언을 `mode: 'view' | 'edit' | 'trace'` 유니언으로 교체 — 두 불리언이 동시에 참이 되는 버그를 타입 레벨에서 차단(플랜 지시 그대로)
- `.code-editor`를 재사용하지 않고 별도 클래스 쌍 신설 — 투명 배경 필요·리사이즈 금지·pre/textarea 기본 메트릭 차이라는 세 가지 구조적 이유(플랜 주석 그대로 globals.css에 기록)
- 강조 표시(완성!)는 새 유틸리티 클래스를 만들지 않고 기존 `text-foreground`/`font-semibold` 조합으로 처리 — 다른 컴포넌트(site-nav, bookmark-button 등)에서 이미 쓰는 패턴 재사용

## Deviations from Plan

None - plan executed exactly as written. 세 태스크 모두 플랜의 액션 지시를 그대로 구현했다.

## Issues Encountered

**`npm run lint`가 이 플랜과 무관한 `site-nav.tsx`의 사전 존재 오류(2건, `react-hooks/set-state-in-effect`)로 실패한다.** `git stash`로 확인한 결과 이번 quick task의 어떤 커밋 이전에도 동일하게 재현되며, `site-nav.tsx`는 이번 세 태스크 어디에서도 건드리지 않았다. 스코프 경계 규칙에 따라 자동 수리하지 않고 `.planning/quick/260902-wk7-runpython-runsql/deferred-items.md`에 기록만 했다. 이 플랜이 실제로 건드린 파일들(`globals.css`, `trace-editor.tsx`, `run-python.tsx`, `run-sql.tsx`)에 대해서는 `npx tsc --noEmit`·`node scripts/check-brand.mjs`·`node scripts/check-design-tokens.mjs`·`npm run build`가 전부 통과했다.

## Known Stubs

None - 스텁 없음. `guideCode`/`tracedCode`는 실제 추출된 원본·학습자 입력을 그대로 사용하며 하드코딩된 빈 값이 UI에 고정 렌더되지 않는다.

## Threat Flags

None - 플랜의 threat_model이 이미 두 항목(T-wk7-01 tampering, T-wk7-02 information disclosure)을 accept로 판정했고, 구현이 그 경계를 벗어나지 않는다(새 네트워크 엔드포인트·인증 경로·스키마 변경 없음).

## User Setup Required

None - 외부 서비스 설정 불필요. 순수 클라이언트 UI 변경이며 npm 패키지 신규 설치도 없다.

## Next Phase Readiness

- tsc·check-brand·check-design-tokens·build 게이트 전부 통과, 코드 변경은 커밋 완료(17b98f2, c42d9f4, 72499ef)
- 오케스트레이터가 처리할 잔여 작업: 아이패드 세로·가로 실측(오버레이 정렬·스크롤 동기·한국어 IME 조합·44px 터치 타깃), `e2e-code-run.mjs`·`e2e-sql-run.mjs` 회귀 게이트 실행, STATE.md 갱신, git push
- `npm run lint`의 site-nav.tsx 사전 결함(본 플랜과 무관)은 별도 처리 필요 — `deferred-items.md` 참고

## Self-Check: PASSED

- FOUND: src/components/trace-editor.tsx
- FOUND: src/app/globals.css
- FOUND: 17b98f2 (Task 1 commit)
- FOUND: c42d9f4 (Task 2 commit)
- FOUND: 72499ef (Task 3 commit)

---
*Phase: quick-260902-wk7*
*Completed: 2026-09-02*
