// TIL 글 한 편을 GitHub 저장소의 파일 하나로 옮기는 순수 함수들(경로, 내용, 무엇을 할지).
// 런타임 import가 없어야 한다 — scripts/test-github-sync.mjs가 node --test로 이 파일을
// 직접 불러 테스트한다(경로 별칭 @/는 Node가 못 푼다).
//
// 내용에는 이해도와 막힌 점을 넣지 않는다(개인 기록, 설계 문서 "파일 내용").
// 복사 버튼용 postToMarkdown(markdown.ts)과 일부러 따로 둔다.

export type TilFileInput = {
  slug: string;
  title: string;
  summary: string | null;
  tags: string[];
  bodyMd: string;
  selfCheck: string | null;
};

export type SyncStatus = 'draft' | 'published' | 'deleted';

export type SyncPlan =
  | { op: 'put'; path: string }
  | { op: 'delete'; path: string }
  | { op: 'none' };

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// YYYY/MM/YYYY-MM-DD-<slug>.md, 날짜는 한국 시간. 처음 올릴 때 한 번만 정하고
// til_post.github_path에 저장해 다시 쓴다(수정해도 파일이 늘지 않게).
export function tilFilePath(slug: string, now: Date): string {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}/${m}/${y}-${m}-${d}-${slug}.md`;
}

export function tilFileContent(post: TilFileInput): string {
  const parts: string[] = [`# ${post.title}`];

  const summary = post.summary?.trim();
  if (summary) parts.push(summary.split('\n').map((line) => `> ${line}`).join('\n'));

  const tags = post.tags.map((t) => t.trim()).filter(Boolean);
  if (tags.length > 0) parts.push(`태그: ${tags.map((t) => `#${t.replace(/\s+/g, '-')}`).join(' ')}`);

  const body = post.bodyMd.trim();
  if (body) parts.push(body);

  const selfCheck = post.selfCheck?.trim();
  if (selfCheck) parts.push(`## 셀프 체크\n\n${selfCheck}`);

  return parts.join('\n\n') + '\n';
}

// 설계 문서 "업로드 규칙" 표 그대로. 발행이면 있던 경로(없으면 새 경로)에 쓰고,
// 초고로 되돌리거나 지우면 올라가 있던 파일만 지운다.
export function planSync(input: {
  status: SyncStatus;
  githubPath: string | null;
  slug: string;
  now: Date;
}): SyncPlan {
  if (input.status === 'published') {
    return { op: 'put', path: input.githubPath ?? tilFilePath(input.slug, input.now) };
  }
  return input.githubPath ? { op: 'delete', path: input.githubPath } : { op: 'none' };
}
