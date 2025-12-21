// src/app/api/chat/get/route.js
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    // Get chatId from the URL query if it exists (e.g., /api/chat/get?chatId=123)
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!userId) {
      return NextResponse.json({ success: false, message: "User not authenticated" });
    }

    await connectDB();

    let data;
    if (chatId) {
      // Fetch only ONE specific chat
      data = await Chat.findOne({ _id: chatId, userId });
    } else {
      // Fetch ALL chats for the sidebar
      data = await Chat.find({ userId });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}