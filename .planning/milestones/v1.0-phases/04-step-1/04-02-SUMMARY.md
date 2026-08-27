---
phase: 04-step-1
plan: 02
subsystem: content
tags: [mdx, eli5, wave-2, module-1-1]

requires:
  - phase: 04-step-1
    plan: "01"
    provides: "eli5 × 6단 집필 표준 실증판(1-3 파일럿) + scripts/check-lesson-structure.mjs 게이트"
provides:
  - "1-1 모듈(온보딩 & 학습 환경 세팅) 2편 본문 — 커리큘럼 지도·사이트 사용법·하루 루틴, 개발 환경 세팅 5종"
affects: [04-step-1 Wave 2 (04-03~06 병행), 04-07 (check-manifest 상수 갱신)]

actuals:
  tokens: 4300
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "04-01 승인 표준(eli5 × 6단, `### 해보기` + `<details>` 정답, 이 레슨의 단어 표)을 그대로 복제"
    - "Windows `py` 1차 안내 + macOS `python3` 한 줄 병기(D-58) — powershell 펜스 안에는 `py`/`code`/`git`만, `python --version`은 실무 팁 산문에서만 사용"

key-files:
  created: []
  modified:
    - src/content/lessons/step-1/1-1-course-orientation.mdx
    - src/content/lessons/step-1/1-1-dev-environment-setup.mdx

key-decisions:
  - "1-1-course-orientation Step별 레슨 편수 표(10/12/13편)는 실제 디렉터리 파일 수(step-1=10, step-2=12, step-3=13, 합계 35)로 직접 세어 채움 — curriculum.md 원문은 모듈 목록만 있고 레슨 편수를 명시하지 않아 코드 기준으로 확정"
  - "1-1-dev-environment-setup 핵심 정리 요약 줄에서 `python3 --version` 리터럴을 제거하고 `python3 명령`으로 바꿈 — acceptance criteria가 이 문자열의 '정확히 1회' 등장을 요구했고, 실무 예제 절에 이미 1회 있었으므로 중복 표현을 피함"

requirements-completed: [CONT-02, CONT-03]

duration: 단일 세션(worktree 병렬 executor)
completed: 2026-08-25
status: complete
---

# Phase 4 Plan 2: 1-1 모듈(온보딩 & 학습 환경 세팅) 2편 Summary

**Step 1 첫 모듈 2편(커리큘럼 지도·사이트 사용법·하루 루틴 / VS Code·Python·Git·GitHub·Supabase 개발 환경 세팅)을 승인된 eli5 × 6단 표준으로 작성하고 `hasContent: true`로 전환했다.**

## Performance

- **Tasks:** 2/2 완료
- **Commits:** 2 (Task 1, Task 2)
- **Files modified:** 2 (`1-1-course-orientation.mdx`, `1-1-dev-environment-setup.mdx`)

## Accomplishments

- `1-1-course-orientation.mdx` — 5주 여정 지도(Step 1→2→3, 19모듈·35레슨·5프로젝트), 실습 프로젝트 5종의 역할, 이 사이트 사용법(홈·완료 버튼·`/schedule`), 하루 루틴을 다뤘다. ④ 실무 예제는 코드 대신 `text` 펜스 하루 학습 기록 템플릿(오늘 배운 것/막힌 것/내일 할 일)으로 작성했고 `### 해보기` 2개를 붙였다.
- `1-1-dev-environment-setup.mdx` — VS Code·Python·Git·GitHub 계정·Supabase 계정 다섯 도구를 "뒤 레슨에서 필요해지는 순서"로 안내했다. 설치 확인은 `powershell` 펜스 한 개(`code --version` / `py --version` / `git --version`)로 묶었고, `python --version`은 펜스 밖 실무 팁 산문에서만 Windows 스토어 스텁 문제(RESEARCH Pitfall 2, 이 개발 환경에서 재현됨)를 설명하는 데 썼다. `### 해보기` 3개(버전 확인, GitHub 빈 저장소 생성, 선택: `.py` 파일 저장·재열기).
- 두 레슨 모두 `node scripts/check-brand.mjs`(85개 파일, 위반 0), `node scripts/check-lesson-structure.mjs`(3개 레슨 — 파일럿 + 이 Plan 2편, 6개 검사 통과), `npm run build`(정적 페이지 44개 생성)를 통과했다.
- 실행자가 `py --version`(Python 3.12.10), `git --version`(git version 2.52.0.windows.1), `code --version`(1.131.0)을 이 개발 환경에서 직접 실행해 본문의 예상 출력 설명과 일치함을 확인했다.

## Task Commits

1. **Task 1: 1-1-course-orientation — 5주 여정의 지도와 하루 루틴** — `ebbcbb8` (feat)
2. **Task 2: 1-1-dev-environment-setup — 공구 챙기기** — `fc68d5e` (feat)

## Files Created/Modified

- `src/content/lessons/step-1/1-1-course-orientation.mdx` — 본문 신규 작성(프론트매터는 `hasContent`만 `false → true`, 나머지 7개 필드 바이트 단위 불변)
- `src/content/lessons/step-1/1-1-dev-environment-setup.mdx` — 본문 신규 작성(동일 규칙)

## Decisions Made

- **레슨 편수 표(10/12/13편)는 실제 코드 기준으로 채움** — `curriculum.md`가 모듈 제목만 나열하고 편수를 명시하지 않아, `find src/content/lessons/step-N -name '*.mdx' | wc -l`로 직접 세어(10/12/13, 합계 35) 지도 표에 넣었다. `src/content/modules.ts`의 모듈 19개·프로젝트 5개(`isProject: true`)도 같은 방식으로 대조 확인했다.
- **`python3 --version` 리터럴 1회 제한** — acceptance criteria가 이 정확한 문자열의 "정확히 1회" 등장을 요구했다. 초안에는 실무 예제 절(1회)과 핵심 정리 요약(1회)에 두 번 등장했는데, 요약 쪽 표현을 `python3 명령으로 확인한다`로 바꿔 리터럴 문자열은 실무 예제 절 한 곳에만 남겼다.

## Deviations from Plan

None - plan executed exactly as written. Wave 2 공통 규칙(`check-manifest.mjs` 미실행/미수정, `globals.css` 미변경, `src/` 아래 `.mdx` 외 파일 미변경)을 모두 준수했다.

### Auto-fixed Issues

None.

## Environment Note (deviation-adjacent, not a plan violation)

이 worktree는 `node_modules`가 비어 있는 신선한 체크아웃이었다 — `npm ci`로 523개 패키지를 설치한 뒤 빌드가 정상 동작했다(parallel_execution 지침에 명시된 대로 허용된 조치). `npm run build`는 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` 환경변수가 없으면 `/schedule` 페이지 데이터 수집 단계에서 실패한다 — `.env*` 파일을 새로 쓰지 않고 두 값을 커맨드라인 인라인 환경변수(placeholder 값)로만 전달해 빌드를 통과시켰다. 두 값은 저장소에 커밋되지 않았다.

## Issues Encountered

None.

## Known Stubs

None — 두 레슨 모두 완결된 본문이며 하드코딩된 빈 값이나 "준비 중" 플레이스홀더가 없다.

## Threat Flags

None — 새 네트워크 엔드포인트·인증 경로·스키마 변경 없음. 두 레슨 모두 정적 MDX 콘텐츠만 추가했다.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 04-01에서 확정된 표준이 다른 executor 없이도(Task 2에서 판단이 필요한 지점 — 표 편수·용어 표 항목 수 등 — 를 커리큘럼 원문·모듈 파일에서 직접 검증하는 방식으로) 재현 가능함을 확인했다 — 04-03~06도 같은 방식으로 병행 가능하다.
- Plan 07이 `scripts/check-manifest.mjs`의 `EXPECTED_HAS_CONTENT_COUNT`(2 → 11)와 `EXPECTED_HAS_CONTENT_SLUGS`에 이 2개 slug(`1-1-course-orientation`, `1-1-dev-environment-setup`)를 포함해 반영해야 한다.
- `python3 --version` 리터럴 카운트처럼 정확한 문자열 등장 횟수를 요구하는 acceptance criteria가 있다는 점을 다른 Wave 2 executor도 자기 레슨에서 동일하게 주의해야 한다(pilot에는 없던 신규 negative-gate 패턴).

---
*Phase: 04-step-1*
*Completed: 2026-08-25*

## Self-Check: PASSED

- FOUND: src/content/lessons/step-1/1-1-course-orientation.mdx
- FOUND: src/content/lessons/step-1/1-1-dev-environment-setup.mdx
- FOUND: .planning/phases/04-step-1/04-02-SUMMARY.md
- FOUND commit: ebbcbb8
- FOUND commit: fc68d5e
