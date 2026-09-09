import type { TilTemplate } from './types';

type TemplateDef = {
  key: TilTemplate;
  label: string;
  description: string;
  bodySkeleton: string; // 에디터 본문 초기값(마크다운 소제목)
  hints: { summary: string; selfCheck: string; blocked: string };
};

export const TIL_TEMPLATES: readonly TemplateDef[] = [
  {
    key: 'concept',
    label: '개념 노트',
    description: '개념 하나를 내 말로 정리한다.',
    bodySkeleton: [
      '## 왜 / 언제 쓰나',
      '',
      '## 핵심 정리 (내 말로)',
      '',
    ].join('\n'),
    hints: {
      summary: '이 글을 한 문장으로',
      selfCheck: '3일 뒤 나에게: ___? (답은 적지 않는다)',
      blocked: '아직 막히거나 헷갈리는 곳 (없으면 비워도 됨)',
    },
  },
  {
    key: 'bug',
    label: '버그 해결',
    description: '문제와 해결 과정을 기록한다.',
    bodySkeleton: [
      '## 문제 상황',
      '',
      '## 시도한 것들',
      '',
      '## 해결',
      '',
      '## 다음에 또 만나면',
      '',
    ].join('\n'),
    hints: {
      summary: '한 줄로: 뭐가 문제였고 어떻게 풀었나',
      selfCheck: '3일 뒤 나에게: ___? (답은 적지 않는다)',
      blocked: '아직 남은 의문 (없으면 비워도 됨)',
    },
  },
];

export function getTemplate(key: TilTemplate): TemplateDef {
  const found = TIL_TEMPLATES.find((t) => t.key === key);
  if (!found) throw new Error(`알 수 없는 템플릿: ${key}`);
  return found;
}

export function isTilTemplate(v: string): v is TilTemplate {
  return v === 'concept' || v === 'bug';
}
