---
phase: 04-step-1
plan: 03
subsystem: content
tags: [mdx, git, github-pr, claude-api, anthropic-sdk, eli5]

requires:
  - phase: 04-step-1
    provides: "eli5 × 6단 집필 표준 (Plan 01 파일럿) — 이 Plan이 그대로 복제한 골격"
provides:
  - "`1-2-git-branch-and-pr.mdx` 본문 — clone→branch→commit→push→PR→merge→pull 한 바퀴"
  - "`1-2-generative-ai-basics.mdx` 본문 — Claude API 최소 호출 예제 + 키 없는 대체 경로"
affects: [04-07 (종단 게이트, check-manifest 상수 갱신 대상)]

actuals:
  tokens: 5082
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "eli5 × 6단 골격을 Plan 01 파일럿 그대로 복제(헤딩 문자열·순서·### 해보기 + <details> 정답 블록·용어 표 형식)"

key-files:
  modified:
    - src/content/lessons/step-1/1-2-git-branch-and-pr.mdx
    - src/content/lessons/step-1/1-2-generative-ai-basics.mdx

key-decisions:
  - "Claude API 예제 모델 ID는 claude-api 스킬로 집필 시점에 재확인해 `claude-opus-5`(날짜 접미사 없음)로 확정 — RESEARCH.md 기록값과 일치"
  - "Git 레슨의 연습용 저장소는 학습자가 1-1 레슨에서 만든 저장소를 그대로 쓰도록 일반화된 안내(`https://github.com/내계정/git-pr-practice.git`)로 처리 — 1-1 레슨의 정확한 저장소 이름에 의존하지 않음"

requirements-completed: [CONT-02, CONT-03]

coverage:
  - id: D1
    description: "1-2-git-branch-and-pr가 clone→branch→commit→push→PR→merge→pull 한 바퀴를 명령 순서대로 제공하고, 명령을 powershell 펜스에 담는다 (D-57, D-58)"
    requirement: "CONT-02"
    verification:
      - kind: unit
        ref: "node scripts/check-lesson-structure.mjs — L1~L6 6개 검사 통과(2개 hasContent:true 파일 대상 시점 기준 3개)"
        status: pass
      - kind: manual
        ref: "실행자가 scratchpad에서 git init→switch -c→commit→merge 흐름을 직접 실행해 명령 문법 오류 없음을 확인"
        status: pass
    human_judgment: false
  - id: D2
    description: "1-2-generative-ai-basics가 anthropic 공식 SDK 최소 호출 예제를 python 펜스로 제공하고, 키는 환경변수에서만 읽으며, 키 없는 학습자를 위한 채팅 UI 대체 경로를 함께 제공한다 (D-54)"
    requirement: "CONT-03"
    verification:
      - kind: unit
        ref: "grep 검사 — sk-ant- 0건, 40자+ 무의미 문자열 0건, api_key= 뒤 리터럴 없음, pip install anthropic 정확 일치, ollama/llama.cpp/lm studio/로컬 모델 0건"
        status: pass
      - kind: manual
        ref: "py -m py_compile claude_hello.py — exit 0 (API 키 없이 문법만 검증, 실제 호출은 키 미보유로 미실행)"
        status: pass
    human_judgment: false
  - id: D3
    description: "두 레슨 모두 6개 헤딩·### 해보기 2~3개·<details> 정답 블록·이 레슨의 단어 표(5~8행)를 갖고, hasContent만 true로 바뀌며 나머지 프론트매터 7필드는 불변이다 (D-13, D-47, D-49, D-50, D-61)"
    requirement: "CONT-02"
    verification:
      - kind: unit
        ref: "node scripts/check-lesson-structure.mjs 통과 + git diff로 프론트매터 hasContent 줄 외 무변경 확인"
        status: pass
    human_judgment: false
  - id: D4
    description: "node scripts/check-brand.mjs·npm run build가 성공한다"
    requirement: "CONT-02"
    verification:
      - kind: unit
        ref: "check-brand.mjs — 85개 파일 위반 0건 / npm run build — SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY를 build 시 inline env로 전달해 성공(플레이스홀더 값, .env 파일 미작성)"
        status: pass
    human_judgment: false

duration: 단일 세션
completed: 2026-08-25
status: complete
---

# Phase 4 Plan 3: Step 1 모듈 1-2 (Git 브랜치·PR / 생성형 AI) Summary

**Git clone→branch→commit→push→PR→merge→pull 한 바퀴 실습 레슨과, `anthropic` SDK 최소 호출 + 키 없는 대체 경로를 갖춘 생성형 AI 레슨 2편을 eli5 × 6단 표준으로 작성했다.**

## Performance

- **Tasks:** 2/2 완료
- **Commits:** 2 (Task 1, Task 2)
- **Files modified:** 2 (`1-2-git-branch-and-pr.mdx`, `1-2-generative-ai-basics.mdx`)

## Accomplishments

- `1-2-git-branch-and-pr.mdx`: 저장소·커밋·브랜치 개념(3열 비유 표), `clone → branch → commit → push → PR → merge → pull` 흐름 요약, 3단계 PowerShell 펜스로 나뉜 완결 실습 흐름(브랜치 생성 → 커밋·푸시 → GitHub 웹 PR·머지 → 로컬 동기화), 이 저장소의 실제 PR 프리뷰 배포 사실(`docs/making-of.md` 인용) 언급, `### 해보기` 3개(브랜치·PR·머지 실습, 두 번째 바퀴, `git log --oneline` 확인), 8행 용어 표
- `1-2-generative-ai-basics.mdx`: "아주 똑똑해진 자동완성" 비유로 할루시네이션 개념 도출, 프롬프트·토큰·모델 3열 표, "맡길 일과 검증할 일" 2열 표로 윤리를 판단 기준으로 제시, `claude_hello.py` 최소 호출 예제(환경변수 전용 키 관리, `claude-opus-5` 모델 ID, 모델 ID 변경 가능성 안내), 키 없는 학습자를 위한 채팅 UI 비교 대체 경로(해보기 이전 배치), `### 해보기` 3개(API/채팅 비교, 프롬프트 조건 추가, `max_tokens` 축소 관찰), 7행 용어 표
- 두 레슨 모두 `node scripts/check-lesson-structure.mjs`(6개 검사), `node scripts/check-brand.mjs`(85개 파일, 위반 0), `npm run build` 통과
- 실행자가 scratchpad에서 git 명령 흐름(init→branch→commit→merge)을 실제로 실행해 문법 오류 없음을 확인, `claude_hello.py`를 `py -m py_compile`로 문법 검증(exit 0)
- Claude API 모델 ID를 `claude-api` 스킬로 집필 시점에 재확인 — RESEARCH.md의 `claude-opus-5`와 일치, 날짜 접미사 없음 확인

## Task Commits

1. **Task 1: 1-2-git-branch-and-pr — 갈래를 뻗고 다시 합치는 한 바퀴** — `9d7533c` (feat) — 본문 신규 작성, `hasContent: false → true`, 나머지 프론트매터 7필드 불변
2. **Task 2: 1-2-generative-ai-basics — 코드로 한 번 불러 보는 생성형 AI** — `2840147` (feat) — 본문 신규 작성, `hasContent: false → true`, 나머지 프론트매터 7필드 불변

**Plan metadata:** 이 커밋 (docs: complete plan) — 오케스트레이터가 최종 커밋 수행

## Files Created/Modified

- `src/content/lessons/step-1/1-2-git-branch-and-pr.mdx` — 본문 신규 작성(179줄 추가), 프론트매터 `hasContent` 줄만 변경
- `src/content/lessons/step-1/1-2-generative-ai-basics.mdx` — 본문 신규 작성(163줄 추가), 프론트매터 `hasContent` 줄만 변경

## Decisions Made

- **모델 ID 재확인** — `claude-api` 스킬을 이 세션에서 호출해 현재 권장 기본 모델 ID(`claude-opus-5`, 날짜 접미사 없음)를 확인하고 RESEARCH.md 기록값과 대조 — 일치함을 확인 후 그대로 사용. 본문에 "최신 모델 ID는 공식 문서에서 확인" 안내를 병기해 모델 ID 폐기 리스크(Assumption A1)를 완화.
- **Git 연습용 저장소 안내를 일반화** — 1-1 레슨(다른 Wave 2 executor가 병렬 작성 중)이 만드는 연습용 저장소의 정확한 이름에 의존하지 않고, `https://github.com/내계정/git-pr-practice.git`처럼 학습자가 자신의 저장소 주소로 치환하는 자리표시자 형태로 안내. 병렬 실행 중인 다른 Plan의 산출물에 대한 하드 의존을 피하기 위한 선택.
- **PR 프리뷰 배포 사실 인용** — `docs/making-of.md`에서 "PR을 열면 미리보기 주소가 자동으로 생긴다"는 실제 기록을 확인 후 저장소 이름(`ai-engineer-runway`, 공개 정보)과 함께 1-2 레슨 개념 설명에 반영(D-16 결과 인용).

## Deviations from Plan

None - plan executed exactly as written. `npm ci`가 필요했던 것은 fresh worktree의 통상적인 환경 준비 단계였고(플랜 편차 아님), `npm run build`에 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` 플레이스홀더 값을 inline env로 전달한 것도 CLAUDE.md의 ".env 파일 미작성" 지시를 따른 표준 절차였다.

## Issues Encountered

None.

## Known Limitations

1. **Git 실습의 PR·머지 단계는 실측되지 않았다** — 실행자는 GitHub 웹 UI를 대신 클릭해 볼 수 없어, 로컬 git 명령(`git init`/`switch -c`/`commit`/`merge`)까지만 scratchpad에서 실제로 실행해 문법을 확인했다. PR 열기·머지 버튼 클릭 순서는 명령·화면 설명의 정확성에 의존한다(04-03-PLAN.md flagged_assumptions에 사전 고지된 한계).
2. **Claude API 예제는 실제 호출까지는 검증되지 않았다** — `py -m py_compile`로 문법만 확인했고, `ANTHROPIC_API_KEY`가 없어 실제 API 호출은 실행하지 않았다. 코드 형태(환경변수 읽기, `messages.create` 인자, `response.content` 순회)는 RESEARCH.md가 인용한 공식 SDK 패턴을 그대로 따른다.
3. **`node scripts/check-manifest.mjs`는 의도적으로 실행하지 않았다** — Wave 2 공통 규칙에 따라 `EXPECTED_HAS_CONTENT_COUNT`가 아직 2로 고정돼 있어 이 시점에 실행하면 red다. Plan 07이 상수를 11로 올리면 green이 된다.

## User Setup Required

None - no external service configuration required. (학습자가 실제로 API 키를 발급받거나 GitHub 계정을 만드는 것은 레슨 실습 범위이며 이 Plan 실행에는 필요 없었다.)

## Next Phase Readiness

- Plan 07(종단 게이트)이 `check-manifest.mjs`의 `EXPECTED_HAS_CONTENT_COUNT`를 2 → 11로 올릴 때 이 Plan의 두 파일이 포함되어야 한다.
- 이 Plan은 `src/` 아래 `.mdx` 2개 외 어떤 파일도 변경하지 않았다 — `globals.css`, `scripts/check-manifest.mjs` 등 공유 파일 무변경.

## Self-Check: PASSED

- FOUND: src/content/lessons/step-1/1-2-git-branch-and-pr.mdx
- FOUND: src/content/lessons/step-1/1-2-generative-ai-basics.mdx
- FOUND commit: 9d7533c
- FOUND commit: 2840147

---
*Phase: 04-step-1*
*Completed: 2026-08-25*
