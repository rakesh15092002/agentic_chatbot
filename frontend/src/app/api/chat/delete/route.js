// src/app/api/chat/delete/route.js
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const { chatId } = await req.json();

    // 1. Check Authentication
    if (!userId) {
      return NextResponse.json({ success: false, message: "User not authenticated" });
    }

    // 2. Validate Request
    if (!chatId) {
      return NextResponse.json({ success: false, message: "Chat ID is required" });
    }

    await connectDB();

    // 3. Delete with Ownership check
    // findOneAndDelete ye ensure karta hai ki chatId match ho aur wo usi user ki ho
    const deletedChat = await Chat.findOneAndDelete({ _id: chatId, userId });

    if (!deletedChat) {
      return NextResponse.json({ 
        success: false, 
        message: "Chat not found or you don't have permission to delete it" 
      });
    }

    return NextResponse.json({
      success: true,
      message: "Chat Deleted successfully",
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}