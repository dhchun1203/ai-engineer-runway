---
status: complete
phase: 01-deployed-curriculum-skeleton
source: [01-VERIFICATION.md]
started: 2026-08-24T00:20:34Z
updated: 2026-08-24T01:05:34Z
---

## Current Test

[testing complete]

## Tests

### 1. 글로벌 내비 375px 반응형 + 테마 지속성
expected: iPad Safari(또는 Safari 375px 반응형 모드) 세로·가로 모두에서 글로벌 내비 4항목 + 테마 토글이 가로 스크롤 없이 보이고 손가락으로 정확히 눌린다. 테마 토글 후 새로고침해도 선택이 유지되고 첫 페인트에 잘못된 테마가 번쩍이지 않는다
result: pass

### 2. 파일럿 레슨 2편 iPad 실기기 검증
expected: iPad Safari 실기기에서 두 파일럿 레슨(Python 변수·자료형 / React 컴포넌트)을 열어 — 세로/가로 × 라이트/다크 4조합 모두에서 (a) 한국어 본문이 어절 중간에서 끊기지 않고 (b) 코드 블록 긴 줄이 가로 스크롤되며 잘림이 없고 (c) 복사 버튼이 hover 없이 항상 보이고 실제로 복사된다. 에뮬레이션 대체 금지(hover 오탐 위험)
result: pass

### 3. 전체 사용자 흐름 + 반응형 + 소개 페이지 가독성
expected: 홈 → Step 1 → 모듈 아코디언 → 레슨 → 이전/다음 → 소개를 iPad 세로/가로·라이트/다크 조합으로 순회하고, 폰·데스크톱 폭에서도 같은 경로에 가로 스크롤·겹침이 없다. 소개 페이지가 자료 수집 → 리서치 → 요구사항 → 로드맵 → 구현·배포 단계를 실제로 읽히게 보여준다
result: pass

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
