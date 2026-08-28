import 'server-only';

// lesson_chat 테이블에 대한 유일한 데이터 접근 계층 — note-store.ts의 형태를 그대로
// 미러링한다. 레슨 하나당 대화 한 벌을 JSON 배열로 들고 있다.
//
// 왜 메시지를 행 단위가 아니라 배열 한 덩어리로 저장하나: 이 대화는 항상 통째로
// 읽고 통째로 쓴다(모델에 전체 히스토리를 다시 보내야 하므로). 행으로 쪼개면
// 매 턴 정렬·조인이 생기는데 얻는 것이 없다. 1인용 규모에서 JSONB 한 칸이 맞다.

import { supabaseAdmin } from './supabase/admin';

export type TutorRole = 'user' | 'assistant';
export type TutorMessage = { role: TutorRole; content: string };

export type TutorRead = { ok: true; messages: TutorMessage[] } | { ok: false; error: string };

// 한 대화가 무한히 자라 매 턴 비용이 계속 커지는 것을 막는 상한. 초과분은 저장
// 시점에 앞에서부터 잘라낸다 — 오래된 턴부터 사라지고 최근 맥락은 남는다.
const MAX_TURNS = 60;
// 한 메시지 길이 상한(DoS·비용 방어). 레슨 질문 한 개로는 충분히 넉넉하다.
export const MAX_MESSAGE_LENGTH = 4_000;

/** 저장된 값이 우리가 기대하는 모양인지 확인한다 — DB의 JSONB는 무엇이든 담을 수 있다. */
function isTutorMessage(value: unknown): value is TutorMessage {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { role?: unknown; content?: unknown };
  return (
    (candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string'
  );
}

export async function readLessonChat(lessonSlug: string): Promise<TutorRead> {
  const { data, error } = await supabaseAdmin
    .from('lesson_chat')
    .select('messages')
    .eq('lesson_id', lessonSlug)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  const raw = data?.messages;
  if (!Array.isArray(raw)) {
    // 행이 없으면 "아직 대화 없음"이며 빈 배열로 성공을 반환한다 — 조회 실패와
    // 타입 수준에서 구분된다(note-store.ts와 같은 규율).
    return { ok: true, messages: [] };
  }

  return { ok: true, messages: raw.filter(isTutorMessage) };
}

export async function saveLessonChat(
  lessonSlug: string,
  messages: TutorMessage[],
): Promise<void> {
  const trimmed = messages.slice(-MAX_TURNS);

  const { error } = await supabaseAdmin
    .from('lesson_chat')
    .upsert({ lesson_id: lessonSlug, messages: trimmed, updated_at: new Date().toISOString() });

  if (error) {
    throw new Error(`tutor-store: 대화 저장 실패 (lesson_id=${lessonSlug}): ${error.message}`);
  }
}

export async function clearLessonChat(lessonSlug: string): Promise<void> {
  const { error } = await supabaseAdmin.from('lesson_chat').delete().eq('lesson_id', lessonSlug);

  if (error) {
    throw new Error(`tutor-store: 대화 초기화 실패 (lesson_id=${lessonSlug}): ${error.message}`);
  }
}
