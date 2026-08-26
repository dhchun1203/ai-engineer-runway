// 클로즈(빈칸 채우기) 정답 비교용 순수 정규화 함수. 의존성 0.
//
// 빌드 타임의 remark-cloze-blanks.ts(정답 해시 계산)와 런타임의
// cloze-blank.tsx(사용자 입력 판정)가 **반드시 같은 함수**를 써야 한다 — 두
// 벌로 갈라지면 "맞게 쳤는데 틀렸다고 나온다"는 형태로 조용히 깨진다(DD-3).
//
// 순서: NFC 정규화(사파리 입력이 항상 NFC라고 가정하지 않는다) -> 연속 공백을
// 한 칸으로 축약 -> 앞뒤 공백 제거.
export function normalizeAnswer(raw: string): string {
  return raw.normalize('NFC').replace(/\s+/g, ' ').trim();
}
