---
phase: 05-step-2-3
plan: 12
subsystem: content
tags: [mdx, velite, lesson-content, llmops, prompt-versioning, monitoring, structured-output]

requires:
  - phase: 05-step-2-3
    provides: "2-7-promptops와 2-7-prompt-patterns의 실습 용어(골든셋·회귀·구조화 출력·스키마 검증), 3-1-vector-search-basics의 승인된 개요 깊이 형식"
provides:
  - "3-6-prompt-versioning-eval, 3-6-monitoring-governance, 3-6-structured-output-canary 세 레슨 본문 (hasContent: false → true)"
  - "yaml 코드펜스 언어가 실제 빌드에서 하이라이팅된다는 실증(D-72 마지막 미실증 언어 해소)"
affects: ["05-13 (매니페스트 실측 마감)"]

actuals:
  tokens: 6467
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Step 3 개요 레슨: 코드 블록 정확히 1개, '지금 실행할 필요는 없습니다' 인용문, 판단형 해보기(D-63, D-64)"
    - "보안·거버넌스 서술에서 검증되지 않은 임계값·수치를 '팀이 정한다'로 남기는 서술 원칙"

key-files:
  created: []
  modified:
    - src/content/lessons/step-3/3-6-prompt-versioning-eval.mdx
    - src/content/lessons/step-3/3-6-monitoring-governance.mdx
    - src/content/lessons/step-3/3-6-structured-output-canary.mdx

key-decisions:
  - "세 레슨 모두 '해보기' 블록을 5. 실무 팁과 6. 핵심 정리 사이에 배치 — 승인된 3-1 파일럿의 실제 구조를 그대로 따랐다(플랜 프롬프트의 서술 순서와 실제 파일럿 구조가 달라, 파일럿을 우선했다)"
  - "흐름 도식(D-48, '요청 → ... → 결과')을 코드펜스가 아니라 굵은 글씨 한 줄로 표현 — 각 레슨의 fenced code block을 정확히 1개로 제한하는 acceptance criteria(`grep -c '^```'` = 2)를 지키기 위함"

requirements-completed: [CONT-05]

coverage:
  - id: D1
    description: "3-6-prompt-versioning-eval이 프롬프트 버전관리·평가 자동화를 개요 깊이로 다루고 yaml 펜스가 실제 빌드에서 하이라이팅된다"
    requirement: "CONT-05"
    verification:
      - kind: other
        ref: "node scripts/check-lesson-structure.mjs; node scripts/check-brand.mjs; npm run build; next start + curl /lesson/3-6-prompt-versioning-eval → 200"
        status: pass
    human_judgment: false
  - id: D2
    description: "3-6-monitoring-governance가 모니터링·알림·보안 거버넌스를 개요 깊이로 다루고 검증되지 않은 수치를 단정하지 않으며 실제 개인정보 형식이 0건이다"
    requirement: "CONT-05"
    verification:
      - kind: other
        ref: "node scripts/check-lesson-structure.mjs; node scripts/check-brand.mjs; grep -cE SSN/email pattern = 0; npm run build; next start + curl → 200"
        status: pass
    human_judgment: true
    rationale: "보안·거버넌스 서술의 개념적 정확성(단정 없는 서술이 실제로 잘 읽히는지)은 자동 검증 불가 — RESEARCH가 이 영역을 [ASSUMED]로 표시했다"
  - id: D3
    description: "3-6-structured-output-canary가 구조화 출력 파이프라인·카나리·비용 지표를 개요 깊이로 다루고 Step 3 13편이 완성됐다"
    requirement: "CONT-05"
    verification:
      - kind: other
        ref: "node scripts/check-lesson-structure.mjs; node scripts/check-brand.mjs; npm run build; next start + curl → 200"
        status: pass
    human_judgment: true
    rationale: "Step 3 13편·25편 전체 hasContent:true 확인은 병렬 wave의 다른 4개 worktree가 아직 merge되지 않은 이 시점에서 이 worktree 단독으로는 검증 불가 — Plan 13이 wave 병합 후 실측한다"

duration: ~45min
completed: 2026-08-25
status: complete
---

# Phase 5 Plan 12: 3-6 LLMOps 모듈 (프롬프트 버전관리·모니터링/거버넌스·구조화 출력/카나리) Summary

**Step 3의 3-6 LLMOps 모듈 3편을 개요 깊이로 집필 — `2-7-promptops`/`2-7-prompt-patterns`의 실습을 운영 관점으로 확장하고, `yaml` 코드펜스 언어를 이 저장소에서 처음 실증했다**

## Performance

- **Duration:** ~45min
- **Completed:** 2026-08-25T16:19:03Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- `3-6-prompt-versioning-eval`: 프롬프트 버전관리·평가 자동화를 개요 깊이로 작성. `2-7-promptops`의 골든셋/회귀/기준선 용어를 그대로 이어받았고, `yaml` 코드펜스(GitHub Actions 예시, 16줄)를 이 저장소에서 처음으로 실사용했다.
- `3-6-monitoring-governance`: 시스템 지표 vs 품질 지표 비교표, 알림 설계 원칙, 개인정보 취급, 프롬프트 인젝션·감사 추적을 다뤘다. 보안·거버넌스는 RESEARCH가 `[ASSUMED]`로 표시한 영역이라 구체 임계값·비율을 단정하지 않고 "팀이 정한다"로 남겼다. 로그 예시는 실제 개인정보 형식 없이 `[MASKED]` 자리표시자만 썼다.
- `3-6-structured-output-canary`: 검증 실패 시 세 선택지(재시도/기본값 대체/사람에게 넘기기) 비교표, 카나리 배포, 롤백 조건, 비용·지연·성공률 트레이드오프를 다뤘다. Step 3 마지막 개요 레슨임을 핵심 정리에서 짚었다.
- 세 레슨 모두 `node scripts/check-lesson-structure.mjs`(L1~L7), `node scripts/check-brand.mjs`, `npm run build`를 통과했고, `next start` + curl로 세 URL 모두 200을 확인했다(MDX 렌더 실패를 잡는 유일한 검사).

## Task Commits

Each task was committed atomically:

1. **Task 1: `3-6-prompt-versioning-eval` 집필** - `4700ac5` (feat)
2. **Task 2: `3-6-monitoring-governance` 집필** - `6c60bd1` (feat)
3. **Task 3: `3-6-structured-output-canary` 집필** - `304cd2b` (feat)

## Files Created/Modified
- `src/content/lessons/step-3/3-6-prompt-versioning-eval.mdx` - 프론트매터 `hasContent: false → true`, 본문 신규 (6단 헤딩, 해보기 3개, 단어표 7행, `yaml` 펜스 16줄)
- `src/content/lessons/step-3/3-6-monitoring-governance.mdx` - 프론트매터 `hasContent: false → true`, 본문 신규 (6단 헤딩, 해보기 3개, 단어표 8행, `json` 펜스 14줄)
- `src/content/lessons/step-3/3-6-structured-output-canary.mdx` - 프론트매터 `hasContent: false → true`, 본문 신규 (6단 헤딩, 해보기 3개, 단어표 7행, `typescript` 펜스 19줄)

## `yaml` 펜스 하이라이팅 결과 (A2, 플랜의 `flagged_assumptions`)

**폴백 없이 실제 하이라이팅됨.** `.velite/lessons.json`의 컴파일된 `code` 필드를 직접 확인했다. 이 저장소가 실제로 쓰는 rehype-pretty-code 버전은 `class="language-yaml"` 형태가 아니라 `data-language="yaml"` 속성으로 언어를 표시하므로, 플랜의 검증 스니펫(`/language-yaml/.test(p.code)`)은 문자 그대로는 매치하지 않는다(`"language":"yaml"`처럼 하이픈이 아니라 콜론이 들어간다).

대신 토큰 단위로 직접 대조해 실제 색상이 입혀진 것을 확인했다 — 예: `# ...` 주석은 회색(`--shiki-dark:"#768390"`), `name` 키는 초록(`"#8DDB8C"`), `prompt-eval` 값은 파랑(`"#96D0FF"`)으로 각각 다르게 스타일링돼 있다. 단색 폴백이었다면 모든 토큰이 같은 색이었을 것이다. `json` 펜스(Task 2)도 같은 방식으로 확인했고 동일하게 실제 하이라이팅이 적용됐다.

**결론:** `yaml`은 D-72가 추가한 8개 언어 중 이 저장소에서 실증된 마지막 언어이고, 실증 결과는 정상이다. 플랜의 검증 정규식만 이 저장소의 실제 출력 형태와 어긋나 있으므로, 사람 확인 시 `/language-yaml/` 대신 `/data-language":"yaml/` 또는 `.velite/lessons.json`을 직접 열어 토큰 색상을 비교하는 방식을 권장한다. `scripts/check-lesson-structure.mjs`나 다른 공유 스크립트는 이 발견에 맞춰 수정하지 않았다(병렬 실행 중 공유 스크립트 변경 금지 제약).

## Step 3 13편·Phase 5 25편 완성도 확인 — 이 wave 종료 후 사람 확인 필요

이 worktree는 4개의 형제 worktree와 병렬로 실행됐고, 각각 다른 Step 3 레슨을 담당한다. 이 시점에 이 worktree 안에서 확인한 `src/content/lessons/step-3/*.mdx`의 `hasContent` 상태는 다음과 같다 — 이번 Plan이 만든 3편과 이전 wave(Plan 01)의 1편만 `true`이고, 나머지는 이 worktree에 아직 병합되지 않은 형제 Plan들의 작업이다.

```
3-1-hybrid-search-reranking.mdx:      false (다른 형제 Plan)
3-1-vector-search-basics.mdx:         true  (Plan 01, 기존)
3-2-project-rag-agent.mdx:            false (다른 형제 Plan)
3-3-peft-lora-qlora.mdx:              false (다른 형제 Plan)
3-3-tuning-evaluation.mdx:            false (다른 형제 Plan)
3-4-multi-agent-structure.mdx:        false (다른 형제 Plan)
3-4-n8n-langgraph.mdx:                false (다른 형제 Plan)
3-4-webhook-schedule-hitl.mdx:        false (다른 형제 Plan)
3-5-project-orchestration.mdx:        false (다른 형제 Plan)
3-6-monitoring-governance.mdx:        true  (이 Plan)
3-6-prompt-versioning-eval.mdx:       true  (이 Plan)
3-6-structured-output-canary.mdx:     true  (이 Plan)
3-7-project-ax-launch.mdx:            false (다른 형제 Plan)
```

이 Plan이 담당한 3편은 모두 `hasContent: true`로 정상 전환됐다. "Step 3 13편·25편 전체 완성" 확인은 wave 4의 모든 형제 worktree가 병합된 뒤 Plan 13이 실측한다(계획서의 `manifest_gate_note`, D-78과 동일한 이유).

## 2-7 모듈과 맞춘 용어 목록

- `골든셋`, `회귀`, `버전 태그`, `기준선` — `2-7-promptops`에서 그대로 이어받아 `3-6-prompt-versioning-eval`에서 재사용(총 8회 등장, `2-7-promptops`를 명시적으로 2회 인용)
- `구분자로 감싸기`(사용자 입력과 시스템 지시 분리) — `2-7-prompt-patterns`의 실무 팁에서 이어받아 `3-6-monitoring-governance`의 프롬프트 인젝션 대응으로 정식화
- `구조화 출력`, `스키마 검증`, `검증 실패 시 재시도/기본값 대체/사람에게 넘기기` — `2-7-prompt-patterns`에서 이어받아 `3-6-structured-output-canary`에서 "서비스 규모로 돌릴 때"로 확장

## `3-7-project-ax-launch`(Plan 11)와의 정책 용어 일치 여부

이 Plan은 `3-7-project-ax-launch`와 같은 wave에서 병렬 집필됐으므로 실시간으로 상호 대조하지 못했다. `3-6-monitoring-governance`에서 쓴 용어(`마스킹`, `개인정보(PII)`, `프롬프트 인젝션`, `감사 추적`, `임계값`)는 `.planning/curriculum.md` §3-7과 `.planning/phases/05-step-2-3/05-RESEARCH.md` §Security Domain의 표현을 따랐다. 두 레슨이 실제로 같은 용어를 쓰는지는 두 Plan이 모두 병합된 뒤 Plan 13의 사람 확인에서 최종 대조가 필요하다(계획서 `flagged_assumptions` CONT-05 항목과 동일한 리스크).

## 확정된 해보기 개수

세 레슨 모두 `### 해보기` 3개, `<details>` 정답 블록 5개(해보기 3 + 스스로 점검 2) — 최소 요건(해보기 개수 + 2)을 정확히 충족한다.

## 게이트 통과 시점의 `hasContent: true` 개수

이 worktree 기준 25편 중 4편(`3-1-vector-search-basics` + 이 Plan의 3편)만 `true`다. 최종 35개 목표는 wave 4의 모든 형제 Plan이 병합된 뒤 Plan 13이 재확인한다. `node scripts/check-manifest.mjs`는 계획서의 지시대로 이 Plan에서 실행하지 않았다.

## Decisions Made
- 해보기 블록 배치를 계획 프롬프트의 서술 순서(⑤ 다음에 명시)가 아니라 승인된 `3-1-vector-search-basics` 파일럿의 실제 구조(실무 팁과 핵심 정리 사이)에 맞췄다 — 두 소스가 일치하지 않아 실물 파일럿을 우선했다.
- 흐름 도식(D-48)을 코드펜스가 아니라 굵은 텍스트 한 줄로 표현해 각 레슨의 코드펜스를 정확히 1개로 유지했다 — acceptance criteria가 `grep -c '^```'` = 2(여는 줄 1 + 닫는 줄 1)를 요구했기 때문.

## Deviations from Plan

None (Rule 1-3 자동 수정 없음) - 계획대로 집필했고, 계획 프롬프트와 실물 파일럿 구조 간의 사소한 불일치(해보기 배치)만 파일럿을 기준으로 해소했다. 이는 D-65가 "형식 예외 없음"을 요구하는 구조 게이트 자체는 건드리지 않았고 게이트가 실제로 통과했으므로 배포 관점의 편차는 없다.

## Issues Encountered
- 플랜의 `yaml`/`json` 하이라이팅 검증 정규식(`/language-yaml/`, `/language-json/`)이 이 저장소가 실제로 쓰는 rehype-pretty-code 출력 형태(`data-language="..."` 속성)와 문자열 수준에서 어긋나 있음을 발견했다. 위 "yaml 펜스 하이라이팅 결과" 섹션에서 토큰 색상 직접 대조로 실제 하이라이팅이 정상 동작함을 확인했다. 공유 스크립트는 병렬 실행 제약상 수정하지 않았다.

## Known Stubs

None.

## User Setup Required

None - 외부 서비스 설정 불필요.

## Next Phase Readiness
- 이 Plan이 담당한 3편은 완성됐고 모든 자동 게이트(구조·브랜드·빌드·200 응답)를 통과했다.
- Step 3 13편·Phase 5 25편 전체 완성 여부와 `3-7-project-ax-launch`와의 용어 일치 여부는 wave 4 병합 후 Plan 13의 사람 확인이 필요하다.
- `check-manifest.mjs`는 이 wave 동안 의도적으로 red 상태이며 Plan 13이 상수를 실측으로 되돌린다.

---
*Phase: 05-step-2-3*
*Completed: 2026-08-25*

## Self-Check: PASSED

- FOUND: src/content/lessons/step-3/3-6-prompt-versioning-eval.mdx
- FOUND: src/content/lessons/step-3/3-6-monitoring-governance.mdx
- FOUND: src/content/lessons/step-3/3-6-structured-output-canary.mdx
- FOUND: commit 4700ac5 (Task 1)
- FOUND: commit 6c60bd1 (Task 2)
- FOUND: commit 304cd2b (Task 3)
