import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUserId, requireCurrentUserId } from '@/lib/current-user';
import type { TilPost, TilTemplate, TilStatus, TilSeries } from './types';

// TIL은 계정별 저장이다 — 모든 조회/쓰기를 현재 로그인 사용자의 user_id로 좁힌다.
// 비로그인 조회는 빈 결과로 성공을 반환한다(로그인해야 자기 글이 보인다).

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
  const userId = await getCurrentUserId();
  if (!userId) return { ok: true, data: [] };

  const { data, error } = await supabaseAdmin
    .from('til_post')
    .select(POST_COLUMNS)
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []).map(rowToPost) };
}

export async function getPublishedPostBySlug(slug: string): Promise<TilRead<TilPost | null>> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: true, data: null };

  const { data, error } = await supabaseAdmin
    .from('til_post')
    .select(POST_COLUMNS)
    .eq('user_id', userId)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ? rowToPost(data) : null };
}

export async function getPostBySlugAnyStatus(slug: string): Promise<TilRead<TilPost | null>> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: true, data: null };

  const { data, error } = await supabaseAdmin
    .from('til_post')
    .select(POST_COLUMNS)
    .eq('user_id', userId)
    .eq('slug', slug)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ? rowToPost(data) : null };
}

export async function listDraftPosts(): Promise<TilRead<TilPost[]>> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: true, data: [] };

  const { data, error } = await supabaseAdmin
    .from('til_post')
    .select(POST_COLUMNS)
    .eq('user_id', userId)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []).map(rowToPost) };
}

export async function listPublishedByTag(tag: string): Promise<TilRead<TilPost[]>> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: true, data: [] };

  const { data, error } = await supabaseAdmin
    .from('til_post')
    .select(POST_COLUMNS)
    .eq('user_id', userId)
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
  const userId = await requireCurrentUserId();

  // 수정(id 존재)일 때는 그 글이 정말 이 사용자 것인지 먼저 확인한다 — id로 남의 글을
  // 갈아엎거나 소유권을 뺏는 것을 막는다(방어적 검사).
  if (row.id) {
    const { data: owned, error: ownErr } = await supabaseAdmin
      .from('til_post')
      .select('user_id')
      .eq('id', row.id)
      .maybeSingle();
    if (ownErr) return { ok: false, error: ownErr.message };
    if (owned && (owned.user_id as string) !== userId) {
      return { ok: false, error: '이 글을 수정할 권한이 없습니다.' };
    }
  }

  const payload = { ...row, user_id: userId, updated_at: new Date().toISOString() };
  const { data, error } = await supabaseAdmin
    .from('til_post')
    .upsert(payload, { onConflict: 'id' })
    .select('slug')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { slug: data.slug as string } };
}

export async function deletePost(id: string): Promise<TilWrite<void>> {
  const userId = await requireCurrentUserId();
  const { error } = await supabaseAdmin
    .from('til_post')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

export async function slugExists(slug: string, exceptId?: string): Promise<boolean> {
  // slug 유일성은 사용자별이다 — 다른 사용자가 같은 slug를 써도 충돌이 아니다.
  const userId = await getCurrentUserId();
  if (!userId) return false;

  let q = supabaseAdmin.from('til_post').select('id').eq('user_id', userId).eq('slug', slug);
  if (exceptId) q = q.neq('id', exceptId);
  const { data } = await q.maybeSingle();
  return Boolean(data);
}

// 발행글의 published_at(timestamptz)을 서울 날짜(YYYY-MM-DD)로 변환한 목록.
// 잔디/streak 캘린더(TilStreak)가 소비한다. 중복(같은 날 여러 편) 허용.
export async function listPublishedDates(): Promise<TilRead<string[]>> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: true, data: [] };

  const { data, error } = await supabaseAdmin
    .from('til_post')
    .select('published_at')
    .eq('user_id', userId)
    .eq('status', 'published')
    .not('published_at', 'is', null);
  if (error) return { ok: false, error: error.message };
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' });
  const dates = (data ?? [])
    .map((r) => (r.published_at ? fmt.format(new Date(r.published_at as string)) : null))
    .filter((d): d is string => Boolean(d));
  return { ok: true, data: dates };
}

// snake_case til_series 행 → camelCase TilSeries.
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
  const userId = await getCurrentUserId();
  if (!userId) return { ok: true, data: [] };

  const { data, error } = await supabaseAdmin
    .from('til_series')
    .select('id, slug, title, description, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []).map(rowToSeries) };
}

export async function getSeriesBySlug(slug: string): Promise<TilRead<TilSeries | null>> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: true, data: null };

  const { data, error } = await supabaseAdmin
    .from('til_series')
    .select('id, slug, title, description, created_at')
    .eq('user_id', userId)
    .eq('slug', slug)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ? rowToSeries(data) : null };
}

export async function listPublishedBySeries(seriesId: string): Promise<TilRead<TilPost[]>> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: true, data: [] };

  const { data, error } = await supabaseAdmin
    .from('til_post')
    .select(POST_COLUMNS)
    .eq('user_id', userId)
    .eq('status', 'published')
    .eq('series_id', seriesId)
    .order('published_at', { ascending: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []).map(rowToPost) };
}

export async function createSeries(title: string, slug: string): Promise<TilWrite<{ id: string }>> {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabaseAdmin
    .from('til_series')
    .insert({ user_id: userId, title, slug })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { id: data.id as string } };
}
