// GET /unlock?key=... — key 검증 후 장기 httpOnly 쿠키를 발급하고 결과 화면으로
// 리다이렉트한다. 검증 결과(ok/invalid)만 리다이렉트 목적지 URL에 실어 보내고
// key 값 자체는 절대 다시 싣지 않는다 — 브라우저 히스토리·Referer로 새는
// 표면을 줄인다 (RESEARCH Security Domain, T-02-14).
//
// 응답·로그 어디에도 key 값이나 시크릿을 남기지 않는다.

import { NextResponse } from 'next/server';
import { UNLOCK_COOKIE_NAME, isValidUnlockValue } from '@/lib/unlock-secret';

// 10년 — 사실상 영구. D-19의 "북마크 탭 한 번" 마찰 최소화가 목적이다.
const TEN_YEARS_IN_SECONDS = 10 * 365 * 24 * 60 * 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') ?? undefined;
  const valid = isValidUnlockValue(key, process.env.UNLOCK_SECRET);

  const destination = new URL(`/unlock/done?state=${valid ? 'ok' : 'invalid'}`, url.origin);
  const response = NextResponse.redirect(destination);

  if (valid && key) {
    response.cookies.set(UNLOCK_COOKIE_NAME, key, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      // 로컬 http 개발에서 쿠키가 버려지지 않도록 프로덕션에서만 secure를 켠다.
      secure: process.env.NODE_ENV === 'production',
      maxAge: TEN_YEARS_IN_SECONDS,
    });
  }

  return response;
}
