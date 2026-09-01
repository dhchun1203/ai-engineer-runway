// 브라우저 안 파이썬 실행 — 지연 로드 런타임 (quick 260901-iqk, Task 1).
//
// package.json을 건드리지 않는다: pyodide는 npm 의존성이 아니고, 정적 import도
// 쓰지 않는다. 번들러가 이 모듈을 보는 순간 "실행 전 0바이트" 계약이 깨진다.
// 로드는 <script> 태그 주입으로만 한다.
//
// 버전은 고정한다 — `latest` 같은 이동 표적을 쓰면 CDN 쪽이 바뀔 때 사이트가
// 조용히 고장 난다(threat T-IQK-01). 확인 방법: `npm view pyodide version`
// (2026-09-01 실측 314.0.6) → `https://cdn.jsdelivr.net/pyodide/v314.0.6/full/pyodide.js`가
// 200을 주는지 curl로 직접 확인. jsDelivr의 버전 경로 세그먼트는 불변이므로
// 이 상수를 바꾸지 않는 한 배포 후 내용이 바뀌지 않는다.
const PYODIDE_VERSION = '314.0.6';
const PYODIDE_CDN_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_SCRIPT_URL = `${PYODIDE_CDN_BASE}pyodide.js`;

// pyodide.js가 window.loadPyodide를 노출하지만, pyodide 패키지가 devDependency로도
// 없으므로 이 저장소에는 공식 타입 선언이 없다. 이 모듈이 실제로 쓰는 표면만
// 최소로 선언한다(Context7 /pyodide/pyodide 문서 기준: globals.get('dict')()로
// 네임스페이스 생성, runPythonAsync(code, { globals })로 격리 실행,
// setStdout/setStderr({ batched })로 줄 단위 출력 수집).
interface PyodideNamespace {
  get(name: string): unknown;
}

interface PyodideDictFactory {
  get(name: 'dict'): () => PyodideNamespace;
}

export interface PyodideInterface {
  runPythonAsync(code: string, options?: { globals?: PyodideNamespace }): Promise<unknown>;
  globals: PyodideDictFactory;
  setStdout(options: { batched: (msg: string) => void }): void;
  setStderr(options: { batched: (msg: string) => void }): void;
}

type LoadPyodideFn = (options: { indexURL: string }) => Promise<PyodideInterface>;

declare global {
  interface Window {
    loadPyodide?: LoadPyodideFn;
  }
}

// 런타임 로드 실패(인터넷/CDN 문제)와 코드 실행 실패(파이썬 예외)를 구분하기
// 위한 전용 에러 클래스 — run-python.tsx가 instanceof로 갈라 다른 문구를 낸다.
export class PyodideLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PyodideLoadError';
  }
}

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('SCRIPT_LOAD_FAILED'));
    document.head.appendChild(script);
  });
}

async function loadPyodideRuntime(): Promise<PyodideInterface> {
  await injectScript(PYODIDE_SCRIPT_URL);
  if (typeof window.loadPyodide !== 'function') {
    throw new Error('LOAD_PYODIDE_MISSING');
  }
  return window.loadPyodide({ indexURL: PYODIDE_CDN_BASE });
}

// 모듈 스코프 캐시 — 두 번째 클릭이나 두 번째 블록이 런타임을 다시 내려받지
// 않는다. 실패한 Promise는 캐시에서 비워 재시도가 가능하게 한다(한 번 실패하면
// 영원히 못 쓰는 상태를 만들지 않는다).
let pyodideLoadPromise: Promise<PyodideInterface> | null = null;

function getPyodide(): Promise<PyodideInterface> {
  if (!pyodideLoadPromise) {
    pyodideLoadPromise = loadPyodideRuntime().catch((err: unknown) => {
      pyodideLoadPromise = null;
      throw err;
    });
  }
  return pyodideLoadPromise;
}

export interface RunPythonResult {
  stdout: string;
  error: string | null;
}

// { code }를 받아 { stdout, error }를 돌려주는 단일 진입점. 블록마다 새 전역
// 네임스페이스에서 실행한다 — 같은 인터프리터는 재사용하되 변수는 공유하지
// 않는다(앞 블록의 변수가 뒤 블록에 남아 있으면 "다시 실행하면 결과가 달라지는"
// 최악의 학습 경험이 된다). 파이썬 예외는 삼키지 않고 메시지 원문을 error로
// 돌려준다(레슨 해보기 3번이 TypeError 원문을 읽는 과제).
export async function runPythonCode(code: string): Promise<RunPythonResult> {
  let pyodide: PyodideInterface;
  try {
    pyodide = await getPyodide();
  } catch (err) {
    throw new PyodideLoadError(err instanceof Error ? err.message : String(err));
  }

  const lines: string[] = [];
  pyodide.setStdout({ batched: (msg) => lines.push(msg) });
  pyodide.setStderr({ batched: (msg) => lines.push(msg) });

  const namespace = pyodide.globals.get('dict')();

  try {
    await pyodide.runPythonAsync(code, { globals: namespace });
    return { stdout: lines.join('\n'), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { stdout: lines.join('\n'), error: message };
  }
}
