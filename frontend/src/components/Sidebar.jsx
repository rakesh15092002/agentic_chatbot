import Image from "next/image";
import React, { useState } from "react";
import { assets } from "@/assets/assets";
import { useClerk, UserButton } from "@clerk/nextjs";
import { useAppContext } from "@/context/AppContext";
import ChatLabel from "@/components/ChatLabel";

const Sidebar = ({ expand, setExpand }) => {
  const { openSignIn } = useClerk();
  const { user, chats, createNewChat } = useAppContext();
  const [openMenu, setOpenMenu] = useState({ id: 0, open: false });

  const handleScroll = () => {
    if (openMenu.open) setOpenMenu({ id: 0, open: false });
  };

  return (
    <div
      className={`flex flex-col justify-between bg-[#212327] pt-7 transition-all duration-300 z-50 
      max-md:absolute max-md:h-screen relative border-r border-gray-800
      ${expand ? "p-4 w-72" : "md:w-20 w-0 max-md:overflow-hidden"}`}
      // Important: Ensure no onClick={setExpand(false)} is here on the main wrapper
    >
      <div>
        <div className={`flex items-center w-full mb-6 ${expand ? "justify-end" : "justify-center"}`}>
          <div
            onClick={() => setExpand(!expand)}
            className="group flex items-center justify-center hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-200 h-10 w-10 rounded-full cursor-pointer"
          >
            {expand ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </div>
        </div>

        <button
          onClick={createNewChat}
          className={`flex items-center justify-center cursor-pointer transition-all duration-300 ${
            expand ? "bg-primary hover:opacity-90 rounded-full h-12 w-full gap-3 shadow-md" : "group relative h-10 w-10 mx-auto hover:bg-gray-700/50 rounded-full"
          }`}
        >
          <Image className={expand ? "w-5" : "w-6"} src={expand ? assets.chat_icon : assets.chat_icon_dull} alt="New Chat" />
          {expand && <p className="text-white text-base font-medium">New chat</p>}
        </button>

        <div
          onScroll={handleScroll}
          className={`mt-8 text-white/40 text-sm overflow-y-auto max-h-[60vh] custom-scrollbar ${expand ? "block opacity-100" : "hidden opacity-0"}`}
        >
          <p className="my-2 px-2 font-medium text-xs uppercase tracking-wider">Recents</p>
          {chats
            .filter((chat) => chat && chat.name)
            .map((chat) => (
              <ChatLabel key={chat._id} name={chat.name} id={chat._id} openMenu={openMenu} setOpenMenu={setOpenMenu} />
            ))}
        </div>
      </div>

      <div className="mb-4">
        <div onClick={user ? null : openSignIn} className={`flex items-center ${expand ? "hover:bg-white/5 rounded-xl px-3 py-3 justify-start" : "justify-center w-full hover:bg-white/5 rounded-xl py-3"} cursor-pointer text-white/70`}>
          {user ? <div className="flex items-center justify-center"><UserButton /></div> : <Image src={assets.profile_icon} alt="" className="w-7 h-7 rounded-full opacity-80" />}
          {expand && <span className="ml-3 font-medium text-sm truncate">My Profile</span>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;