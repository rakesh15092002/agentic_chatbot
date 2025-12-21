import Image from "next/image";
import React, { useEffect } from "react";
import { assets } from "@/assets/assets";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Prism from "prismjs";

// Prism languages (add more if needed)
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";

// Prism theme
import "prismjs/themes/prism-tomorrow.css";
import toast from "react-hot-toast";

const Message = ({ role, content }) => {
  useEffect(() => {
    Prism.highlightAll();

  }, [content]);

  const copyMessage = ()=>{
    navigator.clipboard.writeText(content)
    toast.success("Message copied to clipboard")
  }
  return (
    <div className="flex flex-col items-center w-full max-w-3xl text-sm">
      <div
        className={`flex flex-col w-full mb-8 ${
          role === "user" ? "items-end" : ""
        }`}
      >
        <div
          className={`group relative flex max-w-2xl py-3 ${
            role === "user"
              ? "bg-[#414158] px-5 rounded-lg"
              : "gap-3"
          }`}
        >
          {/* Hover Icons */}
          <div
            className={`opacity-0 group-hover:opacity-100 absolute ${
              role === "user"
                ? "-left-16 top-2.5"
                : "left-9 -bottom-6"
            } transition-all`}
          >
            <div className="flex items-center gap-2 opacity-70">
              {role === "user" ? (
                <>
                  <Image onClick={copyMessage} src={assets.copy_icon} alt="copy" className="w-4 cursor-pointer" />
                  <Image src={assets.pencil_icon} alt="edit" className="w-4 cursor-pointer" />
                </>
              ) : (
                <>
                  <Image onClick={copyMessage} src={assets.copy_icon} alt="copy" className="w-4 cursor-pointer" />
                  <Image src={assets.regenerate_icon} alt="regen" className="w-4 cursor-pointer" />
                  <Image src={assets.like_icon} alt="like" className="w-4 cursor-pointer" />
                  <Image src={assets.dislike_icon} alt="dislike" className="w-4 cursor-pointer" />
                </>
              )}
            </div>
          </div>

          {/* Message Content */}
          {role === "user" ? (
            <div className="prose prose-invert max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>
                {content}
              </Markdown>
            </div>
          ) : (
            <>
              <Image
                src={assets.logo_icon}
                alt="AI"
                className="h-9 w-9 p-1 border border-white/15 rounded-full"
              />

              <div className="prose prose-invert max-w-none w-full space-y-4">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline ? (
                        <pre className="rounded-lg">
                          <code
                            className={`language-${match?.[1] || "javascript"}`}
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </code>
                        </pre>
                      ) : (
                        <code className="bg-black/40 px-1 rounded">
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {content}
                </Markdown>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
