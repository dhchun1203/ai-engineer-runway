'use client';

// 로그인 폼 클라이언트 아일랜드. useActionState로 signInAction의 에러/대기 상태만
// 표시한다 — 성공 시 서버 액션이 redirect('/')하므로 이 컴포넌트는 성공 경로를 다루지
// 않는다. 서버 전용 모듈(supabase/server, supabase/admin)은 import하지 않는다(게이트 G2):
// 서버 액션 함수 참조만 가져온다.

import { useActionState } from 'react';
import { signInAction, type LoginState } from './actions';

const INITIAL: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-label font-semibold">
        이메일
        <input
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          className="min-h-11 w-full border-2 border-foreground bg-background px-3 py-2 text-body font-normal text-foreground dark:border-foreground-dark dark:bg-background-dark dark:text-foreground-dark"
        />
      </label>
      <label className="flex flex-col gap-1 text-label font-semibold">
        비밀번호
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="min-h-11 w-full border-2 border-foreground bg-background px-3 py-2 text-body font-normal text-foreground dark:border-foreground-dark dark:bg-background-dark dark:text-foreground-dark"
        />
      </label>
      {state.error ? (
        <p role="alert" className="text-label font-semibold text-accent dark:text-accent-dark">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="btn-action tap-feedback min-h-11 text-body"
      >
        {pending ? '로그인 중…' : '로그인'}
      </button>
    </form>
  );
}
