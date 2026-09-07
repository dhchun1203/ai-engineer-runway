---
phase: 05-step-2-3
plan: 06
subsystem: content
tags: [mdx, llm-api, anthropic-sdk, zod, promptops, velite]

# Dependency graph
requires:
  - phase: 05-step-2-3
    provides: "3형식(심화 승계·개요 신규·프로젝트 준비 가이드 신규) 확정 골격, 확장 구조 게이트(L1~L7), 패키지 3종(prisma·@prisma/client·@anthropic-ai/sdk) 정당성 사용자 확인 완료 — Plan 01"
provides:
  - "2-7 모듈 2편(프롬프트 패턴·구조화 출력, PromptOps 평가) 심화 형식 본문 완결"
  - "Step 2 LLM API 예제의 process.env 키 패턴 + 날짜 접미사 없는 모델명 실증 — 향후 LLM 관련 레슨의 참고 샘플"
  - "API 키 없이 완주 가능한 평가 실습 패턴(callModel 모의 함수) — 3-6-prompt-versioning-eval(Step 3 개요)이 용어를 이어받을 수 있는 실물 근거"
affects: [05-step-2-3 Plan 07 (매니페스트 실측 마감)]

# Actuals (#2632)
actuals:
  tokens: 6846
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "LLM 예제에서 process.env.ANTHROPIC_API_KEY만 사용, .env 값 자리는 자리표시자(<발급받은-키>), 리터럴 키 문자열 0건"
    - "모델 식별자는 날짜 접미사 없는 이름(claude-sonnet-5)만 쓰고 '공식 문서에서 현재 이름을 확인하세요' 안내를 코드 주석과 실무 팁 두 곳에 병기"
    - "구조화 출력은 파싱이 아니라 zod 스키마 검증 + 실패 시 1회 재시도 패턴으로 작성(중첩 try/catch)"
    - "평가 실습은 callModel(prompt, input) 모의 함수로 완결 — process.env.ANTHROPIC_API_KEY 존재 시 실제 호출로 바꾸는 분기 지점만 주석으로 표시, 키 없이도 골든셋 5건이 끝까지 통과"

key-files:
  created: []
  modified:
    - src/content/lessons/step-2/2-7-prompt-patterns.mdx
    - src/content/lessons/step-2/2-7-promptops.mdx

key-decisions:
  - "코드펜스 언어 실증: rehype-pretty-code/Shiki 출력은 language-* 클래스가 아니라 data-language 속성을 쓴다(예: data-language=\"typescript\") — Plan의 acceptance_criteria node -e 검사(/language-typescript/ 정규식)는 이 저장소 실제 출력 형식과 불일치하는 stale 검사였다. 이미 승인된 2-3-react-components.mdx도 같은 data-language 패턴이라 이 검사 자체가 애초에 어느 레슨에서도 통과한 적이 없었을 것으로 보인다. data-language 속성 기준으로 typescript/json 펜스가 정상 하이라이팅됨을 재확인해 원래 검증 의도(신규 언어 펜스가 실제로 렌더되는가)는 충족했다"
  - "check-manifest.mjs는 Plan 지시대로 실행하지 않음 — 별도 확인 결과 hasContent 개수가 13→15로 정상 증가(2-7-prompt-patterns, 2-7-promptops 추가)했고 Invariant 10은 예상대로 red. Plan 07이 상수를 실측 갱신할 때까지 그대로 둔다"

patterns-established:
  - "LLM API 예제(2-7 모듈)의 키·모델명 표기 표준 — Step 3 3-6 모듈 저작 시 동일 패턴 재사용 가능"
  - "평가 스크립트를 키 의존 없이 완주시키는 모의 호출(callModel) 패턴 — Step 3 3-6-prompt-versioning-eval 개요 레슨이 이 실물을 개념으로 다시 짚을 때 참조"

requirements-completed: [CONT-05]

coverage:
  - id: D1
    description: "2-7-prompt-patterns.mdx — 프롬프트 4부 구조·구조화 출력·zod 스키마 검증·재시도 완결 코드(src/product-copy.ts), 키는 process.env 참조로만, 모델명은 날짜 접미사 없이 공식 문서 확인 안내 병기"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "node scripts/check-lesson-structure.mjs (15개 레슨, 7개 검사 통과)"
        status: pass
      - kind: unit
        ref: "node scripts/check-brand.mjs (위반 없음, 86개 파일)"
        status: pass
      - kind: automated_ui
        ref: "npm run build (성공) + next start(PORT 39217) + curl /lesson/2-7-prompt-patterns → 200"
        status: pass
    human_judgment: false
  - id: D2
    description: "2-7-promptops.mdx — 프롬프트 버전관리·골든셋 평가·회귀 감지, eval.ts가 callModel 모의 함수로 API 키 없이 통과 5/실패 0까지 완주"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "node scripts/check-lesson-structure.mjs (15개 레슨, 7개 검사 통과)"
        status: pass
      - kind: unit
        ref: "node scripts/check-brand.mjs (위반 없음, 86개 파일)"
        status: pass
      - kind: automated_ui
        ref: "npm run build (성공) + next start(PORT 39217) + curl /lesson/2-7-promptops → 200"
        status: pass
    human_judgment: false

duration: 16min (2026-08-26 00:13 워크트리 기준선 ~ 00:29 두 번째 커밋)
completed: 2026-08-26
status: complete
---

# Phase 5 Plan 6: 2-7 모듈(프롬프트 패턴·PromptOps) Summary

**`@anthropic-ai/sdk` + `zod`로 구조화 출력·재시도를 완결한 프롬프트 패턴 레슨과, `callModel` 모의 호출로 API 키 없이 완주하는 골든셋 평가(PromptOps) 레슨 2편을 심화 형식으로 신규 작성**

## Performance

- **Duration:** 약 16분 (워크트리 기준 커밋 `7492bfc` ~ Task 2 커밋 `08187a6`)
- **Started:** 2026-08-26T00:13:32+09:00 (워크트리 base)
- **Completed:** 2026-08-26T00:28:55+09:00
- **Tasks:** 2 (둘 다 계획대로 완료)
- **Files modified:** 2

## Accomplishments

- `2-7-prompt-patterns.mdx` — 프롬프트 4부(역할·지시·예시·제약), few-shot, 구조화 출력, 검증 실패 선택지(재시도/기본값/사람에게 넘기기)를 개념으로 설명하고, `src/product-copy.ts` 완결 코드로 zod 스키마 검증 + 1회 재시도를 실증
- `2-7-promptops.mdx` — 프롬프트 파일화·버전관리, 골든셋 회귀 확인, 자동/수동 채점 지표 구분, 운영 지표를 개념으로 설명하고, 4조각(`prompts/product-copy.v1.md`, `prompts/registry.ts`, `golden.json`, `eval.ts`) 완결 예제로 실증
- 두 레슨 모두 LLM API 키를 `process.env.ANTHROPIC_API_KEY` 참조로만 다루고, 리터럴 키 문자열 0건 확인
- 모델 식별자(`claude-sonnet-5`)는 날짜 접미사 없이 쓰고 "공식 문서에서 현재 이름을 확인하세요" 안내를 코드 주석·실무 팁 두 곳에 병기
- `2-7-promptops`의 평가 실습이 `callModel` 결정적 모의 함수로 완결되어 API 키 없이도 통과 5 / 실패 0까지 끝까지 실행됨을 확인 — 해보기 2에서 실패 케이스를 추가하면 통과 4 / 실패 1로 바뀌는 것도 코드 경로로 확인 가능
- `hasContent: true` 개수 13 → 15 (본 Plan에서 신규 2건 추가), `check-manifest.mjs`는 계획대로 이 wave 동안 의도적 red로 확인만 하고 상수는 건드리지 않음

## Task Commits

Each task was committed atomically:

1. **Task 1: 2-7-prompt-patterns 집필** - `0181f57` (feat)
2. **Task 2: 2-7-promptops 집필** - `08187a6` (feat)

**Plan metadata:** (이 커밋 이후 별도 커밋 예정 — `docs(05-06): complete 2-7 module plan`)

## Files Created/Modified

- `src/content/lessons/step-2/2-7-prompt-patterns.mdx` - 본문 신규 작성, `hasContent: false → true` (다른 프론트매터 필드 불변)
- `src/content/lessons/step-2/2-7-promptops.mdx` - 본문 신규 작성, `hasContent: false → true` (다른 프론트매터 필드 불변)

## Decisions Made

- 패키지명은 정확히 `@anthropic-ai/sdk`, `zod`, `dotenv`로 표기 (05-01-SUMMARY.md의 패키지 3종 정당성 확인 결과에 근거해 착수)
- Task 1의 재시도 구현은 중첩 `try/catch`로 정확히 1회만 재시도하고, 두 번째도 실패하면 명시적 오류를 던지도록 작성
- Task 2의 `callModel`은 `process.env.ANTHROPIC_API_KEY` 존재 여부를 확인하는 분기를 주석으로만 남기고 실제 SDK 호출은 구현하지 않음 — "API 키 없이도 완주 가능"이라는 must_have를 코드로 직접 보장하기 위함
- 코드펜스 언어는 계획대로 `typescript` · `powershell` · `json` · `text` 네 가지만 사용

## Deviations from Plan

### Auto-fixed Issues

None — Rule 1/2/3 수준의 버그·누락·차단 이슈는 발생하지 않았다.

### Verification Method Adjustment (not a Rule 1-4 deviation, documented for traceability)

**1. Task 1 acceptance_criteria의 `node -e` 검사가 이 저장소의 실제 코드펜스 하이라이팅 출력 형식과 불일치**

- **Found during:** Task 1 완료 후 acceptance_criteria 전수 확인
- **Issue:** Plan의 acceptance_criteria가 `.velite/lessons.json`의 `code` 필드에서 `/language-typescript/`·`/language-json/` 정규식을 검사하라고 명시했으나, 이 저장소의 실제 rehype-pretty-code/Shiki 출력은 `language-*` 클래스가 아니라 `data-language="typescript"` 속성을 쓴다. 이미 승인된 `2-3-react-components.mdx`(Wave 1 파일럿, 05-01)도 같은 `data-language` 패턴이므로, 이 정규식 검사는 애초에 어느 레슨에서도 문자 그대로는 통과하지 못했을 것으로 보인다.
- **Fix:** 검사 의도(신규 코드펜스 언어가 실제로 하이라이팅되는가)를 살려 `data-language\":\"typescript\"`·`data-language\":\"json\"` 존재 여부로 재확인 — 둘 다 통과 확인.
- **Files modified:** 없음 (검증 방법만 조정, 레슨 본문은 변경 없음)
- **Verification:** `node -e` 임시 스크립트로 `data-language` 속성 매칭 확인, exit 0
- **Committed in:** 해당 없음 (검증 단계 조정, 코드 변경 아님)

---

**Total deviations:** 0 auto-fixed, 1 verification-method adjustment (계획 문서의 stale 검사 표현을 실제 출력 형식에 맞춰 재해석)
**Impact on plan:** 레슨 본문·프론트매터에는 영향 없음. Plan 07 또는 이후 게이트 정비 시 acceptance_criteria 원문의 `language-*` 표현을 `data-language` 속성 기준으로 갱신하는 것을 권장한다.

## Issues Encountered

- **워크트리에 `node_modules`/`.env.local`이 없었음:** git worktree 격리 환경이라 `npm run build` 실행 전 `npm install`(락파일 기준 복원, 신규 패키지 추가 없음)과 메인 체크아웃의 `.env.local`(gitignore 대상, 시크릿 없음) 복사가 필요했다. 둘 다 저장소에 커밋되지 않는 로컬 전용 파일이라 git 상태에는 흔적이 남지 않는다.
- `npm run build` 1차 시도는 `SUPABASE_URL` 환경변수 부재로 `/curriculum` 페이지 수집에서 실패했으나 이는 콘텐츠와 무관한 워크트리 환경 이슈였고, `.env.local` 복사 후 재실행해 정상 통과했다.
- 그 외 특이사항 없음 — Task 1·2는 계획대로 실행됐고, 구조 게이트·브랜드 게이트·빌드·런타임 렌더(next start + curl 200)까지 모두 통과했다.

## User Setup Required

None - 외부 서비스 설정 불필요. `.env.local`은 로컬 검증용으로만 사용했고 저장소에 커밋되지 않는다.

## Next Phase Readiness

- **Plan 07 착수 가능** — 이 Plan이 완료되어 `hasContent: true` 개수가 15로 정상 증가했다. Plan 07이 Wave 2 종료 시점에 `.velite/lessons.json`을 실측해 `EXPECTED_HAS_CONTENT_COUNT`를 갱신할 때 이 Plan의 두 slug(`2-7-prompt-patterns`, `2-7-promptops`)가 이미 카운트에 포함되어 있다.
- **Step 3 3-6-prompt-versioning-eval 저작 시 참고 필요** — 이 Plan의 골든셋·회귀·버전 태그 용어와 `callModel` 모의 호출 구조가 그 개요 레슨의 개념 설명과 용어를 일치시켜야 한다(Plan 원문 key_links 참고).
- 블로커 없음. `check-manifest.mjs`는 계획대로 이 wave 동안 의도적 red 상태 그대로 두었다.

---
*Phase: 05-step-2-3*
*Completed: 2026-08-26*

## Self-Check: PASSED

Both files exist on disk (`src/content/lessons/step-2/2-7-prompt-patterns.mdx`, `src/content/lessons/step-2/2-7-promptops.mdx`) and both task commits (`0181f57`, `08187a6`) are present in git history (`git log --oneline` on branch `worktree-agent-a9228665119f7c9df`).
