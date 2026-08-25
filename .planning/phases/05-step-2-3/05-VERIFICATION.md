---
phase: 05-step-2-3
verified: 2026-08-26T00:00:00Z
status: human_needed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
mvp_mode_note: "phase has mode: mvp in ROADMAP.md, but the goal text ('학습자가 커리큘럼 전체(...)를 사이트에서 학습할 수 있다') does not match the required 'As a X, I want Y, so that Z.' regex — confirmed via `gsd-tools query user-story.validate` returning valid=false. This is a Korean-language declarative goal, not an English user-story template; every other phase in this ROADMAP uses the same declarative style. Rather than refuse verification outright, this report proceeds with standard goal-backward verification against the ROADMAP's explicit, concrete Success Criteria (which function as the must-haves contract regardless of mode tag). Flagging this tooling/content mismatch for the human to decide whether to correct the mode tag or accept declarative Korean goals project-wide.
human_verification:
  - test: "iPad Safari 실기기에서 프로젝트 준비 가이드 5편(2-4, 2-6, 3-2, 3-5, 3-7)을 끝까지 읽고 표·체크박스·해보기 접힘 블록이 정상 렌더되는지 확인"
    expected: "가로 스크롤 없이 표가 읽히고, 체크박스·<details> 터치 타깃이 44px 이상이며, 내용이 실제로 '준비 가이드'로 읽힌다(완성 코드로 읽히지 않는다)"
    why_human: "시각적 렌더링·터치 조작감은 코드 검사로 확인 불가 (이미 STATE.md/known-open-item으로 기록됨 — 새 발견 아님)"
  - test: "iPad Safari 실기기에서 Making-of 페이지의 Phase 4·5 신설 섹션을 읽고 톤·흐름이 이전 섹션과 이어지는지 확인"
    expected: "Phase 1~5가 하나의 이야기처럼 끊김 없이 읽힌다"
    why_human: "톤 일관성은 사람의 읽기 판단 영역 (이미 05-13 SUMMARY가 backstop으로 기록 — 새 발견 아님)"
  - test: "2-1 모듈(PostgreSQL·Supabase) SQL을 실제 Supabase SQL 에디터에서 실행해 연습 스키마 분리(D-56)가 진짜로 `public.progress`에 영향을 주지 않는지 확인"
    expected: "연습 스키마 생성·조작이 진도 저장 테이블에 부작용을 만들지 않는다"
    why_human: "실행 환경(Supabase 크리덴셜)에 접근 가능한 실행자가 없었음 (이미 known-open-item — 새 발견 아님)"
  - test: "3-4-n8n-langgraph·3-6-structured-output-canary·3-4-multi-agent-structure 세 편을 사용자가 승인한 트리밍 기준 레슨(3-1-vector-search-basics, 트림 후 '이제 맞다' 승인본)과 나란히 놓고 읽어, '언제 X가 Y보다 낫다'류 비교표·모범답안이 '알아듣기' 선을 넘지 않는지 재확인"
    expected: "비교표는 D-62(b)의 '언제 쓰는지' 정의 요구를 충족하는 범주적 설명에 머물고, 수치 튜닝(카나리 비율 등)은 오직 판단형 해보기의 예시 답안 안에만 있다 — 이 검증에서는 이 경계를 code-review로 확인했으나(찾은 근거는 본문 참고), '알아듣기 vs 실무 판단력' 사이의 최종 경계 판정은 원 사용자가 3-1 파일럿을 승인했던 것과 같은 기준으로 사람이 다시 봐야 한다. 05-08의 '이제 맞다' 재승인은 3-1·3-1-hybrid·3-2 세 편만 실사용자가 봤고, 05-09~05-12(10편)은 병렬 집필돼 사람이 개별 확인하지 않았다"
    why_human: "깊이·톤의 최종 적정성 판단은 코드 검사로 완전히 대체할 수 없는 콘텐츠 품질 판단 (이번 검증에서 새로 식별 — 기존 known-open-item에는 없음)"
  - test: "실제로 35편 전체를 완료 처리한 상태에서 대시보드·오늘의 학습 화면이 100%를 표시하는지 브라우저로 직접 확인"
    expected: "반올림·집계 결함 없이 100%가 화면에 그대로 보인다"
    why_human: "05-13 SUMMARY가 스스로 기록한 backstop — `progress-math.ts`의 `aggregate()` 함수를 실제 매니페스트로 독립 실행해 100%(반올림 결함 0건)를 수치로 확인했으나, 이는 실사용자의 진짜 진도 데이터를 건드리지 않기 위해 화면을 통한 종단 확인은 의도적으로 생략한 것 — 계산 로직 자체는 강한 증거로 검증됐고 화면 렌더링 파이프라인은 Phase 2·3에서 이미 검증된 기존 기능이므로 리스크는 낮지만, 사용자가 실제로 전 레슨을 마치는 시점에 최종 확인이 필요하다"
---

# Phase 5: Step 2·3 콘텐츠와 프로젝트 가이드 Verification Report

**Phase Goal:** 학습자가 커리큘럼 전체(Step 2 풀스택·LLM 심화 + Step 3 RAG·오케스트레이션 개요)와 실습 프로젝트 5종 준비 가이드를 사이트에서 학습할 수 있다
**Verified:** 2026-08-26
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Step 2의 7개 모듈 전 레슨이 심화 콘텐츠로 작성되어 읽을 수 있다 | ✓ VERIFIED | 12개 Step 2 `.mdx` 파일 전부 `hasContent: true`, `check-lesson-structure.mjs` 7개 검사(L1~L7) 통과, `check-brand.mjs` 0건. 각 레슨 6단 헤딩·해보기 2~3개·정답 블록·단어 표(5~8행) 확인 |
| 2 | Step 3의 7개 모듈이 개념·용어 중심 개요 콘텐츠로 작성되어, 개강 후 학습 용어를 미리 알 수 있다 | ✓ VERIFIED (see human-verify #4) | 13개 Step 3 `.mdx` 파일 전부 `hasContent: true`, 동일 구조 게이트 통과. 전 레슨이 "지금 실행할 필요 없음" 안내가 붙은 읽기용 스니펫 1개씩만 사용, 설치·실행 명령 0건(grep 확인). 학습 목표 형식이 D-62의 정의·용도·파이프라인 위치 3요소를 따름. `3-4`·`3-6`(고위험군) 전문 직독 결과 완성 구현 코드나 운영 런북은 없었으나, 일부 레슨의 비교표가 "언제 X를 고르나" 형태를 띠어 사람의 최종 깊이 판정이 권장됨(아래 human-verify 참고) |
| 3 | 커리큘럼 실습 프로젝트 5종이 각각 개요·사전 준비 가이드 레슨으로 제공된다(재현 아님) | ✓ VERIFIED | `2-4-project-ai-shop-frontend`·`2-6-project-ai-shop-backend`·`3-2-project-rag-agent`·`3-5-project-orchestration`·`3-7-project-ax-launch` 5편 전부 존재, `hasContent: true`. 전문 직독 결과 ④가 전부 "사전 준비 체크리스트" 표(코드 아님), ⑥이 준비 완료 판정 체크박스. 완성 구현 코드·완결 DB 스키마·단계별 튜토리얼 0건(grep + 직독 이중 확인) |
| 4 | 전체 커리큘럼 진행률이 100%까지 도달 가능하고, Making-of 페이지가 구현→검증→배포 과정을 기록한다 | ✓ VERIFIED (see human-verify #5) | `check-manifest.mjs` 13개 불변식 통과(35 레슨/19 모듈/4200분). 05-13 SUMMARY가 실제 `progress-math.ts`의 `aggregate()` 함수를 `.velite/lessons.json` 전체에 "전부 완료"로 독립 실행해 overall/Step별/모듈별 전부 정확히 100%(반올림 결함 0건)임을 수치로 확인. `docs/making-of.md`에 "5단계 — Step 2·3 레슨 25편 + 프로젝트 준비 가이드 5편" 섹션 존재, KANT 언급 0건 |

**Score:** 4/4 truths verified (0 present-but-behavior-unverified)

### Supporting Must-Haves (from 13 PLAN frontmatters, aggregated)

| Must-have | Status | Evidence |
|---|---|---|
| `check-lesson-structure.mjs`가 step-1/2/3 전 디렉터리 순회 (D-71) | ✓ VERIFIED | 스크립트 코드 직독: `LESSON_DIRS = ['step-1','step-2','step-3']`. 실행 결과 "35개 레슨, 7개 검사 통과" |
| `ALLOWED_FENCE_LANG_PREFIXES` 8개 언어 확장, 단일 정의처 (D-72) | ✓ VERIFIED | 스크립트 38~41행에 `typescript, tsx, javascript, jsx, json, html, css, yaml` 추가 확인, 한 곳에서만 정의 |
| 프론트매터 8개 필드가 `hasContent` 제외 바이트 단위 불변 (D-13) | ✓ VERIFIED | `git diff eb74e04..HEAD`로 Step 1·2·3 35개 파일 전부의 frontmatter(hasContent 제외) 비교 — 차이 0건 |
| L7 문단 길이 200자 상한이 실제로 작동 (사용자 리뷰 후 추가) | ✓ VERIFIED | 코드 직독 + 실증: 임시로 250자 단락을 주입해 게이트가 실제로 실패(`L7 (2-4-project-ai-shop-frontend): body paragraph is 250 chars`)하는 것을 확인 후 원복, 재통과 확인 |
| `EXPECTED_HAS_CONTENT_COUNT`=35, `EXPECTED_HAS_CONTENT_SLUGS` 일치 (D-78) | ✓ VERIFIED | `check-manifest.mjs` 실행 — "all 13 invariants passed (35 lessons, 19 modules, total 4200 minutes)" |
| "콘텐츠 준비 중" 분기 코드 유지 (D-79) | ✓ VERIFIED | `src/app/lesson/[lessonId]/page.tsx:54-60`에 `lesson.hasContent ? (...) : (...콘텐츠 준비 중입니다...)` 삼항 분기 존재 |
| KANT 등 금지어 0건 (D-02) | ✓ VERIFIED | `check-brand.mjs` — "위반 없음 — 86개 파일 검사 완료" |

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/content/lessons/step-2/*.mdx` (12편) | 심화 콘텐츠, hasContent:true | ✓ VERIFIED | 전부 존재, 게이트 통과 |
| `src/content/lessons/step-3/*.mdx` (13편) | 개요 콘텐츠, hasContent:true | ✓ VERIFIED | 전부 존재, 게이트 통과 |
| `2-4/2-6/3-2/3-5/3-7-project-*.mdx` (5편) | 프로젝트 준비 가이드 형식 | ✓ VERIFIED | 전문 직독 완료, 경계 준수 확인 |
| `scripts/check-lesson-structure.mjs` | Step 1/2/3 확대 + L7 신설 | ✓ VERIFIED | 코드 직독 + 실행 + L7 실증 테스트 |
| `scripts/check-manifest.mjs` | 35/19/4200 불변식 | ✓ VERIFIED | 실행 결과 확인 |
| `docs/making-of.md` | Phase 4·5 기록 갱신 | ✓ VERIFIED | 5단계 섹션 존재, KANT 0건 |
| `src/app/lesson/[lessonId]/page.tsx` | 준비 중 분기 유지 | ✓ VERIFIED | 코드 직독 확인 |
| `.planning/phases/05-step-2-3/deferred-items.md` | 사전 발견 lint 부채 기록 | ✓ VERIFIED | 존재, known_open_items와 일치 |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `2-4-project-ai-shop-frontend` ② | `2-1`/`2-2`/`2-3` 레슨 slug | 복습 포인터 | ✓ WIRED | slug 문자열이 본문에 그대로 인용됨 |
| `2-6-project-ai-shop-backend` ② | `2-4-project-ai-shop-frontend` | "짝이 되는 프론트엔드" 포인터 | ✓ WIRED | 상호 참조 확인 |
| `3-2-project-rag-agent` ② | `3-1-vector-search-basics`, `3-1-hybrid-search-reranking`, `2-7-prompt-patterns` | 복습 포인터 | ✓ WIRED | slug 인용 확인 |
| `3-5-project-orchestration` ② | `3-4-multi-agent-structure`, `3-4-webhook-schedule-hitl`, `3-4-n8n-langgraph` | 복습 포인터 | ✓ WIRED | slug 인용 확인 |
| `3-7-project-ax-launch` ② | 앞선 4개 프로젝트 가이드 + `2-7`, `3-6` | 복습 포인터(커리큘럼 도착점) | ✓ WIRED | slug 인용 확인 |
| 35개 레슨 `hasContent:true` | `getOrderedLessons()` → 일정·진행률 | Velite 매니페스트 파생 | ✓ WIRED | `check-manifest.mjs` 통과 + 05-13 SUMMARY의 `aggregate()` 독립 실행 결과(100%, 반올림 결함 0건) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| 구조 게이트가 35편 전부 통과 | `node scripts/check-lesson-structure.mjs` | "35개 레슨, 7개 검사 통과" | ✓ PASS |
| 매니페스트 불변식 13개 통과 | `node scripts/check-manifest.mjs` | "all 13 invariants passed (35 lessons, 19 modules, total 4200 minutes)" | ✓ PASS |
| KANT 브랜드 게이트 | `node scripts/check-brand.mjs` | "위반 없음 — 86개 파일 검사 완료" | ✓ PASS |
| L7 200자 상한이 실제로 작동하는가(합성 위반 주입) | 임시로 250자 단락 삽입 후 게이트 재실행, 원복 후 재실행 | 위반 시 즉시 실패(exit code, 에러 메시지 정확) → 원복 후 35/35 재통과 | ✓ PASS |
| Node/build 산출물 대비 5개 레슨 frontmatter 불변성 | `git diff` (Phase 5 시작 전 baseline `eb74e04` vs HEAD) | 35개 파일 전부 hasContent 외 필드 diff 0건 | ✓ PASS |
| `e2e-progress.mjs` 자체 실행 | `node --env-file=.env.local scripts/e2e-progress.mjs` | 이 검증 세션에서는 `.env.local` 파일 읽기 권한이 거부되어 재실행 불가 (Bash 도구가 이 경로 접근을 자체 차단) | ? SKIP — 05-13 SUMMARY가 이미 exit 0을 기록했고, 계산 로직 자체는 독립 실행으로 재확인(위 표 참고). 화면 종단 확인은 human-verify #5로 이월 |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|---|---|---|---|---|
| CONT-05 | 05-01, 05-02~05-13 전체 | 커리큘럼 실습 프로젝트 5종은 개요·사전 준비 가이드 레슨으로 제공된다(재현 아님) | ✓ SATISFIED | 5편 전부 존재·검증(위 표). `REQUIREMENTS.md` traceability 테이블이 `CONT-05 \| Phase 5 \| Complete`로 정확히 반영 (이 검증 시점 기준 실제로 5편 전부 완성된 상태와 일치 — 05-01 완료 시점에 조기 마킹됐던 문제는 이제 실체와 일치함) |

**Orphaned requirements:** 없음 — `.planning/REQUIREMENTS.md`가 Phase 5에 매핑하는 요구사항은 CONT-05 하나뿐이며 그 외 어떤 plan도 CONT-05 외 requirement를 선언하지 않았다.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| — | — | 없음 | — | `src/content/lessons/step-2/`, `step-3/` 전체 grep(`TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER\|준비 중\|coming soon` 등) 결과 실질 위반 0건. 매칭된 2줄("나중에 추가")은 3-7 레슨 본문의 정상적 교육 콘텐츠(개인정보 정책은 "나중에 추가하면 안 된다"는 서술)이며 스텁 마커가 아님 |

### Depth-Boundary Scrutiny (specific to this phase's risk profile)

**프로젝트 가이드 5종 경계(D-66/D-67) — 전문 직독 결과:**
5편 모두 ④ 절이 코드가 아닌 "사전 준비 체크리스트" 표이고, ⑥ 절이 체크박스형 "핵심 정리"로 끝난다. 완성된 API 구현·완결 DB 스키마·단계별 튜토리얼은 어디에도 없다. 유일한 코드 펜스는 `.env.local` 키 이름만 나열한 예시(`text` 언어)와 감사로그 필드명 나열뿐이며, 실행 가능한 구현 코드는 0건이다. "구현해"·"함수를 작성" 류 지시문도 0건. **경계는 지켜졌다고 판단.**

**Step 3 깊이 기준(D-62~D-65) — 고위험 레슨 전문 직독 결과:**
사용자가 승인한 트리밍 기준(`3-1-vector-search-basics`, "이제 맞다" 재승인, 05-08 SUMMARY 기록)과 비교했을 때, 13편 모두 설치·실행 지시 0건, 모든 코드가 "지금 실행할 필요 없음" 안내가 붙은 읽기용 스니펫 1개뿐이라는 형식 규칙은 지켜졌다. 다만 `3-4-n8n-langgraph`("언제 어느 쪽을 고르나"), `3-6-structured-output-canary`(검증 실패 시 선택지 3가지 "언제 적합한가"), `3-4-multi-agent-structure`(순차/병렬/감독자 "언제 쓰나")의 개념 설명(③) 절에 카테고리 비교표가 들어 있다. 이 표들은 D-62(b) "언제 쓰는지/왜 필요한지 말할 수 있다"는 명시적 학습 목표를 채우는 것으로 읽을 수 있어 규칙 위반으로 단정하기는 어렵고, 05-08이 명시적으로 금지한 "chunk-size tuning trade-off·operating tip류 수치 가이드"와는 성격이 다르다(수치 임계값은 오직 판단형 해보기의 "모범 답안 예" 안에만 등장 — 예: 카나리 비율 "5~10%로 시작"). 그러나 이 depth 재승인("이제 맞다")은 3-1·3-1-hybrid·3-2 세 편에만 실사용자가 직접 적용됐고, 05-09~05-12에서 병렬 집필된 나머지 10편은 사람이 개별 확인하지 않았다 — **최종 깊이 적정성 판단은 사람이 한 번 더 봐야 한다(human-verify #4로 이월, gap이 아니라 권장 확인).**

## Gaps Summary

**차단 사유(blocker) 없음.** ROADMAP의 4개 Success Criteria와 13개 Plan의 must_haves가 코드베이스 증거로 실질 검증됐다. 남은 항목은 전부 사람의 최종 확인이 필요한 human-verify 항목이며, 이 중 4개는 이미 STATE.md/05-13 SUMMARY에 backstop으로 기록된 기존 항목이고, 1개(Step 3 depth 최종 확인)는 이번 검증에서 code-review로는 판정 불가능한 콘텐츠 품질 경계로 새로 식별해 추가했다. `status: human_needed`로 분류한 이유는 정확히 이 5개 항목 때문이며, 어느 것도 코드·게이트 실패에 근거하지 않는다.

**MVP 모드 태그 불일치(정보성):** ROADMAP.md는 이 phase에 `mode: mvp`를 붙였으나 목표 문구가 영문 "As a X, I want Y, so that Z." 정규식과 맞지 않는 한국어 서술형이다(`gsd-tools query user-story.validate` 확인: valid=false). 이 프로젝트의 다른 모든 phase도 같은 서술형을 쓰므로, 이는 phase 5만의 문제가 아니라 이 프로젝트 전체와 MVP 모드 검증기의 형식 가정이 어긋나는 구조적 불일치로 보인다. 검증을 거부하는 대신 ROADMAP Success Criteria를 must-haves 계약으로 삼아 표준 goal-backward 검증을 진행했다 — 사용자가 원하면 `mode: mvp` 태그를 제거하거나 목표 문구를 영문 템플릿으로 재작성할 수 있다.

---

*Verified: 2026-08-26*
*Verifier: Claude (gsd-verifier)*
