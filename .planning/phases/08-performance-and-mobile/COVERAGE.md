# Phase 8 — API Coverage Declaration

**Detector result:** `api-coverage.cjs --json` → `{"detected": false, "signals": []}` (2026-08-27)

No external API integration: 이 페이즈는 이 앱 자신의 내부 Route Handler(`GET /api/progress`)를
신설해 이미 통합돼 있는 Supabase 조회를 HTTP 표면으로 옮기고, 나머지는 렌더링 모드 전환·폰트
자산·CSS 인터랙션·게이트 스크립트만 다룬다 — 새로 통합하는 외부 API 표면이 하나도 없다.

## 확인 근거

| 항목 | 이 페이즈에서 하는 일 | 외부 API 통합인가 |
|------|----------------------|-------------------|
| `GET /api/progress` | 이 앱이 스스로 노출하는 내부 Route Handler. 호출자도 이 앱의 클라이언트 컴포넌트다 | 아니오 — 자체 표면 |
| Supabase (`@supabase/supabase-js`) | Phase 2에서 이미 통합 완료. 이 페이즈는 호출 위치만 페이지에서 Route Handler로 옮긴다 | 아니오 — 기존 통합 |
| Next.js route segment config / prerender | 프레임워크 내부 API | 아니오 |
| `subset-font` (npm) | 빌드 준비 스크립트가 로컬에서 호출하는 라이브러리. 네트워크 호출 없음 | 아니오 |
| Playwright / Chromium | 게이트 스크립트의 로컬 브라우저 구동 | 아니오 |
| Vercel | 배포 플랫폼. 이 페이즈는 `vercel.json`을 바꾸지 않는다(리전 이동은 이 페이즈 범위 밖, 커밋 bf2ab53에서 완료) | 아니오 |

## Assumption-Delta Scan

**Detector result:** `assumption-delta scan 8 --json` → `{"detected": false, "signals": []}` (2026-08-27)

탐지되지 않았으므로 별도 결정 블록을 두지 않는다. 다만 관련된 실제 변화 하나를 기록으로 남긴다:
진도 데이터의 **전달 경로**가 "서버 렌더 중 읽기"에서 "클라이언트 fetch"로 바뀐다. 이는 전송
방식(transport)의 변화이지 진실 원천(source of truth)의 변화가 아니다 — 쓰기는 여전히
`toggleLessonComplete` Server Action이 하고, 읽기 권한은 여전히 `hasUnlockCookie()`가 판정하며,
같은 게이트 순서 계약이 새 엔드포인트로 그대로 옮겨간다(08-02 D8-E). 따라서 `no-change`.
