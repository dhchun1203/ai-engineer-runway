---
phase: 04-step-1
plan: 04
subsystem: content
tags: [mdx, eli5, python, content]

# Dependency graph
requires:
  - phase: 04-step-1
    plan: 01
    provides: eli5 × 6단 집필 표준 (승인된 파일럿 `1-3-python-variables-and-types.mdx`)
provides:
  - "`1-3-python-functions-and-io.mdx` — 함수·예외 처리·파일 입출력 레슨 본문, `hasContent: true`"
affects: [04-07 (종단 게이트가 EXPECTED_HAS_CONTENT_COUNT를 2 → 11로 올릴 때 이 파일이 포함됨)]

actuals:
  tokens: 3153
  tasks: 1
  commits: 1

tech-stack:
  added: []
  patterns:
    - "eli5 × 6단 골격 그대로 재사용, Wave 1(파일럿)이 만든 회원 정보 소재(name/age/height)를 이어받아 함수·예외·파일 입출력으로 확장"

key-files:
  created: []
  modified:
    - src/content/lessons/step-1/1-3-python-functions-and-io.mdx

key-decisions:
  - "함수 자판기 비유의 3열 표에서 매개변수/인자/반환값 세 개념을 자판기 부품에 각각 대응시켰다 — 개념 설명 절 안에서 이 구분을 짚어야 한다는 plan 지시를 표로 압축"
  - "예제 데이터는 파일럿의 회원 정보(김지현/이민준)를 그대로 재사용하고, 세 번째 회원(박서연)의 나이 값을 의도적으로 문자열 '스물아홉'으로 넣어 예외가 실제로 1회 발생하도록 구성"

requirements-completed: [CONT-02, CONT-03]

duration: 단일 세션
completed: 2026-08-25
status: complete
---

# Phase 4 Plan 4: 1-3-python-functions-and-io (함수·예외·파일 입출력) Summary

**Python 함수·예외 처리·파일 입출력 레슨을 승인된 eli5 × 6단 표준으로 신규 작성하고, 예제(`members_io.py`)를 저장소 밖 임시 디렉터리에서 실제 실행해 예외 발생·파일 생성·재읽기를 확인했다.**

## Performance

- **Tasks:** 1/1 완료
- **Commits:** 1 (`f817dd6`)
- **Files modified:** 1 (`1-3-python-functions-and-io.mdx`)

## Accomplishments

- `1-3-python-functions-and-io.mdx` 본문을 6단 골격(학습 목표 → 왜 배우나 → 개념 설명 → 실무 예제 → 실무 팁 → 핵심 정리 및 스스로 점검)으로 신규 작성, `hasContent: false → true`
- 파일럿의 회원 정보 소재(name/age/height, 김지현·이민준)를 그대로 이어받아 변수·자료형·조건문·반복문 재설명 없이 함수·예외·파일 입출력으로 자연스럽게 확장
- 개념 설명에 함수=자판기(매개변수·인자·반환값 3열 표), 예외=안전망(`except` 이름 지정 경고 포함), 파일=편지(with 블록·utf-8 인코딩) 세 비유를 배치
- 실무 예제(`members_io.py`)는 함수 정의 → `try`/`except ValueError`로 잘못된 나이 값 방어 → `with open(..., encoding="utf-8")`로 저장·재읽기까지 한 파일 안에서 자급자족
- `### 해보기` 3개(매개변수 추가, 예외 2회로 늘리기, 파일명 바꾸기(선택)) + 접힌 정답 블록, 스스로 점검 2문항(하나는 `except:` 위험 복습) 모두 정답 블록 포함
- `**이 레슨의 단어**` 표 7행(함수/매개변수/인자/반환값/예외/파일/인코딩)

## Task Commits

1. **Task 1: 1-3-python-functions-and-io 본문 작성** — `f817dd6` (feat) — 본문 전면 신규 작성(프론트매터 `hasContent` 한 줄만 변경), 예제 로컬 실행 검증 포함

## Files Created/Modified

- `src/content/lessons/step-1/1-3-python-functions-and-io.mdx` — 본문 신규 작성, 프론트매터 `hasContent` 한 줄만 변경(나머지 7개 필드 바이트 단위 불변, `git diff`로 확인)

## Example Execution Verification

저장소 밖 임시 디렉터리(`%TEMP%\...\scratchpad\lesson-test\`)에서 `members_io.py`를 `py members_io.py`로 실제 실행했다.

**실제 콘솔 출력 (Windows 콘솔 코드페이지가 UTF-8이 아니라 한글이 mojibake로 보였지만, 파일에 실제로 쓰인 바이트는 아래에서 UTF-8로 올바르게 확인됨):**
```
'박서연'의 나이 값이 잘못되었습니다: '스물아홉' - 건너뜁니다.
---
members.txt 내용:
김지현 - 나이 27세, 키 168.3cm
이민준 - 나이 34세, 키 175.5cm
```
(위 텍스트는 콘솔 원본 출력이 아니라, `members.txt`를 `xxd`/`iconv`로 UTF-8 디코딩해 정합성을 확인한 실제 내용을 그대로 옮긴 것)

- (a) 예외 1회 발생·캐치: `ValueError`가 세 번째 회원("박서연", 나이 값 `"스물아홉"`)에서 발생, `except ValueError:`가 잡고 경고 메시지를 출력한 뒤 `continue`로 다음 회원으로 진행 — 확인
- (b) 파일 생성: `members.txt`가 스크립트와 같은 디렉터리에 상대 경로로 생성됨 — 확인 (`xxd`로 바이트 확인, UTF-8 정상 인코딩)
- (c) 재읽기 출력: 저장 직후 다시 `open(..., "r", encoding="utf-8")`로 열어 두 명(김지현·이민준)의 요약이 정상적으로 다시 출력됨 — 확인
- 저장소 안에는 실행 데이터 파일이 생기지 않았음 — `git status --porcelain`에 `members.txt` 없음 확인 (`## Self-Check` 참고)

**참고(콘텐츠에는 반영하지 않음):** 이 세션의 Windows 콘솔(git-bash 경유 PowerShell/cmd 둘 다)이 한글 `print()` 출력을 mojibake로 표시했다. `open(..., encoding="utf-8")`로 쓴 파일 자체는 바이트 단위로 정확했으므로 이는 콘솔 코드페이지 표시 문제이지 코드나 파일 인코딩의 결함이 아니다. 파일럿(`1-3-python-variables-and-types`)도 같은 방식으로 한글을 `print()`하며, RESEARCH.md·04-01-SUMMARY.md 어디에도 이 콘솔 표시 문제가 지적되지 않았다 — 실제 사용자 PowerShell 터미널(이 세션의 격리된 실행 환경이 아닌)에서는 코드페이지 설정에 따라 정상적으로 보일 가능성이 높다. 본문에는 추가 troubleshooting 문구를 넣지 않았다(D-58/pilot 패턴 유지, plan의 acceptance criteria가 요구하지 않음).

## Decisions Made

- 함수/예외/파일 세 비유(자판기/안전망/편지) 순서를 plan 지시대로 그대로 채택, 각 절 앞에 이모지 1개(🥤/🛟/✉️)
- 3열 표(자판기 비유 · 함수 개념 · 예시)로 매개변수·인자·반환값 세 개념을 한 번에 구분 — plan의 "매개변수와 인자의 차이를 한 줄로 구분" 요구를 표로 압축해 처리
- `### 해보기` 3개 모두 포함(2~3 허용 범위 안에서 3개 선택) — 세 번째는 "(선택)"으로 명시해 필수 아님을 표시하면서도 구조 게이트(L2: 2~3개) 통과

## Deviations from Plan

None — plan 그대로 실행됨.

## Issues Encountered

없음. `npm run build`는 fresh worktree에 `node_modules`가 없어 `npm ci`로 먼저 설치했고, `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` 환경 변수가 없어 빌드가 실패하길래 `.env*` 파일을 쓰지 않고 커맨드에 인라인으로 더미 값을 전달해 빌드를 통과시켰다(레슨 콘텐츠와 무관한 fresh-worktree 인프라 이슈, Rule 3 범위의 blocking issue로 자동 처리 — 저장소 파일은 변경하지 않음).

## Known Stubs

None.

## Threat Flags

None — plan의 threat_model에 이미 등록된 표면(파일 쓰기 경로, 예외 처리) 범위 안에서만 작업했다.

## User Setup Required

None.

## Next Phase Readiness

- `check-manifest.mjs`는 계획대로 이 Plan에서 실행하지 않았다(의도적 red 유지) — Plan 07이 `EXPECTED_HAS_CONTENT_COUNT`를 2 → 11로 올릴 때 이 레슨이 포함되어야 한다
- `globals.css`/`scripts/check-manifest.mjs` 미변경 확인 (`git status --short` 결과 이 레슨 파일 1개만 변경)

---
*Phase: 04-step-1*
*Completed: 2026-08-25*
