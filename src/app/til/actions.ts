'use server';

import { hasUnlockCookie } from '@/lib/auth';
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
    published_at: publish ? new Date().toISOString() : null,
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
