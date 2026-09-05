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
};

export function getBookAudio(stepId: StepId): BookAudioStep | undefined {
  return BOOK_AUDIO[stepId];
}
