'use client';

// 브라우저 안 SQL 실행 UI (quick 260901-ksv, Task 2). run-python.tsx를 그대로
// 복제하되 출력 렌더만 바꾼다 — runSql이 돌려준 결과를 stdout 텍스트가 아니라
// statement별 HTML 표(또는 DDL/DML 상태 메시지)로 순서대로 그린다.
//
// 코드 원문 추출은 run-python.tsx·code-block.tsx와 같은 방식이다: 래퍼 안
// [data-line]의 textContent를 '\n'으로 잇는다. props.children 트리를
// 순회하지 않는다 — Shiki가 만든 span 구조에 물려 깨진다.

import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { PGliteLoadError, runSql, type PGliteResult } from '@/lib/pglite-runtime';

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

// 결과 하나(statement 하나)를 렌더한다. fields가 있으면 결과 표, 없으면
// DDL/DML 상태 메시지 한 줄. 표는 아이패드 가로 스크롤을 위해 overflow-x-auto
// div로 감싼다(mdx-content.tsx TableWrapper와 같은 원칙).
function ResultBlock({ result, index }: { result: PGliteResult; index: number }) {
  if (result.fields.length === 0) {
    const label =
      typeof result.affectedRows === 'number' ? `실행 완료 (${result.affectedRows}행 영향)` : '실행 완료';
    return (
      <p key={index} className="text-label font-normal text-muted dark:text-muted-dark">
        {label}
      </p>
    );
  }

  return (
    <div key={index} className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            {result.fields.map((field) => (
              <th key={field.name}>{field.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {result.fields.map((field) => {
                const value = row[field.name];
                return (
                  <td key={field.name}>
                    {value === null || value === undefined ? (
                      <span className="text-muted dark:text-muted-dark">NULL</span>
                    ) : (
                      String(value)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RunSQL({ children }: { children: ReactNode }) {
  const staticBlockRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<PGliteResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState<string | null>(null);
  const [seedCode, setSeedCode] = useState<string | null>(null);

  const runCode = useCallback(async (sql: string) => {
    setStatus((prev) => (prev === 'idle' ? 'loading' : 'running'));
    setErrorMessage(null);
    try {
      const result = await runSql(sql);
      if (result.error) {
        setResults(result.results);
        setErrorMessage(result.error);
        setStatus('error-run');
      } else {
        setResults(result.results);
        setErrorMessage(null);
        setStatus('done');
      }
    } catch (err) {
      if (err instanceof PGliteLoadError) {
        setErrorMessage('SQL 실행 환경을 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.');
      } else {
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
      setStatus('error-load');
    }
  }, []);

  const handleRunClick = useCallback(() => {
    const sql = isEditing && editedCode !== null ? editedCode : extractSourceCode(staticBlockRef.current);
    void runCode(sql);
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
      ? 'SQL 실행 환경을 준비하는 중이에요…'
      : status === 'running'
        ? '실행 중…'
        : status === 'error-load'
          ? '실행 환경을 불러오지 못했어요'
          : status === 'error-run'
            ? '쿼리 실행 중 에러가 발생했어요'
            : status === 'done'
              ? '실행 완료'
              : '';

  return (
    <div data-run-sql>
      {/* 원본 하이라이팅 블록은 편집 중에도 언마운트하지 않고 숨기기만 한다 —
          "원래대로"를 누르면 다시 이 DOM에서 코드 원문을 뽑아야 한다. */}
      <div ref={staticBlockRef} hidden={isEditing}>
        {children}
      </div>

      <div data-print-hide>
        {isEditing ? (
          <div className="panel mt-2 p-3">
            <label className="text-label mb-2 block font-normal text-muted dark:text-muted-dark">
              SQL을 고쳐서 실행할 수 있어요. 다 고쳤으면 아래 실행 버튼을 누르세요.
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
              aria-label="고친 SQL"
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
              처음 실행은 SQL 환경을 내려받느라 시간이 걸려요(10초 이상 걸릴 수 있어요).
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
                {results.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {results.map((result, index) => (
                      <ResultBlock key={index} result={result} index={index} />
                    ))}
                  </div>
                ) : status === 'done' ? (
                  <p className="text-label font-normal text-muted dark:text-muted-dark">
                    출력이 없습니다.
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
