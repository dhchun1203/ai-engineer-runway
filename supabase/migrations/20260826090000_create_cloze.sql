-- cloze_answer: 클로즈(빈칸 채우기) 필사 기록을 저장하는 단일 테이블. progress
-- 테이블과 완전히 분리된 별도 테이블이다 — 완료 토글·진행률 계산에는 전혀
-- 관여하지 않는다(DD-8). blank_id는 "{lessonSlug}#{index}" 형태로 런타임에
-- 조합된다(DD-6, DD-7) — 이 플러그인/테이블 어느 쪽도 slug를 스스로 추론하지
-- 않는다.
--
-- 중요: 아래에서 이 테이블에 RLS를 켜지만 정책(create policy)은 하나도
-- 만들지 않는다. progress 테이블(20260824120000_create_progress.sql)과 정확히
-- 같은 이유로, 이것은 버그가 아니라 의도된 기본 차단(default-deny) 설계다 —
-- Supabase에서 RLS가 켜져 있고 정책이 0개면 anon/authenticated 역할의 모든
-- 접근(SELECT 포함)이 거부된다. 이 앱은 D-17(공유 시크릿 쿠키 방식)에 따라
-- Supabase Auth를 쓰지 않고, 서버 전용 service_role 키(src/lib/supabase/admin.ts의
-- supabaseAdmin)로만 이 테이블에 접근한다. service_role은 RLS를 완전히
-- 우회하므로 정책 0개와 무관하게 정상 동작한다.
--
-- 미래의 나 자신에게: "anon 키로 조회했더니 빈 배열이 나온다"는 고장이 아니라
-- 이 설계가 의도대로 동작하는 증거다. `using (true)` 같은 "편의 정책"을
-- 추가해서 "고치지" 말 것 — 그 순간 이 테이블은 인터넷에 공개된다.
-- check-supabase-cloze.mjs 7단계가 anon select/insert가 실제로 막히는지
-- 매번 반증한다.
--
-- answer_hash가 왜 있는가(DD-7, 본문 수정 내성): 레슨 본문이 나중에 수정되면
-- 같은 blank_id라도 정답이 달라지거나(순번 밀림 포함) hash가 어긋난다. 읽을
-- 때 blank_id가 같아도 answer_hash가 현재 빈칸의 hash와 다르면 그 기록은
-- 없는 것으로 취급한다(cloze-store.ts/cloze-provider.tsx) — 최악의 결과는
-- "그 레슨의 빈칸 몇 개를 다시 채운다"이고, 다른 용어의 기록이 정답으로
-- 잘못 표시되는 일은 구조적으로 불가능하다. 마이그레이션·백필은 필요 없고,
-- 어긋난 옛 행은 화면에 절대 나타나지 않은 채 남는다(무해, 나중에 일괄 정리
-- 가능).
--
-- 이 프로젝트의 Supabase 프로젝트는 이 앱과 무관한 다른 프로젝트의 테이블
-- (subscribers, search_articles)도 함께 호스팅한다 — cloze_answer 외의
-- 테이블은 절대 건드리지 않는다.

create table if not exists public.cloze_answer (
  blank_id text primary key,        -- "{lessonSlug}#{index}"
  lesson_id text not null,          -- 레슨 단위 조회용(readClozeAnswers)
  answer_hash text not null,        -- 빌드 타임 hash, 어긋나면 기록 무시(DD-7)
  status text not null check (status in ('correct', 'revealed')),
  answered_at timestamptz not null default now()
);

create index if not exists cloze_answer_lesson_id_idx on public.cloze_answer (lesson_id);

alter table public.cloze_answer enable row level security;
