// 파이썬 손풀기 목록에서 단원 카드의 id. 단원 페이지의 "목록" 링크가 /practice#<id>로 가면
// 목록이 그 카드로 스크롤한다. slug가 숫자로 시작해서(05-...) 앞에 글자를 붙인다.
// 콘텐츠 컬렉션을 불러오지 않는 작은 파일이라 클라이언트 컴포넌트에서도 쓴다.

export function practiceUnitAnchor(slug: string): string {
  return `unit-${slug}`;
}
