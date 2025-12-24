"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { assets } from "@/assets/assets";
import Sidebar from "@/components/Sidebar";
import PromptBox from "@/components/PromptBox";
import Message from "@/components/Message";
import { useAppContext } from "@/context/AppContext";

export default function Home() {
  const [expand, setExpand] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { setSelectedChat } = useAppContext();
  const containerRef = useRef(null);

  // Reset chat selection on Home Page load
  useEffect(() => {
    setSelectedChat(null);
    setMessages([]);
  }, [setSelectedChat]);

  // Auto-scroll when messages update
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#292a2d]">
      {/* Sidebar - Controls mobile state via 'expand' prop */}
      <Sidebar expand={expand} setExpand={setExpand} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col items-center px-4 bg-[#292a2d] text-white relative w-full">
        
        {/* --- MOBILE TOP BAR --- */}
        <div className="md:hidden w-full flex items-center justify-between py-4 shrink-0 z-10">
          <Image
            onClick={() => setExpand(!expand)}
            className="w-6 cursor-pointer"
            src={assets.menu_icon}
            alt="Menu"
          />
          <Image className="opacity-70 w-6" src={assets.chat_icon} alt="Chat" />
        </div>

        {/* --- CONDITIONAL LAYOUT --- */}
        {messages.length === 0 ? (
          
          /* === STATE 1: NO CHAT (CENTERED PROMPT BOX) === */
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl gap-6 -mt-16">
              {/* Logo & Greeting */}
              <div className="flex flex-col items-center gap-3 mb-4 animate-fadeIn">
                 <Image className="h-16 w-16" src={assets.logo_icon} alt="Logo" />
                 <p className="text-2xl font-medium text-white/90">Hi, I am Agentic AI</p>
                 <p className="text-sm text-gray-400">How can I help you today?</p>
              </div>

              {/* Centered Prompt Box */}
              <div className="w-full">
                <PromptBox
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    setMessages={setMessages}
                    threadId={null}
                />
              </div>
              
              {/* Footer text */}
              <p className="text-xs text-center text-gray-500 mt-2">
                 AI-generated, for reference only
              </p>
          </div>

        ) : (

          /* === STATE 2: ACTIVE CHAT (MESSAGES + BOTTOM BOX) === */
          <>
            {/* Scrollable Messages Area */}
            <div
              ref={containerRef}
              className="flex-1 w-full overflow-y-auto custom-scrollbar"
            >
                <div className="flex flex-col items-center w-full max-w-3xl mx-auto pt-10 pb-32">
                  {messages.map((msg, index) => {
                    const isLastMessage = index === messages.length - 1;
                    const showLoader = isLastMessage && msg.role === "assistant" && isLoading;

                    return (
                      <Message
                        key={index}
                        role={msg.role}
                        content={msg.content}
                        isGenerating={showLoader}
                      />
                    );
                  })}
                </div>
            </div>

            {/* Bottom Fixed Prompt Box Area */}
            <div className="w-full shrink-0 pb-6 bg-[#292a2d] flex flex-col items-center">
              <PromptBox
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setMessages={setMessages}
                threadId={null}
              />
              <p className="text-xs text-center text-gray-500 mt-2">
                AI-generated, for reference only
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}