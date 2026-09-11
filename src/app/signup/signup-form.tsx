'use client';

// 회원가입 폼 클라이언트 아일랜드. 로그인 폼과 짝을 이루되 여기만의 것 세 가지가 있다:
//  1) 비밀번호 재입력(confirm) 란 — 입력하는 즉시 일치 여부를 확인해 안내하고, 어긋나면
//     제출 버튼을 잠근다(서버도 다시 검증하므로 클라이언트만 믿지는 않는다).
//  2) 이미 가입된 이메일이면(state.duplicate) 오류를 강조하고 로그인으로 유도한다.
//  3) 하단 링크는 로그인 페이지로 돌아간다.
// 성공 시 서버 액션이 redirect하므로 성공 경로는 다루지 않는다. 서버 전용 모듈은 import하지
// 않는다(게이트 G2) — 서버 액션 참조만 가져온다.

import { useState } from 'react';
import Link from 'next/link';
import { useActionState } from 'react';
import { signUpAction, type SignupState } from './actions';

const INITIAL: SignupState = { error: null, notice: null };

const inputClass =
  'min-h-11 w-full border-2 border-foreground bg-background px-3 py-2 text-body font-normal text-foreground dark:border-foreground-dark dark:bg-background-dark dark:text-foreground-dark';

const mismatchInputClass =
  'min-h-11 w-full border-2 border-destructive bg-background px-3 py-2 text-body font-normal text-foreground dark:border-destructive-dark dark:bg-background-dark dark:text-foreground-dark';

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAction, INITIAL);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // 재입력 란에 뭔가 쳤고, 그 값이 비밀번호와 다를 때만 불일치로 본다(빈 칸은 조용히 둔다).
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-label font-semibold">
          이메일
          <input name="email" type="email" autoComplete="email" inputMode="email" required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-label font-semibold">
          비밀번호
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <span className="text-label font-normal text-muted dark:text-muted-dark">6자 이상</span>
        </label>
        <label className="flex flex-col gap-1 text-label font-semibold">
          비밀번호 재입력
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={mismatch}
            className={mismatch ? mismatchInputClass : inputClass}
          />
          {mismatch ? (
            <span role="alert" className="text-label font-semibold text-destructive dark:text-destructive-dark">
              비밀번호가 일치하지 않아요.
            </span>
          ) : null}
        </label>
        <label className="flex items-center gap-2 text-label font-normal text-muted dark:text-muted-dark">
          <input name="remember" type="checkbox" defaultChecked className="h-4 w-4 accent-accent dark:accent-accent-dark" />
          로그인 정보 저장
        </label>

        {state.error ? (
          <div role="alert" className="flex flex-col gap-1">
            <p className="text-label font-semibold text-accent dark:text-accent-dark">{state.error}</p>
            {state.duplicate ? (
              <Link
                href="/login"
                className="self-start text-label font-semibold text-accent underline underline-offset-2 dark:text-accent-dark"
              >
                로그인하러 가기
              </Link>
            ) : null}
          </div>
        ) : null}
        {state.notice ? (
          <p role="status" className="text-label font-normal text-muted dark:text-muted-dark">
            {state.notice}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || mismatch}
          className="btn-action tap-feedback min-h-11 text-body"
        >
          {pending ? '가입 중…' : '회원가입'}
        </button>
      </form>
      <Link
        href="/login"
        className="self-start text-label font-semibold text-accent underline underline-offset-2 dark:text-accent-dark"
      >
        이미 계정이 있나요? 로그인
      </Link>
    </div>
  );
}
