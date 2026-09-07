# Round 3-L: 대학·정규 커리큘럼 공개 사이트 (2026-09-01)

조사: Full Stack Open(정밀), The Odin Project, teachyourselfcs, OSSU, MIT OCW Scholar
18.06SC, nand2tetris, Stanford CS106B

### 신규 발견 6건

1. **변경 줄 하이라이트** — FSO는 거의 모든 예제에서 직전 대비 달라진 줄만 배경색
   (`highlight-line` 마커, 소스 저장소에서 수십 회 확인). 실행 없이 읽는 학습자에게
   diff가 유일한 변화 추적 수단. **rehype-pretty-code가 `{3,7-9}` 메타로 이미 지원** —
   파이프라인 무변경, 저작 컨벤션만. 1일 (2단계+ 발전 예제가 있는 레슨 선별).
2. **워크로드 계약** — FSO "One part ≈ one week (15-20 hours)". 모듈 헤더에
   estimatedMinutes 합산 "총 ~7시간 · 남은 ~3.5시간" + 무거운 모듈 예고. 반나절.
3. **코어/심화 + 밀림 시 강등 출구** — teachyourselfcs "시간 없으면 이 2권만", OSSU
   "이미 배운 게 확실할 때만 스킵". frontmatter `priority: core|plus` + 페이스 판정
   '밀림'일 때 "코어만 따라가면 완주 가능" 문구 + 모듈별 스킵 기준("~을 이미 설명할 수
   있다면 6번만"). 1일+콘텐츠 반나절.
4. **완료 예측일** — OSSU 스프레드시트 패턴. "최근 7일 속도 기준 예상 완주일 9/27
   (개강 3일 전)" — 이진 판정을 날짜로 번역(목표 구배). 완료 타임스탬프로 계산. 반나절.
5. **단위 경계 누적 복습** — MIT OCW 유닛마다 review→exam, FSO mastery learning 명시.
   모듈 경계 복습 페이지 (S5·round2-j와 수렴 — 문항 추출 재사용). 1일.
6. **"앞에서 가져오는 것" 박스** — nand2tetris 의존성 절연(내장 완성본 제공 — 해당
   문구는 미확인, 코스 철학으로 알려진 내용). 레슨 상단 2~3줄 선수 개념 요약+링크.
   전수는 2~3일이라 비권장 — 의존성 강한 Step 2 구간만 절충. (S6과 수렴)

### 한 줄 평
- FSO: 최대 수확 — 워크로드 계약·mastery learning·diff 하이라이트·a~d 세션화. 진행률
  UI는 외부 위임(우리가 앞섬). '웹 프로그래머의 서약' 리추얼은 실습 전제라 적용성 낮음
- Odin: 코스 카드 "N Lessons / N Projects" 선노출 외 신규 없음 (실습 중심 충돌)
- teachyourselfcs: 스킵·우선순위 안내의 교과서 / OSSU: Duration·Effort 표준화 + 예측
  스프레드시트 / MIT OCW 18.06SC: 독학자용 세션 고정 레시피 + 유닛 경계 복습 /
  nand2tetris: 의존성 절연 / CS106B: 일정 그리드 외 다중 사용자 인프라라 무의미

우선순위: 예측일(반나절) → 워크로드(반나절) → diff 하이라이트(1일) → 코어/심화(1일) →
모듈 복습(1일) → 선수 박스(구간 한정).
