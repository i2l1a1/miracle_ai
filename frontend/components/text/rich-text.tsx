"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";

export default function RichText({
    text,
    className = "",
}: {
    text: string;
    className?: string;
}) {
    return (
        <div className={`rich-text ${className}`.trim()}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeSanitize, rehypeHighlight]}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
}
