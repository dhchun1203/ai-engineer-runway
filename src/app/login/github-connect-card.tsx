import { ExternalLink } from 'lucide-react';
import { githubAppConfig, getInstallationToken } from '@/lib/github/app';
import { listInstallationRepos } from '@/lib/github/client';
import { getConnection } from '@/lib/github/connection-store';
import { listUnsyncedPublishedSlugs } from '@/lib/til/store';
import { chooseRepoAction, disconnectGithubAction } from './github-actions';
import { GithubBackfillButton } from './github-backfill-button';

// 프로필의 "TIL을 GitHub에도" 카드(설계 문서 "연결 흐름"). 기능이 꺼져 있으면(env 없음)
// 카드 자체를 내지 않는다. status는 콜백이 붙인 ?github= 값.

const STATUS_TEXT: Record<string, string> = {
  connected: 'GitHub 저장소를 연결했어요.',
  choose: '올릴 저장소를 하나 골라 주세요.',
  disconnected: '연결을 끊었어요.',
  error: '연결하지 못했어요. 다시 시도해 주세요.',
  unavailable: '지금은 GitHub 연결을 쓸 수 없어요.',
};

export async function GithubConnectCard({ status }: { status: string | undefined }) {
  if (!githubAppConfig()) return null;
  const conn = await getConnection();
  const message = status ? STATUS_TEXT[status] : undefined;

  let repoChoices: string[] = [];
  if (conn && conn.status === 'ok' && !conn.repoFullName) {
    try {
      repoChoices = await listInstallationRepos(fetch, await getInstallationToken(conn.installationId));
    } catch {
      repoChoices = [];
    }
  }
  const unsynced =
    conn?.status === 'ok' && conn.repoFullName ? (await listUnsyncedPublishedSlugs()).length : 0;

  return (
    <div className="flex flex-col gap-3 border-t-2 border-line pt-4 dark:border-line-dark">
      <span className="text-label font-semibold text-badge-neutral-text dark:text-badge-neutral-text-dark">
        TIL을 GitHub에도
      </span>
      {message ? <p className="text-label font-semibold break-keep">{message}</p> : null}

      {!conn ? (
        <>
          <p className="text-label font-normal break-keep text-badge-neutral-text dark:text-badge-neutral-text-dark">
            TIL을 발행할 때마다 내 GitHub 저장소에도 같은 글이 올라가요.
          </p>
          <a href="/api/github/connect" className="btn tap-feedback w-fit text-body">
            GitHub 저장소 연결
          </a>
        </>
      ) : conn.status === 'broken' ? (
        <>
          <p className="text-label font-normal break-keep">연결이 끊겼어요. 다시 연결해 주세요.</p>
          <div className="flex flex-wrap gap-3">
            <a href="/api/github/connect" className="btn tap-feedback w-fit text-body">
              다시 연결
            </a>
            <form action={disconnectGithubAction}>
              <button type="submit" className="btn tap-feedback text-body">
                연결 정보 지우기
              </button>
            </form>
          </div>
        </>
      ) : !conn.repoFullName ? (
        <form action={chooseRepoAction} className="flex flex-wrap items-center gap-3">
          <select
            name="repo"
            className="min-h-11 border border-foreground bg-surface px-3 text-body dark:border-foreground-dark dark:bg-surface-dark"
          >
            {repoChoices.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-action tap-feedback text-body">
            이 저장소로
          </button>
        </form>
      ) : (
        <>
          <a
            href={`https://github.com/${conn.repoFullName}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1.5 text-body font-bold underline underline-offset-4"
          >
            연결됨: {conn.repoFullName}
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          </a>
          <GithubBackfillButton count={unsynced} />
          <div className="flex flex-wrap items-center gap-3">
            <form action={disconnectGithubAction}>
              <button type="submit" className="btn tap-feedback text-body">
                연결 끊기
              </button>
            </form>
            <a
              href="https://github.com/settings/installations"
              target="_blank"
              rel="noreferrer"
              className="text-label font-semibold underline underline-offset-4"
            >
              GitHub에서 앱 지우기
            </a>
          </div>
        </>
      )}
    </div>
  );
}
