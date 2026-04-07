import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

export default function MarkdownRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={cn("prose-notion max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-semibold mb-4 mt-0 text-foreground">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold mb-3 mt-6 text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mb-2 mt-4 text-foreground">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-foreground/80 mb-3 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="text-sm text-foreground/80 mb-3 pl-4 space-y-1 list-disc">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="text-sm text-foreground/80 mb-3 pl-4 space-y-1 list-decimal">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className="block bg-secondary border border-border rounded-md p-3 text-xs font-mono overflow-x-auto mb-3">
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-secondary border border-border rounded px-1.5 py-0.5 text-xs font-mono">
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-border pl-4 text-muted-foreground italic mb-3">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:no-underline"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          hr: () => <hr className="border-border my-6" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}