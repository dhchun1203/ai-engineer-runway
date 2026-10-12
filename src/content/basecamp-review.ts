// 베이스캠프 복습 데이터 — /basecamp/review(복습 카드)와 /basecamp/quiz(복습 퀴즈)가
// 함께 쓴다(2026-10-12 사용자 요청). STEP마다 "할 수 있게 된 것, 핵심 문법, 자주 하는
// 실수, 최종 과제 흐름, 다시 볼 레슨"과 퀴즈 8문항을 한곳에 둔다.
//
// 원칙
// - 공식 과제의 정답을 싣지 않는다. 과제 흐름은 무엇을 하는지만 적고, 코드는 뼈대까지.
// - 퀴즈의 코드 문항은 출력과 에러를 실제로 실행해 확인한 값만 쓴다(pandas 3.0 venv).
// - 진도와 무관하다. 채점은 화면에서만 하고 저장하지 않는다(복습 퀴즈와 같은 철학).
// - 교육기관명은 어디에도 쓰지 않는다.

export type BasecampReviewPoint = {
  /** 무엇에 대한 것인지(짧게) */
  label: string;
  /** 한두 줄 코드(있으면) */
  code?: string;
  /** 우리 말 설명 */
  note: string;
};

export type BasecampReviewPitfall = {
  mistake: string;
  symptom: string;
  fix: string;
};

export type BasecampQuizQuestion = {
  /** 문두 */
  q: string;
  /** 문두 아래 보여 줄 코드(있으면) */
  code?: string;
  /** 보기 4개 */
  options: string[];
  /** 정답 보기 인덱스(0부터) */
  answer: number;
  /** 정답 공개 후 보여 줄 해설 */
  explain: string;
};

export type BasecampReviewStep = {
  /** 앵커와 키로 쓰는 id (#step1 등) */
  id: string;
  /** 칩에 쓰는 짧은 이름 */
  label: string;
  title: string;
  /** 전체 줄기에서 이 STEP이 맡은 한 줄 */
  oneLine: string;
  /** 이 STEP을 마치면 할 수 있는 것 */
  canDo: string[];
  keyPoints: BasecampReviewPoint[];
  pitfalls: BasecampReviewPitfall[];
  /** 최종 과제를 다시 풀 때의 흐름(정답 아님) */
  assignmentFlow: string[];
  /** 흐름을 코드 뼈대로 보여 줄 때(있으면). 빈칸은 ...로 둔다 */
  assignmentSkeleton?: string;
  lessons: { label: string; href: string }[];
  quiz: BasecampQuizQuestion[];
};

export const basecampReviewSteps: readonly BasecampReviewStep[] = [
  {
    id: "step1",
    label: "STEP 1",
    title: "Python 첫걸음",
    oneLine: "값을 담는 그릇(변수, 리스트, 튜플)을 익혔어요.",
    canDo: [
      "Colab에서 코드를 실행하고, print로 결과를 확인할 수 있다",
      "변수에 값을 담고, 정수, 실수, 문자열, 불리언을 구분할 수 있다",
      "리스트를 만들고 꺼내고(인덱스), 잘라 오고(슬라이싱), 정렬하고, 합계와 평균을 낼 수 있다",
      "바뀌면 안 되는 값은 튜플로 담고, 고쳐야 하면 리스트로 바꿨다 되돌릴 수 있다",
      "리스트 안에 튜플을 담은 학생 명부에서 원하는 값을 꺼낼 수 있다",
    ],
    keyPoints: [
      {
        label: "변수와 자료형",
        code: 'age = 25\nname = "지현"\nprint(f"{name}은 {age}살")',
        note: "값을 넣는 순간 자료형이 정해져요. 글자와 숫자는 +로 섞을 수 없으니 f-string으로 조합해요.",
      },
      {
        label: "input은 늘 글자",
        code: 'age = int(input("나이: "))',
        note: "input으로 받은 값은 숫자처럼 보여도 문자열이에요. 계산하려면 int()나 float()로 바꿔요.",
      },
      {
        label: "인덱스와 슬라이싱",
        code: "nums = [10, 20, 30, 40, 50]\nnums[0], nums[-1], nums[1:3], nums[::-1]",
        note: "번호는 0부터, -1은 마지막이에요. 슬라이싱의 끝 번호는 포함하지 않아요.",
      },
      {
        label: "리스트 다루기",
        code: "scores.append(95)\nscores.sort(reverse=True)\nsum(scores) / len(scores)",
        note: "append는 맨 뒤에 추가, sort는 정렬(reverse=True면 큰 것부터), 평균은 sum ÷ len이에요.",
      },
      {
        label: "튜플",
        code: 'student = ("2026001", "김민준", 2010)\nstudent.count(...), student.index(...)\nedited = list(student)',
        note: "만든 뒤 못 바꾸는 목록이에요. 고치려면 list()로 풀었다가 tuple()로 다시 묶어요.",
      },
      {
        label: "빈 값과 결측값",
        code: "score = None\nscore is None",
        note: "None은 값이 아직 없다는 뜻이에요. 표 데이터의 빠진 칸은 NaN으로 보여요.",
      },
    ],
    pitfalls: [
      { mistake: '"나이: " + 25', symptom: "TypeError", fix: 'f"나이: {25}" 또는 str(25)로 바꿔 잇기' },
      { mistake: "input 값을 그대로 계산", symptom: "TypeError 또는 글자 이어 붙이기", fix: "int(input(...))로 바꿔 받기" },
      { mistake: "nums[1:3]에 3번 자리까지 들어온다고 생각", symptom: "값 하나가 빠져 보임", fix: "끝 번호는 포함하지 않는다고 기억하기" },
      { mistake: "튜플의 값을 바로 고치기", symptom: "TypeError", fix: "list()로 바꿔 고친 뒤 tuple()로 되돌리기" },
      { mistake: "문자열에 따옴표 빼먹기 name = 지현", symptom: "NameError", fix: '글자는 항상 "따옴표"로 감싸기' },
    ],
    assignmentFlow: [
      "변수에 자기소개 정보를 담고 f-string으로 한 줄로 출력하기",
      "점수 리스트를 만들어 추가, 꺼내기, 슬라이싱, 정렬하고 합계와 평균 구하기",
      "바뀌면 안 되는 정보를 튜플로 담고 count, index 써 보기, 고칠 때는 리스트로 바꿨다 되돌리기",
      "(이름, 점수) 튜플을 담은 학생 명부 리스트에서 원하는 학생과 값 꺼내기",
      "Colab 공유 링크를 '링크가 있는 모든 사용자, 뷰어'로 바꿔 제출하기",
    ],
    lessons: [
      { label: "개발 환경 세팅", href: "/lesson/1-1-dev-environment-setup" },
      { label: "변수와 자료형", href: "/lesson/1-3-python-variables-and-types" },
      { label: "리스트, 튜플, 딕셔너리", href: "/lesson/1-3-python-lists-tuples-dicts" },
    ],
    quiz: [
      {
        q: "출력은 무엇일까요?",
        code: "nums = [10, 20, 30, 40, 50]\nprint(nums[1:3])",
        options: ["[10, 20, 30]", "[20, 30]", "[20, 30, 40]", "[30, 40]"],
        answer: 1,
        explain: "인덱스 1(20)부터 3 바로 앞(30)까지예요. 슬라이싱의 끝 번호는 포함하지 않아요.",
      },
      {
        q: "출력은 무엇일까요?",
        code: "scores = [78, 92, 85]\nscores.append(95)\nprint(len(scores), scores[-1])",
        options: ["3 85", "4 78", "4 95", "3 95"],
        answer: 2,
        explain: "append가 맨 뒤에 95를 붙여 길이가 4가 되고, -1은 마지막 값인 95를 가리켜요.",
      },
      {
        q: '사용자가 20을 입력했어요. 이 코드는 어떻게 될까요?',
        code: 'age = input("나이: ")\nprint(age + 1)',
        options: ["21이 출력된다", "201이 출력된다", "TypeError가 난다", "20이 출력된다"],
        answer: 2,
        explain: 'input이 돌려준 값은 글자 "20"이라 숫자 1과 더할 수 없어요. int(input(...))로 받아야 해요.',
      },
      {
        q: "이 코드는 어떻게 될까요?",
        code: 'student = ("2026001", "김민준", 2010)\nstudent[1] = "이서연"',
        options: ["이름이 이서연으로 바뀐다", "TypeError가 난다", "튜플 끝에 이서연이 추가된다", "IndexError가 난다"],
        answer: 1,
        explain: "튜플은 만든 뒤 값을 바꿀 수 없어요. 고치려면 list()로 바꿔 고친 뒤 tuple()로 되돌려요.",
      },
      {
        q: "출력은 무엇일까요?",
        code: "nums = (1, 3, 5, 3, 7, 3)\nprint(nums.count(3), nums.index(3))",
        options: ["3 1", "3 3", "1 3", "3 5"],
        answer: 0,
        explain: "3은 세 번 나오고(count), 처음 나온 자리는 인덱스 1이에요(index).",
      },
      {
        q: "출력은 무엇일까요?",
        code: 'print("1" == 1, 1 == 1.0)',
        options: ["True True", "False False", "True False", "False True"],
        answer: 3,
        explain: "글자 \"1\"과 숫자 1은 다른 값이라 False, 정수와 실수는 값이 같으면 True예요.",
      },
      {
        q: "출력은 무엇일까요?",
        code: "scores = [85, 92, 78]\nscores.sort(reverse=True)\nprint(scores)",
        options: ["[78, 85, 92]", "[85, 92, 78]", "[92, 85, 78]", "[78, 92, 85]"],
        answer: 2,
        explain: "reverse=True는 큰 값부터 정렬해요. sort는 리스트 자체를 바꿔요.",
      },
      {
        q: "출력은 무엇일까요?",
        code: 'roster = [("김민준", 92), ("이서연", 85), ("박지훈", 78)]\nprint(roster[1][0], roster[-1][1])',
        options: ["김민준 92", "이서연 78", "이서연 85", "박지훈 78"],
        answer: 1,
        explain: "roster[1]은 두 번째 튜플 (\"이서연\", 85)이고 그 [0]은 이름이에요. roster[-1]은 마지막 튜플이고 그 [1]은 점수 78이에요.",
      },
    ],
  },
  {
    id: "ai-literacy",
    label: "AI 리터러시",
    title: "AI Literacy & 프롬프트 엔지니어링",
    oneLine: "AI에게 원하는 것을 정확히 시키고 결과를 의심하는 법을 익혔어요.",
    canDo: [
      "규칙 기반 AI와 학습 기반 AI, 분류 AI와 생성 AI를 구분할 수 있다",
      "좋은 프롬프트의 6가지 구성 요소를 갖춰 요청을 쓸 수 있다",
      "막연한 프롬프트와 구조화된 프롬프트의 결과를 비교할 수 있다",
      "AI 결과를 그대로 믿지 않고 검증하고, 행동으로 잇는 관점을 설명할 수 있다",
    ],
    keyPoints: [
      {
        label: "규칙 기반 vs 학습 기반",
        note: "사람이 규칙을 하나하나 적은 AI는 적어 둔 상황에만 강하고, 데이터에서 패턴을 익힌 AI는 처음 보는 상황에도 유연해요.",
      },
      {
        label: "분류 AI vs 생성 AI",
        note: "분류는 정해진 갈래로 나누거나 값을 예측하고(스팸 판별), 생성은 글, 코드, 이미지를 새로 만들어요(ChatGPT).",
      },
      {
        label: "프롬프트 6요소",
        note: "Instruction(할 일), Input(쓸 데이터), Context(배경), Role(역할), Output Format(형태), Constraint(제한).",
      },
      {
        label: "구조화된 프롬프트",
        code: "Role: ...\nGoal: ...\nContext: ...\nConstraint: ...\nOutput: ...",
        note: "항목별로 나눠 적으면 AI가 추측할 부분이 줄어서 원하는 결과에 가까워져요.",
      },
      {
        label: "5가지 관점",
        note: "무엇을 바꿀지 먼저 정하고, 지표를 정확히 정의하고, 결과를 검증하고, 행동으로 잇고, 포트폴리오에는 흐름을 보여 줘요.",
      },
    ],
    pitfalls: [
      { mistake: "'~ 써줘' 한 줄로만 요청", symptom: "누구에게나 맞는 일반적인 답", fix: "목적, 대상, 조건, 형식을 함께 적기" },
      { mistake: "형식을 지정하지 않음", symptom: "길고 정리 안 된 답", fix: "Output Format에 표, 목록, 글자 수를 적기" },
      { mistake: "AI 답을 그대로 사용", symptom: "그럴듯하지만 틀린 수치나 사실", fix: "원자료와 출처로 다시 확인하기" },
      { mistake: "도구부터 고르기", symptom: "결과물은 있는데 바뀌는 게 없음", fix: "누구의 어떤 결정을 바꿀지부터 정하기" },
    ],
    assignmentFlow: [
      "실제로 쓸 상황 하나를 정하기(학습 계획, 자기소개서 등)",
      "단순 프롬프트로 한 번 요청하고 결과 저장하기",
      "6요소를 갖춘 구조화 프롬프트로 다시 요청하기",
      "두 결과를 나란히 놓고 무엇이 달라졌는지 적기",
      "활동지에 나만의 프롬프트를 정리해 제출하기",
    ],
    lessons: [{ label: "AI 리터러시 & 프롬프트 기초", href: "/basecamp/ai-literacy-prompt" }],
    quiz: [
      {
        q: '프롬프트에 "500자 이내, 3가지만 제안"이라고 적었어요. 6요소 중 무엇에 해당할까요?',
        options: ["Role", "Context", "Constraint", "Input"],
        answer: 2,
        explain: "결과물의 길이와 개수를 제한하는 조건이니 Constraint예요.",
      },
      {
        q: '"당신은 10년 차 PM입니다"라는 문장은 6요소 중 무엇일까요?',
        options: ["Role", "Instruction", "Output Format", "Constraint"],
        answer: 0,
        explain: "AI가 어떤 입장에서 답할지 정해 주는 역할(Role)이에요.",
      },
      {
        q: "수많은 메일 예시에서 패턴을 익혀, 처음 보는 스팸도 걸러 내는 필터는 어떤 AI일까요?",
        options: ["규칙 기반 AI", "학습 기반 AI", "생성 AI", "검색 엔진"],
        answer: 1,
        explain: "사람이 규칙을 적은 게 아니라 데이터에서 패턴을 익혔으니 학습 기반이에요. 하는 일로 보면 분류 AI이기도 해요.",
      },
      {
        q: '"이 사진은 고양이일까 강아지일까"를 판단하는 AI는 하는 일로 보면 어느 쪽일까요?',
        options: ["생성 AI", "규칙 기반 AI", "LLM", "분류 AI"],
        answer: 3,
        explain: "입력을 정해진 갈래로 나누는 일이라 분류 AI예요.",
      },
      {
        q: "AI가 그럴듯한 시장 규모 숫자를 답했어요. 5가지 관점에 맞는 다음 행동은 무엇일까요?",
        options: [
          "숫자가 구체적이니 그대로 보고서에 쓴다",
          "같은 질문을 다시 해서 같은 숫자가 나오면 믿는다",
          "원자료나 출처로 숫자를 다시 확인한다",
          "더 큰 모델에게 물어본다",
        ],
        answer: 2,
        explain: "그럴듯함과 맞음은 달라요. AI 결과는 원자료로 다시 검증하는 게 관점 3이에요.",
      },
      {
        q: '"자기소개서 작성해줘"라는 프롬프트에서 가장 크게 빠진 것은 무엇일까요?',
        options: ["맞춤법", "목적, 대상, 조건 같은 맥락", "영어 번역", "AI 모델 이름"],
        answer: 1,
        explain: "어디에 낼지, 무엇을 강조할지, 분량은 얼마인지 몰라서 AI가 일반적인 글을 써요.",
      },
      {
        q: '"결과를 Markdown 표로 정리해줘"는 6요소 중 무엇일까요?',
        options: ["Output Format", "Context", "Input", "Role"],
        answer: 0,
        explain: "결과물의 형태를 정하는 Output Format이에요.",
      },
      {
        q: "5가지 관점에 따르면, AI 프로젝트에서 도구를 고르기 전에 먼저 정할 것은 무엇일까요?",
        options: [
          "가장 성능 좋은 모델",
          "누구의 어떤 결정이나 행동을 바꿀지",
          "사용할 프로그래밍 언어",
          "프롬프트 길이",
        ],
        answer: 1,
        explain: "'무슨 도구를 쓸까'보다 '무엇을 바꿀까'가 먼저예요. 관점 1이에요.",
      },
    ],
  },
  {
    id: "step2",
    label: "STEP 2",
    title: "Python 문법 확장",
    oneLine: "그릇에 이름표(딕셔너리)를 달고, 판단(조건문), 반복(반복문), 묶음(함수)으로 일을 시켰어요.",
    canDo: [
      "딕셔너리로 이름표가 붙은 값을 저장하고, 꺼내고, 바꾸고, 지울 수 있다",
      "없을 수도 있는 키를 get이나 in으로 안전하게 다룰 수 있다",
      "if, elif, else로 갈라지고 for, while로 되풀이하는 흐름을 짤 수 있다",
      "def로 함수를 만들고, 매개변수로 받고 return으로 돌려줄 수 있다",
      "리스트 안의 딕셔너리를 반복문과 조건문, 함수로 처리할 수 있다",
    ],
    keyPoints: [
      {
        label: "딕셔너리 기본",
        code: 'student = {"이름": "김민수", "나이": 20}\nstudent["점수"] = 88\ndel student["나이"]',
        note: "없는 키에 넣으면 추가, 있는 키에 넣으면 덮어쓰기예요.",
      },
      {
        label: "안전하게 꺼내기",
        code: 'menu.get("녹차", 0)\nif "녹차" in menu: ...',
        note: "대괄호로 없는 키를 찾으면 KeyError예요. get은 없을 때 None이나 정해 둔 기본값을 줘요.",
      },
      {
        label: "전체 훑기",
        code: "for key, value in student.items():\n    print(key, value)",
        note: "keys는 키만, values는 값만, items는 키와 값을 짝으로 줘요.",
      },
      {
        label: "조건문",
        code: 'if score >= 90:\n    ...\nelif score >= 80:\n    ...\nelse:\n    ...',
        note: "위에서부터 검사해서 처음 참인 하나만 실행해요. 들여쓰기가 곧 블록이에요.",
      },
      {
        label: "반복문",
        code: "for i in range(1, 6): ...\nwhile count > 0:\n    count = count - 1",
        note: "for는 정해진 만큼, while은 조건이 참인 동안 돌아요. while은 조건에 쓰인 값을 꼭 바꿔야 해요.",
      },
      {
        label: "함수",
        code: 'def greet(name, greeting="안녕하세요"):\n    return greeting + " " + name',
        note: "return이 있어야 결과를 돌려받아요. 기본값이 있는 매개변수는 생략할 수 있어요.",
      },
    ],
    pitfalls: [
      { mistake: "없는 키를 대괄호로 꺼내기", symptom: "KeyError", fix: "get(키, 기본값)이나 in으로 먼저 확인" },
      { mistake: "조건에서 = 와 == 혼동", symptom: "SyntaxError", fix: "비교는 항상 ==" },
      { mistake: "들여쓰기 칸 수가 섞임", symptom: "IndentationError 또는 엉뚱한 동작", fix: "블록마다 공백 4칸으로 맞추기" },
      { mistake: "while 안에서 조건 값을 안 바꿈", symptom: "무한 반복", fix: "반복마다 조건에 쓰인 값 갱신" },
      { mistake: "함수에서 print만 하고 return 안 함", symptom: "받은 값이 None", fix: "결과는 return으로 돌려주기" },
    ],
    assignmentFlow: [
      "문제를 읽고 데이터를 딕셔너리 또는 리스트 안의 딕셔너리로 담기",
      "반복문으로 하나씩 보며 조건문으로 판단하는 부분 짜기",
      "반복되는 계산은 함수로 묶고 작은 값으로 먼저 시험하기",
      "기본과 심화 중 하나를 골라 끝까지 완성하기(심화는 보강 레슨 5편 참고)",
      "Colab 공유 링크로 제출하기",
    ],
    lessons: [
      { label: "딕셔너리 알아보기", href: "/basecamp/python-dictionaries" },
      { label: "조건문과 반복문", href: "/basecamp/python-conditionals-loops" },
      { label: "함수 이해하기", href: "/basecamp/python-functions" },
      { label: "심화: 중첩 딕셔너리", href: "/basecamp/python-nested-dictionaries" },
      { label: "심화: 조건문 심화", href: "/basecamp/python-advanced-conditionals" },
      { label: "심화: 반복문 알고리즘", href: "/basecamp/python-loop-algorithms" },
      { label: "심화: 함수 심화", href: "/basecamp/python-advanced-functions" },
      { label: "심화: 작은 시스템", href: "/basecamp/python-mini-system" },
    ],
    quiz: [
      {
        q: "출력은 무엇일까요?",
        code: 'student = {"이름": "김민수", "나이": 20}\nstudent["나이"] = 21\nstudent["점수"] = 88\nprint(len(student), student["나이"])',
        options: ["2 21", "3 20", "4 21", "3 21"],
        answer: 3,
        explain: "나이는 이미 있는 키라 21로 덮어쓰고, 점수는 새로 추가돼서 키가 3개예요.",
      },
      {
        q: "출력은 무엇일까요?",
        code: 'menu = {"아메리카노": 4500, "라떼": 5000}\nprint(menu.get("녹차", 0))',
        options: ["0", "None", "KeyError", "녹차"],
        answer: 0,
        explain: "get은 키가 없으면 두 번째로 준 기본값 0을 돌려줘요.",
      },
      {
        q: "이 코드는 어떻게 될까요?",
        code: 'menu = {"아메리카노": 4500, "라떼": 5000}\nprint(menu["녹차"])',
        options: ["0이 출력된다", "None이 출력된다", "KeyError가 난다", "빈 줄이 출력된다"],
        answer: 2,
        explain: "대괄호로 없는 키를 찾으면 KeyError로 멈춰요. 없을 수 있는 키는 get으로 꺼내요.",
      },
      {
        q: "출력은 무엇일까요?",
        code: 'score = 82\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelif score >= 70:\n    print("C")\nelse:\n    print("D")',
        options: ["B와 C", "B", "C", "A"],
        answer: 1,
        explain: "위에서부터 검사해 처음 참인 elif score >= 80 하나만 실행하고 나머지는 건너뛰어요.",
      },
      {
        q: "출력은 무엇일까요?",
        code: "total = 0\nfor i in range(1, 5):\n    total = total + i\nprint(total)",
        options: ["15", "10", "4", "5"],
        answer: 1,
        explain: "range(1, 5)는 1, 2, 3, 4예요. 5는 포함하지 않아서 합은 10이에요.",
      },
      {
        q: "이 코드는 어떻게 될까요?",
        code: "count = 3\nwhile count > 0:\n    print(count)\nprint(\"발사!\")",
        options: ["3, 2, 1, 발사!", "3만 출력하고 끝난다", "3이 끝없이 출력된다", "발사!만 출력된다"],
        answer: 2,
        explain: "반복 안에서 count를 줄이지 않아서 조건이 영원히 참이에요. count = count - 1이 필요해요.",
      },
      {
        q: "출력은 무엇일까요?",
        code: "def add(a, b):\n    print(a + b)\n\nresult = add(2, 3)\nprint(result)",
        options: ["5 다음 줄에 5", "5만 출력", "None만 출력", "5 다음 줄에 None"],
        answer: 3,
        explain: "함수 안의 print가 5를 찍지만 return이 없어서 돌려받은 값은 None이에요.",
      },
      {
        q: "출력은 무엇일까요?",
        code: 'def greet(name, greeting="안녕하세요"):\n    return greeting + " " + name\n\nprint(greet("이서연", "반가워요"))',
        options: ["안녕하세요 이서연", "반가워요 이서연", "이서연 반가워요", "TypeError"],
        answer: 1,
        explain: "두 번째 인수를 넘기면 기본값 대신 그 값이 쓰여요.",
      },
    ],
  },
  {
    id: "step3",
    label: "STEP 3",
    title: "Python 실전 활용",
    oneLine: "진짜 데이터를 pandas로 불러와 검색하고, AI API를 붙여 챗봇을 만들었어요.",
    canDo: [
      "NumPy 배열로 평균, 표준편차 같은 통계를 한 줄로 낼 수 있다",
      "CSV를 pandas로 불러와 shape, dtypes, head, 결측치로 상태를 확인할 수 있다",
      "try/except로 지저분한 값이 섞여도 멈추지 않는 코드를 짤 수 있다",
      "글자 검색 함수를 만들고 Gradio로 입력창과 결과 화면을 붙일 수 있다",
      "검색 결과를 프롬프트에 담아 Gemini API로 데이터에 근거한 답을 만들 수 있다",
    ],
    keyPoints: [
      {
        label: "NumPy",
        code: "arr = np.array([23.5, 24.1, 22.9])\nnp.mean(arr), np.std(arr), np.median(arr)",
        note: "리스트를 np.array로 감싸면 계산 기능이 생겨요. 반복문 없이 함수 한 줄이에요.",
      },
      {
        label: "CSV 불러와 훑기",
        code: 'df = pd.read_csv("파일.csv")\ndf.shape, df.dtypes, df.head()\ndf.isnull().sum()',
        note: "계산 전에 몇 줄인지, 숫자 열이 숫자인지, 빈 칸이 몇 개인지부터 확인해요.",
      },
      {
        label: "멈추지 않는 코드",
        code: "try:\n    값 = float(원본)\nexcept:\n    print(\"건너뜀\")",
        note: "try 안에서 에러가 나면 그 즉시 except로 넘어가고 프로그램은 계속 가요.",
      },
      {
        label: "글자 검색",
        code: 'df[df["title"].str.contains(keyword, na=False)]',
        note: "na=False는 빈 칸을 만나도 오류 없이 넘어가라는 뜻이에요.",
      },
      {
        label: "Gemini API",
        code: 'client = genai.Client(api_key=api_key)\nclient.models.generate_content(model="gemini-2.5-flash", contents=prompt)',
        note: "API 키는 Colab 보안 비밀에 두고 userdata.get으로 꺼내요. 코드에 직접 적지 않아요.",
      },
      {
        label: "데이터를 담은 프롬프트",
        code: 'prompt = f"""아래 데이터만 근거로 답해 줘.\n[데이터]\n{found}\n[질문]\n{user_input}"""',
        note: "검색 결과를 함께 보내야 AI가 우리 데이터를 근거로 답하고 지어내기가 줄어요.",
      },
    ],
    pitfalls: [
      { mistake: "파일을 안 올리거나 이름 오타", symptom: "FileNotFoundError", fix: "왼쪽 폴더에서 파일 이름 확인, 연결이 끊겼으면 다시 올리기" },
      { mistake: "한글 CSV 인코딩", symptom: "UnicodeDecodeError", fix: 'encoding="utf-8-sig" 또는 "cp949" 지정' },
      { mistake: "str.contains에 na=False 빼먹기", symptom: "빈 칸 때문에 오류", fix: "na=False 붙이기" },
      { mistake: "API 키를 코드에 그대로 적고 공유", symptom: "키 유출", fix: "보안 비밀 + userdata.get" },
      { mistake: "질문만 AI에 보내기", symptom: "우리 데이터와 다른 일반 지식 답변", fix: "검색 결과를 프롬프트에 함께 담기" },
    ],
    assignmentFlow: [
      "Kaggle에서 데이터를 골라 read_csv로 불러오고 열과 빈 칸 확인하기",
      "챗봇이 쓸 제목 열과 특징 열을 정하고 빈 칸 정리하기",
      "검색 함수(search_data)를 만들고 결과를 읽기 좋은 문장으로 바꾸기",
      "검색 결과와 질문을 프롬프트에 담아 Gemini로 답 만들기",
      "Gradio로 채팅 화면을 붙이고, 못 찾을 때와 실패할 때를 대비하기",
    ],
    assignmentSkeleton:
      'df = pd.read_csv("내데이터.csv")\n\ndef search_data(keyword, top_n=3):\n    ...  # 제목과 특징 열에서 keyword를 찾아 최대 top_n개\n\ndef answer(user_input):\n    found = ...  # 검색 결과를 문장으로\n    prompt = ...  # 데이터만 근거로 답하라는 부탁 + found + user_input\n    ...  # Gemini에 보내고 response.text 돌려주기\n\n# Gradio 화면에 answer 연결',
    lessons: [
      { label: "데이터 분석 첫걸음: NumPy와 Pandas", href: "/basecamp/python-data-analysis-numpy-pandas" },
      { label: "챗봇 (1) 데이터 준비", href: "/basecamp/python-chatbot-load-data" },
      { label: "챗봇 (2) 검색과 화면", href: "/basecamp/python-chatbot-search-gradio" },
      { label: "챗봇 (3) Gemini API", href: "/basecamp/python-chatbot-gemini-api" },
      { label: "챗봇 (4) 질문 이해와 안전장치", href: "/basecamp/python-chatbot-smarter-gemini" },
      { label: "챗봇 (5) UX 다듬기", href: "/basecamp/python-chatbot-ux" },
    ],
    quiz: [
      {
        q: "출력은 무엇일까요?",
        code: "arr = np.array([2, 4, 9])\nprint(np.mean(arr))",
        options: ["4.0", "5", "5.0", "15"],
        answer: 2,
        explain: "(2 + 4 + 9) ÷ 3 = 5이고, 평균은 소수로 나와서 5.0이에요.",
      },
      {
        q: "출력은 무엇일까요?",
        code: 'df = pd.DataFrame({"측정값": [23.5, 26.1, 27.0]})\ndf["불량"] = df["측정값"] > 25.0\nprint(df["불량"].sum())',
        options: ["2", "3", "True", "53.1"],
        answer: 0,
        explain: "비교 결과는 False, True, True예요. 더하면 True는 1, False는 0으로 세서 2예요.",
      },
      {
        q: "df.isnull().sum()은 무엇을 보여 줄까요?",
        options: ["열마다 값의 합계", "열마다 빈 칸(결측치) 개수", "빈 칸이 있는 행 목록", "전체 행 개수"],
        answer: 1,
        explain: "isnull이 칸마다 비었는지 True/False를 매기고, sum이 열마다 True를 세요.",
      },
      {
        q: "출력은 무엇일까요?",
        code: 'values = ["23.5", "측정불가", "25", ""]\nok = 0\nfor v in values:\n    try:\n        float(v)\n        ok = ok + 1\n    except:\n        pass\nprint(ok)',
        options: ["4", "3", "1", "2"],
        answer: 3,
        explain: '"23.5"와 "25"만 숫자로 바뀌어요. "측정불가"와 빈 문자열은 except로 넘어가요.',
      },
      {
        q: 'str.contains(keyword, na=False)에서 na=False를 붙이는 이유는 무엇일까요?',
        options: [
          "대소문자를 무시하려고",
          "빈 칸을 만나도 오류 없이 못 찾은 것으로 넘기려고",
          "숫자 열도 검색하려고",
          "결과를 정렬하려고",
        ],
        answer: 1,
        explain: "진짜 데이터에는 빈 칸이 섞여 있어요. na=False면 빈 칸은 '안 들어 있음'으로 처리돼요.",
      },
      {
        q: "Gemini API 키를 다루는 바른 방법은 무엇일까요?",
        options: [
          "코드 첫 줄에 적어 두고 노트를 공유한다",
          "Colab 보안 비밀에 넣고 userdata.get으로 꺼낸다",
          "프롬프트 안에 함께 적어 보낸다",
          "키 없이 모델 이름만 적는다",
        ],
        answer: 1,
        explain: "키는 비밀번호와 같아요. 코드에 남지 않게 보안 비밀에 두고 이름으로 꺼내 써요.",
      },
      {
        q: "챗봇이 질문만 보내지 않고 검색 결과를 프롬프트에 함께 담는 가장 큰 이유는 무엇일까요?",
        options: [
          "응답 속도를 높이려고",
          "API 비용을 줄이려고",
          "우리 데이터를 근거로 답하게 하고 지어내기를 줄이려고",
          "Gradio 화면에 표를 띄우려고",
        ],
        answer: 2,
        explain: "질문만 보내면 AI는 원래 알던 지식으로 답해요. 데이터를 담고 '이것만 근거로'라고 부탁해야 해요.",
      },
      {
        q: '"\\n".join(lines)는 무엇을 할까요?',
        options: [
          "lines의 문장들을 줄바꿈으로 이어 하나의 글로 만든다",
          "글자에서 줄바꿈을 지운다",
          "lines를 줄바꿈마다 나눠 리스트로 만든다",
          "lines의 개수를 센다",
        ],
        answer: 0,
        explain: "리스트에 모아 둔 문장 사이사이에 줄바꿈을 끼워 하나의 문자열로 이어 붙여요.",
      },
    ],
  },
  {
    id: "step4",
    label: "STEP 4",
    title: "엑셀 자동화",
    oneLine: "리스트, 딕셔너리, 반복문으로 매주 하는 엑셀 정리를 한 번에 끝냈어요.",
    canDo: [
      "글자로 된 숫자와 앞뒤 공백을 함수로 정리할 수 있다",
      "엑셀 표를 딕셔너리의 리스트로 담고 지점별 합계(SUMIF)를 낼 수 있다",
      "openpyxl과 csv로 엑셀과 CSV를 읽고, 시트 여러 개짜리 엑셀로 저장할 수 있다",
      "try/except로 깨진 파일은 건너뛰고 기록하며 폴더 전체를 처리할 수 있다",
      "AI에게 기능을 요청해 붙이고, 그 결과를 코드로 검증할 수 있다",
    ],
    keyPoints: [
      {
        label: "값 정리 함수",
        code: 'def to_number(value):\n    return int(str(value).replace(",", "").strip())',
        note: "숫자든 글자든 str()로 먼저 글자로 맞춘 뒤 쉼표와 공백을 지우고 정수로 바꿔요.",
      },
      {
        label: "표 = 딕셔너리의 리스트",
        code: 'rows = [{"지점": "강남점", "수량": 30, "단가": 4500}, ...]',
        note: "한 행은 딕셔너리, 표 전체는 그 리스트예요. 열 이름이 키가 돼요.",
      },
      {
        label: "SUMIF 패턴",
        code: "total[branch] = total.get(branch, 0) + 매출",
        note: "처음 보는 지점은 0에서 시작해서 더해 나가요.",
      },
      {
        label: "엑셀과 CSV 읽기",
        code: 'sheet = load_workbook(path).active\nrows = list(sheet.iter_rows(values_only=True))\ncsv.DictReader(f)',
        note: "엑셀은 첫 줄을 열 이름으로 떼어 dict(zip())으로 짝짓고, CSV의 DictReader는 값을 전부 글자로 읽어요.",
      },
      {
        label: "폴더 전체 처리",
        code: 'for path in sorted(Path("data").iterdir()):\n    try:\n        ...\n    except Exception as e:\n        errors.append(path.name)',
        note: "try가 파일 하나를 통째로 감싸서, 깨진 파일만 건너뛰고 다음 파일로 가요.",
      },
      {
        label: "엑셀 쓰기",
        code: 'wb = Workbook()\nws = wb.create_sheet("지점별합계")\nws.append([...])\nwb.save("결과.xlsx")',
        note: "시트를 다 채운 다음 마지막에 save해야 파일에 반영돼요.",
      },
    ],
    pitfalls: [
      { mistake: '"4,500"을 바로 int()', symptom: "ValueError", fix: '쉼표를 지우고 int: replace(",", "")' },
      { mistake: "CSV 값을 그대로 더하기", symptom: "'47' + '35' = '4735'", fix: "to_number로 숫자로 바꾸기" },
      { mistake: "try가 파일 열기 줄을 감싸지 않음", symptom: "깨진 파일에서 전체가 멈춤", fix: "파일 하나 처리 전체를 try로 감싸기" },
      { mistake: "save 뒤에 시트 추가", symptom: "파일에 시트가 없음", fix: "모든 시트를 채운 뒤 마지막에 save" },
      { mistake: "합치기 칸 밖에서 all_rows = [] 선언", symptom: "다시 실행할 때마다 기록이 두 번 쌓임", fix: "합치기 칸 맨 위에서 빈 리스트로 시작" },
    ],
    assignmentFlow: [
      "손으로 하던 업무를 규칙과 판단으로 나눠 주석으로 적기",
      "정리 함수(to_number, clean_text)와 읽기 함수 만들기",
      "폴더 전체를 돌며 정리해 모으고, 깨진 파일은 errors에 기록하기",
      "지점별 합계를 내고 시트 3개(전체데이터, 지점별합계, 확인필요) 결과 파일 저장하기",
      "새 파일을 넣고 다시 실행하기, AI에게 기능을 요청해 붙이고 코드로 검증하기",
    ],
    assignmentSkeleton:
      'def to_number(value): ...\ndef clean_text(value): ...\ndef read_rows(path): ...   # 엑셀이든 CSV든 딕셔너리 리스트로\n\nall_rows, errors = [], []\nfor path in sorted(DATA_FOLDER.iterdir()):\n    try:\n        ...  # 한 줄씩 정리해서 all_rows에\n    except Exception as e:\n        ...  # errors에 기록하고 다음 파일로\n\nbranch_total = {}  # SUMIF\n...\nwb = Workbook()    # 시트 3개 만들고 save',
    lessons: [
      { label: "파이썬으로 엑셀 표 담고 다루기", href: "/basecamp/python-excel-data-basics" },
      { label: "엑셀 파일 읽고 쓰기, 멈추지 않는 코드", href: "/basecamp/python-excel-files-exceptions" },
      { label: "자동 정리 툴 (1) 파일 합치기까지", href: "/basecamp/python-excel-automation-build" },
      { label: "자동 정리 툴 (2) 결과 파일과 검증", href: "/basecamp/python-excel-automation-report" },
    ],
    quiz: [
      {
        q: "출력은 무엇일까요?",
        code: 'def to_number(value):\n    return int(str(value).replace(",", "").strip())\n\nprint(to_number(" 4,500 ") + 1)',
        options: ["ValueError", " 4,500 1", "4501", "45001"],
        answer: 2,
        explain: "쉼표와 앞뒤 공백을 지운 \"4500\"이 정수 4500이 되고, 1을 더해 4501이에요.",
      },
      {
        q: "csv.DictReader로 읽은 한 줄이에요. 출력은 무엇일까요?",
        code: 'row = {"수량": "47", "추가": "35"}\nprint(row["수량"] + row["추가"])',
        options: ["82", "4735", "TypeError", "47 35"],
        answer: 1,
        explain: "DictReader는 모든 값을 글자로 읽어요. 글자끼리 더하면 이어 붙여져요.",
      },
      {
        q: "total[branch] = total.get(branch, 0) + 매출 에서 0이 하는 일은 무엇일까요?",
        options: [
          "매출이 0인 지점을 건너뛴다",
          "처음 보는 지점의 합계를 0부터 시작하게 한다",
          "합계를 0으로 초기화한다",
          "지점 번호를 0부터 매긴다",
        ],
        answer: 1,
        explain: "처음 나온 지점은 아직 합계가 없어서, 없으면 0을 쓰도록 해 첫 매출부터 바르게 더해요.",
      },
      {
        q: "출력은 무엇일까요?",
        code: 'rows = [("강남점", 3), ("홍대점", 5), ("강남점", 2)]\ntotal = {}\nfor branch, qty in rows:\n    total[branch] = total.get(branch, 0) + qty\nprint(total)',
        options: [
          "{'강남점': 2, '홍대점': 5}",
          "{'강남점': 3, '홍대점': 5}",
          "{'강남점': 5, '홍대점': 5}",
          "{'강남점': 5, '홍대점': 5, '강남점': 2}",
        ],
        answer: 2,
        explain: "강남점은 3에 2가 더해져 5가 돼요. 딕셔너리의 키는 하나만 있을 수 있어요.",
      },
      {
        q: "폴더의 파일을 도는 for문 안에서 try가 파일 하나의 처리 전체를 감싸고 있어요. 세 번째 파일이 깨져 있으면?",
        options: [
          "프로그램 전체가 멈춘다",
          "세 번째 파일만 건너뛰고 기록한 뒤 다음 파일로 간다",
          "세 번째 파일부터 끝까지 모두 건너뛴다",
          "처음 파일부터 다시 시작한다",
        ],
        answer: 1,
        explain: "except가 그 파일의 에러를 잡아 기록하고, 바깥 for문은 다음 파일로 계속 가요.",
      },
      {
        q: "STEP 4에서 openpyxl로 일부러 깨뜨린 xlsx 파일을 열 때 나온 에러는 무엇이었나요?",
        options: ["FileNotFoundError", "KeyError", "BadZipFile", "UnicodeDecodeError"],
        answer: 2,
        explain: "xlsx는 속이 zip 묶음이라, 묶음이 아닌 파일을 열면 BadZipFile이 나요. Pandas는 같은 파일에서 ValueError를 내요.",
      },
      {
        q: "wb.save(...)를 먼저 하고 그 아래에서 wb.create_sheet(...)로 시트를 추가했어요. 결과 파일은?",
        options: [
          "새 시트가 포함돼 있다",
          "새 시트가 빠져 있다",
          "파일이 깨진다",
          "에러가 나서 저장되지 않는다",
        ],
        answer: 1,
        explain: "save 시점의 내용만 파일에 써져요. 시트를 다 채운 뒤 마지막에 save해야 해요.",
      },
      {
        q: "출력은 무엇일까요?",
        code: 'header = ("날짜", "지점")\nrow = ("2026-09-21", "강남점")\nprint(dict(zip(header, row)))',
        options: [
          "{'날짜': '2026-09-21', '지점': '강남점'}",
          "[('날짜', '2026-09-21'), ('지점', '강남점')]",
          "{'2026-09-21': '날짜', '강남점': '지점'}",
          "('날짜', '지점', '2026-09-21', '강남점')",
        ],
        answer: 0,
        explain: "zip이 같은 자리끼리 짝을 짓고, dict가 앞을 키, 뒤를 값으로 딕셔너리를 만들어요.",
      },
    ],
  },
  {
    id: "step5",
    label: "STEP 5",
    title: "엑셀 자동화 2탄 (Pandas)",
    oneLine: "같은 엑셀 정리를 Pandas로 열 단위로 다시 짜고, 결과가 같은지 확인했어요.",
    canDo: [
      "딕셔너리 리스트를 DataFrame으로 바꾸고 열 단위로 계산할 수 있다",
      "조건으로 거르고 groupby로 지점별, 품목별 합계를 낼 수 있다",
      ".str, astype으로 지저분한 열 전체를 한 번에 정리할 수 있다",
      "read_excel, read_csv, concat으로 여러 파일을 하나의 표로 합칠 수 있다",
      "ExcelWriter로 시트 여러 개를 저장하고, STEP 4 결과와 같은지 비교할 수 있다",
    ],
    keyPoints: [
      {
        label: "DataFrame과 훑어보기",
        code: "df = pd.DataFrame(sales)\ndf.shape, df.columns.tolist(), df.head()",
        note: "딕셔너리의 키가 열 이름, 리스트 순서가 인덱스가 돼요.",
      },
      {
        label: "열 꺼내기와 새 열",
        code: 'df["수량"], df[["지점", "수량"]]\ndf["매출"] = df["수량"] * df["단가"]',
        note: "열 여러 개는 대괄호 두 겹이에요. 열끼리 곱하면 모든 줄이 한 번에 계산돼요.",
      },
      {
        label: "거르기",
        code: 'df[df["매출"] >= 150000]\ndf[(df["지점"] == "홍대점") & (df["수량"] >= 30)]',
        note: "and, or 대신 &, |를 쓰고 조건마다 괄호로 감싸요.",
      },
      {
        label: "groupby",
        code: 'df.groupby("지점")["매출"].sum().sort_values(ascending=False)',
        note: "묶고, 고르고, 더해요. 결과는 기준 값의 가나다순으로 나와요.",
      },
      {
        label: "열 전체 정리",
        code: 'df["단가"].astype(str).str.replace(",", "").astype(int)\ndf["품목"].str.strip()',
        note: "이미 숫자인 열에는 .str을 못 쓰니 astype(str)로 글자로 먼저 맞춰요.",
      },
      {
        label: "합치고 저장하기",
        code: 'all_df = pd.concat(tables, ignore_index=True)\nwith pd.ExcelWriter("결과.xlsx") as writer:\n    all_df.to_excel(writer, sheet_name="전체데이터", index=False)',
        note: "합칠 때는 번호를 새로 매기고, 저장할 때는 index=False로 번호 열을 빼요.",
      },
    ],
    pitfalls: [
      { mistake: 'df["지점", "수량"] (한 겹)', symptom: "KeyError", fix: 'df[["지점", "수량"]]' },
      { mistake: "조건에 and, or", symptom: "ValueError", fix: "&, |로 바꾸고 조건마다 괄호" },
      { mistake: '숫자 열에 바로 .str', symptom: "AttributeError", fix: "astype(str)로 먼저 글자로" },
      { mistake: "to_excel에 index=False 빼먹기", symptom: "Unnamed: 0 열이 생김", fix: "index=False" },
      { mistake: "groupby 결과를 reset_index 없이 index=False 저장", symptom: "지점 이름이 사라짐", fix: "reset_index()로 지점을 열로 꺼낸 뒤 저장" },
    ],
    assignmentFlow: [
      "STEP 4 정답 코드를 먼저 실행해 목표 결과(줄 수, 지점별 합계) 확인하기",
      "코드 덩어리 [A]~[E]가 하는 일과 Pandas 대응을 주석으로 정리하기",
      "clean_df와 read_file을 만들고, 폴더 전체를 tables에 모아 concat하기",
      "groupby로 합계를 내고 ExcelWriter로 시트 3개 저장하기",
      "두 결과 파일을 시트별로 비교해 모두 같은지 확인하고, 소감을 주석으로 적기",
    ],
    assignmentSkeleton:
      'def clean_df(df):\n    ...  # 공백 지우기, 쉼표 지우고 정수로, 매출 열\n    return df\n\ndef read_file(path):\n    ...  # .csv면 read_csv, 아니면 read_excel\n\ntables, errors = [], []\nfor path in sorted(DATA_FOLDER.iterdir()):\n    try:\n        ...\n    except Exception as e:\n        ...\nall_df = pd.concat(tables, ignore_index=True)\n\nbranch_total = ...  # groupby\nwith pd.ExcelWriter(RESULT_FILE) as writer:\n    ...  # 시트 3개, 모두 index=False',
    lessons: [
      { label: "Pandas 다시 만나기", href: "/basecamp/python-pandas-basics" },
      { label: "STEP 4 코드를 Pandas로 바꿔 보기", href: "/basecamp/python-pandas-excel-automation" },
      { label: "Pandas로 다시 만들기 (1) 파일 합치기까지", href: "/basecamp/python-pandas-automation-build" },
      { label: "Pandas로 다시 만들기 (2) 두 버전 비교", href: "/basecamp/python-pandas-automation-report" },
    ],
    quiz: [
      {
        q: "이 코드는 어떻게 될까요?",
        code: 'df = pd.DataFrame({"지점": ["강남점"], "수량": [30]})\nprint(df["지점", "수량"])',
        options: ["두 열이 출력된다", "KeyError가 난다", "지점 열만 출력된다", "AttributeError가 난다"],
        answer: 1,
        explain: '대괄호 한 겹이면 ("지점", "수량")이라는 이름의 열 하나를 찾아요. 열 여러 개는 df[["지점", "수량"]]이에요.',
      },
      {
        q: "지점 값이 홍대점, 강남점, 부산점 순서로 섞여 있어요. df.groupby(\"지점\")[\"매출\"].sum()의 결과 순서는?",
        options: [
          "홍대점, 강남점, 부산점 (처음 나온 순서)",
          "강남점, 부산점, 홍대점 (가나다순)",
          "매출이 큰 순서",
          "매번 무작위",
        ],
        answer: 1,
        explain: "groupby는 묶는 기준 값을 정렬해서 돌려줘요. 큰 순서로 보려면 sort_values(ascending=False)를 붙여요.",
      },
      {
        q: "이 코드는 어떻게 될까요?",
        code: 'df = pd.DataFrame({"지점": ["홍대점", "강남점"], "수량": [36, 19]})\nprint(df[(df["지점"] == "홍대점") and (df["수량"] >= 30)])',
        options: ["홍대점 한 줄이 출력된다", "빈 표가 출력된다", "ValueError가 난다", "두 줄 모두 출력된다"],
        answer: 2,
        explain: "열 전체 조건을 and로 이으면 참인지 거짓인지 하나로 정할 수 없다는 ValueError가 나요. &를 써요.",
      },
      {
        q: "이 코드는 어떻게 될까요?",
        code: 'df = pd.DataFrame({"단가": [4500, 5000]})\nprint(df["단가"].str.replace(",", ""))',
        options: ["4500, 5000이 그대로 나온다", "ValueError가 난다", "빈 값이 나온다", "AttributeError가 난다"],
        answer: 3,
        explain: ".str은 글자 열에서만 쓸 수 있어요. 숫자 열이면 astype(str)를 먼저 해요.",
      },
      {
        q: "출력은 무엇일까요?",
        code: 'a = pd.DataFrame({"x": [1, 2]})\nb = pd.DataFrame({"x": [3, 4]})\nprint(pd.concat([a, b]).index.tolist())',
        options: ["[0, 1, 2, 3]", "[1, 2, 3, 4]", "[0, 1, 0, 1]", "[0, 0, 1, 1]"],
        answer: 2,
        explain: "ignore_index=True가 없으면 각 표의 번호가 그대로 붙어 겹쳐요. 넣으면 [0, 1, 2, 3]이 돼요.",
      },
      {
        q: 'df.to_excel("t.xlsx")로 저장한 파일을 다시 읽었더니 열 이름에 무엇이 끼어 있을까요?',
        options: ["Index", "Unnamed: 0", "0", "Column1"],
        answer: 1,
        explain: "index=False를 빼면 인덱스가 이름 없는 열로 저장돼요. 다시 읽으면 Unnamed: 0이 돼요.",
      },
      {
        q: "groupby 합계를 index=False로 저장하기 전에 reset_index()를 하는 이유는 무엇일까요?",
        options: [
          "합계를 다시 계산하려고",
          "인덱스 자리에 있는 지점 이름을 보통 열로 꺼내 함께 저장하려고",
          "행 순서를 거꾸로 하려고",
          "빈 칸을 지우려고",
        ],
        answer: 1,
        explain: "그대로 index=False로 저장하면 지점 이름이 인덱스와 함께 버려져 숫자만 남아요.",
      },
      {
        q: "출력은 무엇일까요?",
        code: 'df = pd.DataFrame({"수량": ["36", "1,200"]})\nprint(df["수량"].astype(str).str.replace(",", "").astype(int).tolist())',
        options: ["[36, 1200]", "['36', '1200']", "ValueError", "[36, 1,200]"],
        answer: 0,
        explain: "글자로 맞추고, 쉼표를 지우고, 정수로 바꿔서 숫자 리스트가 돼요.",
      },
    ],
  },
];

/** 전체 퀴즈 문항 수 */
export const basecampQuizTotal = basecampReviewSteps.reduce((n, step) => n + step.quiz.length, 0);
