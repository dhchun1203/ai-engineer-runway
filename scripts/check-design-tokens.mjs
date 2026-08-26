#!/usr/bin/env node
// src/**/*.tsx와 src/app/globals.css를 정적으로 스캔해 디자인 토큰 위반을
// 잡는 상시 게이트 (D-88, D-96). check-brand.mjs의 골격을 그대로 따른다 —
// 외부 의존성 0(node 표준 모듈만), path.dirname(fileURLToPath(import.meta.url))
// 기준 저장소 루트 계산, violations 배열 누적 후 일괄 출력, 0건 검사는
// 성공이 아니라 실패(스캔 파일 수 0 = exit 1).
//
// 실행: node scripts/check-design-tokens.mjs [--strict] [--only <path...>]
//
// 규칙 (a) 리터럴 색 — @theme 블록(중첩 중괄호를 세어 찾은 대응 닫는 줄까지)
//   밖의 hex/rgb/rgba/hsl/hsla. CSS 주석·JS/TS 주석은 매칭 전에 제거한다.
// 규칙 (b) 타이포 리터럴 — font-size/font-weight **CSS 선언**(globals.css 등)의
//   절대 단위(rem/px) 값이 D-R4K-4 허용 집합 밖이면 위반. rem 값을 px로
//   환산하지 않고 선언된 문자열 그대로 대조한다. em/%처럼 상대적인 값은
//   타입 스케일 판정 대상이 아니라 이 규칙에서 제외한다. 상시 게이트다.
// 규칙 (c) 임의값 대괄호(`text-[...]`/`leading-[...]` 등, D-R4K-4 표에서
//   벗어난 값인지와 무관하게 대괄호 문법 자체를 금지) + Tailwind 기본
//   팔레트 색 유틸리티 — 이 규칙만 기본 비활성(ENFORCE_ARBITRARY_VALUES=false).
//   66곳 치환 완료 후 06-08 태스크에서 true로 뒤집는다. --strict는 이 상수와
//   무관하게 즉시 활성화한다. 기본(비-strict) 실행에서 아직 치환하지 않은
//   파일 때문에 상시 exit 1이 되는 것을 막는 것이 이 분리의 핵심 이유다 —
//   text-[...] 임의값도 이 규칙(c) 소관이며 규칙(b)에는 포함되지 않는다.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const onlyFlagIndex = args.indexOf('--only');
const ONLY_PATHS =
  onlyFlagIndex !== -1
    ? args.slice(onlyFlagIndex + 1).filter((a) => !a.startsWith('--'))
    : null;

// 66곳 치환 완료 후 06-08 태스크에서 true로 뒤집는다 — 그 시점부터 임의값
// 대괄호·기본 팔레트 색 유틸리티가 상시 위반으로 잡힌다. --strict 플래그는
// 이 상수와 무관하게 규칙 (c)를 즉시 활성화한다(치환 진행 상황을 미리 확인
// 하려는 용도).
const ENFORCE_ARBITRARY_VALUES = false;
const ENFORCE_RULE_C = STRICT || ENFORCE_ARBITRARY_VALUES;

// D-R4K-4 / 06-UI-SPEC.md § Typography — 문자열 그대로 대조한다(환산 없음).
const ALLOWED_FONT_SIZES = new Set(['1.875rem', '1.375rem', '1.0625rem', '1rem', '0.9375rem', '0.875rem']);
const ALLOWED_FONT_WEIGHTS = new Set(['400', '600', '700']);

// 06-UI-SPEC.md § Color allowlist — 4곳 전부 accent 배경 위 고정 대비용 CTA
// 텍스트라 토큰화해도 값이 항상 #ffffff로 동일해 실익이 없다
// (not-found.tsx, today-lesson-card.tsx CTA_CLASS, unlock/done/page.tsx,
// progress-summary.tsx). 이 allowlist는 규칙 (c)에만 적용된다 — 규칙 (a)의
// hex 리터럴 검사와는 무관(text-white는 hex 리터럴이 아니다).
const PALETTE_ALLOWLIST_TOKENS = new Set(['text-white']);

// about/page.tsx 장식용 점 마커 세로 정렬 — 06-RESEARCH.md 실측상 간격
// 임의값 계열 코드베이스 전체에서 이것 하나뿐이고, 값이 폰트 크기에 상대적
// (em)이라 rem 기반 Tailwind 기본 스페이싱 스케일에 대응물이 없다. 파일
// 경로 + 정확한 토큰 문자열로 좁게 등록한다 — 와일드카드로 열지 않는다.
const ARBITRARY_ALLOWLIST_TOKENS = new Map([['src/app/about/page.tsx', new Set(['top-[0.4em]'])]]);

const TAILWIND_PALETTE_COLOR_NAMES = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
];
const PALETTE_PREFIXES = [
  'text',
  'bg',
  'border',
  'ring',
  'fill',
  'stroke',
  'from',
  'via',
  'to',
  'divide',
  'outline',
  'accent',
  'caret',
  'decoration',
  'shadow',
  'placeholder',
];
const PALETTE_COLOR_NUMBER_RE = new RegExp(
  `^(?:${PALETTE_PREFIXES.join('|')})-(?:${TAILWIND_PALETTE_COLOR_NAMES.join('|')})-\\d{2,3}$`,
);

const COLOR_LITERAL_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
const FONT_SIZE_DECL_RE = /font-size:\s*([^;]+);/g;
const FONT_WEIGHT_DECL_RE = /font-weight:\s*([^;]+);/g;

const violations = [];
let scannedFileCount = 0;

// --- 유틸리티 ---------------------------------------------------------

// JS/TS `//`·`/* */`와 CSS `/* */` 주석을 매칭 전에 제거한다. 줄바꿈은
// 그대로 두고 문자만 공백으로 치환해 줄 번호가 어긋나지 않게 한다.
function stripComments(content) {
  let out = '';
  let i = 0;
  const n = content.length;
  let inBlockComment = false;
  let inLineComment = false;
  while (i < n) {
    const ch = content[i];
    const next = content[i + 1];
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        out += '  ';
        inBlockComment = false;
        i += 2;
        continue;
      }
      out += ch === '\n' ? '\n' : ' ';
      i += 1;
      continue;
    }
    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
        out += '\n';
        i += 1;
        continue;
      }
      out += ' ';
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      out += '  ';
      i += 2;
      continue;
    }
    if (ch === '/' && next === '/') {
      inLineComment = true;
      out += '  ';
      i += 2;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

// @theme 블록 경계 — 여는 줄부터 중첩 중괄호를 세어 찾은 대응 닫는 지점까지.
// 첫 '}'에서 끊지 않는다.
function findThemeBlockRanges(content) {
  const ranges = [];
  const re = /@theme\b/g;
  let m;
  while ((m = re.exec(content))) {
    let i = m.index + m[0].length;
    while (i < content.length && content[i] !== '{') i++;
    if (i >= content.length) continue;
    let depth = 0;
    let j = i;
    for (; j < content.length; j++) {
      if (content[j] === '{') depth++;
      else if (content[j] === '}') {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
    }
    ranges.push([m.index, j]);
    re.lastIndex = j;
  }
  return ranges;
}

function isWithinRanges(offset, ranges) {
  return ranges.some(([s, e]) => offset >= s && offset < e);
}

function buildLineOffsets(content) {
  const offsets = [0];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') offsets.push(i + 1);
  }
  return offsets;
}

function lineNumberForOffset(lineOffsets, offset) {
  let lo = 0;
  let hi = lineOffsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineOffsets[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

// 한 줄에서 "식별자-[값]" 형태의 Tailwind 임의값 클래스 토큰을 대괄호 짝을
// 세어(중첩·이스케이프 포함) 온전히 추출한다. 단순 정규식([^\]]*)으로
// 끊지 않는다.
function findArbitraryValueTokens(line) {
  const tokens = [];
  const re = /[A-Za-z][A-Za-z0-9:_/-]*-\[/g;
  let match;
  while ((match = re.exec(line))) {
    const startIdx = match.index;
    let depth = 0;
    let j = match.index + match[0].length - 1; // '[' 위치
    for (; j < line.length; j++) {
      if (line[j] === '[') depth++;
      else if (line[j] === ']') {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
    }
    if (depth === 0) {
      tokens.push({ text: line.slice(startIdx, j), start: startIdx });
      re.lastIndex = j;
    }
  }
  return tokens;
}

// 단어 경계 기준 토큰 추출(공백·따옴표·백틱으로 구분) — text-whitesmoke나
// my-text-white 같은 부분 문자열을 별도 토큰으로 오탐하지 않는다.
function findWordTokens(line) {
  const tokens = [];
  const re = /[^\s"'`]+/g;
  let match;
  while ((match = re.exec(line))) {
    tokens.push({ text: match[0], start: match.index });
  }
  return tokens;
}

function relPath(absPath) {
  return path.relative(ROOT, absPath).split(path.sep).join('/');
}

// --- 파일 스캔 ----------------------------------------------------------

function scanFile(absPath) {
  const rel = relPath(absPath);
  let raw;
  try {
    raw = fs.readFileSync(absPath, 'utf8');
  } catch (e) {
    violations.push({ file: rel, line: 0, message: `파일을 읽을 수 없습니다 (${e.message})` });
    return;
  }
  scannedFileCount += 1;

  const content = stripComments(raw);
  const lineOffsets = buildLineOffsets(content);
  const themeRanges = rel === 'src/app/globals.css' ? findThemeBlockRanges(content) : [];
  const isGlobalsCss = rel === 'src/app/globals.css';
  const fileAllowlist = ARBITRARY_ALLOWLIST_TOKENS.get(rel) ?? new Set();

  // 규칙 (a): @theme 밖 리터럴 색 (전체 콘텐츠 대상, 줄 번호는 offset으로 역산)
  {
    let m;
    COLOR_LITERAL_RE.lastIndex = 0;
    while ((m = COLOR_LITERAL_RE.exec(content))) {
      if (isWithinRanges(m.index, themeRanges)) continue;
      const line = lineNumberForOffset(lineOffsets, m.index);
      violations.push({ file: rel, line, message: `@theme 밖 리터럴 색 발견: ${m[0]}` });
    }
  }

  // 규칙 (b): CSS font-size/font-weight 선언 — globals.css에서만 유의미하지만
  // .tsx의 인라인 style 속성에도 이론상 등장할 수 있어 전체 파일 대상으로
  // 검사한다. D-R4K-4 스케일은 절대 크기 체계이므로 절대 단위(rem/px) 또는
  // 순수 숫자(굵기)만 대상으로 삼는다 — em/%처럼 부모 폰트 크기에 상대적인
  // 값(예: 장식용 마커의 `font-size: 0.75em`)은 애초에 "타입 스케일 역할"이
  // 아니라 이 규칙의 판정 대상이 아니다.
  {
    let m;
    FONT_SIZE_DECL_RE.lastIndex = 0;
    while ((m = FONT_SIZE_DECL_RE.exec(content))) {
      const value = m[1].trim();
      if (value.startsWith('var(')) continue; // 토큰 참조는 허용
      if (!/^-?[\d.]+(rem|px)$/.test(value)) continue; // 상대 단위는 판정 대상 아님
      if (!ALLOWED_FONT_SIZES.has(value)) {
        const line = lineNumberForOffset(lineOffsets, m.index);
        violations.push({ file: rel, line, message: `허용되지 않은 font-size 선언: ${value}` });
      }
    }
    FONT_WEIGHT_DECL_RE.lastIndex = 0;
    while ((m = FONT_WEIGHT_DECL_RE.exec(content))) {
      const value = m[1].trim();
      if (value.startsWith('var(')) continue;
      if (!/^\d+$/.test(value)) continue; // bold/normal 같은 키워드는 판정 대상 아님
      if (!ALLOWED_FONT_WEIGHTS.has(value)) {
        const line = lineNumberForOffset(lineOffsets, m.index);
        violations.push({ file: rel, line, message: `허용되지 않은 font-weight 선언: ${value}` });
      }
    }
  }

  // 줄 단위 토큰 검사 (규칙 (c) — 임의값 대괄호 전반 + 기본 팔레트 색 유틸리티)
  //
  // `text-[...]`/`font-[...]` Tailwind 임의값도 여기(규칙 c)에서만 잡는다 —
  // 규칙 (b)의 "상시 게이트" 성격을 이 서브케이스까지 확장하면 66곳 중 아직
  // 치환하지 않은 나머지 파일들 때문에 기본(비-strict) 전체 스캔이 상시
  // exit 1이 되어 "웨이브 순서를 지키면 기본 실행은 항상 초록불" 이라는
  // acceptance criteria(트레이서 파일만 통과, 나머지는 --strict로만 확인)와
  // 어긋난다. 즉 D-96의 "임의값 대괄호" 항목은 전부 규칙 (c) 소관이고,
  // 기본 비활성이다.
  if (!isGlobalsCss && ENFORCE_RULE_C) {
    const lines = content.split('\n');
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const lineNumber = idx + 1;

      const arbitraryTokens = findArbitraryValueTokens(line);
      for (const { text } of arbitraryTokens) {
        if (fileAllowlist.has(text)) continue;
        violations.push({
          file: rel,
          line: lineNumber,
          message: `임의값 대괄호 사용(D-96, --strict): ${text}`,
        });
      }

      // 규칙 (c) 팔레트 서브케이스: Tailwind 기본 팔레트 색 유틸리티
      const wordTokens = findWordTokens(line);
      for (const { text } of wordTokens) {
        if (text.includes('[')) continue; // 임의값은 위에서 이미 처리
        const base = text.split(':').pop();
        if (PALETTE_ALLOWLIST_TOKENS.has(base)) continue;
        const isBareWhiteOrBlack = PALETTE_PREFIXES.some(
          (p) => base === `${p}-white` || base === `${p}-black`,
        );
        if (isBareWhiteOrBlack || PALETTE_COLOR_NUMBER_RE.test(base)) {
          violations.push({
            file: rel,
            line: lineNumber,
            message: `Tailwind 기본 팔레트 색 유틸리티 사용(D-96, --strict): ${text}`,
          });
        }
      }
    }
  }
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
}

function collectTargetFiles() {
  const srcDir = path.join(ROOT, 'src');
  const candidates = [];
  if (fs.existsSync(srcDir)) {
    const all = [];
    walk(srcDir, all);
    for (const f of all) {
      const rel = relPath(f);
      if (rel.endsWith('.tsx') || rel === 'src/app/globals.css') {
        candidates.push(f);
      }
    }
  }

  if (!ONLY_PATHS || ONLY_PATHS.length === 0) return candidates;

  const normalizedOnly = ONLY_PATHS.map((p) => p.split(path.sep).join('/').replace(/^\.\//, '').replace(/\/$/, ''));
  return candidates.filter((f) => {
    const rel = relPath(f);
    return normalizedOnly.some((only) => rel === only || rel.startsWith(`${only}/`));
  });
}

// --- 실행 -----------------------------------------------------------------

const targetFiles = collectTargetFiles();
for (const f of targetFiles) {
  scanFile(f);
}

// "0건 검사"를 성공으로 위장하지 않는다 — 스캔 대상이 0개면 그 자체가 실패다
// (check-brand.mjs:126-131과 같은 방어 로직).
if (scannedFileCount === 0) {
  console.error(
    `check-design-tokens: 스캔한 파일이 0개입니다 — --only 경로가 존재하지 않거나 대상이 없습니다.`,
  );
  process.exit(1);
}

// 위반은 파일 경로 오름차순, 같은 파일 안에서는 줄 번호 오름차순으로 정렬한다
// — 실행마다 순서가 달라지면 로그 diff를 읽을 수 없다.
violations.sort((a, b) => {
  if (a.file !== b.file) return a.file < b.file ? -1 : 1;
  return a.line - b.line;
});

if (violations.length > 0) {
  console.error(`check-design-tokens: ${violations.length}건의 위반이 발견되었습니다 (스캔 ${scannedFileCount}개 파일):\n`);
  for (const v of violations) {
    console.error(`  - ${v.file}:${v.line}: ${v.message}`);
  }
  if (!ENFORCE_RULE_C) {
    console.error(
      '\n참고: ENFORCE_ARBITRARY_VALUES=false — 임의값 대괄호/기본 팔레트 색 유틸리티(규칙 c)는 위 목록에 포함되지 않았습니다. --strict로 확인하세요.',
    );
  }
  process.exit(1);
}

console.log(
  `check-design-tokens: 위반 없음 — ${scannedFileCount}개 파일 검사 완료${
    ENFORCE_RULE_C ? ' (--strict, 규칙 c 포함)' : ' (규칙 c는 ENFORCE_ARBITRARY_VALUES=false로 비활성)'
  }`,
);
process.exit(0);
