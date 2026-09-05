// 책으로 읽기 음성(book audio, quick 260905-vbc) — 스텝별 책의 챕터 낭독 MP3 매니페스트.
// 오디오는 무료 오픈소스 TTS(XTTS, 코랩 무료 GPU)로 미리 생성해 Supabase Storage
// 공개 버킷(book-audio)에 올린 정적 파일이다. 여기서는 그 URL·길이·챕터 제목만 들고
// 있고, /book/[step] 페이지가 이 매니페스트를 <BookAudioPlayer>에 넘겨 재생한다.
//
// book-scopes.ts의 chapters(slug 순서)와 slug로 매칭된다 — 인덱스가 아니라 slug로
// 잇는다(레슨 순서가 바뀌어도 음성이 엉키지 않게). 아직 없는 스텝(2·3)은 undefined라
// 페이지가 플레이어를 렌더하지 않는다. Step 1 파일럿부터.

import type { StepId } from './modules';

export interface BookAudioChapter {
  /** book-scopes 챕터(레슨)의 slug와 일치. */
  slug: string;
  title: string;
  /** 대략 재생 길이(초) — 매니페스트 표기·진행 추정용(실제 길이는 오디오 메타데이터가 확정). */
  seconds: number;
  /** Supabase Storage 공개 URL. */
  url: string;
}

export interface BookAudioStep {
  step: StepId;
  /** 생성 엔진(기록용). */
  engine: string;
  chapters: BookAudioChapter[];
}

const BASE =
  'https://wxqteqiuihrgtxmztauc.supabase.co/storage/v1/object/public/book-audio';

const BOOK_AUDIO: Partial<Record<StepId, BookAudioStep>> = {
  1: {
    step: 1,
    engine: 'xtts',
    chapters: [
      { slug: '1-1-course-orientation', title: '과정 운영 방식과 학습 준비', seconds: 130.3, url: `${BASE}/step1/1-1-course-orientation.mp3` },
      { slug: '1-1-dev-environment-setup', title: 'GitHub·학습 도구 환경 세팅', seconds: 107.8, url: `${BASE}/step1/1-1-dev-environment-setup.mp3` },
      { slug: '1-2-git-branch-and-pr', title: 'Git 브랜치와 PR 협업 흐름', seconds: 150.6, url: `${BASE}/step1/1-2-git-branch-and-pr.mp3` },
      { slug: '1-2-generative-ai-basics', title: '생성형 AI 개념과 활용 윤리', seconds: 133.8, url: `${BASE}/step1/1-2-generative-ai-basics.mp3` },
      { slug: '1-3-python-variables-and-types', title: 'Python 변수·자료형', seconds: 189.9, url: `${BASE}/step1/1-3-python-variables-and-types.mp3` },
      { slug: '1-3-python-functions-and-io', title: 'Python 함수·예외·파일 입출력', seconds: 182.9, url: `${BASE}/step1/1-3-python-functions-and-io.mp3` },
      { slug: '1-4-relational-db-basics', title: '관계형 데이터베이스 구조', seconds: 156.4, url: `${BASE}/step1/1-4-relational-db-basics.mp3` },
      { slug: '1-4-sql-queries-and-joins', title: 'SQL 쿼리·JOIN·집계', seconds: 141.3, url: `${BASE}/step1/1-4-sql-queries-and-joins.mp3` },
      { slug: '1-5-ml-model-types', title: '분류·회귀·군집 모델 이해', seconds: 156.4, url: `${BASE}/step1/1-5-ml-model-types.mp3` },
      { slug: '1-5-ml-metrics-and-pipeline', title: '평가 지표와 Scikit-learn Pipeline', seconds: 161.5, url: `${BASE}/step1/1-5-ml-metrics-and-pipeline.mp3` },
    ],
  },
  2: {
    step: 2,
    engine: 'xtts',
    chapters: [
      { slug: '2-1-postgres-and-supabase', title: 'PostgreSQL과 Supabase 활용', seconds: 160.6, url: `${BASE}/step2/2-1-postgres-and-supabase.mp3` },
      { slug: '2-1-ai-data-modeling', title: 'AI 서비스 데이터 구조 설계', seconds: 113.5, url: `${BASE}/step2/2-1-ai-data-modeling.mp3` },
      { slug: '2-2-html-css-js', title: 'HTML·CSS·JavaScript 핵심', seconds: 161.8, url: `${BASE}/step2/2-2-html-css-js.mp3` },
      { slug: '2-2-browser-and-ui', title: '브라우저 동작 원리와 UI 구현', seconds: 136.5, url: `${BASE}/step2/2-2-browser-and-ui.mp3` },
      { slug: '2-3-typescript-setup', title: 'TypeScript 개발 환경 구성', seconds: 198.6, url: `${BASE}/step2/2-3-typescript-setup.mp3` },
      { slug: '2-3-react-components', title: 'React 컴포넌트', seconds: 208.6, url: `${BASE}/step2/2-3-react-components.mp3` },
      { slug: '2-4-project-ai-shop-frontend', title: '[Project 1] AI 쇼핑몰 프론트엔드 준비 가이드', seconds: 49.8, url: `${BASE}/step2/2-4-project-ai-shop-frontend.mp3` },
      { slug: '2-5-express-rest-api', title: 'Express RESTful API 구현', seconds: 145.6, url: `${BASE}/step2/2-5-express-rest-api.mp3` },
      { slug: '2-5-auth-and-prisma', title: '인증·인가와 Prisma ORM', seconds: 171.8, url: `${BASE}/step2/2-5-auth-and-prisma.mp3` },
      { slug: '2-6-project-ai-shop-backend', title: '[Project 2] AI 쇼핑몰 백엔드 준비 가이드', seconds: 54.9, url: `${BASE}/step2/2-6-project-ai-shop-backend.mp3` },
      { slug: '2-7-prompt-patterns', title: '프롬프트 패턴과 구조화 출력', seconds: 200, url: `${BASE}/step2/2-7-prompt-patterns.mp3` },
      { slug: '2-7-promptops', title: 'PromptOps로 안정적인 LLM 활용', seconds: 144.9, url: `${BASE}/step2/2-7-promptops.mp3` },
    ],
  },
  3: {
    step: 3,
    engine: 'xtts',
    chapters: [
      { slug: '3-1-vector-search-basics', title: '벡터 검색과 메타데이터 설계', seconds: 121.1, url: `${BASE}/step3/3-1-vector-search-basics.mp3` },
      { slug: '3-1-hybrid-search-reranking', title: '하이브리드 검색과 re-ranking', seconds: 138, url: `${BASE}/step3/3-1-hybrid-search-reranking.mp3` },
      { slug: '3-2-project-rag-agent', title: '[Project 3] RAG Agent 준비 가이드', seconds: 62.2, url: `${BASE}/step3/3-2-project-rag-agent.mp3` },
      { slug: '3-3-peft-lora-qlora', title: 'PEFT·LoRA·QLoRA 개념', seconds: 139.9, url: `${BASE}/step3/3-3-peft-lora-qlora.mp3` },
      { slug: '3-3-tuning-evaluation', title: '모델 튜닝 전후 성능 비교', seconds: 110.4, url: `${BASE}/step3/3-3-tuning-evaluation.mp3` },
      { slug: '3-4-multi-agent-structure', title: '여러 AI가 함께 일하는 구조', seconds: 153.3, url: `${BASE}/step3/3-4-multi-agent-structure.mp3` },
      { slug: '3-4-webhook-schedule-hitl', title: 'Webhook·스케줄·HITL 설계', seconds: 141.4, url: `${BASE}/step3/3-4-webhook-schedule-hitl.mp3` },
      { slug: '3-4-n8n-langgraph', title: 'n8n·LangGraph 자동화 실습 개요', seconds: 107.6, url: `${BASE}/step3/3-4-n8n-langgraph.mp3` },
      { slug: '3-5-project-orchestration', title: '[Project 4] AI 업무 자동화 준비 가이드', seconds: 53.1, url: `${BASE}/step3/3-5-project-orchestration.mp3` },
      { slug: '3-6-prompt-versioning-eval', title: '프롬프트 버전관리와 평가 자동화', seconds: 113, url: `${BASE}/step3/3-6-prompt-versioning-eval.mp3` },
      { slug: '3-6-monitoring-governance', title: '모니터링·알림과 보안 거버넌스', seconds: 146.5, url: `${BASE}/step3/3-6-monitoring-governance.mp3` },
      { slug: '3-6-structured-output-canary', title: '구조화 출력·카나리 배포·비용 지표', seconds: 157.2, url: `${BASE}/step3/3-6-structured-output-canary.mp3` },
      { slug: '3-7-project-ax-launch', title: '[Project 5] AX 서비스 런칭 준비 가이드', seconds: 63.7, url: `${BASE}/step3/3-7-project-ax-launch.mp3` },
    ],
  },
};

export function getBookAudio(stepId: StepId): BookAudioStep | undefined {
  return BOOK_AUDIO[stepId];
}
