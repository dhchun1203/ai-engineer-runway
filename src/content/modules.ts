// 3 Step 메타 + 19 모듈 정의 — .planning/curriculum.md(커리큘럼 원문 source of truth)를 그대로 옮긴 정적 데이터.
// 소거 가능한 TypeScript 구문만 사용한다(네임스페이스, 생성자 파라미터 프로퍼티 금지) —
// scripts/check-manifest.mjs가 이 파일을 정규식으로 읽어 모듈 id 리터럴(`id: '<숫자>-<숫자>'`)을 추출하므로 형태를 유지할 것.

export type StepId = 1 | 2 | 3;

export interface Step {
  id: StepId;
  title: string;
  shortTitle: string;
  keywords: string[];
  goal: string;
  courseHours: number;
}

export interface Module {
  id: string;
  stepId: StepId;
  title: string;
  order: number;
  isProject: boolean;
}

export const steps: readonly Step[] = [
  {
    id: 1,
    title: 'AI 엔지니어링을 위한 개발 기반 구축',
    shortTitle: '개발 기반 구축',
    keywords: ['Python', 'Git', 'SQL', 'ML 기초'],
    goal: 'AI 서비스를 만들기 위해 필요한 개발 기초와 데이터 활용 능력을 익힌다.',
    courseHours: 200,
  },
  {
    id: 2,
    title: 'LLM 기반 풀스택 AI 서비스 구현',
    shortTitle: '풀스택·LLM 심화',
    keywords: ['Frontend', 'Backend', 'LLM API'],
    goal: '프론트엔드와 백엔드 전반을 학습하고, 데이터베이스 및 LLM API를 연동해 실제로 동작하는 AI 서비스를 직접 구현한다.',
    courseHours: 336,
  },
  {
    id: 3,
    title: 'RAG·멀티 에이전트 시스템 고도화',
    shortTitle: 'RAG·오케스트레이션 개요',
    keywords: ['RAG', 'Orchestration', 'LLMOps', 'Deploy'],
    goal: 'RAG, 모델 고도화, 워크플로우 오케스트레이션, LLMOps를 적용해 실무형 AX 서비스를 설계하고 배포까지 완성한다.',
    courseHours: 520,
  },
];

export const modules: readonly Module[] = [
  // Step 1 — 5 모듈
  { id: '1-1', stepId: 1, title: '온보딩 & 학습 환경 세팅', order: 1, isProject: false },
  { id: '1-2', stepId: 1, title: '개발 협업 & 생성형 AI 이해', order: 2, isProject: false },
  { id: '1-3', stepId: 1, title: 'Python 프로그래밍 기초', order: 3, isProject: false },
  { id: '1-4', stepId: 1, title: 'SQL & 데이터베이스 기초', order: 4, isProject: false },
  { id: '1-5', stepId: 1, title: '머신러닝 기초 모델링', order: 5, isProject: false },

  // Step 2 — 7 모듈
  { id: '2-1', stepId: 2, title: '데이터베이스 & AI 활용', order: 1, isProject: false },
  { id: '2-2', stepId: 2, title: '프론트엔드 개발', order: 2, isProject: false },
  { id: '2-3', stepId: 2, title: 'TypeScript & React/Next.js', order: 3, isProject: false },
  { id: '2-4', stepId: 2, title: '[Project 1] AI 쇼핑몰 프론트엔드', order: 4, isProject: true },
  { id: '2-5', stepId: 2, title: '백엔드 아키텍처 & API 설계', order: 5, isProject: false },
  { id: '2-6', stepId: 2, title: '[Project 2] AI 쇼핑몰 백엔드', order: 6, isProject: true },
  { id: '2-7', stepId: 2, title: 'LLM 프롬프트 엔지니어링', order: 7, isProject: false },

  // Step 3 — 7 모듈
  { id: '3-1', stepId: 3, title: 'RAG 파이프라인 설계', order: 1, isProject: false },
  { id: '3-2', stepId: 3, title: '[Project 3] RAG Agent 프로젝트', order: 2, isProject: true },
  { id: '3-3', stepId: 3, title: '모델 고도화', order: 3, isProject: false },
  { id: '3-4', stepId: 3, title: '워크플로우 오케스트레이션', order: 4, isProject: false },
  { id: '3-5', stepId: 3, title: '[Project 4] 오케스트레이션 프로젝트 (AI 업무 자동화)', order: 5, isProject: true },
  { id: '3-6', stepId: 3, title: 'LLMOps', order: 6, isProject: false },
  { id: '3-7', stepId: 3, title: '[Project 5] AX 서비스 런칭 프로젝트', order: 7, isProject: true },
];
