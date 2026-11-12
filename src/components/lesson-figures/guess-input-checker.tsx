"use client";

// 7회차 숫자 맞추기 게임의 입력 검사기. 같은 입력을 수업 코드와 고친 코드에 넣었을 때
// 어느 검사에서 걸리고 무엇을 찍는지 나란히 보여 준다. 정답은 8로 고정했다.
// 입력 목록과 결과는 두 코드를 파이썬 3.13으로 실제로 돌려 얻은 그대로 적었다
// (출력 문장은 print 글자 그대로).

import { useState } from "react";

type Tone = "ok" | "warn" | "crash" | "end";
type Run = { steps: string[]; out: string; effect: string; tone: Tone };
type Case = { input: string; orig: Run; fixed: Run };

const RANGE = (s: string) => `입력값 : ${s} => 1 에서 100 사이의 값을 입력해주세요.`;
const NOT_NUM = "숫자로 입력해주세요.";
const QUIT = "게임 종료합니다. 정답은 8 입니다.";

const CASES: Case[] = [
  {
    input: "50",
    orig: {
      steps: ["`not \"50\".isdigit()`가 `False`라 오른쪽은 계산 안 하고 통과", "50은 범위 안이라 통과", "`try_count += 1` 하고 8과 비교"],
      out: "50 : 더 작은 수 입니다.",
      effect: "시도 횟수 +1",
      tone: "ok",
    },
    fixed: {
      steps: ["`isdigit()`가 `True`라 통과", "`1 <= 50 <= 100`이라 통과", "`try_count += 1` 하고 8과 비교"],
      out: "50 : 더 작은 수 입니다.",
      effect: "시도 횟수 +1",
      tone: "ok",
    },
  },
  {
    input: "3",
    orig: {
      steps: ["`not \"3\".isdigit()`가 `False`라 통과", "3은 범위 안이라 통과", "`try_count += 1` 하고 8과 비교"],
      out: "3 : 더 큰 수 입니다.",
      effect: "시도 횟수 +1",
      tone: "ok",
    },
    fixed: {
      steps: ["`isdigit()`가 `True`라 통과", "`1 <= 3 <= 100`이라 통과", "`try_count += 1` 하고 8과 비교"],
      out: "3 : 더 큰 수 입니다.",
      effect: "시도 횟수 +1",
      tone: "ok",
    },
  },
  {
    input: "1",
    orig: {
      steps: ["`not \"1\".isdigit()`가 `False`라 통과", "`1 <= 1`이 `True`라 범위 검사에 걸림"],
      out: RANGE("1"),
      effect: "continue, 시도 횟수 그대로",
      tone: "warn",
    },
    fixed: {
      steps: ["`isdigit()`가 `True`라 통과", "`1 <= 1 <= 100`이라 통과", "`try_count += 1` 하고 8과 비교"],
      out: "1 : 더 큰 수 입니다.",
      effect: "시도 횟수 +1",
      tone: "ok",
    },
  },
  {
    input: "100",
    orig: {
      steps: ["`not \"100\".isdigit()`가 `False`라 통과", "`100 >= 100`이 `True`라 범위 검사에 걸림"],
      out: RANGE("100"),
      effect: "continue, 시도 횟수 그대로",
      tone: "warn",
    },
    fixed: {
      steps: ["`isdigit()`가 `True`라 통과", "`1 <= 100 <= 100`이라 통과", "`try_count += 1` 하고 8과 비교"],
      out: "100 : 더 작은 수 입니다.",
      effect: "시도 횟수 +1",
      tone: "ok",
    },
  },
  {
    input: "-10",
    orig: {
      steps: ["왼쪽 `not isdigit()`는 `True`, 오른쪽 `-10 > 0`이 `False`라 전체 `False`, 통과", "`-10 <= 1`이 `True`라 범위 검사에 걸림"],
      out: RANGE("-10"),
      effect: "continue, 시도 횟수 그대로",
      tone: "warn",
    },
    fixed: {
      steps: ["`-` 글자 때문에 `isdigit()`가 `False`라 숫자 검사에 걸림"],
      out: NOT_NUM,
      effect: "continue, 시도 횟수 그대로",
      tone: "warn",
    },
  },
  {
    input: "abc",
    orig: {
      steps: ["왼쪽 `not isdigit()`가 `True`라 오른쪽 `int(\"abc\")`를 계산하다 에러"],
      out: "ValueError: invalid literal for int() with base 10: 'abc'",
      effect: "프로그램이 멈춰요",
      tone: "crash",
    },
    fixed: {
      steps: ["`isdigit()`가 `False`라 숫자 검사에 걸림"],
      out: NOT_NUM,
      effect: "continue, 시도 횟수 그대로",
      tone: "warn",
    },
  },
  {
    input: "1.5",
    orig: {
      steps: ["왼쪽 `not isdigit()`가 `True`라 오른쪽 `int(\"1.5\")`를 계산하다 에러"],
      out: "ValueError: invalid literal for int() with base 10: '1.5'",
      effect: "프로그램이 멈춰요",
      tone: "crash",
    },
    fixed: {
      steps: ["`.` 글자 때문에 `isdigit()`가 `False`라 숫자 검사에 걸림"],
      out: NOT_NUM,
      effect: "continue, 시도 횟수 그대로",
      tone: "warn",
    },
  },
  {
    input: " 5",
    orig: {
      steps: ["공백 때문에 왼쪽 `not isdigit()`가 `True`, `int(\" 5\")`는 5라 `5 > 0`도 `True`, 숫자 검사에 걸림"],
      out: NOT_NUM,
      effect: "continue, 시도 횟수 그대로",
      tone: "warn",
    },
    fixed: {
      steps: ["공백 때문에 `isdigit()`가 `False`라 숫자 검사에 걸림"],
      out: NOT_NUM,
      effect: "continue, 시도 횟수 그대로",
      tone: "warn",
    },
  },
  {
    input: "+5",
    orig: {
      steps: ["`+` 때문에 왼쪽 `not isdigit()`가 `True`, `int(\"+5\")`는 5라 `5 > 0`도 `True`, 숫자 검사에 걸림"],
      out: NOT_NUM,
      effect: "continue, 시도 횟수 그대로",
      tone: "warn",
    },
    fixed: {
      steps: ["`+` 글자 때문에 `isdigit()`가 `False`라 숫자 검사에 걸림"],
      out: NOT_NUM,
      effect: "continue, 시도 횟수 그대로",
      tone: "warn",
    },
  },
  {
    input: "q",
    orig: { steps: ["`user_input == \"q\"`가 `True`"], out: QUIT, effect: "break, 게임 끝", tone: "end" },
    fixed: { steps: ["`user_input == \"q\"`가 `True`"], out: QUIT, effect: "break, 게임 끝", tone: "end" },
  },
];

const MUTED = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
const CODE = "whitespace-nowrap rounded-sm bg-surface-2 px-1 py-px font-mono text-[0.88em] dark:bg-surface-2-dark";

// `코드`만 바꿔 준다.
function inline(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code key={i} className={CODE}>
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

const toneClass: Record<Tone, string> = {
  ok: "text-ok dark:text-ok-dark",
  warn: "text-warn dark:text-warn-dark",
  crash: "text-destructive dark:text-destructive-dark",
  end: "",
};

function Column({ title, code, run }: { title: string; code: string; run: Run }) {
  return (
    <section className="flex min-w-0 flex-col gap-2 border border-line p-3 dark:border-line-dark" aria-label={title}>
      <h3 className="text-label font-bold">{title}</h3>
      <p className={`font-mono text-label ${MUTED}`}>{code}</p>
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-label leading-relaxed">
        {run.steps.map((s, i) => (
          <li key={i}>{inline(s)}</li>
        ))}
      </ol>
      <div aria-live="polite" className="bg-surface-2 px-3 py-2 font-mono text-label leading-relaxed dark:bg-surface-2-dark">
        <span className={toneClass[run.tone]}>{run.out}</span>
      </div>
      <p className={`text-label font-semibold ${toneClass[run.tone]}`}>{run.effect}</p>
    </section>
  );
}

export function GuessInputChecker() {
  const [pick, setPick] = useState(5); // abc부터 보여 준다
  const c = CASES[pick];

  return (
    <div data-figure className="not-prose panel @container my-6 flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-label font-bold">입력 (정답은 8)</h3>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="넣어 볼 입력">
          {CASES.map((k, i) => (
            <button
              key={k.input}
              type="button"
              role="radio"
              aria-checked={pick === i}
              aria-label={`입력 "${k.input}"`}
              onClick={() => setPick(i)}
              className={`tap-feedback min-h-11 min-w-11 whitespace-pre border px-3 font-mono text-label ${
                pick === i
                  ? "border-accent bg-accent/10 font-semibold dark:border-accent-dark dark:bg-accent-dark/15"
                  : "border-line dark:border-line-dark"
              }`}
            >
              {`"${k.input}"`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2">
        <Column title="수업 코드" code="not user_input.isdigit() and int(user_input) > 0" run={c.orig} />
        <Column title="고친 코드" code="not user_input.isdigit() 다음 1 <= user_number <= 100" run={c.fixed} />
      </div>
    </div>
  );
}
