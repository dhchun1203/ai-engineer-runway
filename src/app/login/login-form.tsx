'use client';

// 로그인 폼 클라이언트 아일랜드. 회원가입은 별도 페이지(/signup)로 분리했으므로 이 폼은
// 로그인만 담당한다 — 하단 "계정이 없나요? 회원가입"은 그 페이지로 가는 링크다. 성공 시
// 서버 액션이 redirect하므로 성공 경로는 다루지 않는다. 서버 전용 모듈은 import하지
// 않는다(게이트 G2) — 서버 액션 참조만 가져온다.

import { useActionState } from 'react';
import Link from 'next/link';
import { authAction, type LoginState } from './actions';

const INITIAL: LoginState = { error: null, notice: null };

const inputClass =
  'min-h-11 w-full border-2 border-foreground bg-background px-3 py-2 text-body font-normal text-foreground dark:border-foreground-dark dark:bg-background-dark dark:text-foreground-dark';

export function LoginForm() {
  const [state, formAction, pending] = useActionState(authAction, INITIAL);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-label font-semibold">
          이메일
          <input name="email" type="email" autoComplete="email" inputMode="email" required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-label font-semibold">
          비밀번호
          <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
        </label>
        <label className="flex items-center gap-2 text-label font-normal text-muted dark:text-muted-dark">
          <input name="remember" type="checkbox" defaultChecked className="h-4 w-4 accent-accent dark:accent-accent-dark" />
          로그인 정보 저장
        </label>
        {state.error ? (
          <p role="alert" className="text-label font-semibold text-accent dark:text-accent-dark">
            {state.error}
          </p>
        ) : null}
        {state.notice ? (
          <p role="status" className="text-label font-normal text-muted dark:text-muted-dark">
            {state.notice}
          </p>
        ) : null}
        <button type="submit" disabled={pending} className="btn-action tap-feedback min-h-11 text-body">
          {pending ? '로그인 중…' : '로그인'}
        </button>
      </form>
      <Link
        href="/signup"
        className="self-start text-label font-semibold text-accent underline underline-offset-2 dark:text-accent-dark"
      >
        계정이 없나요? 회원가입
      </Link>
    </div>
  );
}
