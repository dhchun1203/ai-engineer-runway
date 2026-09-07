---
quick_id: 260902-kau
slug: email-password-login
title: 이메일+비밀번호 로그인 도입 (시크릿 쿠키 게이트 위에 additive)
status: in-progress
---

# Quick Task: 이메일+비밀번호 로그인 도입

## 문제

새 기기 접속 때마다 시크릿 키(`/unlock?key=...`)를 찾아야 해서 불편하다. 외우는
이메일+비밀번호로 로그인하고 싶다. 소유자 계정은 직접 생성해 주고, 기존 진도/노트
데이터는 초기화 없이 그대로 연동돼야 한다.

## 핵심 설계 결정 (locked)

1. **Additive**: 기존 공유 시크릿 쿠키 게이트를 제거하지 않는다. `hasUnlockCookie()`가
   (a) 유효한 Supabase 소유자 세션 **또는** (b) 기존 `runway_unlock` 시크릿 쿠키 중
   하나라도 참이면 true. 이유: e2e 하네스(scripts/e2e-*.mjs 7종)와 /unlock 라우트가
   시크릿 쿠키에 의존한다 — 제거 시 전면 파손. 시크릿은 내부 폴백/테스트용으로만 남고
   사용자는 이메일 로그인만 쓴다.
2. **데이터 전역 유지**: progress/lesson_note/lesson_review/inbox_item 테이블·데이터
   무손상. user_id 추가·RLS 재설계·마이그레이션 없음. service_role 데이터 계층 그대로.
   ai-news-briefing 계열 테이블(subscribers/search_articles) 절대 미접촉.
3. **소유자 계정 직접 생성**: dhchun1203@gmail.com / (사용자 지정 비밀번호), email_confirm.
   → 이미 완료(auth.users, id 14d09794…). auth.users 트리거 없음 확인 → 타 테이블 영향 0.
4. **가입 화이트리스트**: 로그인 게이트는 `OWNER_EMAIL`(env) 일치 세션만 통과. 공개
   회원가입 UI는 만들지 않는다(계정은 이미 생성; 데이터 전역 공유라 공개가입은 유출).
5. **서버 사이드 전용 @supabase/ssr**: 서버 클라이언트 + proxy 세션 리프레시. 브라우저
   클라이언트/NEXT_PUBLIC_ 공개키 미사용(게이트 G3 보존). 기존 `SUPABASE_ANON_KEY`
   (서버 전용) 재사용.
6. **Next 16 규칙**: middleware → `proxy.ts`(export `proxy`), Node 런타임 기본.
7. **게이트 스크립트**: G8(@supabase/ssr 금지)만 갱신(도입이 정당한 아키텍처 변경).
   나머지 게이트(G3/G4/G11/G14/G17, /unlock, unlock-secret.ts)는 전부 보존·그린 유지.

## Tasks

### Task 1 — @supabase/ssr + 서버 클라이언트 + proxy + 게이트 G8
- `npm i @supabase/ssr@^0.12`
- create `src/lib/supabase/server.ts` (createServerClient, next/headers cookies 어댑터, server-only)
- create `src/proxy.ts` (세션 리프레시, 정적자산 제외 matcher, 리다이렉트/차단 없음 → 콘텐츠 공개 유지)
- edit `scripts/check-progress-gates.mjs` G8: "@supabase/ssr 금지" → "존재 요구"로 전환(아키텍처 변경 근거 주석)
- verify: `node scripts/check-progress-gates.mjs` 그린, `npm run build` 성공
- done: 게이트 통과 + 빌드 성공

### Task 2 — 세션 게이트(hasUnlockCookie) + 소유자 화이트리스트
- edit `src/lib/auth.ts`: 소유자 세션 검사 추가, 기존 시크릿 검사 폴백 유지(함수명·시그니처 보존)
- edit `.env.example`: OWNER_EMAIL 추가, SUPABASE_ANON_KEY 주석 갱신(앱 사용)
- edit `.env.local`(비커밋): OWNER_EMAIL 추가 (append, 값 미노출)
- verify: 게이트 G4/G14/G17 그린 유지(hasUnlockCookie 순서 불변)
- done: 로그인 세션이면 게이트 통과, 시크릿 쿠키도 여전히 통과

### Task 3 — 로그인/계정 페이지 + 서버 액션 + 내비 + 잠금 문구
- create `src/app/login/actions.ts` ('use server': signIn/signOut, 소유자 검증, redirect)
- create `src/app/login/login-form.tsx` ('use client': useActionState, email/password, 에러/대기)
- create `src/app/login/page.tsx` (로그인 폼 또는 로그인됨+로그아웃, dynamic)
- edit `src/components/site-nav.tsx`: 최상위 "계정"(/login) 링크 추가
- edit `src/app/{notes,inbox,review}/page.tsx` + `src/components/progress-slots.tsx`: "잠금 해제" 문구 → "로그인" 문구
- verify: 브라우저(아이패드 크기)에서 /login 로그인 → 홈 진도 표시, 로그아웃 동작
- done: 이메일+비밀번호로 로그인/로그아웃 왕복, 진도 그대로 보임

## 검증
- `npm run lint`, `node scripts/check-progress-gates.mjs`, `npm run build`
- 내장 브라우저 아이패드 크기 로그인 왕복
- 배포: Vercel env(OWNER_EMAIL, SUPABASE_ANON_KEY) 확인/추가 후 push

## 비목표
- 공개 회원가입 UI / 다중 사용자 / 사용자별 데이터 분리
- 시크릿(/unlock) 경로 제거 (e2e 하네스 보존 위해 유지)
- 데이터 마이그레이션
