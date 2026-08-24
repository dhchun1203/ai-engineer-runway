// 진행률 계산의 심장 — 의존성 0 순수 모듈. import 문을 하나도 쓰지 않는다.
// 그래야 Node가 이 파일을 별도 트랜스파일러 없이 그대로 로드할 수 있고
// (scripts/check-progress-math.mjs), 화면 작업이 계산 정확성을 다시 의심하지
// 않아도 된다 (D-26).

export type ProgressCounts = { completed: number; total: number; percent: number };

/**
 * 주어진 slug 목록을 기준으로 완료 개수·전체 개수·퍼센트를 센다.
 * 완료 집합의 크기를 그대로 쓰지 않고 slug 목록을 순회하며 포함 여부를 센다 —
 * 그래야 다른 Step/모듈의 완료가 이 집계에 섞이지 않는다 (T-02-20).
 * 입력 Set·배열은 변형하지 않는다.
 */
export function aggregate(
  completedIds: ReadonlySet<string>,
  slugs: readonly string[],
): ProgressCounts {
  const total = slugs.length;
  let completed = 0;
  for (const slug of slugs) {
    if (completedIds.has(slug)) {
      completed += 1;
    }
  }
  const percent = total === 0 ? 0 : Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
  return { completed, total, percent };
}

/**
 * 순서 배열을 앞에서부터 훑어 완료 집합에 없는 첫 slug를 돌려준다.
 * 전부 완료됐거나 배열이 비어 있으면 null.
 */
export function firstIncompleteSlug(
  completedIds: ReadonlySet<string>,
  orderedSlugs: readonly string[],
): string | null {
  for (const slug of orderedSlugs) {
    if (!completedIds.has(slug)) {
      return slug;
    }
  }
  return null;
}
