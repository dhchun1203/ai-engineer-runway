import 'server-only';

// lesson_review 테이블의 유일한 데이터 접근 계층 — progress-store.ts와 동형
// (server-only + supabaseAdmin + ok/error 판별 유니온). 만기 계산(순수)은
// src/lib/review.ts가, 저장은 이 파일이 맡는다.

import { supabaseAdmin } from './supabase/admin';
import type { ReviewState, ReviewJudgment } from './review';

export type ReviewStatesRead =
  | { ok: true; states: Map<string, ReviewState> }
  | { ok: false; error: string };

/** 전 레슨의 복습 상태. last_reviewed_at(timestamptz)은 호출부가 서울 날짜로
 * 바꿔 쓰도록 ISO 그대로 두지 않고 여기서 날짜만 남긴다 — 만기 계산이 날짜
 * 단위이기 때문이다(review.ts). */
export async function readReviewStates(): Promise<ReviewStatesRead> {
  const { data, error } = await supabaseAdmin
    .from('lesson_review')
    .select('lesson_id, review_count, last_reviewed_at, missed_q');

  if (error) {
    return { ok: false, error: error.message };
  }

  const states = new Map<string, ReviewState>();
  for (const row of data ?? []) {
    states.set(row.lesson_id as string, {
      reviewCount: row.review_count as number,
      lastReviewedDate: row.last_reviewed_at
        ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
            new Date(row.last_reviewed_at as string),
          )
        : null,
      missedQ: (row.missed_q as number[] | null) ?? [],
    });
  }
  return { ok: true, states };
}

/** "복습 완료" 자기 신고 — 사다리 한 칸 전진. 채점·검증 없음(설계 원칙:
 * 판정의 정확도보다 회상 시도 자체가 효과의 대부분이다). */
export async function markLessonReviewed(lessonSlug: string): Promise<void> {
  // upsert로는 "기존 값 +1"을 원자적으로 못 쓰므로 read-modify-write.
  // 사용자 1명·기기 1대가 전제라 경합은 실질적으로 없다(D-17과 같은 전제).
  const { data, error: readError } = await supabaseAdmin
    .from('lesson_review')
    .select('review_count')
    .eq('lesson_id', lessonSlug)
    .maybeSingle();

  if (readError) {
    throw new Error(`review-store: 상태 조회 실패 (lesson_id=${lessonSlug}): ${readError.message}`);
  }

  const nextCount = ((data?.review_count as number | undefined) ?? 0) + 1;
  const { error } = await supabaseAdmin.from('lesson_review').upsert({
    lesson_id: lessonSlug,
    review_count: nextCount,
    last_reviewed_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`review-store: 복습 저장 실패 (lesson_id=${lessonSlug}): ${error.message}`);
  }
}

/** /review 세션의 O/△/X 판정 저장(quick 260901-w04). correct면 missed_q에서
 * 그 인덱스를 빼고, shaky·wrong이면 넣는다(이미 있으면 무시 — 중복 방지, 정렬
 * 유지). review_count·last_reviewed_at은 upsert 페이로드에 넣지 않는다 —
 * on-conflict 시 Supabase upsert는 지정한 컬럼만 UPDATE SET하므로 이 호출이
 * 사다리 상태를 건드리지 않고(신규 행이면 그 두 컬럼은 default 0/null이
 * 적용된다), markLessonReviewed의 사다리 전진과 서로 침범하지 않는다. 이
 * 세션은 사다리를 전진시키지 않는다 — 사다리 전진은 홈 카드의 "복습 완료"
 * 자기 신고가 유지한다(두 상호작용의 역할 분리). */
export async function recordReviewJudgment(
  lessonSlug: string,
  questionIndex: number,
  judgment: ReviewJudgment,
): Promise<void> {
  const { data, error: readError } = await supabaseAdmin
    .from('lesson_review')
    .select('missed_q')
    .eq('lesson_id', lessonSlug)
    .maybeSingle();

  if (readError) {
    throw new Error(`review-store: missed_q 조회 실패 (lesson_id=${lessonSlug}): ${readError.message}`);
  }

  const current = ((data?.missed_q as number[] | null) ?? []).slice();
  const next =
    judgment === 'correct'
      ? current.filter((i) => i !== questionIndex)
      : current.includes(questionIndex)
        ? current
        : [...current, questionIndex].sort((a, b) => a - b);

  const { error } = await supabaseAdmin.from('lesson_review').upsert({
    lesson_id: lessonSlug,
    missed_q: next,
  });

  if (error) {
    throw new Error(`review-store: 판정 저장 실패 (lesson_id=${lessonSlug}): ${error.message}`);
  }
}
