// 베이스캠프 메모의 lesson_note.lesson_id 키를 만드는 단일 지점.
//
// 베이스캠프 레슨(basecampLessons)은 정규 레슨(lessons)과 완전히 분리된 격리
// 컬렉션이지만, 메모는 두 컬렉션이 같은 lesson_note 테이블(텍스트 lesson_id를
// 키로 쓰는 단일 저장소)을 공유한다. 두 컬렉션의 슬러그 공간은 서로 독립적으로
// 유일성만 보장될 뿐 교차 충돌을 막지 않으므로 — 정규 슬러그는 `1-3-...`처럼
// 번호 접두사, 베이스캠프는 `python-dictionaries`처럼 서술형이라 실제 충돌은
// 없지만 구조적으로 보장되지 않는다 — 베이스캠프 메모에는 `basecamp:` 접두사를
// 붙여 정규 레슨 행과 절대 겹치지 않게 한다.
//
// 읽기(app/api/basecamp-note/route.ts)와 쓰기(app/basecamp/[slug]/note-actions.ts)가
// 반드시 같은 키를 쓰도록 키 생성을 이 함수 하나로 모은다 — 양쪽이 각자 접두사를
// 붙이면 한쪽만 바뀌었을 때 저장한 메모를 다시 읽지 못하는 결함이 생긴다.
export function basecampNoteId(slug: string): string {
  return `basecamp:${slug}`;
}
