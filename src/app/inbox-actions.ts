'use server';

// 질문함(/inbox) 추가·완료 토글 Server Action. 본문 순서가 곧 보안 계약이다 —
// hasUnlockCookie() 재검증 → 입력 검증 다음에만 store를 호출한다.
// review-actions.ts와 동형 순서다(Server Action은 컴파일된 POST 엔드포인트라
// 캡처된 요청이 렌더 여부와 무관하게 재전송될 수 있어, 이 함수들이 스스로
// 재검증한다).

import { hasUnlockCookie } from '@/lib/auth';
import { getLessonBySlug } from '@/content/curriculum-helpers';
import { addInboxItem, setInboxItemDone } from '@/lib/inbox-store';

// gen_random_uuid()가 만드는 표준 UUID 형태 검증 — inbox_item.id 위조 방지
// (T-x62-03). 존재하지 않는 id는 store의 update where가 no-op으로 처리한다.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function addInboxQuestion(body: string, lessonId?: string | null): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (typeof body !== 'string' || body.trim().length === 0) {
    throw new Error('invalid body');
  }

  if (lessonId != null && !getLessonBySlug(lessonId)) {
    // 커리큘럼 매니페스트에 없는 임의 lessonId로는 질문을 특정 레슨에 묶을
    // 수 없다(T-x62-05, review/note-actions와 동일한 존재 검증 원칙).
    throw new Error('invalid lesson');
  }

  await addInboxItem(body, lessonId ?? null);
}

export async function toggleInboxDone(id: string, done: boolean): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    throw new Error('invalid id');
  }

  if (typeof done !== 'boolean') {
    throw new Error('invalid done');
  }

  await setInboxItemDone(id, done);
}
