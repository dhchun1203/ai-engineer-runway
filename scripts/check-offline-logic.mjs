#!/usr/bin/env node
// 오프라인 모드 순수 로직 게이트. src/lib/offline/offline-logic.ts의 함수를 node:assert로
// 직접 실행해 검증한다. 외부 의존성 0, 새 devDependency 없음. offline-logic.ts는 import를
// 쓰지 않으므로 Node가 타입 스트리핑으로 그대로 로드한다(check-progress-math.mjs와 같은 원리).
// 검사 0건은 성공이 아니라 실패다.
//
// 실행: node scripts/check-offline-logic.mjs

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOGIC_PATH = path.join(ROOT, 'src', 'lib', 'offline', 'offline-logic.ts');

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

// 경로 판정 표. public/sw.js 대조에도 같은 표를 쓴다.
const PATH_TABLE = [
  ['/lesson/python-variables', 'content'],
  ['/lesson/python-variables/', 'content'],
  ['/step/1', 'content'],
  ['/curriculum', 'content'],
  ['/basecamp/ai-literacy-prompt', 'content'],
  ['/basecamp', 'personal'],
  ['/concepts', 'content'],
  ['/concepts/attention', 'content'],
  ['/concepts/terms', 'content'],
  ['/concepts/terms/runner', 'content'],
  ['/roadmap/some-lesson', 'content'],
  ['/roadmap', 'personal'],
  ['/articles', 'content'],
  ['/articles/linear-ci-bottleneck', 'content'],
  ['/glossary', 'content'],
  ['/about', 'content'],
  ['/offline', 'content'],
  ['/', 'personal'],
  ['/notes', 'personal'],
  ['/bookmarks', 'personal'],
  ['/inbox', 'personal'],
  ['/review', 'personal'],
  ['/til', 'personal'],
  ['/til/abc', 'personal'],
  ['/admin', 'personal'],
  ['/login', 'bypass'],
  ['/signup', 'bypass'],
  ['/unlock', 'bypass'],
  ['/unlock/done', 'bypass'],
  ['/api/progress', 'bypass'],
  ['/_next/static/chunks/a.js', 'bypass'],
  ['/lessons', 'personal'],
  ['/loginx', 'personal'],
];

// 정적 파일 주소 추출 표본. HTML 속성, RSC 페이로드 안의 이스케이프된 문자열,
// HTML 엔티티, 디렉터리 문자열, 외부 출처, CSS url()을 함께 담는다.
const ASSET_SAMPLE = [
  '<link rel="stylesheet" href="/_next/static/css/app.css?dpl=dpl_1"/>',
  '<script src="/_next/static/chunks/main.js" async=""></script>',
  '<script>self.__next_f.push([1,"0:[\\"/_next/static/chunks/page-abc.js\\",\\"/_next/static/chunks/page-abc.js\\"]"])</script>',
  '<link rel="preload" href="/_next/static/media/font.woff2" as="font"/>',
  '<script>var base = "/_next/static/chunks/";</script>',
  '<div data-x="{&quot;/_next/static/chunks/data.js&quot;}"></div>',
  '<script src="https://cdn.example.com/other.js"></script>',
  '@font-face{src:url(/_next/static/media/a.woff2) format("woff2")}',
  '.x{background:url("/_next/static/media/b.png")}',
].join('\n');

const ASSET_EXPECTED = [
  '/_next/static/chunks/data.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/page-abc.js',
  '/_next/static/css/app.css?dpl=dpl_1',
  '/_next/static/media/a.woff2',
  '/_next/static/media/b.png',
  '/_next/static/media/font.woff2',
];

function baseProgress() {
  return {
    unlocked: true,
    ok: true,
    overall: { completed: 1, total: 4, percent: 25 },
    steps: { 1: { completed: 1, total: 4, percent: 25 } },
    completedSlugs: ['a'],
    lesson: { slug: 'b', done: false, note: { ok: true, body: '서버 메모' }, til: '한 줄', needsReview: true },
  };
}

async function main() {
  const logic = await import(pathToFileURL(LOGIC_PATH).href);
  const {
    queueItemId,
    toQueueItem,
    sortQueue,
    queuedNote,
    overlayProgress,
    extractStaticAssetPaths,
    classifyOfflinePath,
    NOTE_KEY_PREFIX,
    parseNoteKey,
    snapshotSourceFor,
    parseAuthState,
    formatBytes,
  } = logic;

  runCase('queueItemId는 kind|key', () => {
    assert.equal(queueItemId('note', 'article:x'), 'note|article:x');
  });

  runCase('toQueueItem은 id와 at을 붙인다', () => {
    assert.deepEqual(toQueueItem({ kind: 'note', key: 'basecamp:x', value: '본문' }, 5), {
      kind: 'note',
      key: 'basecamp:x',
      value: '본문',
      id: 'note|basecamp:x',
      at: 5,
    });
  });

  runCase('같은 kind와 key는 같은 id(대기열에서 마지막 것만 남는다)', () => {
    const first = toQueueItem({ kind: 'lessonComplete', key: 'a', value: true }, 1);
    const second = toQueueItem({ kind: 'lessonComplete', key: 'a', value: false }, 2);
    assert.equal(first.id, second.id);
    const other = toQueueItem({ kind: 'basecampItem', key: 'a', value: true }, 3);
    assert.notEqual(first.id, other.id);
  });

  runCase('sortQueue는 at 오름차순, 원본 불변', () => {
    const items = [
      toQueueItem({ kind: 'note', key: 'c', value: '3' }, 3),
      toQueueItem({ kind: 'note', key: 'a', value: '1' }, 1),
      toQueueItem({ kind: 'note', key: 'b', value: '2' }, 2),
    ];
    const snapshot = JSON.stringify(items);
    assert.deepEqual(sortQueue(items).map((i) => i.at), [1, 2, 3]);
    assert.equal(JSON.stringify(items), snapshot);
  });

  runCase('queuedNote는 같은 키의 메모만 찾는다', () => {
    const queue = [
      toQueueItem({ kind: 'lessonComplete', key: 'b', value: true }, 1),
      toQueueItem({ kind: 'note', key: 'b', value: '대기 메모' }, 2),
    ];
    assert.equal(queuedNote(queue, 'b'), '대기 메모');
    assert.equal(queuedNote(queue, 'c'), null);
    assert.equal(queuedNote([toQueueItem({ kind: 'lessonComplete', key: 'b', value: true }, 1)], 'b'), null);
  });

  runCase('overlayProgress: 완료 추가가 목록, 전체 진행률, 레슨 상태에 반영', () => {
    const data = baseProgress();
    const out = overlayProgress(data, [toQueueItem({ kind: 'lessonComplete', key: 'b', value: true }, 1)], null);
    assert.deepEqual(out.completedSlugs, ['a', 'b']);
    assert.deepEqual(out.overall, { completed: 2, total: 4, percent: 50 });
    assert.equal(out.lesson.done, true);
    assert.equal(out.lesson.til, '한 줄');
    assert.equal(out.lesson.needsReview, true);
    assert.deepEqual(out.steps, baseProgress().steps);
    assert.deepEqual(data, baseProgress());
  });

  runCase('overlayProgress: 완료 취소', () => {
    const out = overlayProgress(baseProgress(), [toQueueItem({ kind: 'lessonComplete', key: 'a', value: false }, 1)], null);
    assert.deepEqual(out.completedSlugs, []);
    assert.deepEqual(out.overall, { completed: 0, total: 4, percent: 0 });
  });

  runCase('overlayProgress: 이미 같은 상태면 진행률 불변', () => {
    const out = overlayProgress(baseProgress(), [toQueueItem({ kind: 'lessonComplete', key: 'a', value: true }, 1)], null);
    assert.deepEqual(out.overall, { completed: 1, total: 4, percent: 25 });
  });

  runCase('overlayProgress: 늦게 넣은 항목이 이긴다', () => {
    const queue = [
      toQueueItem({ kind: 'lessonComplete', key: 'b', value: true }, 2),
      toQueueItem({ kind: 'lessonComplete', key: 'b', value: false }, 1),
    ];
    const out = overlayProgress(baseProgress(), queue, null);
    assert.equal(out.lesson.done, true);
  });

  runCase('overlayProgress: 메모 우선순위(대기열 > 사본 > 서버)', () => {
    const queued = overlayProgress(baseProgress(), [toQueueItem({ kind: 'note', key: 'b', value: '대기 메모' }, 1)], '사본 메모');
    assert.deepEqual(queued.lesson.note, { ok: true, body: '대기 메모' });
    const copy = overlayProgress(baseProgress(), [], '사본 메모');
    assert.deepEqual(copy.lesson.note, { ok: true, body: '사본 메모' });
    const server = overlayProgress(baseProgress(), [], null);
    assert.deepEqual(server.lesson.note, { ok: true, body: '서버 메모' });
  });

  runCase('overlayProgress: 메모 읽기 실패는 사본이 없으면 그대로', () => {
    const data = { ...baseProgress(), lesson: { ...baseProgress().lesson, note: { ok: false } } };
    assert.deepEqual(overlayProgress(data, [], null).lesson.note, { ok: false });
  });

  runCase('overlayProgress: completedSlugs가 null이면 대기열로 레슨 상태만', () => {
    const data = { ...baseProgress(), completedSlugs: null, overall: null };
    const out = overlayProgress(data, [toQueueItem({ kind: 'lessonComplete', key: 'b', value: true }, 1)], null);
    assert.equal(out.completedSlugs, null);
    assert.equal(out.overall, null);
    assert.equal(out.lesson.done, true);
  });

  runCase('overlayProgress: lesson이 null이면 null', () => {
    const out = overlayProgress({ ...baseProgress(), lesson: null }, [], '사본');
    assert.equal(out.lesson, null);
  });

  runCase('extractStaticAssetPaths: HTML, RSC, CSS에서 같은 출처 정적 파일만', () => {
    assert.deepEqual([...extractStaticAssetPaths(ASSET_SAMPLE)].sort(), ASSET_EXPECTED);
  });

  runCase('classifyOfflinePath 표', () => {
    for (const [pathname, expected] of PATH_TABLE) {
      assert.equal(classifyOfflinePath(pathname), expected, pathname);
    }
  });

  runCase('NOTE_KEY_PREFIX', () => {
    assert.deepEqual({ ...NOTE_KEY_PREFIX }, { lesson: '', basecamp: 'basecamp:', article: 'article:' });
  });

  runCase('parseNoteKey', () => {
    assert.deepEqual(parseNoteKey('basecamp:x'), { target: 'basecamp', slug: 'x' });
    assert.deepEqual(parseNoteKey('article:y'), { target: 'article', slug: 'y' });
    assert.deepEqual(parseNoteKey('python-variables'), { target: 'lesson', slug: 'python-variables' });
  });

  runCase('snapshotSourceFor', () => {
    assert.deepEqual(snapshotSourceFor('/lesson/python-variables'), {
      kind: 'progress',
      api: '/api/progress?lesson=python-variables',
      key: 'python-variables',
    });
    assert.deepEqual(snapshotSourceFor('/basecamp/ai-literacy-prompt'), {
      kind: 'note',
      api: '/api/basecamp-note?slug=ai-literacy-prompt',
      key: 'basecamp:ai-literacy-prompt',
    });
    assert.deepEqual(snapshotSourceFor('/articles/linear-ci-bottleneck'), {
      kind: 'note',
      api: '/api/article-note?slug=linear-ci-bottleneck',
      key: 'article:linear-ci-bottleneck',
    });
    assert.equal(snapshotSourceFor('/concepts/attention'), null);
    assert.equal(snapshotSourceFor('/articles'), null);
    assert.equal(snapshotSourceFor('/lesson/a/b'), null);
  });

  runCase('parseAuthState', () => {
    assert.deepEqual(parseAuthState({ loggedIn: true, userId: 'u1' }), { loggedIn: true, userId: 'u1', buildId: null });
    assert.deepEqual(parseAuthState({ loggedIn: 1 }), { loggedIn: true, userId: null, buildId: null });
    assert.deepEqual(parseAuthState({ loggedIn: true, userId: 5 }), { loggedIn: true, userId: null, buildId: null });
    assert.deepEqual(parseAuthState({ loggedIn: true, userId: '' }), { loggedIn: true, userId: null, buildId: null });
    assert.deepEqual(parseAuthState(null), { loggedIn: false, userId: null, buildId: null });
    assert.deepEqual(parseAuthState({ loggedIn: false, userId: null, buildId: 'b1' }), {
      loggedIn: false,
      userId: null,
      buildId: 'b1',
    });
    assert.equal(parseAuthState({ loggedIn: true, userId: 'u1', buildId: '' }).buildId, null);
    assert.equal(parseAuthState({ loggedIn: true, userId: 'u1', buildId: 7 }).buildId, null);
  });

  runCase('formatBytes', () => {
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(512), '512 B');
    assert.equal(formatBytes(1536), '1.5 KB');
    assert.equal(formatBytes(5 * 1024 * 1024), '5.0 MB');
  });

  // --- public/sw.js 대조: 서비스 워커는 TS를 import할 수 없어 규칙을 복제한다. 복제본이
  // offline-logic.ts와 같은 판정을 내는지 같은 표로 확인한다. sw.js는 classic 스크립트라
  // 최상위 function 선언이 vm 컨텍스트의 전역 속성이 된다.
  const SW_PATH = path.join(ROOT, 'public', 'sw.js');
  const sw = vm.createContext({
    self: {
      location: { search: '?v=check', origin: 'http://127.0.0.1:3216' },
      addEventListener() {},
    },
    URL,
    URLSearchParams,
  });
  vm.runInContext(fs.readFileSync(SW_PATH, 'utf8'), sw, { filename: 'sw.js' });

  runCase('sw.js classifyPath가 offline-logic.ts와 같은 판정', () => {
    for (const [pathname, expected] of PATH_TABLE) {
      assert.equal(sw.classifyPath(pathname), expected, pathname);
    }
  });

  runCase('sw.js extractAssetPaths가 offline-logic.ts와 같은 결과', () => {
    assert.deepEqual(Array.from(sw.extractAssetPaths(ASSET_SAMPLE)).sort(), ASSET_EXPECTED);
  });

  runCase('sw.js isStaticAssetPath', () => {
    for (const p of ['/_next/static/chunks/a.js', '/fonts/PretendardVariable.subset.woff2', '/static/x.png', '/icon', '/apple-icon', '/favicon.ico']) {
      assert.equal(sw.isStaticAssetPath(p), true, p);
    }
    for (const p of ['/api/progress', '/lesson/a', '/_next/image', '/manifest.webmanifest', '/offline']) {
      assert.equal(sw.isStaticAssetPath(p), false, p);
    }
  });

  report();
}

function report() {
  if (caseCount === 0) {
    console.error('check-offline-logic: 수행한 검사가 0건입니다. 실패로 처리합니다.');
    process.exit(1);
  }
  if (failures.length > 0) {
    console.error(`check-offline-logic: ${caseCount}건 중 ${failures.length}건 실패`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`check-offline-logic: ${caseCount}건 전부 통과`);
}

main().catch((e) => {
  console.error(`check-offline-logic: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
