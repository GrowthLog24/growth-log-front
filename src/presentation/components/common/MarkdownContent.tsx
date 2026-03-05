"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * 마크다운 콘텐츠 렌더링 컴포넌트
 */
export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  return (
    <div className={`prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-headings:mt-4 prose-headings:mb-2 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        components={{
          // 링크를 새 탭에서 열기
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          ),
          // 코드 블록 스타일링
          code: ({ children, className: codeClassName }) => {
            const isInline = !codeClassName;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 bg-gray-6 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className={codeClassName}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
