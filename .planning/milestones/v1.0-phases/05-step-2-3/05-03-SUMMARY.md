---
phase: 05-step-2-3
plan: 03
subsystem: content
tags: [mdx, velite, lesson-content, step-2, shiki]

# Dependency graph
requires:
  - phase: 05-step-2-3
    provides: "심화 형식 확정 골격(2-3-react-components.mdx) — 6단 헤딩·해보기·정답 블록·단어 표 (05-01)"
provides:
  - "2-2 모듈 2편 완성 — HTML·CSS·JavaScript 핵심, 브라우저 동작 원리와 UI 구현"
  - "html/css/javascript 신규 펜스 언어가 실제 콘텐츠에서 첫 사용됨"
affects: [05-step-2-3 Plan 07 (매니페스트 실측 갱신)]

# Actuals (#2632)
actuals:
  tokens: 5254
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "설치 없이 브라우저와 파일 하나로 완결되는 Step 2 예제 패턴(D-74) — shop-card.html, shop-list.html"
    - "html/css/javascript 세 신규 펜스 언어를 한 레슨 안에서 전체 문서 + 부분 발췌(css/javascript)로 나눠 설명하는 방식"
    - "외부 API 대신 상수 배열 + setTimeout 지연으로 비동기(async/await)를 오프라인 안전하게 실습"

key-files:
  created: []
  modified:
    - src/content/lessons/step-2/2-2-html-css-js.mdx
    - src/content/lessons/step-2/2-2-browser-and-ui.mdx

key-decisions:
  - "프론트매터 hasContent 외 필드 무변경 확인 — git diff로 검증"
  - "acceptance criteria의 `/language-html/` 형태 검증 명령이 실제 rehype-pretty-code 출력 형식(`data-language:\"html\"` 속성, `language-html` 클래스 아님)과 불일치함을 발견 — 실제 패턴으로 재검증해 폴백 없이 정상 하이라이팅됨을 확인 (Deviations 참고)"

requirements-completed: [CONT-05]

coverage:
  - id: D1
    description: "2-2-html-css-js.mdx — HTML/CSS/JavaScript 핵심을 심화 형식으로 집필, shop-card.html 단일 파일 예제(flex 배치 + 좋아요 카운터)"
    requirement: "CONT-05"
    verification:
      - kind: automated_ui
        ref: "node scripts/check-lesson-structure.mjs + npm run build + node scripts/check-brand.mjs"
        status: pass
    human_judgment: false
  - id: D2
    description: "2-2-browser-and-ui.mdx — 브라우저 렌더링 파이프라인과 비동기(이벤트 루프/Promise/async-await)를 심화 형식으로 집필, shop-list.html 단일 파일 예제(로딩 상태 + 지연 렌더)"
    requirement: "CONT-05"
    verification:
      - kind: automated_ui
        ref: "node scripts/check-lesson-structure.mjs + npm run build + node scripts/check-brand.mjs"
        status: pass
    human_judgment: false

duration: 약 9분 (23:16~23:25 KST, 2개 작업 커밋)
completed: 2026-08-26
status: complete
---

# Phase 5 Plan 3: 2-2 모듈 2편(HTML·CSS·JS 핵심, 브라우저 동작 원리와 UI) Summary

**설치 없이 `.html` 파일 하나로 완결되는 심화 레슨 2편을 집필해 Step 2의 2-2 모듈을 완성하고, html/css/javascript 신규 펜스 언어를 실제 콘텐츠에서 처음으로 실사용했다**

## Performance

- **Duration:** 약 9분 (2026-08-25 23:16~23:25 KST, 2개 작업 커밋)
- **Started:** 2026-08-25T15:16:27Z
- **Completed:** 2026-08-25T15:25:xxZ 무렵 (SUMMARY 작성 시점)
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- `2-2-html-css-js.mdx` — HTML(뼈대)·CSS(옷)·JavaScript(움직임) 비유로 개념을 설명하고, `shop-card.html` 단일 파일 예제(상품 카드 flex 배치 + 좋아요 클릭 카운터)로 실습을 완결했다. 3개 해보기(카드 3개 가로 배치, 좋아요 10 초과 시 문구 전환, CSS 변수 추출) + 스스로 점검 2문항
- `2-2-browser-and-ui.mdx` — 주소 입력부터 페인트까지의 렌더링 파이프라인을 도식+표로, 이벤트 루프·비동기를 카운터 비유로 설명하고, `shop-list.html` 단일 파일 예제(로딩 문구 → `setTimeout` 지연 → 목록 렌더, 외부 API 미사용)로 실습을 완결했다. 3개 해보기(지연 시간 조정, `DocumentFragment` 배치 렌더 비교, `<script>` 위치 이동 관찰) + 스스로 점검 2문항
- 두 레슨 모두 D-74(Node·npm·TypeScript 설치는 `2-3-typescript-setup`이 담당)를 지켜 설치 안내 없이 브라우저와 VS Code만으로 완결된다
- `html`·`css`·`javascript` 신규 펜스 언어가 실제 콘텐츠에서 처음 사용되었고, Shiki가 정상적으로 하이라이팅했다(폴백 없음, 아래 Deviations 참고)

## Task Commits

Each task was committed atomically:

1. **Task 1: 2-2-html-css-js 집필** — `78f5c56` (feat)
2. **Task 2: 2-2-browser-and-ui 집필** — `91f732b` (feat)

**Plan metadata:** (이 커밋 — 05-03 plan 완료 기록은 orchestrator가 wave 종료 후 STATE.md/ROADMAP.md에 반영)

## Files Created/Modified

- `src/content/lessons/step-2/2-2-html-css-js.mdx` - 본문 신규 집필, `hasContent: false → true` (그 외 프론트매터 필드 무변경)
- `src/content/lessons/step-2/2-2-browser-and-ui.mdx` - 본문 신규 집필, `hasContent: false → true` (그 외 프론트매터 필드 무변경)

## Decisions Made

- 두 레슨의 실습 파일명을 각각 `shop-card.html`, `shop-list.html`로 확정(저장소 파일이 아니라 레슨 본문 안에서만 존재하는 실습 산출물명)
- `2-2-html-css-js`는 해보기 3개 + 정답 블록 5개(3+2), `2-2-browser-and-ui`도 동일하게 3개+5개 구성 — 두 레슨 모두 해보기 상한(3개)을 사용해 개념 3~4개를 각각 충분히 다뤘다
- 단어 표는 두 레슨 모두 7행으로 통일

## Deviations from Plan

### Finding (no code change required — plan's verification command was written against an incorrect assumption)

**1. `/language-{lang}/` 형태의 acceptance criteria 검증 명령이 실제 컴파일 산출물 형식과 다름**

- **발견 시점:** Task 1 완료 후 `node -e "...language-html...".test(p.code)"` 실행
- **증상:** 처음 실행한 검증 스크립트(`/language-html/`, `/language-css/`, `/language-javascript/` 정규식)가 모두 `false`를 반환해 통과 실패
- **원인 조사:** `.velite/lessons.json`의 `code` 필드를 직접 열어보니 `rehype-pretty-code`의 실제 출력은 CSS 클래스 `language-*`가 아니라 `data-language":"html"` 같은 속성 문자열이었다. `2-3-react-components.mdx`(승인된 파일럿)에서도 동일하게 `language-tsx` 클래스는 존재하지 않고 `data-language":"tsx"` 속성만 존재함을 확인 — 이는 이 프로젝트의 파이프라인 전반에 적용되는 산출물 형식이며, Plan 05-01이 이 세부사항을 검증하지 않은 채 acceptance criteria 문구를 작성한 것으로 보인다
- **조치:** 실제 패턴(`data-language":"html"`, `data-language":"css"`, `data-language":"javascript"`)으로 재검증했고, 세 언어 모두 `true`(정상 하이라이팅, 단색 폴백 아님)를 확인했다. 레슨 본문은 수정하지 않았다 — 콘텐츠 자체는 처음부터 올바르게 하이라이팅되고 있었고, 검증 명령의 표현만 실제 출력과 어긋났다
- **영향:** 없음 — 콘텐츠 결함이 아니라 계획 문서의 검증 스크립트 표현 오류였다. `flagged_assumptions`에 적힌 "폴백이 나오면 SUMMARY에 기록"은 해당하지 않는다(폴백이 아니라 정상 하이라이팅 확인)
- **후속 권고:** Plan 05-07(매니페스트 실측)이나 이후 Plan에서 유사한 `/language-*/` 검증을 다시 쓸 경우 `data-language":"..."` 패턴을 대신 쓸 것

---

**Total deviations:** 0 code deviations, 1 verification-command finding (documented, no fix required)
**Impact on plan:** 없음 — 두 레슨 모두 계획대로 실행됐고, 게이트 3종(`npm run build`, `check-lesson-structure`, `check-brand`)을 모두 통과했다

## Issues Encountered

- **워크트리에 `node_modules`가 설치되어 있지 않았다** — `npm run build`를 실행하기 전에 `npm ci`로 `package-lock.json` 기준 의존성을 설치했다. 새 패키지를 추가한 것이 아니라 이미 잠긴 의존성을 로컬에 설치한 것이므로 Rule 3 패키지 설치 제외 대상이 아니다
- **워크트리에 `.env.local`이 없어 `npm run build`가 `/step/[stepId]` 정적 생성 단계에서 SUPABASE_URL 누락 오류로 실패했다** — `.env.local`은 gitignore 대상(비밀값)이라 워크트리에 자동으로 복사되지 않는다. 메인 저장소의 `.env.local`을 워크트리로 복사해 로컬 빌드 검증만 가능하게 했다(커밋되지 않음, git status에도 나타나지 않음 — gitignore 대상). 이후 `npm run build`가 정상 통과했다

## User Setup Required

None - 외부 서비스 설정 불필요. 이 Plan 자체는 콘텐츠 파일만 변경했다.

## Next Phase Readiness

- **`check-manifest.mjs`는 이 Plan 이후에도 계획대로 red 상태를 유지한다** — `hasContent: true` 개수가 15개로 늘었고(이 Plan이 2건 전환), Plan 01이 설정한 상수(13)를 넘어섰다. **의도된 상태이며 이 Plan에서 상수를 손대지 않았다.** Wave 2 마감 Plan(D-78 기준 05-07 또는 그에 해당하는 Plan)이 wave 종료 후 실측으로 되돌린다
- 형제 Plan(02, 04, 05, 06)이 같은 wave에서 병렬로 다른 Step 2 레슨 파일을 집필 중이므로, 이 Plan은 자신이 소유한 두 파일 외에는 건드리지 않았다
- 블로커 없음

---
*Phase: 05-step-2-3*
*Completed: 2026-08-26*

## Self-Check: PASSED

Both files referenced in this SUMMARY exist on disk (`src/content/lessons/step-2/2-2-html-css-js.mdx`, `src/content/lessons/step-2/2-2-browser-and-ui.mdx`), and both execution commits (`78f5c56`, `91f732b`) are present in git history (`git log --oneline` on branch `worktree-agent-a732dcc1004aa14c1`).
