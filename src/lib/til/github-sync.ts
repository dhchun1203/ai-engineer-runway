import 'server-only';
import { githubAppConfig, getInstallationToken } from '@/lib/github/app';
import { GithubError, putFile, deleteFile } from '@/lib/github/client';
import { getConnection, markConnectionBroken } from '@/lib/github/connection-store';
import { planSync, tilFileContent, type SyncStatus } from './github-file';
import { getSyncRowBySlug, setGithubPath, type TilSyncRow } from './store';

// TIL 글 한 편을 연결된 GitHub 저장소에 반영한다(설계 문서 "업로드 규칙", "실패 처리").
// 연결이 없거나 기능이 꺼져 있으면 아무것도 안 하고 성공으로 끝난다(경고 없음).
// GitHub 쪽 실패는 결과로만 알리고 throw하지 않는다 — 사이트 저장을 되돌리지 않는다.

export type GithubSyncResult = { ok: true } | { ok: false; error: string };

// 앱이 지워졌거나 저장소 접근이 사라졌을 때 GitHub이 주는 상태 코드.
const ACCESS_LOST = new Set([401, 403, 404]);

export async function syncTilPost(row: TilSyncRow, status: SyncStatus): Promise<GithubSyncResult> {
  if (!githubAppConfig()) return { ok: true };
  const conn = await getConnection();
  if (!conn || conn.status !== 'ok' || !conn.repoFullName) return { ok: true };

  const plan = planSync({ status, githubPath: row.githubPath, slug: row.slug, now: new Date() });
  if (plan.op === 'none') return { ok: true };

  try {
    const token = await getInstallationToken(conn.installationId);
    if (plan.op === 'put') {
      await putFile(fetch, token, conn.repoFullName, plan.path, tilFileContent(row), `til: ${row.title}`);
      if (row.githubPath !== plan.path) await setGithubPath(row.id, plan.path);
    } else {
      await deleteFile(fetch, token, conn.repoFullName, plan.path, `til: ${row.title} 삭제`);
      if (status !== 'deleted') await setGithubPath(row.id, null);
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof GithubError && ACCESS_LOST.has(e.status)) {
      await markConnectionBroken().catch(() => {});
    }
    console.error('[til-github-sync]', e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function syncTilPostBySlug(slug: string): Promise<GithubSyncResult> {
  const row = await getSyncRowBySlug(slug);
  if (!row) return { ok: true };
  return syncTilPost(row, row.status);
}
