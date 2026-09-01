// 복습 만기 계산의 심장 — 의존성 0 순수 모듈 (pace.ts·today.ts와 같은 원칙:
// import 문 없이, scripts/check-review.mjs가 이 파일을 그대로 로드해 검증한다).
//
// 설계 출처: .planning/research/edu-sites/round2-h-review-design.md.
// 원리: 완료한 레슨의 "스스로 점검 문제"를 간격을 두고 재소환한다(간격 효과 +
// 시험 효과). 채점은 없다 — "복습 완료" 자기 신고 한 번이 사다리를 전진시킨다.
// 벌점 없음·졸업 있음이 이 시스템의 방어선이다: 복습이 시험이 되는 순간,
// 그리고 부담이 무한히 쌓이는 순간 전체가 무너진다(WaniKani 문화의 역교훈).
//
// 복습은 어떤 경우에도 새 레슨 진행을 잠그지 않는다 — 고정 마감(9/30 개강)이
// 있는 일정에서 복습 실패가 일정 실패로 전이되면 안 된다.

/** 사다리 간격(일). review_count가 다음 만기까지의 간격 인덱스다.
 * [3]=21일 칸은 현재 GRADUATE_COUNT=3이라 쓰이지 않는다 — 개강 후 장기 복습을
 * 켜고 싶으면 GRADUATE_COUNT를 4로 올리는 한 줄이면 된다. */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 21] as const;

/** 이 횟수만큼 복습하면 졸업 — 다시 나오지 않는다. */
export const GRADUATE_COUNT = 3;

export type ReviewState = {
  reviewCount: number;
  /** 마지막 복습의 서울 날짜(YYYY-MM-DD). 복습 전이면 null. */
  lastReviewedDate: string | null;
};

export type DueLesson = {
  lessonSlug: string;
  /** 이번이 몇 번째 복습인지 (1부터). */
  rung: number;
  /** 만기일(YYYY-MM-DD). */
  dueDate: string;
};

/** YYYY-MM-DD 문자열에 일수를 더한다 — 로컬 타임존 getter를 쓰지 않는다
 * (today.ts의 daysUntil과 같은 Date.UTC 기법). */
export function addDays(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  const mm = String(t.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(t.getUTCDate()).padStart(2, '0');
  return `${t.getUTCFullYear()}-${mm}-${dd}`;
}

/**
 * 오늘 만기인 복습 목록. 만기일 = 직전 사건(완료 or 마지막 복습) + 간격.
 * "완료 시각 고정 오프셋"이 아니라 직전 사건 기준인 이유: 1일차 복습을 5일차에
 * 했을 때 3일차 만기가 이미 지나 곧바로 또 만기가 되는 왜곡을 막는다.
 *
 * @param completedDateBySlug 완료 레슨 slug → 완료한 서울 날짜. progress 테이블
 *   현재 행에서만 만들어야 한다 — 완료를 취소한 레슨은 여기 없으므로 만기
 *   목록에서 자연히 빠진다(복습 이력은 lesson_review에 남더라도).
 * @param states slug → 복습 상태 (lesson_review 행).
 * @param todayStr 오늘 서울 날짜. YYYY-MM-DD 사전순 비교가 곧 날짜 비교다.
 */
export function computeDueLessons(
  completedDateBySlug: ReadonlyMap<string, string>,
  states: ReadonlyMap<string, ReviewState>,
  todayStr: string,
): DueLesson[] {
  const due: DueLesson[] = [];
  for (const [slug, completedDate] of completedDateBySlug) {
    const state = states.get(slug) ?? { reviewCount: 0, lastReviewedDate: null };
    if (state.reviewCount >= GRADUATE_COUNT) continue; // 졸업
    const anchor =
      state.reviewCount === 0 || state.lastReviewedDate === null
        ? completedDate
        : state.lastReviewedDate;
    const interval = REVIEW_INTERVALS_DAYS[state.reviewCount];
    const dueDate = addDays(anchor, interval);
    if (dueDate <= todayStr) {
      due.push({ lessonSlug: slug, rung: state.reviewCount + 1, dueDate });
    }
  }
  // 만기가 오래된 것 먼저, 같은 날짜면 slug 순 — 결정적 순서(테스트 가능성).
  due.sort((a, b) => (a.dueDate === b.dueDate ? (a.lessonSlug < b.lessonSlug ? -1 : 1) : a.dueDate < b.dueDate ? -1 : 1));
  return due;
}

/** 다음 만기일(만기 0건일 때 배지에 표시). 전부 졸업이거나 완료 0건이면 null. */
export function nextDueDate(
  completedDateBySlug: ReadonlyMap<string, string>,
  states: ReadonlyMap<string, ReviewState>,
): string | null {
  let min: string | null = null;
  for (const [slug, completedDate] of completedDateBySlug) {
    const state = states.get(slug) ?? { reviewCount: 0, lastReviewedDate: null };
    if (state.reviewCount >= GRADUATE_COUNT) continue;
    const anchor =
      state.reviewCount === 0 || state.lastReviewedDate === null
        ? completedDate
        : state.lastReviewedDate;
    const dueDate = addDays(anchor, REVIEW_INTERVALS_DAYS[state.reviewCount]);
    if (min === null || dueDate < min) min = dueDate;
  }
  return min;
}

/** 레슨 페이지의 "스스로 점검" 섹션 앵커 — 35편 공통 상수. rehype-slug가
 * `## 6. 핵심 정리 및 스스로 점검`(게이트 L1이 전 레슨에 강제)에서 생성하는
 * id를 실측해 박았다(.velite 산출물에서 확인). 헤딩 문구가 바뀌면 게이트
 * check-review.mjs가 산출물 대조로 잡는다. */
export const SELF_CHECK_ANCHOR = '6-핵심-정리-및-스스로-점검';
