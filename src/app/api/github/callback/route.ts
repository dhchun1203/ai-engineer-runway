// GET /api/github/callback: GitHub App 설치(+사용자 인증) 뒤 돌아오는 곳.
// 1) state 쿠키 대조 2) code로 사용자 토큰을 받아 이 설치가 정말 이 사람 것인지 확인
// 3) 설치가 허락한 저장소 목록을 읽어 1개면 바로, 여러 개면 프로필에서 고르게 저장.
// 사용자 토큰은 확인에만 쓰고 버린다. 어떤 실패든 /login?github=error로 돌려보낸다.

import { NextResponse, type NextRequest } from 'next/server';
import { githubAppConfig, getInstallationToken, GITHUB_STATE_COOKIE } from '@/lib/github/app';
import { exchangeOAuthCode, userHasInstallation, listInstallationRepos } from '@/lib/github/client';
import { saveConnection } from '@/lib/github/connection-store';
import { getCurrentUserId } from '@/lib/current-user';

export async function GET(request: NextRequest) {
  const back = (status: string) => {
    const res = NextResponse.redirect(new URL(`/login?github=${status}`, request.url));
    res.cookies.set(GITHUB_STATE_COOKIE, '', { maxAge: 0, path: '/api/github' });
    return res;
  };

  const cfg = githubAppConfig();
  if (!cfg) return back('unavailable');
  if (!(await getCurrentUserId())) return NextResponse.redirect(new URL('/login', request.url));

  const params = request.nextUrl.searchParams;
  const state = params.get('state');
  const expected = request.cookies.get(GITHUB_STATE_COOKIE)?.value;
  if (!state || !expected || state !== expected) return back('error');

  const code = params.get('code');
  const installationId = Number(params.get('installation_id'));
  if (!code || !Number.isSafeInteger(installationId) || installationId <= 0) return back('error');

  try {
    const userToken = await exchangeOAuthCode(fetch, cfg.clientId, cfg.clientSecret, code);
    if (!(await userHasInstallation(fetch, userToken, installationId))) return back('error');
    const token = await getInstallationToken(installationId);
    const repos = await listInstallationRepos(fetch, token);
    if (repos.length === 0) return back('error');
    await saveConnection(installationId, repos.length === 1 ? repos[0] : null);
    return back(repos.length === 1 ? 'connected' : 'choose');
  } catch (e) {
    console.error('[github-callback]', e);
    return back('error');
  }
}
