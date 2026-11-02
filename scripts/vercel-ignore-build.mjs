#!/usr/bin/env node
// Vercel 배포 건너뛰기(vercel.json ignoreCommand). 종료 코드 0이면 건너뛰고 1이면 빌드한다.
// 그 외 코드는 빌드 실패로 처리되므로 vercel.json에서 `|| exit 1`로 한 번 더 막는다.
// 판단할 수 없으면(첫 배포, 얕은 클론에 기준 커밋 없음, 변경 없음) 무조건 빌드한다.
// 빌드 전에 돌기 때문에 Node 내장 모듈만 쓴다. 검사는 scripts/check-vercel-ignore.mjs.

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// 사이트 산출물에 들어가지 않는 경로. 새로 빌드가 읽게 되는 파일이 생기면 여기서 빼야 한다.
const SKIP_PREFIXES = [
  'docs/',
  '.planning/',
  '.planning-archive/',
  '.claude/',
  '.codex/',
  '.agents/',
  'supabase/',
  'scripts/check-',
  'scripts/e2e-',
];
const SKIP_FILES = new Set(['README.md', 'AGENTS.md', 'CLAUDE.md']);
// docs/ 안이지만 velite가 소개 페이지(/about)로 빌드하는 파일.
const BUILD_FILES = new Set(['docs/making-of.md']);

export function isSkippable(file) {
  if (BUILD_FILES.has(file)) return false;
  return SKIP_FILES.has(file) || SKIP_PREFIXES.some((prefix) => file.startsWith(prefix));
}

// 변경이 없으면 대시보드의 재배포일 수 있으니 빌드한다.
export function shouldSkip(files) {
  return files.length > 0 && files.every(isSkippable);
}

function changedFiles(previousSha) {
  // 지난 성공 배포와 비교한다. HEAD^와 비교하면 한 번에 푸시한 앞 커밋의 변경을 놓친다.
  // --no-renames: src에서 docs로 옮긴 파일이 docs 쪽 이름만 나와 건너뛰는 일을 막는다.
  // -z: 한글 경로가 따옴표로 감싸여 나오지 않게 한다.
  const out = execFileSync('git', ['diff', '--name-only', '--no-renames', '-z', previousSha, 'HEAD'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return out.split('\0').filter(Boolean);
}

function main() {
  const previousSha = process.env.VERCEL_GIT_PREVIOUS_SHA;
  if (!previousSha) {
    console.log('지난 배포 커밋을 알 수 없어 빌드합니다.');
    return 1;
  }
  try {
    const files = changedFiles(previousSha);
    if (shouldSkip(files)) {
      console.log(`사이트에 영향 없는 변경 ${files.length}건이라 배포를 건너뜁니다.`);
      return 0;
    }
    console.log(`변경 ${files.length}건을 빌드합니다.`);
  } catch (e) {
    console.log(`비교에 실패해 빌드합니다: ${e instanceof Error ? e.message : String(e)}`);
  }
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
