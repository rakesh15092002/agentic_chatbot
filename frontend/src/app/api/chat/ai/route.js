import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import Chat from "@/models/Chat";
import connectDB from "@/config/db";

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
  try {
    await connectDB();

    // 1. Authentication Check
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      );
    }

    // 2. Validate Request Body
    const { chatId, prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json(
        { success: false, message: "Prompt is required" },
        { status: 400 }
      );
    }

    // 3. Find or Create Chat
    let chat;

    // A. Try to find existing chat if ID is provided
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId });
    }

    // B. If no ID provided OR chat not found, CREATE NEW ONE
    if (!chat) {
      chat = await Chat.create({
        userId,
        messages: [],
        // FIX 1: Generate a name from the prompt to satisfy DB Schema
        name: prompt.slice(0, 50) || "New Chat", 
      });
    }

    // 4. Save User Message
    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    });

    // 5. Call Groq API
    const completion = await groq.chat.completions.create({
      // FIX 2: Use the working model you confirmed
      model: "llama-3.1-8b-instant", 
      
      messages: chat.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // 6. Save Assistant Response
    const assistantMessage = {
      role: "assistant",
      content: completion.choices[0].message.content,
      timestamp: Date.now(),
    };

    chat.messages.push(assistantMessage);
    await chat.save();

    // 7. Return Response
    return NextResponse.json({
      success: true,
      data: assistantMessage, // The message content
      chatId: chat._id,       // The Chat ID (needed if it was a new chat)
      newChat: chat           // Full chat object (optional helper)
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}