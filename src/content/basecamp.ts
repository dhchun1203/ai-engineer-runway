// 베이스캠프 선행 과제 데이터 — 개강 전 매주 한 STEP씩 공개되는 공식 선행 과제를
// 우리 사이트에서 준비하고 진도를 추적하기 위한 정적 구조.
//
// 원칙(사용자 결정 2026-09-09): 베이스캠프 진도가 우리 커리큘럼보다 우선이다.
// 그래서 홈 대시보드 맨 위에 이 트랙을 올리고, 나브에도 앞쪽에 둔다.
//
// 저작권·브랜딩: 공식 과제 본문을 그대로 복제하지 않는다. 각 항목은 우리 표현으로
// 요약한 한 줄과 공식 페이지 링크, 그리고 같은 주제를 더 깊게 다루는 우리 레슨
// 링크만 담는다. 교육기관명은 어디에도 쓰지 않는다.
//
// 진도 저장: 완료 상태는 curriculum과 같은 Supabase progress 테이블에 저장하되,
// 커리큘럼 slug와 섞이지 않도록 "bc:" 접두사를 붙인 id로 넣는다(basecamp/actions.ts).

/** 베이스캠프 종료일(이날까지 매주 STEP 공개). */
export const BASECAMP_END_DATE = "2026-10-26";

/** 공식 선행 과제 페이지 베이스 URL. */
const OFFICIAL_BASE = "https://entrance-test.oopy.io/";

/** 진도에 저장할 때 붙이는 접두사. 커리큘럼 slug와 분리한다. */
export const BASECAMP_PROGRESS_PREFIX = "bc:";

export type BasecampItem = {
  /** 안정적 식별자. 진도에는 `${BASECAMP_PROGRESS_PREFIX}${id}`로 저장된다. */
  id: string;
  /** 항목 제목 */
  title: string;
  /** 이 항목이 과제(최종 실습)인지 개념 레슨인지 */
  kind: "lesson" | "assignment";
  /** 공식 과제 페이지 링크(우리 표현 요약 옆에 건다) */
  officialUrl: string;
  /** 우리 표현으로 요약한 한 줄. 공식 본문 복제가 아니다. */
  summary: string;
  /** 같은 주제를 더 깊게 다루는 우리 레슨(있으면) */
  ourLessonHref?: string;
};

export type BasecampStep = {
  /** STEP 번호(=주차) */
  no: number;
  /** 주차 라벨 */
  weekLabel: string;
  /** 트랙명(예: Python 첫걸음) */
  title: string;
  /** 우리 표현의 한 줄 소개 */
  summary: string;
  /** 공개되었는지 */
  released: boolean;
  /** 공식 STEP 페이지(있으면) */
  officialUrl?: string;
  /** 이 STEP의 항목들(개념 레슨 + 최종 과제) */
  items: BasecampItem[];
};

export const basecampSteps: readonly BasecampStep[] = [
  {
    no: 1,
    weekLabel: "1주차",
    title: "Python 첫걸음",
    summary:
      "기초 문법부터 데이터 구조까지. 환경 세팅, 변수와 데이터 타입, 리스트와 튜플을 익히고 마지막에 직접 코드를 짜서 제출합니다.",
    released: true,
    officialUrl: `${OFFICIAL_BASE}3d52dc3e-f514-8060-8372-fb45fd534b0c`,
    items: [
      {
        id: "s1-env",
        title: "환경 세팅하기",
        kind: "lesson",
        officialUrl: `${OFFICIAL_BASE}3d62dc3e-f514-8073-8f59-ccf2aef367b3`,
        summary:
          "Chrome과 Google Colab을 준비하고, 코드를 실행할 개발 환경과 기본 단축키를 익힙니다.",
        ourLessonHref: "/lesson/1-1-dev-environment-setup",
      },
      {
        id: "s1-variables",
        title: "변수와 데이터 타입",
        kind: "lesson",
        officialUrl: `${OFFICIAL_BASE}3d62dc3e-f514-804c-9b80-ceaa76a63219`,
        summary:
          "print 출력, 변수, 문자열과 숫자와 불리언, 결측값, 입력문을 익히고 데이터와 AI에서 어떻게 쓰이는지 봅니다.",
        ourLessonHref: "/lesson/1-3-python-variables-and-types",
      },
      {
        id: "s1-lists",
        title: "리스트와 튜플",
        kind: "lesson",
        officialUrl: `${OFFICIAL_BASE}3d62dc3e-f514-800b-b5c0-e0e9b88d6a1b`,
        summary:
          "리스트 생성과 슬라이싱과 정렬, 튜플과 딕셔너리까지. 데이터를 구조화하고 다루는 자료형을 익힙니다.",
        ourLessonHref: "/lesson/1-3-python-lists-tuples-dicts",
      },
      {
        id: "s1-final",
        title: "최종 과제 실습",
        kind: "assignment",
        officialUrl: `${OFFICIAL_BASE}3d62dc3e-f514-80f7-9068-eb9392980577`,
        summary:
          "Colab에서 직접 코드를 짜서 변수와 리스트와 슬라이싱과 튜플, 학생 명부(중첩 자료형)를 다루고, 공유 링크로 제출합니다.",
      },
    ],
  },
  {
    no: 2,
    weekLabel: "AI 리터러시",
    title: "AI Literacy & 프롬프트 엔지니어링",
    summary:
      "AI를 잘 쓰는 관점 5가지와, 원하는 결과를 얻어내는 프롬프트 작성법을 익히고 나만의 프롬프트를 만들어 제출합니다.",
    released: true,
    // 공식 페이지 URL은 ID 기반 형태를 쓴다(제목 슬러그의 교육기관명이 소스에 남지 않도록).
    officialUrl: "https://www.notion.so/3d82dc3ef5148019beffc82d3abba952",
    items: [
      {
        id: "ail-basics",
        title: "AI 리터러시 & 프롬프트 기초",
        kind: "lesson",
        officialUrl: "https://www.notion.so/3d82dc3ef5148019beffc82d3abba952",
        summary:
          "AI를 쓰는 것과 잘 쓰는 것의 차이, 규칙 기반과 학습 기반, 분류와 생성 AI, 그리고 좋은 프롬프트의 6가지 구성 요소를 배웁니다.",
        ourLessonHref: "/basecamp/ai-literacy-prompt",
      },
      {
        id: "ail-project",
        title: "나만의 프롬프트 만들기 (ZEP 활동지)",
        kind: "assignment",
        officialUrl: "https://www.notion.so/3d82dc3ef5148019beffc82d3abba952",
        summary:
          "배운 6요소로 단순 프롬프트와 구조화 프롬프트를 각각 작성해 결과를 비교하고, ZEP 활동지에 나만의 프롬프트를 제출합니다.",
      },
    ],
  },
  {
    no: 3,
    weekLabel: "2주차",
    title: "Python 문법 확장",
    summary:
      "딕셔너리로 데이터를 다루고, 조건문과 반복문으로 흐름을 제어하고, 함수로 코드를 구조화합니다. 마지막에 배운 문법을 조합해 직접 코드를 짜서 제출합니다.",
    released: true,
    officialUrl: `${OFFICIAL_BASE}3db2dc3e-f514-8023-8ace-c1dd519f6002`,
    items: [
      {
        id: "s2-dict",
        title: "딕셔너리 알아보기",
        kind: "lesson",
        officialUrl: `${OFFICIAL_BASE}3db2dc3e-f514-8049-8947-d08289cf51e2`,
        summary:
          "딕셔너리의 키와 값 구조를 이해하고, 데이터를 저장하고 조회하는 법을 익힙니다.",
        ourLessonHref: "/basecamp/python-dictionaries",
      },
      {
        id: "s2-flow",
        title: "조건문과 반복문",
        kind: "lesson",
        officialUrl: `${OFFICIAL_BASE}3db2dc3e-f514-80ad-81b4-cacc012a93ce`,
        summary:
          "조건문과 반복문으로 상황에 따라 프로그램의 흐름을 제어하는 법을 익힙니다.",
        ourLessonHref: "/basecamp/python-conditionals-loops",
      },
      {
        id: "s2-func",
        title: "함수 이해하기",
        kind: "lesson",
        officialUrl: `${OFFICIAL_BASE}3db2dc3e-f514-80e1-8419-c828ccb537c4`,
        summary:
          "함수의 개념과 필요성을 이해하고, 함수를 정의하고 호출하는 법을 익힙니다.",
        ourLessonHref: "/basecamp/python-functions",
      },
      {
        id: "s2-final",
        title: "최종 과제 실습 (기본 / 심화 중 선택)",
        kind: "assignment",
        officialUrl: `${OFFICIAL_BASE}3db2dc3e-f514-8023-8ace-c1dd519f6002`,
        summary:
          "배운 문법을 조합해 간단한 문제를 스스로 해결하는 코드를 작성해 제출합니다. 기본과 심화 두 버전 중 본인 수준에 맞는 하나를 골라 진행합니다.",
      },
    ],
  },
];

/** 공식 선행 과제 모음(전체 인덱스) 링크. */
export const BASECAMP_INDEX_URL = `${OFFICIAL_BASE}3d52dc3e-f514-8060-8372-fb45fd534b0c`;

/** STEP 2(2주차) 최종 과제의 "심화" 버전 공식 페이지. */
export const STEP2_ADVANCED_URL = `${OFFICIAL_BASE}3db2dc3e-f514-8045-a70e-cf0bc333d7b8`;

export type BasecampPrepLesson = {
  /** 안정적 식별자. 진도에는 `${BASECAMP_PROGRESS_PREFIX}${id}`로 저장된다(STEP 항목과 동일). */
  id: string;
  title: string;
  summary: string;
  href: string;
};

/** 심화 최종 과제를 스스로 풀 수 있도록 각 기법을 더 깊게 다루는 보강 레슨 묶음.
 *  문제를 대신 풀어 주지 않고, 같은 기법을 다른 예제로 익혀 직접 적용하도록 돕는다.
 *  각 레슨에 완료 체크박스가 붙는다(사용자 요청) — STEP 항목과 같은 bc: 진도에
 *  저장하되, STEP의 "N/M 완료" 카운터에는 섞지 않고 이 섹션 자체 카운터로만 센다
 *  (기본 체크리스트를 부풀리지 않는다는 원칙 유지). */
export const step2AdvancedPrepLessons: readonly BasecampPrepLesson[] = [
  {
    id: "s2adv-nested-dict",
    title: "중첩 딕셔너리 다루기",
    summary:
      "딕셔너리 안의 딕셔너리를 순회하고, 항목마다 평균을 구하고, 최고값을 찾고, 컴프리헨션으로 한 줄에 표현합니다.",
    href: "/basecamp/python-nested-dictionaries",
  },
  {
    id: "s2adv-conditionals",
    title: "조건문 심화: 복합 조건과 표 기반 판별",
    summary:
      "and와 or, all()과 any()로 여러 조건을 한 번에 다루고, 긴 if/elif 대신 표를 순회해 판별합니다.",
    href: "/basecamp/python-advanced-conditionals",
  },
  {
    id: "s2adv-loop-algorithms",
    title: "반복문으로 알고리즘 직접 구현하기",
    summary:
      "선택 정렬, 이진 탐색, 소수 판별을 반복문으로 직접 짜 봅니다.",
    href: "/basecamp/python-loop-algorithms",
  },
  {
    id: "s2adv-functions",
    title: "함수 심화: 재귀와 유연한 인자",
    summary:
      "함수가 자기 자신을 부르는 재귀, 입력 검증, 그리고 개수가 정해지지 않은 키워드 인수(**kwargs)를 익힙니다.",
    href: "/basecamp/python-advanced-functions",
  },
  {
    id: "s2adv-mini-system",
    title: "여러 함수로 작은 시스템 만들기",
    summary:
      "추가, 삭제, 수정, 조회 함수를 조합해 작은 관리 시스템을 만들고, 표준편차를 직접 계산합니다.",
    href: "/basecamp/python-mini-system",
  },
];

/** action 검증용 — 알려진 항목 id 집합(임의 id로 진도 행이 생기는 것을 막는다).
 *  STEP 항목 id와 보강 레슨 id를 모두 포함한다(둘 다 toggleBasecampItem을 쓴다). */
export const basecampItemIds: ReadonlySet<string> = new Set([
  ...basecampSteps.flatMap((step) => step.items.map((item) => item.id)),
  ...step2AdvancedPrepLessons.map((lesson) => lesson.id),
]);

/** 진도 접두사를 붙인 저장 id. */
export function basecampProgressId(itemId: string): string {
  return `${BASECAMP_PROGRESS_PREFIX}${itemId}`;
}

/** 지금 집중할 STEP(가장 최근 공개된 STEP). 없으면 첫 STEP. */
export function currentBasecampStep(): BasecampStep {
  const released = basecampSteps.filter((step) => step.released);
  return released.length > 0 ? released[released.length - 1] : basecampSteps[0];
}

/** 완료 id 집합(bc: 접두사 포함)에서 한 STEP의 완료 개수를 센다. */
export function countStepDone(
  step: BasecampStep,
  completedRawIds: ReadonlySet<string>,
): { done: number; total: number } {
  const done = step.items.filter((item) =>
    completedRawIds.has(basecampProgressId(item.id)),
  ).length;
  return { done, total: step.items.length };
}
