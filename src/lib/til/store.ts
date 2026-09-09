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
