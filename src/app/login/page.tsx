import type { Metadata } from 'next';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LoginForm } from './login-form';
import { signOutAction } from './actions';

// 세션을 읽어 로그인 상태에 따라 폼/로그아웃을 가르므로 동적 렌더가 필요하다.
// 로그인 화면은 색인할 이유가 없어 로봇을 막는다(unlock/done과 같은 방침).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '로그인',
  robots: { index: false, follow: false },
};

// 현재 로그인한 소유자 이메일(있으면). OWNER_EMAIL과 일치하는 세션일 때만 반환한다 —
// auth.ts의 게이트 판정과 같은 기준을 쓴다.
async function currentOwnerEmail(): Promise<string | null> {
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!owner) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    if (email && email.trim().toLowerCase() === owner) return email;
    return null;
  } catch {
    return null;
  }
}

export default async function LoginPage() {
  const loggedInEmail = await currentOwnerEmail();

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading font-extrabold">로그인</h1>
        <p className="text-label font-normal text-muted dark:text-muted-dark">
          이메일과 비밀번호로 로그인하면 어느 기기에서든 진도·메모가 그대로 이어집니다.
        </p>
      </header>

      {loggedInEmail ? (
        <div className="flex flex-col gap-4">
          <p className="text-body font-normal">
            현재 <strong className="font-bold">{loggedInEmail}</strong> 계정으로 로그인되어 있어요.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="btn-action tap-feedback min-h-11 text-body">
              홈으로
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="chip tap-feedback min-h-11 text-body">
                로그아웃
              </button>
            </form>
          </div>
        </div>
      ) : (
        <LoginForm />
      )}
    </main>
  );
}
