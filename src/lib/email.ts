import 'server-only';

// 승인제 가입에서 나가는 두 종류의 메일을 보낸다.
//   1) 새 가입 요청 알림  -> 소유자(OWNER_EMAIL) 본인에게
//   2) 가입 승인 완료 알림 -> 요청자 본인에게
// Supabase 기본 인증 메일은 "가입자 본인 주소로, 정해진 문구로만" 나가므로 이 흐름(소유자에게
// 알림 + 임의 주소에 커스텀 승인 메일)에는 쓸 수 없다. 그래서 Gmail SMTP(nodemailer)로 직접
// 보낸다. 발신 계정은 소유자 지메일이고 비밀번호는 Gmail "앱 비밀번호"다.
//
// 브랜딩 HARD RULE: 어떤 문구에도 교육기관명을 넣지 않는다. 항상 "AI Engineer 교육과정".

import nodemailer from 'nodemailer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ai-engineer-hub-kr.vercel.app';
const FROM_NAME = 'AI Engineer 사전학습';

// 발신에 필요한 값이 모두 있을 때만 transport를 만든다. 없으면 null을 돌려주고 호출부는
// 메일을 건너뛴다(가입 자체는 실패시키지 않는다 — 메일은 부수 효과이지 가입의 성공 조건이 아니다).
function getTransport() {
  const user = process.env.OWNER_EMAIL?.trim();
  // 앱 비밀번호는 보통 4글자씩 공백으로 끊어 표기되지만 실제 값엔 공백이 없다. 안전하게 제거.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

function ownerAddress(): string | null {
  const owner = process.env.OWNER_EMAIL?.trim();
  return owner && owner.length > 0 ? owner : null;
}

/** 새 가입 요청이 들어왔음을 소유자에게 알린다. 성공 여부를 boolean으로 돌려준다(예외를 삼킨다). */
export async function sendAccessRequestNotice(requesterEmail: string): Promise<boolean> {
  const transport = getTransport();
  const owner = ownerAddress();
  if (!transport || !owner) return false;

  const adminUrl = `${SITE_URL}/admin`;
  try {
    await transport.sendMail({
      from: `${FROM_NAME} <${owner}>`,
      to: owner,
      subject: `[가입 요청] ${requesterEmail}`,
      text:
        `새 가입 요청이 들어왔어요.\n\n` +
        `요청자 이메일: ${requesterEmail}\n\n` +
        `승인 또는 거절하려면 관리자 페이지를 여세요:\n${adminUrl}\n\n` +
        `승인하면 요청자에게 자동으로 승인 안내 메일이 발송됩니다.`,
    });
    return true;
  } catch (err) {
    console.error('sendAccessRequestNotice 실패:', err);
    return false;
  }
}

/** 가입이 승인되었음을 요청자에게 알린다. 성공 여부를 boolean으로 돌려준다(예외를 삼킨다). */
export async function sendApprovalNotice(requesterEmail: string): Promise<boolean> {
  const transport = getTransport();
  const owner = ownerAddress();
  if (!transport || !owner) return false;

  const loginUrl = `${SITE_URL}/login`;
  try {
    await transport.sendMail({
      from: `${FROM_NAME} <${owner}>`,
      to: requesterEmail,
      subject: '가입이 승인되었어요',
      text:
        `AI Engineer 교육과정 사전학습 사이트 가입이 승인되었어요.\n\n` +
        `이제 아래 주소에서 가입할 때 정한 이메일과 비밀번호로 로그인할 수 있어요:\n${loginUrl}\n\n` +
        `학습을 시작해 보세요.`,
    });
    return true;
  } catch (err) {
    console.error('sendApprovalNotice 실패:', err);
    return false;
  }
}
