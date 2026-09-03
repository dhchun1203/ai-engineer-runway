'use server';

// "이 레슨은 더 공부해야 함" 표시 저장 Server Action. 본문 순서 자체가 보안
// 계약이다 — hasUnlockCookie() 재검증 다음 getLessonBySlug() 존재 검증 다음에만
// saveLessonNeedsReview()를 호출한다(til-actions.ts와 동형).
//
// 기존 actions.ts에 함수를 추가하지 않고 새 파일로 분리한 이유: check-progress-gates.mjs의
// G4가 actions.ts 안에서 특정 식별자들의 등장 "위치"를 계약으로 못박고 있어 그 파일에
// 손대면 초록불이던 게이트가 흔들린다(note-actions.ts·til-actions.ts가 같은 이유로 분리됨).

import { hasUnlockCookie } from '@/lib/auth';
import { getLessonBySlug } from '@/content/curriculum-helpers';
import { saveLessonNeedsReview } from '@/lib/note-store';

export async function setLessonNeedsReviewAction(lessonId: string, needsReview: boolean): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!getLessonBySlug(lessonId)) {
    // 커리큘럼 매니페스트에 없는 임의 lessonId로는 행을 만들 수 없다.
    throw new Error('invalid lesson');
  }

  // 저장소가 던지는 오류는 잡지 않고 그대로 전파한다 — 클라이언트가 실패를 알아야
  // 낙관적 토글을 이전 값으로 되돌린다.
  await saveLessonNeedsReview(lessonId, needsReview);
}
