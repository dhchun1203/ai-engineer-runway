---
phase: quick-260901-etq
plan: 01
status: complete
subsystem: mixed
tags: [review-ladder, tutor, schedule, theme, gates, content, research-tier1]

requires:
  - phase: research-edu-sites
    provides: "3단 추천 목록 + 실측 설계(round2-h) + 반대 심문 판정"
provides:
  - "복습 사다리(1·3·7·21일, 자기 신고, 3회 졸업) — 홈 '오늘의 복습' 카드"
  - "튜터 프롬프트 v2 — 모드 메뉴·Feynman·[레슨 밖]·진도 동봉(고장 수리)"
  - "Step 2 실행 결과 블록 16개 · 점검 문항 11개 왜-형 재작성"
  - "다크 3단·페이저 제목·마지막 주 재배정(B안)"
affects: [home, lesson-page, schedule, theme, gates, lesson-content, supabase]

actuals:
  tasks: 10
  commits: 9
---

# 리서치 1단 10건 일괄 구현

리서치(edu-sites) 3단 목록의 "바로 들일 것" 전부. 사용자가 코드 실행 환경
재범위화도 함께 결정(PROJECT.md 기록) — 그건 다음 파일럿으로.

## 들어간 것

1. **게이트 확장** — L3 summary 허용 목록 + L4 전 summary 일반화(사각지대 봉쇄),
   G9/G17 새 진도 조회 함수, G22 scroll-to-top rAF 계약.
2. **복습 사다리 V0+V1** — lesson_review 테이블(적용 완료), review.ts 순수 모듈
   + check-review 13케이스(앵커를 빌드 산출물과 대조), rehype-slug 도입(앵커 상수
   1개), 홈 카드(만기 목록→점검 문제 앵커, [복습 완료] 자기 신고, 만기 0건 배지).
   방어선: 벌점 없음·3회 졸업·진행 잠금 금지·관대한 판정 문구.
3. **튜터 프롬프트 v2** — 핵심은 고장 수리: "앞 레슨과 연결해줘"가 진도를 모르는
   클로드에게 가는 실행 불가능 지시였다 → 완료 레슨 목록 동봉 + 역류 방지.
   모드 메뉴(퀴즈: 한 문제씩·2회 시도·무점수 / Feynman: 역할 교대 / 실무 연결),
   [레슨 밖] 표찰.
4. **Step 2 실행 결과 블록** — 10편 16블록(레슨당 1곳은 "실행 결과 예측해 보기"
   접기). Python·SQL 상당수 실제 실행 대조. 출력 정확성은 게이트 불가 — 부패
   수용을 커밋 메시지에 명기.
5. **점검 문항 감사** — 70문항 중 11개(예/아니오형 8 + 목표 무관 메타 3)를 왜-형·
   예제 변형으로 재작성. 저작 체크리스트를 authoring-checklist.md로 통합.
6. **페이저 제목** — title이 오는데 렌더만 안 하던 것.
7. **다크 3단** — 기존 2단은 시스템 자동 전환을 영구 차단하는 결함. 자동=키 삭제.
   실측으로 잡은 세부: 클래스 불변 전환에서 라벨이 낡던 것 → 커스텀 이벤트 보강.
8. **정답 접기 무저장 원칙** 명문화(globals.css).
9. **마지막 주 재배정(B안, 사용자 선택)** — 시뮬레이션 3안 제시 후 결정. 9/26 레슨
   마감, 9/27~29 복습 사흘. SCHEDULE_SPAN_DAYS=33 고정 달력 의미론.

## 검증

check-schedule 35 · check-pace 29 · check-review 13 · check-lesson-structure 35편 ·
check-progress-gates 전체 · check-design-tokens · check-brand · check-manifest ·
check-route-rendering · check-supabase-note 왕복 · check-font-glyph-coverage(• 보충) ·
e2e-today 8+7 · e2e-mobile-overflow 21조합 · next build — 전부 통과.

브라우저 실측(아이패드 세로): 복습 카드 만기 7편 렌더 + 앵커 착지 114px(테이프
아래 정확) + 다크 3단 순환·시스템 추종 + 페이저 제목 + 일정표 B안(9/27~29 복습
3행·9/30 개강). 잠복 회귀 2건도 이 과정에서 발견·수리(e2e-today s6 창, G22).

## 남긴 것

- 실행 결과 블록의 출력 정확성은 코드 수정 시 함께 갱신해야 하는 무게이트 계약.
- 2단 후보(/review 세션·O/△/X·용어집·힌트 사다리 등)는 리서치 보고서 참조.
- 코드 실행 파일럿(Pyodide 지연 로드)이 다음 큰 작업.
