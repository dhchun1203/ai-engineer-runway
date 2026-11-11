// 빌드 재생기(BuildReplay) 데이터 모양. 빈 파일에서 시작해 단계마다 코드 조각을 쌓고,
// 그 단계까지의 코드를 실행한 결과(run)와 객체 상태(state)를 함께 보여 준다.

/** 완성 코드의 한 조각. from 단계에 나타나고, until이 있으면 그 단계에 지워진다(단계는 1부터). */
export type BuildBlock = { from: number; until?: number; lines: string[] };

export type BuildGroup = "product" | "line" | "cart" | "coupon" | "menu";

export type BuildRunEntry = { code: string; out: string; error?: boolean };

export type BuildProduct = {
  number: number | null;
  name: string;
  price: number;
  stock: number;
  /** 재고가 __stock(이름 변형)으로 숨겨졌는지 */
  hidden: boolean;
  /** line_text()가 생겨 목록 표시((재고 N개)/(품절))를 할 수 있는지 */
  listed: boolean;
};

export type BuildState = {
  nextNumber: number | null;
  products: BuildProduct[];
  /** 장바구니 줄을 누가 들고 있는지. cart = Cart 객체, line = CartLine 하나만 */
  holder: "cart" | "line" | null;
  lines: { name: string; number: number | null; qty: number; subtotal: number }[];
  coupon: string | null;
  totals: { total: number; discount: number; ship: number; pay: number } | null;
};

export type BuildStep = {
  short: string;
  title: string;
  concept: string;
  group: BuildGroup;
  /** 설명. `백틱`은 인라인 코드로 그린다 */
  say: string;
  think: { q: string; a: string };
  run: BuildRunEntry[];
  state: BuildState;
};

/** 객체 보드의 이름표. 코드의 변수 이름에 맞춰 바꿀 수 있고, 없으면 기본값을 쓴다. */
export type BuildBoardLabels = {
  /** 클래스 변수 발급기 이름 (기본 next_number) */
  counter?: string;
  /** "cart = " 뒤에 붙는 설명 (기본 Cart 객체, cart.lines) */
  cart?: string;
  /** 장바구니가 비었을 때 문구 (기본 lines = [] (비어 있음)) */
  empty?: string;
  /** 장바구니 줄에서 상품을 가리키는 이름 (기본 item) */
  ptr?: string;
  /** 담은 수량 이름 (기본 qty) */
  qty?: string;
  /** 보드 아래 점선 설명 */
  note?: string;
};

export type BuildReplayData = {
  file: string;
  board?: BuildBoardLabels;
  blocks: BuildBlock[];
  steps: BuildStep[];
};
