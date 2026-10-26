'use client';

import { useState } from 'react';
import { backfillGithubAction } from './github-actions';

// "지금까지 발행한 글 N편 올리기". 결과(올림/실패 수)를 버튼 자리에 한 줄로 보여 준다.
export function GithubBackfillButton({ count }: { count: number }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (count === 0 && result === null) return null;

  async function run() {
    if (pending) return;
    setPending(true);
    const res = await backfillGithubAction();
    setPending(false);
    setResult(res.failed > 0 ? `${res.uploaded}편 올림, ${res.failed}편 실패` : `${res.uploaded}편 올렸어요`);
  }

  return result === null ? (
    <button type="button" onClick={run} disabled={pending} className="btn tap-feedback w-fit text-body">
      {pending ? '올리는 중' : `지금까지 발행한 글 ${count}편 올리기`}
    </button>
  ) : (
    <p className="text-label font-semibold">{result}</p>
  );
}
