-- lesson_chat: 레슨당 학습도우미(과외선생님) 대화 한 벌을 저장하는 단일 테이블.
-- lesson_id는 Velite가 생성하는 lesson.slug를 그대로 참조하며 한 slug당 최대 한 행이다.
--
-- messages는 [{role, content}, ...] 형태의 JSONB 배열이다. 행 단위로 쪼개지 않는
-- 이유: 이 대화는 항상 통째로 읽고 통째로 쓴다(모델에 전체 히스토리를 다시 보내야
-- 하므로). 행으로 나누면 매 턴 정렬·조인이 생기는데 1인용 규모에서 얻는 것이 없다.
--
-- RLS 규율은 lesson_note와 동일하다 — RLS를 켜되 정책은 하나도 만들지 않는다.
-- 이것은 버그가 아니라 의도된 기본 차단(default-deny)이다. 이 앱은 Supabase Auth를
-- 쓰지 않고 서버 전용 service_role 키로만 접근하며, service_role은 RLS를 우회한다.
-- `using (true)` 같은 "편의 정책"을 추가해서 "고치지" 말 것 — 그 순간 이 테이블에
-- 담긴 대화 전문이 인터넷에 공개된다.

create table if not exists public.lesson_chat (
  lesson_id text primary key,
  messages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.lesson_chat enable row level security;
