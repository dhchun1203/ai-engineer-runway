import type { Metadata } from 'next';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { signOutAction } from '../login/actions';
import { SignupForm } from './signup-form';

// 세션을 읽어 로그인 상태에 따라 폼/안내를 가르므로 동적 렌더가 필요하다. 회원가입 화면은
// 색인할 이유가 없어 로봇을 막는다(login/unlock/done과 같은 방침).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '회원가입',
  robots: { index: false, follow: false },
};

// 현재 로그인한 사용자 이메일(있으면). 다중 사용자 전환 이후 화이트리스트는 보지 않고
// 로그인한 아무 사용자의 이메일을 반환한다 — login 페이지와 같은 기준.
async function currentUserEmail(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export default async function SignupPage() {
  const loggedInEmail = await currentUserEmail();

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-12 sm:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading font-extrabold">회원가입</h1>
        <p className="text-label font-normal text-muted dark:text-muted-dark">
          이메일과 비밀번호로 계정을 만들면 어느 기기에서든 진도·메모가 그대로 이어집니다.
        </p>
      </header>

      {loggedInEmail ? (
        <div className="flex flex-col gap-4">
          <p className="text-body font-normal">
            이미 <strong className="font-bold">{loggedInEmail}</strong> 계정으로 로그인되어 있어요.
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
        <SignupForm />
      )}
    </main>
  );
}
