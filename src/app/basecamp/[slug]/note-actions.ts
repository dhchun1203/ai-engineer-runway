'use server';

// 베이스캠프 레슨 메모 저장 Server Action. 정규 레슨의 note-actions.ts와 같은 보안
// 계약을 그대로 따른다(본문 순서가 계약이다): hasUnlockCookie() 재검증 → 슬러그
// 존재 검증 → saveLessonNote() 순서로만 저장한다. 다른 점은 존재 검증을
// getLessonBySlug()가 아니라 getBasecampLessonBySlug()로 하고(격리 컬렉션),
// 저장 키에 basecampNoteId()로 `basecamp:` 접두사를 붙인다는 것뿐이다.
//
// 정규 레슨 액션과 파일을 분리하는 이유: 베이스캠프는 진도·완료·복습이 없는 격리
// 컬렉션이라, 정규 진도 라우트/액션에 베이스캠프 분기를 끼워 넣어 두 계층을 섞는
// 대신 읽기·쓰기 경로를 통째로 따로 둔다(app/api/basecamp-note/route.ts와 대칭).
//
// revalidatePath를 호출하지 않는다 — 메모는 이 화면 안에서만 쓰이므로 캐시 무효화
// 대상이 아니다(정규 note-actions.ts와 동일 근거).

import { hasUnlockCookie } from '@/lib/auth';
import { getBasecampLessonBySlug } from '@/content/basecamp-lesson-helpers';
import { saveLessonNote } from '@/lib/note-store';
import { basecampNoteId } from '@/lib/basecamp-note';

export async function saveBasecampNoteAction(slug: string, body: string): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!getBasecampLessonBySlug(slug)) {
    // 베이스캠프 매니페스트에 없는 임의 슬러그로는 메모 행을 만들 수 없다.
    throw new Error('invalid lesson');
  }

  // 저장소가 던지는 오류는 잡지 않고 그대로 전파한다 — 클라이언트가 실패를 알아야
  // 저장 표시기를 실패로 바꾼다(입력한 글은 그대로 둔다).
  await saveLessonNote(basecampNoteId(slug), body);
}
