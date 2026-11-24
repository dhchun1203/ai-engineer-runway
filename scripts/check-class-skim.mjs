// 수업 복습 레슨 "훑기" 형태 검사(2026-11-24, docs/superpowers/specs/2026-11-24-class-lessons-skim-design.md).
// 원본(기준 커밋)과 지금 index.mdx를 비교해, 원래 코드 블록과 그림이 하나도 사라지지 않았는지,
// 펼친 채 보이는 분량이 얼마인지 잰다.
//
//   node scripts/check-class-skim.mjs                 # 전체 회차
//   node scripts/check-class-skim.mjs 21-titanic-...  # 고른 회차
//   --base <커밋>                                      # 기준 원본(기본 def1e86)
//
// 문제(빠진 코드/그림, 접힌 칸 안의 h2, 한 절에 접힌 칸 2개 이상, 닫히지 않은 details)가 있으면 exit 1.

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = "src/content/class-lessons";
const args = process.argv.slice(2);
let base = "def1e86";
const slugs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--base") base = args[++i];
  else slugs.push(args[i]);
}
const targets = slugs.length ? slugs : readdirSync(ROOT).filter((d) => !d.startsWith(".")).sort();

const stripFrontmatter = (s) => s.replace(/^---\n[\s\S]*?\n---\n/, "");
const norm = (s) => s.replace(/\s+/g, " ").trim();

function codeBlocks(src) {
  const out = [];
  const re = /^```[^\n]*\n([\s\S]*?)^```/gm;
  let m;
  while ((m = re.exec(src))) out.push(norm(m[1]));
  return out;
}

function figures(src) {
  const out = [];
  for (const m of src.matchAll(/<Figure\s+label="([^"]*)"/g)) out.push(`Figure:${m[1]}`);
  for (const m of src.matchAll(/<([A-Z][A-Za-z]*(?:Simulator|Chart|Histogram|Toggle|Playground|Explorer|Checker))\b/g)) out.push(`Sim:${m[1]}`);
  return out;
}

function visible(src) {
  return stripFrontmatter(src).replace(/<details>[\s\S]*?<\/details>/g, "");
}

function structureProblems(src) {
  const body = stripFrontmatter(src);
  const problems = [];
  const opens = (body.match(/<details>/g) || []).length;
  const closes = (body.match(/<\/details>/g) || []).length;
  if (opens !== closes) problems.push(`details 짝 안 맞음(${opens}/${closes})`);
  for (const block of body.match(/<details>[\s\S]*?<\/details>/g) || []) {
    if (/^## /m.test(block)) problems.push("접힌 칸 안에 h2");
    if (!/<summary>자세히 보기<\/summary>/.test(block)) problems.push("summary 글자가 '자세히 보기'가 아님");
  }
  const sections = body.split(/^## /m).slice(1);
  sections.forEach((sec) => {
    const n = (sec.match(/<details>/g) || []).length;
    if (n > 1) problems.push(`한 절에 접힌 칸 ${n}개: ${sec.split("\n")[0].slice(0, 30)}`);
  });
  return problems;
}

function missing(before, after) {
  const pool = [...after];
  const lost = [];
  for (const item of before) {
    const i = pool.indexOf(item);
    if (i === -1) lost.push(item);
    else pool.splice(i, 1);
  }
  return lost;
}

let failed = false;
let totalBefore = 0;
let totalVisible = 0;
for (const slug of targets) {
  const rel = path.join(ROOT, slug, "index.mdx");
  let orig;
  try {
    orig = execFileSync("git", ["show", `${base}:${rel}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    console.log(`${slug}: 기준 커밋 ${base}에 원본 없음(건너뜀)`);
    continue;
  }
  const now = readFileSync(rel, "utf8");
  const before = stripFrontmatter(orig).length;
  const vis = visible(now).length;
  totalBefore += before;
  totalVisible += vis;
  const lostCode = missing(codeBlocks(orig), codeBlocks(now));
  const lostFig = missing(figures(orig), figures(now));
  const probs = structureProblems(now);
  const h2 = (stripFrontmatter(now).match(/^## /gm) || []).length;
  const det = (now.match(/<details>/g) || []).length;
  const pct = Math.round((vis / before) * 100);
  console.log(`${slug}  ${before} → ${vis} (${pct}%)  h2=${h2} details=${det}  빠진코드=${lostCode.length} 빠진그림=${lostFig.length}`);
  for (const c of lostCode) console.log(`   빠진 코드: ${c.slice(0, 80)}`);
  for (const f of lostFig) console.log(`   빠진 그림: ${f}`);
  for (const p of probs) console.log(`   구조: ${p}`);
  if (lostCode.length || lostFig.length || probs.length) failed = true;
}
if (targets.length > 1 && totalBefore) {
  console.log(`전체 ${totalBefore} → ${totalVisible} (${Math.round((totalVisible / totalBefore) * 100)}%)`);
}
process.exit(failed ? 1 : 0);
