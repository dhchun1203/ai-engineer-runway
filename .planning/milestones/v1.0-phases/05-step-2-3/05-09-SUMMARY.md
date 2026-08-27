---
phase: 05-step-2-3
plan: 09
subsystem: content
tags: [mdx, velite, step-3, peft, lora, qlora, llm-evaluation]

requires:
  - phase: 05-step-2-3
    provides: "05-01 approved Step 3 depth bar (3-1-vector-search-basics.mdx), 05-07 reconciled manifest hasContent constant (23)"
provides:
  - "3-3-peft-lora-qlora lesson: overview-depth PEFT/LoRA/QLoRA concept coverage with prompt-vs-RAG-vs-tuning decision table"
  - "3-3-tuning-evaluation lesson: overview-depth baseline/eval-set/metric-type coverage with a format-pass-rate-vs-human-eval divergence case"
affects: [05-12-prompt-versioning-eval, 05-13-manifest-reconciliation]

actuals:
  tokens: 4470
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Step 3 개요 레슨: 학습 목표 3요소(정의/용도/파이프라인 위치), 읽기용 스니펫 1개 + '지금 실행할 필요는 없습니다' 인용문, 판단형 해보기"

key-files:
  created: []
  modified:
    - src/content/lessons/step-3/3-3-peft-lora-qlora.mdx
    - src/content/lessons/step-3/3-3-tuning-evaluation.mdx

key-decisions:
  - "두 레슨 모두 ### 해보기 블록을 '실무 팁'(5단) 뒤, '핵심 정리'(6단) 앞에 배치 — 3-1-vector-search-basics 승인본과 동일 위치로 형식 일관성 유지"
  - "PEFT 레슨의 LoRA 설정 스니펫은 r/lora_alpha 등 필드를 '무엇을 나타내는 값인지'로만 주석 처리하고 권장값·트레이드오프는 서술하지 않음 — step_3_depth_standard의 하이퍼파라미터 권장 금지 대응"
  - "튜닝-평가 레슨의 실무 예제는 '형식 통과율은 오르고 사람 평가는 떨어진' 사례로 구성 — 지표 하나만 보면 안 되는 이유를 코드가 아닌 결과 JSON으로 보여줌"

requirements-completed: [CONT-05]

coverage:
  - id: D1
    description: "3-3-peft-lora-qlora 레슨이 개요 깊이로 렌더되고 구조·브랜드 게이트를 통과한다"
    requirement: CONT-05
    verification:
      - kind: other
        ref: "node scripts/check-lesson-structure.mjs"
        status: pass
      - kind: other
        ref: "node scripts/check-brand.mjs"
        status: pass
      - kind: e2e
        ref: "curl http://localhost:3901/lesson/3-3-peft-lora-qlora -> 200"
        status: pass
    human_judgment: false
  - id: D2
    description: "3-3-tuning-evaluation 레슨이 개요 깊이로 렌더되고 구조·브랜드 게이트를 통과한다"
    requirement: CONT-05
    verification:
      - kind: other
        ref: "node scripts/check-lesson-structure.mjs"
        status: pass
      - kind: other
        ref: "node scripts/check-brand.mjs"
        status: pass
      - kind: e2e
        ref: "curl http://localhost:3901/lesson/3-3-tuning-evaluation -> 200"
        status: pass
    human_judgment: false
  - id: D3
    description: "두 레슨 모두 프로즈 깊이(수식·하이퍼파라미터 권장·VRAM 산정 없음)가 D-62~D-65 승인 기준을 지킨다"
    requirement: CONT-05
    verification: []
    human_judgment: true
    rationale: "프로즈 깊이 자체는 자동 검증 불가 — RESEARCH Pitfall 2, flagged_assumptions에 명시된 대로 05-01 체크포인트 승인 기준(3-1-vector-search-basics)과의 정성적 비교가 필요하다"

duration: 25min
completed: 2026-08-26
status: complete
---

# Phase 5 Plan 9: PEFT·LoRA·QLoRA와 튜닝 평가 개요 레슨 Summary

**Step 3 3-3 모듈 2편(PEFT/LoRA/QLoRA 개념, 튜닝 전후 성능 비교)을 개요 깊이로 신규 작성 — 실행·GPU 요구 0건, 판단형 해보기 6개**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-25T16:10:00Z (approx.)
- **Completed:** 2026-08-26T (see commit timestamps)
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `3-3-peft-lora-qlora.mdx`: 전체 파인튜닝 → PEFT → LoRA → QLoRA를 비유 중심으로 설명하고, 프롬프트/RAG/튜닝 중 무엇을 고를지 판단 표로 정리
- `3-3-tuning-evaluation.mdx`: 베이스라인·평가셋 분리·LLM 평가 지표 4종·과적합을 다루고, "형식 통과율은 올랐지만 사람 평가는 떨어진" 사례로 지표 단일 의존의 위험을 보여줌
- 두 레슨 모두 읽기용 코드 스니펫 정확히 1개(각각 python 12줄, json 16줄), 설치·실행 안내 0건
- `2-7-promptops`(골든셋·형식 통과율·회귀)와 `1-5-ml-metrics-and-pipeline`(정확도·정밀도·재현율)에서 이미 다룬 용어를 반복하지 않고 그 위에서 시작

## Task Commits

Each task was committed atomically:

1. **Task 1: `3-3-peft-lora-qlora` 집필** - `a5067d8` (feat)
2. **Task 2: `3-3-tuning-evaluation` 집필** - `e913f09` (feat)

**Plan metadata:** (this commit, follows)

## Files Created/Modified
- `src/content/lessons/step-3/3-3-peft-lora-qlora.mdx` - PEFT·LoRA·QLoRA 개요 레슨, `hasContent: false → true`
- `src/content/lessons/step-3/3-3-tuning-evaluation.mdx` - 튜닝 전후 성능 비교 개요 레슨, `hasContent: false → true`

## Decisions Made
- 두 레슨 모두 `### 해보기` 위치를 실무 팁(5단) 뒤·핵심 정리(6단) 헤딩 앞으로 통일 — 초안에서 6단 안쪽(단어 표와 스스로 점검 사이)에 넣었다가 `3-1-vector-search-basics` 승인본 형식과 맞추기 위해 재배치했다(구조 게이트는 위치를 검사하지 않지만 일관성을 위해 조정)
- LoRA 설정 스니펫의 각 필드 주석은 "무엇을 나타내는 값인가"만 설명하고 권장값·트레이드오프는 쓰지 않았다 — PEFT 모듈에 특정된 하이퍼파라미터 권장 금지 규칙 대응
- 튜닝-평가 레슨의 실무 예제는 실패 사례(사람 평가 하락)를 포함한 JSON 결과 객체로 구성해 "지표 하나만 보면 안 되는 이유"를 코드가 아닌 데이터로 보여줬다

## Deviations from Plan

None - plan executed exactly as written. One acceptance-criteria imprecision was found and worked around (not a code deviation):

- **Plan's velite JSON check regex was imprecise.** Task 1/Task 2 acceptance criteria specified `/language-python/.test(p.code)` (and implicitly the JSON equivalent) against `.velite/lessons.json`'s `code` field. The actual rehype-pretty-code/Shiki output encodes the fence language as `"data-language":"python"` (and `"data-language":"json"`), not the literal substring `language-python`. Verified the real attribute is present and correct for both lessons using the corrected pattern (`/data-language":"python"/` and `/data-language":"json"/`), both pass. No code change was needed — the lesson content and code fences are correct; only the plan's verification regex was inaccurate. Flagging here since a strict re-run of the plan's literal regex would report a false failure.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 3-3 모듈 완료, `check-manifest.mjs`는 이 wave 동안 의도적 red(Plan 13이 상수 갱신 시 되돌림) — 손대지 않았다
- `check-lesson-structure.mjs` 기준 hasContent 레슨 25개 통과 확인 (직전 24 + 이번 wave 두 편 중 1편 already counted mid-write; 최종 25)
- `.velite/lessons.json` 기준 `hasContent: true` 총 25편 (이 Plan의 2편 포함)
- 평가 용어(베이스라인, 평가셋, 과적합, 형식 통과율, 사람 평가, 모델 채점, 회귀)는 Plan 12(`3-6-prompt-versioning-eval`)가 참조할 수 있도록 확정해 둠
- STATE.md/ROADMAP.md는 이 실행자가 수정하지 않음 — 오케스트레이터가 wave 완료 후 일괄 갱신

---
*Phase: 05-step-2-3*
*Completed: 2026-08-26*

## Self-Check: PASSED

- FOUND: src/content/lessons/step-3/3-3-peft-lora-qlora.mdx
- FOUND: src/content/lessons/step-3/3-3-tuning-evaluation.mdx
- FOUND commit: a5067d8
- FOUND commit: e913f09
