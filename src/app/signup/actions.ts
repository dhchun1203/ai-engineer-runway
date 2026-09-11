'use server';

// 회원가입 Server Action. 로그인과 같은 보안 계약을 따른다 — 소유자 화이트리스트
// (OWNER_EMAIL 일치)를 먼저 통과한 이메일만 Supabase Auth에 넘긴다. 이 사이트는 다른 앱과
// 같은 Supabase 프로젝트(auth.users)를 공유하므로, 화이트리스트는 "아무나 이 공유
// 프로젝트에 계정을 만드는 것"을 막는 필수 방어다(1인용 개인 사이트).
//
// 검증 순서: 입력 존재 → 비밀번호 길이 → 비밀번호 재입력 일치 → 소유자 → 가입.
// 비밀번호 일치는 클라이언트에서도 즉시 확인하지만 여기서 반드시 재검증한다(클라이언트를
// 신뢰하지 않는다). 중복 이메일은 두 경로로 잡는다(아래 doSignUp 주석 참고).

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  type AuthState,
  readCredentials,
  writePersistCookie,
} from '../login/auth-shared';

// 회원가입 폼(useActionState)이 참조하는 상태. duplicate가 true면 "이미 가입된 이메일"을
// 강조하고 로그인으로 유도하는 UI를 폼이 따로 그린다.
export type SignupState = AuthState & { duplicate?: boolean };

export async function signUpAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const { email, password, remember } = readCredentials(formData);
  const confirm = String(formData.get('confirm') ?? '');

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 모두 입력해 주세요.', notice: null };
  }
  if (password.length < 6) {
    return { error: '비밀번호는 6자 이상이어야 해요.', notice: null };
  }
  if (password !== confirm) {
    // 클라이언트에서 이미 걸렀어야 하지만, 서버에서 반드시 다시 확인한다.
    return { error: '비밀번호가 일치하지 않아요. 다시 확인해 주세요.', notice: null };
  }

  // 다중 사용자 전환: 이메일 화이트리스트는 없앴다 — 누구나 가입할 수 있다.
  const supabase = await createSupabaseServerClient({ persist: remember });
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    // 이메일 확인이 꺼진 프로젝트는 기존 이메일에 대해 명시적 오류를 준다.
    if (/registered|already|exist/i.test(error.message)) {
      return {
        error: '이미 가입된 이메일이에요. 아래 "로그인"으로 들어와 주세요.',
        notice: null,
        duplicate: true,
      };
    }
    return { error: '회원가입에 실패했어요. 잠시 후 다시 시도해 주세요.', notice: null };
  }

  // 이메일 확인이 켜진 프로젝트는 열거 공격을 막으려고 기존 이메일에도 오류 없이
  // "성공"을 돌려주되, user.identities를 빈 배열로 준다 — 이 신호로 중복을 판정한다.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return {
      error: '이미 가입된 이메일이에요. 아래 "로그인"으로 들어와 주세요.',
      notice: null,
      duplicate: true,
    };
  }

  // 이메일 확인이 꺼진 프로젝트면 세션이 바로 발급된다 → 로그인 완료로 처리.
  if (data.session) {
    const cookieStore = await cookies();
    writePersistCookie(cookieStore, remember);
    redirect('/');
  }

  // 이메일 확인이 켜진 경우 — 확인 메일 안내.
  return {
    error: null,
    notice: '확인 이메일을 보냈어요. 메일의 링크로 인증한 뒤 "로그인"으로 들어와 주세요.',
  };
}
