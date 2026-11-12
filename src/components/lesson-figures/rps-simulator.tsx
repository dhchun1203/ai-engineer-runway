"use client";

// 11회차 가위바위보 시뮬레이터. 레슨 코드의 play_game()과 main()을 그대로 따른다.
// 내 손 버튼 하나가 한 판(ask_number, check_result, show_result, show_score)이다.
// 컴퓨터 손은 random.randint(1, 3) 대신 직접 고르게 해서, 같은 입력이면 같은 결과가 나온다.
// 판정은 원래 코드(비김도 패배)와 고친 코드(같은 번호면 무승부) 중에서 고른다.
// 출력 창의 문장은 파이썬 print와 글자까지 같게 두고, 이유는 뒤에 # 주석으로 붙인다.

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

type Line = { text: string; why?: string; tone?: "ok" | "warn" | "dim" };
type Mode = "original" | "fixed";

const NAME = "민지";
const GOAL_WINS = 2;
const HANDS: Record<number, string> = { 1: "가위", 2: "바위", 3: "보" };
const NUMBERS = [1, 2, 3];

// 레슨의 check_result()와 같은 순서로 검사한다.
function checkResult(mode: Mode, user: number, computer: number): { result: string; why: string } {
  if (mode === "fixed" && user === computer) return { result: "무승부", why: "user_number == computer_number" };
  if (user === 1 && computer === 3) return { result: "승리", why: "user_number == 1 and computer_number == 3" };
  if (user === 2 && computer === 1) return { result: "승리", why: "user_number == 2 and computer_number == 1" };
  if (user === 3 && computer === 2) return { result: "승리", why: "user_number == 3 and computer_number == 2" };
  if (user === computer) return { result: "패배", why: "비겼는데 승리 세 줄에 안 걸려 맨 아래 return \"패배\"" };
  return { result: "패배", why: "승리 세 줄에 안 걸려 맨 아래 return \"패배\"" };
}

const START: Line[] = [
  { text: "=".repeat(40) },
  { text: "가위/바위/보 게임" },
  { text: "=".repeat(40) },
  { text: `플레이어 이름을 입력하세요. ${NAME}`, tone: "dim" },
];

export function RpsSimulator() {
  const [mode, setMode] = useState<Mode>("original");
  const [computer, setComputer] = useState(3);
  const [myWins, setMyWins] = useState(0);
  const [computerWins, setComputerWins] = useState(0);
  const [records, setRecords] = useState<string[]>([]);
  const [coWins, setCoWins] = useState(0);
  const [phase, setPhase] = useState<"play" | "again" | "end">("play");
  const [log, setLog] = useState<Line[]>(START);
  const logRef = useRef<HTMLDivElement>(null);

  const say = (lines: Line[]) => {
    setLog((prev) => [...prev, ...lines].slice(-80));
    requestAnimationFrame(() => {
      const el = logRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const playRound = (user: number) => {
    if (phase !== "play") return;
    const { result, why } = checkResult(mode, user, computer);
    let my = myWins;
    let cw = computerWins;
    if (result === "승리") my += 1;
    else if (result === "패배") cw += 1;
    const recs = [...records, `${HANDS[user]} vs ${HANDS[computer]} => ${result}`];

    const lines: Line[] = [
      { text: "1. 가위 / 2. 바위 / 3. 보", tone: "dim" },
      { text: `번호를 선택하세요. : ${user}`, tone: "dim" },
      { text: "" },
      { text: "[게임 결과]" },
      { text: `${NAME} : ${HANDS[user]} VS 컴퓨터: ${HANDS[computer]}` },
      { text: `=> ${result}`, why, tone: result === "승리" ? "ok" : result === "패배" ? "warn" : undefined },
      { text: "" },
      { text: `현재 스코어 ${NAME} ${my} : ${cw} 컴퓨터` },
      { text: "" },
    ];

    // while my_wins < GOAL_WINS and computer_wins < GOAL_WINS 가 거짓이 되면 게임 끝
    if (!(my < GOAL_WINS && cw < GOAL_WINS)) {
      lines.push(
        { text: "-".repeat(40) },
        { text: `[최종 결과] ${NAME} ${my} : ${cw} 컴퓨터` },
        my > cw ? { text: `==> ${NAME} 최종 승리!`, tone: "ok" } : { text: "==> 컴퓨터 승리!", tone: "warn" },
        { text: "" },
        { text: "[판별 승패 목록]" },
        ...recs.map((r, i) => ({ text: `${i + 1}판 : ${r}` })),
      );
      // main(): play_game()이 돌려준 my_wins == GOAL_WINS 로 연승을 센다
      const won = my === GOAL_WINS;
      const co = won ? coWins + 1 : 0;
      if (co > 0) lines.push({ text: "" }, { text: `현재 연승: ${co} 연승`, why: "co_wins += 1" });
      lines.push(
        { text: "" },
        { text: "다시 도전 (yes/no) :", tone: "dim", why: co > 0 ? undefined : "co_wins = 0 이라 연승 줄은 안 찍혀요" },
      );
      setCoWins(co);
      setPhase("again");
    }

    setMyWins(my);
    setComputerWins(cw);
    setRecords(recs);
    say(lines);
  };

  const again = (yes: boolean) => {
    if (phase !== "again") return;
    if (yes) {
      // play_game()을 다시 부르면 지역 변수가 0과 빈 리스트로 새로 만들어진다
      setMyWins(0);
      setComputerWins(0);
      setRecords([]);
      setPhase("play");
    } else {
      setPhase("end");
    }
    // input()이 찍은 물음 줄 끝에 입력한 답을 붙인다
    const echo: Line = yes
      ? { text: "다시 도전 (yes/no) : yes", tone: "dim", why: "play_game(name) 다시, 점수와 기록은 처음부터" }
      : { text: "다시 도전 (yes/no) : no", tone: "dim" };
    setLog((prev) => prev.slice(0, -1));
    say(yes ? [echo] : [echo, { text: "게임을 종료합니다." }]);
  };

  const reset = () => {
    setMyWins(0);
    setComputerWins(0);
    setRecords([]);
    setCoWins(0);
    setPhase("play");
    setLog(START);
  };

  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
  const toneClass = (t?: Line["tone"]) =>
    t === "ok" ? "text-ok dark:text-ok-dark" : t === "warn" ? "text-action dark:text-action-dark" : t === "dim" ? muted : "";
  const choice = (on: boolean) =>
    `tap-feedback min-h-11 border px-3 text-label ${
      on ? "border-accent bg-accent/10 font-semibold dark:border-accent-dark dark:bg-accent-dark/15" : "border-line dark:border-line-dark"
    }`;

  return (
    <div data-figure className="not-prose panel @container my-6 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-4" aria-label="설정">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-label font-bold">check_result() 판정</h3>
            <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="판정 코드">
              <button type="button" role="radio" aria-checked={mode === "original"} onClick={() => setMode("original")} className={`${choice(mode === "original")} text-left`}>
                원래 코드 (이기는 세 경우만, 나머지는 패배)
              </button>
              <button type="button" role="radio" aria-checked={mode === "fixed"} onClick={() => setMode("fixed")} className={`${choice(mode === "fixed")} text-left`}>
                고친 코드 (같은 번호면 먼저 무승부)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-label font-bold">컴퓨터 손 (random.randint 대신 직접 골라요)</h3>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="컴퓨터 손">
              {NUMBERS.map((n) => (
                <button key={n} type="button" role="radio" aria-checked={computer === n} onClick={() => setComputer(n)} className={choice(computer === n)}>
                  {n}. {HANDS[n]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-4" aria-label="게임">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-label font-bold">내 손 (누르면 한 판)</h3>
            <div className="flex flex-wrap gap-1.5">
              {NUMBERS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => playRound(n)}
                  disabled={phase !== "play"}
                  className="btn tap-feedback min-h-11 px-3 text-label disabled:opacity-50"
                  aria-label={`${HANDS[n]} 내기`}
                >
                  {n}. {HANDS[n]}
                </button>
              ))}
            </div>
          </div>

          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 font-mono text-label tabular-nums">
            <dt>my_wins</dt>
            <dd className="text-right">{myWins}</dd>
            <dt>computer_wins</dt>
            <dd className="text-right">{computerWins}</dd>
            <dt>len(records)</dt>
            <dd className="text-right">{records.length}</dd>
            <dt className="border-t border-line pt-1 font-semibold dark:border-line-dark">co_wins (main)</dt>
            <dd className="border-t border-line pt-1 text-right font-semibold dark:border-line-dark">{coWins}</dd>
          </dl>

          <div className="flex flex-wrap gap-2">
            {phase === "again" ? (
              <>
                <button type="button" onClick={() => again(true)} className="btn-action tap-feedback min-h-11 text-label" aria-label="다시 도전 yes">
                  yes
                </button>
                <button type="button" onClick={() => again(false)} className="btn tap-feedback min-h-11 text-label" aria-label="다시 도전 no">
                  no
                </button>
              </>
            ) : null}
            <button type="button" onClick={reset} className="btn tap-feedback min-h-11 text-label">
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              처음부터
            </button>
          </div>
        </section>
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <h3 className="text-label font-bold">출력 (print)</h3>
        <div
          ref={logRef}
          aria-live="polite"
          className="flex h-56 flex-col gap-0.5 overflow-y-auto bg-surface-2 px-3 py-2 font-mono text-label leading-relaxed dark:bg-surface-2-dark"
        >
          {log.map((l, i) => (
            <div key={i} className={`whitespace-pre-wrap ${toneClass(l.tone)}`}>
              {l.text || "\u00a0"}
              {l.why ? <span className={muted}>{`  # ${l.why}`}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
