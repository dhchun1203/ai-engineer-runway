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
];

export const classItemIds: ReadonlySet<string> = new Set(
  classSessions.flatMap((session) => session.checklist.map((item) => item.id)),
);

export function getClassSession(slug: string): ClassSession | undefined {
  return classSessions.find((session) => session.slug === slug);
}
