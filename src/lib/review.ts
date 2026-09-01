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
  /** /review 세션(quick 260901-w04)의 △·X 판정이 쌓인 문항 인덱스. 기존
   * computeDueLessons·nextDueDate는 이 필드를 무시하므로 무해하다. 값이
   * undefined면 selectReviewQuestions가 []로 취급한다(기존 상태 fixture가
   * 이 필드 없이도 계속 동작). */
  missedQ?: number[];
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

// --- /review 세션 (quick 260901-w04, 설계는 round2-h-review-design.md V2절) ---
//
// selectReviewQuestions는 이 파일의 원칙(의존성 0, import 없음)을 그대로
// 지킨다 — scripts/check-review.mjs가 이 파일을 그대로 로드해 검증한다.

/** 문항 하나를 가리키는 참조 — 레슨 slug + selfCheck 배열 인덱스. */
export type ReviewQuestionRef = {
  lessonSlug: string;
  questionIndex: number;
};

/** 한 세션에서 보여줄 문항 수 상한. */
export const REVIEW_SESSION_LIMIT = 12;

/** O/△/X 3단 판정. */
export type ReviewJudgment = 'correct' | 'shaky' | 'wrong';

/** review-actions.ts의 위조 POST 방어 화이트리스트가 이 배열을 그대로 쓴다. */
export const REVIEW_JUDGMENTS: readonly ReviewJudgment[] = ['correct', 'shaky', 'wrong'];

/** 문자열 → 32bit 정수 해시(FNV류 단순 버전). 같은 문자열은 항상 같은 수를 낸다 —
 * todayStr를 셔플 시드로 바꾸는 용도라 암호학적 성질은 필요 없다. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/** mulberry32 — 작은 결정적 PRNG. 같은 seed는 항상 같은 난수 시퀀스를 낸다
 * (셔플 재현성/테스트 가능성이 이 함수의 존재 이유다). */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates, seed로 결정된 순서. 원본 배열은 건드리지 않는다. */
function shuffle<T>(arr: readonly T[], seed: number): T[] {
  const result = [...arr];
  const rng = mulberry32(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 레슨별 문항 인덱스 목록(byLesson)을 레슨 라운드로빈으로 펼친다 — 셔플된
 * 레슨 순서로 각 레슨의 0번째 문항을 먼저 다 뽑고, 그다음 1번째 문항을 다시
 * 순서대로 뽑는 식이다. 레슨당 문항이 최대 2개(velite build가 강제)라
 * "연속 두 항목이 같은 레슨"이 되는 경우는 그 레슨 하나만 후보로 남았을 때뿐이다. */
function roundRobinExpand(byLesson: ReadonlyMap<string, number[]>, seed: number): ReviewQuestionRef[] {
  const lessonSlugs = shuffle([...byLesson.keys()], seed);
  const result: ReviewQuestionRef[] = [];
  let round = 0;
  let hasMore = lessonSlugs.length > 0;
  while (hasMore) {
    hasMore = false;
    for (const slug of lessonSlugs) {
      const indices = byLesson.get(slug) ?? [];
      if (round < indices.length) {
        result.push({ lessonSlug: slug, questionIndex: indices[round] });
        hasMore = true;
      }
    }
    round += 1;
  }
  return result;
}

/**
 * /review 세션에 보여줄 문항을 고른다(순수 함수). 완료 + 문항이 있는 레슨만
 * 후보이고, 약한 것(missedQ 인덱스) → 만기(computeDueLessons) → 나머지 순으로
 * 3-tier 우선순위를 매긴 뒤 각 tier 안에서 todayStr 시드 결정적 셔플 + 레슨
 * 라운드로빈으로 교차한다. REVIEW_SESSION_LIMIT(12)에서 자른다.
 *
 * @param completedDateBySlug 완료 레슨 slug → 완료한 서울 날짜.
 * @param states slug → 복습 상태(missedQ 포함). missedQ가 undefined인 상태도
 *   무해하게 []로 취급한다.
 * @param todayStr 오늘 서울 날짜 — 셔플 시드이자 만기 계산 기준일.
 * @param questionCountBySlug 완료 레슨 slug → selfCheck 문항 수(호출부가
 *   getOrderedLessons에서 조립). 0이거나 항목이 없으면 그 레슨은 후보에서
 *   빠진다.
 */
export function selectReviewQuestions(
  completedDateBySlug: ReadonlyMap<string, string>,
  states: ReadonlyMap<string, ReviewState>,
  todayStr: string,
  questionCountBySlug: ReadonlyMap<string, number>,
): ReviewQuestionRef[] {
  const dueSlugSet = new Set(
    computeDueLessons(completedDateBySlug, states, todayStr).map((d) => d.lessonSlug),
  );

  const weakByLesson = new Map<string, number[]>();
  const dueByLesson = new Map<string, number[]>();
  const restByLesson = new Map<string, number[]>();

  function pushInto(map: Map<string, number[]>, slug: string, index: number) {
    const arr = map.get(slug);
    if (arr) {
      arr.push(index);
    } else {
      map.set(slug, [index]);
    }
  }

  for (const slug of completedDateBySlug.keys()) {
    const count = questionCountBySlug.get(slug) ?? 0;
    if (count <= 0) continue; // 완료+문항 있는 레슨만 후보
    const missedQ = states.get(slug)?.missedQ ?? [];
    for (let i = 0; i < count; i++) {
      if (missedQ.includes(i)) {
        pushInto(weakByLesson, slug, i);
      } else if (dueSlugSet.has(slug)) {
        pushInto(dueByLesson, slug, i);
      } else {
        pushInto(restByLesson, slug, i);
      }
    }
  }

  const seed = hashString(todayStr);
  const weak = roundRobinExpand(weakByLesson, seed);
  const due = roundRobinExpand(dueByLesson, seed + 1);
  const rest = roundRobinExpand(restByLesson, seed + 2);

  return [...weak, ...due, ...rest].slice(0, REVIEW_SESSION_LIMIT);
}
