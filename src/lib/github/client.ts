// GitHub REST 호출 모음(GitHub App 인증, 설치 확인, 저장소 파일 쓰기/삭제).
// fetch를 인자로 받아 scripts/test-github-sync.mjs가 가짜 응답으로 테스트한다.
// 런타임 import는 node:crypto 하나뿐이어야 한다(테스트가 이 .ts를 직접 불러옴).
// 토큰은 인자로만 오가고 어디에도 저장하지 않는다.

import { createSign } from 'node:crypto';

const API = 'https://api.github.com';

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export class GithubError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'GithubError';
    this.status = status;
  }
}

function headers(token: string): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'ai-engineer-til-sync',
  };
}

async function fail(res: Response, what: string): Promise<never> {
  let detail = '';
  try {
    const body = (await res.json()) as { message?: string };
    detail = body.message ?? '';
  } catch {
    // 본문이 JSON이 아니면 상태 코드만 남긴다.
  }
  throw new GithubError(res.status, `${what} 실패 (${res.status}${detail ? `: ${detail}` : ''})`);
}

// GITHUB_APP_SLUG에 앱 이름 대신 공개 주소(https://github.com/apps/<이름>)를 통째로 넣어도
// 이름만 골라낸다. 주소를 그대로 쓰면 설치 링크가 github.com/apps/https://... 가 되어 404.
export function normalizeAppSlug(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/github\.com\/apps\/([^/?#\s]+)/);
  return match ? match[1] : trimmed.replace(/\/+$/, '');
}

function b64url(input: string): string {
  return Buffer.from(input).toString('base64url');
}

// GitHub App JWT. iat는 시계 오차를 감안해 60초 앞당기고, 유효 시간은 10분 한도 안(9분).
export function signAppJwt(appId: string, privateKeyPem: string, nowSec: number): string {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({ iat: nowSec - 60, exp: nowSec + 540, iss: appId }));
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  return `${header}.${payload}.${signer.sign(privateKeyPem).toString('base64url')}`;
}

export async function createInstallationToken(f: FetchLike, appJwt: string, installationId: number): Promise<string> {
  const res = await f(`${API}/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: headers(appJwt),
  });
  if (!res.ok) return fail(res, '설치 토큰 발급');
  return ((await res.json()) as { token: string }).token;
}

// 설치 직후 GitHub이 돌려준 code를 사용자 토큰으로 바꾼다. 이 토큰은 "이 설치가 이 사람
// 것인가" 확인에만 쓰고 버린다.
export async function exchangeOAuthCode(f: FetchLike, clientId: string, clientSecret: string, code: string): Promise<string> {
  const res = await f('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'ai-engineer-til-sync' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  if (!res.ok) return fail(res, '사용자 인증 코드 교환');
  const body = (await res.json()) as { access_token?: string; error?: string };
  if (!body.access_token) throw new GithubError(400, `사용자 인증 코드 교환 실패 (${body.error ?? 'no token'})`);
  return body.access_token;
}

export async function userHasInstallation(f: FetchLike, userToken: string, installationId: number): Promise<boolean> {
  for (let page = 1; page <= 10; page++) {
    const res = await f(`${API}/user/installations?per_page=100&page=${page}`, { headers: headers(userToken) });
    if (!res.ok) return fail(res, '사용자 설치 목록 조회');
    const body = (await res.json()) as { installations: { id: number }[] };
    if (body.installations.some((i) => i.id === installationId)) return true;
    if (body.installations.length < 100) return false;
  }
  return false;
}

export async function listInstallationRepos(f: FetchLike, token: string): Promise<string[]> {
  const names: string[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await f(`${API}/installation/repositories?per_page=100&page=${page}`, { headers: headers(token) });
    if (!res.ok) return fail(res, '저장소 목록 조회');
    const body = (await res.json()) as { repositories: { full_name: string }[] };
    names.push(...body.repositories.map((r) => r.full_name));
    if (body.repositories.length < 100) break;
  }
  return names;
}

// 한글 slug가 들어가므로 경로 조각마다 인코딩한다(슬래시는 유지).
function contentsUrl(repo: string, path: string): string {
  return `${API}/repos/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
}

async function existingSha(f: FetchLike, token: string, repo: string, path: string): Promise<string | null> {
  const res = await f(contentsUrl(repo, path), { headers: headers(token) });
  if (res.status === 404) return null;
  if (!res.ok) return fail(res, '파일 조회');
  return ((await res.json()) as { sha: string }).sha;
}

export async function putFile(f: FetchLike, token: string, repo: string, path: string, content: string, message: string): Promise<void> {
  const sha = await existingSha(f, token, repo, path);
  const body: { message: string; content: string; sha?: string } = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
  };
  if (sha) body.sha = sha;
  const res = await f(contentsUrl(repo, path), { method: 'PUT', headers: headers(token), body: JSON.stringify(body) });
  if (!res.ok) return fail(res, '파일 쓰기');
}

export async function deleteFile(f: FetchLike, token: string, repo: string, path: string, message: string): Promise<void> {
  const sha = await existingSha(f, token, repo, path);
  if (!sha) return; // 이미 없다(사용자가 GitHub에서 지웠거나 경로가 바뀜) — 할 일 없음
  const res = await f(contentsUrl(repo, path), { method: 'DELETE', headers: headers(token), body: JSON.stringify({ message, sha }) });
  if (!res.ok) return fail(res, '파일 삭제');
}
