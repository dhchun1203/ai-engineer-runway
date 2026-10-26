// GET /api/github/connect: 프로필의 "GitHub 저장소 연결" 버튼. 무작위 state를 짧은 httpOnly
// 쿠키에 넣고 GitHub App 설치 화면으로 보낸다. 콜백이 이 state를 대조해 위조된 돌아오기를
// 막는다(설계 문서 "보안").

import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { githubAppConfig, GITHUB_STATE_COOKIE } from '@/lib/github/app';
import { getCurrentUserId } from '@/lib/current-user';

export async function GET(request: NextRequest) {
  const cfg = githubAppConfig();
  if (!cfg) return NextResponse.redirect(new URL('/login?github=unavailable', request.url));
  if (!(await getCurrentUserId())) return NextResponse.redirect(new URL('/login', request.url));

  const state = randomBytes(16).toString('hex');
  const res = NextResponse.redirect(`https://github.com/apps/${cfg.slug}/installations/new?state=${state}`);
  res.cookies.set(GITHUB_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/api/github',
  });
  return res;
}
