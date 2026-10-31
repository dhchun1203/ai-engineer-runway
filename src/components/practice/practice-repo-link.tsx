'use client';

// 파이썬 손풀기 목록의 "내 저장소" 칸. 주소가 있으면 GitHub으로 여는 버튼을, 없거나 바꾸는
// 중이면 입력칸을 보인다. 저장에 실패해도 입력한 글은 그대로 둔다.

import { useState, type FormEvent } from 'react';
import { ExternalLink } from 'lucide-react';
import { savePracticeRepo } from '@/app/practice/actions';

export function PracticeRepoLink({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [editing, setEditing] = useState(initialUrl === null);
  const [value, setValue] = useState(initialUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await savePracticeRepo(value);
      if (result.ok) {
        setUrl(result.url);
        setValue(result.url ?? '');
        setEditing(result.url === null);
      } else {
        setError('https://github.com/내아이디/python-ledger 모양으로 입력해 주세요.');
      }
    } catch {
      setError('저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel flex flex-col gap-3 p-5">
      <h2 className="text-heading font-extrabold">내 저장소</h2>
      {editing ? (
        <form onSubmit={submit} noValidate className="flex flex-col gap-3">
          <label htmlFor="practice-repo-url" className="break-keep text-body font-normal">
            1단원에서 만든 GitHub 저장소 주소를 넣어 두면, 여기서 바로 열 수 있어요.
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="practice-repo-url"
              type="url"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://github.com/내아이디/python-ledger"
              aria-invalid={error !== null}
              aria-describedby={error ? 'practice-repo-error' : undefined}
              className="min-h-11 w-full min-w-0 flex-1 border border-line bg-surface-2 p-3 text-body font-normal text-foreground dark:border-line-dark dark:bg-surface-2-dark dark:text-foreground-dark"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-action tap-feedback flex-1 text-body sm:flex-none">
                {saving ? '저장 중' : '저장'}
              </button>
              {url ? (
                <button
                  type="button"
                  onClick={() => {
                    setValue(url);
                    setError(null);
                    setEditing(false);
                  }}
                  className="btn tap-feedback flex-1 text-body sm:flex-none"
                >
                  취소
                </button>
              ) : null}
            </div>
          </div>
          {error ? (
            <p id="practice-repo-error" role="alert" className="break-keep text-label font-bold text-accent dark:text-accent-dark">
              {error}
            </p>
          ) : null}
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="break-all text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
            {url}
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-action tap-feedback inline-flex items-center gap-1.5 text-body"
            >
              내 저장소 열기
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            </a>
            <button type="button" onClick={() => setEditing(true)} className="btn tap-feedback text-body">
              주소 바꾸기
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
