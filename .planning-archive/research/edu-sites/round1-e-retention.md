# Round 1-E: 유지·복습 메커니즘 (조사 원문, 2026-09-01)

조사 대상: Execute Program, Anki/SM-2, Duolingo Practice Hub, Quizlet, Brilliant, Readwise

핵심 결론: **자동 채점 없이도 회상 연습·간격 반복은 완전 구현 가능.** Anki 자기 판정,
Quizlet "Know/Still learning", Readwise soon/later/someday — "학습자가 스스로 판정"이
이 계열의 주류. 우리에게 빠진 것은 "언제(간격)"와 "어디서(재등장 지점)" 두 가지뿐.

### 완료 레슨의 간격 재등장 — "오늘의 복습" 슬롯
- 출처: Execute Program — 완료 레슨 문제가 1→3→7→…일 사다리로 재등장, 4번째 성공(~64일)
  졸업. 결국 맞히면 벌점 없음 (https://mike.place/2020/executeprogram/ ,
  https://notes.andymatuschak.org/zX7RdiHGbHYnkFznUr9VZx7).
- 왜 효과: 간격 효과 + 시험 효과. 저부담(벌점 없음) 설계가 복습을 시험이 아닌 연습으로.
- 적용: 홈 "오늘의 학습" 아래 "오늘의 복습" 카드. 고정 사다리 1→3→7→21일 — Supabase
  완료 시각만으로 클라이언트 계산, 새 테이블 불필요. 점검 문제 섹션 **앵커 링크**(재독
  아님, 회상). 개강 후 이 슬롯이 사이트의 주 용도가 됨.
- 규모: 1일 / 충돌: 없음

### 용어 표의 자기 판정 플래시카드화
- 출처: Anki SM-2 — Again/Hard/Good/Easy 자기 판정만으로 간격 결정, 기계 채점 없음
  (https://help.remnote.com/en/articles/6026144). Quizlet — "Know / Still learning"
  2-더미 분류 (https://help.quizlet.com/hc/en-us/articles/360030988091).
- 왜 효과: 회상 연습의 정석. 판정 정확도는 부차적 — 회상 시도 자체가 효과의 대부분.
- 적용: 용어 표(용어→설명 쌍)를 카드로. 탭하면 뒤집힘 + "알겠음/아직" 2버튼. "아직"만
  Supabase 저장. **Anki식 ease factor는 과잉 — Quizlet식 2-더미가 구현 대비 최적.**
- 규모: 1~2일 (표 데이터화 여부에 따라) / 충돌: 없음 (판정 주체가 본인 = 채점 시스템 아님)

### 복습일(9/29)을 "약한 것 우선 + 섞어서" 세션으로
- 출처: Duolingo Practice Hub — "최근 학습 + 기록된 실수" 기반 세션, 문항 최대 10개
  (https://blog.duolingo.com/guide-to-duolingo-practice-hub/). Quizlet Progress —
  Still learning만 집중 복습.
- 왜 효과: 약한 항목 우선(효율) + 세션 크기 제한(부하) + 모듈 섞기 = 교차 연습
  (interleaving). Execute Program 리뷰어도 "같은 날 몰리면 인위적으로 쉬워진다" 동일 지적.
- 적용: `/review` 페이지 — ① "아직" 용어 전부 ② 완료 레슨 점검 문제 **셔플** ③ 세션
  10~15문항 컷 + "다음 세션". 문항마다 맞힘/틀림 자기 판정, 틀림이면 레슨 링크. 9/29
  복습일 일정표가 이 페이지를 가리키게.
- 규모: 1일 / 충돌: 없음

### 홈의 "오늘의 한 문제" — 초저부담 데일리 회상
- 출처: Brilliant — 바쁜 날 2분 세션으로 "0인 날" 제거 (https://brilliant.org/).
  Readwise Daily Review — soon(7일)/later(14일)/someday(28일) 자기 피드백
  (https://docs.readwise.io/readwise/docs/faqs/reviewing-highlights).
- 적용: 홈 카드 안에 완료 레슨 풀에서 뽑은 점검 문제 1개 인라인(질문+접기 정답+레슨 링크).
  날짜 시드 랜덤으로 하루 동안 고정. "오늘의 복습" 슬롯과 택일 가능 — 최소 버전이 이것.
- 규모: 반나절 / 충돌: 없음

### 스트릭의 1인용 변형 — "연속 학습일" 대신 "복습 빚 0일"
- 출처: Duolingo·Brilliant 스트릭 — 손실 회피 제품 관행(기억 개선 장치 아님).
- 적용: 새 레슨 스트릭은 기존 페이스 판정과 중복. 다르게 쓸 곳은 복습 — "복습 만기 N건"
  배지, 0건이면 체크. 1인 환경에선 스트릭 숫자보다 "오늘 만기를 비웠는가"가 정확한 유도.
- 규모: 반나절 (만기 계산의 부산물) / 충돌: 없음 (우선순위는 위 항목들이 먼저)

## 우선순위 제안 (규모 대비 효과)
1. "오늘의 복습" 슬롯 + 앵커 (1일) — 간격 반복의 뼈대
2. `/review` 세션 페이지 (1일) — 9/29에 실제로 쓸 물건, 개강 후 주 용도
3. 용어 플래시카드 + "아직" 저장 (1~2일)
4. 오늘의 한 문제 / 복습 만기 배지 (각 반나절)
전부 합쳐 3~4일. Supabase는 판정 기록 테이블 1개(또는 컬럼 추가)만.

## 사이트 한 줄 평
- Execute Program: 간격 반복을 커리큘럼 구조에 박은 유일한 사례 — 핵심 수확
- Anki/SM-2: "자동 채점 불필요"의 증거. ease factor는 과잉
- Duolingo Practice Hub: "최근+약한 것" 짧은 세션 설계. 스트릭·게임화는 1인용 대부분 무의미
- Quizlet: 2-더미 자기 분류 — 구현 대비 효과 최적
- Brilliant: "바쁜 날 2분" 최소 단위. 문제 우선 구조는 우리 포맷과 상충해 미채택
- Readwise: 소비한 콘텐츠의 소량 일일 재부상 + 자기 피드백 (추가 사례)

미확인: Duolingo half-life regression(원 논문 미확인 — 본문 근거로 안 씀), Practice Hub
세부 수치(공식 블로그 + duoplanet 기준).
