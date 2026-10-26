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
