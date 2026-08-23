#!/usr/bin/env node
// 공개 표면(src, docs, public, README.md)에 금지 브랜드 문자열과 개인 이메일 주소가
// 0건임을 검증하는 상시 게이트 — 외부 의존성 0, Node 표준 모듈만 사용 (D-02, D-14).
//
// 검사 대상 네 곳: src/, docs/, public/, README.md. 이 스크립트 자체(scripts/)와
// GSD 계획 산출물 디렉터리, node_modules, 빌드 산출물(.next, .velite)은 검사하지 않는다 —
// 전자 둘은 규칙 원문을 담고 있고, 후자 셋은 검사 대상이 아닌 생성물이기 때문이다.
// 이 검사 대상 목록을 넓히려는 유혹은 피할 것 — 규칙 원문 문서까지 검사하면
// 게이트가 스스로를 무효화한다.
//
// 실행 위치(process.cwd())를 검사 루트로 쓴다 — 저장소 루트에서 실행해야
// 위 네 경로를 찾을 수 있고, 다른 위치에서 실행하면 대상 부재로 즉시 오류 종료한다.
//
// 금지 브랜드 문자열: PROJECT.md Constraints HARD RULE 원문("KANT"/"Kant")에서
// 가져와 여기 상수로 하드코딩한다.
const FORBIDDEN_BRAND_STRINGS = ["kant"];

// 이메일 주소 정규식 — 특정 주소를 스크립트에 적어 넣지 않는다(그 자체가 공개
// 저장소에 개인정보를 남기는 행위이므로). 일반적인 이메일 형태 매칭이면 충분하다.
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const TARGET_RELATIVE_PATHS = ["src", "docs", "public", "README.md"];

const BINARY_EXTENSIONS = new Set([
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
]);

const violations = [];
let scannedFileCount = 0;
let missingTargetCount = 0;

function isBinaryExtension(filePath) {
  return BINARY_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function looksBinary(buffer) {
  // 처음 8000바이트 안에 NUL 바이트가 있으면 텍스트가 아닌 것으로 간주하고 건너뛴다.
  const sample = buffer.subarray(0, 8000);
  return sample.includes(0);
}

function scanFile(absFilePath) {
  if (isBinaryExtension(absFilePath)) return;

  let buffer;
  try {
    buffer = fs.readFileSync(absFilePath);
  } catch (e) {
    violations.push(`${absFilePath}: 파일을 읽을 수 없습니다 (${e.message})`);
    return;
  }
  if (looksBinary(buffer)) return;

  scannedFileCount += 1;
  const content = buffer.toString("utf8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const lowerLine = line.toLowerCase();

    for (const forbidden of FORBIDDEN_BRAND_STRINGS) {
      if (lowerLine.includes(forbidden.toLowerCase())) {
        violations.push(`${absFilePath}:${lineNumber}: 금지 브랜드 문자열 발견`);
      }
    }

    const emailMatches = line.match(EMAIL_PATTERN);
    if (emailMatches) {
      for (const match of emailMatches) {
        violations.push(`${absFilePath}:${lineNumber}: 이메일 주소로 보이는 패턴 발견 (${match})`);
      }
    }
  });
}

function walk(absPath) {
  const stat = fs.statSync(absPath);
  if (stat.isFile()) {
    scanFile(absPath);
    return;
  }
  if (!stat.isDirectory()) return;

  for (const entry of fs.readdirSync(absPath, { withFileTypes: true })) {
    const entryPath = path.join(absPath, entry.name);
    if (entry.isDirectory()) {
      walk(entryPath);
    } else if (entry.isFile()) {
      scanFile(entryPath);
    }
  }
}

for (const relativePath of TARGET_RELATIVE_PATHS) {
  const absPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absPath)) {
    console.error(`check-brand: 검사 대상 경로가 존재하지 않습니다 — ${relativePath} (기준 위치: ${ROOT})`);
    missingTargetCount += 1;
    continue;
  }
  walk(absPath);
}

// 대상 부재를 "0건이므로 통과"로 넘기지 않는다 — 게이트가 아무것도 측정하지
// 못한 상태를 성공으로 둔갑시키면 안 된다.
if (missingTargetCount > 0) {
  console.error(
    `check-brand: 검사 대상 ${missingTargetCount}곳이 존재하지 않아 검증을 수행할 수 없습니다. 저장소 루트에서 실행했는지 확인하세요.`,
  );
  process.exit(1);
}

if (violations.length > 0) {
  console.error(`check-brand: ${violations.length}건의 위반이 발견되었습니다:\n`);
  for (const violation of violations) {
    console.error(`  - ${violation}`);
  }
  process.exit(1);
}

console.log(`check-brand: 위반 없음 — ${scannedFileCount}개 파일 검사 완료`);
process.exit(0);
