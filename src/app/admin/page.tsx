import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isOwnerSession } from '@/lib/owner';
import { listPendingRequests } from '@/lib/access';
import { approveAction, rejectAction } from './actions';

// 소유자 전용 + 대기 목록을 열 때마다 최신으로 조회하므로 동적 렌더가 필요하다. 개인
// 관리 화면이라 색인은 막는다. 제목/설명 어디에도 교육기관명을 넣지 않는다(HARD RULE).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '가입 승인',
  robots: { index: false, follow: false },
};

// 요청 시각을 한국 시간 기준으로 짧게 표기한다.
function formatKst(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function AdminPage() {
  // 소유자가 아니면 홈으로 돌려보낸다(로그인 게이트는 이미 통과한 상태).
  if (!(await isOwnerSession())) {
    redirect('/');
  }

  const pending = await listPendingRequests();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-black break-keep">가입 승인</h1>
        <p className="max-w-2xl break-keep text-label font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
          승인 대기 중인 가입 요청이에요. 승인하면 그 사람이 로그인할 수 있게 되고, 입력한
          이메일로 승인 안내가 발송돼요. 이 화면은 나에게만 보입니다.
        </p>
      </header>

      {pending.length === 0 ? (
        <section className="panel flex flex-col gap-2 p-5">
          <h2 className="text-body font-extrabold break-keep">대기 중인 요청이 없어요</h2>
          <p className="text-label font-normal text-muted dark:text-muted-dark">
            새 가입 요청이 들어오면 여기에 표시되고, 내 이메일로도 알림이 와요.
          </p>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {pending.map((req) => (
            <li
              key={req.userId}
              className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <span className="text-body font-extrabold break-all">{req.email}</span>
                <span className="text-label font-normal text-muted dark:text-muted-dark">
                  {formatKst(req.createdAt)} 요청
                </span>
              </div>
              <div className="flex items-center gap-2">
                <form action={approveAction}>
                  <input type="hidden" name="userId" value={req.userId} />
                  <button type="submit" className="btn-action tap-feedback min-h-11 px-4 text-body">
                    승인
                  </button>
                </form>
                <form action={rejectAction}>
                  <input type="hidden" name="userId" value={req.userId} />
                  <button
                    type="submit"
                    className="tap-feedback min-h-11 border-2 border-foreground px-4 text-body font-semibold text-foreground dark:border-foreground-dark dark:text-foreground-dark"
                  >
                    거절
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
