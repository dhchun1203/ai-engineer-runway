# TIL GitHub 연동 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 TIL을 발행, 수정, 삭제하면 그 사용자가 GitHub App으로 연결한 자기 저장소에 같은 마크다운 파일이 커밋된다.

**Architecture:** 순수 모듈 두 개(파일 경로/내용/동기화 결정, GitHub REST 호출)는 런타임 import 없이 만들어 `node --test`로 직접 테스트한다. 그 위에 서버 전용 계층(앱 설정과 설치 토큰, 연결 저장소, 동기화 실행)을 얹고, TIL 액션과 프로필(/login) 화면, 연결 라우트 두 개가 그 계층을 부른다.

**Tech Stack:** Next.js 16 App Router(Route Handler, Server Action), Supabase Postgres(RLS), GitHub App(REST API v2022-11-28), `node:crypto` RS256, Node 24 `node --test`(TS 타입 제거 실행).

**Spec:** `docs/superpowers/specs/2026-10-26-til-github-sync-design.md`

## Global Constraints

- 공개되는 어떤 문자열에도 교육기관명 금지. 앱 이름은 `AI Engineer TIL Sync`
- 색은 토큰만, Tailwind 대괄호 임의값 금지, 이모지 금지(UI), 가운데점과 긴 하이픈 금지(문구)
- GitHub 호출은 서버에서만. 개인 키, 설치 토큰, 사용자 토큰은 브라우저로 안 넘긴다. 사용자 토큰은 저장하지 않는다
- 환경 변수 5개(`GITHUB_APP_ID`, `GITHUB_APP_SLUG`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_PRIVATE_KEY`) 중 하나라도 없으면 기능 전체 꺼짐, 발행은 지금과 같음
- GitHub 실패는 사이트 저장을 되돌리지 않는다
- 순수 모듈(`src/lib/til/github-file.ts`, `src/lib/github/client.ts`)은 런타임 import가 `node:crypto`뿐이어야 한다(테스트가 `.mjs`에서 직접 import)
- Supabase 프로젝트 id: `wxqteqiuihrgtxmztauc`
- 작업 트리는 LF로 저장된 파일이 많다. 기존 파일의 줄끝을 바꾸지 않는다

## 파일 지도

| 파일 | 책임 |
|---|---|
| `supabase/migrations/20261026120000_create_github_connection.sql` | 연결 테이블, `til_post.github_path` |
| `src/lib/til/github-file.ts` | 순수: `tilFilePath`, `tilFileContent`, `planSync` |
| `src/lib/github/client.ts` | 순수: JWT 서명, 토큰 발급, OAuth 교환, 설치 확인, 저장소 목록, 파일 쓰기/삭제 |
| `scripts/test-github-sync.mjs` | 위 두 모듈 단위 테스트 |
| `src/lib/github/app.ts` | 서버 전용: env 읽기, 설치 토큰 |
| `src/lib/github/connection-store.ts` | 서버 전용: 연결 행 읽기/쓰기 |
| `src/lib/til/store.ts` | 수정: 동기화용 행 읽기, `github_path` 쓰기, 미업로드 글 세기 |
| `src/lib/til/github-sync.ts` | 서버 전용: 동기화 실행 |
| `src/app/til/actions.ts` | 수정: 저장/삭제 뒤 동기화, `githubWarning` |
| `src/components/til/til-editor.tsx` | 수정: 경고를 쿼리로 넘김 |
| `src/components/til/github-sync-notice.tsx` | 경고 문구 |
| `src/app/til/[slug]/page.tsx`, `src/app/til/drafts/page.tsx` | 수정: 경고 표시 |
| `src/app/api/github/connect/route.ts`, `src/app/api/github/callback/route.ts` | 연결 흐름 |
| `src/app/login/github-actions.ts` | 저장소 고르기, 끊기, 기존 글 올리기 |
| `src/app/login/github-connect-card.tsx`, `src/app/login/github-backfill-button.tsx` | 프로필 카드 |
| `src/app/login/page.tsx` | 수정: 카드 배치, `searchParams` |

---

### Task 1: DB 마이그레이션

**Files:**
- Create: `supabase/migrations/20261026120000_create_github_connection.sql`

**Interfaces:**
- Produces: 테이블 `public.github_connection(user_id uuid pk, installation_id bigint, repo_full_name text null, status text 'ok'|'broken', created_at, updated_at)`, 컬럼 `public.til_post.github_path text null`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- TIL GitHub 연동(2026-10-26, docs/superpowers/specs/2026-10-26-til-github-sync-design.md).
-- 사용자별 GitHub App 설치 연결과, 글마다 저장소에 올라간 파일 경로.

create table if not exists public.github_connection (
  user_id uuid primary key references auth.users(id) on delete cascade,
  installation_id bigint not null,
  repo_full_name text,
  status text not null default 'ok' check (status in ('ok', 'broken')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.github_connection enable row level security;

drop policy if exists own_rows on public.github_connection;
create policy own_rows on public.github_connection for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.til_post add column if not exists github_path text;
```

- [ ] **Step 2: 원격 DB에 적용** (Supabase MCP `apply_migration`, name `create_github_connection`, 위 SQL)

- [ ] **Step 3: 확인 쿼리**

```sql
select column_name from information_schema.columns
 where table_schema='public' and table_name='til_post' and column_name='github_path';
select policyname from pg_policies where tablename='github_connection';
select grantee, privilege_type from information_schema.role_table_grants
 where table_name='github_connection' and grantee='authenticated';
```
Expected: `github_path` 한 줄, `own_rows` 한 줄, authenticated에 SELECT/INSERT/UPDATE/DELETE. 권한이 없으면 `grant select, insert, update, delete on public.github_connection to authenticated;`를 같은 마이그레이션 파일 끝에 붙이고 다시 적용한다.

- [ ] **Step 4: 커밋** `feat(db): TIL GitHub 연결 테이블과 til_post.github_path`

### Task 2: 파일 경로, 내용, 동기화 결정 (순수)

**Files:**
- Create: `src/lib/til/github-file.ts`
- Create: `scripts/test-github-sync.mjs`

**Interfaces:**
- Produces:
  - `type TilFileInput = { slug: string; title: string; summary: string | null; tags: string[]; bodyMd: string; selfCheck: string | null }`
  - `tilFilePath(slug: string, now: Date): string`
  - `tilFileContent(post: TilFileInput): string`
  - `type SyncStatus = 'draft' | 'published' | 'deleted'`
  - `type SyncPlan = { op: 'put'; path: string } | { op: 'delete'; path: string } | { op: 'none' }`
  - `planSync(input: { status: SyncStatus; githubPath: string | null; slug: string; now: Date }): SyncPlan`

- [ ] **Step 1: 실패하는 테스트 작성** (`scripts/test-github-sync.mjs`)

```js
// TIL GitHub 연동 순수 모듈 단위 테스트. 실행: node --test scripts/test-github-sync.mjs
// Node 24가 .ts를 타입만 지우고 바로 실행하므로, 테스트 대상 모듈은 런타임 import가
// node:crypto뿐이어야 한다(경로 별칭 @/ 못 씀).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tilFilePath, tilFileContent, planSync } from '../src/lib/til/github-file.ts';

test('tilFilePath는 한국 시간 날짜로 연/월 폴더를 만든다', () => {
  // UTC 15:30은 한국 시간 다음날 00:30
  assert.equal(tilFilePath('첫-글', new Date('2026-10-25T15:30:00Z')), '2026/10/2026-10-26-첫-글.md');
  assert.equal(tilFilePath('a', new Date('2026-01-01T00:00:00Z')), '2026/01/2026-01-01-a.md');
});

test('tilFileContent는 제목, 요약, 태그, 본문, 셀프 체크 순서로 만든다', () => {
  const md = tilFileContent({
    slug: 's', title: '제목', summary: '한 줄 요약', tags: ['python', ' git '],
    bodyMd: '\n본문 첫 줄\n\n둘째 줄\n', selfCheck: '왜 그럴까?',
  });
  assert.equal(md, '# 제목\n\n> 한 줄 요약\n\n태그: #python #git\n\n본문 첫 줄\n\n둘째 줄\n\n## 셀프 체크\n\n왜 그럴까?\n');
});

test('tilFileContent는 빈 항목을 건너뛴다', () => {
  const md = tilFileContent({ slug: 's', title: 'T', summary: null, tags: [], bodyMd: '본문', selfCheck: null });
  assert.equal(md, '# T\n\n본문\n');
});

test('planSync 결정표', () => {
  const now = new Date('2026-10-26T01:00:00Z');
  assert.deepEqual(planSync({ status: 'published', githubPath: null, slug: 'x', now }), { op: 'put', path: '2026/10/2026-10-26-x.md' });
  assert.deepEqual(planSync({ status: 'published', githubPath: '2026/09/old-x.md', slug: 'x', now }), { op: 'put', path: '2026/09/old-x.md' });
  assert.deepEqual(planSync({ status: 'draft', githubPath: '2026/09/old-x.md', slug: 'x', now }), { op: 'delete', path: '2026/09/old-x.md' });
  assert.deepEqual(planSync({ status: 'draft', githubPath: null, slug: 'x', now }), { op: 'none' });
  assert.deepEqual(planSync({ status: 'deleted', githubPath: '2026/09/old-x.md', slug: 'x', now }), { op: 'delete', path: '2026/09/old-x.md' });
  assert.deepEqual(planSync({ status: 'deleted', githubPath: null, slug: 'x', now }), { op: 'none' });
});
```

- [ ] **Step 2: 실행해서 실패 확인** `node --test scripts/test-github-sync.mjs` → 모듈 없음으로 FAIL

- [ ] **Step 3: 구현** (`src/lib/til/github-file.ts`)

```ts
// TIL 글 한 편을 GitHub 저장소의 파일 하나로 옮기는 순수 함수들(경로, 내용, 무엇을 할지).
// 런타임 import가 없어야 한다 — scripts/test-github-sync.mjs가 node --test로 이 파일을
// 직접 불러 테스트한다(경로 별칭 @/는 Node가 못 푼다).
//
// 내용에는 이해도와 막힌 점을 넣지 않는다(개인 기록, 설계 문서 "파일 내용").
// 복사 버튼용 postToMarkdown(markdown.ts)과 일부러 따로 둔다.

export type TilFileInput = {
  slug: string;
  title: string;
  summary: string | null;
  tags: string[];
  bodyMd: string;
  selfCheck: string | null;
};

export type SyncStatus = 'draft' | 'published' | 'deleted';

export type SyncPlan =
  | { op: 'put'; path: string }
  | { op: 'delete'; path: string }
  | { op: 'none' };

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// YYYY/MM/YYYY-MM-DD-<slug>.md, 날짜는 한국 시간. 처음 올릴 때 한 번만 정하고
// til_post.github_path에 저장해 다시 쓴다(수정해도 파일이 늘지 않게).
export function tilFilePath(slug: string, now: Date): string {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}/${m}/${y}-${m}-${d}-${slug}.md`;
}

export function tilFileContent(post: TilFileInput): string {
  const parts: string[] = [`# ${post.title}`];

  const summary = post.summary?.trim();
  if (summary) parts.push(summary.split('\n').map((line) => `> ${line}`).join('\n'));

  const tags = post.tags.map((t) => t.trim()).filter(Boolean);
  if (tags.length > 0) parts.push(`태그: ${tags.map((t) => `#${t.replace(/\s+/g, '-')}`).join(' ')}`);

  const body = post.bodyMd.trim();
  if (body) parts.push(body);

  const selfCheck = post.selfCheck?.trim();
  if (selfCheck) parts.push(`## 셀프 체크\n\n${selfCheck}`);

  return parts.join('\n\n') + '\n';
}

// 설계 문서 "업로드 규칙" 표 그대로. 발행이면 있던 경로(없으면 새 경로)에 쓰고,
// 초고로 되돌리거나 지우면 올라가 있던 파일만 지운다.
export function planSync(input: {
  status: SyncStatus;
  githubPath: string | null;
  slug: string;
  now: Date;
}): SyncPlan {
  if (input.status === 'published') {
    return { op: 'put', path: input.githubPath ?? tilFilePath(input.slug, input.now) };
  }
  return input.githubPath ? { op: 'delete', path: input.githubPath } : { op: 'none' };
}
```

- [ ] **Step 4: 테스트 통과 확인** `node --test scripts/test-github-sync.mjs` → 4 pass

- [ ] **Step 5: 커밋** `feat(til): GitHub 파일 경로, 내용, 동기화 결정 순수 함수`

### Task 3: GitHub REST 클라이언트 (순수)

**Files:**
- Create: `src/lib/github/client.ts`
- Modify: `scripts/test-github-sync.mjs` (테스트 추가)

**Interfaces:**
- Produces:
  - `class GithubError extends Error { status: number }`
  - `type FetchLike = (url: string, init?: RequestInit) => Promise<Response>`
  - `signAppJwt(appId: string, privateKeyPem: string, nowSec: number): string`
  - `createInstallationToken(f: FetchLike, appJwt: string, installationId: number): Promise<string>`
  - `exchangeOAuthCode(f: FetchLike, clientId: string, clientSecret: string, code: string): Promise<string>`
  - `userHasInstallation(f: FetchLike, userToken: string, installationId: number): Promise<boolean>`
  - `listInstallationRepos(f: FetchLike, token: string): Promise<string[]>` (`owner/repo` 목록)
  - `putFile(f: FetchLike, token: string, repo: string, path: string, content: string, message: string): Promise<void>`
  - `deleteFile(f: FetchLike, token: string, repo: string, path: string, message: string): Promise<void>`

- [ ] **Step 1: 테스트 추가** (`scripts/test-github-sync.mjs` 끝에)

```js
import { generateKeyPairSync, createVerify } from 'node:crypto';
import {
  GithubError, signAppJwt, createInstallationToken, userHasInstallation,
  listInstallationRepos, putFile, deleteFile,
} from '../src/lib/github/client.ts';

// 가짜 fetch: 요청을 기록하고, 차례대로 준비한 응답을 돌려준다.
function fakeFetch(responses) {
  const calls = [];
  const f = async (url, init = {}) => {
    calls.push({ url, method: init.method ?? 'GET', body: init.body ? JSON.parse(init.body) : undefined, headers: init.headers });
    const r = responses.shift();
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), { status: r.status });
  };
  return { f, calls };
}

test('signAppJwt는 RS256으로 서명하고 iss/iat/exp를 넣는다', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pem = privateKey.export({ type: 'pkcs1', format: 'pem' });
  const jwt = signAppJwt('12345', pem, 1_000_000);
  const [h, p, s] = jwt.split('.');
  assert.deepEqual(JSON.parse(Buffer.from(h, 'base64url')), { alg: 'RS256', typ: 'JWT' });
  assert.deepEqual(JSON.parse(Buffer.from(p, 'base64url')), { iat: 999_940, exp: 1_000_540, iss: '12345' });
  const v = createVerify('RSA-SHA256');
  v.update(`${h}.${p}`);
  assert.equal(v.verify(publicKey, Buffer.from(s, 'base64url')), true);
});

test('createInstallationToken 실패는 상태 코드를 담은 GithubError', async () => {
  const { f } = fakeFetch([{ status: 404, body: { message: 'Not Found' } }]);
  await assert.rejects(createInstallationToken(f, 'jwt', 7), (e) => e instanceof GithubError && e.status === 404);
});

test('createInstallationToken 성공은 token을 돌려준다', async () => {
  const { f, calls } = fakeFetch([{ status: 201, body: { token: 'ghs_x' } }]);
  assert.equal(await createInstallationToken(f, 'jwt', 7), 'ghs_x');
  assert.equal(calls[0].url, 'https://api.github.com/app/installations/7/access_tokens');
  assert.equal(calls[0].method, 'POST');
});

test('userHasInstallation은 사용자 설치 목록에서 id를 찾는다', async () => {
  const yes = fakeFetch([{ status: 200, body: { total_count: 2, installations: [{ id: 3 }, { id: 7 }] } }]);
  assert.equal(await userHasInstallation(yes.f, 'u', 7), true);
  const no = fakeFetch([{ status: 200, body: { total_count: 1, installations: [{ id: 3 }] } }]);
  assert.equal(await userHasInstallation(no.f, 'u', 7), false);
});

test('listInstallationRepos는 full_name 목록', async () => {
  const { f } = fakeFetch([{ status: 200, body: { total_count: 2, repositories: [{ full_name: 'a/b' }, { full_name: 'a/c' }] } }]);
  assert.deepEqual(await listInstallationRepos(f, 't'), ['a/b', 'a/c']);
});

test('putFile은 기존 파일이면 sha를 붙여 덮어쓰고, 경로를 인코딩한다', async () => {
  const { f, calls } = fakeFetch([{ status: 200, body: { sha: 'abc' } }, { status: 200, body: {} }]);
  await putFile(f, 't', 'me/TIL', '2026/10/2026-10-26-첫-글.md', '# 안녕\n', 'til: 안녕');
  const enc = '2026/10/2026-10-26-' + encodeURIComponent('첫-글') + '.md';
  assert.equal(calls[0].url, `https://api.github.com/repos/me/TIL/contents/${enc}`);
  assert.equal(calls[1].method, 'PUT');
  assert.equal(calls[1].body.sha, 'abc');
  assert.equal(Buffer.from(calls[1].body.content, 'base64').toString('utf8'), '# 안녕\n');
  assert.equal(calls[1].body.message, 'til: 안녕');
});

test('putFile은 새 파일이면 sha 없이 만든다', async () => {
  const { f, calls } = fakeFetch([{ status: 404, body: { message: 'Not Found' } }, { status: 201, body: {} }]);
  await putFile(f, 't', 'me/TIL', 'a.md', 'x', 'm');
  assert.equal('sha' in calls[1].body, false);
});

test('deleteFile은 이미 없는 파일이면 조용히 끝난다', async () => {
  const { f, calls } = fakeFetch([{ status: 404, body: { message: 'Not Found' } }]);
  await deleteFile(f, 't', 'me/TIL', 'a.md', 'm');
  assert.equal(calls.length, 1);
});

test('deleteFile은 sha로 지운다', async () => {
  const { f, calls } = fakeFetch([{ status: 200, body: { sha: 's1' } }, { status: 200, body: {} }]);
  await deleteFile(f, 't', 'me/TIL', 'a.md', 'm');
  assert.equal(calls[1].method, 'DELETE');
  assert.deepEqual(calls[1].body, { message: 'm', sha: 's1' });
});

test('putFile 쓰기 실패는 GithubError', async () => {
  const { f } = fakeFetch([{ status: 404, body: {} }, { status: 403, body: { message: 'Resource not accessible' } }]);
  await assert.rejects(putFile(f, 't', 'me/TIL', 'a.md', 'x', 'm'), (e) => e instanceof GithubError && e.status === 403);
});
```

- [ ] **Step 2: 실행해서 실패 확인** → client.ts 없음으로 FAIL

- [ ] **Step 3: 구현** (`src/lib/github/client.ts`)

```ts
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

function b64url(input: string | Buffer): string {
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
```

- [ ] **Step 4: 테스트 통과 확인** `node --test scripts/test-github-sync.mjs` → 14 pass. `npx tsc --noEmit -p .` 통과(Buffer, RequestInit 타입은 @types/node와 dom lib에 있음)

- [ ] **Step 5: 커밋** `feat(github): App 인증과 저장소 파일 쓰기 REST 클라이언트`

### Task 4: 서버 전용 계층 (앱 설정, 연결 저장소, TIL 저장소 추가)

**Files:**
- Create: `src/lib/github/app.ts`, `src/lib/github/connection-store.ts`
- Modify: `src/lib/til/store.ts` (끝에 함수 추가)

**Interfaces:**
- Consumes: Task 3의 `signAppJwt`, `createInstallationToken`
- Produces:
  - `app.ts`: `GITHUB_STATE_COOKIE = 'gh_install_state'`, `type GithubAppConfig = { appId: string; slug: string; clientId: string; clientSecret: string; privateKey: string }`, `githubAppConfig(): GithubAppConfig | null`, `getInstallationToken(installationId: number): Promise<string>`
  - `connection-store.ts`: `type GithubConnection = { installationId: number; repoFullName: string | null; status: 'ok' | 'broken' }`, `getConnection()`, `saveConnection(installationId: number, repoFullName: string | null)`, `setConnectionRepo(repoFullName: string)`, `markConnectionBroken()`, `deleteConnection()` (쓰기 함수는 모두 `Promise<void>`, 실패 시 throw)
  - `store.ts`: `type TilSyncRow = TilFileInput & { id: string; status: TilStatus; githubPath: string | null }`, `getSyncRowBySlug(slug: string): Promise<TilSyncRow | null>`, `getSyncRowById(id: string): Promise<TilSyncRow | null>`, `setGithubPath(id: string, path: string | null): Promise<void>`, `listUnsyncedPublishedSlugs(): Promise<string[]>`

- [ ] **Step 1: `src/lib/github/app.ts`**

```ts
import 'server-only';
import { signAppJwt, createInstallationToken } from './client';

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
  const slug = process.env.GITHUB_APP_SLUG?.trim();
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
```

- [ ] **Step 2: `src/lib/github/connection-store.ts`**

```ts
import 'server-only';
import { getUserDb } from '@/lib/supabase/db';
import { getCurrentUserId, requireCurrentUserId } from '@/lib/current-user';

// 로그인 사용자 본인의 GitHub 연결 한 행(github_connection). 다른 store와 같이
// getUserDb(RLS own_rows) + .eq('user_id') 2겹으로 본인 행만 다룬다.

export type GithubConnection = {
  installationId: number;
  repoFullName: string | null;
  status: 'ok' | 'broken';
};

export async function getConnection(): Promise<GithubConnection | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const db = await getUserDb();
  const { data, error } = await db
    .from('github_connection')
    .select('installation_id, repo_full_name, status')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    installationId: Number(data.installation_id),
    repoFullName: (data.repo_full_name as string | null) ?? null,
    status: data.status === 'broken' ? 'broken' : 'ok',
  };
}

async function write(patch: Record<string, unknown>, upsert: boolean): Promise<void> {
  const userId = await requireCurrentUserId();
  const db = await getUserDb();
  const row = { ...patch, user_id: userId, updated_at: new Date().toISOString() };
  const { error } = upsert
    ? await db.from('github_connection').upsert(row, { onConflict: 'user_id' })
    : await db.from('github_connection').update(row).eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function saveConnection(installationId: number, repoFullName: string | null): Promise<void> {
  await write({ installation_id: installationId, repo_full_name: repoFullName, status: 'ok' }, true);
}

export async function setConnectionRepo(repoFullName: string): Promise<void> {
  await write({ repo_full_name: repoFullName }, false);
}

export async function markConnectionBroken(): Promise<void> {
  await write({ status: 'broken' }, false);
}

export async function deleteConnection(): Promise<void> {
  const userId = await requireCurrentUserId();
  const db = await getUserDb();
  const { error } = await db.from('github_connection').delete().eq('user_id', userId);
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 3: `src/lib/til/store.ts` 끝에 추가** (+ 맨 위 type import에 `import type { TilFileInput } from './github-file';`)

```ts
// ── GitHub 동기화용(2026-10-26) ─────────────────────────────────────────────
// 동기화에 필요한 열만 읽는다. 본인 글만(getUserDb + .eq('user_id')).

export type TilSyncRow = TilFileInput & {
  id: string;
  status: TilStatus;
  githubPath: string | null;
};

const SYNC_COLUMNS = 'id, slug, title, summary, tags, body_md, self_check, status, github_path';

function rowToSync(row: Record<string, unknown>): TilSyncRow {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    summary: (row.summary as string) ?? null,
    tags: (row.tags as string[]) ?? [],
    bodyMd: (row.body_md as string) ?? '',
    selfCheck: (row.self_check as string) ?? null,
    status: row.status as TilStatus,
    githubPath: (row.github_path as string) ?? null,
  };
}

async function getSyncRow(column: 'slug' | 'id', value: string): Promise<TilSyncRow | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const db = await getUserDb();
  const { data, error } = await db
    .from('til_post')
    .select(SYNC_COLUMNS)
    .eq('user_id', userId)
    .eq(column, value)
    .maybeSingle();
  if (error || !data) return null;
  return rowToSync(data);
}

export async function getSyncRowBySlug(slug: string): Promise<TilSyncRow | null> {
  return getSyncRow('slug', slug);
}

export async function getSyncRowById(id: string): Promise<TilSyncRow | null> {
  return getSyncRow('id', id);
}

export async function setGithubPath(id: string, path: string | null): Promise<void> {
  const userId = await requireCurrentUserId();
  const db = await getUserDb();
  const { error } = await db.from('til_post').update({ github_path: path }).eq('id', id).eq('user_id', userId);
  if (error) throw new Error(error.message);
}

// 발행했지만 아직 저장소에 안 올라간 글(기존 글 한 번에 올리기용).
export async function listUnsyncedPublishedSlugs(): Promise<string[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const db = await getUserDb();
  const { data, error } = await db
    .from('til_post')
    .select('slug')
    .eq('user_id', userId)
    .eq('status', 'published')
    .is('github_path', null)
    .order('published_at', { ascending: true });
  if (error || !data) return [];
  return data.map((r) => r.slug as string);
}
```

- [ ] **Step 4: 확인** `npx tsc --noEmit -p .` 통과, `npx eslint src/lib/github src/lib/til/store.ts` 통과

- [ ] **Step 5: 커밋** `feat(github): 앱 설정, 연결 저장소, TIL 동기화용 읽기/쓰기`

### Task 5: 동기화 실행과 TIL 액션 연결

**Files:**
- Create: `src/lib/til/github-sync.ts`, `src/components/til/github-sync-notice.tsx`
- Modify: `src/app/til/actions.ts`, `src/components/til/til-editor.tsx:207-222`, `src/app/til/[slug]/page.tsx`, `src/app/til/drafts/page.tsx`

**Interfaces:**
- Consumes: Task 2 `planSync`, `tilFileContent`; Task 3 `putFile`, `deleteFile`, `GithubError`; Task 4 전부
- Produces:
  - `type GithubSyncResult = { ok: true } | { ok: false; error: string }`
  - `syncTilPost(row: TilSyncRow, status: SyncStatus): Promise<GithubSyncResult>`
  - `syncTilPostBySlug(slug: string): Promise<GithubSyncResult>`
  - 액션 결과에 `githubWarning?: string` 추가

- [ ] **Step 1: `src/lib/til/github-sync.ts`**

```ts
import 'server-only';
import { githubAppConfig, getInstallationToken } from '@/lib/github/app';
import { GithubError, putFile, deleteFile } from '@/lib/github/client';
import { getConnection, markConnectionBroken } from '@/lib/github/connection-store';
import { planSync, tilFileContent, type SyncStatus } from './github-file';
import { getSyncRowBySlug, setGithubPath, type TilSyncRow } from './store';

// TIL 글 한 편을 연결된 GitHub 저장소에 반영한다(설계 문서 "업로드 규칙", "실패 처리").
// 연결이 없거나 기능이 꺼져 있으면 아무것도 안 하고 성공으로 끝난다(경고 없음).
// GitHub 쪽 실패는 결과로만 알리고 throw하지 않는다 — 사이트 저장을 되돌리지 않는다.

export type GithubSyncResult = { ok: true } | { ok: false; error: string };

// 앱이 지워졌거나 저장소 접근이 사라졌을 때 GitHub이 주는 상태 코드.
const ACCESS_LOST = new Set([401, 403, 404]);

export async function syncTilPost(row: TilSyncRow, status: SyncStatus): Promise<GithubSyncResult> {
  if (!githubAppConfig()) return { ok: true };
  const conn = await getConnection();
  if (!conn || conn.status !== 'ok' || !conn.repoFullName) return { ok: true };

  const plan = planSync({ status, githubPath: row.githubPath, slug: row.slug, now: new Date() });
  if (plan.op === 'none') return { ok: true };

  try {
    const token = await getInstallationToken(conn.installationId);
    if (plan.op === 'put') {
      await putFile(fetch, token, conn.repoFullName, plan.path, tilFileContent(row), `til: ${row.title}`);
      if (row.githubPath !== plan.path) await setGithubPath(row.id, plan.path);
    } else {
      await deleteFile(fetch, token, conn.repoFullName, plan.path, `til: ${row.title} 삭제`);
      if (status !== 'deleted') await setGithubPath(row.id, null);
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof GithubError && ACCESS_LOST.has(e.status)) {
      await markConnectionBroken().catch(() => {});
    }
    console.error('[til-github-sync]', e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function syncTilPostBySlug(slug: string): Promise<GithubSyncResult> {
  const row = await getSyncRowBySlug(slug);
  if (!row) return { ok: true };
  return syncTilPost(row, row.status);
}
```

- [ ] **Step 2: `src/app/til/actions.ts` 수정**

`import { syncTilPost, syncTilPostBySlug } from '@/lib/til/github-sync';`와 `getSyncRowById`(store import에 추가)를 넣고:

```ts
type ActionResult = { ok: true; slug: string; githubWarning?: string } | { ok: false; error: string };

const GITHUB_WARNING = '사이트에는 저장됐지만 GitHub에는 올리지 못했어요.';
```

`savePostAction` 끝:

```ts
  const res = await upsertPost(row);
  if (!res.ok) return { ok: false, error: res.error };
  // GitHub 반영은 DB 저장 뒤에. 실패해도 저장은 그대로 성공이고 경고만 붙인다.
  const gh = await syncTilPostBySlug(res.data.slug);
  return gh.ok ? { ok: true, slug: res.data.slug } : { ok: true, slug: res.data.slug, githubWarning: GITHUB_WARNING };
```

`deletePostAction`:

```ts
export async function deletePostAction(
  id: string,
): Promise<{ ok: true; githubWarning?: string } | { ok: false; error: string }> {
  if (!(await hasUnlockCookie())) return { ok: false, error: 'unauthorized' };
  // 지우기 전에 경로와 제목을 읽어 둔다(지운 뒤엔 행이 없다).
  const syncRow = await getSyncRowById(id);
  const res = await deletePost(id);
  if (!res.ok) return { ok: false, error: res.error };
  if (!syncRow) return { ok: true };
  const gh = await syncTilPost(syncRow, 'deleted');
  return gh.ok ? { ok: true } : { ok: true, githubWarning: GITHUB_WARNING };
}
```

- [ ] **Step 3: 에디터** (`src/components/til/til-editor.tsx`) 성공 분기에서 경고를 쿼리로 넘긴다

```ts
    if (res.ok) {
      router.push(`/til/${res.slug}${res.githubWarning ? '?github=failed' : ''}`);
    } else {
```

```ts
    if (res.ok) router.push(`/til/drafts${res.githubWarning ? '?github=failed' : ''}`);
    else setError(res.error);
```

- [ ] **Step 4: `src/components/til/github-sync-notice.tsx`**

```tsx
// TIL 저장 뒤 GitHub 반영이 실패했을 때 글 화면 위에 띄우는 한 줄 안내(?github=failed).
// 사이트 저장은 이미 성공했다는 점을 먼저 말한다.
export function GithubSyncNotice({ failed }: { failed: boolean }) {
  if (!failed) return null;
  return (
    <p className="panel border-l-4 border-l-destructive px-4 py-3 text-label font-semibold break-keep dark:border-l-destructive-dark">
      사이트에는 저장됐지만 GitHub에는 올리지 못했어요. 프로필에서 GitHub 연결 상태를 확인해 주세요.
    </p>
  );
}
```

- [ ] **Step 5: 두 페이지에 배치.** `src/app/til/[slug]/page.tsx`의 기본 함수 props에 `searchParams: Promise<{ github?: string }>`를 추가하고, `const { github } = await searchParams;` 뒤 `<main>` 첫 자식으로 `<GithubSyncNotice failed={github === 'failed'} />`. `src/app/til/drafts/page.tsx`도 같은 방식.

- [ ] **Step 6: 확인** `npx tsc --noEmit -p .`, `npx eslint src/app/til src/lib/til src/components/til`, `node scripts/check-route-rendering.mjs`, `node --test scripts/test-github-sync.mjs`

- [ ] **Step 7: 커밋** `feat(til): 발행, 수정, 삭제를 연결된 GitHub 저장소에 반영`

### Task 6: 연결 라우트 두 개

**Files:**
- Create: `src/app/api/github/connect/route.ts`, `src/app/api/github/callback/route.ts`

**Interfaces:**
- Consumes: `githubAppConfig`, `getInstallationToken`, `exchangeOAuthCode`, `userHasInstallation`, `listInstallationRepos`, `saveConnection`, `getCurrentUserId`
- Produces: `GET /api/github/connect` → GitHub 설치 화면으로 302 + `gh_install_state` 쿠키. `GET /api/github/callback` → `/login?github=connected|choose|error|unavailable`

- [ ] **Step 1: `src/app/api/github/connect/route.ts`**

```ts
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
```

- [ ] **Step 2: `src/app/api/github/callback/route.ts`**

```ts
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
```

- [ ] **Step 3: 확인** `npx tsc --noEmit -p .`, `npx eslint src/app/api/github`, `npm run build`가 두 라우트를 `ƒ`로 내는지, `node scripts/check-route-rendering.mjs`

- [ ] **Step 4: 커밋** `feat(github): 저장소 연결 시작과 콜백 라우트`

### Task 7: 프로필 연결 카드

**Files:**
- Create: `src/app/login/github-actions.ts`, `src/app/login/github-connect-card.tsx`, `src/app/login/github-backfill-button.tsx`
- Modify: `src/app/login/page.tsx`

**Interfaces:**
- Consumes: Task 4, 5 전부
- Produces: `chooseRepoAction(formData: FormData): Promise<void>`, `disconnectGithubAction(): Promise<void>`, `backfillGithubAction(): Promise<{ uploaded: number; failed: number }>`; `<GithubConnectCard status={string | undefined} />`

- [ ] **Step 1: `src/app/login/github-actions.ts`**

```ts
'use server';

import { redirect } from 'next/navigation';
import { requireCurrentUserId } from '@/lib/current-user';
import { getInstallationToken } from '@/lib/github/app';
import { listInstallationRepos } from '@/lib/github/client';
import { getConnection, setConnectionRepo, deleteConnection } from '@/lib/github/connection-store';
import { listUnsyncedPublishedSlugs } from '@/lib/til/store';
import { syncTilPostBySlug } from '@/lib/til/github-sync';

// 프로필 GitHub 카드의 동작들. 전부 로그인 본인의 연결만 다룬다.

export async function chooseRepoAction(formData: FormData): Promise<void> {
  await requireCurrentUserId();
  const repo = String(formData.get('repo') ?? '');
  const conn = await getConnection();
  if (!conn) redirect('/login?github=error');
  // 설치가 실제로 허락한 저장소 중 하나인지 다시 확인한다(폼 값은 위조 가능).
  const repos = await listInstallationRepos(fetch, await getInstallationToken(conn.installationId));
  if (!repos.includes(repo)) redirect('/login?github=error');
  await setConnectionRepo(repo);
  redirect('/login?github=connected');
}

export async function disconnectGithubAction(): Promise<void> {
  await requireCurrentUserId();
  await deleteConnection();
  redirect('/login?github=disconnected');
}

export async function backfillGithubAction(): Promise<{ uploaded: number; failed: number }> {
  await requireCurrentUserId();
  let uploaded = 0;
  let failed = 0;
  // 한 편씩 차례로(동시에 쓰면 같은 저장소 커밋끼리 충돌한다).
  for (const slug of await listUnsyncedPublishedSlugs()) {
    const res = await syncTilPostBySlug(slug);
    if (res.ok) uploaded += 1;
    else failed += 1;
  }
  return { uploaded, failed };
}
```

- [ ] **Step 2: `src/app/login/github-backfill-button.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { backfillGithubAction } from './github-actions';

// "지금까지 발행한 글 N편 올리기". 결과(올림/실패 수)를 버튼 아래 한 줄로 보여 준다.
export function GithubBackfillButton({ count }: { count: number }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (count === 0 && result === null) return null;

  async function run() {
    if (pending) return;
    setPending(true);
    const res = await backfillGithubAction();
    setPending(false);
    setResult(res.failed > 0 ? `${res.uploaded}편 올림, ${res.failed}편 실패` : `${res.uploaded}편 올렸어요`);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {result === null ? (
        <button type="button" onClick={run} disabled={pending} className="btn tap-feedback w-fit text-body">
          {pending ? '올리는 중' : `지금까지 발행한 글 ${count}편 올리기`}
        </button>
      ) : null}
      {result ? <p className="text-label font-semibold">{result}</p> : null}
    </div>
  );
}
```

- [ ] **Step 3: `src/app/login/github-connect-card.tsx`** (서버 컴포넌트)

```tsx
import { ExternalLink } from 'lucide-react';
import { githubAppConfig, getInstallationToken } from '@/lib/github/app';
import { listInstallationRepos } from '@/lib/github/client';
import { getConnection } from '@/lib/github/connection-store';
import { listUnsyncedPublishedSlugs } from '@/lib/til/store';
import { chooseRepoAction, disconnectGithubAction } from './github-actions';
import { GithubBackfillButton } from './github-backfill-button';

// 프로필의 "TIL을 GitHub에도" 카드(설계 문서 "연결 흐름"). 기능이 꺼져 있으면(env 없음)
// 카드 자체를 내지 않는다. status는 콜백이 붙인 ?github= 값.

const STATUS_TEXT: Record<string, string> = {
  connected: 'GitHub 저장소를 연결했어요.',
  choose: '올릴 저장소를 하나 골라 주세요.',
  disconnected: '연결을 끊었어요.',
  error: '연결하지 못했어요. 다시 시도해 주세요.',
  unavailable: '지금은 GitHub 연결을 쓸 수 없어요.',
};

export async function GithubConnectCard({ status }: { status: string | undefined }) {
  if (!githubAppConfig()) return null;
  const conn = await getConnection();
  const message = status ? STATUS_TEXT[status] : undefined;

  let repoChoices: string[] = [];
  if (conn && conn.status === 'ok' && !conn.repoFullName) {
    try {
      repoChoices = await listInstallationRepos(fetch, await getInstallationToken(conn.installationId));
    } catch {
      repoChoices = [];
    }
  }
  const unsynced = conn?.status === 'ok' && conn.repoFullName ? (await listUnsyncedPublishedSlugs()).length : 0;

  return (
    <div className="flex flex-col gap-3 border-t-2 border-line pt-4 dark:border-line-dark">
      <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
        TIL을 GitHub에도
      </span>
      {message ? <p className="text-label font-semibold break-keep">{message}</p> : null}

      {!conn ? (
        <>
          <p className="text-label font-normal break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
            TIL을 발행할 때마다 내 GitHub 저장소에도 같은 글이 올라가요.
          </p>
          <a href="/api/github/connect" className="btn tap-feedback w-fit text-body">
            GitHub 저장소 연결
          </a>
        </>
      ) : conn.status === 'broken' ? (
        <>
          <p className="text-label font-normal break-keep">연결이 끊겼어요. 다시 연결해 주세요.</p>
          <div className="flex flex-wrap gap-3">
            <a href="/api/github/connect" className="btn tap-feedback w-fit text-body">다시 연결</a>
            <form action={disconnectGithubAction}>
              <button type="submit" className="btn tap-feedback text-body">연결 정보 지우기</button>
            </form>
          </div>
        </>
      ) : !conn.repoFullName ? (
        <form action={chooseRepoAction} className="flex flex-wrap items-center gap-3">
          <select name="repo" className="min-h-11 border border-foreground bg-surface px-3 text-body dark:border-foreground-dark dark:bg-surface-dark">
            {repoChoices.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button type="submit" className="btn-action tap-feedback text-body">이 저장소로</button>
        </form>
      ) : (
        <>
          <a
            href={`https://github.com/${conn.repoFullName}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1.5 text-body font-bold underline underline-offset-4"
          >
            연결됨: {conn.repoFullName}
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          </a>
          <GithubBackfillButton count={unsynced} />
          <div className="flex flex-wrap items-center gap-3">
            <form action={disconnectGithubAction}>
              <button type="submit" className="btn tap-feedback text-body">연결 끊기</button>
            </form>
            <a
              href="https://github.com/settings/installations"
              target="_blank"
              rel="noreferrer"
              className="text-label font-semibold underline underline-offset-4"
            >
              GitHub에서 앱 지우기
            </a>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: `src/app/login/page.tsx`** — 기본 함수에 `searchParams: Promise<{ github?: string }>` prop을 받고 `const { github } = await searchParams;`. "이미 로그인됨" 블록에서 로그아웃 버튼 묶음 아래, 소유자 관리 구역 위에 `<GithubConnectCard status={github} />`를 둔다(import 추가).

- [ ] **Step 5: 확인** lint, tsc, `node scripts/check-design-tokens.mjs`에서 새 파일 위반 0, `node scripts/check-brand.mjs`에서 새 파일 위반 0, `npm run build` 통과 후 dev 서버 재시작(빌드가 dev 서버를 깨뜨림). 브라우저 확인: env 없이 `/login`에 카드가 안 보이는지.

- [ ] **Step 6: 커밋** `feat(github): 프로필에 TIL GitHub 연결 카드`

### Task 8: 실제 연결과 끝까지 확인

- [ ] **Step 1:** 푸시(배포). 소유자에게 GitHub App 등록 안내(설계 문서 "앱 설정" 그대로, 클릭 단계로)와 Vercel env 5개 입력 안내. 로컬 확인이 필요하면 같은 값을 `.env.local`에 넣도록 안내(값은 채팅에 붙이지 않게)
- [ ] **Step 2:** 소유자가 env를 넣고 재배포한 뒤, 프로필에서 연결 → `dhchun1203/TIL` 선택 → "연결됨" 확인
- [ ] **Step 3:** "지금까지 발행한 글 1편 올리기" → `gh api repos/dhchun1203/TIL/contents/2026`로 파일 생성 확인
- [ ] **Step 4:** 테스트 글 발행 → 수정 후 재발행(같은 경로, 커밋 2개) → 초고로 되돌림(파일 삭제) → 다시 발행 → 삭제(파일 삭제). 단계마다 `gh api repos/dhchun1203/TIL/commits --jq '.[0].commit.message'`로 커밋 메시지 확인
- [ ] **Step 5:** 전체 게이트: lint(바뀐 파일), tsc, `node --test scripts/test-github-sync.mjs`, `check-route-rendering`, `check-progress-gates`, `check-design-tokens`(새 파일), `check-brand`(새 파일), build
