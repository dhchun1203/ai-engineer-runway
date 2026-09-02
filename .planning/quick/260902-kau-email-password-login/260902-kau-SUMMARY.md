---
quick_id: 260902-kau
slug: email-password-login
title: 이메일+비밀번호 로그인 도입 (시크릿 쿠키 게이트 위에 additive)
status: complete
date: 2026-09-02
commits:
  - d86a94d
  - 5eb8f16
  - 0812090
---

# Summary: 이메일+비밀번호 로그인 도입

## 무엇을 했나

새 기기 접속 때마다 시크릿 키(`/unlock?key=...`)를 찾아야 하던 불편을 없애기 위해
**이메일+비밀번호 로그인(Supabase Auth)**을 도입했다. 기존 공유 시크릿 쿠키 게이트를
제거하지 않고 그 위에 additive하게 얹었다 — 게이트는 (a) 유효한 소유자 세션 또는
(b) 기존 시크릿 쿠키 중 하나라도 참이면 통과한다.

## 결과 (검증됨)

- 내장 브라우저 아이패드 크기(768×1024)에서 로그인 왕복 실측:
  - `/login`에서 이메일+비밀번호 입력 → 홈으로 리다이렉트 → **기존 진도/복습 데이터 그대로 표시**
  - 로그아웃 → 홈이 잠금 상태로 전환(공개 레슨 콘텐츠만, 진도 UI 숨김)
- `npm run build` 성공(/login 동적, Proxy(Middleware) 인식, 정적 셸 페이지 SSG 유지)
- `check-progress-gates.mjs`, `check-design-tokens.mjs` 통과
- 기존 데이터 무손상: progress/lesson_note/lesson_review/inbox_item 테이블 미접촉,
  ai-news-briefing 계열(subscribers/search_articles)도 미접촉

## 소유자 계정

- Supabase 프로젝트 `wxqteqiuihrgtxmztauc`(이름은 ai-news-briefing이나 이 앱 테이블 보유)의
  auth.users에 `dhchun1203@gmail.com` 계정 생성(email_confirm, admin API). auth.users 트리거
  없음 확인 → 타 테이블 영향 0. 생성 스크립트는 비밀번호를 하드코딩하지 않고 env로 받아
  실행 후 삭제(저장소에 비밀번호 미잔존).

## 핵심 설계

1. **Additive 게이트**: `hasUnlockCookie()` 함수명/시그니처 유지(16개 호출부 + 순서 검사
   G4/G14/G17 보존). 내부에 소유자 세션 검사(getUser + OWNER_EMAIL 일치) 추가, 기존 시크릿
   폴백 유지. 시크릿 경로는 e2e 하네스(scripts/e2e-*.mjs 7종)와 /unlock이 의존하므로 존치.
2. **서버 사이드 전용 @supabase/ssr**: server client + proxy 세션 리프레시. 브라우저
   클라이언트/NEXT_PUBLIC_ 공개키 미사용(게이트 G3 보존). SUPABASE_ANON_KEY(서버 전용) 재사용.
3. **Next 16 규칙**: middleware → `src/proxy.ts`(export proxy), Node 런타임. 리다이렉트/차단
   없이 세션 리프레시만 → 콘텐츠 공개(D-18) 유지.
4. **게이트 G8 전환**: "@supabase/ssr 금지" → "존재 요구"(아키텍처 변경 기록, D-17 일부 대체).
5. **가입 화이트리스트**: OWNER_EMAIL 일치 세션만 통과. 공개 회원가입 UI 없음(계정 이미 생성,
   데이터 전역 공유라 공개가입은 유출).

## 파일

- 신규: src/lib/supabase/server.ts, src/proxy.ts, src/app/login/{page,login-form,actions}.tsx|ts
- 수정: src/lib/auth.ts, src/components/site-nav.tsx(계정 링크), src/app/{notes,inbox,review}/page.tsx,
  src/components/progress-slots.tsx(잠금 문구 → 로그인), scripts/check-progress-gates.mjs(G8), .env.example
- 의존성: @supabase/ssr@^0.12.5, @supabase/supabase-js ^2.112.3 → ^2.112.4(peer 충족)

## 배포에 필요한 후속(사용자 조치)

Vercel 프로덕션 환경 변수 2개가 있어야 배포본에서 로그인이 동작한다(MCP/CLI로 설정 불가 →
사용자가 대시보드에서 추가):
- `OWNER_EMAIL=dhchun1203@gmail.com` (신규)
- `SUPABASE_ANON_KEY` (이미 있을 수 있음 — 없으면 추가; 값은 Supabase anon/publishable 키)

**주의**: 이 두 변수가 없어도 기존 시크릿 쿠키 접근은 그대로 동작한다(비회귀). 새 이메일
로그인만 이 변수가 있어야 켜진다.

## 알려진/무관 이슈

- `src/components/site-nav.tsx`의 `react-hooks/set-state-in-effect` lint 에러는 **이번 작업
  이전부터 존재**(quick-260902-j7t 모바일 메뉴 애니메이션 코드). 빌드는 통과하며 배포에 영향
  없음. 범위 밖이라 손대지 않음(애니메이션 동작 변경 위험).
- 개발 서버 재시작 직후 잠깐 뜨던 Turbopack "Module not found" 로그는 의존성 추가 후 캐시
  staleness로, 리로드 후 사라짐 확인. 프로덕션 빌드는 클린.
