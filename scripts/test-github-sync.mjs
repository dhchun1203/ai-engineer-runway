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
