-- TIL 커버/본문 이미지용 public 스토리지 버킷. public read, 업로드는 service_role(admin) 전용.
-- 멱등: 이미 있으면 무시. (라이브 프로젝트엔 이미 생성돼 있고, 이 파일은 재현성용.)
insert into storage.buckets (id, name, public)
values ('til-image', 'til-image', true)
on conflict (id) do nothing;
