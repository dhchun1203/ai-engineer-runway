// 책으로 읽기(book reader, quick 260904-a1o) — 스텝 하나를 "한 권의 책"으로 보는
// 데이터. print-scopes.ts(레슨을 한 문서로 묶는 선례)와 형제지만, 이쪽은 종이가
// 아니라 화면에서 이동하며 술술 읽는 용도다.
//
// 책 본문은 velite가 빌드 타임에 만든 bookCode(왜 배우나 + 개념 설명 + NextTeaser)를
// 그대로 쓴다 — 여기서는 스텝 메타 + 챕터(레슨) 목록 + 스텝 여는 글 + 총 읽기 시간만
// 조립한다.

import type { Lesson } from '#site/content';
import { steps, type Step, type StepId } from './modules';
import { getOrderedLessons } from './curriculum-helpers';

export interface BookChapter {
  lesson: Lesson;
  /** 책 안에서의 장 번호(1부터) — 커리큘럼 번호가 아니라 읽는 순서다. */
  chapterNumber: number;
}

export interface BookStep {
  step: Step;
  /** 여는 글 — "왜 이 여정을 떠나는지"를 한두 문단으로 세팅한다. */
  opening: string[];
  chapters: BookChapter[];
  /** 대략 읽기 시간(분) 합 — 표지에 "약 N분"으로 찍는다. */
  totalMinutes: number;
}

// 스텝별 여는 글. 레슨 원문을 다시 쓰지 않고, 각 스텝을 하나의 이야기로 여는
// 짧은 도입만 저작한다(한국어 장문 규칙: 2~3문장마다 끊는다). Step 1이 파일럿이라
// 가장 공들여 쓰고, 2·3은 뼈대만 두어 승인 후 심화한다.
const STEP_OPENINGS: Record<StepId, string[]> = {
  1: [
    'AI를 다루기 전에, 먼저 컴퓨터와 대화하는 법부터 익힙니다. 이 책은 낯선 도구 이름을 외우는 여정이 아니라, "왜 이게 필요한가"를 하나씩 납득해 가는 이야기입니다.',
    '값을 상자에 담는 일에서 시작해, 협업하는 법을 배우고, 데이터를 질문으로 꺼내오고, 기계가 스스로 배우는 원리에 다다릅니다. 앞 장이 뒷장의 재료가 되도록 이어지니, 순서대로 읽으면 한 편의 이야기처럼 흘러갑니다.',
  ],
  2: [
    '이제 눈에 보이는 화면을 만들고, 그 뒤에서 데이터를 주고받는 서버를 세우고, 마지막에 LLM을 연결해 "실제로 동작하는" AI 서비스를 짓습니다.',
    '이 책은 프론트엔드에서 백엔드로, 다시 프롬프트로 흐르는 한 줄기 제작기입니다.',
  ],
  3: [
    '직접 만든 AI에게 "내 문서"를 읽히고, 여러 에이전트가 협업하게 하고, 운영까지 책임지는 단계입니다.',
    '이 책은 똑똑한 프로토타입을 실무에서 버티는 시스템으로 키워 가는 이야기입니다.',
  ],
};

/** 전역 정렬(Step → 모듈 → 레슨)을 물려받은, 콘텐츠 있는 레슨만 — bookCode가 있는 것. */
function chaptersForStep(stepId: StepId): BookChapter[] {
  return getOrderedLessons()
    .filter((lesson) => lesson.stepId === stepId && lesson.hasContent && lesson.bookCode)
    .map((lesson, index) => ({ lesson, chapterNumber: index + 1 }));
}

export function getBookStep(stepId: StepId): BookStep | undefined {
  const step = steps.find((s) => s.id === stepId);
  if (!step) return undefined;
  const chapters = chaptersForStep(stepId);
  if (chapters.length === 0) return undefined;
  return {
    step,
    opening: STEP_OPENINGS[stepId],
    chapters,
    totalMinutes: chapters.reduce((sum, c) => sum + (c.lesson.bookMinutes ?? 0), 0),
  };
}

/** 책이 만들어지는 스텝(콘텐츠 있는 레슨이 하나라도 있는 스텝)만. */
export function getBookSteps(): BookStep[] {
  return steps
    .map((s) => getBookStep(s.id))
    .filter((b): b is BookStep => b !== undefined);
}
