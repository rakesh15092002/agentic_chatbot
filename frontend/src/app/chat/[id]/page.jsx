// src/app/chat/[id]/page.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";
import Sidebar from '@/components/Sidebar';
import PromptBox from '@/components/PromptBox';
import Message from '@/components/Message';
import { useAppContext } from "@/context/AppContext";

export default function ChatPage({ params }) {
  const { id } = React.use(params); 

  const [expand, setExpand] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); 

  const { selectedChat, chats, setSelectedChat, fetchMessages, messages, isMessagesLoading } = useAppContext();
  const containerRef = useRef(null);

  useEffect(() => {
    if (chats.length > 0) {
      const currentChat = chats.find(c => c._id === id);
      if (currentChat) setSelectedChat(currentChat);
    }
    if (id) {
      fetchMessages(id);
    }
  }, [id, chats, setSelectedChat]); 

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isMessagesLoading]);

  return (
    <div className="flex h-screen overflow-hidden"> {/* Added overflow-hidden to prevent body scroll */}
      <Sidebar expand={expand} setExpand={setExpand} />
      
      <div className="flex-1 flex flex-col items-center justify-center bg-[#292a2d] text-white relative">
        {selectedChat?.name && (
          <p className="fixed top-6 border border-white/10 py-1.5 px-4 rounded-full font-medium text-sm z-20 bg-[#292a2d] shadow-md">
            {selectedChat.name}
          </p>
        )}

        {/* --- SCROLLABLE CONTAINER --- */}
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar" ref={containerRef}>
            
            {/* --- 🛠️ FIX: Centered Inner Container (Matches PromptBox Width) --- */}
            <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 px-4 pt-24 pb-32">
                
                {isMessagesLoading && messages.length === 0 && (
                   <div className="flex flex-col items-center justify-center h-40 gap-2">
                       <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-gray-400 text-sm">Loading conversation...</p>
                   </div>
                )}
                
                {messages.map((msg, index) => (
                    <Message key={index} role={msg.role} content={msg.content} />
                ))}
                
                {/* Thinking Animation Bubble */}
                {isGenerating && (
                    <div className="flex gap-4 w-full py-3">
                    <Image className="h-9 w-9 p-1 border border-white/15 rounded-full bg-black/20" src={assets.logo_icon || assets.gemini_icon} alt="logo" />
                    <div className="flex items-center gap-1 h-9 px-4 rounded-full bg-[#2f2f33]">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"></div>
                    </div>
                    </div>
                )}
            </div>
        </div>

        {/* --- PROMPT BOX AREA --- */}
        <div className="w-full absolute bottom-0 bg-gradient-to-t from-[#292a2d] via-[#292a2d] to-transparent pt-10 pb-6 px-4 flex flex-col items-center">
             <PromptBox 
                isLoading={isGenerating} 
                setIsLoading={setIsGenerating} 
                threadId={id} 
             />
             <p className="text-xs text-gray-500 mt-2">AI-generated, for reference only</p>
        </div>
      </div>
    </div>
  );
}