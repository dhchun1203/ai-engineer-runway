---
phase: 04-step-1
plan: 01
subsystem: content
tags: [mdx, velite, shiki, rehype-pretty-code, tailwind-typography, eli5]

# Dependency graph
requires:
  - phase: 01-deployed-curriculum-skeleton
    provides: Velite 콘텐츠 파이프라인, 레슨 프론트매터 스키마, `/lesson/[lessonId]` 렌더 경로
provides:
  - "eli5 × 6단 집필 표준의 실증판 (`1-3-python-variables-and-types.mdx`) — Wave 2(04-02~06)가 그대로 복제할 골격"
  - "`scripts/check-lesson-structure.mjs` — Step 1 레슨 구조를 자동 검사하는 게이트, red 실증 완료"
  - "`.prose details/summary` CSS 표준 (터치 타깃 44px, 라이트·다크 쌍)"
  - "코드 블록 `pre`/`code` 배경·padding 불일치 수정 — Wave 2 전체 레슨에 그대로 적용되는 전역 CSS"
affects: [04-step-1 Wave 2 (04-02, 04-03, 04-04, 04-05, 04-06), phase-05-step-2-3]

actuals:
  tokens: 46000
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "eli5 × 6단 레슨 골격: 학습 목표 → 왜 배우나 → 개념 설명 → 실무 예제 → 실무 팁 → 핵심 정리 및 스스로 점검"
    - "`### 해보기` 과제 + `<details><summary>정답 보기</summary>` 접힌 정답 블록, 빈 줄 2개 규칙"
    - "용어는 첫 등장 시 '한글(English, 한 줄 풀이)' 형태로 병기, 이후 한글만"
    - "실행 안내는 `python` 대신 `py`(Windows 우선, D-58) + macOS `python3` 한 줄 병기"
    - "정규식 기반 구조 게이트(`.mdx` 원본 직접 읽기, `.velite/` 산출물 아님) — L1~L6 6개 검사"

key-files:
  created:
    - scripts/check-lesson-structure.mjs
  modified:
    - src/content/lessons/step-1/1-3-python-variables-and-types.mdx
    - src/app/globals.css

key-decisions:
  - "1-3 레슨 범위에 조건문·반복문을 포함한다 (Task 3 체크포인트 6번 (a) 선택, 사용자 수정 요청 없이 승인)"
  - "코드 블록 `pre`/`code` 배경 불일치·좌측 클리핑 수정 — `pre[data-theme=\" \"]` 규칙 추가, `pre` 좌우 padding 0 → 1rem"
  - "코드 블록 세로 padding 비대칭(52px/16px) 수정 — 복사 버튼을 padding 예약 대신 겹침 배치로 전환, `padding: 3.25rem 1rem 1rem 1rem` → `1rem 3.5rem 1rem 1rem`"
  - "구조 게이트는 Step 1만 검사하고 Step 2 파일럿(`2-3-react-components.mdx`, 구 표준)은 스코프에서 제외한다"

requirements-completed: [CONT-02, CONT-03]

coverage:
  - id: D1
    description: "파일럿 레슨이 eli5 × 6단 구조로 재작성되어 프로덕션에서 렌더된다 (조건문·반복문 범위 확장 포함)"
    requirement: "CONT-02"
    verification:
      - kind: automated_ui
        ref: "curl https://ai-engineer-runway.vercel.app/lesson/1-3-python-variables-and-types → 200, 본문에 '정답 보기' x6 포함"
        status: pass
      - kind: e2e
        ref: "npm run build && node scripts/check-manifest.mjs (13 invariants) && node scripts/check-brand.mjs (85개 파일, 위반 0)"
        status: pass
    human_judgment: true
    rationale: "eli5 톤이 실제로 읽히는지, 조건문·반복문 포함이 적절한지는 사람 판단 영역 — Task 3 체크포인트에서 사용자가 승인함"
  - id: D2
    description: "`### 해보기` 2~3개와 접힌 `<details>` 정답 블록이 아이패드 터치로 정상 렌더·펼쳐진다"
    requirement: "CONT-02"
    verification:
      - kind: automated_ui
        ref: "check-lesson-structure.mjs L2/L3/L4 (해보기 3개, details/summary 5쌍, 빈 줄 규칙 통과)"
        status: pass
    human_judgment: true
    rationale: "터치 타깃 크기·마크다운 서식이 실제 아이패드 화면에서 정상인지는 스크린샷/실기기 확인 없이 코드만으로 단정할 수 없음 — Task 3 체크포인트에서 승인됨"
  - id: D3
    description: "`powershell` 코드펜스가 색상 하이라이팅되어 렌더된다 (단색 폴백 아님)"
    requirement: "CONT-03"
    verification:
      - kind: unit
        ref: "node -e 스크립트로 .velite/lessons.json의 language-powershell 스팬 확인, --shiki-light 색 스팬 2개 이상"
        status: pass
    human_judgment: false
  - id: D4
    description: "Step 1 구조 게이트(`scripts/check-lesson-structure.mjs`)가 존재하고 실제로 red를 낼 수 있다"
    requirement: "CONT-02"
    verification:
      - kind: unit
        ref: "빈 줄 제거 시 exit 1(줄 번호 포함), 헤딩 삭제 시 exit 1, 원복 후 exit 0 — 3회 실증"
        status: pass
    human_judgment: false
  - id: D5
    description: "코드 블록 렌더 결함(배경 불일치, 세로 padding 비대칭) 수정이 프로덕션 다크모드에서 확인됐다"
    verification:
      - kind: automated_ui
        ref: "headless-browser computed style: light/dark pre==code 배경 일치, padding 16/16/16/56px, min-height 52px"
        status: pass
    human_judgment: true
    rationale: "사용자가 실제 아이패드 프로덕션 스크린샷으로 발견한 결함이라 최종 판단은 사람 눈 확인에 의존 — 오케스트레이터가 픽셀 측정으로 재확인함(174px→120px, 93px→33px)"

duration: 사용자 대기 포함 다회 dispatch (worktree 격리로 최종 continuation만 이 세션에서 실행)
completed: 2026-08-25
status: complete
---

# Phase 4 Plan 1: eli5 × 6단 집필 표준 파일럿 Summary

**Python 변수·자료형 레슨을 eli5 톤 6단 구조로 전면 재작성하고, 코드펜스·`<details>` 렌더 결함 2건을 프로덕션에서 실측 수정한 뒤, Step 1 구조 게이트(`scripts/check-lesson-structure.mjs`)를 신설해 red/green 실증까지 마쳤다. 아이패드 프로덕션 승인 완료.**

## Performance

- **Tasks:** 3/3 완료 (Task 1 tracer, Task 2 auto, Task 3 checkpoint:human-verify — 승인됨)
- **Commits:** 4 (Task 1, Task 2, 사용자 검토 후 수정 2건) + 이 문서 커밋
- **Files modified:** 3 (`1-3-python-variables-and-types.mdx`, `globals.css`, `check-lesson-structure.mjs` 신설)

## Accomplishments

- 파일럿 레슨(`1-3-python-variables-and-types`)이 eli5 × 6단 구조로 전면 재작성되어 프로덕션에 배포됨
- `curriculum.md` 1-3 첫 불릿의 네 주제(변수, 자료형, 조건문, 반복문)를 전부 다루도록 범위 확장 — 학습 목표 4항목, 개념 설명에 조건문/반복문 절 추가, 실무 예제 코드에 `if`/`elif`/`else` 3분기 + `for` 순회 포함
- `### 해보기` 3개 + `<details><summary>정답 보기</summary>` 접힌 정답 블록(빈 줄 2개 규칙 준수), 스스로 점검 2문항도 동일 형식
- `powershell` 코드펜스(`py variables.py`)가 실제 빌드에서 색상 하이라이팅됨을 확인 — 2색(주석 회색 + 본문)이나 단색 폴백은 아님
- `scripts/check-lesson-structure.mjs` 신설 — L1(헤딩)~L6(코드펜스 언어) 6개 검사, `.mdx` 원본을 직접 읽어 정규식으로 판정, red/green 3회 실증
- 프로덕션 배포 후 사용자가 아이패드 Safari로 확인하며 렌더 결함 2건을 발견 → 오케스트레이터가 즉시 수정·재배포·재확인
- Task 3 체크포인트 6항목 전부 승인 — 1-3 범위 결정은 (a) 현재처럼 이 레슨에 조건문·반복문 포함으로 확정

## Task Commits

1. **Task 1: 파일럿 레슨 eli5 재작성 + `<details>` prose 스타일** — `8f3c7ff` (feat) — 본문 전면 교체(프론트매터 8줄 불변), `.prose details/summary` CSS 신설
2. **Task 2: Step 1 구조 게이트 신설 + 언어 번들 확인 + 프로덕션 배포** — `e1340e9` (feat) — `scripts/check-lesson-structure.mjs` 신설, red/green 실증, `master` 푸시(오케스트레이터가 병합·배포 수행)
3. **사용자 검토 후 수정 1** — `e19e0cb` (fix) — 코드 블록 배경 불일치·좌측 클리핑
4. **사용자 검토 후 수정 2** — `a6d72e9` (fix) — 코드 블록 세로 padding 비대칭(2.6:1 → 1:1)

Task 3(checkpoint:human-verify)은 커밋을 생성하지 않는다 — 사용자가 프로덕션에서 확인 후 "승인" 응답으로 게이트를 통과시켰다.

**Plan metadata:** 이 커밋 (docs: complete plan)

_Note: 이 Plan은 `autonomous: false`로 작성됐으나 실제로는 worktree 병렬 executor(`agent-*` 브랜치)로 여러 차례 dispatch됐다 — 아래 Deviations 참고._

## Files Created/Modified

- `src/content/lessons/step-1/1-3-python-variables-and-types.mdx` — 본문 전면 교체, 프론트매터 8줄 바이트 단위 불변
- `src/app/globals.css` — `.prose details/summary` 규칙 신설(라이트+다크 쌍), `pre`/`code` 배경·padding 규칙 2건 수정
- `scripts/check-lesson-structure.mjs` — 신설, Step 1 레슨 구조 6개 검사(L1~L6)

## Decisions Made

- **1-3 범위에 조건문·반복문 포함 확정** — 커리큘럼 원문 불릿과 제목이 어긋나는 문제(RESEARCH Pitfall 1)를 이 레슨에 흡수하는 것으로 사용자 승인. Wave 2의 다른 어떤 레슨도 조건문·반복문을 다루지 않으므로 중복 없음.
- **구조 게이트는 원본 `.mdx`를 직접 읽는다** — `<details>` 마크업과 빈 줄 규칙은 컴파일된 `.velite/` 산출물에서는 확인할 수 없어서, `.velite/lessons.json` 대신 파일 시스템 정규식 검사로 설계.
- **구조 게이트는 Step 1만 검사** — Step 2 파일럿(`2-3-react-components.mdx`)은 구 표준으로 쓰였고 해보기·`<details>`가 없어 오탐이 나므로 스코프에서 제외.
- **코드펜스 언어 허용 목록**: `python`·`sql`·`bash`·`powershell`·`text` 접두사만 허용, 벌거벗은 펜스(언어 태그 없음)는 L6에서 오류.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 코드 블록 배경 불일치·좌측 클리핑**
- **Found during:** Task 3 체크포인트 — 사용자가 아이패드 프로덕션 화면에서 발견
- **Issue:** Shiki 배경색이 `code` 요소에만 적용되고 `pre`는 Tailwind Typography 기본 dark 배경을 유지 — padding 띠에 다른 색이 드러나 보임
- **Fix:** `pre[data-theme*=" "]` 셀렉터를 라이트/다크 규칙에 각각 추가, `pre` 좌우 padding을 0 → 1rem으로 변경(좌측 텍스트 클리핑 해소)
- **Files modified:** `src/app/globals.css`
- **Verification:** headless-browser 계산값 — light `pre` bg `rgb(255,255,255)` == `code` bg `rgb(255,255,255)`, dark `pre` bg `rgb(34,39,46)` == `code` bg `rgb(34,39,46)`
- **Committed in:** `e19e0cb`

**2. [Rule 1 - Bug] 코드 블록 세로 padding 비대칭(52px/16px, 비율 2.6:1)**
- **Found during:** Task 3 체크포인트 — 사용자가 아이패드 프로덕션 화면에서 발견
- **Issue:** 복사 버튼이 우상단에만 있는데 `padding-top`으로 전체 폭 세로 공간을 예약하던 방식이라 위아래 여백이 크게 어긋남
- **Fix:** 버튼 겹침 방식으로 전환 — `padding: 3.25rem 1rem 1rem 1rem` → `1rem 3.5rem 1rem 1rem`, `min-height: 4.5rem` → `3.25rem`
- **Files modified:** `src/app/globals.css`
- **Verification:** headless-browser 계산값 — 16px 상/16px 하/16px 좌/56px 우, min-height 52px, 복사 버튼(44x44) 블록 안에 완전히 포함. 오케스트레이터가 사용자 스크린샷 픽셀 측정으로 재확인: 블록 높이 174px→120px, 코드 위 여백 93px→33px, 코드 아래 여백 36px→34px, 비율 2.6:1 → 1:1
- **Committed in:** `a6d72e9`

---

**Total deviations:** 2 auto-fixed (Rule 1 — 둘 다 사용자가 프로덕션 화면에서 발견한 렌더 버그, 이 Plan의 CSS 변경 범위 안)
**Impact on plan:** 두 수정 모두 Task 1이 신설한 CSS 규칙의 실측 결함을 바로잡은 것으로 스코프 이탈 없음. Wave 2의 모든 레슨이 같은 `globals.css`를 공유하므로 이 수정은 9편 전체에 자동으로 적용된다.

### 구조적 편차 (Rule 해당 없음 — 실행 환경 불일치)

**Task 2의 `<precondition>`("현재 브랜치가 master이고 푸시 권한이 있다")이 worktree 격리 실행과 구조적으로 충돌했다.** 이 Plan은 `autonomous: false`로 단일 비병렬 실행을 전제로 작성됐으나, 실제로는 `agent-*` 네임스페이스의 worktree 병렬 executor로 여러 차례 dispatch됐다. Executor는 `agent-*` 브랜치에서 실행되며 `master`에 직접 푸시할 수 없다. Task 2의 게이트 신설·red/green 실증까지는 executor가 수행했고, `master` 병합과 `git push origin master` 배포는 오케스트레이터가 대신 수행했다(commit `792b8f5` "merge executor worktree"). Task 1 이후 사용자 검토 수정 2건도 같은 방식으로 오케스트레이터가 병합·배포했다. 이 Plan의 나머지 실행 경로(Task 1 작성, Task 2 게이트 로직·실증, Task 3 체크포인트 문구)는 계획대로 진행됐다.

## Issues Encountered

None beyond the two auto-fixed rendering bugs above — both were caught by the human-verify checkpoint exactly as designed (D-59's rationale for keeping Task 3 as the one human gate before Wave 2).

## Known Limitations

1. **`powershell` 코드펜스가 실질적으로 2색이다.** `py variables.py` 자체는 PowerShell 문법상 키워드가 없어 색이 붙지 않으므로 주석(회색)과 본문 두 색만 나온다. Task 1의 must_have("단색 폴백이 아니다")는 충족하지만, `python` 블록(5색)과 나란히 두면 밋밋해 보인다. 사용자에게 고지했고 승인 시점에 수정 요청은 없었다.
2. **`min-height: 3.25rem` 바닥값이 실측되지 않았다.** 이 페이지에는 1줄짜리 빈 코드 블록이 없어서, 버튼이 필요한 최소 높이(≈52px ≤ 52px)를 대수적으로만 확인했다. Wave 2 레슨 중 1줄 코드 블록이 나오면 실제로 드러난다 — 04-02~06 executor는 이 값을 주시할 것.
3. **두 렌더링 결함 모두 executor의 자체 점검(빌드·게이트 스크립트)을 통과한 뒤 사람이 프로덕션 화면을 보고서야 발견했다.** `check-lesson-structure.mjs`는 헤딩·개수·`<details>` 짝 같은 구조만 검사하고 시각적 렌더 결과는 검사하지 않는다 — Wave 2의 9편 병렬 집필 중에도 같은 종류의 시각 결함(배경·padding 불일치 등)은 자동으로 잡히지 않는다. 9편이 같은 `globals.css`를 재사용하므로 이번에 잡은 결함은 반복되지 않지만, 새로운 유형의 시각 결함은 여전히 사람 확인 없이는 드러나지 않는다.

## 승인된 집필 표준 (Wave 2 executor용)

이 파일럿(`src/content/lessons/step-1/1-3-python-variables-and-types.mdx`)이 승인된 표준의 유일한 정본이다. Wave 2(04-02~04-06)는 이 파일의 형태를 그대로 복제한다.

**6단 헤딩 (문자열 그대로, 이 순서, `##` 레벨 헤딩은 이 6개뿐):**
1. `## 1. 학습 목표`
2. `## 2. 왜 배우나`
3. `## 3. 개념 설명`
4. `## 4. 실무 예제`
5. `## 5. 실무 팁`
6. `## 6. 핵심 정리 및 스스로 점검`

**각 단의 형태:**
- ① 학습 목표 — "이 레슨을 마치면 다음을 할 수 있습니다." 뒤 관찰 가능한 동사형 결과 4개
- ② 왜 배우나 — 최대 4문장 1문단, 구 버전보다 짧게
- ③ 개념 설명 — `###` 소제목 3~4개, 각 앞에 이모지 1개, 비유 먼저·정의 나중, 용어는 첫 등장 시 "한글(English, 한 줄 풀이)"
- ④ 실무 예제 — 완결된 단일 `python` 코드펜스(파일명 주석 포함) → 실행 안내 `powershell` 펜스(`py 파일명.py`) → macOS 병기 한 줄 → 예상 출력 산문 2~3줄 → `### 해보기` **2~3개**, 각각 바로 아래 접힌 정답 블록
- ⑤ 실무 팁 — 불릿 3~4개, 각 2문장 이내
- ⑥ 핵심 정리 및 스스로 점검 — `**핵심 정리**` 요약 불릿 4~5개 → `**이 레슨의 단어**` 2열 표(`| 단어 | 뜻 |`, 데이터 행 **5~8개**) → `**스스로 점검**` 번호 매긴 질문 **2개**, 각각 아래 접힌 정답 블록

**정답 블록 형식 (필수, `<details>`·`### 해보기`·스스로 점검 모두 동일):**
```
<details>
<summary>정답 보기</summary>

(빈 줄 필수)
예상 출력/풀이
(빈 줄 필수)
</details>
```
`<summary>` 다음 줄과 `</details>` 이전 줄에 빈 줄이 없으면 CommonMark HTML-block 경계가 깨져 정답 안의 백틱·별표가 raw로 노출된다. `check-lesson-structure.mjs`의 L4가 이를 상시 검사한다.

**언어별 코드펜스:**
- Python 예제: ` ```python `
- 실행 안내: ` ```powershell ` (Windows 우선, `py 파일명.py` — `python 파일명.py`를 1차 안내로 쓰지 않는다. Windows 스토어 스텁 문제, RESEARCH Pitfall 2)
- `sql`/`bash`/`text`도 허용 목록에 있으나 이 파일럿에서는 미사용 — Plan 05(SQL)가 `sql` 사용을 처음 실증한다
- 벌거벗은 펜스(언어 태그 없음)는 게이트 L6에서 오류

**`sql`/`powershell` 언어 확인 결과:** Task 2에서 설치된 Shiki 번들에 `createHighlighter`로 두 언어를 로드해 `getLoadedLanguages()`로 확인 — `powershell`은 Task 1의 실제 빌드가 이미 증명했고, `sql`은 별칭 없이 `sql` 문자열 그대로 로드 성공. **Plan 05는 펜스 태그로 `sql`을 그대로 쓴다** (별칭 `postgres`/`ps1` 불필요).

**`scripts/check-lesson-structure.mjs`가 검사하는 6개 항목의 정확한 기대값:**
| 검사 | 기대값 |
|------|--------|
| L1 헤딩 | 위 6개 문자열이 정확히 1회씩, 파일 내 등장 순서 1→6 |
| L2 해보기 | `### 해보기` 줄 개수 2 이상 3 이하 |
| L3 정답 블록 짝 | `<details>` = `<summary>정답 보기</summary>` = `</details>` 개수 동일, 그 값 ≥ (L2 개수 + 2) |
| L4 빈 줄 규칙 | 모든 `<summary>` 다음 줄, 모든 `</details>` 이전 줄이 빈 줄 |
| L5 용어 표 | `**이 레슨의 단어**` 정확히 1회, 헤더 `| 단어 | 뜻 |` 일치, 데이터 행 5~8개 |
| L6 코드펜스 언어 | 모든 여는 펜스가 `python`/`sql`/`bash`/`powershell`/`text` 접두사 언어 태그를 가짐 |

검사 대상은 `src/content/lessons/step-1/*.mdx` 중 `hasContent: true`인 파일만이며, `.mdx` 원본을 직접 읽는다(`.velite/` 산출물 아님). `hasContent: true` 대상이 0개면 그 자체가 오류다.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 2(04-02 ~ 04-06)가 착수 가능 — eli5 × 6단 표준이 프로덕션·아이패드에서 실증·승인됐고, `scripts/check-lesson-structure.mjs`가 사람 검토 없이 9편을 게이트할 준비가 됐다
- `globals.css`의 코드 블록 수정 2건이 이미 반영돼 있어 Wave 2는 같은 결함을 반복하지 않는다
- 남은 리스크: `powershell` 2색 한계, `min-height` 바닥값 미실측 — 위 Known Limitations 참고
- Plan 07(종단 게이트)이 `check-manifest.mjs`의 `EXPECTED_HAS_CONTENT_COUNT`를 2 → 11로 올릴 때, 이 게이트가 신규 9편에서도 green이어야 한다

---
*Phase: 04-step-1*
*Completed: 2026-08-25*
