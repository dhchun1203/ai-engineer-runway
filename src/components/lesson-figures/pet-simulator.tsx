"use client";

// 13회차 다마고치 펫 시뮬레이터. 레슨의 Pet 클래스와 같은 규칙으로 움직인다.
// 버튼 하나가 choco.feed(), choco.play(), choco.sleep(), choco.pass_time() 한 번이다.
// 출력 창의 문장은 파이썬 print와 글자까지 같게 두고, 왜 그렇게 됐는지는 뒤에 # 주석으로 붙인다.
// 원래 Pet처럼 떠난 뒤에도 행동을 막지 않는다(레슨 11절의 빈틈을 직접 보게 하려는 것).

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

type Stat = "hunger" | "happy" | "energy";
type Pet = Record<Stat, number> & { alive: boolean };
type Line = { text: string; why?: string; tone?: "ok" | "warn" | "dim" };

const NAME = "초코";
const START: Pet = { hunger: 30, happy: 70, energy: 70, alive: true };
const STATS: Stat[] = ["hunger", "happy", "energy"];
const LABEL: Record<Stat, string> = { hunger: "배고픔", happy: "행복도", energy: "에너지" };
const ACTIONS: { code: string; label: string; main?: boolean }[] = [
  { code: "feed()", label: "밥 주기" },
  { code: "play()", label: "놀아 주기" },
  { code: "sleep()", label: "재우기" },
  { code: "pass_time()", label: "하루 지나기", main: true },
];
const FIRST: Line[] = [{ text: `choco = Pet("${NAME}")`, tone: "dim" }];

// random.randint(a, b): a 이상 b 이하 정수 하나. 버튼을 눌렀을 때만 불린다.
const randint = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

// _clamp(): 값을 0 ~ 100 안에 가둔다.
const clamp = (v: number) => (v < 0 ? 0 : v > 100 ? 100 : v);

function mood(p: Pet) {
  if (p.hunger >= 80 || p.happy <= 20) return "T_T";
  if (p.happy >= 70 && p.hunger <= 40) return "^_^";
  return "-_-";
}

// _change(): 바꿀 양을 더하고 _clamp()로 가둔다. 바뀐 칸은 "hunger 30 -> 0"처럼 적는다.
function change(p: Pet, d: Partial<Record<Stat, number>>): [Pet, string] {
  const next = { ...p };
  const notes: string[] = [];
  for (const k of STATS) {
    const delta = d[k] ?? 0;
    if (delta === 0) continue;
    const raw = p[k] + delta;
    next[k] = clamp(raw);
    notes.push(`${k} ${p[k]} -> ${next[k]}${raw !== next[k] ? ` _clamp(${raw})` : ""}`);
  }
  return [next, notes.join(", ")];
}

export function PetSimulator() {
  const [pet, setPet] = useState<Pet>({ ...START });
  const [day, setDay] = useState(0);
  const [log, setLog] = useState<Line[]>(FIRST);
  const logRef = useRef<HTMLDivElement>(null);

  const say = (lines: Line[]) => {
    setLog((prev) => [...prev, ...lines].slice(-60));
    requestAnimationFrame(() => {
      const el = logRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  // 떠난 펫에게 행동을 시키면 원래 Pet은 막지 않는다. 그 사실을 주석으로만 알린다.
  const gone = pet.alive ? "" : "alive를 보지 않아요 (11절 빈틈), ";

  const feed = () => {
    if (pet.hunger <= 10) {
      return say([
        { text: "choco.feed()", tone: "dim" },
        { text: `${NAME}: 배불러요~`, why: `${gone}hunger ${pet.hunger} <= 10 -> return False`, tone: "warn" },
      ]);
    }
    const [next, note] = change(pet, { hunger: -30, happy: 5 });
    setPet(next);
    say([
      { text: "choco.feed()", tone: "dim" },
      { text: `${NAME}에게 밥을 먹였습니다.`, why: `${gone}${note}`, tone: "ok" },
    ]);
  };

  const play = () => {
    if (pet.energy < 20) {
      return say([
        { text: "choco.play()", tone: "dim" },
        { text: `${NAME}: 너무 피곤해요...`, why: `${gone}energy ${pet.energy} < 20 -> return`, tone: "warn" },
      ]);
    }
    const [next, note] = change(pet, { hunger: 10, happy: 25, energy: -20 });
    setPet(next);
    say([
      { text: "choco.play()", tone: "dim" },
      { text: `${NAME}와 신나게 놀았습니다.`, why: `${gone}${note}`, tone: "ok" },
    ]);
  };

  const sleep = () => {
    const [next, note] = change(pet, { hunger: 5, energy: 40 });
    setPet(next);
    say([
      { text: "choco.sleep()", tone: "dim" },
      { text: `${NAME}가 잠들었어요 zZZ`, why: `${gone}${note}`, tone: "ok" },
    ]);
  };

  const passTime = () => {
    const [after, note] = change(pet, { hunger: 10, happy: -10, energy: -5 });
    const roll = randint(1, 5);
    const lines: Line[] = [{ text: "choco.pass_time()", why: `${note}, randint(1, 5) -> ${roll}`, tone: "dim" }];
    let next = after;
    if (roll === 1) {
      const [bonus, bonusNote] = change(after, { happy: 15 });
      next = bonus;
      lines.push({ text: `${NAME} 숨겨진 장난감을 찾았어요.`, why: `20% 당첨, ${bonusNote}`, tone: "ok" });
    }
    if (next.alive && (next.hunger >= 100 || next.happy <= 0)) {
      next = { ...next, alive: false };
      lines.push({
        text: "(alive = False, 펫이 떠났어요)",
        why: next.hunger >= 100 ? `hunger ${next.hunger} >= 100` : `happy ${next.happy} <= 0`,
        tone: "warn",
      });
    }
    setPet(next);
    setDay((d) => d + 1);
    say(lines);
  };

  const reset = () => {
    setPet({ ...START });
    setDay(0);
    setLog(FIRST);
  };

  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
  const toneClass = (t?: Line["tone"]) =>
    t === "ok" ? "text-ok dark:text-ok-dark" : t === "warn" ? "text-action dark:text-action-dark" : t === "dim" ? muted : "";

  const act = (code: string) => {
    if (code === "feed()") feed();
    else if (code === "play()") play();
    else if (code === "sleep()") sleep();
    else passTime();
  };

  return (
    <div data-figure className="not-prose panel @container my-6 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2" aria-label="print(choco)">
          <h3 className="text-label font-bold">print(choco)</h3>
          <p className="font-mono text-heading font-semibold">
            {NAME}{" "}
            <span className={pet.alive ? "text-accent dark:text-accent-dark" : "text-action dark:text-action-dark"}>
              {pet.alive ? mood(pet) : "떠남"}
            </span>
          </p>
          {STATS.map((k) => {
            const filled = Math.floor(pet[k] / 10); // bar(): value // 10
            return (
              <div key={k} className="flex items-center gap-2 font-mono text-label" aria-label={`${LABEL[k]} ${pet[k]}`}>
                <span className="w-14 shrink-0 font-sans">{LABEL[k]}</span>
                <span className="flex gap-0.5" aria-hidden="true">
                  {Array.from({ length: 10 }, (_, i) => (
                    <span
                      key={i}
                      className={`inline-block h-3.5 w-3 border ${
                        i < filled
                          ? "border-foreground bg-foreground dark:border-foreground-dark dark:bg-foreground-dark"
                          : "border-line dark:border-line-dark"
                      }`}
                    />
                  ))}
                </span>
                <span className="w-8 text-right tabular-nums">{pet[k]}</span>
              </div>
            );
          })}
          <p className={`font-mono text-label ${muted}`}>
            alive = {pet.alive ? "True" : "False"}, 지난 날 {day}일
          </p>
        </section>

        <section className="flex min-w-0 flex-col gap-2" aria-label="행동">
          <h3 className="text-label font-bold">메서드 부르기</h3>
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.code}
                type="button"
                onClick={() => act(a.code)}
                className={`${a.main ? "btn-action" : "btn"} tap-feedback min-h-11 flex-col gap-0 px-3 text-label`}
                aria-label={`choco.${a.code} 부르기, ${a.label}`}
              >
                <span className="font-mono">{a.code}</span>
                <span className="font-normal">{a.label}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={reset} className="btn tap-feedback min-h-11 self-start text-label">
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
            처음부터
          </button>
        </section>
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <h3 className="text-label font-bold">출력 (print)</h3>
        <div
          ref={logRef}
          aria-live="polite"
          className="flex h-44 flex-col gap-0.5 overflow-y-auto bg-surface-2 px-3 py-2 font-mono text-label leading-relaxed dark:bg-surface-2-dark"
        >
          {log.map((l, i) => (
            <div key={i} className={toneClass(l.tone)}>
              {l.text}
              {l.why ? <span className={muted}>{`  # ${l.why}`}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
