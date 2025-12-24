"use client";
import React, { useState, memo } from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import toast from "react-hot-toast";
import { FaCheck, FaCopy } from "react-icons/fa"; 
import Loader from "./Loader";

const Message = memo(({ role, content, isGenerating }) => {
  const isUser = role === "user";

  const copyMessage = () => {
    navigator.clipboard.writeText(content);
    toast.success("Message copied");
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? "justify-end" : "justify-start"}`}>
      
      {/* Avatar (AI Only) */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 aspect-square mr-4 relative">
          
          {/* Loader Logic: Shows if isGenerating is true and this is the active message */}
          {isGenerating && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 z-10">
                 <Loader />
             </div>
          )}

          <Image
            src={assets.gemini_icon || assets.logo_icon} 
            alt="AI"
            width={36}
            height={36}
            className="rounded-full w-8 h-8 border absolute border-white/10 p-1 bg-black/20 z-0"
          />
        </div>
      )}

      {/* Message Bubble */}
      <div className={`relative group max-w-3xl w-full ${isUser ? "flex flex-col items-end" : ""}`}>
        
        <div
          className={`relative px-5 py-4 rounded-2xl shadow-sm overflow-hidden
          ${isUser 
            ? "bg-[#2f2f33] text-white rounded-tr-sm" 
            : "text-gray-200 rounded-tl-sm w-full" 
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
          ) : (
            <div className="markdown-body text-[15px] leading-7">
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const language = match ? match[1] : "text";

                    if (!inline) {
                      return (
                        <CodeBlock language={language} value={String(children).replace(/\n$/, "")} />
                      );
                    }
                    
                    return (
                      <code className="bg-[#3b3b42] text-amber-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    );
                  },
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4 border border-white/10 rounded-lg">
                      <table className="min-w-full divide-y divide-white/10 text-left">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
                  th: ({ children }) => <th className="px-4 py-2 text-sm font-semibold text-gray-200">{children}</th>,
                  td: ({ children }) => <td className="px-4 py-2 text-sm border-t border-white/5">{children}</td>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      {children}
                    </a>
                  ),
                  ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
                }}
              >
                {content}
              </Markdown>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={`flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200
            ${isUser ? "mr-1" : "ml-1"}`}
        >
            <ActionButton icon={assets.copy_icon} onClick={copyMessage} tooltip="Copy" />
            
            {isUser ? (
                <ActionButton icon={assets.pencil_icon} tooltip="Edit" />
            ) : (
                <>
                    <ActionButton icon={assets.regenerate_icon} tooltip="Regenerate" />
                    <ActionButton icon={assets.like_icon} tooltip="Good response" />
                    <ActionButton icon={assets.dislike_icon} tooltip="Bad response" />
                </>
            )}
        </div>

      </div>
    </div>
  );
});

// --- Internal Components ---

const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-white/5">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
          {copied ? "Copied!" : "Copy code"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: "1.5rem",
          fontSize: "0.9rem",
          lineHeight: "1.5",
          background: "transparent", 
        }}
        showLineNumbers={true}
        wrapLines={true}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

const ActionButton = ({ icon, onClick, tooltip }) => (
    <button 
        onClick={onClick} 
        title={tooltip}
        className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
    >
        {icon ? (
             <Image src={icon} alt={tooltip} width={16} height={16} className="opacity-70" />
        ) : (
             <span className="text-xs text-gray-500">•</span>
        )}
    </button>
);

Message.displayName = 'Message'; // Required for memoized components
export default Message;