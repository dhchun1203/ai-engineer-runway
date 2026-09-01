'use client';

// 브라우저 안 파이썬 실행 UI (quick 260901-iqk, Task 1+2). children으로 서버가
// 이미 렌더한 하이라이팅된 코드 블록(code-block.tsx의 CodeBlock)을 받고, 그
// 아래에 실행 컨트롤과 출력 영역을 붙인다.
//
// 코드 원문 추출은 code-block.tsx와 같은 방식이다: 래퍼 안 [data-line]의
// textContent를 '\n'으로 잇는다. props.children 트리를 순회하지 않는다 —
// Shiki가 만든 span 구조에 물려 깨진다(preflight 2).

import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { PyodideLoadError, runPythonCode } from '@/lib/pyodide-runtime';

type Status = 'idle' | 'loading' | 'running' | 'done' | 'error-load' | 'error-run';

function extractSourceCode(wrapper: HTMLDivElement | null): string {
  if (!wrapper) return '';
  const lines = wrapper.querySelectorAll('[data-line]');
  if (lines.length > 0) {
    return Array.from(lines, (line) => line.textContent ?? '').join('\n');
  }
  // 폴백 — code-block.tsx와 같은 원칙: [data-line]이 없으면 innerText로 대체.
  const pre = wrapper.querySelector('pre');
  return pre?.textContent ?? '';
}

export function RunPython({ children }: { children: ReactNode }) {
  const staticBlockRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [output, setOutput] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState<string | null>(null);
  const [seedCode, setSeedCode] = useState<string | null>(null);

  const runCode = useCallback(async (code: string) => {
    setStatus((prev) => (prev === 'idle' ? 'loading' : 'running'));
    setErrorMessage(null);
    try {
      const result = await runPythonCode(code);
      if (result.error) {
        setOutput(result.stdout || null);
        setErrorMessage(result.error);
        setStatus('error-run');
      } else {
        setOutput(result.stdout);
        setErrorMessage(null);
        setStatus('done');
      }
    } catch (err) {
      if (err instanceof PyodideLoadError) {
        setErrorMessage(
          '파이썬 실행 환경을 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.',
        );
      } else {
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
      setStatus('error-load');
    }
  }, []);

  const handleRunClick = useCallback(() => {
    const code = isEditing && editedCode !== null ? editedCode : extractSourceCode(staticBlockRef.current);
    void runCode(code);
  }, [isEditing, editedCode, runCode]);

  const handleEditClick = useCallback(() => {
    if (!isEditing) {
      const source = extractSourceCode(staticBlockRef.current);
      setSeedCode(source);
      setEditedCode(source);
      setIsEditing(true);
    }
  }, [isEditing]);

  const handleResetClick = useCallback(() => {
    setIsEditing(false);
    setEditedCode(null);
    setSeedCode(null);
  }, []);

  const isBusy = status === 'loading' || status === 'running';
  const statusLabel =
    status === 'loading'
      ? '파이썬 실행 환경을 준비하는 중이에요…'
      : status === 'running'
        ? '실행 중…'
        : status === 'error-load'
          ? '실행 환경을 불러오지 못했어요'
          : status === 'error-run'
            ? '코드 실행 중 에러가 발생했어요'
            : status === 'done'
              ? '실행 완료'
              : '';

  return (
    <div data-run-python>
      {/* 원본 하이라이팅 블록은 편집 중에도 언마운트하지 않고 숨기기만 한다 —
          "원래대로"를 누르면 다시 이 DOM에서 코드 원문을 뽑아야 한다. */}
      <div ref={staticBlockRef} hidden={isEditing}>
        {children}
      </div>

      <div data-print-hide>
        {isEditing ? (
          <div className="panel mt-2 p-3">
            <label className="text-label mb-2 block font-normal text-muted dark:text-muted-dark">
              코드를 고쳐서 실행할 수 있어요. 다 고쳤으면 아래 실행 버튼을 누르세요.
            </label>
            <textarea
              className="code-editor"
              value={editedCode ?? seedCode ?? ''}
              onChange={(e) => setEditedCode(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              rows={20}
              aria-label="고친 파이썬 코드"
            />
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-run
            className="btn-action tap-feedback"
            onClick={handleRunClick}
            disabled={isBusy}
          >
            {isBusy ? '실행 중…' : '실행'}
          </button>
          <button type="button" className="btn tap-feedback" onClick={handleEditClick} disabled={isBusy}>
            고쳐 보기
          </button>
          {isEditing ? (
            <button type="button" className="btn tap-feedback" onClick={handleResetClick} disabled={isBusy}>
              원래대로
            </button>
          ) : null}
          {status === 'idle' ? (
            <span className="text-label font-normal text-muted dark:text-muted-dark">
              처음 실행은 파이썬 환경을 내려받느라 시간이 걸려요(10초 이상 걸릴 수 있어요).
            </span>
          ) : null}
        </div>

        <span role="status" aria-live="polite" className="sr-only">
          {statusLabel}
        </span>

        {status !== 'idle' ? (
          <div data-run-output className="panel mt-2 p-3">
            {status === 'loading' || status === 'running' ? (
              <p className="text-label font-normal text-muted dark:text-muted-dark">{statusLabel}</p>
            ) : status === 'error-load' ? (
              <div>
                <p className="text-label font-normal text-destructive dark:text-destructive-dark">
                  {errorMessage}
                </p>
                <button type="button" className="btn tap-feedback mt-2" onClick={handleRunClick}>
                  다시 시도
                </button>
              </div>
            ) : (
              <>
                {output ? (
                  <pre className="code-output-text">{output}</pre>
                ) : status === 'done' ? (
                  <p className="text-label font-normal text-muted dark:text-muted-dark">
                    출력이 없습니다(이 코드는 print를 실행하지 않았어요).
                  </p>
                ) : null}
                {status === 'error-run' && errorMessage ? (
                  <pre className="code-output-text code-output-error">{errorMessage}</pre>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
