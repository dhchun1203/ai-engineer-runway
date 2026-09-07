# Round 1-D: 문서형 학습 사이트 (조사 원문, 2026-09-01)

조사 대상: MDN Learn, javascript.info, roadmap.sh, W3Schools, PostgreSQLTutorial(neon),
Real Python, react.dev/learn (+The Odin Project)

### react.dev식 챌린지 블록 (탭 네비 + 접힌 해설 정답)
- 출처: react.dev/learn — 모든 레슨이 Recap 뒤 "Try out some challenges"로 끝남. 번호 탭 +
  문제 설명 + 시작 코드 + 접힌 "Show solution" + Next Challenge
  (https://react.dev/learn/state-a-components-memory 브라우저 확인).
- 왜 효과: "고장난 코드를 고쳐라/동작을 예측하라" 형 전이 과제 — 회상+전이 동시.
  해설이 "왜"까지 설명해 worked example. **실행 환경 없이 정적으로 성립.**
- 적용: 6장에 지식형 문항 외 **코드 1개 + "이 코드의 문제/출력은?" 형 문항 1개** 추가.
  정답 접기 안에 정답 코드 + 왜 2~3문장.
- 규모: 컴포넌트 반나절, 파일럿 1편 → 레슨당 15~20분 / 충돌: 없음

### 코드 예제 "실행 결과" 블록 표준화 (+ 결과 접기로 예측 유도)
- 출처: PostgreSQLTutorial — 모든 쿼리 아래 "Partial output:" 결과 표 + 전 레슨 동일
  dvdrental DB (https://neon.com/postgresql/postgresql-tutorial/postgresql-select).
  Real Python — `>>>` REPL 블록. javascript.info — 과제에 기대 출력 명시.
- 왜 효과: 실행 환경 없는 정적 사이트에서 결과가 없으면 학습 루프가 끊긴다. 결과 표시로
  worked example 완성, 접기로 숨기면 회상 연습. 동일 샘플 데이터가 외생 부하 제거.
- 적용: **"아이패드에서 실습 안 함" 결정 때문에 우리에게 특히 중요.** 4장 모든 코드 블록에
  "실행 결과" 표준 하위 블록(Python `>>>`·SQL 결과 표). 핵심 1~2곳은 접기 + "예측해
  보세요". SQL·Python 군은 동일 예제 데이터셋 재사용.
- 규모: 규칙+파일럿 반나절, 전수 2~3일 / 충돌: 없음

### 선수 지식 표 + "몰라도 걱정 마세요" 안심 문구
- 출처: MDN — 레슨 상단 Prerequisites + Learning outcomes 고정
  (https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Variables).
  Real Python — "Don't worry if you don't have all this knowledge yet…" (원문 확인).
- 적용: frontmatter `prerequisites` → "먼저 보면 좋아요" 칩 + "아직 안 봤어도 괜찮아요"
  한 줄. "어려우면 여기부터" 분기의 1인용 최소 구현.
- 규모: 1일 (컴포넌트 반나절 + 35편 매핑 반나절) / 충돌: 없음

### 좋은 예/나쁜 예 나란히 대비 블록
- 출처: react.dev Pitfall — "passing(correct) vs calling(incorrect)" 2열 표. W3Schools —
  "Not Recommended" 라벨.
- 왜 효과: 대비 사례(contrasting cases) — 틀린 예가 옆에 있어야 변별 자질이 드러남.
- 적용: 5장에 ✅/❌ 대비 컴포넌트(모바일 상하). 레슨당 1개 — "초보 최다 실수" 하나.
- 규모: 반나절 + 점진 / 충돌: 없음

### 콜아웃 3종: 함정(Pitfall) / 참고(Note) / 더 깊이(접기 Deep Dive)
- 출처: react.dev — 세 박스 일관 사용, Deep Dive는 접을 수 있는 선택적 심화.
- 왜 효과: 본류/심화의 물리적 분리(인지부하) + Pitfall의 시각적 격리(distinctiveness).
- 적용: MDX 콜아웃 3종. **"더 깊이" 접기가 eli5 본문을 짧게 유지하는 안전판** — 하루
  2시간 페이스 방어.
- 규모: 반나절 + 점진 / 충돌: 없음

### 3상태 진도: 완료 / 학습 중 (/ 건너뜀)
- 출처: roadmap.sh — 노드 드로어의 Learning/Done/Skip 3버튼 (브라우저 확인).
- 적용: status 컬럼(learning|done) 또는 started_at. 홈에서 "읽다 만 레슨 이어서"를 밀린
  레슨보다 먼저. Skip은 불필요.
- 규모: 1일 / 충돌: 없음 (우선순위 중하)

### 사이트 용어집 페이지 (빌드타임 집계)
- 출처: MDN Glossary — 본문 용어가 용어집으로 링크.
- 적용: 용어 표를 frontmatter/구조화 데이터로 → 빌드타임 `/glossary` (ㄱㄴㄷ 정렬 + 출처
  레슨 역링크). Velite `terms: [{term, definition}]`.
- 규모: 1일 (+표 데이터화 변수) / 충돌: 없음

### 레슨 끝 "다음 장 예고" 한 줄
- 출처: react.dev — "화면을 바꾸려면 state가 필요하다, next page에서" 식으로 다음 개념의
  필요성을 만들며 끝남.
- 왜 효과: 다음 레슨을 "방금 배운 것의 빈틈"으로 — 호기심 갭이 다음 세션 복귀 동기.
  하루 1레슨 페이스와 정확히 맞물림.
- 적용: 핵심 정리 아래 예고 1~2문장 + 다음 레슨 카드.
- 규모: 컴포넌트 반나절 + 문구 1일 / 충돌: 없음

### 콘텐츠 신선도 표시
- 출처: Real Python "Updated Apr 15, 2026", MDN changelog, javascript.info.
- 적용: frontmatter `updatedAt` → "2026.8. 기준" 배지. Step 3(LLM 계열)에 "변화 빠른
  분야 — 최신은 클로드에 물어보기" 결합.
- 규모: 반나절 / 충돌: 없음 (우선순위 낮음)

### [충돌 표시 — 보고만] 인라인 코드 실행 링크
- javascript.info run / W3Schools Try it / MDN Play — 이 군집의 사실상 표준.
- **제약 4 충돌** (브라우저 실행 제외 — 사용자 결정 8/27). "실행 결과 블록 표준화"가
  정적 대체물.

## 사이트 한 줄 평
- react.dev/learn: 군집의 완성형 — 정적 콘텐츠 설계의 교과서, 가장 많이 배울 곳
- javascript.info: 구조 모범이나 핵심 무기(인라인 실행)는 충돌
- MDN Learn: Prerequisites/outcomes 메타 표 + 신선도. 콘텐츠는 건조
- W3Schools: Not Recommended 라벨 정도
- PostgreSQLTutorial: 쿼리+결과표+공통 샘플 DB — 실행 없는 SQL 학습의 정석
- Real Python: 안심 문구·Updated·읽기 시간 — 장문 메타데이터 설계가 세심
- roadmap.sh: Learning/Done 3상태만 수확
- The Odin Project(추가): Knowledge check — 답 못 하면 본문 해당 섹션으로 돌아가는 링크

미확인: W3Schools 페이지 내 Exercise 박스, roadmap.sh 진행률 위치(로그인 벽).
