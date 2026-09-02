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
import { TraceEditor } from '@/components/trace-editor';

type Status = 'idle' | 'loading' | 'running' | 'done' | 'error-load' | 'error-run';
// 세 모드는 상호 배타적이다(하나의 유니언으로 표현해 두 불리언이 동시에
// 참이 되는 버그를 구조적으로 차단한다) — 원본 보기 / 고쳐 보기(편집) /
// 따라 치기(고스트 오버레이).
type Mode = 'view' | 'edit' | 'trace';

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

// 결과 표 하나(SELECT statement 하나)를 렌더한다. 아이패드 가로 스크롤을 위해
// overflow-x-auto div로 감싼다(mdx-content.tsx TableWrapper와 같은 원칙).
function ResultTable({ result }: { result: PGliteResult }) {
  return (
    <div className="overflow-x-auto">
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

// 배치 결과를 렌더한다. SELECT처럼 표가 있는 결과(fields 보유)만 순서대로 표로
// 그린다. 표가 하나도 없는 배치(셋업 블록의 CREATE/INSERT 등 DDL/DML만 있는
// 경우)는 "실행 완료" 한 줄로 합친다 — statement마다 같은 줄을 반복하지 않는다.
// 행 수는 표시하지 않는다: PGlite exec()의 affectedRows는 여러 statement를 한
// 번에 돌리면 배치 누적 합계라(3행 INSERT가 6·11로 보임) 오해를 부른다. 셋업
// 블록의 교육 포인트는 행 수가 아니라 "데이터가 준비되었다"는 사실이다.
function ResultView({ results }: { results: PGliteResult[] }) {
  const tables = results.filter((result) => result.fields.length > 0);

  if (tables.length === 0) {
    return (
      <p className="text-label font-normal text-muted dark:text-muted-dark">
        실행 완료 — 표와 데이터가 준비되었습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tables.map((result, index) => (
        <ResultTable key={index} result={result} />
      ))}
    </div>
  );
}

export function RunSQL({
  children,
  blockGuides,
}: {
  children: ReactNode;
  // 따라 치기 블록 설명(quick 260903-05g). MDX에서 SQL 블록의 논리 블록
  // 순서대로 eli5 설명을 넘긴다. 생략하면 따라 치기에 설명이 붙지 않는다.
  blockGuides?: readonly string[];
}) {
  const staticBlockRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<PGliteResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>('view');
  const [editedCode, setEditedCode] = useState<string | null>(null);
  const [seedCode, setSeedCode] = useState<string | null>(null);
  const [tracedCode, setTracedCode] = useState<string | null>(null);
  const [guideCode, setGuideCode] = useState<string | null>(null);

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
    const sql =
      mode === 'edit'
        ? (editedCode ?? '')
        : mode === 'trace'
          ? (tracedCode ?? '')
          : extractSourceCode(staticBlockRef.current);
    void runCode(sql);
  }, [mode, editedCode, tracedCode, runCode]);

  const handleEditClick = useCallback(() => {
    if (mode !== 'edit') {
      const source = extractSourceCode(staticBlockRef.current);
      setSeedCode(source);
      setEditedCode(source);
      setMode('edit');
    }
  }, [mode]);

  const handleTraceClick = useCallback(() => {
    if (mode !== 'trace') {
      const source = extractSourceCode(staticBlockRef.current);
      setGuideCode(source);
      setTracedCode('');
      setMode('trace');
    }
  }, [mode]);

  const handleResetClick = useCallback(() => {
    setMode('view');
    setEditedCode(null);
    setSeedCode(null);
    setTracedCode(null);
    setGuideCode(null);
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
      <div ref={staticBlockRef} hidden={mode !== 'view'}>
        {children}
      </div>

      <div data-print-hide>
        {mode === 'edit' ? (
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

        {mode === 'trace' ? (
          <TraceEditor
            guide={guideCode ?? ''}
            value={tracedCode ?? ''}
            onChange={setTracedCode}
            ariaLabel="따라 친 SQL"
            blockGuides={blockGuides}
          />
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
          <button type="button" className="btn tap-feedback" onClick={handleTraceClick} disabled={isBusy}>
            따라 치기
          </button>
          {mode !== 'view' ? (
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
                  <ResultView results={results} />
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
