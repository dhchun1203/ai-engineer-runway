-- TIL 이미지를 본인만 볼 수 있게 한다(2026-11-13).
--
-- 예전: til-image 버킷이 공개(public)라, 이미지 주소만 알면 로그인 없이 누구나 볼 수 있었다.
-- TIL 글 자체는 계정별 사설인데 이미지만 열려 있던 셈이다. 올리기도 service_role로 해서
-- 저장소 규칙이 없었다.
--
-- 이제:
--   1) 버킷을 비공개로 돌린다. 공개 주소(/storage/v1/object/public/...)는 더 이상 열리지 않는다.
--   2) 파일은 "<user_id>/<파일 이름>" 폴더에 둔다. 저장소 규칙은 첫 폴더 이름이 로그인한
--      본인 id일 때만 읽기, 올리기, 지우기를 허락한다(다른 사용자 데이터 표의 auth.uid()=user_id와 같은 뜻).
--   3) 앱은 로그인 본인 자격(getUserDb)으로 올리고 읽는다. 화면에는 /api/til-image/<경로>로
--      내보내며, 그 라우트가 세션을 확인한 뒤 본인 자격으로 내려받아 넘긴다.
-- 적용 시점에 버킷의 파일은 0개라 옮길 파일이 없다.

update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/gif', 'image/webp']
where id = 'til-image';

create policy "til_image_own_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'til-image' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "til_image_own_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'til-image' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "til_image_own_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'til-image' and (storage.foldername(name))[1] = (select auth.uid())::text);
