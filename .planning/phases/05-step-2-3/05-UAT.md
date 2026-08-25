---
status: testing
phase: 05-step-2-3
source: [05-VERIFICATION.md]
started: 2026-08-26T00:00:00Z
updated: 2026-08-26T00:00:00Z
---

## Current Test

number: 1
name: Step 3 병렬 집필 10편의 깊이 재확인 (가장 중요)
expected: |
  `3-4-n8n-langgraph`·`3-6-structured-output-canary`·`3-4-multi-agent-structure` 세 편의
  "언제 X, 언제 Y" 비교표가 D-62(b)의 "언제 쓰는지" 설명에 머물고, 선택 기준을
  가르치는 쪽으로 넘어가지 않는다. 승인하신 `3-1-vector-search-basics` 트림본과
  나란히 놓고 읽었을 때 같은 깊이로 느껴진다.
awaiting: user response

## Tests

### 1. Step 3 병렬 집필 10편의 깊이 재확인
expected: 비교표가 "알아듣기" 선 안에 머문다. 승인본 `3-1-vector-search-basics`와 같은 깊이로 읽힌다
why_human: "이제 맞다" 승인은 파일럿과 05-08의 2편만 실제로 보신 것이고, 05-09~05-12의 10편은 병렬 집필돼 개별 확인된 적이 없다. 깊이 판정은 게이트로 대신할 수 없다
result: [pending]

### 2. 프로젝트 준비 가이드 5편 아이패드 읽기
expected: 표가 가로 스크롤 없이 읽히고, 체크박스·접힘 블록 터치가 44px 이상으로 편하며, 내용이 "준비 가이드"로 읽힌다 — "이거 읽으면 그냥 만들 수 있겠는데"가 되지 않는다
why_human: 자동 검사는 "④에 코드 블록이 없다"까지만 본다. 선을 넘었는지는 읽어야 안다
result: [pending]

### 3. Making-of 페이지 Phase 4·5 섹션
expected: Phase 1~5가 하나의 이야기처럼 끊김 없이 읽힌다
why_human: 톤과 흐름의 연결은 코드로 확인 불가
result: [pending]

### 4. 2-1 모듈 SQL을 실제 Supabase 편집기에서 실행
expected: 연습 스키마를 만들고 조작해도 진도 저장 테이블(`public.progress`)에 영향이 없다
why_human: 자격증명이 필요해 어떤 실행자도 접근할 수 없었다
result: [pending]

### 5. 35편 완료 후 100% 화면 확인
expected: 대시보드와 오늘의 학습 화면에 반올림 결함 없이 100%가 표시된다
why_human: 집계 함수 단위로는 100% 도달을 확인했으나, 실제 진도 데이터를 만들며 확인하는 것은 사람 몫
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
