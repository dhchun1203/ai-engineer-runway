// 잠금 값 판정 순수 함수 — 어떤 것도 import하지 않는다. 그래야 게이트 스크립트가
// Node에서 이 파일을 직접 로드해 단위 검증할 수 있다 (scripts/check-progress-gates.mjs G11).

export const UNLOCK_COOKIE_NAME = 'runway_unlock';

/**
 * secret이 비어 있거나 길이가 16 미만이면 무조건 false를 반환한다. 이 가드가
 * 이 파일의 존재 이유다 — 가드가 없으면 시크릿이 설정되지 않은 서버에서 쿠키
 * 없는 요청의 candidate(undefined)와 환경 변수의 secret(undefined)이 서로
 * 같아져 모든 방문자가 잠금 해제 상태로 판정된다 (critical, T-02-15).
 *
 * 가드를 통과한 뒤에만 candidate === secret 엄격 비교를 한다. 타이밍 안전
 * 비교는 쓰지 않는다 — 1인용·단일 정적 시크릿의 위협 모델에서 과설계이며
 * RESEARCH가 이를 명시적으로 수용했다 (A3, Don't Hand-Roll).
 */
export function isValidUnlockValue(
  candidate: string | undefined,
  secret: string | undefined,
): boolean {
  if (!secret || secret.length < 16) {
    return false;
  }
  if (!candidate) {
    return false;
  }
  return candidate === secret;
}
