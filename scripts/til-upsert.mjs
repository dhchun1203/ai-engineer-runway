#!/usr/bin/env node
// TIL 글 하나를 마크다운 파일에서 올린다(있으면 본문 교체, 없으면 새로 발행).
// 에디터의 저장 버튼과 같은 경로로 본문을 컴파일한다(src/lib/til/compile.ts와 같은 플러그인, 옵션).
// 키는 .env.local에서 읽고 화면에 찍지 않는다. 실행:
//   node --env-file=.env.local scripts/til-upsert.mjs <본문.md> --slug <slug>
//     [--title "..."] [--summary "..."] [--tags "python,머신러닝"] [--series "Python"] [--date 2026-11-25]
// 새 글은 --title, --date가 필요하다. 기존 글은 준 칸만 바꾸고(본문은 항상), 이해도, 셀프 체크,
// 막힌 곳은 건드리지 않는다. 발행일은 학습 날짜의 서울 정오(에디터와 같은 규칙).

import fs from 'node:fs';
import { compile } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';
import { createClient } from '@supabase/supabase-js';

const [mdPath, ...rest] = process.argv.slice(2);
const opts = {};
for (let i = 0; i < rest.length; i += 2) opts[rest[i].replace(/^--/, '')] = rest[i + 1];
if (!mdPath || !opts.slug) {
  console.error('사용법: til-upsert.mjs <본문.md> --slug <slug> [--title ..] [--summary ..] [--tags a,b] [--series 이름] [--date YYYY-MM-DD]');
  process.exit(1);
}

const md = fs.readFileSync(mdPath, 'utf8');
const bodyCode = String(
  await compile(
    { value: md },
    {
      outputFormat: 'function-body',
      remarkPlugins: [remarkGfm],
      rehypePlugins: [[rehypePrettyCode, { theme: { dark: 'github-dark-dimmed', light: 'github-light' } }]],
    },
  ),
);

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// 소유자: OWNER_EMAIL 계정
const { data: users, error: uErr } = await db.auth.admin.listUsers({ perPage: 200 });
if (uErr) throw uErr;
const owner = users.users.find((u) => u.email === process.env.OWNER_EMAIL);
if (!owner) throw new Error('OWNER_EMAIL 계정을 찾지 못했습니다');

const patch = { body_md: md, body_code: bodyCode, updated_at: new Date().toISOString() };
if (opts.title) patch.title = opts.title;
if (opts.summary) patch.summary = opts.summary;
if (opts.tags) patch.tags = opts.tags.split(',').map((t) => t.trim()).filter(Boolean);
if (opts.date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.date)) throw new Error('--date는 YYYY-MM-DD');
  patch.published_at = new Date(`${opts.date}T12:00:00+09:00`).toISOString();
}
if (opts.series) {
  const { data: s, error } = await db
    .from('til_series')
    .select('id')
    .eq('user_id', owner.id)
    .eq('title', opts.series)
    .maybeSingle();
  if (error) throw error;
  if (!s) throw new Error(`시리즈 "${opts.series}"가 없습니다`);
  patch.series_id = s.id;
}

const { data: existing, error: eErr } = await db
  .from('til_post')
  .select('id')
  .eq('user_id', owner.id)
  .eq('slug', opts.slug)
  .maybeSingle();
if (eErr) throw eErr;

let res;
if (existing) {
  res = await db.from('til_post').update(patch).eq('id', existing.id).select('slug, title, published_at').single();
} else {
  if (!opts.title || !opts.date) throw new Error('새 글은 --title과 --date가 필요합니다');
  res = await db
    .from('til_post')
    .insert({ ...patch, user_id: owner.id, slug: opts.slug, template: 'concept', status: 'published' })
    .select('slug, title, published_at')
    .single();
}
if (res.error) throw res.error;
console.log(existing ? '수정' : '발행', JSON.stringify(res.data), `본문 ${md.length}자`);
