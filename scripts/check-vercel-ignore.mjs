#!/usr/bin/env node
// scripts/vercel-ignore-build.mjs(Vercel 배포 건너뛰기) 게이트. 임시 git 저장소를 만들어
// 실제 명령 그대로 돌리고 종료 코드를 본다. 건너뛰면 안 되는 변경이 건너뛰어지거나,
// 비교 실패가 1이 아닌 코드(빌드 실패)로 끝나면 실패한다.
//
// 실행: node scripts/check-vercel-ignore.mjs

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(__dirname, 'vercel-ignore-build.mjs');
const VERCEL_JSON = path.join(__dirname, '..', 'vercel.json');

const failures = [];
let caseCount = 0;

function runCase(name, fn) {
  caseCount += 1;
  try {
    fn();
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

const { isSkippable, shouldSkip } = await import(pathToFileURL(SCRIPT).href);

// --- 경로 판단 ---
runCase('건너뛰는 경로', () => {
  for (const f of ['docs/a.md', '.planning-archive/x.md', '.claude/CLAUDE.md', 'README.md', 'AGENTS.md', 'supabase/migrations/1.sql', 'scripts/check-til.mjs']) {
    assert.equal(isSkippable(f), true, f);
  }
});
runCase('빌드하는 경로', () => {
  for (const f of ['src/app/page.tsx', 'docs/making-of.md', 'assets/fonts/a.ttf', 'public/sw.js', 'package.json', 'package-lock.json', 'vercel.json', 'next.config.ts', 'velite.config.ts', 'scripts/subset-font.mjs', 'src/docs/a.md']) {
    assert.equal(isSkippable(f), false, f);
  }
});
runCase('섞이면 빌드, 비어 있어도 빌드', () => {
  assert.equal(shouldSkip(['docs/a.md', 'src/app/page.tsx']), false);
  assert.equal(shouldSkip([]), false);
  assert.equal(shouldSkip(['docs/a.md', '.claude/b.md']), true);
});

// --- vercel.json ---
runCase('vercel.json이 이 스크립트를 부르고 실패를 1로 막음', () => {
  const { ignoreCommand } = JSON.parse(fs.readFileSync(VERCEL_JSON, 'utf8'));
  assert.equal(ignoreCommand, 'node scripts/vercel-ignore-build.mjs || exit 1');
});

// --- 실제 저장소에서 종료 코드 ---
const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'vercel-ignore-'));
const git = (...args) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'core.autocrlf=false', ...args], {
    cwd: repo,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
const write = (file, text = 'x') => {
  const p = path.join(repo, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
};
function commit(message) {
  git('add', '-A');
  git('commit', '-q', '--allow-empty', '-m', message);
  return git('rev-parse', 'HEAD');
}
function exitCode(previousSha) {
  const env = { ...process.env };
  delete env.VERCEL_GIT_PREVIOUS_SHA;
  if (previousSha !== undefined) env.VERCEL_GIT_PREVIOUS_SHA = previousSha;
  return spawnSync(process.execPath, [SCRIPT], { cwd: repo, env, stdio: 'ignore' }).status;
}

try {
  git('init', '-q');
  write('src/a.ts');
  write('docs/making-of.md');
  const base = commit('base');

  runCase('지난 배포 커밋이 없으면 빌드', () => assert.equal(exitCode(undefined), 1));
  runCase('얕은 클론에 기준 커밋이 없으면(bad object) 빌드', () =>
    assert.equal(exitCode('0123456789012345678901234567890123456789'), 1));
  runCase('재배포처럼 변경이 없으면 빌드', () => assert.equal(exitCode(base), 1));

  write('docs/새 문서.md');
  const docsOnly = commit('docs');
  runCase('문서만 바꾸면(한글 경로 포함) 건너뜀', () => assert.equal(exitCode(base), 0));

  write('docs/making-of.md', 'changed');
  const makingOf = commit('making-of');
  runCase('소개 페이지 원본을 바꾸면 빌드', () => assert.equal(exitCode(docsOnly), 1));

  write('docs/b.md');
  commit('docs again');
  runCase('앞 커밋에 빌드 대상이 있으면 마지막이 문서여도 빌드', () => assert.equal(exitCode(docsOnly), 1));
  runCase('빌드 대상 뒤의 문서 커밋만 보면 건너뜀', () => assert.equal(exitCode(makingOf), 0));

  const beforeMove = git('rev-parse', 'HEAD');
  git('mv', 'src/a.ts', 'docs/a.ts');
  commit('move');
  runCase('src에서 docs로 옮기면 빌드', () => assert.equal(exitCode(beforeMove), 1));
} finally {
  fs.rmSync(repo, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`check-vercel-ignore: ${failures.length}/${caseCount}건 실패`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`check-vercel-ignore: ${caseCount}건 통과`);
