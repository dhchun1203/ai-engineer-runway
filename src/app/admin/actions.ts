'use server';

// 관리자(소유자) 전용 승인/거절 Server Action. 페이지가 소유자만 보인다는 것과 별개로,
// 이 액션들은 직접 호출 가능한 POST 엔드포인트이므로 매 호출마다 소유자 세션을 반드시
// 재검증한다(페이지 게이트를 신뢰하지 않는다).

import { revalidatePath } from 'next/cache';
import { isOwnerSession } from '@/lib/owner';
import { approveRequest, rejectRequest } from '@/lib/access';
import { sendApprovalNotice } from '@/lib/email';

export async function approveAction(formData: FormData): Promise<void> {
  if (!(await isOwnerSession())) return;
  const userId = String(formData.get('userId') ?? '');
  if (!userId) return;

  const result = await approveRequest(userId);
  if (result) {
    // 승인 성공 -> 요청자에게 승인 메일(실패해도 승인 자체는 유지).
    await sendApprovalNotice(result.email);
  }
  revalidatePath('/admin');
}

export async function rejectAction(formData: FormData): Promise<void> {
  if (!(await isOwnerSession())) return;
  const userId = String(formData.get('userId') ?? '');
  if (!userId) return;

  await rejectRequest(userId);
  revalidatePath('/admin');
}
