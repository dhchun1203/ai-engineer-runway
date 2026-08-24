---
status: testing
phase: 02-progress-tracking
source: [02-VERIFICATION.md]
started: 2026-08-24T00:00:00Z
updated: 2026-08-24T00:00:00Z
---

## Current Test

number: 1
name: 기기 전환 후 완료 상태 유지 (데스크톱 ↔ 아이패드)
expected: |
  완료/취소 상태가 두 기기·두 브라우저에서 동일하게 보인다 (성공 기준 1·2)
awaiting: user response

## Tests

### 1. 기기 전환 후 완료 상태 유지 (데스크톱 ↔ 아이패드)
expected: 데스크톱 브라우저에서 프로덕션 URL + /unlock?key=<UNLOCK_SECRET>로 잠금 해제 후 레슨 완료 → 하드 리프레시 → iPad Safari에서 같은 비밀 링크로 같은 레슨을 열면 완료 상태가 동일하게 보이고, iPad에서 취소하면 데스크톱 새로고침에도 반영된다
result: [pending]

### 2. 홈/Step 진행률 수치·CTA 육안 확인
expected: 홈의 전체 진행률 숫자·Step 카드 3장 바·모듈 배지 숫자가 실제 완료 개수와 일치하고, '이어서 학습하기' CTA가 실제 다음 미완료 레슨으로 이동한다 (성공 기준 3·4)
result: [pending]

### 3. 외부인 차단 확인 (시크릿 창 + DOM 검사)
expected: 시크릿 창(쿠키 없음)으로 프로덕션 홈·Step·레슨 세 화면을 열면 완료 버튼·진행률 바·요약 블록이 DOM에 아예 없고, 콘텐츠는 정상 공개되며, /unlock?key=아무거나 는 무효 안내를 보여준다 (성공 기준 5)
result: [pending]

### 4. 아이패드 터치·애니메이션·테마 체감
expected: 세로/가로 모드에서 완료 버튼·CTA·아코디언 헤더의 44px+ 터치 타깃이 유지되고, 완료 전환 연출(체크 fade+scale-in, accent ring)이 성취감 있게 느껴지며, prefers-reduced-motion에서는 연출 없이 즉시 전환되고, 라이트/다크 테마 모두에서 진행률 바·배지 색이 읽힌다
result: [pending]

### 5. 진행률 조회 실패 시 안내 배너 (D-31)
expected: Supabase 조회가 실패하면 레슨/Step/홈 세 페이지 모두 완료 버튼/진행률 배지/완료 마커 대신 ProgressReadError 배너만 렌더되고 0%나 진행률 수치가 어디에도 나타나지 않는다
result: [pending]

### 6. 100% 완료 시 축하 상태 전환
expected: 35개 레슨을 전부 완료하면(또는 completed===total>0 상태를 유닛 테스트로 주입하면) 홈 요약 블록 제목이 '커리큘럼을 모두 완료했어요!'로 바뀌고 CTA가 '커리큘럼 처음으로'(/step/1)로 교체되며 '이어서 학습하기' 문구는 나타나지 않는다
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
