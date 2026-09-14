'use server';

// 회원가입 = "가입 요청" Server Action. 관리자 승인제로 동작한다: 제출해도 바로 로그인되지
// 않고, 유저는 차단 상태로 만들어진 뒤 소유자의 승인을 기다린다. 소유자에게는 요청 알림
// 메일이 나가고, 소유자가 /admin에서 승인하면 요청자에게 승인 메일이 발송된다.
//
// 검증 순서: 입력 존재 -> 비밀번호 길이 -> 비밀번호 재입력 일치 -> 요청 접수(차단 유저 생성
// + 기록 + 소유자 알림). 비밀번호 일치는 클라이언트에서도 즉시 확인하지만 서버에서 반드시
// 재검증한다(클라이언트를 신뢰하지 않는다).

import { createAccessRequest, isValidInviteCode } from '@/lib/access';
import { sendAccessRequestNotice } from '@/lib/email';
import { type AuthState, readCredentials } from '../login/auth-shared';

// 회원가입 폼(useActionState)이 참조하는 상태. duplicate가 true면 "이미 처리된 이메일"을
// 강조하고 로그인으로 유도하는 UI를 폼이 따로 그린다.
export type SignupState = AuthState & { duplicate?: boolean };

export async function signUpAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const { email, password } = readCredentials(formData);
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

  // 수업 초대 코드가 맞으면 자동 승인(바로 로그인). 코드는 서버에서만 검증한다.
  // INVITE_CODE 미설정이면 isValidInviteCode가 항상 false라 기존 수동 승인으로 흐른다.
  const invite = String(formData.get('invite') ?? '');
  const autoApprove = isValidInviteCode(invite);

  const result = await createAccessRequest(email, password, autoApprove);

  if (result.kind === 'error') {
    return { error: '가입 요청 처리에 실패했어요. 잠시 후 다시 시도해 주세요.', notice: null };
  }

  if (result.kind === 'duplicate') {
    if (result.status === 'pending') {
      return {
        error: null,
        notice: '이미 승인 대기 중인 이메일이에요. 관리자 승인 후 로그인할 수 있어요.',
      };
    }
    if (result.status === 'rejected') {
      return { error: '이 이메일은 가입이 승인되지 않았어요. 관리자에게 문의해 주세요.', notice: null };
    }
    // approved
    return {
      error: '이미 가입된 이메일이에요. 아래 "로그인"으로 들어와 주세요.',
      notice: null,
      duplicate: true,
    };
  }

  // 초대 코드로 자동 승인된 경우: 알림 메일 없이 곧바로 로그인 안내.
  if (result.autoApproved) {
    return {
      error: null,
      notice: '가입이 완료됐어요. 이제 로그인 페이지에서 바로 로그인할 수 있어요.',
    };
  }

  // 수동 승인 경로: 소유자에게 알림 메일(실패해도 가입 요청 자체는 유지한다).
  await sendAccessRequestNotice(email);

  return {
    error: null,
    notice:
      '가입 요청이 접수됐어요. 관리자가 승인하면 로그인할 수 있어요. 승인되면 입력하신 이메일로 알려드릴게요.',
  };
}
