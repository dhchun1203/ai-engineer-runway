---
status: partial
phase: 06-site-wide-design-polish
source: [06-VALIDATION.md, 06-UI-SPEC.md, 06-CONTEXT.md D-93, 06-D97-MEASUREMENT.md]
started: 2026-08-26T00:00:00Z
updated: 2026-08-26T00:00:00Z
---

## Current Test

[testing complete]

## Tests

이 파일은 계획(06-08-PLAN.md Task 3)이 정의한 세 그룹으로 나뉜다: **UAT-1**(테스트 1,
실기기 iPad Safari), **UAT-2**(테스트 2~7, backstop 시각 확인 6건), **UAT-3**(테스트 8,
쿠키 있는 홈 재확인). **테스트 9**는 06-08 Task 4(SC2 6종 화면 시각 일관성 체크포인트)가
`human_verify_mode: end-of-phase` 정책에 따라 이 파일로 이월된 항목이다.

### 1. [UAT-1] 실기기 iPad Safari 확인 (D-93)

**왜 사람이 해야 하나:** 이 Phase의 모든 측정(e2e-typography.mjs, e2e-mobile-overflow.mjs)은
Playwright Chromium으로 돌았다. Safari의 `-webkit-` 렌더링 차이, 실제 손가락 터치 히트박스,
100vh와 주소창 겹침 문제는 원리적으로 Chromium이 볼 수 없다 — 자동화 불가 항목이라 계획
태스크가 아니라 UAT로만 남긴다.

**할 일 (아이패드 Safari로 아래 6개 URL을 순서대로 연다):**

- [ ] https://ai-engineer-runway.vercel.app/
- [ ] https://ai-engineer-runway.vercel.app/curriculum
- [ ] https://ai-engineer-runway.vercel.app/schedule
- [ ] https://ai-engineer-runway.vercel.app/lesson/1-1-course-orientation
- [ ] https://ai-engineer-runway.vercel.app/step/1
- [ ] https://ai-engineer-runway.vercel.app/about

**세로 모드에서 확인 (통과 기준을 각 줄에 명시):**

- [ ] 6개 화면이 전부 깨짐 없이 렌더된다 — 통과 기준: 텍스트/이미지 겹침이나 잘림이 없다
- [ ] `/lesson/1-1-course-orientation`에서 구간 테이프의 칸 하나를 손가락으로 탭하면
      해당 구간으로 부드럽게 이동한다 — 통과 기준: 탭한 칸의 구간 제목이 화면에 나타난다
- [ ] 같은 레슨의 코드 블록을 손가락으로 좌우로 밀면 가로 스크롤된다 — 통과 기준: 스와이프
      방향대로 코드가 이동하고, 페이지 전체가 함께 밀리지 않는다
- [ ] 완료 버튼(`CompleteButton`)과 상단 내비 항목을 손가락으로 눌러본다 — 통과 기준:
      의도한 항목이 오탭 없이 정확히 눌린다(터치 타깃 44px 계약이 실기기에서도 유효한지)

**가로 모드로 전환해 같은 6개 화면을 다시 훑는다:**

- [ ] 세로에서 괜찮던 것이 가로에서 깨지지 않는다 — 통과 기준: 위 4개 확인 항목이 가로
      모드에서도 동일하게 통과한다(특히 100vh 관련 레이아웃이 주소창과 겹치지 않는지)

expected: 6종 화면이 세로/가로 모두에서 깨짐 없이 렌더되고, 구간 테이프 탭 이동·코드 블록
가로 스크롤·터치 정확도가 전부 통과 기준을 만족한다.
result: blocked
blocked_by: physical-device
reason: |
  실기기 iPad Safari가 필요하고, 이 항목이 가리키는 배포 URL은 아직 Phase 6 코드를 받지
  못했다 — master가 origin보다 53커밋 앞서 있어 Vercel 배포본은 Phase 6 이전 상태다.
  push 후 실기기에서 확인해야 한다.
  참고(자동 확인됨, Chromium 한정): e2e-mobile-overflow 21/21 조합 가로 오버플로 0,
  1024x768 가로 모드 6개 라우트 전부 오버플로 0.

### 2. [UAT-2a] Section Tape — 현재 구간 제목이 칸 폭을 넘칠 때의 처리

**왜 사람이 해야 하나:** 실제 레슨 h2 제목 길이 분포에 의존하는 시각 확인 대상이라
픽셀 assert로 환원되지 않는다(06-UI-SPEC.md § UI Considerations backstop 목록 1번).

- [ ] https://ai-engineer-runway.vercel.app/lesson/1-1-course-orientation — 이 레슨의 6번째
      구간 제목("6. 핵심 정리 및 스스로 점검", 이 코스에서 가장 긴 h2 제목)이 대상이다

**할 일:** 브라우저 폭을 375px로 맞추고 구간 테이프의 마지막 칸을 탭한다.

expected: 현재 구간 제목이 테이프 칸 밖(그 아래)에 자연스럽게 표시된다 — 문서 수준
가로 오버플로는 e2e-mobile-overflow.mjs가 이미 0으로 확인했으므로(D-91), 여기서는
줄바꿈/말줄임 처리가 시각적으로 어색하지 않은지만 본다.
result: issue
severity: minor
reported: |
  현재 구간 라벨이 칸 폭보다 넓을 때 줄바꿈도 말줄임도 하지 않고, 테이프의
  overflow-x:hidden에 의해 왼쪽이 잘린다. 라벨이 칸 안에서 가운데 정렬(items-center)이라
  테이프 왼쪽 끝에 붙은 좁은 칸에서는 넘친 만큼이 그대로 화면 밖으로 잘려나간다.
  실측(/lesson/1-1-course-orientation):
    375px — 1번 칸 칸폭 28px / 라벨폭 92px / 왼쪽 32px 잘림 ("01 1. 학습 목표" → ". 1. 학습 목표")
            2번 칸 32px 잘림, 3번 칸 7px 잘림
    768px — 1번 칸 17px 잘림, 2번 칸 17px 잘림
  문서 수준 가로 오버플로는 0이라 e2e-mobile-overflow는 통과한다 — 잘림이 테이프 내부에서
  일어나기 때문에 그 게이트가 볼 수 없다.

### 3. [UAT-2b] 그리드 카드 — 긴 레슨 제목의 줄바꿈 (StepCard / TodayLessonCard)

**왜 사람이 해야 하나:** truncate 클래스를 새로 도입하지 않는다는 것이 이 Phase의 계약이라
(카드 높이만 늘어나야 한다), 실제 최장 제목 렌더는 시각 확인 대상이다.

이 코스의 최장 레슨 제목: **"[Project 1] AI 쇼핑몰 프론트엔드 준비 가이드"**
(slug: `2-4-project-ai-shop-frontend`, 31자).

- [ ] https://ai-engineer-runway.vercel.app/ — 홈의 "오늘의 학습" 카드(`TodayLessonCard`)를 연다.
      오늘 배정된 레슨 제목이 카드 폭보다 길면 줄바꿈되고 카드 높이만 늘어나는지 확인한다
      (잘리거나 가로로 넘치면 실패)
- [ ] 오늘 배정 레슨이 위 최장 제목이 **아니라서** 판단하기 애매하면, 참고용으로
      https://ai-engineer-runway.vercel.app/lesson/2-4-project-ai-shop-frontend 를 직접 열어
      제목 길이를 눈으로 가늠한 뒤, 이 레슨이 실제 배정일이 되는 날(또는 아무 날이나 카드
      제목이 두 줄 이상으로 자연스럽게 줄바꿈되는 것을 관찰할 수 있는 날) 다시 확인한다

expected: 레슨 제목이 아무리 길어도 카드 안에서 줄바꿈되고, 카드 높이만 늘어난다 —
텍스트가 잘리거나(truncate) 카드 밖으로 넘치지 않는다.
result: pass
source: automated
evidence: |
  375px 홈·커리큘럼 전수 검사 — text-overflow:ellipsis 이거나 nowrap 상태로 실제 잘린 요소
  0개, 카드 테두리를 가로로 넘는 자식 요소 0개.
  스크린샷: .planning/ui-reviews/06-uat/375-home.png, 375-curriculum.png

### 4. [UAT-2c] 375px에서 카드 내부 요소 오버플로 (시각 재확인)

**왜 사람이 해야 하나:** e2e-mobile-overflow.mjs가 문서 수준 가로 오버플로 0을 이미
자동으로 확인했다(D-91) — 여기서는 카드 *내부* 요소(배지·제목·소요시간)의 배치가
시각적으로 자연스러운지만 본다(자동 게이트가 못 보는 "보기 좋음" 판단).

- [ ] https://ai-engineer-runway.vercel.app/curriculum — 브라우저 폭을 375px로 맞추고
      Step 카드 3장 안의 배지·제목·모듈/레슨 수·소요시간이 카드 테두리를 넘지 않는지 확인
- [ ] https://ai-engineer-runway.vercel.app/ — 같은 폭에서 "오늘의 학습" 카드 안의
      깊이 배지·소요시간 배지가 줄바꿈되며 카드 안에 머무는지 확인

expected: 카드 내부 어떤 요소도 카드 테두리를 가로로 넘지 않는다.
result: pass
source: automated
evidence: |
  375px /curriculum Step 카드 3장의 모든 자식 요소를 카드 경계와 대조 — 넘는 요소 0개.
  홈 섹션 4개도 동일하게 0개이고 문서 수준 가로 오버플로도 없음.

### 5. [UAT-2d] 레슨 페이저 — 인접 레슨 제목과 라벨 줄바꿈

**왜 사람이 해야 하나:** 리터럴 화살표 제거(D-R4K-7) 후 chevron과 라벨 조합의 줄바꿈
지점이 바뀔 수 있어 시각 확인 대상이다.

- [ ] https://ai-engineer-runway.vercel.app/lesson/2-3-react-components — "다음 레슨" 버튼이
      가리키는 레슨이 이 코스의 최장 제목 레슨(`2-4-project-ai-shop-frontend`)이다

**참고:** 06-06에서 페이저 라벨이 실제 다음/이전 레슨 제목이 아니라 고정 문구
("이전 레슨"/"다음 레슨" + 화살표 아이콘 1개)로 확정됐다(D-R4K-7) — 그래서 인접 레슨
제목이 아무리 길어도 페이저 버튼 라벨 자체의 줄바꿈에는 영향을 주지 않는다. 이 항목은
그 구조적 사실을 전제로, 375px에서 두 버튼이 정상적으로 쌓이는지만 확인한다.

- [ ] 브라우저 폭을 375px로 맞춘다 — 이전/다음 버튼 2개가 겹치거나 잘리지 않고
      세로로 자연스럽게 쌓이는지 확인

expected: 페이저 라벨이 고정 문구("이전 레슨"/"다음 레슨")로 깨끗하게 표시되고,
375px에서 두 버튼이 겹치지 않는다.
result: pass
source: automated
evidence: |
  375px /lesson/2-3-react-components — 버튼 2개 라벨이 정확히 ["이전 레슨","다음 레슨"],
  사각형 교차 검사로 겹침 없음, 화면 밖 잘림 없음. 리터럴 화살표 문자 0개, 버튼당 아이콘
  1개씩으로 D-R4K-7 이중 글리프 제거 확인.
  스크린샷: .planning/ui-reviews/06-uat/375-lesson-pager.png

### 6. [UAT-2e] 375px에서 진행률 바·페이스 패널 오버플로 (시각 재확인)

**왜 사람이 해야 하나:** e2e-mobile-overflow.mjs가 홈 라우트에서 문서 수준 가로
오버플로 0을 이미 확인했다(D-91) — 여기서는 진행률 바(퍼센트 숫자·막대)와 페이스
패널의 실제 렌더가 시각적으로 자연스러운지만 본다.

- [ ] https://ai-engineer-runway.vercel.app/ — 잠금 해제된(10년 유효 쿠키를 가진) 상태로
      접속해 브라우저 폭을 375px로 맞춘다. 전체 진행률 요약(퍼센트·막대)과 페이스 패널이
      카드 밖으로 넘치지 않는지 확인

expected: 진행률 바와 페이스 패널의 숫자·막대·문구가 375px에서 카드 밖으로 넘치지 않는다.
result: pass
source: automated
evidence: |
  375px 잠금 해제 상태 홈 — 섹션 4개(오늘 카드·페이스 패널·밀린 레슨·진행률 요약)의 자식
  요소를 각 섹션 경계와 대조, 넘는 요소 0개.
  스크린샷: .planning/ui-reviews/06-uat/375-home.png

### 7. [UAT-2f] 밀린 레슨 목록 — 긴 제목 줄바꿈

**왜 사람이 해야 하나:** 카드 리스트 행 계약(06-03)을 따르는지와 함께, 실제 긴 제목의
줄바꿈이 시각적으로 자연스러운지는 시각 확인 대상이다.

- [ ] https://ai-engineer-runway.vercel.app/ — 잠금 해제된 상태로 접속해 "밀린 레슨" 목록이
      보이면(실제로 밀린 레슨이 있을 때만 렌더된다), 각 행의 제목이 잘리지 않고 줄바꿈되며
      행 높이만 늘어나는지 확인한다. 참고용 최장 제목: `2-4-project-ai-shop-frontend`
      ("[Project 1] AI 쇼핑몰 프론트엔드 준비 가이드")
- [ ] 목록이 비어 있으면(현재 밀린 레슨이 없으면) 이 항목은 "해당 없음"으로 표시하고
      넘어간다 — 05-UAT.md의 선례와 같은 이유로, 진도 데이터를 인위적으로 조작해 밀린
      상태를 만들지 않는다(실제 진도 데이터 오염 방지)

expected: 밀린 레슨이 있다면 각 행의 제목이 잘리지 않고 자연스럽게 줄바꿈된다.
없으면 "해당 없음"으로 통과 처리한다.
result: pass
source: automated
evidence: |
  확인 시점에 밀린 레슨 1개가 실제로 렌더됨("과정 운영 방식과 학습 준비", 2026-08-25) —
  빈 목록 우회가 아니라 실제 렌더 상태로 확인했다. 375px에서 잘린 요소 0개, 행이 06-03의
  리스트 행 계약대로 렌더. 최장 제목 레슨은 이 날짜의 배정 대상이 아니어서 이번 확인
  범위에는 들어오지 않았다.

### 8. [UAT-3] 쿠키 있는 홈의 빈 캔버스 재확인 (D-97 후속)

**왜 사람이 해야 하나:** 06-D97-MEASUREMENT.md의 판정(쿠키 있는 실사용 상태 빈 영역
0%)이 자동 스크립트 실측이었다 — Phase 종료 시 사람이 실제 화면으로 한 번 승인한다.
06-07이 `/curriculum`은 재배치했지만 홈(`/`)은 판정에 따라 손대지 않았다.

- [ ] https://ai-engineer-runway.vercel.app/ — 잠금 해제된 상태로 768×1024(아이패드
      세로) 창 크기에서 열어본다. D-day·오늘 카드·페이스 패널·밀린 레슨·전체 진행률
      5개 섹션이 뷰포트를 넘겨 렌더되어 빈 영역이 보이지 않는지 확인
- [ ] https://ai-engineer-runway.vercel.app/curriculum — 같은 크기에서 전체 진행률과
      D-day가 Step 카드 3장 위에 함께 보이는지 확인(06-07이 추가한 재배치)

expected: 홈은 06-D97-MEASUREMENT.md가 실측한 대로 5개 섹션이 뷰포트를 넘겨 빈 캔버스가
보이지 않는다. `/curriculum`은 전체 진행률·D-day가 Step 카드 위에 함께 렌더된다.
result: pass
source: automated
evidence: |
  768x1024 잠금 해제 상태 — 홈 본문 높이 1033px > 뷰포트 1024px(섹션 6개 렌더)로 D-97 판정
  재확인. 다만 여유가 9px로 얇다 — 오늘 카드나 밀린 레슨이 줄면 다시 빈 영역이 생길 수
  있어 v2 재확인 후보로 남긴다.
  /curriculum은 진행률·D-day가 Step 카드 위에 함께 렌더되고 본문 1112px로 뷰포트를 넘긴다
  (06-07 재배치 확인).
  스크린샷: .planning/ui-reviews/06-uat/768-home.png, 768-curriculum.png

### 9. [SC2] 6종 화면 시각 일관성 (06-08 Task 4 — end-of-phase UAT로 이월)

**왜 사람이 해야 하나:** 성공 기준 2("6종 화면이 아이패드 세로/가로에서 같은 셸로 읽힌다")는
시각적 일관성 판단이라 픽셀 assert로 환원되지 않는다 — 자동 게이트 13종이 전부 초록불이어도
이 항목만은 사람 눈이 필요하다.

**이월 사유:** 06-08 Task 4는 원래 계획상 실행 중 체크포인트(`checkpoint:human-verify`,
`gate="blocking"`)였다. `.planning/config.json`의 `workflow.human_verify_mode: "end-of-phase"`
설정에 따라 — 06-01 실행자가 자신의 아이패드 확인 항목에 이미 적용한 것과 같은 정책으로 —
이 항목은 실행 중 즉시 승인이 아니라 Phase 종료 시점의 이 UAT 파일로 이월한다. 코드 산출물은
없다(이 태스크에 구현이 남아있지 않다) — 남은 것은 순수한 시각 판단뿐이다.

개발 서버를 띄운다:

```
npm run dev
```

브라우저 창을 **768×1024(아이패드 세로)** 크기로 맞추고 아래 6개를 순서대로 연다:

- [ ] http://localhost:3000/
- [ ] http://localhost:3000/curriculum
- [ ] http://localhost:3000/schedule
- [ ] http://localhost:3000/lesson/1-1-course-orientation
- [ ] http://localhost:3000/step/1
- [ ] http://localhost:3000/about

**각 화면에서 볼 것 (4가지):**

- [ ] **내비 위치** — 상단 내비 바가 6개 화면 모두에서 같은 높이·같은 좌우 여백에 있는가
- [ ] **컨테이너 여백** — 본문이 화면 가장자리에서 같은 거리만큼 떨어져 있는가. 홈·커리큘럼·
      일정표는 넓고(5xl) 레슨·Step·소개는 좁은데(3xl), **이 폭 차이는 의도된 것**이다 —
      확인할 것은 폭이 아니라 좌우 패딩과 섹션 사이 간격이 같은 규칙으로 보이는가다
- [ ] **카드 모양** — 커리큘럼의 Step 카드 3장과 홈의 오늘 카드가 같은 모서리 둥글기·같은
      배경·같은 안쪽 여백을 갖는가. 마우스를 올리면 배경이 미세하게 밝아지는가
- [ ] **레슨 화면** — 구간 테이프가 본문 위에 붙어 있고, 칸 하나를 누르면 해당 구간 제목이
      테이프에 가리지 않고 그 아래에 나타나는가. 본문 안 인라인 코드에 백틱 문자(`` ` ``)가
      보이지 않고 회색 배경 칩으로 보이는가. 페이저 버튼이 `‹ 이전 레슨`처럼 화살표를
      **한 번만** 쓰는가

그다음 브라우저 창을 **1024×768(아이패드 가로)** 로 바꿔 같은 6개를 다시 훑는다 —
세로에서 괜찮던 것이 가로에서 무너지지 않는지만 본다:

- [ ] 가로 모드(1024×768)에서 위 6개 화면 전부 세로 모드와 동일하게 4가지 항목이 통과한다

expected: 6개 화면이 "한 사람이 만든 하나의 사이트"로 읽히면 통과. 어떤 화면 하나가
"다른 템플릿에서 가져온 것 같다"고 느껴지면 그 화면과 이유를 적어 실패로 보고한다.
result: issue
severity: major
origin: deferred-to-uat (06-08 Task 4, human_verify_mode=end-of-phase)
reported: |
  4개 확인 항목 중 3개는 자동 확인으로 통과:
    - 내비 위치·높이 — 6종 화면 전부 top=0 / height=61px 동일
    - 본문 좌우 패딩 — 6종 전부 24px (max-width 1024 vs 768 차이는 의도된 것)
    - 카드 모양 — 커리큘럼 Step 카드와 홈 오늘 카드가 모서리 8px / 배경 rgb(231,236,243) /
      안쪽 여백 16px로 동일. 인라인 코드 백틱 0개에 칩 배경 적용, 페이저 화살표 1개.
  네 번째 항목("칸 하나를 누르면 해당 구간 제목이 테이프에 가리지 않고 그 아래에 나타나는가")이
  실패한다 — 스크롤은 정확한 위치로 가지만 테이프가 표시하는 구간 제목이 항상 한 칸 이전
  것이다. 2~6번 칸 5개 전부 재현(768px·375px 동일).
  전체 인상에 대한 시각 판단은 실기기 확인(테스트 1)과 함께 남아 있다.

## Summary

total: 9
passed: 6
issues: 2
pending: 0
skipped: 0
blocked: 1

## Gaps

```yaml
- gap_id: G-06-9
  truth: "레슨 화면에서 구간 테이프의 칸을 누르면 그 칸에 해당하는 구간 제목이 테이프에 표시된다"
  status: failed
  reason: |
    칸을 누르면 스크롤은 정확한 위치로 이동하지만 테이프가 표시하는 구간 제목은 항상 한 칸
    이전 것이다. 2~6번 칸 5개 전부, 768px·375px 양쪽에서 재현(5/5).
    원인(확인됨): 서로 맞물려야 하는 상수 두 개가 어긋나 있다.
      - src/app/globals.css:243  .prose h2 { scroll-margin-top: 52px }  (테이프 44px + 여유 8px)
      - src/components/section-tape.tsx:53,113  TAPE_HEIGHT_PX = 44,
        updateCurrent()가 현재 구간을 고를 때 쓰는 조건은 top <= TAPE_HEIGHT_PX + 1 = 45
    scroll-margin-top 때문에 이동한 h2는 정확히 top=52px에 놓이는데, 45px 임계값은 이를
    "아직 지나지 않았다"로 판정해 직전 구간이 현재로 남는다. 측정값: 2~6번 칸 클릭 후
    대상 h2의 top이 전부 52px.
    자동 게이트가 못 잡은 이유: e2e-typography는 글자 크기만, e2e-mobile-overflow는 문서
    가로 오버플로만 본다. 어느 쪽도 클릭 후 현재 구간 표시를 검사하지 않는다.
  severity: major
  test: 9
  artifacts:
    - src/components/section-tape.tsx
    - src/app/globals.css
  missing:
    - "두 상수를 한 곳에서 유도하도록 묶고(예: 테이프 높이+여유를 단일 소스로), updateCurrent의 임계값을 scroll-margin-top과 일치시킨다"
    - "칸 클릭 후 표시되는 구간이 클릭한 칸과 일치하는지 검사하는 자동 게이트 추가 — 이 계열 결함을 다시 놓치지 않도록"

- gap_id: G-06-2
  truth: "현재 구간 제목이 칸 폭을 넘칠 때 잘리지 않고 읽을 수 있게 표시된다"
  status: failed
  reason: |
    라벨이 칸 안에서 가운데 정렬이고 whitespace-nowrap이라, 테이프 왼쪽 끝에 붙은 좁은
    칸에서는 넘친 부분이 테이프의 overflow-x:hidden에 잘려나간다.
    실측: 375px 1번 칸 칸폭 28px / 라벨폭 92px / 왼쪽 32px 잘림 →
    "01 1. 학습 목표"가 ". 1. 학습 목표"로 보인다. 2번 칸 32px, 3번 칸 7px.
    768px에서도 1·2번 칸이 각각 17px 잘린다.
    문서 수준 오버플로는 0이라 e2e-mobile-overflow는 통과한다 — 잘림이 테이프 내부에서
    일어나기 때문.
  severity: minor
  test: 2
  artifacts:
    - src/components/section-tape.tsx
  missing:
    - "좁은 칸에서 라벨이 테이프 경계를 넘지 않도록 위치를 보정하거나(칸 대신 테이프 기준 배치), 넘칠 때 말줄임/줄바꿈 규칙을 정한다"
```
