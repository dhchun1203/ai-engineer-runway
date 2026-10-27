import type { BasecampQuizQuestion } from "@/content/basecamp-review";

// 수업 복습 회차 데이터(2026-10-26 신설). 레슨 본문은 classLessons 컬렉션(MDX)에 있고,
// 여기에는 회차마다 본문과 짝을 이루는 복습 체크리스트와 확인 퀴즈를 slug로 둔다.
//
// 체크 진도는 베이스캠프 항목과 같은 progress 테이블에 bc: 접두사로 저장한다
// (basecamp.ts의 basecampItemIds가 아래 classItemIds를 받아들인다). 그래서 완료 토글과
// 오프라인 대기열은 toggleBasecampItem을 그대로 쓴다. 항목 id는 "class-" 접두사로
// 베이스캠프 항목 id와 겹치지 않게 한다. 퀴즈 오답은 cl:<slug>:<번호> 키로 오답 노트에 쌓인다.
//
// 퀴즈의 명령 출력은 실제로 실행해 확인한 값이다.

export type ClassChecklistItem = { id: string; label: string };

export type ClassSession = {
  /** classLessons의 slug와 같은 값 */
  slug: string;
  checklist: readonly ClassChecklistItem[];
  quiz: readonly BasecampQuizQuestion[];
};

export const classSessions: readonly ClassSession[] = [
  {
    slug: "01-terminal-git",
    checklist: [
      { id: "class-01-git-version", label: "winget으로 Git 설치 후 git --version 확인" },
      { id: "class-01-ls-al", label: "ls -al 출력의 d, l, - 와 rwx 읽어 보기" },
      { id: "class-01-shortcuts", label: "Ctrl+u, Ctrl+w, history, !번호, cd - 직접 써 보기" },
      { id: "class-01-shell", label: "echo $SHELL 로 셸 종류 확인" },
      { id: "class-01-first-commit", label: "git init → add → commit → log 한 바퀴 해 보기" },
      { id: "class-01-push", label: "GitHub 저장소를 만들어 push 해 보기" },
    ],
    quiz: [
      {
        q: "Git과 GitHub에 대한 설명으로 맞는 것은?",
        options: [
          "GitHub에 연결하지 않으면 커밋을 만들 수 없다",
          "Git은 내 컴퓨터에서 동작하는 도구이고, GitHub는 저장소를 올려 두고 함께 쓰는 서비스다",
          "GitHub가 Git을 만들었고, 2005년에 공개했다",
          "Git은 인터넷에 연결되어 있어야 지난 커밋을 볼 수 있다",
        ],
        answer: 1,
        explain:
          "Git은 분산형이라 내 컴퓨터의 로컬 저장소에 전체 이력이 있어요. 인터넷 없이도 커밋하고 이력을 볼 수 있어요. Git은 리누스 토발즈가 2005년에 만들었고, GitHub는 Git 저장소를 호스팅하는 서비스예요.",
      },
      {
        q: "README.md를 고친 뒤 git add README.md를 실행했어요. 이 변경은 지금 어디에 있나요?",
        options: ["원격 저장소", "Repository(로컬 저장소)", "Staging Area", "아직 Working Directory에만 있다"],
        answer: 2,
        explain:
          "git add는 변경을 Staging Area(다음 커밋에 담을 목록)에 올려요. Repository에 들어가는 건 git commit을 한 다음이고, 원격 저장소로 가는 건 git push를 한 다음이에요.",
      },
      {
        q: "이미 push해서 팀원들이 받아 간 커밋을 취소하고 싶어요. 가장 알맞은 방법은?",
        options: [
          "git revert로 반대 변경을 담은 새 커밋을 만든다",
          "git reset --hard로 그 커밋 이전으로 돌린 뒤 push --force 한다",
          "git reset --soft로 커밋만 취소한다",
          ".git 폴더를 지우고 처음부터 다시 만든다",
        ],
        answer: 0,
        explain:
          "공유된 이력은 revert로 고쳐요. 원래 커밋은 남겨 두고 정반대 변경을 새 커밋으로 쌓으니, 팀원은 pull만 하면 돼요. reset으로 이력을 지우면 팀원의 이력과 어긋나요.",
      },
      {
        q: "git reset --soft HEAD~1 을 실행한 직후, 마지막 커밋에 들어 있던 변경은 어떻게 되나요?",
        options: [
          "완전히 사라진다",
          "작업 폴더에만 남고 Staging Area에서는 빠진다",
          "원격 저장소에서도 함께 지워진다",
          "Staging Area에 그대로 담겨 있다",
        ],
        answer: 3,
        explain:
          "--soft는 커밋만 취소하고 변경은 Staging Area에 그대로 둬요. 실제로 실행 후 git status --short를 보면 맨 앞에 M이 붙은 \"M  README.md\"가 보여요. 작업 폴더에만 남기는 건 --mixed, 변경까지 버리는 건 --hard예요.",
      },
      {
        q: "옵션 없이 git reset HEAD~1 만 실행하면 어떤 옵션과 같나요?",
        options: ["--soft", "--mixed", "--hard", "--keep"],
        answer: 1,
        explain:
          "기본값은 --mixed예요. 커밋과 Staging을 취소하고, 작업 폴더의 변경은 남겨 둬요. 택배로 치면 상자에서 물건을 꺼내 방에 내려놓는 것과 같아요.",
      },
      {
        q: "ls -al 결과에 다음 줄이 보여요. 이 줄에서 알 수 있는 것은?",
        code: "-rw-r--r--  1 user group 12 Oct 26 16:01 README.md",
        options: [
          "폴더이고, 누구나 안에 파일을 만들 수 있다",
          "링크(바로가기)이고, 소유자만 실행할 수 있다",
          "일반 파일이고, 소유자만 쓸 수 있으며 나머지는 읽기만 할 수 있다",
          "일반 파일이고, 누구나 실행할 수 있다",
        ],
        answer: 2,
        explain:
          "첫 글자 -는 일반 파일이에요(d는 폴더, l은 링크). 다음 9글자를 셋씩 끊으면 소유자 rw-, 그룹 r--, 그 외 r--예요. 쓰기(w)는 소유자에게만 있고, 실행(x)은 아무에게도 없어요.",
      },
      {
        q: "다음을 차례로 실행하면 마지막 cat에서 무엇이 보이나요?",
        code: 'echo "A" > note.txt\necho "B" >> note.txt\necho "C" > note.txt\ncat note.txt',
        options: ["A, B, C 세 줄", "A, B 두 줄", "B, C 두 줄", "C 한 줄"],
        answer: 3,
        explain:
          ">>는 파일 끝에 이어 쓰고, >는 파일을 새로 써요. 두 번째 줄까지는 A와 B 두 줄이었지만, 세 번째 줄의 >가 파일을 통째로 다시 써서 C 한 줄만 남아요.",
      },
      {
        q: "cd ~/projects 로 이동한 다음 cd /tmp 로 옮겼어요. 여기서 cd - 를 실행하면?",
        options: ["홈 폴더(~)로 간다", "~/projects로 돌아간다", "한 칸 위 폴더(/)로 간다", "터미널이 종료된다"],
        answer: 1,
        explain:
          "cd -는 바로 전에 있던 폴더로 돌아가요. TV 리모컨의 \"이전 채널\" 버튼처럼 두 폴더를 오갈 때 편해요. 홈 폴더는 cd ~, 한 칸 위는 cd .. 예요.",
      },
      {
        q: "입력하던 긴 명령 줄을 한 번에 전부 지우는 단축키는?",
        options: ["Ctrl + u", "Ctrl + w", "Ctrl + a", "Ctrl + l"],
        answer: 0,
        explain:
          "Ctrl + u는 입력 줄 전체를 지워요. Ctrl + w는 단어 하나씩 지우고, Ctrl + a는 줄 맨 앞으로 이동하고, Ctrl + l은 화면을 정리해요.",
      },
      {
        q: "README.md를 고치고 git add까지 했어요. 이 변경 내용을 확인하려면?",
        options: ["git diff", "git log --oneline", "git diff --staged", "git restore README.md"],
        answer: 2,
        explain:
          "add 한 변경은 git diff --staged로 봐요. 이미 Staging으로 넘어갔기 때문에 git diff는 아무것도 보여 주지 않아요. git restore는 add 하지 않은 수정을 버리는 명령이라 여기서 쓰면 안 돼요.",
      },
      {
        q: "이름이 비슷한 패키지가 많을 때 Git을 가장 안전하게 설치하는 명령은?",
        options: [
          "winget install git",
          "winget install --id Git.Git -e",
          "winget search git --count 5",
          "winget upgrade",
        ],
        answer: 1,
        explain:
          "설치는 ID 기준으로 하고, -e(--exact)로 정확히 일치하는 것만 고르면 엉뚱한 패키지를 받지 않아요. search는 찾기만 하고, upgrade는 이미 설치된 프로그램을 올리는 명령이에요.",
      },
      {
        q: ".env 파일을 실수로 커밋해 GitHub에 push한 뒤에야 .gitignore에 추가했어요. 맞는 설명은?",
        options: [
          ".gitignore에 추가했으니 이제 안전하다",
          "파일을 지우는 커밋을 하나 더 하면 이력에서도 사라진다",
          "push한 적이 있어도 GitHub가 비밀 값은 자동으로 가려 준다",
          "앞선 커밋에 키가 남아 있으니, 키를 새로 발급해 바꿔야 한다",
        ],
        answer: 3,
        explain:
          "한 번 커밋된 내용은 이력에 남아요. 지우는 커밋을 더해도 앞선 커밋을 거슬러 보면 키가 보여요. 그래서 이미 올라간 키는 새로 발급해 바꾸는 게 안전하고, .gitignore는 저장소를 만들자마자 만들어 둬요.",
      },
      {
        q: "브랜치에 대한 설명으로 맞는 것은?",
        options: [
          "특정 커밋을 가리키는 움직이는 포인터다",
          "프로젝트 폴더를 통째로 복사한 사본이다",
          "원격 저장소에만 만들 수 있다",
          "main 브랜치에서는 커밋할 수 없다",
        ],
        answer: 0,
        explain:
          "브랜치는 커밋을 가리키는 책갈피 같은 포인터예요. 새 커밋을 만들면 책갈피가 자동으로 그 커밋으로 옮겨가요. 폴더를 복사하지 않으니 가볍게 만들고 지울 수 있어요.",
      },
    ],
  },
  {
    slug: "02-git-setup-remote",
    checklist: [
      { id: "class-02-config", label: "git config --global --list 로 이름과 이메일 확인 (꼬였으면 --unset-all 후 다시)" },
      { id: "class-02-hooks", label: ".git/hooks 열어 보고, 훅 하나를 .sample 지우고 chmod +x 해 보기" },
      { id: "class-02-status-marks", label: "VS Code의 U, A, M, D 표시를 git status --short 와 맞춰 보기" },
      { id: "class-02-log-graph", label: "브랜치를 하나 만들고 git log --oneline --all --graph 로 갈래 보기" },
      { id: "class-02-remote", label: "빈 GitHub 저장소에 remote add → branch -M main → push -u 해 보기" },
      { id: "class-02-vim", label: "vim 열어서 i, Esc, :wq, :q! 로 들어가고 나와 보기" },
      { id: "class-02-routine", label: "수정부터 push까지 루틴을 소리 내어 설명해 보기" },
    ],
    quiz: [
      {
        q: "rm -rf old-project/ 에서 -r 과 -f 의 뜻으로 맞는 것은?",
        options: [
          "-r 은 휴지통으로 보내기, -f 는 파일만 지우기",
          "-r 은 폴더 안쪽까지 전부, -f 는 확인 없이 강제로",
          "-r 은 읽기 전용 파일 건너뛰기, -f 는 빠르게",
          "-r 은 되살릴 수 있게 지우기, -f 는 폴더만 지우기",
        ],
        answer: 1,
        explain:
          "-r(recursive)은 폴더 안의 폴더와 파일까지 전부, -f(force)는 묻지 않고 지워요. rm에는 휴지통이 없어서, 실행 전에 pwd와 ls로 위치와 대상을 꼭 확인해요.",
      },
      {
        q: "git config --global user.name \"New Name\" 을 쳤더니 \"cannot overwrite multiple values with a single value\" 오류가 났어요. 알맞은 해결은?",
        options: [
          "git config --global --list 를 한 번 더 친다",
          "같은 명령을 -f 를 붙여 다시 친다",
          "git config --global --unset-all user.name 으로 모두 지운 뒤 다시 설정한다",
          ".git 폴더를 지우고 git init 을 다시 한다",
        ],
        answer: 2,
        explain:
          "user.name 에 값이 두 개 이상 들어가 있어서 하나로 덮어쓸 수 없다는 뜻이에요. --unset-all 로 그 항목의 값을 전부 지우고 다시 넣으면 돼요. 실제로 실행해서 확인한 순서예요.",
      },
      {
        q: ".git/hooks 폴더의 pre-commit.sample 을 실제로 동작하게 하려면?",
        options: [
          "파일을 그대로 두고 git commit 을 하면 자동으로 동작한다",
          "파일 이름에서 .sample 을 지우고 실행 권한(chmod +x)을 준다",
          "파일을 저장소 맨 위 폴더로 옮긴다",
          "git push 를 한 번 해야 동작한다",
        ],
        answer: 1,
        explain:
          ".sample 로 끝나는 동안은 예시일 뿐 아무 일도 안 해요. 이름에서 .sample 을 지우고 chmod +x 로 실행 권한을 주면, 그때부터 커밋 직전에 자동으로 돌아가요.",
      },
      {
        q: "내 컴퓨터에서 만든 commit-msg 훅이 팀원 컴퓨터에서는 동작하지 않아요. 이유는?",
        options: [
          ".git 폴더 안의 내용은 push해도 저장소에 올라가지 않기 때문에",
          "commit-msg 훅은 원래 혼자 쓸 때만 동작하기 때문에",
          "GitHub가 보안 때문에 훅을 지우기 때문에",
          "팀원이 git pull 을 두 번 해야 받아지기 때문에",
        ],
        answer: 0,
        explain:
          "훅은 .git/hooks 안에 있어서 저장소와 함께 공유되지 않아요. 팀 전체가 같은 훅을 쓰려면 husky 같은 도구로 훅을 저장소 안의 일반 폴더에 두고 연결해요.",
      },
      {
        q: "커밋 직전에 자동으로 실행되는 훅은?",
        options: ["pre-push", "commit-msg", "pre-commit", "post-update"],
        answer: 2,
        explain:
          "pre-commit 은 커밋 직전, commit-msg 는 커밋 메시지를 쓴 직후(메시지 검사), pre-push 는 push 직전에 돌아가요.",
      },
      {
        q: "VS Code 파일 목록에서 새로 만든 파일 옆에 U 가 보여요. 무슨 뜻인가요?",
        options: [
          "Updated, 방금 수정된 파일",
          "Uploaded, GitHub에 올라간 파일",
          "Unmerged, 합치다 충돌난 파일",
          "Untracked, Git이 아직 추적하지 않는 새 파일",
        ],
        answer: 3,
        explain:
          "U 는 Untracked 예요. git add 로 Staging에 올리면 A(Added)로 바뀌어요. 터미널의 git status --short 에서는 같은 상태가 ?? 로 보여요.",
      },
      {
        q: "git status --short 결과가 다음과 같아요. 맞는 설명은?",
        code: " M a.txt\nA  new.txt",
        options: [
          "a.txt 는 수정 후 아직 add 전이고, new.txt 는 Staging에 추가된 새 파일이다",
          "두 파일 모두 이미 커밋되었다",
          "a.txt 는 Staging에 있고, new.txt 는 아직 추적하지 않는다",
          "a.txt 는 삭제되었고, new.txt 는 수정되었다",
        ],
        answer: 0,
        explain:
          "글자가 오른쪽 칸에 있으면 작업 폴더에만 있는 변경(add 전), 왼쪽 칸에 있으면 Staging에 올라간 변경이에요. A 는 Added, 즉 Staging에 추가된 새 파일이에요.",
      },
      {
        q: "main 에 있으면서 feature 브랜치에만 있는 커밋까지 보고 싶어요. 알맞은 명령은?",
        options: ["git log --oneline", "git log --oneline --all", "git status", "git branch -M main"],
        answer: 1,
        explain:
          "git log 는 기본으로 지금 브랜치(HEAD)에서 거슬러 올라갈 수 있는 커밋만 보여 줘요. --all 을 붙이면 모든 브랜치의 커밋이 나오고, --graph 까지 붙이면 갈라진 모양도 그려 줘요.",
      },
      {
        q: "git log --oneline --all --graph 결과에서 (HEAD -> main) 표시가 뜻하는 것은?",
        code: "* 0d6d2eb (feature) feature work\n| * 95bb6a2 (HEAD -> main) main fix\n|/\n* 36259ec first",
        options: [
          "main 브랜치가 원격 저장소에 올라갔다",
          "feature 브랜치가 main 에 합쳐졌다",
          "지금 main 브랜치에 서 있고, main 은 95bb6a2 커밋을 가리킨다",
          "95bb6a2 커밋이 가장 처음 만든 커밋이다",
        ],
        answer: 2,
        explain:
          "HEAD 는 지금 내가 서 있는 곳이에요. HEAD -> main 은 \"main 브랜치에 있다\"는 뜻이고, 그 줄의 커밋이 main 이 가리키는 커밋이에요. 가장 처음 커밋은 맨 아래 first 예요.",
      },
      {
        q: "내 컴퓨터에 커밋이 이미 있는데, GitHub에서 README를 체크해서 저장소를 만들었어요. git push -u origin main 을 하면?",
        options: [
          "README와 내 커밋이 자동으로 합쳐져 올라간다",
          "원격에 내가 모르는 커밋이 있어서 push가 거절된다 (fetch first)",
          "내 README로 원격 README를 덮어쓴다",
          "GitHub의 README가 내 컴퓨터로 자동으로 내려온다",
        ],
        answer: 1,
        explain:
          "GitHub가 README 커밋을 먼저 만들어서, 원격에 내 컴퓨터에는 없는 작업이 생겨요. 그래서 rejected (fetch first)로 거절돼요. 이미 코드가 있으면 빈 저장소로 만드는 게 가장 간단해요.",
      },
      {
        q: "git push -u origin main 의 -u 가 해 주는 일은?",
        options: [
          "push 하기 전에 자동으로 커밋을 만든다",
          "원격 저장소의 이름을 origin 으로 바꾼다",
          "내 main 과 origin 의 main 을 짝(upstream)으로 기억시켜, 다음부터 git push 만으로 되게 한다",
          "브랜치 이름을 main 으로 바꾼다",
        ],
        answer: 2,
        explain:
          "-u(--set-upstream)는 짝을 기억시켜요. 실행하면 \"branch 'main' set up to track 'origin/main'\"이라고 알려 주고, 그다음부터는 git push, git pull 만 쳐도 돼요.",
      },
      {
        q: "git remote add origin 에 주소를 잘못 넣었어요. 연결을 끊는 명령은?",
        options: ["git remote -v", "git remote remove origin", "git branch -M main", "rm -rf .git"],
        answer: 1,
        explain:
          "git remote remove origin 은 연결만 끊어요. 커밋이나 GitHub에 올라간 내용은 그대로예요. rm -rf .git 은 커밋 이력 전체를 날리니 절대 쓰면 안 돼요.",
      },
      {
        q: "vim 에서 글자를 쓰고 있다가 저장하고 나가려면?",
        options: ["바로 :wq 를 친다", "Ctrl + c 를 누른다", "Esc 를 누른 뒤 :wq 를 치고 Enter", ":q! 를 친다"],
        answer: 2,
        explain:
          "글자를 쓰는 중이면 입력 모드라서 :wq 도 글자로 써져요. Esc 로 명령 모드로 돌아온 뒤 :wq 를 쳐야 저장하고 나가요. :q! 는 저장하지 않고 나가는 명령이에요.",
      },
      {
        q: "파일을 수정한 뒤 GitHub에 올리기까지의 순서로 맞는 것은? (upstream은 이미 설정됨)",
        options: [
          "git push → git add → git commit",
          "git commit → git add → git push",
          "git add → git push → git commit",
          "git status → git add → git commit → git push",
        ],
        answer: 3,
        explain:
          "status 로 바뀐 것을 확인하고, add 로 Staging에 담고, commit 으로 로컬 저장소에 남긴 뒤, push 로 원격에 올려요. 택배로 치면 고르고, 상자에 담고, 송장 붙이고, 보내는 순서예요.",
      },
    ],
  },
];

export const classItemIds: ReadonlySet<string> = new Set(
  classSessions.flatMap((session) => session.checklist.map((item) => item.id)),
);

export function getClassSession(slug: string): ClassSession | undefined {
  return classSessions.find((session) => session.slug === slug);
}
