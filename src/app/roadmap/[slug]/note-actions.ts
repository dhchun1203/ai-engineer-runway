'use server';

// 로드맵 레슨 메모 저장 Server Action. 베이스캠프 note-actions.ts와 같은 계약이다
// (본문 순서가 계약이다): 열람 권한 재검증 → 슬러그 존재 검증 → saveLessonNote().
// 다른 점은 권한 검사가 hasUnlockCookie()가 아니라 isRoadmapViewer()라는 것 — 로드맵은
// 허용 계정(소유자 + 테스터)만 볼 수 있는 개인 영역이라 페이지와 같은 문으로 막는다.
//
// revalidatePath를 호출하지 않는다 — 메모는 이 화면 안에서만 쓰인다.

import { isRoadmapViewer } from '@/lib/roadmap-access';
import { getRoadmapLessonBySlug } from '@/content/roadmap-lesson-helpers';
import { saveLessonNote } from '@/lib/note-store';
import { roadmapNoteId } from '@/lib/roadmap-note';

export async function saveRoadmapNoteAction(slug: string, body: string): Promise<void> {
  if (!(await isRoadmapViewer())) {
    throw new Error('unauthorized');
  }

  if (!getRoadmapLessonBySlug(slug)) {
    // 로드맵 매니페스트에 없는 임의 슬러그로는 메모 행을 만들 수 없다.
    throw new Error('invalid lesson');
  }

  // 저장소 오류는 그대로 전파한다 — 클라이언트가 실패 표시로 바꾼다(입력한 글은 남는다).
  await saveLessonNote(roadmapNoteId(slug), body);
}
