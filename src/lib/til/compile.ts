import 'server-only';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';

// velite.config.ts의 compileBookMdx와 같은 컴파일 경로의 런타임 버전.
// 사용자가 쓴 TIL 본문 마크다운을 저장 시 함수본문 문자열로 컴파일한다.
// mdx-content.tsx의 MDXContent(new Function(code))가 이 문자열을 렌더한다.
// rehype-pretty-code 옵션은 velite.config.ts와 동일하게 유지한다(드리프트 주의).
const rehypePrettyCodeOptions = {
  theme: { dark: 'github-dark-dimmed', light: 'github-light' },
};

export async function compileTilBody(md: string): Promise<string> {
  if (!md.trim()) return '';
  const { compile } = await import('@mdx-js/mdx');
  const compiled = await compile(
    { value: md },
    {
      outputFormat: 'function-body',
      remarkPlugins: [remarkGfm],
      rehypePlugins: [[rehypePrettyCode, rehypePrettyCodeOptions]],
    },
  );
  return String(compiled);
}
