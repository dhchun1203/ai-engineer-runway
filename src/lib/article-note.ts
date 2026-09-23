// 아티클 메모의 lesson_note.lesson_id 키를 만드는 단일 지점. 정규 레슨, 베이스캠프
// 메모와 같은 테이블을 쓰므로 `article:` 접두사로 행이 겹치지 않게 한다. 읽기
// (app/api/article-note/route.ts)와 쓰기(app/articles/[slug]/note-actions.ts)가
// 반드시 이 함수를 쓴다(basecampNoteId와 같은 원칙).
export function articleNoteId(slug: string): string {
  return `article:${slug}`;
}
