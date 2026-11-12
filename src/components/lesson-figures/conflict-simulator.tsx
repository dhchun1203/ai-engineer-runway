"use client";

// 4회차 충돌 풀기 시뮬레이터. 레슨 3절 실습과 같은 저장소다: base는 a.txt = hello, main은
// "main 수정", feature는 "feature 수정"으로 바꿔 커밋했고, 지금 main에 서 있다.
// 명령 버튼 하나가 명령 한 번이다. 출력 창의 글자는 임시 저장소에서 실제로 돌린 git 출력
// 그대로이고(긴 안내는 레슨처럼 앞부분만), 왜 그렇게 됐는지는 뒤에 # 주석으로 붙인다.
// 고치기 버튼(VS Code의 Accept ...)은 add 전에만 누를 수 있게 막아 둔다.

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

type Line = { text: string; why?: string; tone?: "cmd" | "ok" | "warn" | "dim" };
type Phase = "before" | "merging" | "done";

const MARKERS = ["<<<<<<< HEAD", "main 수정", "=======", "feature 수정", ">>>>>>> feature"];
const CURRENT = ["main 수정"];
const INCOMING = ["feature 수정"];
const BOTH = ["main 수정", "feature 수정"];
const START: Line[] = [{ text: "main에 서 있어요. a.txt = main 수정", tone: "dim" }];

const same = (a: string[], b: string[]) => a.join("\n") === b.join("\n");
const hasMarkers = (f: string[]) => f.some((l) => /^(<<<<<<<|=======|>>>>>>>)/.test(l));

// 표시 줄 사이에서 지금 줄이 어느 쪽 내용인지 색으로 나눈다(위 = current, 아래 = incoming).
function colorLines(file: string[], muted: string) {
  const out: { l: string; cls: string }[] = [];
  let side: "none" | "current" | "incoming" = "none";
  for (const l of file) {
    if (l.startsWith("<<<<<<<")) side = "current";
    else if (l.startsWith("=======")) side = "incoming";
    else if (l.startsWith(">>>>>>>")) side = "none";
    else {
      out.push({
        l,
        cls: side === "current" ? "text-accent dark:text-accent-dark" : side === "incoming" ? "text-action dark:text-action-dark" : "",
      });
      continue;
    }
    out.push({ l, cls: `font-semibold ${muted}` });
  }
  return out;
}

export function ConflictSimulator() {
  const [phase, setPhase] = useState<Phase>("before");
  const [file, setFile] = useState<string[]>(CURRENT);
  const [staged, setStaged] = useState(false);
  const [log, setLog] = useState<Line[]>(START);
  const logRef = useRef<HTMLDivElement>(null);

  const push = (lines: Line[]) => {
    setLog((prev) => [...prev, ...lines].slice(-80));
    requestAnimationFrame(() => {
      const el = logRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };
  const say = (cmd: string, lines: Line[]) => push([{ text: cmd, tone: "cmd" }, ...lines]);
  const silent = (why: string): Line => ({ text: "(출력 없음)", why, tone: "dim" });

  const merge = () => {
    const cmd = "$ git merge feature";
    if (phase === "done") return say(cmd, [{ text: "Already up to date.", why: "이미 합쳤어요" }]);
    if (phase === "merging" && staged)
      return say(cmd, [
        { text: "fatal: You have not concluded your merge (MERGE_HEAD exists).", tone: "warn" },
        { text: "Please, commit your changes before you merge.", tone: "warn", why: "지금 merge를 마무리하는 중이에요" },
      ]);
    if (phase === "merging")
      return say(cmd, [
        { text: "error: Merging is not possible because you have unmerged files.", tone: "warn" },
        { text: "hint: Fix them up in the work tree, and then use 'git add/rm <file>'", tone: "warn" },
        { text: "hint: as appropriate to mark resolution and make a commit.", tone: "warn" },
        { text: "fatal: Exiting because of an unresolved conflict.", tone: "warn" },
      ]);
    setPhase("merging");
    setFile(MARKERS);
    setStaged(false);
    say(cmd, [
      { text: "Auto-merging a.txt" },
      { text: "CONFLICT (content): Merge conflict in a.txt", tone: "warn", why: "base hello에서 양쪽이 서로 다르게 바꿨어요" },
      { text: "Automatic merge failed; fix conflicts and then commit the result." },
    ]);
  };

  const status = () => {
    const cmd = "$ git status";
    if (phase !== "merging") return say(cmd, [{ text: "On branch main" }, { text: "nothing to commit, working tree clean" }]);
    if (staged)
      return say(cmd, [
        { text: "On branch main" },
        { text: "All conflicts fixed but you are still merging.", tone: "ok" },
        { text: '  (use "git commit" to conclude merge)', why: "다음은 commit" },
      ]);
    say(cmd, [
      { text: "On branch main" },
      { text: "You have unmerged paths." },
      { text: '  (fix conflicts and run "git commit")' },
      { text: '  (use "git merge --abort" to abort the merge)' },
      { text: " " },
      { text: "Unmerged paths:" },
      { text: '  (use "git add <file>..." to mark resolution)' },
      {
        text: "        both modified:   a.txt",
        tone: "warn",
        why: hasMarkers(file) ? "양쪽 다 고친 파일" : "내용은 골랐지만 add 전이라 아직 충돌로 쳐요",
      },
    ]);
  };

  const diffCheck = () => {
    const cmd = "$ git diff --check";
    if (phase === "merging" && !staged && hasMarkers(file))
      return say(cmd, [
        { text: "a.txt:1: leftover conflict marker", tone: "warn" },
        { text: "a.txt:3: leftover conflict marker", tone: "warn" },
        { text: "a.txt:5: leftover conflict marker", tone: "warn", why: "표시 줄이 남은 곳" },
      ]);
    if (phase === "merging" && staged && hasMarkers(file))
      return say(cmd, [silent("add한 뒤라 폴더와 Staging이 같아서 검사할 게 없어요. 검사는 add 전에 해요")]);
    say(cmd, [silent("조용하면 통과. 남은 표시가 없어요")]);
  };

  const add = () => {
    const cmd = "$ git add a.txt";
    if (phase !== "merging") return say(cmd, [silent("바뀐 게 없어서 할 일이 없어요")]);
    setStaged(true);
    say(cmd, [
      silent(
        hasMarkers(file)
          ? "해결 완료 표시. Git은 내용을 보지 않아서 표시 줄이 남은 채로도 받아 줘요"
          : "해결 완료 표시. 이제 충돌로 치지 않아요",
      ),
    ]);
  };

  const commit = () => {
    const cmd = "$ git commit";
    if (phase !== "merging") return say(cmd, [{ text: "On branch main" }, { text: "nothing to commit, working tree clean" }]);
    if (!staged)
      return say(cmd, [
        { text: "error: Committing is not possible because you have unmerged files.", tone: "warn" },
        { text: "hint: Fix them up in the work tree, and then use 'git add/rm <file>'", tone: "warn" },
        { text: "hint: as appropriate to mark resolution and make a commit.", tone: "warn" },
        { text: "fatal: Exiting because of an unresolved conflict.", tone: "warn" },
        { text: "U\ta.txt", tone: "warn", why: "add로 해결 완료 표시를 안 했어요" },
      ]);
    const markersLeft = hasMarkers(file);
    setPhase("done");
    setStaged(false);
    say(cmd, [
      { text: "[main e89a0fd] Merge branch 'feature'", tone: markersLeft ? "warn" : "ok", why: "편집기에 채워진 메시지를 그대로 저장(:wq). 해시는 할 때마다 달라요" },
      ...(markersLeft ? [{ text: "", why: "표시 줄까지 그대로 커밋됐어요. 이 이상한 줄이 코드가 돼요", tone: "warn" as const }] : []),
    ]);
  };

  const abort = () => {
    const cmd = "$ git merge --abort";
    if (phase !== "merging") return say(cmd, [{ text: "fatal: There is no merge to abort (MERGE_HEAD missing).", tone: "warn" }]);
    setPhase("before");
    setFile(CURRENT);
    setStaged(false);
    say(cmd, [silent("merge 이전으로 돌아갔어요. a.txt는 다시 main 수정")]);
  };

  const pick = (side: "ours" | "theirs") => {
    const cmd = `$ git checkout --${side} a.txt`;
    const target = side === "ours" ? CURRENT : INCOMING;
    if (phase !== "merging" || staged) return say(cmd, [{ text: "Updated 0 paths from the index", why: "바꿀 게 없어요" }]);
    const changed = !same(file, target);
    setFile(target);
    say(cmd, [
      {
        text: changed ? "Updated 1 path from the index" : "Updated 0 paths from the index",
        why: `${side === "ours" ? "current(main)" : "incoming(feature)"} 버전으로. 아직 add 전이에요`,
      },
    ]);
  };

  const accept = (label: string, next: string[]) => {
    setFile(next);
    push([{ text: `(VS Code) ${label}`, why: "표시 줄까지 지워 줘요. add와 commit은 직접", tone: "dim" }]);
  };

  const reset = () => {
    setPhase("before");
    setFile(CURRENT);
    setStaged(false);
    setLog(START);
  };

  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
  const toneClass = (t?: Line["tone"]) =>
    t === "cmd"
      ? "font-semibold"
      : t === "ok"
        ? "text-ok dark:text-ok-dark"
        : t === "warn"
          ? "text-action dark:text-action-dark"
          : t === "dim"
            ? muted
            : "";

  const short =
    phase !== "merging" ? "(출력 없음)" : !staged ? "UU a.txt" : same(file, CURRENT) ? "(출력 없음)" : "M  a.txt";
  const phaseText = phase === "before" ? "merge 전" : phase === "merging" ? "merge 진행 중" : "merge 끝";
  const canEdit = phase === "merging" && !staged && hasMarkers(file);

  const fileLines = colorLines(file, muted);

  const cmdBtn = "btn tap-feedback min-h-11 px-3 font-mono text-label";

  return (
    <div data-figure className="not-prose panel @container my-6 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2" aria-label="a.txt 내용">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-label font-bold">a.txt</h3>
            <span className={`text-label ${muted}`} aria-live="polite">
              {phaseText}, <span className="font-mono">git status --short</span>: <span className="font-mono">{short}</span>
            </span>
          </div>
          <div className="flex min-h-32 flex-col bg-surface-2 px-3 py-2 font-mono text-body leading-relaxed dark:bg-surface-2-dark">
            {fileLines.map(({ l, cls }, i) => (
              <div key={i} className={cls}>
                {l}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <p className={`text-label ${muted}`}>VS Code 버튼 (표시가 남아 있고 add 전일 때만)</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={!canEdit} onClick={() => accept("Accept Current Change", CURRENT)} className="btn tap-feedback min-h-11 px-3 text-label">
                Accept Current
              </button>
              <button type="button" disabled={!canEdit} onClick={() => accept("Accept Incoming Change", INCOMING)} className="btn tap-feedback min-h-11 px-3 text-label">
                Accept Incoming
              </button>
              <button type="button" disabled={!canEdit} onClick={() => accept("Accept Both Changes", BOTH)} className="btn tap-feedback min-h-11 px-3 text-label">
                Accept Both
              </button>
            </div>
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-2" aria-label="명령">
          <h3 className="text-label font-bold">명령 (main에 서서)</h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={merge} className={cmdBtn}>
              git merge feature
            </button>
            <button type="button" onClick={status} className={cmdBtn}>
              git status
            </button>
            <button type="button" onClick={() => pick("ours")} className={cmdBtn}>
              git checkout --ours a.txt
            </button>
            <button type="button" onClick={() => pick("theirs")} className={cmdBtn}>
              git checkout --theirs a.txt
            </button>
            <button type="button" onClick={diffCheck} className={cmdBtn}>
              git diff --check
            </button>
            <button type="button" onClick={add} className={cmdBtn}>
              git add a.txt
            </button>
            <button type="button" onClick={commit} className={cmdBtn}>
              git commit
            </button>
            <button type="button" onClick={abort} className={cmdBtn}>
              git merge --abort
            </button>
            <button type="button" onClick={reset} className="btn-action tap-feedback min-h-11 text-label">
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              처음부터
            </button>
          </div>
        </section>
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <h3 className="text-label font-bold">터미널 출력</h3>
        <div
          ref={logRef}
          aria-live="polite"
          className="flex h-52 flex-col gap-0.5 overflow-y-auto whitespace-pre-wrap bg-surface-2 px-3 py-2 font-mono text-label leading-relaxed dark:bg-surface-2-dark"
        >
          {log.map((l, i) => (
            <div key={i} className={toneClass(l.tone)}>
              {l.text}
              {l.why ? <span className={`font-normal ${muted}`}>{`  # ${l.why}`}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
