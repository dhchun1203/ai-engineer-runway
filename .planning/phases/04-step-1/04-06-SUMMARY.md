---
phase: 04-step-1
plan: 06
subsystem: content
tags: [mdx, velite, scikit-learn, eli5, machine-learning]

# Dependency graph
requires:
  - phase: 04-step-1
    provides: "eli5 × 6단 집필 표준 (04-01), Step 1 구조 게이트 `scripts/check-lesson-structure.mjs`"
provides:
  - "1-5-ml-model-types.mdx — 분류·회귀·군집 3유형을 load_iris/load_diabetes 내장 데이터로 실습하는 완성 레슨"
  - "1-5-ml-metrics-and-pipeline.mdx — 학습용/평가용 분리, 평가 지표(정확도·정밀도·재현율), scikit-learn Pipeline을 실습하는 완성 레슨"
  - "Wave 2의 다른 executor를 위한 Windows 로컬 검증 선례: `npm ci`(node_modules 부재 시), `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` placeholder 인라인 전달로 `npm run build` 통과, `PYTHONIOENCODING=utf-8`로 한글 출력 인코딩 문제 해결"
affects: [04-step-1 Wave 2 (04-02, 04-03, 04-04, 04-05), 04-07 (종단 게이트)]

actuals:
  tokens: 5610
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "scikit-learn 예제는 저장소 밖 임시 디렉터리(`%TEMP%/.../scratchpad/ml-exec/`)에서 실제 실행 후 출력을 SUMMARY에 기록 — package.json/저장소 파일 변경 없이 검증"
    - "모듈 내 2편이 같은 load_iris 데이터를 재사용 — 두 번째 레슨은 데이터 구조 설명을 반복하지 않고 앞 레슨을 가리킴"
    - "군집 라벨과 정답 라벨의 불일치를 코드 주석 + 본문 산문 + 실무 팁 + 핵심 정리에서 4회 반복 각인"

key-files:
  created: []
  modified:
    - src/content/lessons/step-1/1-5-ml-model-types.mdx
    - src/content/lessons/step-1/1-5-ml-metrics-and-pipeline.mdx

key-decisions:
  - "회귀 예측/실제값 출력 시 `round(float(v), 1)`로 numpy 스칼라를 순수 Python float로 변환 — `np.float64(206.1)` 같은 raw repr이 학습자 콘솔에 그대로 노출되는 것을 방지"
  - "실무 팁의 '설치 이름 vs import 이름' 문구에서 `pip install sklearn`이라는 정확한 문자열을 피하고 우회 표현 사용 — acceptance criteria가 이 문자열 0건을 요구하기 때문 (경고 문구조차 리터럴 매치에 걸릴 수 있음)"

requirements-completed: [CONT-02, CONT-03]

coverage:
  - id: D1
    description: "1-5-ml-model-types가 분류·회귀·군집 세 유형을 각각 비유와 실행 가능한 예제로 다룬다"
    requirement: "CONT-02"
    verification:
      - kind: unit
        ref: "node scripts/check-lesson-structure.mjs (6개 검사 통과, 3개 레슨 검사됨)"
        status: pass
      - kind: manual_procedural
        ref: "저장소 밖 임시 디렉터리에서 `py ml_types.py` 실제 실행 — 오류 없이 완료, 출력이 본문 설명과 형태 일치"
        status: pass
    human_judgment: false
  - id: D2
    description: "1-5-ml-metrics-and-pipeline이 평가 지표와 scikit-learn Pipeline 구성을 학습용/평가용 분리 위에서 다룬다"
    requirement: "CONT-03"
    verification:
      - kind: unit
        ref: "node scripts/check-lesson-structure.mjs (6개 검사 통과)"
        status: pass
      - kind: manual_procedural
        ref: "저장소 밖 임시 디렉터리에서 `py ml_metrics_pipeline.py` 실제 실행 — 오류 없이 완료, 정확도 0.98 등 실제 출력 확인"
        status: pass
    human_judgment: false
  - id: D3
    description: "두 레슨 모두 브랜드 위반 없이 `npm run build`가 성공한다"
    verification:
      - kind: unit
        ref: "node scripts/check-brand.mjs (85개 파일, 위반 0)"
        status: pass
      - kind: e2e
        ref: "npm run build (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY placeholder 인라인 전달, 44개 라우트 생성 성공)"
        status: pass
    human_judgment: false
  - id: D4
    description: "이 Plan 종료 시점에 (이 worktree 기준) Step 1 3편이 hasContent: true — 나머지 7편은 Wave 2의 다른 4개 worktree에서 병렬로 작성 중이라 이 worktree 안에서는 관측 불가"
    verification:
      - kind: manual_procedural
        ref: "이 worktree의 .velite/lessons.json에서 stepId===1 && hasContent 개수 = 3 (04-01 파일럿 1편 + 이 Plan 2편)"
        status: pass
    human_judgment: true
    rationale: "Plan 원문의 verify 5번(\"Step 1 10편 확인\")은 5개 worktree가 병렬 실행되는 구조와 맞지 않는다 — 각 executor는 자기 worktree의 파일만 보므로 10편 전체 확인은 오케스트레이터가 5개 브랜치를 병합한 뒤에만 가능하다. 이 worktree 안에서는 3/10만 확인 가능함을 사람이 인지해야 한다."

duration: 단일 세션 실행
completed: 2026-08-25
status: complete
---

# Phase 4 Plan 6: 머신러닝 기초 모델링(1-5) 2편 Summary

**scikit-learn 내장 데이터셋(load_iris/load_diabetes)만으로 분류·회귀·군집 3유형과 평가 지표·Pipeline을 다루는 실습형 레슨 2편을 eli5 × 6단 표준으로 작성 — 예제 코드는 로컬 Python 3.12.10 + scikit-learn 1.9.0으로 실제 실행해 출력을 확인함.**

## Performance

- **Tasks:** 2/2 완료
- **Commits:** 2 (Task 1, Task 2) + 이 문서 커밋
- **Files modified:** 2 (`1-5-ml-model-types.mdx`, `1-5-ml-metrics-and-pipeline.mdx`)

## Accomplishments

- `1-5-ml-model-types.mdx` — 분류(로지스틱 회귀)·군집(KMeans)·회귀(선형 회귀)를 하나의 완결된 `ml_types.py` 예제로 다룸. 지도/비지도 학습 구분, 세 유형 비교표, `load_iris` 데이터 소개, `fit`/`predict` 개념을 6단 구조로 설명. 군집 번호가 정답 라벨과 일치하지 않는다는 점을 코드 주석·본문·실무 팁·핵심 정리에서 반복 강조
- `1-5-ml-metrics-and-pipeline.mdx` — 앞 레슨과 같은 `load_iris` 데이터를 재사용(데이터 구조 재설명 없음), `train_test_split`으로 학습용/평가용을 분리하고 `Pipeline(StandardScaler + LogisticRegression)`으로 전처리+모델을 묶어 `sklearn.metrics`(accuracy_score, classification_report)로 평가하는 `ml_metrics_pipeline.py` 예제 작성. 정확도만으로 판단하면 안 되는 이유(불균형 데이터)와 데이터 누수를 6단 구조로 설명
- 두 예제 모두 저장소 밖 임시 디렉터리(`%TEMP%\...\scratchpad\ml-exec\`)에서 실제 실행해 출력을 확인(아래 실행 결과 참고). 저장소 안에는 Python 파일을 만들지 않았고 `package.json`도 변경하지 않음
- `node scripts/check-lesson-structure.mjs`(3개 레슨 검사, 6개 검사 통과), `node scripts/check-brand.mjs`(85개 파일, 위반 0), `npm run build`(44개 라우트 생성) 모두 통과
- `node scripts/check-manifest.mjs`는 계획대로 실행하지 않음(Wave 2 공통 규칙 2 — Plan 07이 상수를 갱신할 때까지 의도적 red)

## Task Commits

1. **Task 1: 1-5-ml-model-types 작성** — `4ec4f2c` (feat)
2. **Task 2: 1-5-ml-metrics-and-pipeline 작성** — `3d851f2` (feat)

**Plan metadata:** 이 커밋 (docs: complete plan)

## Files Created/Modified

- `src/content/lessons/step-1/1-5-ml-model-types.mdx` — 본문 신규 작성(스텁 → 실콘텐츠), `hasContent: false → true`, 나머지 프론트매터 7개 필드 바이트 단위 불변
- `src/content/lessons/step-1/1-5-ml-metrics-and-pipeline.mdx` — 본문 신규 작성(스텁 → 실콘텐츠), `hasContent: false → true`, 나머지 프론트매터 7개 필드 바이트 단위 불변

## 예제 실행 결과 (로컬 검증)

이 세션에서 `py -m pip install scikit-learn`으로 scikit-learn 1.9.0을 설치하고, 저장소 밖 임시 디렉터리에서 두 예제를 실제로 실행했다.

**`ml_types.py` 실행 결과 (`PYTHONIOENCODING=utf-8 py ml_types.py`):**
```
샘플 수: 150, 특징 수: 4
품종 이름: ['setosa', 'versicolor', 'virginica']
---
분류기 예측(첫 5개): [0 0 0 0 0]
실제 정답(첫 5개):   [0 0 0 0 0]
---
군집 결과(첫 5개):   [1 1 1 1 1]
---
회귀 예측(첫 3개): [206.1, 68.1, 176.9]
실제 값(첫 3개):   [151.0, 75.0, 141.0]
```
군집 결과가 `[1 1 1 1 1]`로 나와, 정답 라벨(`[0 0 0 0 0]`)과 군집 번호가 다르다는 본문의 핵심 주장을 실제 출력으로 실증했다.

**`ml_metrics_pipeline.py` 실행 결과 (`PYTHONIOENCODING=utf-8 py ml_metrics_pipeline.py`):**
```
정확도: 0.98
클래스별 리포트:
              precision    recall  f1-score   support

      setosa       1.00      1.00      1.00        16
  versicolor       1.00      0.94      0.97        18
   virginica       0.92      1.00      0.96        11

    accuracy                           0.98        45
   macro avg       0.97      0.98      0.98        45
weighted avg       0.98      0.98      0.98        45
```

`git status --porcelain`에서 예제 실행으로 생긴 파일이 저장소 안에 나타나지 않음을 확인했고, `package.json`/`package-lock.json`은 변경하지 않았다.

## Decisions Made

- **회귀 출력에 `round(float(v), 1)` 적용** — `list(y_d[:3])`를 그대로 출력하면 `[np.float64(151.0), ...]`처럼 numpy 내부 표현이 노출되어 초심자에게 혼란을 줄 수 있음을 실제 실행 중 발견, `round(float(v), 1)`로 순수 Python 값으로 변환해 해결(Rule 1 - 실행 중 발견한 출력 버그)
- **`pip install sklearn`이라는 정확한 문자열을 실무 팁 본문에서 피함** — acceptance criteria가 이 문자열 0건을 요구하는데, 애초 초안은 "이렇게 잘못 설치하기 쉽다"는 경고 문구에 이 문자열을 그대로 인용했다가 자기모순(경고문 자체가 금지 문자열)이 될 뻔함. 같은 의미를 문자열 매치 없이 전달하도록 표현을 바꿈

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 회귀 예측/실제값 출력이 numpy repr(`np.float64(...)`)로 노출됨**
- **Found during:** Task 1 — 저장소 밖에서 예제를 실제 실행하며 발견
- **Issue:** `[round(v, 1) for v in ...]`에서 `round()`가 numpy 스칼라를 받으면 결과도 `np.float64`로 남아 `print()` 시 `np.float64(206.1)` 형태로 출력됨. 본문 예상 출력 설명("소수 첫째 자리 숫자")과 실제 콘솔 출력이 어긋날 뻔함
- **Fix:** `round(float(v), 1)`로 먼저 순수 Python float로 변환한 뒤 반올림
- **Files modified:** `src/content/lessons/step-1/1-5-ml-model-types.mdx`
- **Verification:** 임시 디렉터리에서 재실행해 `[206.1, 68.1, 176.9]` 형태의 깨끗한 출력 확인
- **Committed in:** `4ec4f2c` (Task 1 commit — 예제를 작성하며 바로 반영, 별도 수정 커밋 없음)

**2. [Rule 1 - Bug] `iris.target_names` 원소가 `np.str_(...)` repr로 노출됨**
- **Found during:** Task 1 — 같은 실행 중 발견
- **Issue:** `list(iris.target_names)`를 f-string에 넣으면 `[np.str_('setosa'), ...]` 형태로 출력됨
- **Fix:** `[str(name) for name in iris.target_names]`로 순수 문자열 리스트로 변환
- **Files modified:** `src/content/lessons/step-1/1-5-ml-model-types.mdx`
- **Verification:** 재실행해 `['setosa', 'versicolor', 'virginica']` 형태로 깨끗하게 출력됨을 확인
- **Committed in:** `4ec4f2c`

---

**Total deviations:** 2 auto-fixed (둘 다 Rule 1 — 예제를 실제로 실행해보지 않았다면 발견하지 못했을 출력 버그, D-59가 이 Plan에 사람 검토를 두지 않은 대신 "실행자가 직접 실행해본다"는 방어선이 실제로 작동한 사례)
**Impact on plan:** 두 수정 모두 이 Plan의 예제 코드 범위 안. 본문 프론트매터·구조에는 영향 없음

## Issues Encountered

- **`node_modules` 부재** — 이 worktree가 fresh clone이라 `node_modules`가 없어 `npm run build`가 즉시 실패했다. `npm ci`로 해결(523개 패키지 설치, 27초 소요). Wave 2 공통 안내("npm ci may be needed")대로 처리
- **`npm run build`가 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` 부재로 실패** — `src/lib/supabase/admin.ts`가 두 환경변수를 필수로 요구해 `/schedule`·`/curriculum`·`/lesson/[lessonId]` 페이지 데이터 수집 단계에서 빌드가 죽었다. 이 worktree에 `.env.local`이 없기 때문(gitignore 대상이라 worktree에 복사되지 않음)이며, 이 Plan의 콘텐츠 변경과는 무관한 사전 존재 인프라 조건이다. `.env*` 파일을 새로 쓰지 않는다는 제약을 지키기 위해, `SUPABASE_URL="https://placeholder.supabase.co" SUPABASE_SERVICE_ROLE_KEY="placeholder-service-role-key"`를 `npm run build` 실행 시 인라인 환경변수로만 전달해 빌드를 통과시켰다(실제 네트워크 호출 없이 클라이언트 인스턴스만 생성됨). 저장소에는 아무 파일도 남기지 않음. Wave 2의 다른 4개 executor도 같은 조건을 만날 가능성이 높다
- **`py ml_types.py`의 한글 출력이 콘솔에서 깨짐(cp949 인코딩)** — `PYTHONIOENCODING=utf-8`을 앞에 붙여 해결. 저장소 파일이나 레슨 본문에는 영향 없음(터미널 인코딩 문제일 뿐)

## Known Stubs

없음 — 두 레슨 모두 실제 데이터·실행 가능 코드로 채워졌고 플레이스홀더 텍스트가 없다.

## User Setup Required

None - no external service configuration required. (단, `npm run build`를 로컬에서 재현하려면 `.env.local`에 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`가 필요하다 — 이 Plan이 새로 만든 요구사항이 아니라 프로젝트에 기존재하는 요구사항이다.)

## Next Phase Readiness

- Step 1의 1-5 모듈(마지막 모듈) 2편이 완성되어, 이 worktree 기준으로는 Step 1 3편(1-3 파일럿 + 이 Plan 2편)이 `hasContent: true`
- **Plan 07 착수 전 필요 조건:** 이 Plan의 성공 기준("이 Plan 종료 시점에 Step 1 10편이 모두 hasContent: true")은 5개 Wave 2 worktree가 병렬 실행되는 구조상 이 worktree 단독으로는 충족할 수 없다 — 오케스트레이터가 04-02~04-06 5개 브랜치를 모두 병합한 뒤에야 `.velite/lessons.json`에서 `stepId===1 && hasContent` 개수가 10이 되는지 확인 가능하다. Plan 07(종단 게이트)이 `check-manifest.mjs`의 `EXPECTED_HAS_CONTENT_COUNT`를 2 → 11로 올리기 전에 이 병합·검증 단계가 선행되어야 한다
- `npm run build` 시 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` placeholder 인라인 전달이 필요하다는 사실을 오케스트레이터가 알아두면, 다른 worktree 병합 시에도 같은 방식으로 빌드 검증 가능
- 남은 리스크: scikit-learn 버전이 바뀌면(현재 1.9.0) 회귀 예측값·정밀도/재현율 소수점이 미세하게 달라질 수 있음 — 본문은 "정확히 이 숫자"가 아니라 "이런 형태"로 예상 출력을 서술해 이 리스크를 흡수했음(RESEARCH Assumptions Log 반영)

## Self-Check: PASSED

- FOUND: `src/content/lessons/step-1/1-5-ml-model-types.mdx`
- FOUND: `src/content/lessons/step-1/1-5-ml-metrics-and-pipeline.mdx`
- FOUND: commit `4ec4f2c` (Task 1)
- FOUND: commit `3d851f2` (Task 2)

---
*Phase: 04-step-1*
*Completed: 2026-08-25*
