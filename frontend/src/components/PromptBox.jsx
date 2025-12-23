// src/components/PromptBox.jsx
"use client";
import React, { useState } from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import toast from "react-hot-toast";

const PromptBox = ({ isLoading, setIsLoading, threadId }) => {
  const [prompt, setPrompt] = useState("");
  
  // Feature Toggles State
  const [activeFeatures, setActiveFeatures] = useState({
    deepThink: false,
    search: false,
    agentic: false,
  });

  const { user, setMessages } = useAppContext();

  const toggleFeature = (feature) => {
    setActiveFeatures((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  const sendPrompt = async (e) => {
    if (e) e.preventDefault();
    
    if (!user) return toast.error("Login to send message");
    if (isLoading) return toast.error("Wait for response");
    if (!prompt.trim()) return;

    const activeThreadId = threadId || "default-thread-id";
    const promptCopy = prompt;
    setPrompt(""); 
    setIsLoading(true);

    try {
      setMessages(prev => [...prev, { role: "user", content: promptCopy }]);
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const response = await fetch("http://localhost:8000/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: activeThreadId,
          message: promptCopy,
        }),
      });

      if (!response.ok) throw new Error(`Server Error: ${response.statusText}`);
      if (!response.body) throw new Error("No response body received");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiResponse = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          aiResponse += chunk;
          setMessages(prev => {
             const newMessages = [...prev];
             const lastMsgIndex = newMessages.length - 1;
             newMessages[lastMsgIndex] = { ...newMessages[lastMsgIndex], content: aiResponse };
             return newMessages;
          });
        }
      }

    } catch (error) {
      console.error("Stream Error:", error);
      toast.error("Failed to get response");
      setPrompt(promptCopy);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 🛠️ FIX: Ensure this container matches the width of the message list (max-w-3xl)
    <form
      className="w-full max-w-3xl bg-[#2f2f33] p-4 rounded-3xl transition-all shadow-xl border border-white/5"
    >
      <textarea
        className="outline-none w-full resize-none overflow-hidden break-words bg-transparent text-white placeholder-white/40 px-2 text-base"
        rows={2}
        placeholder={activeFeatures.agentic ? "Ask Agent to perform a task..." : "Message AI..."}
        onChange={(e) => setPrompt(e.target.value)}
        value={prompt}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendPrompt(e);
          }
        }}
      />

      <div className="flex items-center justify-between text-sm mt-3">
        {/* Feature Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            onClick={() => toggleFeature("deepThink")}
            className={`flex items-center gap-2 text-xs border px-3 py-1.5 rounded-full cursor-pointer transition-all select-none
            ${activeFeatures.deepThink ? "bg-blue-500/20 border-blue-500 text-blue-200" : "border-gray-500/40 text-gray-400 hover:bg-gray-600/30"}`}
          >
            {assets.deepthink_icon && <Image className={`h-4 w-4 ${activeFeatures.deepThink ? "" : "opacity-60"}`} src={assets.deepthink_icon} alt="Think" />}
            Thinking
          </div>

          <div
            onClick={() => toggleFeature("search")}
            className={`flex items-center gap-2 text-xs border px-3 py-1.5 rounded-full cursor-pointer transition-all select-none
            ${activeFeatures.search ? "bg-green-500/20 border-green-500 text-green-200" : "border-gray-500/40 text-gray-400 hover:bg-gray-600/30"}`}
          >
             {assets.search_icon && <Image className={`h-4 w-4 ${activeFeatures.search ? "" : "opacity-60"}`} src={assets.search_icon} alt="Search" />}
            Search
          </div>

          <div
            onClick={() => toggleFeature("agentic")}
            className={`flex items-center gap-2 text-xs border px-3 py-1.5 rounded-full cursor-pointer transition-all select-none
            ${activeFeatures.agentic ? "bg-purple-500/20 border-purple-500 text-purple-200" : "border-gray-500/40 text-gray-400 hover:bg-gray-600/30"}`}
          >
             <span className="text-lg leading-3">⚡</span> 
            Agentic Mode
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={sendPrompt}
            type="submit"
            disabled={isLoading || !prompt}
            className={`${prompt ? "bg-blue-600 shadow-blue-500/20 shadow-md" : "bg-[#55555c]"} h-10 w-10 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200`}
          >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
                assets.send_icon && <Image className={`h-5 w-5 transition-transform ${prompt ? "-rotate-0" : ""}`} src={assets.send_icon} alt="Send" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PromptBox;