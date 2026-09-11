import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isOwnerSession } from '@/lib/owner';
import { fetchChannelMessages, isSlackConfigured } from '@/lib/slack';
import { SlackRefresh } from '@/components/slack/slack-refresh';

// 소유자 전용 + 열 때마다 슬랙 최신을 조회하므로 동적 렌더가 필요하다. 개인 화면이라
// 색인은 막는다. 제목·설명 어디에도 워크스페이스 이름(교육기관명)을 넣지 않는다(HARD RULE).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '슬랙 피드',
  robots: { index: false, follow: false },
};

export default async function SlackPage() {
  // "우선은 내 계정에만" — 소유자가 아니면 홈으로 돌려보낸다(로그인 게이트는 이미 통과한 상태).
  if (!(await isOwnerSession())) {
    redirect('/');
  }

  const configured = isSlackConfigured();
  const feed = configured ? await fetchChannelMessages(30) : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-display font-black break-keep">슬랙 피드</h1>
          {configured ? <SlackRefresh /> : null}
        </div>
        <p className="max-w-2xl break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          연결된 채널의 최근 글을 모아 봅니다. 페이지를 열 때마다 최신으로 갱신되고,
          머무는 동안에는 새로고침으로 다시 불러옵니다. 이 화면은 나에게만 보입니다.
        </p>
      </header>

      {!configured ? (
        <section className="panel flex flex-col gap-2 p-5">
          <h2 className="text-body font-extrabold break-keep">아직 연결되지 않았어요</h2>
          <p className="break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
            슬랙 봇 토큰과 채널 ID를 환경 변수(SLACK_BOT_TOKEN, SLACK_CHANNEL_ID)에 설정하면
            여기에 채널 글이 표시됩니다. 설정 방법은 안내를 참고하세요.
          </p>
        </section>
      ) : feed && !feed.ok ? (
        <section className="panel flex flex-col gap-2 p-5">
          <h2 className="text-body font-extrabold break-keep">불러오지 못했어요</h2>
          <p className="break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
            슬랙에서 글을 가져오는 데 실패했습니다{feed.error ? ` (${feed.error})` : ''}. 봇이 채널에
            초대되어 있는지, 토큰 권한(scope)이 맞는지 확인해 주세요.
          </p>
        </section>
      ) : feed && feed.ok && feed.messages.length === 0 ? (
        <section className="panel flex flex-col gap-2 p-5">
          <h2 className="text-body font-extrabold break-keep">아직 표시할 글이 없어요</h2>
          <p className="break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
            채널에 사람 글이 올라오면 여기에 최신순으로 모입니다.
          </p>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {feed?.ok
            ? feed.messages.map((m) => (
                <li key={m.ts} className="panel flex flex-col gap-1.5 p-4 sm:p-5">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-body font-extrabold break-keep">{m.author}</span>
                    <span className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                      {m.time}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-keep text-label font-normal leading-relaxed">
                    {m.text}
                  </p>
                </li>
              ))
            : null}
        </ul>
      )}
    </main>
  );
}
