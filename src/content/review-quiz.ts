// 복습 객관식(review quiz, quick 260906) — 각 "스스로 점검" 문항(주관식 O/△/X) 옆에
// 나란히 붙는 3지선다형 객관식이다. 자가진단(복습)과 능동적 문제풀이를 한 화면에서
// 동시에("병렬") 하도록, review 페이지의 문항 카드가 이 데이터를 조회해 렌더한다.
//
// 키는 `${lessonSlug}#${questionIndex}` — selfCheck 배열 인덱스와 같은 좌표계라
// review.ts의 ReviewQuestionRef(레슨 slug + questionIndex)와 정확히 맞물린다.
// 문항당 정확히 3개. 정답·해설은 레슨 본문에 근거해 작성한다(교육 콘텐츠 정확성).
//
// 현재는 파일럿(1-3-python-variables-and-types) 한 편만 채워져 있다 — 형식·난이도
// 승인 후 나머지 레슨으로 확장한다([[lessons-eli5-pilot-first]] 방식). 없는 문항은
// getReviewQuiz가 빈 배열을 돌려주므로 카드가 객관식 없이 기존 자가진단만 보인다.

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

const REVIEW_QUIZ: Record<string, ReviewQuizQuestion[]> = {
  "1-3-python-variables-and-types#0": [
    {
      q: 'age = "27" 처럼 저장한 뒤 age + 3 을 실행하면 어떻게 될까요?',
      options: ["30 이 출력된다", '"273" 이 출력된다', "TypeError 가 발생한다", '"27" 이 그대로 출력된다'],
      answer: 2,
      explain: "파이썬은 문자열과 숫자를 자동으로 섞지 않아 TypeError 가 납니다. 숫자로 더하려면 int(age) + 3 처럼 형을 바꿔야 해요.",
    },
    {
      q: 'age = "27" 일 때 age 의 자료형은 무엇일까요?',
      options: ["정수(int)", "문자열(str)", "실수(float)", "불리언(bool)"],
      answer: 1,
      explain: "따옴표로 감쌌으니 문자열(str)입니다. 값을 넣는 순간 자료형이 정해지는 동적 타이핑이라, 따옴표 유무가 자료형을 가릅니다.",
    },
    {
      q: '"나이: " 뒤에 숫자 27 을 문자열로 이어 붙이려면 어떻게 해야 할까요?',
      options: [
        '"나이: " + 27 그대로 쓰면 된다',
        '"나이: " + str(27) 또는 f"나이: {27}" 로 쓴다',
        'int("나이: ") + 27 로 쓴다',
        '"나이: " - 27 로 쓴다',
      ],
      answer: 1,
      explain: "숫자를 문자열에 붙이려면 str() 로 바꾸거나 f-string 을 씁니다. 문자열과 숫자는 + 로 바로 못 섞어요.",
    },
  ],
  "1-3-python-variables-and-types#1": [
    {
      q: "1부터 5까지 한 줄씩 출력하려 합니다. i = 1 로 시작할 때 while 조건으로 알맞은 것은?",
      options: ["while i < 5", "while i <= 5", "while i > 5", "while i == 5"],
      answer: 1,
      explain: "5까지 포함해 출력하려면 while i <= 5 입니다. i < 5 면 4까지만 나와요.",
    },
    {
      q: "while 반복문에서 i += 1 (값을 늘리는 줄)을 빠뜨리면 어떻게 될까요?",
      options: ["1만 한 번 출력되고 끝난다", "1부터 5까지 정상 출력된다", "1이 끝없이 출력된다(무한 루프)", "아무것도 출력되지 않는다"],
      answer: 2,
      explain: "조건을 거짓으로 만들 변화(i += 1)가 없으면 i 가 계속 1이라 조건이 항상 참 → 무한 루프가 됩니다.",
    },
    {
      q: "for i in range(1, 6) 과 같은 범위를 도는 while 문의 시작값과 조건으로 알맞은 것은?",
      options: [
        "i = 0 으로 시작, while i < 6",
        "i = 1 로 시작, while i <= 5",
        "i = 1 로 시작, while i < 5",
        "i = 0 으로 시작, while i <= 5",
      ],
      answer: 1,
      explain: "range(1, 6) 은 1,2,3,4,5 입니다. 같은 범위를 while 로 돌리려면 i = 1 에서 시작해 i <= 5 (또는 i < 6)까지 돌려야 해요.",
    },
  ],
};

/** 레슨 slug + 자가진단 문항 인덱스로 객관식 3문항을 찾는다. 없으면 빈 배열. */
export function getReviewQuiz(lessonSlug: string, questionIndex: number): ReviewQuizQuestion[] {
  return REVIEW_QUIZ[`${lessonSlug}#${questionIndex}`] ?? [];
}
