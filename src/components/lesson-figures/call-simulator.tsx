"use client";

// 8회차 함수 호출 시뮬레이터. 호출 한 줄을 고르면 인수가 매개변수 칸에 어떻게 들어가는지
// (앞에서부터 차례로, 이름 붙여서, 기본값, *로 묶기, **로 묶기)와 그때 찍히는 글자를 보여 준다.
// 출력 창의 문장은 파이썬 3.13으로 실제로 돌린 결과와 글자까지 같다.

import { useState } from "react";

type Src = "pos" | "kw" | "default" | "star" | "dstar" | "clash";
type Slot = { name: string; value: string; src: Src; note?: string };
type Call = {
  call: string;
  def: string;
  slots: Slot[];
  out: string[];
  error?: boolean;
  why?: string;
};

const DEF_SAY = 'def say_hello(name = "홍길동", age  = 30, point = 1000):';
const DEF_ADD = "def add_all(*numbers):";
const DEF_INFO = "def user_info(**data):";

const SAY_OUT = (name: string, age: number, point: number) => [
  `${name}님, 안녕하세요. 나이는 ${age}입니다.`,
  `초기 지급 포인트 ${point}점이 지급되었습니다.`,
];

const CALLS: Call[] = [
  {
    call: "say_hello()",
    def: DEF_SAY,
    slots: [
      { name: "name", value: '"홍길동"', src: "default" },
      { name: "age", value: "30", src: "default" },
      { name: "point", value: "1000", src: "default" },
    ],
    out: SAY_OUT("홍길동", 30, 1000),
    why: "아무것도 안 넘겨서 세 칸 모두 기본값이에요",
  },
  {
    call: 'say_hello("Minji")',
    def: DEF_SAY,
    slots: [
      { name: "name", value: '"Minji"', src: "pos", note: "1번째" },
      { name: "age", value: "30", src: "default" },
      { name: "point", value: "1000", src: "default" },
    ],
    out: SAY_OUT("Minji", 30, 1000),
    why: "그냥 넘긴 값은 앞에서부터 차례로 들어가요",
  },
  {
    call: "say_hello(age=25)",
    def: DEF_SAY,
    slots: [
      { name: "name", value: '"홍길동"', src: "default" },
      { name: "age", value: "25", src: "kw" },
      { name: "point", value: "1000", src: "default" },
    ],
    out: SAY_OUT("홍길동", 25, 1000),
    why: "이름을 붙이면 가운데 칸만 골라 바꿀 수 있어요",
  },
  {
    call: "say_hello(25)",
    def: DEF_SAY,
    slots: [
      { name: "name", value: "25", src: "pos", note: "1번째" },
      { name: "age", value: "30", src: "default" },
      { name: "point", value: "1000", src: "default" },
    ],
    out: SAY_OUT("25", 30, 1000),
    why: "나이를 넣을 생각이었어도, 이름 없이 넘기면 첫 칸 name에 들어가요",
  },
  {
    call: 'say_hello("Minji", 25)',
    def: DEF_SAY,
    slots: [
      { name: "name", value: '"Minji"', src: "pos", note: "1번째" },
      { name: "age", value: "25", src: "pos", note: "2번째" },
      { name: "point", value: "1000", src: "default" },
    ],
    out: SAY_OUT("Minji", 25, 1000),
    why: "두 값이 차례로 name, age에 들어가고 point만 기본값이에요",
  },
  {
    call: 'say_hello(point=500, name="Minji")',
    def: DEF_SAY,
    slots: [
      { name: "name", value: '"Minji"', src: "kw" },
      { name: "age", value: "30", src: "default" },
      { name: "point", value: "500", src: "kw" },
    ],
    out: SAY_OUT("Minji", 30, 500),
    why: "이름을 붙이면 순서를 바꿔 넘겨도 돼요",
  },
  {
    call: 'say_hello("Minji", name="Jun")',
    def: DEF_SAY,
    slots: [
      { name: "name", value: '"Minji" 와 "Jun"', src: "clash", note: "두 번" },
      { name: "age", value: "30", src: "default" },
      { name: "point", value: "1000", src: "default" },
    ],
    out: ["TypeError: say_hello() got multiple values for argument 'name'"],
    error: true,
    why: '"Minji"가 이미 첫 칸 name에 들어갔는데 name=으로 또 넣었어요',
  },
  {
    call: "add_all(1,2,3)",
    def: DEF_ADD,
    slots: [{ name: "numbers", value: "(1, 2, 3)", src: "star" }],
    out: ["입력된 튜플: (1, 2, 3)", "합계 결과: 6"],
    why: "세 값이 튜플 하나로 묶여요",
  },
  {
    call: "add_all(1,2,3,4,5)",
    def: DEF_ADD,
    slots: [{ name: "numbers", value: "(1, 2, 3, 4, 5)", src: "star" }],
    out: ["입력된 튜플: (1, 2, 3, 4, 5)", "합계 결과: 15"],
    why: "몇 개를 넘기든 튜플 하나예요",
  },
  {
    call: "add_all()",
    def: DEF_ADD,
    slots: [{ name: "numbers", value: "()", src: "star" }],
    out: ["입력된 튜플: ()", "합계 결과: 0"],
    why: "빈 튜플이라 sum(())은 0이에요",
  },
  {
    call: 'user_info(name = "Minji", level = 5, active = True)',
    def: DEF_INFO,
    slots: [{ name: "data", value: "{'name': 'Minji', 'level': 5, 'active': True}", src: "dstar" }],
    out: ["전달된 딕셔너리 구조: {'name': 'Minji', 'level': 5, 'active': True}", "name:Minji", "level:5", "active:True"],
    why: "이름이 키, 값이 값이 돼요",
  },
  {
    call: "user_info()",
    def: DEF_INFO,
    slots: [{ name: "data", value: "{}", src: "dstar" }],
    out: ["전달된 딕셔너리 구조: {}"],
    why: "빈 딕셔너리라 for가 한 번도 돌지 않아요",
  },
];

const SRC_LABEL: Record<Src, string> = {
  pos: "차례로",
  kw: "이름 붙여",
  default: "기본값",
  star: "*로 묶음",
  dstar: "**로 묶음",
  clash: "충돌",
};

const SRC_CLASS: Record<Src, string> = {
  pos: "bg-accent text-surface dark:bg-accent-dark dark:text-background-dark",
  kw: "bg-accent text-surface dark:bg-accent-dark dark:text-background-dark",
  default: "border border-line text-badge-neutral-text dark:border-line-dark dark:text-badge-neutral-text-dark",
  star: "bg-warn text-surface dark:bg-warn-dark dark:text-background-dark",
  dstar: "bg-warn text-surface dark:bg-warn-dark dark:text-background-dark",
  clash: "bg-destructive text-surface dark:bg-destructive-dark dark:text-background-dark",
};

export function CallSimulator() {
  const [pick, setPick] = useState(0);
  const c = CALLS[pick];
  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";

  return (
    <div data-figure className="not-prose panel @container my-6 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-5 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="flex min-w-0 flex-col gap-1.5" aria-label="호출 고르기">
          <h3 className="text-label font-bold">부를 줄 고르기</h3>
          <div className="flex flex-col gap-1.5">
            {CALLS.map((item, i) => (
              <button
                key={item.call}
                type="button"
                aria-pressed={pick === i}
                onClick={() => setPick(i)}
                className={`tap-feedback min-h-11 border px-3 text-left font-mono text-label break-all ${
                  pick === i
                    ? "border-accent bg-accent/10 font-semibold dark:border-accent-dark dark:bg-accent-dark/15"
                    : "border-line dark:border-line-dark"
                }`}
              >
                {item.call}
              </button>
            ))}
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-4" aria-label="매개변수 칸" aria-live="polite">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-label font-bold">정의</h3>
            <p className="overflow-x-auto bg-surface-2 px-3 py-2 font-mono text-label whitespace-pre dark:bg-surface-2-dark">{c.def}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-label font-bold">매개변수 칸에 들어간 값</h3>
            <dl className="flex flex-col gap-1.5">
              {c.slots.map((s) => (
                <div
                  key={s.name}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-line py-1.5 last:border-b-0 dark:border-line-dark"
                >
                  <dt className="font-mono text-label font-semibold">{s.name}</dt>
                  <dd className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span className="font-mono text-label break-all">= {s.value}</span>
                    <span className={`px-1.5 text-label font-semibold ${SRC_CLASS[s.src]}`}>
                      {SRC_LABEL[s.src]}
                      {s.note ? ` (${s.note})` : ""}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-label font-bold">출력 (print)</h3>
            <div className="flex flex-col gap-0.5 bg-surface-2 px-3 py-2 font-mono text-label leading-relaxed dark:bg-surface-2-dark">
              {c.out.map((line, i) => (
                <div key={i} className={c.error ? "text-destructive dark:text-destructive-dark" : ""}>
                  {line}
                </div>
              ))}
              {c.why ? <div className={muted}>{`# ${c.why}`}</div> : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
