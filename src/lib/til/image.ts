// TIL 이미지 저장 규칙(2026-11-13, 본인만 보기). 올리기(til/actions.ts)와 내려주기
// (api/til-image 라우트)가 같은 버킷 이름, 허용 형식, 주소 모양을 쓰게 한 곳에 모은다.
// 버킷은 비공개이고 파일은 "<user_id>/<파일 이름>"에 있다(마이그레이션
// 20261113120000_til_image_private.sql의 저장소 규칙).

export const TIL_IMAGE_BUCKET = 'til-image';

/** 올릴 수 있는 형식과 저장할 확장자. SVG는 스크립트를 품을 수 있어 받지 않는다. */
export const TIL_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

/** 저장소 경로("<user_id>/<파일 이름>")를 화면에서 쓰는 주소로 바꾼다. */
export function tilImageUrl(path: string): string {
  return `/api/til-image/${path}`;
}
