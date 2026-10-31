'use server';

// 파이썬 손풀기 단원 완료 토글. basecamp/actions.ts와 같은 보안 계약이다: hasUnlockCookie()
// 재검증 다음, 알려진 단원 slug 검증 다음에만 setLessonCompletion()을 부른다. Server Action은
// 컴파일된 POST 엔드포인트라 렌더 여부와 무관하게 스스로 재검증해야 한다.
//
// 진도는 pr: 접두사로 저장해 커리큘럼 진행률과 섞이지 않는다(practice-helpers.ts).

import { hasUnlockCookie } from '@/lib/auth';
import { setLessonCompletion } from '@/lib/progress-store';
import { getPracticeUnitBySlug, practiceProgressId } from '@/content/practice-helpers';

export async function togglePracticeUnit(slug: string, currentlyDone: boolean): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!getPracticeUnitBySlug(slug)) {
    // 알려지지 않은 임의 slug로는 진도 행을 만들 수 없다.
    throw new Error('invalid practice unit');
  }

  await setLessonCompletion(practiceProgressId(slug), !currentlyDone);
}
