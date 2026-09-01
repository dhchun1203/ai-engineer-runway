// 매니페스트 조회 · 전역 정렬 · 인접 레슨 계산 헬퍼.
// #site/content(Velite 빌드 산출물)의 lessons를 modules.ts의 Step/Module과 조인한다.

import { lessons, type Lesson } from '#site/content';
import { modules, steps, type Module, type Step, type StepId } from './modules';

function findModule(moduleId: string): Module {
  const found = modules.find((m) => m.id === moduleId);
  if (!found) {
    // 고아 레슨(모듈을 찾지 못함)은 조용히 건너뛰지 않고 빌드를 실패시킨다.
    throw new Error(
      `curriculum-helpers: lesson references unknown moduleId "${moduleId}" — no matching entry in src/content/modules.ts`,
    );
  }
  return found;
}

/** 전역 정렬 키: (stepId, 모듈 order, 레슨 order) 3단 — 값 조합이 유일해 동률이 없다. */
function sortKey(lesson: Lesson): [number, number, number] {
  const mod = findModule(lesson.moduleId);
  return [lesson.stepId, mod.order, lesson.order];
}

function compareLessons(a: Lesson, b: Lesson): number {
  const [as, am, al] = sortKey(a);
  const [bs, bm, bl] = sortKey(b);
  if (as !== bs) return as - bs;
  if (am !== bm) return am - bm;
  return al - bl;
}

export function getStep(stepId: StepId): Step | undefined {
  return steps.find((s) => s.id === stepId);
}

export function getModulesByStep(stepId: StepId): Module[] {
  return modules.filter((m) => m.stepId === stepId).sort((a, b) => a.order - b.order);
}

export function getLessonsByModule(moduleId: string): Lesson[] {
  return lessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order);
}

export function getOrderedLessons(): Lesson[] {
  return [...lessons].sort(compareLessons);
}

export function getLessonBySlug(slug: string): Lesson | undefined {
  return lessons.find((l) => l.slug === slug);
}

export function getAdjacentLessons(slug: string): { prev: Lesson | null; next: Lesson | null } {
  const ordered = getOrderedLessons();
  const index = ordered.findIndex((l) => l.slug === slug);
  if (index === -1) {
    return { prev: null, next: null };
  }
  return {
    prev: index > 0 ? ordered[index - 1] : null,
    next: index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}

export function getLessonCounts(stepId?: StepId): { total: number; withContent: number } {
  const scoped = stepId === undefined ? lessons : lessons.filter((l) => l.stepId === stepId);
  return {
    total: scoped.length,
    withContent: scoped.filter((l) => l.hasContent).length,
  };
}

// ── /glossary (round2-j) ────────────────────────────────────────────────
// 용어 하나가 여러 레슨에서 다르게 정의될 수 있다(다의어: 회귀 — ML vs 버그,
// 상태 — React vs 에이전트). word 완전일치로만 그룹핑하고, 정의는 병합·중복
// 제거하지 않고 배열로 모두 보존한다 — 그룹 표시 자체가 학습 가치다
// (round2-j 함정 b).

export type TermSource = {
  lessonSlug: string;
  lessonTitle: string;
  moduleId: string;
  /** 레슨 permalink 최상단. 6장 용어 표에는 앵커가 없어(rehype-slug 미부여
   * 대상) 직행 링크가 아니라 레슨 최상단으로만 향한다(round2-j 함정 a). */
  permalink: string;
};

export type TermDefinition = {
  definition: string;
  source: TermSource;
};

export type TermGroup = {
  word: string;
  /** 커리큘럼 순서(getOrderedLessons) 그대로 — 병합·중복제거 없음. */
  definitions: TermDefinition[];
};

export type GlossarySection = {
  /** 초성(ㄱ..ㅎ, 그 외는 '기타') 또는 대문자 알파벳(A..Z) 버킷 라벨. */
  bucket: string;
  groups: TermGroup[];
};

export type Glossary = {
  korean: GlossarySection[];
  latin: GlossarySection[];
  totalGroups: number;
  totalTerms: number;
};

const KOREAN_INITIALS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
] as const;
const KOREAN_OTHER_BUCKET = '기타';

/** 완성형 한글 음절(가~힣)의 초성을 반환한다. 한글이 아니면 null. */
function initialConsonant(word: string): string | null {
  const code = word.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null;
  const index = Math.floor((code - 0xac00) / 588);
  return KOREAN_INITIALS[index];
}

export function getAllTerms(): Glossary {
  const orderedLessons = getOrderedLessons();

  // 1) word 완전일치 그룹핑 — 커리큘럼 순회 순서를 그대로 유지한다.
  const groupsByWord = new Map<string, TermGroup>();
  for (const lesson of orderedLessons) {
    for (const term of lesson.terms) {
      let group = groupsByWord.get(term.word);
      if (!group) {
        group = { word: term.word, definitions: [] };
        groupsByWord.set(term.word, group);
      }
      group.definitions.push({
        definition: term.definition,
        source: {
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title,
          moduleId: lesson.moduleId,
          permalink: lesson.permalink,
        },
      });
    }
  }
  const allGroups = [...groupsByWord.values()];

  // 2) 섹션 분리 — 라틴 시작(A-Za-z)은 latin(A-Z 버킷), 한글 음절은 korean
  //    (초성 버킷), 그 외(숫자·기호 시작)는 korean의 '기타' 버킷.
  const koreanBuckets = new Map<string, TermGroup[]>();
  const latinBuckets = new Map<string, TermGroup[]>();

  for (const group of allGroups) {
    const first = group.word.charAt(0);
    if (/[A-Za-z]/.test(first)) {
      const bucket = first.toUpperCase();
      const list = latinBuckets.get(bucket) ?? [];
      list.push(group);
      latinBuckets.set(bucket, list);
    } else {
      const bucket = initialConsonant(group.word) ?? KOREAN_OTHER_BUCKET;
      const list = koreanBuckets.get(bucket) ?? [];
      list.push(group);
      koreanBuckets.set(bucket, list);
    }
  }

  // 3) 정렬 — 한글은 localeCompare('ko'), 라틴은 대소문자 무시 비교.
  function sortKorean(groups: TermGroup[]): TermGroup[] {
    return [...groups].sort((a, b) => a.word.localeCompare(b.word, 'ko'));
  }
  function sortLatin(groups: TermGroup[]): TermGroup[] {
    return [...groups].sort((a, b) => a.word.localeCompare(b.word, undefined, { sensitivity: 'base' }));
  }

  const koreanBucketOrder: readonly string[] = [...KOREAN_INITIALS, KOREAN_OTHER_BUCKET];
  const korean: GlossarySection[] = koreanBucketOrder
    .filter((bucket) => koreanBuckets.has(bucket))
    .map((bucket) => ({ bucket, groups: sortKorean(koreanBuckets.get(bucket)!) }));

  const latinBucketOrder = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  const latin: GlossarySection[] = latinBucketOrder
    .filter((bucket) => latinBuckets.has(bucket))
    .map((bucket) => ({ bucket, groups: sortLatin(latinBuckets.get(bucket)!) }));

  return {
    korean,
    latin,
    totalGroups: allGroups.length,
    totalTerms: allGroups.reduce((sum, g) => sum + g.definitions.length, 0),
  };
}
