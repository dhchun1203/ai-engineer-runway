'use server';

import { redirect } from 'next/navigation';
import { requireCurrentUserId } from '@/lib/current-user';
import { getInstallationToken } from '@/lib/github/app';
import { listInstallationRepos } from '@/lib/github/client';
import { getConnection, setConnectionRepo, deleteConnection } from '@/lib/github/connection-store';
import { listUnsyncedPublishedSlugs } from '@/lib/til/store';
import { syncTilPostBySlug } from '@/lib/til/github-sync';

// 프로필 GitHub 카드의 동작들. 전부 로그인 본인의 연결만 다룬다.

export async function chooseRepoAction(formData: FormData): Promise<void> {
  await requireCurrentUserId();
  const repo = String(formData.get('repo') ?? '');
  const conn = await getConnection();
  if (!conn) redirect('/login?github=error');
  // 설치가 실제로 허락한 저장소 중 하나인지 다시 확인한다(폼 값은 위조 가능).
  let repos: string[] = [];
  try {
    repos = await listInstallationRepos(fetch, await getInstallationToken(conn.installationId));
  } catch {
    redirect('/login?github=error');
  }
  if (!repos.includes(repo)) redirect('/login?github=error');
  await setConnectionRepo(repo);
  redirect('/login?github=connected');
}

export async function disconnectGithubAction(): Promise<void> {
  await requireCurrentUserId();
  await deleteConnection();
  redirect('/login?github=disconnected');
}

export async function backfillGithubAction(): Promise<{ uploaded: number; failed: number }> {
  await requireCurrentUserId();
  let uploaded = 0;
  let failed = 0;
  // 한 편씩 차례로(동시에 쓰면 같은 저장소 커밋끼리 충돌한다).
  for (const slug of await listUnsyncedPublishedSlugs()) {
    const res = await syncTilPostBySlug(slug);
    if (res.ok) uploaded += 1;
    else failed += 1;
  }
  return { uploaded, failed };
}
