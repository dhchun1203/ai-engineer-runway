"use client";

// 미니 프로젝트 2부(카페 주문 API)의 요청 놀이터. 주소를 고르면 그 요청에 서버가 돌려준
// 상태 코드와 JSON 본문을 보여 준다. 응답은 모두 server.py(FastAPI 0.165, psycopg 3.3.9)를
// cafe_db 앞에 띄워 실제로 받은 글자 그대로다. 판교점 주문 상세는 386개 중 앞 2개만 싣는다.

import { useState } from "react";

const MUTED = "text-badge-neutral-text dark:text-badge-neutral-text-dark";

type Sample = { path: string; status: number; reason: string; body: string; note: string };

const SAMPLES: Sample[] = [
  {
    path: "/stores",
    status: 200,
    reason: "OK",
    body: `[
  {"store_id": 1, "name": "성수점", "region": "서울 성동구", "opened_on": "2023-04-01"},
  {"store_id": 2, "name": "연남점", "region": "서울 마포구", "opened_on": "2024-09-14"},
  {"store_id": 3, "name": "판교점", "region": "성남 분당구", "opened_on": "2025-03-03"}
]`,
    note: "목록은 대괄호 [ ]로 감싼 JSON 배열이에요. DB의 한 행이 중괄호 { } 하나가 됐어요.",
  },
  {
    path: "/stores/3",
    status: 200,
    reason: "OK",
    body: `{"store_id": 3, "name": "판교점", "region": "성남 분당구", "opened_on": "2025-03-03"}`,
    note: "주소의 3이 함수의 store_id로 들어가 지점 하나만 돌아와요. 하나라서 배열이 아니라 { } 하나예요.",
  },
  {
    path: "/stores/9",
    status: 404,
    reason: "Not Found",
    body: `{"detail": "그런 지점이 없어요"}`,
    note: "주소 모양은 맞지만 9번 지점이 없어요. server.py가 HTTPException으로 직접 404를 돌려줬어요.",
  },
  {
    path: "/stores/abc",
    status: 422,
    reason: "Unprocessable Content",
    body: `{
  "detail": [
    {
      "type": "int_parsing",
      "loc": ["path", "store_id"],
      "msg": "Input should be a valid integer, unable to parse string as an integer",
      "input": "abc"
    }
  ]
}`,
    note: "store_id: int라고 적어 두어서 FastAPI가 함수를 부르기 전에 막았어요. 어느 칸(loc)이 왜(msg) 틀렸는지 알려 줘요.",
  },
  {
    path: "/order-lines?store=판교점",
    status: 200,
    reason: "OK",
    body: `[
  {"order_id": 1, "ordered_at": "2026-11-02T08:14:00", "store_id": 3, "store": "판교점",
   "member_id": 1, "menu": "레몬티", "category": "음료", "qty": 1, "price": 5000, "cost": 1300},
  {"order_id": 2, "ordered_at": "2026-11-02T08:19:00", "store_id": 3, "store": "판교점",
   "member_id": null, "menu": "아메리카노", "category": "커피", "qty": 1, "price": 4500, "cost": 900},
  ...
]`,
    note: "? 뒤의 store=판교점이 쿼리 파라미터예요. 판교점 주문 상세 386개가 와요(앞 2개만 옮겼어요). 날짜는 글자, NULL은 null이에요.",
  },
  {
    path: "/order-lines?store=강남점",
    status: 200,
    reason: "OK",
    body: `[]`,
    note: "창구는 있는데 찾은 결과가 없어서 빈 배열이에요. 404가 아니라 200이에요.",
  },
  {
    path: "/reports/stores",
    status: 200,
    reason: "OK",
    body: `[
  {"store": "판교점", "revenue": 2305700, "orders": 249},
  {"store": "성수점", "revenue": 2200000, "orders": 253},
  {"store": "연남점", "revenue": 2009700, "orders": 212}
]`,
    note: "서버가 SQL로 미리 계산한 지점 성적표예요. 1부 12절의 답과 같은 숫자예요.",
  },
  {
    path: "/nothing",
    status: 404,
    reason: "Not Found",
    body: `{"detail": "Not Found"}`,
    note: "그런 창구가 아예 없으면 FastAPI가 알아서 404를 돌려줘요. 주소 글자를 틀렸을 때 가장 먼저 보는 응답이에요.",
  },
];

function statusClass(status: number): string {
  if (status < 300) return "bg-ok text-surface dark:bg-ok-dark dark:text-background-dark";
  return "bg-destructive text-surface dark:bg-destructive-dark dark:text-background-dark";
}

export function CafeApiPlayground() {
  const [index, setIndex] = useState(0);
  const s = SAMPLES[index];

  return (
    <div data-figure className="not-prose panel my-6 p-4 sm:p-5">
      <p className={`text-label ${MUTED}`}>보낼 요청을 골라요</p>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="요청 고르기">
        {SAMPLES.map((x, i) => (
          <button
            key={x.path}
            type="button"
            onClick={() => setIndex(i)}
            aria-pressed={i === index}
            className={`tap-feedback min-h-11 px-3 font-mono text-label ${i === index ? "btn-action" : "btn"}`}
          >
            {x.path}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col overflow-hidden rounded-[6px] border border-line dark:border-line-dark" aria-live="polite">
        <div className="flex min-w-0 items-center gap-2 border-b border-line bg-surface-2 px-3 py-2 dark:border-line-dark dark:bg-surface-2-dark">
          <span className="shrink-0 font-mono text-label font-bold">GET</span>
          <span className="min-w-0 break-all font-mono text-label">{s.path}</span>
        </div>
        <div className="flex items-center gap-2 px-3 pt-2">
          <span className={`rounded-sm px-1.5 py-0.5 font-mono text-label font-bold ${statusClass(s.status)}`}>{s.status}</span>
          <span className="font-mono text-label">{s.reason}</span>
        </div>
        <pre className="m-0 max-h-72 overflow-auto whitespace-pre px-3 py-2 font-mono text-[12px] leading-relaxed">{s.body}</pre>
      </div>

      <p className="mt-3 break-keep text-label leading-relaxed">{s.note}</p>
    </div>
  );
}
