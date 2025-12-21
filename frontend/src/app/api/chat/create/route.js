// src/app/api/chat/create/route.js
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ success: false, message: "User not authenticated" });
    }

    const chatData = {
      userId,
      messages: [],
      name: "New Chat",
    };

    await connectDB();
    // Chat create karein aur response variable mein save karein
    const newChat = await Chat.create(chatData); 

    return NextResponse.json({ 
      success: true, 
      message: "chat created", 
      data: newChat // ID aur baaki details frontend ko bhejein
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}