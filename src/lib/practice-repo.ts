// 파이썬 손풀기에서 쓰는 내 GitHub 저장소 주소. 저장은 lesson_note 행 하나로 한다(별도 테이블을
// 둘 만큼의 자료가 아니다). /notes는 아는 레슨 slug만 고르므로 이 행이 노트에 섞이지 않는다.
export const PRACTICE_REPO_NOTE_ID = "practice:repo";

const OWNER_REPO = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;

/**
 * 입력한 주소를 https://github.com/아이디/저장소 꼴로 바꾼다. GitHub 저장소 주소가 아니면 null.
 * 저장한 값은 그대로 링크가 되므로, javascript: 같은 주소가 끼어들지 않게 이 꼴만 통과시킨다.
 * git remote에 쓰는 주소(.git으로 끝나는 것)와 https를 뺀 주소도 받는다.
 */
export function normalizeRepoUrl(input: string): string | null {
  const text = input.trim();
  const path = text.replace(/^(https:\/\/)?(www\.)?github\.com\//i, "");
  if (path === text) return null;
  const ownerRepo = path.replace(/\/+$/, "").replace(/\.git$/, "");
  return OWNER_REPO.test(ownerRepo) ? `https://github.com/${ownerRepo}` : null;
}
