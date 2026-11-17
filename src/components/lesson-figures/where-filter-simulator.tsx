"use client";

// 17회차 WHERE 거르기 시뮬레이터. 시드 회원 1~7번(수업 출력 그대로)을 두고, 조건 하나를 고르면
// 그 조건을 통과하는 행만 진하게 남는다. 통과하는 행과 행 수는 같은 7행을 PostgreSQL 엔진(PGlite)에
// 넣고 실제로 실행해 확인한 결과다. 계산하지 않고 확인한 결과를 그대로 적어 둔다.

import { useState } from "react";

type Member = {
  id: number;
  name: string;
  gender: string;
  birth: number;
  email: string | null;
  region: string;
};

const MEMBERS: Member[] = [
  { id: 1, name: "김하늘", gender: "F", birth: 1995, email: "haneul@", region: "마포구" },
  { id: 2, name: "이준호", gender: "M", birth: 1988, email: null, region: "서대문구" },
  { id: 3, name: "박서윤", gender: "F", birth: 1972, email: "seoyun@", region: "마포구" },
  { id: 4, name: "최민준", gender: "M", birth: 2001, email: "minjun@", region: "은평구" },
  { id: 5, name: "정유진", gender: "F", birth: 1960, email: null, region: "서대문구" },
  { id: 6, name: "강도윤", gender: "M", birth: 1983, email: "doyun@", region: "마포구" },
  { id: 7, name: "조수아", gender: "F", birth: 1999, email: "sua@", region: "용산구" },
];

type Cond = { label: string; where: string; pass: number[]; why: string };

const CONDS: Cond[] = [
  { label: "같다", where: "region = '마포구'", pass: [1, 3, 6], why: "글자가 정확히 같은 행만 남아요." },
  { label: "다르다", where: "region <> '마포구'", pass: [2, 4, 5, 7], why: "<> 는 같지 않다예요. != 로 써도 같아요." },
  { label: "= NULL", where: "email = NULL", pass: [], why: "오류는 아니지만 0행이에요. NULL은 모르는 값이라 무엇과 = 로 비교해도 참이 되지 않아요." },
  { label: "IS NULL", where: "email IS NULL", pass: [2, 5], why: "빈 칸은 IS NULL 로 찾아요." },
  { label: "IS NOT NULL", where: "email IS NOT NULL", pass: [1, 3, 4, 6, 7], why: "값이 있는 칸만 남아요. 2명 + 5명 = 7명 전부예요." },
  { label: "BETWEEN", where: "birth_year BETWEEN 1995 AND 2000", pass: [1, 7], why: "1995 이상 2000 이하예요. 양 끝을 포함해서 1995년생 김하늘도 들어와요." },
  { label: "BETWEEN 거꾸로", where: "birth_year BETWEEN 2000 AND 1995", pass: [], why: "2000 이상이면서 1995 이하인 수는 없어서 0행이에요. 작은 값을 앞에 써요." },
  { label: "IN", where: "region IN ('마포구', '용산구')", pass: [1, 3, 6, 7], why: "목록 안의 값 중 하나와 정확히 같으면 통과해요. OR 를 두 번 쓴 것과 같아요." },
  { label: "IN 에 %", where: "region IN ('%구')", pass: [], why: "IN 은 패턴을 모르고 '%구' 라는 글자 그대로를 찾아요. 그런 동네는 없어서 0행이에요." },
  { label: "LIKE '%구'", where: "region LIKE '%구'", pass: [1, 2, 3, 4, 5, 6, 7], why: "% 는 0글자 이상 아무 글자예요. '구'로 끝나는 동네라 7명 모두 통과해요." },
  { label: "LIKE '김%'", where: "name LIKE '김%'", pass: [1], why: "'김'으로 시작하면 통과해요." },
  { label: "LIKE '_준_'", where: "name LIKE '_준_'", pass: [2], why: "_ 는 정확히 한 글자예요. 가운데가 '준'인 세 글자 이름만 남아요. 최민준은 '준'이 끝이라 빠져요." },
  { label: "괄호 없이", where: "region = '마포구' OR region = '서대문구' AND gender = 'F'", pass: [1, 3, 5, 6], why: "AND 를 먼저 묶어서 '마포구' 또는 '서대문구 여성'으로 읽혀요. 마포구 남성 강도윤이 끼어들어요." },
  { label: "괄호 넣고", where: "(region = '마포구' OR region = '서대문구') AND gender = 'F'", pass: [1, 3, 5], why: "괄호 안의 OR 를 먼저 계산해서 두 동네의 여성만 남아요." },
];

export function WhereFilterSimulator() {
  const [pick, setPick] = useState(0);
  const cond = CONDS[pick];
  const passSet = new Set(cond.pass);

  const muted = "text-badge-neutral-text dark:text-badge-neutral-text-dark";
  const head = `border-b border-line text-left dark:border-line-dark ${muted}`;

  return (
    <div data-figure className="not-prose panel @container my-6 p-4 sm:p-5">
      <section className="flex flex-col gap-2" aria-label="WHERE 조건 고르기">
        <h3 className="text-label font-bold">조건 고르기</h3>
        <div className="flex flex-wrap gap-1.5">
          {CONDS.map((c, i) => (
            <button
              key={c.where}
              type="button"
              onClick={() => setPick(i)}
              aria-pressed={i === pick}
              className={`tap-feedback min-h-11 px-3 text-label font-mono ${i === pick ? "btn-action" : "btn"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-4 bg-surface-2 px-3 py-2 font-mono text-label leading-relaxed dark:bg-surface-2-dark">
        <div className={muted}>SELECT member_id, name, gender, birth_year, email, region</div>
        <div className={muted}>FROM members</div>
        <div className="whitespace-pre-wrap break-words font-semibold">{`WHERE ${cond.where};`}</div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[30rem] font-mono text-label tabular-nums">
          <thead>
            <tr className={head}>
              <th className="py-1 pr-2 font-semibold">member_id</th>
              <th className="py-1 pr-2 font-semibold">name</th>
              <th className="py-1 pr-2 font-semibold">gender</th>
              <th className="py-1 pr-2 font-semibold">birth_year</th>
              <th className="py-1 pr-2 font-semibold">email</th>
              <th className="py-1 font-semibold">region</th>
            </tr>
          </thead>
          <tbody>
            {MEMBERS.map((m) => {
              const on = passSet.has(m.id);
              return (
                <tr
                  key={m.id}
                  className={`border-b border-line transition-opacity duration-200 last:border-b-0 dark:border-line-dark ${
                    on ? "bg-accent/10 font-semibold dark:bg-accent-dark/15" : "opacity-35"
                  }`}
                >
                  <td className="py-1 pr-2 text-accent dark:text-accent-dark">{m.id}</td>
                  <td className="py-1 pr-2 font-sans">{m.name}</td>
                  <td className="py-1 pr-2">{m.gender}</td>
                  <td className="py-1 pr-2">{m.birth}</td>
                  <td className={`py-1 pr-2 ${m.email ? "" : muted}`}>{m.email ?? "(NULL)"}</td>
                  <td className="py-1 font-sans">{m.region}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-label leading-relaxed" aria-live="polite">
        <span className="font-mono font-semibold">{`(${cond.pass.length} ${cond.pass.length === 1 ? "row" : "rows"})`}</span>{" "}
        {cond.why}
      </p>
      <p className={`mt-1 text-label ${muted}`}>이메일은 앞부분만 줄여 적었어요. 진한 행이 결과에 나오는 행이에요.</p>
    </div>
  );
}
