// 오답 노트 키 — 어떤 퀴즈의 몇 번 문항인지를 글자 하나로 적는다. 클라이언트(퀴즈
// 컴포넌트가 키를 만든다)와 서버(키를 실제 문항으로 푼다)가 함께 쓰므로 데이터 import 없이
// 순수 함수만 둔다. 실제 문항으로 푸는 일은 quiz-mistake-resolve.ts(서버 전용)가 한다.
//
//   bc:<STEP id>:<문항 번호>                  베이스캠프 복습 퀴즈 (basecamp-review.ts)
//   rv:<레슨 slug>:<자가진단 번호>:<문항 번호>  /review 레슨 객관식 (review-quiz-data.json)
//   cl:<수업 레슨 slug>:<문항 번호>            수업 복습 확인 퀴즈 (class-sessions.ts)
//
// 문항 번호는 데이터 원본 배열의 순서다(화면에서 보기를 섞어도 문항 번호는 그대로).

export const QUIZ_KEY_MAX_LENGTH = 300;

export function basecampQuizKey(stepId: string, index: number): string {
  return `bc:${stepId}:${index}`;
}

export function reviewQuizKey(lessonSlug: string, questionIndex: number, index: number): string {
  return `rv:${lessonSlug}:${questionIndex}:${index}`;
}

export function classQuizKey(lessonSlug: string, index: number): string {
  return `cl:${lessonSlug}:${index}`;
}

export type ParsedQuizKey =
  | { source: "basecamp"; stepId: string; index: number }
  | { source: "review"; lessonSlug: string; questionIndex: number; index: number }
  | { source: "class"; lessonSlug: string; index: number };

const INDEX = /^\d{1,3}$/;

export function parseQuizKey(key: string): ParsedQuizKey | null {
  if (typeof key !== "string" || key.length > QUIZ_KEY_MAX_LENGTH) return null;
  const parts = key.split(":");
  if (parts[0] === "bc" && parts.length === 3 && parts[1] && INDEX.test(parts[2])) {
    return { source: "basecamp", stepId: parts[1], index: Number(parts[2]) };
  }
  if (parts[0] === "rv" && parts.length === 4 && parts[1] && INDEX.test(parts[2]) && INDEX.test(parts[3])) {
    return { source: "review", lessonSlug: parts[1], questionIndex: Number(parts[2]), index: Number(parts[3]) };
  }
  if (parts[0] === "cl" && parts.length === 3 && parts[1] && INDEX.test(parts[2])) {
    return { source: "class", lessonSlug: parts[1], index: Number(parts[2]) };
  }
  return null;
}

/** 오답 노트에서 빠지려면 연속으로 맞혀야 하는 횟수. */
export const MISTAKE_CLEAR_STREAK = 2;
