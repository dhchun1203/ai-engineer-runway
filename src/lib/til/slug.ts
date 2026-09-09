// 제목 → URL slug. 한글은 유지하되 공백·특수문자만 하이픈으로. 비면 'til'.
export function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'til';
}

// 충돌 시 -2, -3 ... 접미사. exists는 store.slugExists를 래핑해 넘긴다.
export async function uniqueSlug(
  base: string,
  exists: (s: string) => Promise<boolean>,
): Promise<string> {
  if (!(await exists(base))) return base;
  for (let n = 2; n < 1000; n++) {
    const cand = `${base}-${n}`;
    if (!(await exists(cand))) return cand;
  }
  return `${base}-${Date.now()}`;
}
