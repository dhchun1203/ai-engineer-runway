import 'server-only';

// 소유자(사이트 주인) 세션 판정 — 다중 사용자 전환 이후에도 "나만 보는" 기능을 위한
// 게이트다. OWNER_EMAIL과 일치하는 로그인 세션일 때만 참. 슬랙 피드(/slack)처럼 소유자
// 전용 화면이 이 함수 하나로 접근을 가른다. 요청당 1회만 세션을 검증하도록 캐시한다.

import { cache } from 'react';
import { createSupabaseServerClient } from './supabase/server';

function ownerEmail(): string | null {
  const raw = process.env.OWNER_EMAIL;
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export const isOwnerSession = cache(async (): Promise<boolean> => {
  const owner = ownerEmail();
  if (!owner) return false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    const email = data.user?.email;
    if (error || !email) return false;
    return email.trim().toLowerCase() === owner;
  } catch {
    return false;
  }
});
