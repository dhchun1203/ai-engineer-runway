export type TilTemplate = 'concept' | 'bug';
export type TilStatus = 'draft' | 'published';

// DB 행을 앱에서 쓰는 camelCase 형태. store.ts가 snake_case 컬럼에서 매핑한다.
export type TilPost = {
  id: string;
  slug: string;
  template: TilTemplate;
  title: string;
  summary: string | null;
  bodyMd: string;
  bodyCode: string;
  selfCheck: string | null;
  understanding: number | null; // 1..5
  blockedPoints: string | null;
  tags: string[];
  seriesId: string | null;
  coverImageUrl: string | null;
  status: TilStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// 에디터 → Server Action이 넘기는 입력(컴파일 전, id는 수정 시에만).
export type TilPostInput = {
  id?: string;
  existingSlug?: string;
  template: TilTemplate;
  title: string;
  summary: string;
  bodyMd: string;
  selfCheck: string;
  understanding: number | null;
  blockedPoints: string;
  tags: string[];
  seriesId: string | null;
  coverImageUrl: string | null;
};

export type TilSeries = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  createdAt: string;
};
