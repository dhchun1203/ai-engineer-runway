import 'server-only';
import { getUserDb } from '@/lib/supabase/db';
import { getCurrentUserId, requireCurrentUserId } from '@/lib/current-user';

// 로그인 사용자 본인의 GitHub 연결 한 행(github_connection). 다른 store와 같이
// getUserDb(RLS own_rows) + .eq('user_id') 2겹으로 본인 행만 다룬다.

export type GithubConnection = {
  installationId: number;
  repoFullName: string | null;
  status: 'ok' | 'broken';
};

export async function getConnection(): Promise<GithubConnection | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const db = await getUserDb();
  const { data, error } = await db
    .from('github_connection')
    .select('installation_id, repo_full_name, status')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    installationId: Number(data.installation_id),
    repoFullName: (data.repo_full_name as string | null) ?? null,
    status: data.status === 'broken' ? 'broken' : 'ok',
  };
}

async function write(patch: Record<string, unknown>, upsert: boolean): Promise<void> {
  const userId = await requireCurrentUserId();
  const db = await getUserDb();
  const row = { ...patch, user_id: userId, updated_at: new Date().toISOString() };
  const { error } = upsert
    ? await db.from('github_connection').upsert(row, { onConflict: 'user_id' })
    : await db.from('github_connection').update(row).eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function saveConnection(installationId: number, repoFullName: string | null): Promise<void> {
  await write({ installation_id: installationId, repo_full_name: repoFullName, status: 'ok' }, true);
}

export async function setConnectionRepo(repoFullName: string): Promise<void> {
  await write({ repo_full_name: repoFullName }, false);
}

export async function markConnectionBroken(): Promise<void> {
  await write({ status: 'broken' }, false);
}

export async function deleteConnection(): Promise<void> {
  const userId = await requireCurrentUserId();
  const db = await getUserDb();
  const { error } = await db.from('github_connection').delete().eq('user_id', userId);
  if (error) throw new Error(error.message);
}
