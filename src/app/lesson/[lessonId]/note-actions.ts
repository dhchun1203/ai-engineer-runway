'use server';

// 메모 저장 Server Action. 본문 순서 자체가 보안 계약이다(T-0y8-01) — hasUnlockCookie()
// 재검증 다음 getLessonBySlug() 존재 검증 다음에만 saveLessonNote()를 호출한다.
//
// 기존 actions.ts에 함수를 추가하지 않고 새 파일로 분리한 이유: check-progress-gates.mjs의
// G4가 actions.ts 안에서 특정 식별자들의 등장 "위치"를 계약으로 못박고 있어 그 파일에
// 손대면 초록불이던 게이트가 흔들린다.
//
// revalidatePath를 호출하지 않는다 — 타이핑 멈춤마다 레슨 페이지 전체가 재검증되면
// 자동 저장 1회가 페이지 재렌더 1회가 되고, 그 재렌더가 서버에서 내려주는 값으로
// 입력창을 덮어쓸 위험까지 생긴다. 메모는 이 화면 안에서만 쓰이므로 캐시 무효화
// 대상이 아니다.

import { hasUnlockCookie } from '@/lib/auth';
import { getLessonBySlug } from '@/content/curriculum-helpers';
import { saveLessonNote } from '@/lib/note-store';

export async function saveLessonNoteAction(lessonId: string, body: string): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!getLessonBySlug(lessonId)) {
    // 커리큘럼 매니페스트에 없는 임의 lessonId로는 메모 행을 만들 수 없다.
    throw new Error('invalid lesson');
  }

  // 저장소가 던지는 오류는 잡지 않고 그대로 전파한다 — 클라이언트가 실패를 알아야
  // 저장 표시기를 실패로 바꾼다(입력한 글은 그대로 둔다).
  await saveLessonNote(lessonId, body);
}
