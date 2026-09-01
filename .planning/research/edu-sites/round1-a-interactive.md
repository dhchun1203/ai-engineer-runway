# Round 1-A: 인터랙티브 코딩 플랫폼 (조사 원문, 2026-09-01)

조사 대상: freeCodeCamp, Codecademy, Exercism, Execute Program, Brilliant, DataCamp (+Boot.dev)

전제: 이 군집의 중심 기능인 브라우저 내 코드 실행·자동 채점은 기존 제외 결정과 충돌하므로
조사에서 제외. 아래는 전부 **실행기 없이 옮겨올 수 있는 주변 구조**.

### 완료 레슨의 간격 반복 복습 대기열
- 출처: Execute Program — 레슨을 마치면 예제들이 간격 반복 복습 대기열에 들어가고, 성공
  4회(마지막 ~64일차)면 "졸업" 처리. 같은 계열 복습은 같은 날 묶어서. 프로그래밍 개념은
  서로를 강화하므로 복습 단계를 일반 SRS보다 적게(5단계) 설계.
  https://mike.place/2020/executeprogram/ , https://code.brettchalupa.com/execute-program-review
  (공식 페이지는 JS 렌더링이라 세부 수치는 리뷰 글 기준). Boot.dev도 "잊어가는 주제 우선
  노출" 복습 모드 운영(https://www.boot.dev/training).
- 왜 효과: 간격 효과 + 회상 연습. 핵심 통찰: **복습 문제를 새로 만들 필요가 없다** —
  레슨 안의 점검 문제를 재소환만 하면 된다. "졸업" 규칙으로 복습 부담이 무한히 안 쌓임.
- 적용: 완료 체크 시 `next_review_at`(+3일)·`review_count` 저장 → 홈에 "오늘의 복습: N편"
  카드 → 점검 문제 섹션 앵커. 고정 간격 3·7·21일, 3회 졸업. 채점 없음("복습 완료" 버튼만).
- 작업 규모: 1일 / 충돌: 없음 (자동 채점을 붙이는 순간 충돌이니 붙이지 말 것)

### 정답 전에 힌트 — 2단계 점진 공개
- 출처: Codecademy — 힌트 먼저, 그래도 안 되면 "Get Unstuck → Get Code Solution"
  (https://help.codecademy.com/hc/en-us/articles/14298560842267). DataCamp — "Take Hint"는
  XP 일부 차감, "Show Answer"는 전액 차감 — 정답 열람에 낮은 비용을 매겨 회상 시도 먼저
  유도 (https://support.datacamp.com/hc/en-us/articles/34043400793495).
- 왜 효과: 바람직한 어려움 — 정답 전 인출 시도 1회가 기억 형성을 강화. 힌트는 실패한
  인출을 "부분 성공"으로 바꾸는 발판. 벌점은 1인용에 불필요, 단계 공개 구조가 핵심.
- 적용: 6장 점검 문제 접기를 2단(힌트 접기 → 정답 접기)으로. 힌트는 문제당 한 줄.
  35편 소급 말고 새로 읽는 레슨부터 파일럿.
- 작업 규모: 컴포넌트 반나절, 콘텐츠까지 1일 / 충돌: 없음

### 완료 체크 뒤에만 열리는 "더 깊이" 섹션
- 출처: Exercism — 푼 뒤에야 커뮤니티 솔루션·"Dig Deeper" 탭이 의미를 갖는 구조. 풀이
  단계에선 본질만, 뉘앙스·비교는 완료 후로 (https://exercism.org/docs/building/tracks ,
  블로그 본문 403 — docs로 교차 확인).
- 왜 효과: 인지부하 관리 + "한 겹 더 있다"는 재방문 동기.
- 적용: 솔로 변형 — 저자가 쓴 "다른 접근/안티패턴/실무에서 갈리는 지점" 토막을 완료 체크
  상태에서만 표시. 콘텐츠 작성 비용이 커서 어려웠던 레슨 5~10편만 선별 추천.
- 작업 규모: 메커니즘 반나절, 콘텐츠는 그 이상 / 충돌: 없음 (우선순위 중하)

### 스트릭 + 완료로 버는 보호권 + 바쁜 날 최소 세션
- 출처: Brilliant — "Streak Charge"를 레슨 완료로 1개씩 벌고 최대 2개, 하루 빠지면 자동
  소진 (https://brilliant.org/help/features/). 바쁜 날은 2분 연습으로 유지. Boot.dev —
  frozen flames + embers(열심히 한 날 적립 → 빠진 날 소진)
  (https://www.boot.dev/blog/news/bootdev-beat-2024-11). DataCamp — 최소 활동량(250 XP)
  기준 일일 스트릭.
- 왜 효과: 습관 형성 + 손실 회피. 보호권을 "성실함으로 미리 버는 저축"으로 설계한 게 핵심.
  리더보드는 1인용 무의미, 스트릭은 자기 상대라 혼자서도 작동.
- 적용: 홈에 "연속 학습 N일" + 레슨 2편 완료마다 보호권 1개(최대 2) + "바쁜 날은 복습
  카드 1개 처리로 인정".
- 작업 규모: 표시 반나절, 규칙까지 1일 / 충돌: 없음

### 모듈 단위 복습 페이지 자동 생성
- 출처: freeCodeCamp — 새 커리큘럼에 "Review Pages" 62개를 독립 구성요소로 편성
  (https://www.freecodecamp.org/news/freecodecamp-turns-10-major-curriculum-updates/).
  Codecademy 코스별 Cheatsheet (https://www.codecademy.com/resources/cheatsheets/all).
- 적용: 레슨 용어 표를 빌드타임에 모듈별로 모아 `/review/[module]` 정적 생성. 선행 조건:
  용어 표의 구조화. 개강 직전 주 일정표에 "모듈 복습 페이지 훑기" 배정.
- 작업 규모: 구조화돼 있으면 반나절, 아니면 1~2일 / 충돌: 없음

### 레슨 선행관계 한 줄 표시 (경량 개념 지도)
- 출처: Exercism 신러버스의 개념 의존성 트리 (https://exercism.org/docs/building/tracks/syllabus).
- 적용: frontmatter `prerequisites` → 레슨 상단 "이 레슨의 재료" 링크 칩. 전체 지도
  페이지는 안 만든다(일정표가 순서 제공).
- 작업 규모: 반나절~1일 / 충돌: 없음 (커리큘럼이 선형이라 우선순위 낮음)

## 사이트 한 줄 평
- Execute Program: 실행기가 아니라 "완료 후 복습 스케줄 + 졸업 규칙"이 제품의 진짜 심장
- Exercism: "완료 전엔 본질만, 완료 후에 비교·심화" 공개 순서 설계
- Brilliant: 스트릭 보호권을 "벌금"이 아니라 "저축"으로 설계한 디테일
- Codecademy: 힌트→정답 점진 공개, 코스별 치트시트
- DataCamp: 정답 열람에 낮은 비용을 매겨 회상 시도 먼저
- freeCodeCamp: Review Page를 레슨과 동급 구성요소로 승격
- Boot.dev: embers(초과 노력 적립→결석일 소진), 약점 가중 복습

미확인: Execute Program 오답 시 단계 하락 여부, Boot.dev "스트릭 완주율 4.2배" 수치(3자 출처).
