import 'server-only';
import { signAppJwt, createInstallationToken, normalizeAppSlug } from './client';

// GitHub App 설정(env 5개). 하나라도 비면 null — 연동 기능 전체가 꺼진 것으로 본다
// (발행은 지금처럼 사이트에만 저장, 프로필 연결 카드도 안 보임).

export type GithubAppConfig = {
  appId: string;
  slug: string;
  clientId: string;
  clientSecret: string;
  privateKey: string;
};

// /api/github/connect가 심고 /api/github/callback이 대조하는 state 쿠키 이름.
// (라우트 파일은 HTTP 메서드 외 export가 안 돼서 여기 둔다.)
export const GITHUB_STATE_COOKIE = 'gh_install_state';

export function githubAppConfig(): GithubAppConfig | null {
  const appId = process.env.GITHUB_APP_ID?.trim();
  const slugRaw = process.env.GITHUB_APP_SLUG?.trim();
  const slug = slugRaw ? normalizeAppSlug(slugRaw) : undefined;
  const clientId = process.env.GITHUB_APP_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET?.trim();
  // Vercel에 한 줄로 붙여 넣은 PEM(\n 글자)도 받아 준다.
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  if (!appId || !slug || !clientId || !clientSecret || !privateKey) return null;
  return { appId, slug, clientId, clientSecret, privateKey };
}

// 설치 토큰은 1시간짜리라 요청마다 새로 받는다(저장하지 않음).
export async function getInstallationToken(installationId: number): Promise<string> {
  const cfg = githubAppConfig();
  if (!cfg) throw new Error('GitHub App 설정이 없습니다');
  const jwt = signAppJwt(cfg.appId, cfg.privateKey, Math.floor(Date.now() / 1000));
  return createInstallationToken(fetch, jwt, installationId);
}
