'use server';

// 완료 토글 Server Action. 본문 순서 자체가 보안 계약이다 — hasUnlockCookie() 재검증
// 다음 getLessonBySlug() 존재 검증 다음에만 setLessonCompletion()을 호출한다.
// 페이지가 이 버튼을 렌더했는지와 무관하게 이 함수가 스스로 재검증한다: Server
// Action은 컴파일된 POST 엔드포인트로 존재하므로 렌더된 HTML에 참조가 없어도
// 캡처된 요청이 재전송될 수 있다 (RESEARCH Pitfall 1, PLAT-02 성공 기준 5,
// scripts/check-progress-gates.mjs G4가 이 호출 순서를 문자 위치로 고정한다).

import { revalidatePath } from 'next/cache';
import { hasUnlockCookie } from '@/lib/auth';
import { getLessonBySlug } from '@/content/curriculum-helpers';
import { setLessonCompletion } from '@/lib/progress-store';
import { saveClozeAnswer } from '@/lib/cloze-store';

export async function toggleLessonComplete(
  lessonId: string,
  currentlyDone: boolean,
): Promise<void> {
  if (!(await hasUnlockCookie())) {
    throw new Error('unauthorized');
  }

  if (!getLessonBySlug(lessonId)) {
    // 커리큘럼 매니페스트에 없는 임의 lessonId로는 진도 행을 만들 수 없다
    // (RESEARCH Security Domain V5).
    throw new Error('invalid lesson');
  }

  // 저장소 계층이 던지는 오류는 잡지 않고 그대로 전파한다 — 클라이언트가
  // 실패를 알아야 낙관적 상태를 되돌린다 (D-28).
  await setLessonCompletion(lessonId, !currentlyDone);

  revalidatePath(`/lesson/${lessonId}`);
  revalidatePath('/step/[stepId]', 'page');
  revalidatePath('/');
}

// 클로즈(빈칸 채우기) 필사 기록 저장 Server Action. toggleLessonComplete와
// 동일한 보안 계약을 그대로 따른다 — 본문 첫 줄에서 hasUnlockCookie() 재검증
// -> getLessonBySlug() 존재 확인 -> 그 뒤에만 저장. Server Action은 렌더
// 여부와 무관하게 컴파일된 POST 엔드포인트로 존재하므로, 이 페이지가 실제로
// 이 버튼을 렌더했는지와 무관하게 캡처된 요청이 재전송될 수 있다(T-uig-01).
//
// index/hash/status는 클라이언트가 보내는 값을 그대로 신뢰하지 않고 형태를
// 검증한다(T-uig-02) — index는 1~200 정수, hash는 16자리 소문자 hex, status는
// 정확히 두 값 중 하나. 통과 못하면 저장하지 않고 조용히 반환한다(필사는
// 선택적 신호이므로 여기서 오류를 던져 화면을 막지 않는다, DD-9).
//
// revalidatePath를 부르지 않는다(DD-10) — 빈칸 하나 저장할 때마다 레슨
// 페이지를 재렌더하면 포커스와 다른 빈칸의 입력 중 상태가 날아간다. 클라이언트가
// 낙관적 상태를 갖고, 서버 값은 다음 방문 때(페이지 재요청 시) 수렴한다.
const INDEX_RE = /^\d{1,3}$/;
const HASH_RE = /^[0-9a-f]{16}$/;

export async function recordClozeAnswer(
  lessonId: string,
  index: string,
  hash: string,
  status: 'correct' | 'revealed',
): Promise<void> {
  if (!(await hasUnlockCookie())) {
    return;
  }

  const lesson = getLessonBySlug(lessonId);
  if (!lesson) {
    return;
  }

  const indexNum = Number(index);
  if (!INDEX_RE.test(index) || indexNum < 1 || indexNum > 200) {
    return;
  }
  if (!HASH_RE.test(hash)) {
    return;
  }
  if (status !== 'correct' && status !== 'revealed') {
    return;
  }

  const blankId = `${lessonId}#${index}`;
  // 저장소 계층이 던지는 오류는 여기서 삼키지 않고 그대로 전파한다 —
  // toggleLessonComplete와 같은 원칙(D-28)이다: 호출부(cloze-provider.tsx)가
  // 실패를 알아야 조용한 실패 표시를 남길 수 있다. 다만 완료 토글과 달리
  // 오류 배너/모달은 띄우지 않는다(DD-9) — 낙관적 값은 그대로 유지한다.
  await saveClozeAnswer(blankId, lessonId, hash, status);
}
