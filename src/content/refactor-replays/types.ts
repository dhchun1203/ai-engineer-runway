// 리팩터링 재생기(RefactorReplay) 데이터 모양.
// 줄은 앞뒤 공백까지 정확히 같은 문자열로 찾는다(들여쓰기 포함).
export type ReplayOp =
  | { mark: [string, string] }
  | { after: string; lines: string[] }
  | { replace: [string, string]; lines: string[] };

export type ReplayStep = {
  title: string;
  say: string;
  ops: ReplayOp[];
};

export type RefactorReplayData = {
  original: string[];
  steps: ReplayStep[];
  /** 완성 화면 설명. 앞에 "N줄이 M줄이 됐어요."가 자동으로 붙는다. */
  doneSay: string;
};
