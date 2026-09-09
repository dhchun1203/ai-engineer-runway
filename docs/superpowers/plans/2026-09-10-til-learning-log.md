# TIL 학습기록 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이트에 소유자 전용 마크다운 에디터로 쓰고 발행하는 TIL(학습기록) 시스템을 붙인다. 발행글은 공개, 초고는 나만. 상기와 핵심 기록이 목적이다.

**Architecture:** Supabase(`til_post`/`til_series`, RLS default-deny)에 저장하고 서버 전용 `supabaseAdmin`으로만 접근한다. 마크다운은 저장/발행 시 서버에서 함수본문 문자열로 컴파일해 저장하고(`compileBookMdx`와 같은 `@mdx-js/mdx` compile 경로), 읽기는 기존 `MDXContent`로 렌더한다. 쓰기는 `hasUnlockCookie()` 게이트 + Server Action.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, `@supabase/supabase-js`(service_role admin 클라이언트), `@mdx-js/mdx` compile, `rehype-pretty-code` + `shiki`, `remark-gfm`, Tailwind v4 + `@tailwindcss/typography`, Supabase Storage.

**Spec:** `docs/superpowers/specs/2026-09-10-til-learning-log-design.md`

## Global Constraints

- 브랜딩 하드룰: 공개되는 어떤 내용(페이지 제목, 메타, OG, 코드 주석 포함)에도 교육기관명 "KANT"/"Kant"를 쓰지 않는다. 항상 "AI Engineer 교육과정".
- 언어: UI/콘텐츠 한국어(기술 용어는 영어 병기 허용).
- 아이패드(iPad Safari) 우선: 터치 타깃 44px 이상, 코드 블록 가로 스크롤, 세로/가로 모두.
- DB 접근은 오직 `src/lib/supabase/admin.ts`의 `supabaseAdmin`을 통한다. 이 파일 외 어디서도 `createClient`를 부르지 않는다.
- RLS는 켜되 정책 0개(default-deny). anon 키로는 아무것도 못 읽는 것이 정상이다. `using (true)` 편의 정책 금지.
- 쓰기/초고 읽기 게이트는 반드시 `hasUnlockCookie()`(src/lib/auth.ts)를 먼저 재검증한 뒤 진행한다. Server Action은 렌더 여부와 무관하게 스스로 재검증한다.
- 새 마이그레이션은 `supabase/migrations/`에 `YYYYMMDDHHMMSS_<name>.sql`로 추가하고, 라이브 DB(project `wxqteqiuihrgtxmztauc`)에 Supabase MCP `apply_migration`으로 적용한다.
- 이 프로젝트에는 단위 테스트 러너가 없다. 검증은 (a) `npm run build` 통과, (b) `scripts/*.mjs` 게이트, (c) 내장 브라우저(preview) 확인으로 한다. 각 태스크의 "검증" 스텝은 이 셋 중 적절한 것을 쓴다.
- 커밋은 각 태스크 끝에서 한다. 푸시는 사용자가 지시할 때만.

---

## File Structure

생성:
- `supabase/migrations/20260910120000_create_til.sql` — til_post/til_series 테이블 + RLS
- `src/lib/til/types.ts` — 공용 타입(TilPost, TilSeries, TilTemplate 등)
- `src/lib/til/store.ts` — supabaseAdmin 기반 데이터 접근(유일 계층)
- `src/lib/til/compile.ts` — 마크다운 → 함수본문 문자열 컴파일(런타임)
- `src/lib/til/templates.ts` — 템플릿 2종 스켈레톤/힌트 정의
- `src/lib/til/slug.ts` — 제목 → slug 생성 + 충돌 회피
- `src/app/til/page.tsx` — 목록(공개)
- `src/app/til/[slug]/page.tsx` — 상세(공개 발행/초고는 나만)
- `src/app/til/new/page.tsx` — 템플릿 선택
- `src/app/til/[slug]/edit/page.tsx` — 편집 진입(서버, 소유자 게이트)
- `src/app/til/drafts/page.tsx` — 초고함(소유자)
- `src/app/til/actions.ts` — Server Actions(saveDraft/publish/delete/upload)
- `src/components/til/til-editor.tsx` — 에디터(클라이언트)
- `src/components/til/til-card.tsx` — 목록 카드
- `src/components/til/til-meta.tsx` — 이해도/🔴/셀프체크/태그 표시
- `src/components/til/til-streak.tsx` — 잔디 캘린더
- `src/app/til/tags/[tag]/page.tsx` — 태그별
- `src/app/til/series/[slug]/page.tsx` — 시리즈
- `scripts/check-til.mjs` — 게이트(RLS·발행검증·slug)

수정:
- `src/components/site-nav.tsx` — NAV_ITEMS에 "TIL" 추가

---

## Task 1: DB 마이그레이션 (til_post / til_series + RLS)

**Files:**
- Create: `supabase/migrations/20260910120000_create_til.sql`

**Interfaces:**
- Produces: 테이블 `public.til_post`, `public.til_series`. 컬럼명은 이후 store.ts가 그대로 참조한다.

- [ ] **Step 1: 마이그레이션 SQL 작성**

```sql
-- TIL 학습기록. progress/lesson_note와 같은 단일 오너·service_role 전용 모델.
-- RLS를 켜되 정책은 만들지 않는다(default-deny). 접근은 서버 전용 supabaseAdmin만.
-- 공개 발행글 노출은 서버 쿼리의 status='published' 필터가 담당한다(anon 정책 아님).

create table if not exists public.til_series (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.til_series enable row level security;

create table if not exists public.til_post (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  template text not null check (template in ('concept', 'bug')),
  title text not null,
  summary text,
  body_md text not null default '',
  -- 저장 시 컴파일한 MDX 함수본문 문자열(mdx-content.tsx가 소비). 스펙의 body_html을
  -- raw HTML이 아니라 함수본문으로 구현한다 — 기존 MDXContent 렌더 경로 재사용.
  body_code text not null default '',
  self_check text,
  understanding smallint check (understanding between 1 and 5),
  blocked_points text,
  tags text[] not null default '{}',
  series_id uuid references public.til_series(id) on delete set null,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.til_post enable row level security;

create index if not exists til_post_status_published_at_idx
  on public.til_post (status, published_at desc);
create index if not exists til_post_series_idx on public.til_post (series_id);
```

- [ ] **Step 2: 라이브 DB에 적용**

Supabase MCP `apply_migration` 호출: `project_id: "wxqteqiuihrgtxmztauc"`, `name: "create_til"`, `query`: 위 SQL.

- [ ] **Step 3: 적용 확인**

Supabase MCP `list_tables`(project_id 동일, schemas `["public"]`)로 `til_post`, `til_series`가 있고 `rls_enabled: true`인지 확인. anon 접근이 막혔는지는 Task 3의 store 테스트에서 재확인한다.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260910120000_create_til.sql
git commit -m "feat(til): til_post/til_series 테이블 + RLS 마이그레이션"
```

---

## Task 2: 공용 타입

**Files:**
- Create: `src/lib/til/types.ts`

**Interfaces:**
- Produces: `TilTemplate`, `TilStatus`, `TilPost`, `TilPostInput`, `TilSeries`. 이후 모든 til 파일이 여기서 임포트한다.

- [ ] **Step 1: 타입 작성**

```ts
export type TilTemplate = 'concept' | 'bug';
export type TilStatus = 'draft' | 'published';

// DB 행을 앱에서 쓰는 camelCase 형태. store.ts가 snake_case 컬럼에서 매핑한다.
export type TilPost = {
  id: string;
  slug: string;
  template: TilTemplate;
  title: string;
  summary: string | null;
  bodyMd: string;
  bodyCode: string;
  selfCheck: string | null;
  understanding: number | null; // 1..5
  blockedPoints: string | null;
  tags: string[];
  seriesId: string | null;
  coverImageUrl: string | null;
  status: TilStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// 에디터 → Server Action이 넘기는 입력(컴파일 전, id는 수정 시에만).
export type TilPostInput = {
  id?: string;
  template: TilTemplate;
  title: string;
  summary: string;
  bodyMd: string;
  selfCheck: string;
  understanding: number | null;
  blockedPoints: string;
  tags: string[];
  seriesId: string | null;
  coverImageUrl: string | null;
};

export type TilSeries = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  createdAt: string;
};
```

- [ ] **Step 2: 빌드 확인 + Commit**

Run: `npm run build` → 컴파일 성공(타입만 추가라 영향 없음).

```bash
git add src/lib/til/types.ts
git commit -m "feat(til): 공용 타입"
```

---

## Task 3: 데이터 접근 계층 (store)

**Files:**
- Create: `src/lib/til/store.ts`

**Interfaces:**
- Consumes: `supabaseAdmin`(src/lib/supabase/admin.ts), `TilPost`/`TilPostInput`/`TilSeries`(types.ts).
- Produces:
  - `listPublishedPosts(): Promise<TilRead<TilPost[]>>`
  - `getPublishedPostBySlug(slug): Promise<TilRead<TilPost | null>>`
  - `getPostBySlugAnyStatus(slug): Promise<TilRead<TilPost | null>>` (소유자 편집/미리보기용)
  - `listDraftPosts(): Promise<TilRead<TilPost[]>>`
  - `listPublishedByTag(tag): Promise<TilRead<TilPost[]>>`
  - `upsertPost(row): Promise<TilWrite<{ slug: string }>>`
  - `deletePost(id): Promise<TilWrite<void>>`
  - `TilRead<T>` = `{ ok: true; data: T } | { ok: false; error: string }`
  - `TilWrite<T>` = `{ ok: true; data: T } | { ok: false; error: string }`
  - 매퍼 `rowToPost(row): TilPost`

패턴 참고: `src/lib/progress-store.ts`(성공/실패를 타입으로 구분, `supabaseAdmin.from(...).select()`, `error` 체크). 이 파일과 같은 방식으로 쓴다.

- [ ] **Step 1: 매퍼 + 읽기 함수 작성**

```ts
import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { TilPost, TilTemplate, TilStatus } from './types';

export type TilRead<T> = { ok: true; data: T } | { ok: false; error: string };
export type TilWrite<T> = { ok: true; data: T } | { ok: false; error: string };

const POST_COLUMNS =
  'id, slug, template, title, summary, body_md, body_code, self_check, understanding, blocked_points, tags, series_id, cover_image_url, status, published_at, created_at, updated_at';

// snake_case DB 행 → camelCase 앱 타입. 컬럼 이름은 Task 1 마이그레이션과 일치.
function rowToPost(row: Record<string, unknown>): TilPost {
  return {
    id: row.id as string,
    slug: row.slug as string,
    template: row.template as TilTemplate,
    title: row.title as string,
    summary: (row.summary as string) ?? null,
    bodyMd: (row.body_md as string) ?? '',
    bodyCode: (row.body_code as string) ?? '',
    selfCheck: (row.self_check as string) ?? null,
    understanding: (row.understanding as number) ?? null,
    blockedPoints: (row.blocked_points as string) ?? null,
    tags: (row.tags as string[]) ?? [],
    seriesId: (row.series_id as string) ?? null,
    coverImageUrl: (row.cover_image_url as string) ?? null,
    status: row.status as TilStatus,
    publishedAt: (row.published_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listPublishedPosts(): Promise<TilRead<TilPost[]>> {
  const { data, error } = await supabaseAdmin
    .from('til_post')
    .select(POST_COLUMNS)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []).map(rowToPost) };
}

export async function getPublishedPostBySlug(slug: string): Promise<TilRead<TilPost | null>> {
  const { data, error } = await supabaseAdmin
    .from('til_post')
    .select(POST_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ? rowToPost(data) : null };
}

export async function getPostBySlugAnyStatus(slug: string): Promise<TilRead<TilPost | null>> {
  const { data, error } = await supabaseAdmin
    .from('til_post')
    .select(POST_COLUMNS)
    .eq('slug', slug)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ? rowToPost(data) : null };
}

export async function listDraftPosts(): Promise<TilRead<TilPost[]>> {
  const { data, error } = await supabaseAdmin
    .from('til_post')
    .select(POST_COLUMNS)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []).map(rowToPost) };
}

export async function listPublishedByTag(tag: string): Promise<TilRead<TilPost[]>> {
  const { data, error } = await supabaseAdmin
    .from('til_post')
    .select(POST_COLUMNS)
    .eq('status', 'published')
    .contains('tags', [tag])
    .order('published_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []).map(rowToPost) };
}
```

- [ ] **Step 2: 쓰기 함수 작성 (같은 파일에 이어서)**

```ts
// upsert용 DB 행(snake_case). Server Action이 컴파일·검증을 끝낸 뒤 부른다.
export type TilPostRow = {
  id?: string;
  slug: string;
  template: TilTemplate;
  title: string;
  summary: string | null;
  body_md: string;
  body_code: string;
  self_check: string | null;
  understanding: number | null;
  blocked_points: string | null;
  tags: string[];
  series_id: string | null;
  cover_image_url: string | null;
  status: TilStatus;
  published_at: string | null;
};

export async function upsertPost(row: TilPostRow): Promise<TilWrite<{ slug: string }>> {
  const payload = { ...row, updated_at: new Date().toISOString() };
  const { data, error } = await supabaseAdmin
    .from('til_post')
    .upsert(payload, { onConflict: 'id' })
    .select('slug')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { slug: data.slug as string } };
}

export async function deletePost(id: string): Promise<TilWrite<void>> {
  const { error } = await supabaseAdmin.from('til_post').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

export async function slugExists(slug: string, exceptId?: string): Promise<boolean> {
  let q = supabaseAdmin.from('til_post').select('id').eq('slug', slug);
  if (exceptId) q = q.neq('id', exceptId);
  const { data } = await q.maybeSingle();
  return Boolean(data);
}
```

- [ ] **Step 3: 검증 (RLS default-deny 확인 포함)**

Run: `npm run build` → 성공.
그리고 Supabase MCP `execute_sql`로 anon 관점이 아닌 service_role로 `select count(*) from til_post` 실행(0행이어도 OK, 테이블 접근 확인용). anon default-deny는 Task 16 게이트에서 anon 키로 재확인한다.

- [ ] **Step 4: Commit**

```bash
git add src/lib/til/store.ts
git commit -m "feat(til): supabaseAdmin 데이터 접근 계층(store)"
```

---

## Task 4: 마크다운 컴파일 (compile-on-save)

**Files:**
- Create: `src/lib/til/compile.ts`

**Interfaces:**
- Produces: `compileTilBody(md: string): Promise<string>` — 마크다운을 `MDXContent`가 소비하는 함수본문 문자열로 컴파일. 빈 입력이면 빈 문자열.

배경: `velite.config.ts`의 `compileBookMdx`가 정확히 이 일을 한다(`@mdx-js/mdx` compile, `outputFormat: 'function-body'`, `remarkGfm` + `rehypePrettyCode`). velite config는 런타임에서 임포트하지 않으므로 같은 로직을 이 런타임 모듈에 둔다(이중 구현이니 한쪽 바꾸면 다른 쪽도 볼 것 — 파일 상단 주석에 명시).

- [ ] **Step 1: 컴파일 모듈 작성**

```ts
import 'server-only';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';

// velite.config.ts의 compileBookMdx와 같은 컴파일 경로의 런타임 버전.
// 사용자가 쓴 TIL 본문 마크다운을 저장 시 함수본문 문자열로 컴파일한다.
// mdx-content.tsx의 MDXContent(new Function(code))가 이 문자열을 렌더한다.
// rehype-pretty-code 옵션은 velite.config.ts와 동일하게 유지한다(드리프트 주의).
const rehypePrettyCodeOptions = {
  theme: { dark: 'github-dark-dimmed', light: 'github-light' },
};

export async function compileTilBody(md: string): Promise<string> {
  if (!md.trim()) return '';
  const { compile } = await import('@mdx-js/mdx');
  const compiled = await compile(
    { value: md },
    {
      outputFormat: 'function-body',
      remarkPlugins: [remarkGfm],
      rehypePlugins: [[rehypePrettyCode, rehypePrettyCodeOptions]],
    },
  );
  return String(compiled);
}
```

- [ ] **Step 2: 검증**

Run: `npm run build` → 성공. (compileTilBody의 실제 산출은 Task 6/8에서 저장·렌더로 확인.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/til/compile.ts
git commit -m "feat(til): 마크다운 컴파일 온 세이브 모듈"
```

---

## Task 5: 템플릿 정의 + slug 생성

**Files:**
- Create: `src/lib/til/templates.ts`, `src/lib/til/slug.ts`

**Interfaces:**
- Produces:
  - `TIL_TEMPLATES: { key: TilTemplate; label: string; description: string; bodySkeleton: string; hints: { summary: string; selfCheck: string; blocked: string } }[]`
  - `getTemplate(key): TIL_TEMPLATES[number]`
  - `slugify(title: string): string`
  - `uniqueSlug(base: string, exists: (s:string)=>Promise<boolean>): Promise<string>`

- [ ] **Step 1: 템플릿 작성**

```ts
import type { TilTemplate } from './types';

type TemplateDef = {
  key: TilTemplate;
  label: string;
  description: string;
  bodySkeleton: string; // 에디터 본문 초기값(마크다운 소제목)
  hints: { summary: string; selfCheck: string; blocked: string };
};

export const TIL_TEMPLATES: readonly TemplateDef[] = [
  {
    key: 'concept',
    label: '개념 노트',
    description: '개념 하나를 내 말로 정리한다.',
    bodySkeleton: [
      '## 왜 / 언제 쓰나',
      '',
      '## 핵심 정리 (내 말로)',
      '',
    ].join('\n'),
    hints: {
      summary: '이 글을 한 문장으로',
      selfCheck: '3일 뒤 나에게: ___? (답은 적지 않는다)',
      blocked: '아직 막히거나 헷갈리는 곳 (없으면 비워도 됨)',
    },
  },
  {
    key: 'bug',
    label: '버그 해결',
    description: '문제와 해결 과정을 기록한다.',
    bodySkeleton: [
      '## 문제 상황',
      '',
      '## 시도한 것들',
      '',
      '## 해결',
      '',
      '## 다음에 또 만나면',
      '',
    ].join('\n'),
    hints: {
      summary: '한 줄로: 뭐가 문제였고 어떻게 풀었나',
      selfCheck: '3일 뒤 나에게: ___? (답은 적지 않는다)',
      blocked: '아직 남은 의문 (없으면 비워도 됨)',
    },
  },
];

export function getTemplate(key: TilTemplate): TemplateDef {
  const found = TIL_TEMPLATES.find((t) => t.key === key);
  if (!found) throw new Error(`알 수 없는 템플릿: ${key}`);
  return found;
}

export function isTilTemplate(v: string): v is TilTemplate {
  return v === 'concept' || v === 'bug';
}
```

- [ ] **Step 2: slug 작성**

```ts
// 제목 → URL slug. 한글은 유지하되 공백·특수문자만 하이픈으로. 비면 'til'.
export function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'til';
}

// 충돌 시 -2, -3 ... 접미사. exists는 store.slugExists를 래핑해 넘긴다.
export async function uniqueSlug(
  base: string,
  exists: (s: string) => Promise<boolean>,
): Promise<string> {
  if (!(await exists(base))) return base;
  for (let n = 2; n < 1000; n++) {
    const cand = `${base}-${n}`;
    if (!(await exists(cand))) return cand;
  }
  return `${base}-${Date.now()}`;
}
```

- [ ] **Step 3: 검증 + Commit**

Run: `npm run build` → 성공.

```bash
git add src/lib/til/templates.ts src/lib/til/slug.ts
git commit -m "feat(til): 템플릿 정의 + slug 생성"
```

---

## Task 6: Server Actions (초고 저장 / 발행 / 삭제)

**Files:**
- Create: `src/app/til/actions.ts`

**Interfaces:**
- Consumes: `hasUnlockCookie`(src/lib/auth.ts), store(Task 3), `compileTilBody`(Task 4), `isTilTemplate`/slug(Task 5), `TilPostInput`.
- Produces:
  - `savePostAction(input: TilPostInput, publish: boolean): Promise<{ ok: true; slug: string } | { ok: false; error: string }>`
  - `deletePostAction(id: string): Promise<{ ok: true } | { ok: false; error: string }>`

패턴 참고: `src/app/basecamp/actions.ts`(`'use server'`, hasUnlockCookie 재검증, 알려진 값 검증 후에만 DB 접근).

- [ ] **Step 1: 액션 작성**

```ts
'use server';

import { hasUnlockCookie } from '@/lib/auth';
import { compileTilBody } from '@/lib/til/compile';
import { isTilTemplate } from '@/lib/til/templates';
import { slugify, uniqueSlug } from '@/lib/til/slug';
import {
  upsertPost,
  deletePost,
  slugExists,
  getPostBySlugAnyStatus,
  type TilPostRow,
} from '@/lib/til/store';
import type { TilPostInput } from '@/lib/til/types';

type ActionResult = { ok: true; slug: string } | { ok: false; error: string };

function sanitizeUnderstanding(v: number | null): number | null {
  if (v === null) return null;
  if (!Number.isInteger(v) || v < 1 || v > 5) return null;
  return v;
}

export async function savePostAction(input: TilPostInput, publish: boolean): Promise<ActionResult> {
  if (!(await hasUnlockCookie())) return { ok: false, error: 'unauthorized' };

  if (!isTilTemplate(input.template)) return { ok: false, error: '알 수 없는 템플릿' };
  const title = input.title.trim();
  if (!title) return { ok: false, error: '제목을 입력하세요' };

  // 발행 필수 검증: 셀프 체크 질문. 초고 저장은 통과.
  const selfCheck = input.selfCheck.trim();
  if (publish && !selfCheck) {
    return { ok: false, error: '발행하려면 셀프 체크 질문을 채워야 합니다' };
  }

  // 컴파일 온 세이브.
  let bodyCode = '';
  try {
    bodyCode = await compileTilBody(input.bodyMd);
  } catch {
    return { ok: false, error: '본문 마크다운을 컴파일하지 못했습니다 (문법 확인)' };
  }

  // slug: 신규면 제목에서 생성·충돌 회피, 수정이면 기존 slug 유지.
  let slug: string;
  if (input.id) {
    const existing = await getPostBySlugAnyStatusById(input.id);
    slug = existing ?? (await uniqueSlug(slugify(title), (s) => slugExists(s)));
  } else {
    slug = await uniqueSlug(slugify(title), (s) => slugExists(s));
  }

  const row: TilPostRow = {
    id: input.id,
    slug,
    template: input.template,
    title,
    summary: input.summary.trim() || null,
    body_md: input.bodyMd,
    body_code: bodyCode,
    self_check: selfCheck || null,
    understanding: sanitizeUnderstanding(input.understanding),
    blocked_points: input.blockedPoints.trim() || null,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    series_id: input.seriesId,
    cover_image_url: input.coverImageUrl,
    status: publish ? 'published' : 'draft',
    published_at: publish ? new Date().toISOString() : null,
  };

  const res = await upsertPost(row);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, slug: res.data.slug };
}

// id로 기존 slug를 얻는 작은 헬퍼(수정 시 slug 유지). store에 getById가 없어
// 여기서 any-status 조회를 우회한다 — 필요하면 store에 getById를 추가해도 된다.
async function getPostBySlugAnyStatusById(id: string): Promise<string | null> {
  // store에 id 조회가 없으므로, 편집 페이지가 이미 slug를 알고 넘기게 하는 편이
  // 더 단순하다(아래 주: 실제로는 TilPostInput에 기존 slug를 실어 보낸다).
  void id;
  return null;
}

export async function deletePostAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await hasUnlockCookie())) return { ok: false, error: 'unauthorized' };
  const res = await deletePost(id);
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}
```

- [ ] **Step 2: slug 유지 방식 확정 (위 헬퍼 정리)**

수정 시 slug 안정성을 위해, `TilPostInput`에 선택 필드 `existingSlug?: string`을 추가한다(types.ts). 편집 페이지(Task 10)가 로드한 post.slug를 실어 보낸다. 액션에서:

```ts
// input.id가 있으면(수정) 기존 slug를 그대로 쓴다. 없으면 새로 만든다.
const slug = input.id && input.existingSlug
  ? input.existingSlug
  : await uniqueSlug(slugify(title), (s) => slugExists(s));
```

위 임시 헬퍼 `getPostBySlugAnyStatusById`는 삭제하고 이 식으로 대체한다. `types.ts`의 `TilPostInput`에 `existingSlug?: string` 추가.

- [ ] **Step 3: 검증**

Run: `npm run build` → 성공. 실제 저장/발행은 Task 10 에디터 연결 후 브라우저로 확인.

- [ ] **Step 4: Commit**

```bash
git add src/app/til/actions.ts src/lib/til/types.ts
git commit -m "feat(til): 저장/발행/삭제 Server Action (셀프체크 발행 게이트 포함)"
```

---

## Task 7: 목록 페이지 `/til` + 네비 메뉴

**Files:**
- Create: `src/app/til/page.tsx`, `src/components/til/til-card.tsx`
- Modify: `src/components/site-nav.tsx`

**Interfaces:**
- Consumes: `listPublishedPosts`(store), `hasUnlockCookie`.
- Produces: 공개 목록 화면. `til-card.tsx`의 `TilCard({ post })`.

패턴 참고: 카드/목록 스타일은 `src/components/basecamp/basecamp-step-checklist.tsx`의 `.panel`·태그 chip·`text-badge-neutral-text` 토큰을 그대로 쓴다. 페이지 셸(max-w, px, py)은 `src/app/basecamp/page.tsx` `<main>`과 동일 클래스.

- [ ] **Step 1: TilCard 작성**

```tsx
import Link from 'next/link';
import type { TilPost } from '@/lib/til/types';

export function TilCard({ post }: { post: TilPost }) {
  return (
    <Link href={`/til/${post.slug}`} className="panel flex flex-col gap-2 p-4 sm:p-5">
      {post.coverImageUrl ? (
        // eslint 규칙상 next/image 권장이나, 외부 스토리지 URL이라 img로 단순화.
        // 목록 성능이 문제되면 next/image로 교체.
        <img src={post.coverImageUrl} alt="" className="mb-1 aspect-[16/9] w-full rounded object-cover" />
      ) : null}
      <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
        {(post.publishedAt ?? post.createdAt).slice(0, 10)}
      </span>
      <span className="text-body font-extrabold break-keep">{post.title}</span>
      {post.summary ? (
        <span className="text-label font-normal leading-relaxed break-keep">{post.summary}</span>
      ) : null}
      <span className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {post.tags.map((t) => (
          <span key={t} className="chip text-label font-semibold">#{t}</span>
        ))}
        {post.understanding ? (
          <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            이해도 {post.understanding}/5
          </span>
        ) : null}
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: 목록 페이지 작성**

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublishedPosts } from '@/lib/til/store';
import { hasUnlockCookie } from '@/lib/auth';
import { TilCard } from '@/components/til/til-card';

export const metadata: Metadata = {
  title: 'TIL 학습기록',
  description: 'AI Engineer 교육과정 사전학습 중 배운 것을 상기하고 핵심을 기록하는 학습기록.',
};

// DB에서 오고 재배포 없이 바뀌므로 동적 렌더(홈/노트와 동일).
export const dynamic = 'force-dynamic';

export default async function TilListPage() {
  const unlocked = await hasUnlockCookie();
  const read = await listPublishedPosts();
  const posts = read.ok ? read.data : [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-display font-black">TIL 학습기록</h1>
          <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            배운 것을 내 말로 다시 정리한다.
          </p>
        </div>
        {unlocked ? (
          <Link href="/til/new" className="btn-action tap-feedback min-h-11 text-body">
            새 글 쓰기
          </Link>
        ) : null}
      </header>

      {/* 잔디 캘린더는 Task 15에서 여기 상단에 추가한다. */}

      {read.ok ? (
        posts.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {posts.map((post) => (
              <li key={post.id}>
                <TilCard post={post} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            아직 발행한 글이 없어요.
          </p>
        )
      ) : (
        <p className="text-body font-normal">목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      )}
    </main>
  );
}
```

- [ ] **Step 3: 네비에 TIL 추가**

`src/components/site-nav.tsx`의 `NAV_ITEMS`에서 `{ label: "채널톡 로드맵", href: "/roadmap" }` 다음 줄에 추가:

```tsx
  { label: "TIL", href: "/til" },
```

- [ ] **Step 4: 검증 (브라우저)**

Run: `npm run build` → 성공. 그다음 preview 실행(내장 브라우저) → `/til` 열기 → 헤더/빈 상태 정상, 네비에 "TIL" 노출 확인(아이패드 크기 768). 콘솔 에러 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/til/page.tsx src/components/til/til-card.tsx src/components/site-nav.tsx
git commit -m "feat(til): 목록 페이지 + 네비 메뉴"
```

---

## Task 8: 상세 페이지 `/til/[slug]`

**Files:**
- Create: `src/app/til/[slug]/page.tsx`, `src/components/til/til-meta.tsx`

**Interfaces:**
- Consumes: `getPublishedPostBySlug`/`getPostBySlugAnyStatus`(store), `hasUnlockCookie`, `MDXContent`(src/components/mdx-content.tsx).
- Produces: `TilMeta({ post })` (이해도/🔴/셀프체크/태그 표시).

- [ ] **Step 1: TilMeta 작성**

```tsx
import type { TilPost } from '@/lib/til/types';

export function TilMeta({ post }: { post: TilPost }) {
  return (
    <section className="flex flex-col gap-4 border-t-2 border-line pt-6 dark:border-line-dark">
      {post.selfCheck ? (
        <div className="panel flex flex-col gap-1 p-4">
          <span className="text-label font-bold">셀프 체크 질문</span>
          <p className="text-body font-normal break-keep">{post.selfCheck}</p>
        </div>
      ) : null}
      {post.blockedPoints ? (
        <div className="flex flex-col gap-1">
          <span className="text-label font-bold">🔴 아직 막힌 곳</span>
          <p className="text-body font-normal break-keep">{post.blockedPoints}</p>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {post.understanding ? (
          <span className="chip text-label font-semibold">이해도 {post.understanding}/5</span>
        ) : null}
        {post.tags.map((t) => (
          <span key={t} className="chip text-label font-semibold">#{t}</span>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 상세 페이지 작성**

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedPostBySlug, getPostBySlugAnyStatus } from '@/lib/til/store';
import { hasUnlockCookie } from '@/lib/auth';
import { MDXContent } from '@/components/mdx-content';
import { TilMeta } from '@/components/til/til-meta';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const read = await getPublishedPostBySlug(slug);
  const title = read.ok && read.data ? read.data.title : 'TIL';
  return { title, description: read.ok && read.data ? (read.data.summary ?? undefined) : undefined };
}

export default async function TilDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const unlocked = await hasUnlockCookie();

  // 공개 발행글 우선. 없고 소유자면 초고/미발행도 미리보기 허용.
  const pub = await getPublishedPostBySlug(slug);
  let post = pub.ok ? pub.data : null;
  let isDraftPreview = false;
  if (!post && unlocked) {
    const any = await getPostBySlugAnyStatus(slug);
    if (any.ok && any.data) {
      post = any.data;
      isDraftPreview = any.data.status !== 'published';
    }
  }
  if (!post) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        {isDraftPreview ? (
          <span className="chip-solid w-fit text-label font-bold">초고 미리보기</span>
        ) : null}
        <h1 className="text-display font-black break-keep">{post.title}</h1>
        {post.summary ? (
          <p className="text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark break-keep">
            {post.summary}
          </p>
        ) : null}
        {unlocked ? (
          <Link href={`/til/${post.slug}/edit`} className="text-label font-bold text-accent dark:text-accent-dark">
            편집
          </Link>
        ) : null}
      </header>

      <article className="prose prose-slate max-w-none dark:prose-invert">
        <MDXContent code={post.bodyCode} />
      </article>

      <TilMeta post={post} />
    </main>
  );
}
```

- [ ] **Step 3: 검증 (브라우저)**

Run: `npm run build` → 성공. Task 10 이후(글을 실제로 만들 수 있게 된 뒤) preview에서 발행글 상세를 열어 마크다운/코드 하이라이트/메타 렌더 확인. 이 태스크 단독으로는 빌드 통과 + notFound 경로만 확인.

- [ ] **Step 4: Commit**

```bash
git add "src/app/til/[slug]/page.tsx" src/components/til/til-meta.tsx
git commit -m "feat(til): 상세 페이지(MDXContent 렌더 + 메타)"
```

---

## Task 9: 템플릿 선택 화면 `/til/new`

**Files:**
- Create: `src/app/til/new/page.tsx`

**Interfaces:**
- Consumes: `hasUnlockCookie`, `TIL_TEMPLATES`, `TilEditor`(Task 10). 쿼리 `?template=concept|bug`로 편집 진입.

- [ ] **Step 1: 페이지 작성**

```tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { hasUnlockCookie } from '@/lib/auth';
import { TIL_TEMPLATES, isTilTemplate } from '@/lib/til/templates';
import { TilEditor } from '@/components/til/til-editor';

export const dynamic = 'force-dynamic';

export default async function TilNewPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  if (!(await hasUnlockCookie())) redirect('/login');
  const { template } = await searchParams;

  // 템플릿을 이미 고른 상태면 에디터를, 아니면 선택 카드를.
  if (template && isTilTemplate(template)) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <TilEditor mode="create" template={template} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-display font-black">어떤 걸 쓸까요?</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TIL_TEMPLATES.map((t) => (
          <Link key={t.key} href={`/til/new?template=${t.key}`} className="panel flex min-h-11 flex-col gap-2 p-5">
            <span className="text-heading font-extrabold">{t.label}</span>
            <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
              {t.description}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 검증 + Commit**

Run: `npm run build`(TilEditor는 Task 10에서 만들므로, 이 태스크는 Task 10과 함께 빌드 통과시킨다 — 순서상 Task 10을 먼저 만들고 이 페이지를 연결하거나, 임시로 TilEditor import를 Task 10 완료 후 추가). 실무적으로 Task 9·10을 한 커밋으로 묶어도 좋다.

```bash
git add src/app/til/new/page.tsx
git commit -m "feat(til): 템플릿 선택 화면"
```

---

## Task 10: 에디터 + 생성/편집 흐름

**Files:**
- Create: `src/components/til/til-editor.tsx`, `src/app/til/[slug]/edit/page.tsx`

**Interfaces:**
- Consumes: `savePostAction`/`deletePostAction`(Task 6), `getTemplate`(Task 5), `TilPost`/`TilPostInput`.
- Produces: `TilEditor({ mode: 'create'|'edit', template, post? })`.

동작:
- 상태: title, summary, bodyMd(초기값=템플릿 skeleton 또는 기존 post.bodyMd), selfCheck, understanding, blockedPoints, tags(문자열 입력 → 쉼표 분리), (series/cover는 Task 13/14에서 추가).
- 미리보기 토글: 간단히 bodyMd를 `<pre>`가 아니라 "원문/미리보기" 전환. 정식 하이라이트는 저장 후 상세에서. 미리보기는 경량(줄바꿈 유지 텍스트)으로 충분 — 여기서 무거운 클라이언트 마크다운 렌더를 넣지 않는다(YAGNI, 저장 후 상세가 진짜 렌더).
- 버튼: [초고 저장] → savePostAction(input, false), [발행] → savePostAction(input, true). 성공 시 `/til/${slug}`로 이동(router.push). 실패 시 인라인 에러.
- 발행 시 selfCheck 비면 클라이언트에서도 먼저 막고 안내(서버도 재검증).
- 힌트: 각 입력의 placeholder에 `getTemplate(template).hints.*` 사용.

- [ ] **Step 1: 에디터 컴포넌트 작성**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { savePostAction, deletePostAction } from '@/app/til/actions';
import { getTemplate } from '@/lib/til/templates';
import type { TilPost, TilPostInput, TilTemplate } from '@/lib/til/types';

type Props =
  | { mode: 'create'; template: TilTemplate; post?: undefined }
  | { mode: 'edit'; template?: undefined; post: TilPost };

export function TilEditor(props: Props) {
  const router = useRouter();
  const template: TilTemplate = props.mode === 'create' ? props.template : props.post.template;
  const tpl = getTemplate(template);
  const post = props.mode === 'edit' ? props.post : undefined;

  const [title, setTitle] = useState(post?.title ?? '');
  const [summary, setSummary] = useState(post?.summary ?? '');
  const [bodyMd, setBodyMd] = useState(post?.bodyMd ?? tpl.bodySkeleton);
  const [selfCheck, setSelfCheck] = useState(post?.selfCheck ?? '');
  const [understanding, setUnderstanding] = useState<number | null>(post?.understanding ?? null);
  const [blocked, setBlocked] = useState(post?.blockedPoints ?? '');
  const [tagsText, setTagsText] = useState((post?.tags ?? []).join(', '));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildInput(): TilPostInput {
    return {
      id: post?.id,
      existingSlug: post?.slug,
      template,
      title,
      summary,
      bodyMd,
      selfCheck,
      understanding,
      blockedPoints: blocked,
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      seriesId: post?.seriesId ?? null,
      coverImageUrl: post?.coverImageUrl ?? null,
    };
  }

  async function handleSave(publish: boolean) {
    if (pending) return;
    if (publish && !selfCheck.trim()) {
      setError('발행하려면 셀프 체크 질문을 채워주세요.');
      return;
    }
    setPending(true);
    setError(null);
    const res = await savePostAction(buildInput(), publish);
    setPending(false);
    if (res.ok) {
      router.push(`/til/${res.slug}`);
    } else {
      setError(res.error);
    }
  }

  async function handleDelete() {
    if (!post || pending) return;
    setPending(true);
    const res = await deletePostAction(post.id);
    setPending(false);
    if (res.ok) router.push('/til/drafts');
    else setError(res.error);
  }

  const inputClass =
    'w-full border-2 border-foreground bg-background px-3 py-2 text-body dark:border-foreground-dark dark:bg-background-dark';

  return (
    <div className="flex flex-col gap-4">
      <span className="chip w-fit text-label font-bold">{tpl.label}</span>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className={`${inputClass} text-heading font-extrabold`}
      />

      <input
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder={tpl.hints.summary}
        className={inputClass}
      />

      <textarea
        value={bodyMd}
        onChange={(e) => setBodyMd(e.target.value)}
        rows={16}
        className={`${inputClass} font-mono`}
        spellCheck={false}
      />

      <input
        value={selfCheck}
        onChange={(e) => setSelfCheck(e.target.value)}
        placeholder={tpl.hints.selfCheck}
        className={inputClass}
      />

      <textarea
        value={blocked}
        onChange={(e) => setBlocked(e.target.value)}
        rows={2}
        placeholder={tpl.hints.blocked}
        className={inputClass}
      />

      <label className="flex items-center gap-2 text-label font-semibold">
        이해도
        <select
          value={understanding ?? ''}
          onChange={(e) => setUnderstanding(e.target.value ? Number(e.target.value) : null)}
          className="border-2 border-foreground bg-background px-2 py-1 dark:border-foreground-dark dark:bg-background-dark"
        >
          <option value="">-</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}/5</option>
          ))}
        </select>
      </label>

      <input
        value={tagsText}
        onChange={(e) => setTagsText(e.target.value)}
        placeholder="태그 (쉼표로 구분: python, 자료형)"
        className={inputClass}
      />

      {error ? <p className="text-label font-semibold text-destructive dark:text-destructive-dark">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={pending} onClick={() => handleSave(false)} className="chip tap-feedback min-h-11 text-body">
          초고 저장
        </button>
        <button type="button" disabled={pending} onClick={() => handleSave(true)} className="btn-action tap-feedback min-h-11 text-body">
          발행
        </button>
        {post ? (
          <button type="button" disabled={pending} onClick={handleDelete} className="min-h-11 text-label font-semibold text-destructive dark:text-destructive-dark">
            삭제
          </button>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 편집 진입 페이지 작성**

```tsx
import { redirect, notFound } from 'next/navigation';
import { hasUnlockCookie } from '@/lib/auth';
import { getPostBySlugAnyStatus } from '@/lib/til/store';
import { TilEditor } from '@/components/til/til-editor';

export const dynamic = 'force-dynamic';

export default async function TilEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!(await hasUnlockCookie())) redirect('/login');
  const { slug } = await params;
  const read = await getPostBySlugAnyStatus(slug);
  if (!read.ok || !read.data) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <TilEditor mode="edit" post={read.data} />
    </main>
  );
}
```

- [ ] **Step 3: 검증 (브라우저, 실제 저장/발행)**

Run: `npm run build` → 성공. preview 실행. 소유자 상태에서(로컬 unlock 쿠키 필요 — 사용자에게 확인 요청하거나, 배포본에서 사용자 검증) `/til/new` → 개념 노트 선택 → 제목/본문/셀프체크 입력 → [발행] → `/til/[slug]`로 이동하고 마크다운·코드 하이라이트·메타가 렌더되는지. 셀프체크 비우고 [발행] 시 막히는지. [초고 저장]은 셀프체크 없이 통과하는지.

주: 로컬에서 unlock 상태 진입이 이 세션 정책상 막힐 수 있다. 그 경우 빌드 통과까지 확인하고, 실제 상호작용은 배포본에서 사용자가 검증한다(사용자 워크플로우).

- [ ] **Step 4: Commit**

```bash
git add src/components/til/til-editor.tsx "src/app/til/[slug]/edit/page.tsx"
git commit -m "feat(til): 에디터 + 생성/편집/삭제 흐름"
```

---

## Task 11: 초고함 `/til/drafts`

**Files:**
- Create: `src/app/til/drafts/page.tsx`

**Interfaces:**
- Consumes: `hasUnlockCookie`, `listDraftPosts`(store).

- [ ] **Step 1: 페이지 작성**

```tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { hasUnlockCookie } from '@/lib/auth';
import { listDraftPosts } from '@/lib/til/store';

export const dynamic = 'force-dynamic';

export default async function TilDraftsPage() {
  if (!(await hasUnlockCookie())) redirect('/login');
  const read = await listDraftPosts();
  const drafts = read.ok ? read.data : [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-display font-black">초고함</h1>
      {drafts.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {drafts.map((d) => (
            <li key={d.id}>
              <Link href={`/til/${d.slug}/edit`} className="panel flex min-h-11 flex-col gap-1 p-4">
                <span className="text-body font-extrabold break-keep">{d.title || '(제목 없음)'}</span>
                <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  마지막 수정 {d.updatedAt.slice(0, 10)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">초고가 없어요.</p>
      )}
    </main>
  );
}
```

- [ ] **Step 2: 검증 + Commit**

Run: `npm run build` → 성공.

```bash
git add src/app/til/drafts/page.tsx
git commit -m "feat(til): 초고함"
```

---

## Task 12: 태그별 목록 `/til/tags/[tag]`

**Files:**
- Create: `src/app/til/tags/[tag]/page.tsx`

**Interfaces:**
- Consumes: `listPublishedByTag`(store), `TilCard`.

- [ ] **Step 1: 페이지 작성**

```tsx
import { listPublishedByTag } from '@/lib/til/store';
import { TilCard } from '@/components/til/til-card';

export const dynamic = 'force-dynamic';

export default async function TilTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const read = await listPublishedByTag(decoded);
  const posts = read.ok ? read.data : [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-display font-black break-keep">#{decoded}</h1>
      {posts.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {posts.map((p) => (
            <li key={p.id}><TilCard post={p} /></li>
          ))}
        </ul>
      ) : (
        <p className="text-body font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">이 태그의 글이 없어요.</p>
      )}
    </main>
  );
}
```

또한 `til-card.tsx`·`til-meta.tsx`의 태그 chip을 `/til/tags/${t}`로 가는 링크로 바꾸려면, 카드 전체가 이미 링크라 중첩 링크가 된다 — 태그 링크는 상세 페이지(TilMeta)에서만 `<Link>`로 걸고, 카드에서는 표시만 한다(중첩 앵커 회피).

- [ ] **Step 2: TilMeta 태그를 링크로**

`til-meta.tsx`의 태그 span을 `<Link href={`/til/tags/${encodeURIComponent(t)}`}>`로 감싼다.

- [ ] **Step 3: 검증 + Commit**

Run: `npm run build` → 성공.

```bash
git add "src/app/til/tags/[tag]/page.tsx" src/components/til/til-meta.tsx
git commit -m "feat(til): 태그별 목록"
```

---

## Task 13: 시리즈 (til_series)

**Files:**
- Create: `src/app/til/series/[slug]/page.tsx`
- Modify: `src/lib/til/store.ts`(시리즈 함수), `src/components/til/til-editor.tsx`(시리즈 선택), `src/app/til/actions.ts`(시리즈 생성/지정)

**Interfaces:**
- Produces(store): `listSeries()`, `getSeriesBySlug(slug)`, `listPublishedBySeries(seriesId)`, `createSeries(title)`.

- [ ] **Step 1: store에 시리즈 함수 추가**

```ts
import type { TilSeries } from './types';

function rowToSeries(row: Record<string, unknown>): TilSeries {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: (row.description as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function listSeries(): Promise<TilRead<TilSeries[]>> {
  const { data, error } = await supabaseAdmin
    .from('til_series')
    .select('id, slug, title, description, created_at')
    .order('created_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []).map(rowToSeries) };
}

export async function getSeriesBySlug(slug: string): Promise<TilRead<TilSeries | null>> {
  const { data, error } = await supabaseAdmin
    .from('til_series')
    .select('id, slug, title, description, created_at')
    .eq('slug', slug)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ? rowToSeries(data) : null };
}

export async function listPublishedBySeries(seriesId: string): Promise<TilRead<TilPost[]>> {
  const { data, error } = await supabaseAdmin
    .from('til_post')
    .select(POST_COLUMNS)
    .eq('status', 'published')
    .eq('series_id', seriesId)
    .order('published_at', { ascending: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []).map(rowToPost) };
}

export async function createSeries(title: string, slug: string): Promise<TilWrite<{ id: string }>> {
  const { data, error } = await supabaseAdmin
    .from('til_series')
    .insert({ title, slug })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { id: data.id as string } };
}
```

- [ ] **Step 2: 시리즈 페이지 작성**

```tsx
import { notFound } from 'next/navigation';
import { getSeriesBySlug, listPublishedBySeries } from '@/lib/til/store';
import { TilCard } from '@/components/til/til-card';

export const dynamic = 'force-dynamic';

export default async function TilSeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s.ok || !s.data) notFound();
  const posts = await listPublishedBySeries(s.data.id);
  const list = posts.ok ? posts.data : [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <span className="chip w-fit text-label font-bold">시리즈</span>
        <h1 className="text-display font-black break-keep">{s.data.title}</h1>
        {s.data.description ? <p className="text-body font-normal break-keep">{s.data.description}</p> : null}
      </header>
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {list.map((p) => (<li key={p.id}><TilCard post={p} /></li>))}
      </ol>
    </main>
  );
}
```

- [ ] **Step 3: 에디터에 시리즈 선택 추가**

`TilEditor`에 `allSeries: TilSeries[]` prop을 추가하고(생성/편집 페이지가 `listSeries()`로 읽어 전달), `<select>`로 기존 시리즈 지정 + "새 시리즈" 입력(제목). 액션 `savePostAction`은 `input.seriesId`를 그대로 저장하고, 새 시리즈 문자열이 오면 `createSeries` 후 그 id를 쓴다(입력 필드 `newSeriesTitle?: string`를 `TilPostInput`에 추가, 액션에서 처리, slugify로 시리즈 slug 생성).

- [ ] **Step 4: 검증 + Commit**

Run: `npm run build` → 성공.

```bash
git add "src/app/til/series/[slug]/page.tsx" src/lib/til/store.ts src/components/til/til-editor.tsx src/app/til/actions.ts src/lib/til/types.ts
git commit -m "feat(til): 시리즈(연재)"
```

---

## Task 14: 커버/본문 이미지 업로드 (Supabase Storage)

**Files:**
- Modify: `src/app/til/actions.ts`(업로드 액션), `src/components/til/til-editor.tsx`(업로드 UI)
- Storage: 버킷 `til-image` 생성

**Interfaces:**
- Produces: `uploadTilImageAction(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }>`.

- [ ] **Step 1: 스토리지 버킷 생성**

Supabase MCP `execute_sql`(project `wxqteqiuihrgtxmztauc`)로 public read 버킷 생성:

```sql
insert into storage.buckets (id, name, public)
values ('til-image', 'til-image', true)
on conflict (id) do nothing;
```

버킷을 public로 두면 URL 직접 접근이 되므로 목록/상세에서 `<img src>`로 바로 쓴다. 업로드는 service_role(admin)만 하므로 Storage RLS 정책은 default(비공개 write)로 둔다.

- [ ] **Step 2: 업로드 액션 작성**

```ts
// src/app/til/actions.ts 에 추가
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function uploadTilImageAction(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!(await hasUnlockCookie())) return { ok: false, error: 'unauthorized' };
  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: '파일이 없습니다' };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: '이미지는 5MB 이하만' };

  const ext = (file.name.split('.').pop() ?? 'png').toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from('til-image')
    .upload(path, bytes, { contentType: file.type || 'image/png', upsert: false });
  if (error) return { ok: false, error: error.message };

  const { data } = supabaseAdmin.storage.from('til-image').getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
```

- [ ] **Step 3: 에디터에 업로드 UI**

`TilEditor`에 커버 이미지 `<input type="file">` 추가 → 선택 시 `uploadTilImageAction`(FormData) → 반환 URL을 `coverImageUrl` 상태에 저장, buildInput에 포함. 본문 이미지는 같은 액션으로 올린 뒤 반환 URL을 `![](url)` 형태로 bodyMd 커서 위치(단순화: 끝)에 삽입.

- [ ] **Step 4: 검증 + Commit**

Run: `npm run build` → 성공. 실제 업로드는 배포본에서 사용자 검증(또는 로컬 unlock 가능 시 preview).

```bash
git add src/app/til/actions.ts src/components/til/til-editor.tsx
git commit -m "feat(til): 커버/본문 이미지 업로드(Storage)"
```

---

## Task 15: 잔디/streak 캘린더

**Files:**
- Create: `src/components/til/til-streak.tsx`
- Modify: `src/app/til/page.tsx`(상단에 삽입), `src/lib/til/store.ts`(발행 날짜 집계)

**Interfaces:**
- Produces(store): `listPublishedDates(): Promise<TilRead<string[]>>` — 발행글의 서울 날짜(YYYY-MM-DD) 목록.
- Produces(component): `TilStreak({ dates })` — 최근 N주 잔디 그리드.

날짜 처리 참고: `src/lib/today.ts`(todayInSeoul 등 서울 날짜 유틸). 발행일 timestamptz를 서울 날짜로 변환하는 방식은 `src/app/page.tsx`의 `new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" })` 패턴을 그대로 쓴다.

- [ ] **Step 1: store에 날짜 집계 추가**

```ts
export async function listPublishedDates(): Promise<TilRead<string[]>> {
  const { data, error } = await supabaseAdmin
    .from('til_post')
    .select('published_at')
    .eq('status', 'published')
    .not('published_at', 'is', null);
  if (error) return { ok: false, error: error.message };
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' });
  const dates = (data ?? [])
    .map((r) => (r.published_at ? fmt.format(new Date(r.published_at as string)) : null))
    .filter((d): d is string => Boolean(d));
  return { ok: true, data: dates };
}
```

- [ ] **Step 2: 잔디 컴포넌트 작성**

```tsx
import { todayInSeoul } from '@/lib/today';

// 최근 12주(84일) 잔디. dates는 YYYY-MM-DD 발행 날짜들(중복 가능 → 카운트).
export function TilStreak({ dates }: { dates: readonly string[] }) {
  const counts = new Map<string, number>();
  for (const d of dates) counts.set(d, (counts.get(d) ?? 0) + 1);

  const today = todayInSeoul(); // 'YYYY-MM-DD'
  const days: { date: string; count: number }[] = [];
  const base = new Date(`${today}T00:00:00+09:00`);
  for (let i = 83; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const iso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(d);
    days.push({ date: iso, count: counts.get(iso) ?? 0 });
  }

  return (
    <section aria-label="학습기록 잔디" className="flex flex-col gap-2">
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
        {days.map((d) => (
          <span
            key={d.date}
            title={`${d.date}: ${d.count}편`}
            className={`h-3 w-3 rounded-sm ${
              d.count === 0
                ? 'bg-badge-neutral-bg dark:bg-badge-neutral-bg-dark'
                : d.count === 1
                  ? 'bg-ok/60 dark:bg-ok-dark/60'
                  : 'bg-ok dark:bg-ok-dark'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
```

주: 색 토큰(`bg-ok`, `bg-badge-neutral-bg`)이 존재하는지 확인하고, 없으면 globals.css의 실제 토큰명으로 맞춘다(pace-status/basecamp-check가 `border-ok`/`bg-ok`를 쓰므로 존재).

- [ ] **Step 3: 목록 페이지에 삽입**

`/til/page.tsx`에서 `listPublishedDates()`를 읽어 `<TilStreak dates={...} />`를 헤더 아래(주석 자리)에 렌더.

- [ ] **Step 4: 검증 (브라우저) + Commit**

Run: `npm run build` → 성공. preview에서 `/til` 상단에 잔디 그리드가 뜨는지(발행글 없으면 전부 빈 칸). 아이패드 크기에서 가로 스크롤 확인.

```bash
git add src/components/til/til-streak.tsx src/app/til/page.tsx src/lib/til/store.ts
git commit -m "feat(til): 잔디/streak 캘린더"
```

---

## Task 16: 게이트 스크립트 + 최종 검증

**Files:**
- Create: `scripts/check-til.mjs`

**Interfaces:**
- 없음(빌드/런타임에 영향 없는 검증 스크립트).

이 스크립트는 다른 `scripts/check-*.mjs`처럼 정적 규약을 검사한다. 런타임 DB가 없어도 되는 검사에 집중한다:
- til store가 `supabaseAdmin`만 쓰고 `createClient`를 직접 부르지 않는지(admin 규율).
- 마이그레이션이 RLS를 켜고 정책(`create policy`)을 만들지 않는지(default-deny).
- 액션이 `hasUnlockCookie`를 참조하는지(게이트 존재).

- [ ] **Step 1: 스크립트 작성**

```js
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const fail = (m) => { console.error('check-til FAIL:', m); process.exit(1); };

// G1: store는 supabaseAdmin만, createClient 직접 호출 금지.
const store = read('src/lib/til/store.ts');
if (!store.includes("from '@/lib/supabase/admin'")) fail('store가 supabaseAdmin을 임포트하지 않음');
if (store.includes('createClient(')) fail('store가 createClient를 직접 호출함(admin.ts만 허용)');

// G2: 마이그레이션 RLS default-deny(정책 없음).
const mig = read('supabase/migrations/20260910120000_create_til.sql');
if (!/enable row level security/i.test(mig)) fail('마이그레이션에 RLS enable 없음');
if (/create policy/i.test(mig)) fail('til 테이블에 정책이 있음 — default-deny 위반');

// G3: 액션 게이트.
const actions = read('src/app/til/actions.ts');
if (!actions.includes('hasUnlockCookie')) fail('actions가 hasUnlockCookie 게이트를 안 씀');
if (!/셀프 체크|self_check|selfCheck/.test(actions)) fail('발행 필수 검증(셀프체크) 흔적 없음');

console.log('check-til: OK (admin 규율·RLS default-deny·게이트 확인)');
```

- [ ] **Step 2: 스크립트 실행**

Run: `node scripts/check-til.mjs`
Expected: `check-til: OK ...`

- [ ] **Step 3: 최종 빌드 + 브라우저 스모크**

Run: `npm run build` → 성공. preview 실행 → `/til`, `/til/new`(템플릿 선택) 렌더, 네비 "TIL" 노출, 콘솔 에러 0. (발행/편집 등 상호작용은 unlock 필요 — 배포본에서 사용자 검증.)

- [ ] **Step 4: Commit**

```bash
git add scripts/check-til.mjs
git commit -m "test(til): 규약 게이트 스크립트"
```

---

## Self-Review (작성자 체크)

**Spec coverage:**
- 목적/철학 → 전 태스크의 톤(상기+핵심), 발행 필수 셀프체크(Task 6/10). ✓
- 템플릿 2종 + 선택 → Task 5(정의), Task 9(선택 화면), Task 10(스켈레톤/힌트). ✓
- 셀프체크 발행 필수 → Task 6(서버) + Task 10(클라이언트). ✓
- 이해도/🔴/태그 → Task 2(타입), Task 6(저장), Task 8(표시), Task 10(입력). ✓
- 데이터 모델 til_post/til_series + RLS default-deny → Task 1. ✓
- 컴파일 온 세이브 + MDXContent 렌더 → Task 4/6/8. ✓
- 라우트 7종 → Task 7/8/9/10/11/12/13. ✓
- 소유자 게이트 → Task 9/10/11(redirect), Task 6(액션 재검증). ✓
- 시리즈/커버이미지/잔디 → Task 13/14/15. ✓
- 네비 "TIL" → Task 7. ✓
- 브랜딩(KANT 금지) → Global Constraints + 메타 문구는 "AI Engineer 교육과정". ✓

**Placeholder scan:** Task 6의 임시 헬퍼 `getPostBySlugAnyStatusById`는 Step 2에서 명시적으로 제거·대체하도록 지시함(플레이스홀더 아님, 리팩터 지시). 그 외 TBD/TODO 없음.

**Type consistency:** `TilPostInput`에 `existingSlug?`(Task 6 Step 2), `newSeriesTitle?`(Task 13)를 types.ts에 추가하는 것을 각 태스크에 명시. store의 `POST_COLUMNS`/`rowToPost`/`TilPostRow` 컬럼명은 Task 1 마이그레이션과 1:1 일치. 액션→store→렌더의 필드명(bodyCode/body_code, selfCheck/self_check 등) 매핑 일관.

---

## Execution Handoff

계획은 `docs/superpowers/plans/2026-09-10-til-learning-log.md`에 저장됨. 실행 방식 두 가지:

1. **Subagent-Driven (권장)** — 태스크마다 새 서브에이전트 디스패치, 태스크 사이에 리뷰, 빠른 반복.
2. **Inline Execution** — 이 세션에서 executing-plans로 배치 실행 + 체크포인트.

어느 쪽으로 할까요?
