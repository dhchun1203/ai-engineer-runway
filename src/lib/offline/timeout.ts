// 기기 저장소 호출에 시간 제한을 둔다. 옛 WebKit은 IndexedDB 호출을 실패시키지 않고 멈춰
// 두기도 한다. 그러면 레슨을 열 때마다 완료 버튼과 메모장이 스켈레톤에서 멈춘다(온라인이어도).
// 화면을 그리는 길(진도와 메모 불러오기)의 저장소 읽기는 이 함수로 감싸고, 시간이 지나면
// 경고를 남기고 대신할 값(0, 빈 목록, null)으로 넘어간다. 원래 호출은 취소하지 않는다(늦게
// 끝나도 결과를 쓰지 않을 뿐이다).

/** 화면을 그리는 길에서 기기 저장소 읽기를 기다리는 최대 시간. */
export const STORAGE_READ_TIMEOUT_MS = 1_500;

export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      console.warn(`[offline] ${label} took longer than ${ms} ms, continuing without it`);
      resolve(fallback);
    }, ms);
    promise.then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        if (settled) {
          console.warn(`[offline] ${label} failed after its timeout`, error);
          return;
        }
        settled = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
