import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
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
    <div className={cn("prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none prose-p:leading-7 prose-li:leading-7 prose-headings:text-foreground prose-strong:text-foreground prose-li:text-muted-foreground prose-pre:overflow-x-auto prose-pre:text-sm prose-code:break-words prose-table:block prose-table:overflow-x-auto prose-img:max-w-full prose-img:rounded-lg", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
    </div>
  );
}