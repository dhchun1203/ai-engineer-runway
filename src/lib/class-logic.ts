// 수업 복습 순수 계산 — 의존성 0 순수 모듈(review.ts와 같은 원칙: import 문 없이,
// scripts/check-class.mjs가 이 파일을 그대로 로드해 검증한다).
// 설계: docs/superpowers/specs/2026-10-27-class-data-structure-design.md
//
// 날짜는 모두 서울 날짜 문자열(YYYY-MM-DD)이고, 로컬 타임존 getter 없이 Date.UTC로만 센다.

function parseDay(dateISO: string): number {
  const [y, m, d] = dateISO.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function formatDay(t: number): string {
  const date = new Date(t);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${mm}-${dd}`;
}

const DAY_MS = 86_400_000;

/** 요일 번호. 월요일 0 ~ 일요일 6(달력과 주 범위가 월요일에서 시작한다). */
export function weekdayIndex(dateISO: string): number {
  return (new Date(parseDay(dateISO)).getUTCDay() + 6) % 7;
}

/** todayStr가 속한 주(월~일)에서 offsetWeeks만큼 옮긴 주의 첫날과 끝날. */
export function seoulWeekRange(todayStr: string, offsetWeeks: number): { start: string; end: string } {
  const monday = parseDay(todayStr) - weekdayIndex(todayStr) * DAY_MS + offsetWeeks * 7 * DAY_MS;
  return { start: formatDay(monday), end: formatDay(monday + 6 * DAY_MS) };
}

/** 퀴즈 문항 하나를 가리키는 참조(회차 slug + 문항 id). */
export type QuizRef = { slug: string; id: string };

/** 문항의 지난 풀이 결과. 기록이 없으면 안 푼 문항이다. */
export type AttemptState = 'wrong' | 'right';

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: readonly T[], seed: number): T[] {
  const result = [...arr];
  const rng = mulberry32(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 종합 퀴즈와 간격 복습에 낼 문항을 고른다. 지난번에 틀린 문항 → 안 푼 문항 → 맞힌 문항
 * 순서로 세우고, 묶음 안은 seedStr(보통 오늘 날짜)로 섞는다. 같은 날 다시 열면 같은 문항이 나온다.
 *
 * @param attemptByKey 오답 키(cl:<slug>:<id>) → 지난 풀이 결과
 */
export function pickQuizRefs(
  refs: readonly QuizRef[],
  attemptByKey: ReadonlyMap<string, AttemptState>,
  seedStr: string,
  limit: number,
): QuizRef[] {
  const wrong: QuizRef[] = [];
  const unsolved: QuizRef[] = [];
  const right: QuizRef[] = [];
  for (const ref of refs) {
    const state = attemptByKey.get(`cl:${ref.slug}:${ref.id}`);
    if (state === 'wrong') wrong.push(ref);
    else if (state === 'right') right.push(ref);
    else unsolved.push(ref);
  }
  const seed = hashString(seedStr);
  return [...shuffle(wrong, seed), ...shuffle(unsolved, seed + 1), ...shuffle(right, seed + 2)].slice(0, limit);
}

/** 검색어를 공백으로 나눈 낱말이 글 안에 모두 있으면 true(대소문자 무시). 빈 검색어는 통과. */
export function matchesQuery(text: string, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = text.toLowerCase();
  return words.every((word) => haystack.includes(word));
}

export type CalendarCell = { date: string; inMonth: boolean };

/** 한 달 달력. 월요일에서 시작하는 주 단위 행이고, 앞뒤 달 날짜는 inMonth=false로 채운다. */
export function monthGrid(year: number, month: number): CalendarCell[][] {
  const first = formatDay(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = formatDay(Date.UTC(year, month - 1, lastDay));
  let t = parseDay(first) - weekdayIndex(first) * DAY_MS;
  const end = parseDay(last) + (6 - weekdayIndex(last)) * DAY_MS;
  const weeks: CalendarCell[][] = [];
  while (t <= end) {
    const week: CalendarCell[] = [];
    for (let i = 0; i < 7; i++) {
      const date = formatDay(t);
      week.push({ date, inMonth: new Date(t).getUTCMonth() === month - 1 });
      t += DAY_MS;
    }
    weeks.push(week);
  }
  return weeks;
}

/** 수업 회차의 간격 복습 상태를 lesson_review 표에 둘 때 쓰는 lesson_id. 정규 레슨 slug와
 *  겹치지 않게 접두사를 붙인다(정규 레슨 화면은 getLessonBySlug로 이 행을 걸러 낸다). */
export function classReviewId(slug: string): string {
  return `class:${slug}`;
}
