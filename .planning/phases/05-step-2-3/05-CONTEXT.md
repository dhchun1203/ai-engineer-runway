# Phase 5: Step 2·3 콘텐츠와 프로젝트 가이드 - Context

**Gathered:** 2026-08-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Step 2 12편 + Step 3 13편 = 레슨 25편을 사이트에서 읽고 실습하고 완료 체크할 수 있게 만든다. 이 중 **24편이 신규 집필**이고, 1편(`2-3-react-components`)은 Phase 1에 구 표준으로 쓰였으므로 신표준 재작성 대상이다(D-70). 25편 안에 **프로젝트 준비 가이드 5편**(2-4, 2-6, 3-2, 3-5, 3-7)이 포함되며 CONT-05를 단독으로 충족한다.

집필 표준은 Phase 4에서 확립된 **eli5 톤 × 6단 템플릿**(D-47~D-50, D-61)을 그대로 승계한다. 이 Phase가 새로 정하는 것은 세 가지뿐이다 — ① Step 3 "개요" 깊이의 판정 기준, ② 프로젝트 가이드 레슨의 내용 형식, ③ Step 2 실습 환경과 자동 게이트의 Step 2·3 확대.

여기에 마감 작업이 붙는다: `check-manifest.mjs` hasContent 상수 11 → 35, `check-lesson-structure.mjs` 대상 디렉터리·허용 코드 언어 확장, "콘텐츠 준비 중" 카피 정리, Making-of(PLAT-03) 마감, 전체 진행률 100% 도달 e2e 검증.

**범위 밖:** 플랫폼 코드 변경(라우트·컴포넌트·DB 스키마), 새 MDX 컴포넌트·다이어그램 파이프라인·퀴즈 엔진, 디자인 정리(Phase 6), Step 1 레슨 재작업.

**현재 상태:** Step 2 11편 + Step 3 13편이 `hasContent: false` 스텁. 프론트매터(title·moduleId·order·depth·estimatedMinutes·slug)는 Phase 1에서 확정된 불변값이다(D-13).

</domain>

<decisions>
## Implementation Decisions

> 모든 결정은 `알아서 해줘`(2026-08-25) 위임에 따라 권장안을 자동 선택했다. 각 항목의 선택 근거를 함께 남겨 나중에 되짚을 수 있게 했다.

### Step 3 "개요" 깊이 기준 (CONT-04 "개념 훑기"의 실행 rubric)

- **D-62:** **Step 3 완료 판정 기준 = "개강 첫 시간에 강사가 이 단어를 썼을 때 무슨 얘기인지 알아듣는다"** — 각 레슨의 ① 학습 목표를 이 형식으로 쓴다. 충족 조건 세 가지: (a) 용어를 한 문장으로 정의할 수 있다, (b) 언제 쓰는지/왜 필요한지 말할 수 있다, (c) 전체 파이프라인에서 어디에 놓이는지 안다. **목표가 아닌 것:** 직접 구현할 수 있다, 직접 튜닝할 수 있다, 성능을 비교 측정할 수 있다 — **Reversibility:** costly — 이 기준이 Step 3 13편 전부의 분량·과제 형태를 결정하므로, 나중에 "역시 실습이 필요하다"로 바뀌면 13편 재작업 + estimatedMinutes 총합(4200분) 재계산이 따라온다
  - `[auto]` Step 3 깊이 — Q: "완료 판정 기준을 무엇으로 잡나?" → Selected: "알아듣기(용어·용도·위치)" (권장 기본값). 근거: CONT-04가 Step 3를 "개념·용어 중심 훑기"로 규정했고, ROADMAP 성공 기준 2가 "개강 후 학습에 필요한 용어를 미리 알 수 있다"로 이미 이 수준을 명시한다. STATE.md Blockers의 리서치 Gap("Step 3 개요 깊이 rubric 미확정 → 범위 팽창 위험")을 여기서 닫는다

- **D-63:** **Step 3 레슨에 실행 가능한 코드를 요구하지 않는다 — 읽기용 스니펫만 넣는다** — 개념을 눈에 보이게 하는 10~20줄 코드/설정 조각은 넣되, 설치·실행 안내를 붙이지 않고 해보기 과제로도 실행을 요구하지 않는다. 스니펫에는 "읽고 넘어가면 됩니다 — 개강 후 직접 실행합니다" 취지의 한 줄을 붙인다. 근거: RAG(벡터DB), PEFT/LoRA(GPU), n8n·LangGraph(별도 인스턴스)는 환경 구축만으로 90분을 초과한다. 그렇다고 코드를 완전히 배제하면 개강 후 첫 노출이 벽이 된다 — **Reversibility:** reversible
  - `[auto]` Step 3 깊이 — Q: "개요 레슨에 실행 가능한 코드가 들어가나?" → Selected: "읽기용 스니펫만, 실행 요구 없음" (권장). 대안 "전부 실행 가능"은 90분 예산 초과로 배제, "코드 완전 배제"는 개강 후 진입 장벽을 남겨 배제
  - **예외:** 이 규칙은 Step 3에만 적용된다. Step 2 심화 레슨은 D-12(완결 코드 + 실행 방법 명시)를 그대로 따른다

- **D-64:** **Step 3 90분 = 읽기 약 40분 + 해보기 약 50분, 해보기는 "판단·설계형" 과제** — Step 1의 D-49(읽기 30 + 실습 120)와 비율이 다르다는 점을 명시적으로 기록한다. 해보기 과제 유형: 시나리오를 주고 판단하게 하기("이 질문에 하이브리드 검색이 필요한가, 이유는?"), 설계 선택하기("우리 프로젝트 문서에 맞는 청크 크기와 그 이유"), 용어 대조표 직접 채우기, 실무 사례를 읽고 어느 단계에서 실패했는지 짚기. 정답은 D-61대로 접힌 `<details>`에 "모범 답안 + 왜 그렇게 보는가"로 담는다 — **Reversibility:** reversible
  - `[auto]` Step 3 깊이 — Q: "90분을 어떻게 배분하나?" → Selected: "읽기 40 + 판단형 해보기 50" (권장). 근거: D-49의 "글이 시간을 채우지 않는다" 원칙은 유지하되, 실행 실습이 불가능한 만큼 사고 과제가 그 자리를 대신한다

- **D-65:** **Step 3도 6단 헤딩(D-10)을 원문 그대로 유지하고, ④ 실무 예제 자리를 "실무에서 이게 어떻게 쓰이나"로 재해석한다** — ④ 안에는 실제 서비스 사례 서술 + 읽기용 스니펫(D-63)이 들어간다. 헤딩 텍스트는 바꾸지 않는다 — 자동 구조 게이트(D-71)가 35편을 한 벌의 규칙으로 검사할 수 있어야 한다 — **Reversibility:** reversible

### 프로젝트 5종 준비 가이드 형식 (CONT-05)

- **D-66:** **프로젝트 가이드 5편도 6단 템플릿을 유지하고, 각 단의 내용만 프로젝트용으로 재해석한다** — 전용 구조를 새로 만들지 않는다. 게이트 한 벌로 35편 전부를 검사할 수 있고, 학습자 입장에서 레슨 구조가 예측 가능하게 유지된다. 단별 매핑:

  | 단 | 프로젝트 가이드에서의 내용 |
  |---|---|
  | ① 학습 목표 | 이 프로젝트에서 **무엇을 만들고 무엇을 증명하는가** |
  | ② 왜 배우나 | 이 프로젝트가 커리큘럼에서 맡는 자리 — 앞의 어느 모듈들이 여기서 합쳐지는가 |
  | ③ 개념 설명 | 만들 것의 **전체 구조** — 화면/데이터/API 흐름을 `A → B → C` 한 줄 도식과 표로(D-48 준수) |
  | ④ 실무 예제 | **사전 준비 체크리스트** — 계정·API 키·설치·샘플 데이터. 코드가 아니라 준비물 |
  | ⑤ 실무 팁 | 팀 프로젝트에서 자주 막히는 지점, 시간 배분, 역할 분담 |
  | ⑥ 핵심 정리 | **준비 완료 판정 기준**(체크박스) + `**이 레슨의 단어**` 표 |

  — **Reversibility:** costly — 5편 전부가 이 매핑으로 쓰이고 게이트가 이 구조를 강제한다

  - `[auto]` 프로젝트 가이드 — Q: "6단 템플릿 유지 vs 프로젝트 전용 구조?" → Selected: "6단 유지, 내용만 재해석" (권장). 대안 "전용 구조"는 게이트를 두 벌로 갈라 자동 안전망(D-59)을 약화시켜 배제

- **D-67:** **"재현 아님"의 경계 — 완성 코드·정답 아키텍처를 싣지 않는다** — 준비 가이드가 답하는 질문은 **"개강 후 이 프로젝트를 시작하는 첫날에 막히지 않으려면 지금 무엇을 해 두어야 하나"** 하나다.
  - **금지:** 전체 구현 코드, 완성된 DB 스키마 전체, 단계별 튜토리얼, "이렇게 만들면 됩니다" 형태의 정답 제시
  - **허용:** 준비물 체크리스트, 구조 스케치(한 줄 도식·표), 미리 만들어 둘 계정/프로젝트/샘플 데이터, 이 프로젝트에서 처음 나오는 용어, 앞 레슨 어느 편을 복습하면 되는지 포인터
  - 근거: CONT-05 원문이 "(재현 아님)"을 괄호로 못 박았고, 본 과정 200~520시간짜리 팀 프로젝트를 사전학습 60분 레슨이 앞질러 풀어 버리면 정작 개강 후 학습이 무의미해진다 — **Reversibility:** reversible

- **D-68:** **프로젝트 가이드 60분 = 읽기 약 20분 + 준비 실행 약 40분, 해보기는 "실제로 준비해 보기"** — 예: Supabase 프로젝트 하나 만들고 테이블 1개 생성해 보기, LLM API 키 발급받고 호출 1회 성공시키기, 샘플 문서 3개 모아 두기. `<details>` 안에는 "정답"이 아니라 **"성공했다면 이런 화면/출력이 나옵니다"**를 담는다 — **Reversibility:** reversible

- **D-69:** **`**이 레슨의 단어**` 표(D-50)와 `### 해보기` 2~3개(D-61)는 프로젝트 가이드에도 그대로 유지한다** — 형식 예외를 만들지 않는다. 프로젝트 가이드의 단어 표는 그 프로젝트에서 처음 등장하는 용어로 채운다

### Step 2 실습 환경과 자동 게이트 확장 (CONT-03, D-12)

- **D-70:** **`2-3-react-components.mdx`(구 표준)를 신표준으로 재작성한다** — 현재 151줄, 6개 헤딩은 이미 맞지만 `### 해보기`·`<details>` 정답·단어 표가 없다. 게이트를 Step 2로 확대하는 순간(D-71) 이 파일이 유일한 예외가 되어 게이트에 구멍을 뚫어야 하는데, 재작성 비용이 예외 유지 비용보다 싸다. 프론트매터 8개 필드는 바이트 단위로 그대로 두고 본문만 교체한다(`hasContent`는 이미 true라 변경 없음) — **Reversibility:** reversible
  - `[auto]` Step 2 환경 — Q: "구 표준 파일럿을 재작성하나, 게이트 예외로 두나?" → Selected: "재작성" (권장)

- **D-71:** **`scripts/check-lesson-structure.mjs`를 Step 1 전용에서 step-1/2/3 전 디렉터리 순회로 확대한다** — 검사 대상 규칙은 그대로(프론트매터 `hasContent: true`인 파일만 검사, false 스텁은 건너뜀). 파일 상단 주석의 "Step 2·3 디렉터리는 검사하지 않는다" 근거는 D-70이 해소하므로 함께 갱신한다. D-59가 사람 검토를 파일럿으로 제한한 대가로 만든 안전망인데, 24편에서는 Step 1의 10편보다 더 필요하다 — **Reversibility:** reversible

- **D-72:** **허용 코드 펜스 언어를 확장한다** — 기존 `python, sql, bash, powershell, text` + **`typescript, tsx, javascript, jsx, json, html, css, yaml`**. `mermaid`는 넣지 않는다(D-48 "마크다운만으로 도식" 유지). 확장 목록은 `ALLOWED_FENCE_LANG_PREFIXES` 한 곳에서만 관리한다

- **D-73:** **Step 2 예제 실행 환경 = PC 로컬(VS Code + Node), 예외는 2-1 모듈뿐** — D-55(Python은 PC 로컬)와 같은 원칙을 Node 생태계에 그대로 적용한다. 2-1(PostgreSQL·Supabase)만 브라우저 Supabase SQL 에디터를 쓰고, **D-56의 연습 스키마 분리·`public.progress` 불간섭 규칙을 그대로 승계**한다. StackBlitz·CodeSandbox 등 온라인 IDE 안내는 하지 않는다 — 커리큘럼이 로컬 개발 환경을 전제하고 Step 1에서 이미 세팅을 마쳤다. 각 레슨 ④에 "실행: PC 로컬 VS Code" 한 줄을 명시한다(D-12) — **Reversibility:** reversible
  - **아이패드 정책:** "읽기는 아이패드, 실행은 PC"라는 Phase 4의 분리(D-55)를 그대로 승계한다. Step 2에서 새로 생기는 제약이 아니다

- **D-74:** **Node·npm·TypeScript 설치는 `2-3-typescript-setup`이 담당한다** — Step 1의 1-1 환경 세팅이 Python·Git·VS Code·계정까지만 다뤘으므로 Node 계열은 Step 2 진입 지점에서 처음 설치한다. 레슨 제목이 "TypeScript 개발 환경 구성"이라 자연스럽게 맞는다. 단 **2-2(HTML·CSS·JS)가 순서상 먼저**이므로, 2-2는 브라우저와 파일 하나로 완결되는 예제(별도 설치 없이 `.html` 파일을 브라우저로 열기)로 쓴다 — **Reversibility:** reversible

- **D-75:** **OS 기준은 Windows(PowerShell), 다를 때만 macOS 한 줄 병기** — D-58을 그대로 승계. `npm`·`npx`처럼 공통인 명령은 그대로, 경로·설치처럼 다른 부분만 병기

### 집필·배포 리듬

- **D-76:** **Wave 1 = 대표 3편 묶음 → 한 번 배포 → 아이패드에서 사용자 확인** — 세 형식을 한 화면에서 함께 판정한다:
  1. `2-3-react-components` (심화 표준 승계 확인 — 재작성본, D-70)
  2. `3-1-vector-search-basics` (**개요 형식 신규** — D-62~D-65 검증)
  3. `2-4-project-ai-shop-frontend` (**프로젝트 가이드 형식 신규** — D-66~D-69 검증)

  Step 2 심화는 Phase 4에서 이미 승인된 표준이라 단독 파일럿이 불필요하고, 신규 형식 둘은 각각 검증이 필요하다. 파일럿을 3회로 쪼개면 리듬이 끊기므로 한 배포에 묶는다. 승인 전에는 나머지 레슨을 쓰지 않는다 — **Reversibility:** costly — 이 3편이 나머지 22편의 형식을 확정한다
  - `[auto]` 집필 리듬 — Q: "파일럿을 다시 받나?" → Selected: "신규 형식 2종 + 승계 1종을 한 배포로 묶어 1회 확인" (권장)

- **D-77:** **승인 후 나머지 22편은 Step 2 배치 → Step 3 배치, 두 번에 나눠 병렬 집필·배포한다**
  - **Wave 2 (Step 2 잔여 10편):** 2-1 × 2, 2-2 × 2, 2-3-typescript-setup, 2-5 × 2, 2-6, 2-7 × 2
  - **Wave 3 (Step 3 잔여 12편):** 3-1-hybrid, 3-2, 3-3 × 2, 3-4 × 3, 3-5, 3-6 × 3, 3-7

  근거 셋: (a) 일정표가 slug 순서로 배정되므로 Step 2가 먼저 배포되면 실제 사전학습이 끊기지 않는다, (b) 22편 동시 병렬은 실패 시 되돌릴 표면이 너무 크다, (c) Step 2 배치를 실제로 읽어 본 경험이 Step 3 배치 집필에 반영된다. **배치 사이에 사람 승인 체크포인트는 두지 않는다** — D-59를 승계해 자동 게이트 통과만으로 진행하고, 배포 단위만 나눈다 — **Reversibility:** reversible
  - `[auto]` 집필 리듬 — Q: "22편을 한 번에 배포하나, 나눠 배포하나?" → Selected: "Step 2 → Step 3 두 배치" (권장). 대안 "한 번에"는 D-52(Phase 4의 9편 일괄)의 연장이지만 편수가 2배 이상이고 학습 진행 중이라는 점에서 배제

- **D-78:** **`EXPECTED_HAS_CONTENT_COUNT`는 각 wave 끝에서 갱신한다 — 11 → 14(Wave 1) → 24(Wave 2) → 35(Wave 3)** — 최종 35는 전 레슨이므로, Invariant 10의 슬러그 배열은 "매니페스트 전체 슬러그와 동일" 형태로 단순화해도 좋다(재량). Wave마다 상수를 맞추지 않으면 그 wave의 빌드가 실패한다는 점을 계획에 명시할 것

- **D-79:** **"콘텐츠 준비 중입니다" 분기 코드는 지우지 않고 남긴다** — 35편 전부가 `hasContent: true`가 되어 도달 불가 경로가 되지만, 분기를 제거하면 나중에 레슨이 추가될 때 빈 화면이 나온다. 대신 `01-UI-SPEC.md` Copywriting Contract에 "v1 완성 후 도달 불가 — 안전망으로 유지"를 기록한다 — **Reversibility:** reversible

- **D-80:** **Making-of(`docs/making-of.md`) 마감은 Wave 3에서 한다** — PLAT-03의 살아있는 문서 규칙에 따라 Phase 4·5 기록(콘텐츠 집필 방식, eli5 표준 확립, 파일럿 검증 리듬)을 eli5 톤으로 추가한다. ROADMAP 성공 기준 4의 "구현→검증→배포 과정까지 기록을 마친다"가 여기서 충족된다. Phase 6(디자인 정리) 기록은 Phase 6이 담당한다

- **D-81:** **성공 기준 4(전체 진행률 100% 도달 가능)는 e2e로 검증한다** — 35편 전부 `hasContent: true`면 자동 충족되지만, 실제로 전 레슨 완료 시 전체 진행률이 100%로 표시되는지 `scripts/e2e-progress.mjs`로 확인한다. 반올림·집계 경계에서 99%가 나오지 않는지가 실제 확인 대상이다

### Claude's Discretion

- Wave 2·Wave 3 안에서의 executor 분할 방식(모듈별/편수별 병렬 구성)과 각 배치의 커밋 단위
- 각 레슨의 이모지 헤더 선택, 비유 소재, `### 해보기` 과제 개수(2~3개 범위 안), 단어 표 행 수(5~8행 범위 안)
- Step 3 각 레슨의 읽기용 스니펫 언어·길이 선택(D-63 "10~20줄" 은 목표치이지 게이트 값이 아님)
- Step 2 예제에 쓸 구체 라이브러리 버전·프로젝트 구조 — 단 커리큘럼 스택(Express, Prisma, React/Next, TypeScript, Supabase)을 벗어나지 않을 것
- 프로젝트 가이드 5편이 참조할 "복습 포인터"의 대상 레슨 선정
- `check-manifest.mjs` Invariant 10 슬러그 배열의 단순화 여부(D-78)
- `check-lesson-structure.mjs` 확장 시 Step별 규칙 분기 필요 여부 — 원칙은 한 벌 규칙이지만, Step 3에서 코드 펜스가 아예 없는 레슨이 나올 경우의 처리는 재량
- Wave 1 파일럿 3편의 집필 순서(동시/순차)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 커리큘럼·집필 대상
- `.planning/curriculum.md` §Step 2, §Step 3 — 12개 모듈의 주제 원문(source of truth). 각 레슨은 모듈 불릿에 1:1 대응한다. 상단의 "콘텐츠 깊이 방침" 한 줄이 D-62의 원천
- `src/content/lessons/step-2/*.mdx` — 12편. 프론트매터 8개 필드는 확정값(D-13), 본문과 `hasContent`만 바꾼다
- `src/content/lessons/step-3/*.mdx` — 13편. 동일
- `src/content/lessons/step-2/2-3-react-components.mdx` — 구 표준 파일럿, D-70 재작성 대상
- `src/content/lessons/step-1/1-3-python-variables-and-types.mdx` — Phase 4 파일럿(신표준). 6단 × eli5 × 해보기 × 단어 표가 실제로 어떻게 생겼는지 보는 기준 샘플
- `src/content/lessons/step-1/1-4-sql-queries-and-joins.mdx` — 연습 스키마 분리(D-56)가 실제로 어떻게 쓰였는지 보는 샘플. 2-1 모듈이 같은 패턴을 따른다

### 톤·형식 표준
- `.planning/phases/04-step-1/04-CONTEXT.md` — **필독.** D-47(6단 × eli5), D-48(마크다운만 도식), D-49(시간 배분 원칙), D-50(용어 표기·단어 표), D-52(병렬 집필), D-55~D-58(실습 환경·OS), D-59(자동 게이트만으로 완료), D-60(프로덕션 → 아이패드 검증), D-61(`<details>` 정답)
- `docs/making-of.md` — eli5 톤 선례이자 D-80 갱신 대상
- `.planning/phases/01-deployed-curriculum-skeleton/01-CONTEXT.md` — D-10(6단 템플릿 원문), D-12(완결 코드 + 실행 방법 명시), D-13(프론트매터 확정), D-02(KANT 금지)

### 게이트·파이프라인
- `scripts/check-lesson-structure.mjs` — D-71(디렉터리 확대)·D-72(펜스 언어 확장) 수정 대상. 상단 주석의 "Step 2·3 미검사" 근거도 함께 갱신
- `scripts/check-manifest.mjs` — Invariant 10의 `EXPECTED_HAS_CONTENT_COUNT`(현재 11)·`EXPECTED_HAS_CONTENT_SLUGS`를 D-78대로 wave마다 갱신
- `scripts/check-brand.mjs` — src/·docs/ 전체 KANT·이메일 0건 상시 게이트(D-02). 레슨 본문·코드 주석 포함
- `scripts/e2e-progress.mjs` — D-81(전체 진행률 100%) 검증 수단
- `scripts/e2e-today.mjs` — 오늘의 학습 루프가 Step 2·3 레슨에서도 동작하는지 확인
- `velite.config.ts` — 레슨 스키마와 rehype-pretty-code 설정. 변경 없음. D-72의 언어 확장이 하이라이팅 쪽에서도 되는지 확인할 지점
- `src/app/lesson/[lessonId]/page.tsx:60` — "콘텐츠 준비 중입니다" 분기(D-79 유지 대상)
- `src/app/globals.css` `.prose` — `<details>`·복사 버튼·keep-all 스타일. 변경 없음이 기본

### 요구사항·경계
- `.planning/REQUIREMENTS.md` — CONT-05(프로젝트 5종 준비 가이드, "재현 아님"), CONT-02·CONT-03(Phase 4 귀속이지만 Phase 5가 동일 표준 적용), CONT-04(깊이 배지)
- `.planning/ROADMAP.md` §Phase 5 — 성공 기준 4개. §Coverage Notes가 "Phase 5는 요구사항 수가 적을 뿐 소요 시간 기준 가장 큰 Phase"임을 명시
- `.planning/PROJECT.md` — Constraints(KANT HARD RULE, 아이패드 1순위, 한국어), Key Decisions
- `.planning/STATE.md` §Blockers/Concerns — "Step 3 개요 훑기 rubric을 Phase 5 착수 전 구체화" 항목을 D-62~D-65가 닫는다
- `.planning/research/PITFALLS.md` §Pitfall 4 — 콘텐츠 전에 MDX 컴포넌트 라이브러리를 만들지 말 것(D-48 근거)

### 시간 예산
- `.planning/phases/03-schedule-and-today/03-CONTEXT.md` — D-31(레슨 소요시간 확정값), D-32(하루 1레슨). Step 3 90분·프로젝트 60분은 여기서 확정된 값이며 Phase 5가 바꾸지 않는다
- `scripts/check-manifest.mjs` Invariant 6·12·13 — estimatedMinutes 총합 4200분 등식·분포·파생 규칙. 레슨 본문 집필은 이 값을 건드리지 않는다

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **MDX 파이프라인 전체가 이미 동작한다** — Velite → rehype-pretty-code/Shiki → `MDXContent`. Step 2·3 레슨은 `.mdx` 본문만 쓰면 렌더된다. 플랫폼 코드 변경 0
- **44px 복사 버튼** — Phase 1에서 구현, quick task 260825-r4k에서 실제 동작까지 수정 완료. 새 코드 블록에 자동 적용
- **`.prose` 타이포그래피** — `@tailwindcss/typography` + keep-all + `<details>` 터치 타깃 스타일(Phase 4에서 추가). 표·인용·접힘 블록이 이미 스타일링되어 있다
- **`getOrderedLessons()`** (`src/content/curriculum-helpers.ts`) — 일정 배정과 진행률이 slug 순서에서 파생되므로, 본문을 채우고 `hasContent`만 켜면 오늘의 학습·진행률·일정표가 자동으로 채워진다(성공 기준 4)
- **Phase 4 레슨 10편** — 신표준의 실물 레퍼런스. 길이는 131~265줄 범위이며, Step 2 심화는 같은 범위를 목표로 한다

### Established Patterns
- **콘텐츠 = 파일, 진도 = Supabase** — 레슨 집필은 파일 추가·수정으로 완결된다(ARCHITECTURE.md)
- **게이트 스크립트는 의존성 0 · 원본 `.mdx` 정규식 재파싱** — `check-lesson-structure.mjs`는 `.velite/` 산출물이 아니라 소스를 읽는다. `<details>` 마크업과 빈 줄 규칙이 컴파일 후에는 확인 불가하기 때문. D-71 확장 시 이 성질을 깨지 말 것
- **게이트 기대 상수는 실행자가 직접 갱신** — 자동 추론이 아니라 하드코딩 상수. wave마다 손으로 맞춰야 빌드가 통과한다(D-78)
- **공개 표면 KANT 0건** — 레슨 본문·코드 주석까지 `check-brand.mjs`가 검사. Step 2·3 레슨에서 "본 과정", "커리큘럼"으로 지칭
- **검증 = master 푸시 → 프로덕션 URL → 아이패드**(D-60) — Wave 1 파일럿 확인도 이 경로

### Integration Points
- `src/content/lessons/step-2/*.mdx` (12편) · `src/content/lessons/step-3/*.mdx` (13편) — 본문 작성 + `hasContent: true` 전환
- `scripts/check-lesson-structure.mjs` — `STEP1_DIR` 상수를 디렉터리 배열로, `ALLOWED_FENCE_LANG_PREFIXES` 확장 (D-71, D-72)
- `scripts/check-manifest.mjs` — Invariant 10 상수 3단계 갱신 (D-78)
- `docs/making-of.md` — Phase 4·5 기록 추가 (D-80)
- `.planning/phases/01-deployed-curriculum-skeleton/01-UI-SPEC.md` §Copywriting Contract — "준비 중" 카피의 도달 불가 상태 기록 (D-79)

### 주의
- **Phase 4는 아직 로드맵상 완료 처리되지 않았다** — STATE.md 기준 7/7 실행·배포 완료이나 `/gsd-verify-work 04` UAT가 남아 있고 ROADMAP 체크박스가 6/7로 뒤처져 있다. Phase 5 실행 전에 정산하는 것이 깔끔하다(계획 단계에서 판단)

</code_context>

<specifics>
## Specific Ideas

- **"이 사이트의 목적은 사전학습이지 마스터가 아니다"**(Phase 3 이래의 기준선)가 Phase 5에서 가장 강하게 작동한다 — Step 3 13편은 특히 "다 가르치려는 충동"이 범위를 팽창시킬 지점이다. D-62의 "알아듣는다" 기준이 그 방어선
- **프로젝트 5종은 본 과정 200~520시간짜리 팀 작업이다** — 60분 레슨이 그걸 앞질러 풀어 버리면 개강 후 학습이 무의미해진다. 준비 가이드는 "첫날에 안 막히게" 딱 거기까지
- 사전학습이 **이미 진행 중**(2026-08-25 = 일정표 1일차)이므로 Step 2가 먼저 배포되어야 학습이 끊기지 않는다 — D-77의 배치 분할 근거
- Making-of의 eli5 결과가 마음에 들어 레슨 전체로 확장한 것 — 같은 재료(이모지 헤더·괄호 한 줄 풀이·비유 표·짧은 문장)를 Step 2·3에서도 그대로 쓴다
- Phase 6(디자인 정리)이 Phase 5 이후에 오므로, Step 2·3 레슨 25편이 **개선될 읽기 화면을 물려받는다** — 지금 디자인을 걱정하며 마크업을 특별하게 쓸 이유가 없다

</specifics>

<deferred>
## Deferred Ideas

- **Mermaid·SVG 다이어그램** — RAG 파이프라인·멀티 에이전트 구조는 그림이 있으면 이해가 빠르지만, D-48(마크다운만)이 Phase 4에서 확정되었고 Pitfall 4가 콘텐츠 전 컴포넌트 작업을 금지한다. 25편을 다 쓴 뒤에도 특정 레슨에서 정말 필요하면 quick task로
- **온라인 IDE(StackBlitz·CodeSandbox) 대체 경로** — 아이패드에서도 Step 2 예제를 돌릴 수 있게 하는 길이지만, 커리큘럼이 로컬 개발 환경을 전제하고 D-73이 "읽기는 아이패드, 실행은 PC"로 정리했다. 검토 후 채택하지 않음
- **Step 3 실습 환경(벡터DB·n8n) 실제 구축 안내** — 90분 예산을 초과해 D-63으로 배제. 개강 후 본 과정이 다룬다
- **레슨 검색·북마크·퀴즈 엔진** — v2 CONV 범위. Phase 5 밖

</deferred>

---

*Phase: 5-Step 2·3 콘텐츠와 프로젝트 가이드*
*Context gathered: 2026-08-25*
