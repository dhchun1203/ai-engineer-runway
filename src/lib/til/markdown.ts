import type { TilPost } from './types';

// TIL 글 한 편을 "제목 포함 전체"의 마크다운 문자열로 만든다(복사 버튼용).
// 저장된 body_md(원문 마크다운)를 그대로 쓰고, 앞뒤로 제목·요약·메타를 붙인다.
// 순수 함수 — 서버에서 만들어 클라이언트 버튼에 문자열로 넘긴다.
export function postToMarkdown(post: TilPost): string {
  const parts: string[] = [`# ${post.title}`];

  if (post.summary) parts.push(post.summary);

  const body = post.bodyMd.trim();
  if (body) parts.push(body);

  if (post.blockedPoints) parts.push(`## 🔴 아직 막힌 곳\n\n${post.blockedPoints}`);
  if (post.selfCheck) parts.push(`## 셀프 체크 질문\n\n${post.selfCheck}`);

  const meta: string[] = [];
  if (post.understanding) meta.push(`이해도 ${post.understanding}/5`);
  if (post.tags.length > 0) meta.push(`태그: ${post.tags.map((t) => `#${t}`).join(' ')}`);
  if (meta.length > 0) parts.push(`---\n\n${meta.join('\n')}`);

  return parts.join('\n\n') + '\n';
}
