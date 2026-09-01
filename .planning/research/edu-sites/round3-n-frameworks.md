# Round 3-N: 설계 프레임워크·연구의 제품 구현 (2026-09-01)

### Diátaxis 진단
우리 6장 구조 대응: 2·3장=Explanation, 4장=Tutorial의 읽기 전용 변형(worked example),
5장=How-to 조각, 6장=Reference. compass는 "스케일 무관 유연 적용" 명시 — **레슨 내 혼합은
문제 아님.** 유일한 구조적 공백: **전 레슨을 가로지르는 Reference 층(글로벌 용어집)** —
학습 모드(순서대로)와 조회 모드(필요할 때)는 다른 진입점이 필요하다(Django 문서가 모범).
→ /glossary. **S5와 3번째 독립 수렴.** 반나절~1일.

### worked example / faded scaffolding
- **빈칸 버전 예제 (backward fading)** — Renkl & Atkinson: 완성 예제→completion problem→
  스스로, 마지막 단계부터 지우는 backward fading이 최유리(EEF 교차). react.dev 챌린지
  (본문 예제의 변형 + 시작 코드 + 접힌 정답)가 제품 구현.
  적용: 4장 완성 코드 **뒤에** 같은 코드에서 핵심 1~3줄을 `# ___ 채워보세요`로 비운
  블록 + 기존 details 정답 접기. 실행 불필요(지면 완성 과제 — 실행 제외 결정과 무충돌).
  마크업 신규 0, 콘텐츠 레슨당 15~20분. 파일럿 3편 반나절. **R2-G의 클로드 #TODO 패턴과
  수렴(정적 vs 대화 구현).**
- **점검 문제 = 예제의 변형 + 목표와 1:1** — react.dev 챌린지가 전부 본문 예제의
  고장·확장 변형이고 "You will learn"과 대응. 근전이 회상 + constructive alignment.
  현행 파일럿 점검 문제는 목표 일부만 커버하고 예제와 독립적 — 저작 지침에 "점검 문제는
  4장 예제의 변형으로, 목표당 최소 1문항" 추가. 비용 ~0.

### 치트시트
복습에 쓰이는 형태 = **산문 0, 코드 스니펫+한 줄 주석, 한 화면** (DevHints). TypeScript
공식이 다운로드형 카드(PNG/PDF) 제공. OverAPI는 링크 모음이라 낙제(나쁜 대조).
적용: **모듈 단위** 요약 카드 페이지 + 기존 PDF 내보내기에 태움 — 개강 직전 총복습에
정확히 맞음. 1~2일. (S5 계열 수렴)

### 학습 목표 서술
우리 1장은 이미 Bloom can-do 표준 충족("~할 수 있다"). MDN Curriculum보다 규율이 낫다.
예외 패턴만 정비: "무엇을 의심해야 하는지 **안다**"(1-1-dev-env) 류 '안다'형 →
"말할 수 있다"로. 반나절 미만.

### 우선순위
① 점검 문제 정렬 지침(비용~0) ② /glossary(반나절~1일) ③ 빈칸 예제 파일럿 3편
④ '안다'형 정비(편승) ⑤ 모듈 치트시트(개강 2주 전 국면)

한 줄 평: diataxis.fr(원전, 혼합 정죄 안 함) / Django docs(실적용 모범) / react.dev
(이번 라운드도 최고 수확) / DevHints(치트시트 기준점) / TS cheatsheets(공식 다운로드형) /
OverAPI(낙제 대조) / MDN Curriculum(동사 규율 우리가 낫다) / MS Learn("you'll be able
to" 표준) / 연구 문헌(Renkl·EEF — backward fading 근거)
