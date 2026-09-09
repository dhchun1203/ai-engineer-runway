'use server';

// 베이스캠프 항목 완료 토글 Server Action. lesson/[lessonId]/actions.ts의 보안
// 계약을 그대로 따른다: hasUnlockCookie() 재검증 다음, 알려진 항목 id 검증 다음에만
// setLessonCompletion()을 호출한다. Server Action은 컴파일된 POST 엔드포인트라
// 렌더 여부와 무관하게 스스로 재검증해야 한다.
//
// 진도는 커리큘럼과 같은 progress 테이블에 저장하되 basecampProgressId()로 "bc:"
// 접두사를 붙여 커리큘럼 slug와 섞이지 않게 한다. 커리큘럼 진행률 계산은 알려진
// 레슨 slug만 순회하므로 bc: 행을 무시한다(격리).

import { hasUnlockCookie } from '@/lib/auth';
import { setLessonCompletion } from '@/lib/progress-store';
import { basecampItemIds, basecampProgressId } from '@/content/basecamp';

export async function toggleBasecampItem(
  itemId: string,
  currentlyDone: boolean,
): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!basecampItemIds.has(itemId)) {
    // 알려지지 않은 임의 id로는 진도 행을 만들 수 없다.
    throw new Error('invalid basecamp item');
  }

  await setLessonCompletion(basecampProgressId(itemId), !currentlyDone);
}
