// TIL 저장 뒤 GitHub 반영이 실패했을 때 글 화면 위에 띄우는 한 줄 안내(?github=failed).
// 사이트 저장은 이미 성공했다는 점을 먼저 말한다.
export function GithubSyncNotice({ failed }: { failed: boolean }) {
  if (!failed) return null;
  return (
    <p className="panel border-l-4 border-l-destructive px-4 py-3 text-label font-semibold break-keep dark:border-l-destructive-dark">
      사이트에는 저장됐지만 GitHub에는 올리지 못했어요. 프로필에서 GitHub 연결 상태를 확인해 주세요.
    </p>
  );
}
