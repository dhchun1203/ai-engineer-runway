'use server';

// 완료 토글 Server Action. 본문 순서 자체가 보안 계약이다 — hasUnlockCookie() 재검증
// 다음 getLessonBySlug() 존재 검증 다음에만 setLessonCompletion()을 호출한다.
// 페이지가 이 버튼을 렌더했는지와 무관하게 이 함수가 스스로 재검증한다: Server
// Action은 컴파일된 POST 엔드포인트로 존재하므로 렌더된 HTML에 참조가 없어도
// 캡처된 요청이 재전송될 수 있다 (RESEARCH Pitfall 1, PLAT-02 성공 기준 5,
// scripts/check-progress-gates.mjs G4가 이 호출 순서를 문자 위치로 고정한다).

import { revalidatePath } from 'next/cache';
import { hasUnlockCookie } from '@/lib/auth';
import { getLessonBySlug } from '@/content/curriculum-helpers';
import { setLessonCompletion } from '@/lib/progress-store';

export async function toggleLessonComplete(
  lessonId: string,
  currentlyDone: boolean,
): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!getLessonBySlug(lessonId)) {
    // 커리큘럼 매니페스트에 없는 임의 lessonId로는 진도 행을 만들 수 없다
    // (RESEARCH Security Domain V5).
    throw new Error('invalid lesson');
  }

  // 저장소 계층이 던지는 오류는 잡지 않고 그대로 전파한다 — 클라이언트가
  // 실패를 알아야 낙관적 상태를 되돌린다 (D-28).
  await setLessonCompletion(lessonId, !currentlyDone);

  revalidatePath(`/lesson/${lessonId}`);
  revalidatePath('/step/[stepId]', 'page');
  revalidatePath('/');
}
