// 복습 객관식(review quiz, quick 260906) — 각 "스스로 점검" 문항(주관식 O/△/X) 옆에
// 나란히 붙는 3지선다형 객관식이다. 자가진단(복습)과 능동적 문제풀이를 한 화면에서
// 동시에("병렬") 하도록, review 페이지의 문항 카드가 이 데이터를 조회해 렌더한다.
//
// 데이터는 review-quiz-data.json에 있다 — 키는 `${lessonSlug}#${questionIndex}`로
// selfCheck 배열 인덱스와 같은 좌표계다(review.ts의 ReviewQuestionRef와 맞물린다).
// 35개 레슨 × 자가진단 2문항 × 객관식 3 = 210문항. 정답·해설은 각 레슨 본문 근거로
// 병렬 저작(파일럿 1-3 승인 후 나머지 34편 확장). 없는 문항은 getReviewQuiz가 빈 배열을
// 돌려주므로 카드가 객관식 없이 기존 자가진단만 보인다.
//
// 데이터 재생성: 레슨 본문에서 문항을 다시 만들면 scratchpad/quiz/<slug>.json을 갱신하고
// assemble-quiz.mjs로 review-quiz-data.json을 다시 뽑는다(검증: 문항당 옵션 3~4·answer
// 범위·KANT 금지어).

import rawData from "./review-quiz-data.json";

export interface ReviewQuizQuestion {
  /** 문두. */
  q: string;
  /** 보기(3~4개). */
  options: string[];
  /** 정답 보기의 인덱스(0부터). */
  answer: number;
  /** 정답 공개 후 보여줄 한 줄 해설. */
  explain: string;
}

const REVIEW_QUIZ = rawData as Record<string, ReviewQuizQuestion[]>;

/** 레슨 slug + 자가진단 문항 인덱스로 객관식 3문항을 찾는다. 없으면 빈 배열. */
export function getReviewQuiz(lessonSlug: string, questionIndex: number): ReviewQuizQuestion[] {
  return REVIEW_QUIZ[`${lessonSlug}#${questionIndex}`] ?? [];
}
