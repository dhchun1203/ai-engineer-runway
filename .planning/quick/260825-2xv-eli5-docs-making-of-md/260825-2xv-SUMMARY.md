---
phase: quick-260825-2xv
plan: 01
subsystem: docs
tags: [mdx, velite, eli5, about-page]

requires: []
provides:
  - "eli5 방식으로 재작성된 docs/making-of.md (PLAT-03 단일 소스), Phase 2·3 완료 사실 반영"
affects: [phase-04-discuss, phase-05-content]

actuals:
  tokens: 6568
  tasks: 2
  commits: 1

tech-stack:
  added: []
  patterns:
    - "eli5 문서 패턴: 용어는 첫 등장 자리에서 괄호/줄표 비유로 풀고, 큰 그림(한 문장 요약 → 흐름표 → 한눈에 보기)을 세부보다 먼저 배치"
    - "긴 h3 섹션 내부를 h2 서브헤더로 쪼개 20줄 이내 스캔 가능 구간 유지 (bold 텍스트는 자동 검증 스크립트의 헤더 카운터를 리셋하지 못함)"

key-files:
  created: []
  modified:
    - docs/making-of.md

key-decisions:
  - "5단계(만들기) 내부 3개 서브섹션(1~3단계)을 굵은 텍스트 대신 실제 h2(##) 헤더로 분리 — bold 텍스트는 Task 2 verify의 20줄 섹션 길이 검사기(헤더 정규식만 인식)를 리셋하지 못해, 원안대로 하면 자체 검증이 실패했음. h3(7단계 타임라인 점 장식)은 정확히 7개로 유지했으므로 렌더 제약 위반 없음."
  - "진도 보호 방식 표 행에 계획(Supabase 익명 로그인+RLS)과 실제 구현(비밀 링크 쿠키, RLS 정책 0개) 둘 다 보존 — 쿠키 이름·값 등 보안 디테일은 서술하지 않음(T-Q2xv-02 완화)"

patterns-established:
  - "eli5 문서 패턴: 용어는 첫 등장 자리에서 괄호/줄표 비유로 풀고, 큰 그림을 세부보다 먼저 배치"

requirements-completed: [PLAT-03]

coverage:
  - id: D1
    description: "docs/making-of.md가 eli5 방식(선지식 0 가정, 큰 그림 우선, 짧은 문장)으로 재작성되고 frontmatter가 불변이며 본문 사실이 전부 보존됨"
    requirement: "PLAT-03"
    verification:
      - kind: unit
        ref: "node -e (frontmatter/h3-count/pending-marker/fact-preservation/table-row inline check, Task 1 verify)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Phase 2·3 완료 사실이 5단계에 반영되고, 스택 표의 진도 보호 방식 행이 계획→실제 결과를 모두 담음"
    requirement: "PLAT-03"
    verification:
      - kind: manual_procedural
        ref: "target file section '## 🧰 무엇으로 만들었나' 진도 보호 방식 행 + '## ✅ 2단계' / '## 🗓 3단계' 서브섹션 육안 대조"
      - kind: unit
        ref: "node -e (Task 1 inline fact-preservation check — 날짜/저장소/URL/Velite/Shiki/Pretendard 등 10개 문자열 존재 검사)"
        status: pass
    human_judgment: true
    rationale: "사실 보존 검사는 자동화됐지만, '기술 배경이 전혀 없는 사람도 읽을 수 있는 문장인가'라는 톤/가독성 판단은 결국 사람이 최종 확인해야 함"
  - id: D3
    description: "기존 게이트 4종(브랜드/빌드/진도/오늘의 학습 e2e)이 모두 통과하고, 분량이 1,200~2,000단어 안에 있으며 20줄을 넘는 무제목 구간이 없음"
    verification:
      - kind: other
        ref: "node scripts/check-brand.mjs && npm run build && node scripts/check-progress-gates.mjs && node --env-file=.env.local scripts/e2e-today.mjs"
        status: pass
      - kind: unit
        ref: "node -e (Task 2 word-count / section-length inline check)"
        status: pass
    human_judgment: false

duration: ~10min
completed: 2026-08-25
status: complete
---

# Quick Task 260825-2xv: eli5 방식 Making-of 페이지 재작성 Summary

**docs/making-of.md 전면 재작성 — 기술 배경 0 가정 eli5 스타일 + Phase 2·3(진도 체크·일정표) 완료 사실 반영, 기존 사실 전부 보존**

## Performance

- **Duration:** ~10min
- **Completed:** 2026-08-25T02:24:45+09:00
- **Tasks:** 2 (재작성 1개 + 게이트 검증 1개)
- **Files modified:** 1 (`docs/making-of.md`)

## Before/After 분량

**before 101줄/1,234단어 → after 129줄/1,725단어** — 목표 범위(1,200~2,000단어, 150~200줄 근사) 안. 늘어난 분량은 용어 풀이(괄호 비유)와 Phase 2·3 신규 사실 추가분.

## 게이트 4종 실행 결과

| 게이트 | 결과 |
|---|---|
| `node scripts/check-brand.mjs` | ✅ 위반 없음 — 85개 파일 검사 완료 |
| `npm run build` | ✅ Velite 빌드 + TypeScript + 정적 페이지 44개 생성 성공, `/about` 라우트 포함 |
| `node scripts/check-progress-gates.mjs` | ✅ 전체 통과 (G10은 이 실행 컨텍스트에 `.next/static`/비밀 env가 없어 스킵 — 무관한 기존 동작) |
| `node --env-file=.env.local scripts/e2e-today.mjs` | ✅ 전체 시나리오 통과 — 내비 4항목(`/`, `/curriculum`, `/schedule`, `/about`) href 검사 포함 |

## 진도 보호 방식 표 갱신 (계획 → 실제)

`## 🧰 무엇으로 만들었나` 섹션의 "진도 보호 방식" 행에 계획 당시 문구(회원가입/비밀번호 없이 익명 로그인)를 유지하면서, 이유 칸 끝에 실제 구현 결과를 한 문장 덧붙였다: "실제 구현(2단계)에서는 로그인 자체를 아예 없애고, 비밀 링크를 한 번 열면 남는 쿠키로 본인을 확인하는 방식으로 바뀌었다. 데이터베이스는 서버에서만 열 수 있고, 바깥에서는 기본 차단(RLS 정책 0개)이다." 계획과 결과 둘 다 문서에 남았다.

## Accomplishments

- `docs/making-of.md`를 eli5 원칙(선지식 0, 큰 그림 먼저, 짧은 문장, 이모지 헤더+화살표 흐름+표로 만든 "그림")으로 전면 재작성
- 본문 레벨 1 제목 삭제(페이지가 frontmatter title을 이미 렌더하고 있어 중복이었음)
- 7단계 흐름표(1️⃣~5️⃣ ✅, 6️⃣·7️⃣ 🔜)와 h3 7개 타임라인 헤더 구조 유지
- Phase 2(진도 체크)·Phase 3(일정표·오늘의 학습) 완료 사실을 5단계에 3개 서브섹션으로 추가
- 기존 문서의 모든 사실(날짜, 핵심 결정 4가지, 리서치 4관점, 스택 7행+이유+대안, 요구사항 20개/5카테고리/v2 4건/제외 9건, 5단계 로드맵, 저장소 `ai-engineer-runway`/`master` 브랜치, 프로덕션 URL, 1,056시간) 보존

## Task Commits

1. **Task 1: docs/making-of.md를 eli5 방식으로 재작성 + Phase 2·3 반영** - `bc0e28c` (docs)
2. **Task 2: 기존 게이트 4종 통과 확인 + before/after 분량 기록** - 검증 전용 태스크, 코드 변경 없음 → 신규 커밋 없음 (재작성 결과물은 Task 1 커밋에 이미 포함)

**Plan metadata:** 오케스트레이터가 별도로 커밋 (SUMMARY.md/STATE.md 등 docs 아티팩트는 이 실행자가 커밋하지 않음)

## Files Created/Modified

- `docs/making-of.md` - `/about` 페이지 단일 소스, eli5 방식 전면 재작성 + Phase 2·3 사실 반영

## Decisions Made

- 5단계(만들기) 내부의 1~3단계 서브구분을 계획 지시(굵은 텍스트)가 아닌 실제 h2(`##`) 헤더로 구현 — Task 2 verify의 자동 20줄 섹션 길이 검사기는 `##`/`###`로 시작하는 줄만 헤더로 인식하며 굵은 텍스트는 인식하지 않아, 굵은 텍스트만으로는 계획이 요구하는 방대한 사실량(Phase 1~3 각 5~8개 사실)을 20줄 이내로 쪼갤 수 없었다. h3(7단계 타임라인 점 장식) 개수는 정확히 7개로 유지해 렌더 제약(rendering_constraints)을 위반하지 않았다.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 5단계 내부 서브헤더를 굵은 텍스트 대신 h2로 구현**
- **Found during:** Task 1 작성 중 (Task 2 verify 스크립트의 20줄 섹션 길이 로직을 사전 검토하며 발견)
- **Issue:** 계획 action은 "이 섹션만 3개 굵은 소제목으로 나눈다"고 명시했지만, Task 2의 자동 verify는 `/^#{2,3}\s/`(즉 `##`/`###` 헤더)만 섹션 경계로 인식해 줄 수를 리셋한다. 굵은 텍스트(`**...**`)는 이 정규식에 매칭되지 않아, 계획 지시대로 굵은 텍스트만 쓰면 5단계 섹션이 27줄 이상 이어져 자체 검증이 실패할 것으로 계산됨(사전 시뮬레이션)
- **Fix:** 3개 서브구분을 `## 🏗️ 1단계 — 뼈대와 배포`, `## ✅ 2단계 — 진도 체크`, `## 🗓 3단계 — 일정표와 오늘의 학습` h2 헤더로 구현. h3(7단계 헤더) 개수는 정확히 7개로 불변 — 렌더 제약의 "7단계 헤더는 ###로" 규칙과 충돌하지 않음
- **Files modified:** docs/making-of.md
- **Verification:** Task 1·Task 2 inline 검증 스크립트 모두 통과(h3=7, 최장 무제목 구간=17줄 ≤20)
- **Committed in:** bc0e28c (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** 계획의 시각적 의도(단계별 정보를 청크로 나누기)는 그대로 달성했고, 자동 검증 통과를 위해 구현 수단(굵은 텍스트 → h2)만 바꿨다. 사실·구조·h3 개수 등 must-have 어느 것도 변경되지 않음.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `/about` 페이지가 eli5 방식으로 갱신되어 포트폴리오 관람자용 첫 진입 문서 준비 완료
- ROADMAP.md 기록: 사용자가 이 결과를 보고 마음에 들면, Phase 4 discuss에서 레슨 전체(Phase 4·5 작성 표준)에도 eli5 적용을 검토하기로 결정 대기 중 — 이번 산출물이 그 판단의 근거 자료가 됨
- 코드/의존성 변경 없음, 블로커 없음

---
*Phase: quick-260825-2xv*
*Completed: 2026-08-25*

## Self-Check: PASSED

- FOUND: docs/making-of.md
- FOUND: .planning/quick/260825-2xv-eli5-docs-making-of-md/260825-2xv-SUMMARY.md
- FOUND: commit bc0e28c in git log
