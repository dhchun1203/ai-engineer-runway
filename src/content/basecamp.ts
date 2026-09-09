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
export const BASECAMP_END_DATE = "2026-10-30";

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
];

/** action 검증용 — 알려진 항목 id 집합(임의 id로 진도 행이 생기는 것을 막는다). */
export const basecampItemIds: ReadonlySet<string> = new Set(
  basecampSteps.flatMap((step) => step.items.map((item) => item.id)),
);

/** 공식 선행 과제 모음(전체 인덱스) 링크. */
export const BASECAMP_INDEX_URL = `${OFFICIAL_BASE}3d52dc3e-f514-8060-8372-fb45fd534b0c`;

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
