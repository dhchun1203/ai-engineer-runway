import 'server-only';

// inbox_item 테이블의 유일한 데이터 접근 계층 — review-store.ts와 동형
// (server-only + supabaseAdmin + ok/error 판별 유니온). localStorage가 아니다 —
// Supabase 저장이 기기 간 공유의 핵심(D-17 전제 위에서도 질문함은 기기 어디서나
// 같은 목록을 봐야 한다).

import { supabaseAdmin } from './supabase/admin';

export type InboxItem = {
  id: string;
  body: string;
  lessonId: string | null;
  createdAt: string;
  done: boolean;
};

export type InboxItemsRead = { ok: true; items: InboxItem[] } | { ok: false; error: string };

// T-x62-02(DoS) — 본문 길이 상한. 초과 시 저장을 거부하고 한국어 오류를 던진다
// (note-store MAX_NOTE_LENGTH 원칙과 동일).
const MAX_INBOX_LENGTH = 5_000;

/** 미완료(done=false) 먼저, 그 안에서는 최신순. 질문함을 열었을 때 아직 안 본
 * 질문이 위로 오고, 완료한 질문은 아래로 가라앉아 흐려 보인다(inbox-panel). */
export async function readInboxItems(): Promise<InboxItemsRead> {
  const { data, error } = await supabaseAdmin
    .from('inbox_item')
    .select('id, body, lesson_id, created_at, done')
    .order('done', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return { ok: false, error: error.message };
  }

  const items: InboxItem[] = (data ?? []).map((row) => ({
    id: row.id as string,
    body: row.body as string,
    lessonId: (row.lesson_id as string | null) ?? null,
    createdAt: row.created_at as string,
    done: row.done as boolean,
  }));

  return { ok: true, items };
}

export async function addInboxItem(body: string, lessonId?: string | null): Promise<void> {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    throw new Error('inbox-store: 빈 질문은 저장할 수 없습니다.');
  }
  if (trimmed.length > MAX_INBOX_LENGTH) {
    throw new Error(`inbox-store: 질문이 너무 깁니다 — 최대 ${MAX_INBOX_LENGTH}자까지 저장할 수 있습니다.`);
  }

  const { error } = await supabaseAdmin
    .from('inbox_item')
    .insert({ body: trimmed, lesson_id: lessonId ?? null });

  if (error) {
    throw new Error(`inbox-store: 질문 저장 실패: ${error.message}`);
  }
}

export async function setInboxItemDone(id: string, done: boolean): Promise<void> {
  const { error } = await supabaseAdmin.from('inbox_item').update({ done }).eq('id', id);

  if (error) {
    throw new Error(`inbox-store: 완료 상태 저장 실패 (id=${id}): ${error.message}`);
  }
}
