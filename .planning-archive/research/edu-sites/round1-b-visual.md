# Round 1-B: 개념 시각화·설명 중심 교육 (조사 원문, 2026-09-01)

조사 대상: Khan Academy, CS50, learngitbranching, VisuAlgo, Josh Comeau, wizard zines(Julia
Evans), RegexOne, SQLBolt (+r2d3.us 시도 — 서버 다운으로 제외)

### 구체 먼저, 정의는 나중 + 저작 안티패턴 체크리스트
- 출처: Julia Evans "Patterns in confusing explanations" — 혼란스러운 설명 13패턴: 추상
  (정의)부터 시작, 한 번에 너무 많은 개념, 예시 없음, 비현실적 예시, '무엇'만 있고 '왜'가
  없음, 틀린 방법을 틀렸다고 표시 안 하고 보여주기 등 (https://jvns.ca/blog/confusing-explanations/).
  CS50 Week 0 — 이진법을 "전구", 알고리즘을 "전화번호부"라는 구체 경험으로 먼저
  (https://cs50.harvard.edu/x/notes/0/).
- 왜 효과: concreteness fading(구체→추상 전이, 인지부하). 13패턴은 "망치는 방식을 피하기"
  라는 검사 가능한 형태라 저작·감수에 바로 사용 가능.
- 적용: (a) eli5 저작 가이드에 13패턴 한국어 체크리스트, (b) "정의 문장으로 시작하는 개념
  섹션"만 골라 첫 1~2문장을 구체 상황으로 스팟 수정.
- 규모: 체크리스트 반나절, 스팟 수정 레슨당 10~20분 / 충돌: 없음

### 멈추고 예측하게 만들기 (pause-and-predict)
- 출처: Josh Comeau flexbox 가이드 — "See if you can figure out what's going on here",
  예상 답을 대신 말한 뒤 뒤집기 (https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/).
  RegexOne — 정답 대신 유도형 힌트 (https://regexone.com/lesson/introduction_abcs).
- 왜 효과: 생성 효과 + 예측 오류의 놀라움이 기억 강화. 위젯 없이 "질문 → 접기" 구조로 작동.
- 적용: 개념 설명 중간, 출력·그림 공개 직전 "잠깐 — 뭘 출력할까? 3초만" + 접기 재사용.
- 규모: 컨벤션 반나절, 삽입은 점진 / 충돌: 없음

### 순진한 첫 시도 → 깨뜨리기 → 진짜 해법 (naive-first)
- 출처: CS50 전화번호부 3단(한 장씩→두 장씩→반씩). Julia Evans 경고: 틀린 방법을 틀렸다고
  명시 안 하면 혼란 패턴 12번.
- 왜 효과: refutation text — 오개념은 명시적으로 등장시켜 실패를 보여줘야 교정된다.
  "흔한 첫 시도" 라벨 필수.
- 적용: 4장 실무 예제를 "흔한 첫 시도(라벨) → 어디서 무너지나 → 개선"으로. SQL(N+1,
  SELECT *), React(state 남용), RAG(다 넣기) 레슨에 적합.
- 규모: 패턴 정의 반나절 + 파일럿 반나절 / 충돌: 없음

### 정답 일괄 공개 대신 힌트 사다리
- 출처: Khan Academy — 힌트가 풀이를 한 단계씩만 공개, 열면 그 문제는 오답 처리
  (support.khanacademy.org). RegexOne 유도형 해설.
- 적용: 점검 문제 접기 2단화 — `▶ 힌트(방향만)` → `▶ 정답`.
- 규모: 반나절 + 문제당 1~2분 / 충돌: 없음 (자기 확인용 접기 — 채점 아님)

### 하나의 예제 세계를 모듈 전체에 관통
- 출처: SQLBolt — Pixar movies 테이블 하나로 18레슨 (https://sqlbolt.com/lesson/select_queries_introduction).
  learngitbranching — 동일한 커밋 트리 시각화 재사용.
- 왜 효과: 새 개념마다 새 도메인 파싱하는 외재적 부하 제거 + "지난 레슨에서 이 테이블에…"
  콜백이 공짜.
- 적용: 모듈 단위 예제 도메인 통일. 최선 후보는 **이 사이트 자체**(SQL 모듈=lesson_progress
  테이블, Express·React 모듈=진행률 API/완료 체크 UI). 신규·수정분부터, 모듈 서문에
  "이 모듈의 예제 무대" 한 문단.
- 규모: 서문 방식 1일, 전면 통일 2~3일+ / 충돌: 없음

### 레슨 도입부 30초 회상 (retrieval warm-up)
- 출처: questions.wizardzines.com — 주제당 10분 질문 세트. CS50 — 매 강의가 이전 빌딩블록
  재등장.
- 적용: 레슨 맨 위 "시작 전 30초 — 어제 배운 것" 박스: 직전 레슨 점검 문제 1~2문항 재활용.
- 규모: 1일 / 충돌: 없음

### 완료 ≠ 숙달 — 시간차 재확인으로 오르는 진도
- 출처: Khan Academy 4단계 숙련도(attempted→familiar→proficient→mastered), 상위 등급은
  시간차 재평가로만 (support.khanacademy.org).
- 적용: 홈 복습 카드(3~7일 전 완료 레슨 점검 문제) + "기억남/가물가물" 자기 신고.
  최소 버전은 링크만(Supabase 변경 불필요).
- 규모: 링크만 반나절 / 기록 버전 2~3일 / 충돌: 없음(자기 신고 방식이면)

### 비유는 1개·짧게·한계를 명시
- 출처: Josh Comeau — kebab 비유는 오개념 1개("왜 justify-self가 없나") 해소에만 쓰고 끝.
  Julia Evans — strained analogies는 혼란 패턴 3번.
- 적용: eli5 가이드에 비유 3원칙 — ① 비유 1개=오개념 1개 ② 두 문단 이상 금지
  ③ "이 비유의 한계:" 한 줄.
- 규모: 반나절 / 충돌: 없음

### 목표 상태를 먼저 보여주기 (advance organizer)
- 출처: learngitbranching(목표 트리 선표시 — 앱 동작 기반, 문서 원문 미확인), VisuAlgo
  e-Lecture.
- 적용: 학습 목표 섹션에 그 레슨의 최종 그림 1점 축소 배치 + "끝나면 이 그림을 남에게
  설명할 수 있게 됩니다" → 핵심 정리에서 재등장(수미상관). 신규 그림 불필요.
- 규모: 1일 / 충돌: 없음

### 복잡한 그림 1장 대신 진화 프레임 3~4장
- 출처: VisuAlgo(슬라이드 한 장=한 단계), wizard zines("페이지당 한두 아이디어").
- 왜 효과: 분할 원리(segmenting) — 프레임당 변화분만 처리.
- 적용: 상태가 변하는 개념(요청→응답, 커밋 트리, RAG 파이프라인)은 같은 레이아웃 SVG
  3~4프레임 세로 나열 + 프레임당 캡션. 기존 115점 중 "한 장에 다 넣은" 것만 우선 분할.
- 규모: 규칙 반나절, 분할 점당 30분~1시간 / 충돌: 없음

## 사이트 한 줄 평
- SQLBolt: 단일 예제 세계 관통이 최대 강점 / RegexOne: 짧은 설명→연습→유도 힌트 리듬
- Julia Evans: 최고 수확 — 13패턴 체크리스트 + 질문 세트 / Josh Comeau: 예측 유도·오개념
  선제 타격·비유 절제의 교과서 / CS50: 구체→형식화 + 3단 개선 / Khan: 힌트 사다리 +
  시간차 승급(본문은 JS 렌더링 미확인) / VisuAlgo: 슬라이드=단계 분할 /
  learngitbranching: 목표 선표시(미확인) / r2d3.us: 서버 다운(HTTP 522)으로 제외

우선순위 제안: ①힌트 사다리(반나절) ②멈추고 예측(반나절) ③30초 회상(1일) ④목표 그림
먼저(1일). 예제 세계 통일·프레임 분할은 신규분부터 점진.
