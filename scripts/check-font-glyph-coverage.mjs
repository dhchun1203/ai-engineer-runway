#!/usr/bin/env node
// 서브셋 폰트 글리프 커버리지 상시 정적 게이트 — 외부 의존성 0, Node 표준
// 모듈만 사용한다(zlib.brotliDecompressSync으로 WOFF2를 직접 파싱한다).
//
// 왜 폰트 파서 패키지를 쓰지 않는가: 이 저장소의 모든 게이트는 "의존성 0" 원칙을
// 따른다(check-manifest.mjs 등). WOFF2는 Brotli로 압축된 sfnt 컨테이너일 뿐이고,
// Node 내장 zlib이 Brotli 압축 해제를 이미 지원하므로 별도 폰트 파서 패키지 없이
// 테이블 디렉터리와 cmap 테이블만 직접 읽으면 충분하다.
//
// 어떤 테이블만 읽는가: cmap 테이블의 format 4(BMP) / format 12(전 유니코드
// 평면, 그룹 단위) 서브테이블만 읽는다. 이 두 포맷이면 이 프로젝트가 쓰는
// 한글·영문·숫자·문장부호 전부를 포함해 충분하다. 다른 cmap 포맷(0, 6, 13,
// 14 등)은 읽지 않는다 — 이 프로젝트가 쓰는 폰트 툴체인(subset-font/HarfBuzz)이
// 생성하는 서브셋에 필요하지 않기 때문이다.
//
// 목적: 서브셋 폰트를 쓰기 시작한 뒤 콘텐츠가 늘어나면서 글리프가 조용히
// 빠지는 것을 상시로 막는다. 서브셋 글리프 누락은 배포 후에야 눈에 띄는
// 결함이므로 일회성 확인이 아니라 상설 게이트여야 한다.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// 자체 호스팅하는 서브셋 폰트 전부. scripts/subset-font.mjs의 FONTS와 짝이다 —
// 거기에 폰트를 추가하면 여기에도 추가해야 그 폰트의 글리프 누락이 잡힌다.
// 폰트마다 **책임 범위가 다르다** — 폰트 스택에서 맡은 자리가 다르기 때문이다.
//
// Pretendard는 제목·UI를 그리고, 본문 스택에서도 맨 뒤 안전망이다(명조에 없는
// 기호가 시스템 폰트로 새는 것을 막는다). 그래서 콘텐츠 문자 **전부**를 덮어야 한다.
//
// Noto Serif KR은 본문 스택에서 한글만 받는다(라틴은 앞의 Newsreader가, 나머지는 뒤의
// Pretendard가 가져간다). 그래서 **한글**만 덮으면 된다 — 이 폰트에 ①②③이
// 없다고 실패시키면, 애초에 이 폰트가 그리지 않을 글자를 요구하는 것이다.
const HANGUL_RANGES = [
  [0x1100, 0x11ff], // 한글 자모
  [0x3130, 0x318f], // 호환용 자모
  [0xa960, 0xa97f], // 확장 자모-A
  [0xac00, 0xd7a3], // 완성형 음절
  [0xd7b0, 0xd7ff], // 확장 자모-B
];

const isHangul = (cp) => HANGUL_RANGES.some(([s, e]) => cp >= s && cp <= e);

const SUBSET_FONTS = [
  {
    label: 'Pretendard (제목·UI + 본문 안전망)',
    path: path.join(ROOT, 'public', 'fonts', 'PretendardVariable.subset.woff2'),
    scope: '콘텐츠 전체',
    required: () => true,
  },
  {
    label: 'Noto Serif KR (본문 한글 명조)',
    path: path.join(ROOT, 'public', 'fonts', 'NotoSerifKR.subset.woff2'),
    scope: '한글',
    required: isHangul,
  },
];

// --- 제외 규칙 상수 (본문 폰트가 아니라 시스템 폴백이 그리는 문자) ---
// [start, end] 코드포인트 구간(포함) 배열.
const EXCLUDED_CODEPOINT_RANGES = [
  [0x0000, 0x001f], // 제어문자
  [0xfeff, 0xfeff], // BOM / ZERO WIDTH NO-BREAK SPACE
  [0x200d, 0x200d], // ZERO WIDTH JOINER (이모지 시퀀스 연결자)
  [0xfe0f, 0xfe0f], // VARIATION SELECTOR-16 (이모지 표현 선택자)
  [0xe000, 0xf8ff], // Private Use Area (BMP)
  [0x20d0, 0x20ff], // Combining Diacritical Marks for Symbols (예: U+20E3 키캡 결합 기호)
  [0x2300, 0x23ff], // Miscellaneous Technical (⏰⏱⏪ 등 이모지로 쓰이는 구간)
  [0x2600, 0x27bf], // Misc Symbols / Dingbats (이모지로 자주 쓰이는 구간)
  [0x1f000, 0x1ffff], // 이모지 대다수(Emoticons/Misc Symbols and Pictographs/Transport 등)
  [0xf0000, 0xffffd], // Supplementary Private Use Area-A
  [0x100000, 0x10fffd], // Supplementary Private Use Area-B
];

function isExcludedCodepoint(cp) {
  return EXCLUDED_CODEPOINT_RANGES.some(([start, end]) => cp >= start && cp <= end);
}

// --- 1. 서브셋 파일 부재 시 skip ---

// 하나라도 없으면 skip이 아니라 실패다. 예전에는 폰트가 하나뿐이라 "아직 안 만든
// 상태"와 "만들다 만 상태"가 구별되지 않았지만, 이제는 둘 중 하나만 없는 것이
// 곧 결함이다 — 본문 폰트가 빠진 채로 초록불이 뜨면 안 된다.
const absentFonts = SUBSET_FONTS.filter((f) => !fs.existsSync(f.path));

if (absentFonts.length === SUBSET_FONTS.length) {
  console.log(
    'check-font-glyph-coverage: 서브셋 폰트가 하나도 없음 — `node scripts/subset-font.mjs`가 아직 실행되지 않았습니다. Skipping.',
  );
  process.exit(0);
}

if (absentFonts.length > 0) {
  for (const f of absentFonts) {
    console.error(
      `check-font-glyph-coverage: [${f.label}] ${path.relative(ROOT, f.path)}가 없습니다 — \`node scripts/subset-font.mjs\`를 실행하세요.`,
    );
  }
  process.exit(1);
}

// --- 2. 콘텐츠 문자 집합 수집 (앱 코드를 import하지 않고 소스 파일을 직접 스캔) ---

function walkFiles(absDir, extFilter) {
  const results = [];
  if (!fs.existsSync(absDir)) return results;
  const stack = [absDir];
  while (stack.length > 0) {
    const current = stack.pop();
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        stack.push(path.join(current, entry.name));
      }
    } else if (stat.isFile()) {
      if (!extFilter || extFilter.test(current)) {
        results.push(current);
      }
    }
  }
  return results;
}

function listTopLevelFiles(absDir, extFilter) {
  if (!fs.existsSync(absDir)) return [];
  return fs
    .readdirSync(absDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && extFilter.test(entry.name))
    .map((entry) => path.join(absDir, entry.name));
}

const contentFiles = [
  ...walkFiles(path.join(ROOT, 'src', 'content', 'lessons'), /\.mdx$/),
  path.join(ROOT, 'src', 'content', 'modules.ts'),
  ...walkFiles(path.join(ROOT, 'src'), /\.tsx$/),
  ...listTopLevelFiles(path.join(ROOT, 'docs'), /\.md$/),
].filter((p) => fs.existsSync(p));

const contentCodepoints = new Set();
for (const filePath of contentFiles) {
  const text = fs.readFileSync(filePath, 'utf8');
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (isExcludedCodepoint(cp)) continue;
    contentCodepoints.add(cp);
  }
}

// --- 3. 서브셋 woff2의 cmap 테이블 파싱 (Brotli 압축 해제 + sfnt 테이블 디렉터리) ---

// WOFF2 알려진 테이블 태그 목록(스펙 고정 순서, 인덱스 0~62) — flags 하위 6비트가
// 이 인덱스를 가리키면 태그 이름이 파일에 별도로 저장되지 않는다.
const KNOWN_TABLE_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post',
  'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT',
  'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea',
  'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH',
  'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar',
  'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar',
  'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop',
  'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill',
];

function readUIntBase128(buf, offset) {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    const byte = buf[offset + i];
    if (byte === undefined) {
      throw new Error('UIntBase128: 버퍼 범위를 벗어났습니다');
    }
    value = value * 128 + (byte & 0x7f);
    if ((byte & 0x80) === 0) {
      return { value, bytesRead: i + 1 };
    }
  }
  throw new Error('UIntBase128: 5바이트를 넘는 값입니다(스펙 위반)');
}

function parseWoff2TableDirectory(buf) {
  const signature = buf.readUInt32BE(0);
  if (signature !== 0x774f4632) {
    throw new Error('WOFF2 시그니처가 아닙니다(파일이 손상되었거나 다른 형식입니다)');
  }
  const flavor = buf.readUInt32BE(4);
  if (flavor === 0x74746366) {
    throw new Error('WOFF2 폰트 컬렉션(ttcf)은 지원하지 않습니다 — 이 프로젝트는 단일 폰트만 씁니다');
  }
  // 헤더 레이아웃(WOFF2 스펙, 고정 48바이트): signature(4) flavor(4) length(4)
  // numTables(2) reserved(2) totalSfntSize(4) totalCompressedSize(4)
  // majorVersion(2) minorVersion(2) metaOffset(4) metaLength(4)
  // metaOrigLength(4) privOffset(4) privLength(4)
  const numTables = buf.readUInt16BE(12);
  const totalCompressedSize = buf.readUInt32BE(20);

  let offset = 48; // 고정 헤더 길이
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[offset];
    offset += 1;
    const tagIndex = flags & 0x3f;
    let tag;
    if (tagIndex === 0x3f) {
      tag = buf.toString('ascii', offset, offset + 4);
      offset += 4;
    } else {
      tag = KNOWN_TABLE_TAGS[tagIndex];
    }
    const transformVersion = (flags >> 6) & 0x3;

    const orig = readUIntBase128(buf, offset);
    offset += orig.bytesRead;
    const origLength = orig.value;

    // 변환(transform)은 glyf/loca(버전 0일 때 적용)와 hmtx(버전 1일 때 적용)에만
    // 존재한다 — 그 외 테이블(cmap 포함)은 절대 변환되지 않는다.
    let hasTransform = false;
    if (tag === 'glyf' || tag === 'loca') {
      hasTransform = transformVersion === 0;
    } else if (tag === 'hmtx') {
      hasTransform = transformVersion === 1;
    }

    let transformLength = null;
    if (hasTransform) {
      const t = readUIntBase128(buf, offset);
      offset += t.bytesRead;
      transformLength = t.value;
    }

    tables.push({ tag, origLength, transformLength });
  }

  const compressedDataOffset = offset;
  const compressedData = buf.subarray(compressedDataOffset, compressedDataOffset + totalCompressedSize);
  const decompressed = zlib.brotliDecompressSync(compressedData);

  // 압축 해제된 스트림 안에서 각 테이블은 디렉터리 순서대로, 패딩 없이
  // 연속 배치된다(WOFF2 스펙) — transformLength가 있으면 그 값이 실제
  // 점유 바이트 수, 없으면 origLength가 점유 바이트 수다.
  let cursor = 0;
  for (const t of tables) {
    const size = t.transformLength !== null ? t.transformLength : t.origLength;
    t.streamOffset = cursor;
    t.streamLength = size;
    cursor += size;
  }

  if (cursor !== decompressed.length) {
    throw new Error(
      `테이블 크기 합계(${cursor})가 압축 해제된 스트림 길이(${decompressed.length})와 다릅니다 — transform 가정이 이 폰트와 맞지 않을 수 있습니다`,
    );
  }

  return { tables, decompressed };
}

function parseCmapFormat4(view, subtableOffset) {
  const codepoints = new Set();
  const segCountX2 = view.getUint16(subtableOffset + 6);
  const segCount = segCountX2 / 2;
  const endCodeOffset = subtableOffset + 14;
  const startCodeOffset = endCodeOffset + segCountX2 + 2; // +2: reservedPad
  for (let seg = 0; seg < segCount; seg++) {
    const endCode = view.getUint16(endCodeOffset + seg * 2);
    const startCode = view.getUint16(startCodeOffset + seg * 2);
    if (startCode === 0xffff) continue; // 관례상 마지막 종료 세그먼트 — 실제 문자 아님
    for (let c = startCode; c <= endCode; c++) {
      codepoints.add(c);
    }
  }
  return codepoints;
}

function parseCmapFormat12(view, subtableOffset) {
  const codepoints = new Set();
  const numGroups = view.getUint32(subtableOffset + 12);
  let groupOffset = subtableOffset + 16;
  for (let g = 0; g < numGroups; g++) {
    const startCharCode = view.getUint32(groupOffset);
    const endCharCode = view.getUint32(groupOffset + 4);
    for (let c = startCharCode; c <= endCharCode; c++) {
      codepoints.add(c);
    }
    groupOffset += 12;
  }
  return codepoints;
}

function parseCmapCodepoints(cmapBuffer) {
  const view = new DataView(cmapBuffer.buffer, cmapBuffer.byteOffset, cmapBuffer.byteLength);
  const numTables = view.getUint16(2);
  const codepoints = new Set();
  for (let i = 0; i < numTables; i++) {
    const recordOffset = 4 + i * 8;
    const subtableOffset = view.getUint32(recordOffset + 4);
    const format = view.getUint16(subtableOffset);
    if (format === 4) {
      for (const cp of parseCmapFormat4(view, subtableOffset)) codepoints.add(cp);
    } else if (format === 12) {
      for (const cp of parseCmapFormat12(view, subtableOffset)) codepoints.add(cp);
    }
  }
  return codepoints;
}

function readCmapCodepoints(fontPath) {
  const fontBuffer = fs.readFileSync(fontPath);
  const { tables, decompressed } = parseWoff2TableDirectory(fontBuffer);
  const cmapTable = tables.find((t) => t.tag === 'cmap');
  if (!cmapTable) {
    throw new Error('cmap 테이블이 없습니다');
  }
  const cmapBuffer = decompressed.subarray(cmapTable.streamOffset, cmapTable.streamOffset + cmapTable.streamLength);
  return parseCmapCodepoints(cmapBuffer);
}

// --- 4. 서브셋 폰트마다 (콘텐츠 집합 − cmap 집합) 차집합 ---
//
// 본문이 세리프로 바뀌면서 자체 호스팅 폰트가 둘이 됐다(quick 260831-wlw). 하나만
// 검사하면 "제목은 멀쩡한데 본문 한글만 빠지는" 결함이 게이트를 그대로 통과한다 —
// 서브셋 누락은 배포 후에야 눈에 띄므로 폰트가 늘어나면 검사도 같이 늘어야 한다.

let failed = false;

for (const font of SUBSET_FONTS) {
  const rel = path.relative(ROOT, font.path);

  let cmapCodepoints;
  try {
    cmapCodepoints = readCmapCodepoints(font.path);
  } catch (e) {
    console.error(`check-font-glyph-coverage: ${rel} 파싱 실패: ${e.message}`);
    failed = true;
    continue;
  }

  const required = [...contentCodepoints].filter(font.required);
  const missing = required.filter((cp) => !cmapCodepoints.has(cp)).sort((a, b) => a - b);

  if (missing.length > 0) {
    console.error(
      `check-font-glyph-coverage: [${font.label}] 담당 범위(${font.scope})의 ${missing.length}개 문자가 ${rel}에 없습니다(최대 40개 표시):`,
    );
    console.error(
      missing
        .slice(0, 40)
        .map((cp) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`)
        .join(', '),
    );
    failed = true;
    continue;
  }

  console.log(
    `check-font-glyph-coverage: [${font.label}] 담당 ${required.length}자(${font.scope}) 전부 있음 — 통과`,
  );
}

if (failed) {
  console.error('check-font-glyph-coverage: 누락된 글리프를 메우려면 `node scripts/subset-font.mjs`를 다시 실행하세요.');
  process.exit(1);
}

console.log(
  `check-font-glyph-coverage: 콘텐츠 유니크 문자 ${contentCodepoints.size}개가 서브셋 폰트 ${SUBSET_FONTS.length}종의 cmap에 전부 있습니다 — 통과`,
);
process.exit(0);
