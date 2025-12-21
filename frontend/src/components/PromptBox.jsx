import Image from "next/image";
import React, { useState } from "react";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import toast from "react-hot-toast";
import axios from "axios";

const PromptBox = ({ isLoading, setIsLoading }) => {
  const [prompt, setPrompt] = useState("");
  
  // State to manage which features are active
  const [activeFeatures, setActiveFeatures] = useState({
    deepThink: false,
    search: false,
    agentic: false,
  });

  const { user, setChats, selectedChat, setSelectedChat } = useAppContext();

  const toggleFeature = (feature) => {
    setActiveFeatures((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  const sendPrompt = async (e) => {
    // Handle both Enter key and Button click
    if (e) e.preventDefault();
    
    const promptCopy = prompt;

    try {
      if (!user) return toast.error("Login to send message");
      if (isLoading) return toast.error("Wait for the previous prompt response");
      if (!prompt.trim()) return;

      console.log("--- 1. SENDING PROMPT ---");
      console.log("Prompt:", promptCopy);
      console.log("Selected Chat ID:", selectedChat?._id || "NULL (New Chat)");

      setIsLoading(true);
      setPrompt("");

      const userPrompt = {
        role: "user",
        content: promptCopy,
        timeStamp: Date.now(),
      };

      // --- LOGIC FOR NEW CHAT VS EXISTING CHAT ---
      let currentChatId = selectedChat ? selectedChat._id : null;

      if (selectedChat) {
        // 1. Existing Chat: Update UI immediately
        const updatedMessages = [...selectedChat.messages, userPrompt];
        
        // Update Global State
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === selectedChat._id
              ? { ...chat, messages: updatedMessages }
              : chat
          )
        );
        
        // Update Selected View
        setSelectedChat((prev) => ({
          ...prev,
          messages: updatedMessages,
        }));
      } else {
        // 2. New Chat: Create temporary UI state so user sees their message
        console.log("Creating temporary chat UI...");
        setSelectedChat({
          _id: "temp-id", 
          messages: [userPrompt],
          createdAt: Date.now()
        });
      }

      // --- API CALL ---
      const { data } = await axios.post("/api/chat/ai", {
        chatId: currentChatId, // Send null if new chat
        prompt: promptCopy,
        features: activeFeatures, // Sending feature flags
      });

      console.log("--- 2. API RESPONSE RECEIVED ---");
      console.log("Success:", data.success);
      console.log("Full Data Object:", data);

      if (data.success) {
        // If this was a NEW chat, the backend must return the new Chat Object
        const responseChat = data.chat || data.data; 
        const assistantContent = data.data.content || responseChat.content; 
        
        console.log("--- 3. PROCESSING AI MESSAGE ---");
        console.log("AI Message Content:", assistantContent);

        if (!selectedChat || selectedChat._id === "temp-id") {
            // If it was a new chat, add the FULL new chat object to the global list
            if (data.newChat) {
                console.log("Updating Global List with NEW CHAT ID:", data.newChat._id);
                setChats((prev) => [data.newChat, ...prev]); 
                setSelectedChat(data.newChat); 
            } else {
                console.warn("Backend did not return 'newChat' object. Check API response.");
            }
        } else {
             // If existing chat, verify we append the assistant message to global state
             setChats((prevChats)=>prevChats.map((chat)=>chat._id===selectedChat._id?{...chat,messages:[...chat.messages, data.data]}:chat))
        }

        // --- TYPING EFFECT LOGIC ---
        const messageTokens = assistantContent.split(" ");
        let assistantMessage = {
          role: "assistant",
          content: "",
          timeStamp: Date.now(),
        };

        // Initialize empty assistant message in UI
        setSelectedChat((prev) => {
             // If we just got a new chat object from backend, ensure we use its structure
             const base = prev || data.newChat; 
             return {
                 ...base,
                 messages: [...base.messages, assistantMessage]
             }
        });

        // Typing Loop
        messageTokens.forEach((token, i) => {
          setTimeout(() => {
            assistantMessage.content = messageTokens.slice(0, i + 1).join(" ");
            
            setSelectedChat((prev) => {
              if (!prev) return prev; // Safety check
              const updatedMessages = [...prev.messages];
              updatedMessages[updatedMessages.length - 1] = { ...assistantMessage };
              return { ...prev, messages: updatedMessages };
            });
          }, i * 30); // 30ms delay
        });

      } else {
        console.error("Server Error Message:", data.message);
        toast.error(data.message);
        setPrompt(promptCopy); // Restore prompt
      }
    } catch (error) {
      console.error("--- CLIENT CATCH BLOCK ---");
      console.error(error);
      toast.error(error.message || "Something went wrong");
      setPrompt(promptCopy);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
  className={`w-full ${
    (selectedChat?.messages?.length || 0) > 0
      ? "max-w-3xl"
      : "max-w-2xl"
  } bg-[#2f2f33] p-4 rounded-3xl mt-4 transition-all shadow-lg border border-white/5`}
>

      <textarea
        className="outline-none w-full resize-none overflow-hidden break-words bg-transparent text-white placeholder-white/40 px-2"
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
          
          {/* DeepThink Toggle */}
          <div
            onClick={() => toggleFeature("deepThink")}
            className={`flex items-center gap-2 text-xs border px-3 py-1.5 rounded-full cursor-pointer transition-all select-none
            ${
              activeFeatures.deepThink
                ? "bg-blue-500/20 border-blue-500 text-blue-200"
                : "border-gray-500/40 text-gray-400 hover:bg-gray-600/30"
            }`}
          >
            <Image 
                className={`h-4 w-4 ${activeFeatures.deepThink ? "" : "opacity-60"}`} 
                src={assets.deepthink_icon} 
                alt="" 
            />
            Thinking
          </div>

          {/* Web Search Toggle */}
          <div
            onClick={() => toggleFeature("search")}
            className={`flex items-center gap-2 text-xs border px-3 py-1.5 rounded-full cursor-pointer transition-all select-none
            ${
              activeFeatures.search
                ? "bg-green-500/20 border-green-500 text-green-200"
                : "border-gray-500/40 text-gray-400 hover:bg-gray-600/30"
            }`}
          >
            <Image 
                className={`h-4 w-4 ${activeFeatures.search ? "" : "opacity-60"}`} 
                src={assets.search_icon} 
                alt="" 
            />
            Search
          </div>

          {/* Agentic Mode Toggle */}
          <div
            onClick={() => toggleFeature("agentic")}
            className={`flex items-center gap-2 text-xs border px-3 py-1.5 rounded-full cursor-pointer transition-all select-none
            ${
              activeFeatures.agentic
                ? "bg-purple-500/20 border-purple-500 text-purple-200"
                : "border-gray-500/40 text-gray-400 hover:bg-gray-600/30"
            }`}
          >
             <span className="text-lg leading-3">⚡</span> 
            Agentic Mode
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="p-2 hover:bg-white/10 rounded-full cursor-pointer transition">
            <Image className="w-5 opacity-70" src={assets.pin_icon} alt="" />
          </div>

          <button
            onClick={sendPrompt}
            type="submit"
            disabled={isLoading || !prompt}
            className={`${
              prompt ? "bg-primary shadow-primary/20 shadow-md" : "bg-[#55555c]"
            } h-10 w-10 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200`}
          >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
                <Image
                className={`h-5 w-5 transition-transform ${prompt ? "-rotate-0" : ""}`}
                src={prompt ? assets.arrow_icon : assets.arrow_icon_dull}
                alt=""
                />
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PromptBox;