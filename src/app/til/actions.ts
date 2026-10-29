'use server';

import { hasUnlockCookie } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { compileTilBody } from '@/lib/til/compile';
import { isTilTemplate } from '@/lib/til/templates';
import { slugify, uniqueSlug } from '@/lib/til/slug';
import {
  upsertPost,
  deletePost,
  slugExists,
  createSeries,
  type TilPostRow,
} from '@/lib/til/store';
import type { TilPostInput } from '@/lib/til/types';

type ActionResult = { ok: true; slug: string } | { ok: false; error: string };

function sanitizeUnderstanding(v: number | null): number | null {
  if (v === null) return null;
  if (!Number.isInteger(v) || v < 1 || v > 5) return null;
  return v;
}

// 에디터에서 고른 학습 날짜(YYYY-MM-DD)를 서울 정오 시각으로 바꾼다. 정오로 두면 어느 시간대로
// 읽어도 날짜가 하루 밀리지 않는다. 형식이 틀리면 null(호출부가 지금 시각을 쓴다).
function learnedOnToIso(v: string | undefined): string | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T12:00:00+09:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
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

  // slug: input.id가 있으면(수정) 기존 slug를 그대로 쓴다. 없으면 새로 만든다.
  const slug = input.id && input.existingSlug
    ? input.existingSlug
    : await uniqueSlug(slugify(title), (s) => slugExists(s));

  // 새 시리즈 제목이 있으면 먼저 생성하고 그 id를 쓴다. 없으면 선택된 seriesId를 그대로 쓴다.
  // (시리즈 slug 충돌 회피는 요구되지 않음 — createSeries 에러는 액션 에러로 노출.)
  let seriesId = input.seriesId;
  const newSeriesTitle = input.newSeriesTitle?.trim();
  if (newSeriesTitle) {
    const seriesRes = await createSeries(newSeriesTitle, slugify(newSeriesTitle));
    if (!seriesRes.ok) return { ok: false, error: seriesRes.error };
    seriesId = seriesRes.data.id;
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
    series_id: seriesId,
    cover_image_url: input.coverImageUrl,
    status: publish ? 'published' : 'draft',
    // 발행 날짜는 업로드한 순간이 아니라 학습한 날. 에디터가 기존 글의 날짜를 기본값으로
    // 넘기므로, 고쳐서 다시 발행해도 날짜가 오늘로 바뀌지 않는다.
    published_at: publish ? (learnedOnToIso(input.learnedOn) ?? new Date().toISOString()) : null,
  };

  const res = await upsertPost(row);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, slug: res.data.slug };
}

export async function deletePostAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await hasUnlockCookie())) return { ok: false, error: 'unauthorized' };
  const res = await deletePost(id);
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

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
