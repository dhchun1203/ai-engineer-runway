import { useMemo } from "react";
import * as runtime from "react/jsx-runtime";
import type { ComponentType } from "react";
import { CodeBlock } from "@/components/code-block";

// Velite는 MDX를 빌드 타임에 함수 본문(code) 문자열로 컴파일한다.
// 이 컴포넌트는 그 문자열을 다시 React 컴포넌트로 되돌리는 유일하게 올바른 방법이다 —
// 대체 MDX 로더를 직접 만들지 않는다.
const useMDXComponent = (code: string) => {
  // code(레슨별 고정 문자열)가 바뀔 때만 새로 컴파일한다 — 매 렌더마다
  // 새 컴포넌트 아이덴티티를 만들지 않도록 메모이즈(react-hooks/static-components).
  return useMemo(() => {
    const fn = new Function(code);
    return fn({ ...runtime }).default;
  }, [code]);
};

// 모든 MDX 렌더 지점(/lesson, /about)이 공유하는 기본 매핑. 호출부마다 따로
// 넘기게 두면 한쪽을 빠뜨리기 쉬우므로 여기 한 곳에서 주입한다.
// pre -> CodeBlock: 동작하는 복사 버튼을 붙인다(code-block.tsx 주석 참고).
const defaultComponents: Record<string, ComponentType> = {
  pre: CodeBlock as ComponentType,
};

export const MDXContent = ({
  code,
  components,
}: {
  code: string;
  components?: Record<string, ComponentType>;
}) => {
  const Component = useMDXComponent(code);
  const merged = components ? { ...defaultComponents, ...components } : defaultComponents;
  // Velite의 공식 런타임 MDX 렌더 패턴 — 컴파일된 MDX는 본질적으로 동적이라
  // 모듈 스코프에 미리 선언할 수 없다. code가 바뀔 때만 재계산되도록 위에서
  // useMemo로 이미 감쌌으므로 react-hooks/static-components는 여기서 오탐이다.
  // eslint-disable-next-line react-hooks/static-components
  return <Component components={merged} />;
};
