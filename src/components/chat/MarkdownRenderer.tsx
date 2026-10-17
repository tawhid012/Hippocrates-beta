"use client";

import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

const REMARK_PLUGINS = [remarkGfm];

const MARKDOWN_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ ...props }) => (
    <h1
      {...props}
      className="text-lg sm:text-xl font-bold text-foreground mt-4 mb-2 first:mt-0 tracking-tight"
    />
  ),
  h2: ({ ...props }) => (
    <h2
      {...props}
      className="text-base sm:text-lg font-bold text-foreground mt-4 mb-2 first:mt-0 tracking-tight"
    />
  ),
  h3: ({ ...props }) => (
    <h3
      {...props}
      className="text-[15px] sm:text-base font-semibold text-foreground mt-3 mb-1.5 first:mt-0"
    />
  ),
  p: ({ ...props }) => (
    <p
      {...props}
      className="leading-[1.7] text-foreground/90 my-2.5 first:mt-0 last:mb-0"
    />
  ),
  ul: ({ ...props }) => (
    <ul
      {...props}
      className="list-disc pl-5 my-3 space-y-1.5 marker:text-muted-foreground"
    />
  ),
  ol: ({ ...props }) => (
    <ol
      {...props}
      className="list-decimal pl-5 my-3 space-y-1.5 marker:font-medium marker:text-muted-foreground"
    />
  ),
  li: ({ ...props }) => (
    <li
      {...props}
      className="leading-[1.65] text-foreground/90 pl-1"
    />
  ),
  strong: ({ ...props }) => (
    <strong
      {...props}
      className="font-semibold text-foreground"
    />
  ),
  em: ({ ...props }) => (
    <em
      {...props}
      className="italic text-foreground/80"
    />
  ),
  blockquote: ({ ...props }) => (
    <blockquote
      {...props}
      className="border-l-3 border-emerald-500 pl-4 py-1.5 my-3 italic text-foreground/85 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-r-xl"
    />
  ),
  hr: ({ ...props }) => (
    <hr
      {...props}
      className="my-5 border-border"
    />
  ),
  a: ({ ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 font-medium transition-colors"
    />
  ),
  table: ({ ...props }) => (
    <div className="overflow-x-auto my-4 rounded-xl border border-border bg-card/60 dark:bg-slate-900/60 shadow-xs">
      <table {...props} className="min-w-full divide-y divide-border text-xs sm:text-sm" />
    </div>
  ),
  th: ({ ...props }) => (
    <th
      {...props}
      className="bg-muted px-3.5 py-2.5 text-left font-semibold text-foreground"
    />
  ),
  td: ({ ...props }) => (
    <td
      {...props}
      className="px-3.5 py-2.5 border-t border-border text-foreground/90"
    />
  ),
  code: ({ className: codeClassName, children, ...props }) => {
    const isInline = !codeClassName && typeof children === "string" && !children.includes("\n");
    if (isInline) {
      return (
        <code
          {...props}
          className="bg-muted border border-border text-foreground px-1.5 py-0.5 rounded-md text-[13px] font-mono font-medium"
        >
          {children}
        </code>
      );
    }
    return (
      <pre className="bg-slate-950 text-slate-100 p-4 rounded-xl overflow-x-auto my-3 text-xs font-mono border border-border shadow-xs">
        <code {...props} className={codeClassName}>
          {children}
        </code>
      </pre>
    );
  },
};

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
  isStreaming,
}: MarkdownRendererProps) {
  if (!content && !isStreaming) return null;

  return (
    <div
      className={cn(
        "text-[15px] sm:text-[15.5px] leading-[1.7] text-foreground tracking-[-0.01em]",
        "space-y-3 chat-selectable",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        components={MARKDOWN_COMPONENTS}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span
          className="inline-block w-1.5 h-4 ml-1 bg-blue-500 align-middle animate-pulse rounded-[1px]"
          aria-hidden="true"
        />
      )}
    </div>
  );
});
