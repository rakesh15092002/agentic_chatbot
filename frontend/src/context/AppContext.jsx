"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation"; // 1. Router import karein

export const AppContext = createContext(null);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter(); // 2. Router initialize karein

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsersChats = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const token = await getToken();

      const { data } = await axios.get("/api/chat/get", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      const chatList = data.data || [];
      chatList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setChats(chatList);

      // CHANGE: Hamesha setSelectedChat(chatList[0]) mat kijiye. 
      // Agar user pehle se kisi dynamic route par hai, toh Page.jsx khud usey set karega.
    } catch (error) {
      toast.error("Failed to fetch chats");
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      if (!user) return;
      const token = await getToken();

      const { data } = await axios.post(
        "/api/chat/create",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        // Backend se mila hua naya chat data use karein
        const newChat = data.data; 
        setChats((prev) => [newChat, ...prev]);
        setSelectedChat(newChat);
        
        // 3. CHANGE: Naye chat ki ID par redirect karein
        router.push(`/chat/${newChat._id}`); 
        toast.success("New chat started");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to create chat");
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsersChats();
    }
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        user,
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        fetchUsersChats,
        createNewChat,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};