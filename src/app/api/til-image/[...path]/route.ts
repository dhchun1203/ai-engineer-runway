// GET /api/til-image/<user_id>/<파일 이름> — TIL 이미지를 본인에게만 내려준다(2026-11-13).
//
// til-image 버킷은 비공개다. 이 라우트가 (1) 세션의 사용자 id를 먼저 확인하고 (2) 경로의 첫
// 폴더가 그 id인지 보고 (3) 로그인 본인 자격(getUserDb, 저장소 규칙 적용)으로 내려받는다.
// 남의 폴더면 저장소 규칙도 막지만, 그 전에 앱 계층에서 한 번 더 막는다(데이터 표와 같은 2겹).
// 남의 이미지가 있는지 없는지도 드러내지 않게, 권한 없음과 없는 파일은 똑같이 404로 답한다.
//
// 응답은 그 사람 브라우저에만 남게 private 캐시로 둔다. 파일 이름에 무작위 id가 들어가
// 같은 주소의 내용이 바뀌지 않으므로 오래 캐시해도 된다. 공유 캐시(CDN)에는 남지 않는다.

import type { NextRequest } from 'next/server';
import { getCurrentUserId } from '@/lib/current-user';
import { getUserDb } from '@/lib/supabase/db';
import { TIL_IMAGE_BUCKET, TIL_IMAGE_TYPES } from '@/lib/til/image';

const SEGMENT = /^[A-Za-z0-9._-]+$/;

function notFound(): Response {
  return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/til-image/[...path]'>) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return new Response('Unauthorized', { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
  }

  const { path } = await ctx.params;
  // "<내 id>/<파일 이름>" 두 칸만 받는다. 점 두 개나 이상한 글자가 든 경로는 버린다.
  if (path.length !== 2 || path[0] !== userId || !path.every((s) => SEGMENT.test(s) && s !== '..')) {
    return notFound();
  }

  const db = await getUserDb();
  const { data, error } = await db.storage.from(TIL_IMAGE_BUCKET).download(path.join('/'));
  if (error || !data) return notFound();

  // 올릴 때 허락한 이미지 형식만 그 형식으로 내보낸다. 그 밖이면 내려받기로만 준다.
  const type = TIL_IMAGE_TYPES[data.type] ? data.type : 'application/octet-stream';
  return new Response(data, {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
