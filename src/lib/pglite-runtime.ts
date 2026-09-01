// 브라우저 안 SQL 실행 — 지연 로드 런타임 (quick 260901-ksv, Task 1).
// pyodide-runtime.ts(같은 파일럿의 Python 런타임)의 골격을 그대로 미러링한다:
// 버전 상수 고정, 최소 타입 선언, 전용 LoadError 클래스, module-scope Promise
// 캐시(+ 실패 시 캐시 비움), 단일 진입 함수. 차이는 세 가지 —
//   (a) <script> 주입이 아니라 dynamic import(ESM)로 로드한다.
//   (b) 블록마다 새 네임스페이스가 아니라 페이지 단위 단일 인스턴스를 지속한다
//       (Pyodide와 정반대 — SQL 레슨은 "셋업 한 번 → 쿼리 여러 번"이 실제 흐름).
//   (c) 출력이 stdout 텍스트가 아니라 statement별 결과 객체 배열이다.
//
// package.json은 건드리지 않는다: @electric-sql/pglite는 npm 의존성이 아니고
// 정적 import도 쓰지 않는다. 번들러가 이 모듈을 보는 순간 "실행 전 0바이트"
// 계약이 깨진다.

// 버전은 고정한다 — `latest` 같은 이동 표적을 쓰면 CDN 쪽이 바뀔 때 사이트가
// 조용히 고장 난다(threat T-KSV-01). jsDelivr의 버전 경로 세그먼트는 불변이므로
// 이 상수를 바꾸지 않는 한 배포 후 내용이 바뀌지 않는다. 200 확인됨
// (curl -sI https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.8/+esm).
const PGLITE_VERSION = '0.5.8';
const PGLITE_CDN_URL = `https://cdn.jsdelivr.net/npm/@electric-sql/pglite@${PGLITE_VERSION}/+esm`;

// PGlite의 공식 타입 선언이 이 저장소엔 없다(패키지 미설치) — 이 모듈이 실제로
// 쓰는 표면만 최소로 선언한다. exec()는 세미콜론으로 구분된 여러 statement를
// 순서대로 실행하고 statement별 결과 배열을 돌려준다(셋업 블록의 여러
// DDL/DML, JOIN 비교 블록의 SELECT 2개를 한 번에 처리하는 핵심).
export interface PGliteField {
  name: string;
  dataTypeID: number;
}

export interface PGliteResult {
  rows: Array<Record<string, unknown>>;
  fields: PGliteField[];
  affectedRows?: number;
}

export interface PGliteInterface {
  waitReady: Promise<void>;
  exec(sql: string): Promise<PGliteResult[]>;
}

interface PGliteModule {
  PGlite: new () => PGliteInterface;
}

// CDN/로드 실패와 SQL 실행 실패를 구분하기 위한 전용 에러 클래스 —
// run-sql.tsx가 instanceof로 갈라 다른 문구를 낸다.
export class PGliteLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PGliteLoadError';
  }
}

// 번들러 정적 분석을 우회한다(실행 전 0바이트 계약의 핵심) — 지정자를 빌드
// 타임에 분석 불가능하게 만들기 위해 간접 dynamic import를 쓴다. Next
// 16(Turbopack)이 정적 import(u) 문자열을 번들 그래프에 넣으면 실행 전
// 0바이트가 깨진다.
const dynamicImport = new Function('u', 'return import(u)') as (url: string) => Promise<PGliteModule>;

async function loadPgliteRuntime(): Promise<PGliteInterface> {
  const mod = await dynamicImport(PGLITE_CDN_URL);
  if (typeof mod.PGlite !== 'function') {
    throw new Error('PGLITE_EXPORT_MISSING');
  }
  const db = new mod.PGlite();
  await db.waitReady;
  return db;
}

// module-scope 단일 인스턴스 + Promise 캐시. Pyodide와 정반대로 인스턴스를
// 재사용하고 지속한다 — SQL 레슨은 셋업 블록이 스키마를 만들고 쿼리 블록들이
// 그 표를 참조하므로, 지속 인스턴스라야 셋업 후 쿼리가 동작한다. 실패한
// Promise는 캐시에서 비워 재시도 가능하게 한다.
let pglitePromise: Promise<PGliteInterface> | null = null;

function getPglite(): Promise<PGliteInterface> {
  if (!pglitePromise) {
    pglitePromise = loadPgliteRuntime().catch((err: unknown) => {
      pglitePromise = null;
      throw err;
    });
  }
  return pglitePromise;
}

export interface RunSqlResult {
  results: PGliteResult[];
  error: string | null;
}

// { sql }을 받아 { results, error }를 돌려주는 단일 진입점. getPglite() 실패는
// PGliteLoadError로 throw한다(런타임 로드 실패). db.exec(sql) 성공 시
// { results, error: null }. Postgres 예외(relation does not exist, syntax
// error 등)는 삼키지 않고 message 원문을 { results: [], error: message }로
// 돌려준다 — 셋업 전 쿼리/오타 SQL의 진짜 Postgres 에러를 교육적으로 그대로
// 보여주기 위함.
export async function runSql(sql: string): Promise<RunSqlResult> {
  let db: PGliteInterface;
  try {
    db = await getPglite();
  } catch (err) {
    throw new PGliteLoadError(err instanceof Error ? err.message : String(err));
  }

  try {
    const results = await db.exec(sql);
    return { results, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { results: [], error: message };
  }
}
