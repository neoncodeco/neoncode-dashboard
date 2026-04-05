import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import {
  generateAutoReply,
  getSupportSystemPrompt,
  resolveReplyLanguage,
} from "@/lib/chatAutoReply";
import { ensureWritableUser } from "@/lib/userAccess";

async function generateOpenAIReply({
  text,
  preferredLanguage,
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return null;
  }

  const language = resolveReplyLanguage(text, preferredLanguage);
  const languageInstruction =
    language === "bn"
      ? "Respond in Bangla script."
      : "Respond in English.";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `${getSupportSystemPrompt()}\n\n${languageInstruction}`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "OpenAI request failed");
  }

  return data?.choices?.[0]?.message?.content?.trim() || null;
}

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, type, text, imageUrl, preferredLanguage = "auto" } = await req.json();

    if (!chatId) {
      return NextResponse.json({ error: "chatId is required" }, { status: 400 });
    }

    if (!text?.trim() && !imageUrl) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const safeType = imageUrl ? "image" : type || "text";

    const { db } = await getDB();
    const access = await ensureWritableUser(db, decoded.uid);
    if (!access.ok) {
      return access.response;
    }

    await db.collection("live_chats").updateOne(
      { chatId, userId: decoded.uid },
      {
        $set: {
          status: "open",
          lastMessage: text?.trim() || "Image",
          lastSender: "user",
          updatedAt: new Date(),
        },
        $setOnInsert: {
          chatId,
          userId: decoded.uid,
          unreadForUser: 0,
          createdAt: new Date(),
        },
        $inc: { unreadForAdmin: 1 },
      },
      { upsert: true }
    );

    await db.collection("live_chat_messages").insertOne({
      chatId,
      senderRole: "user",
      type: safeType,
      text: text?.trim() || "",
      imageUrl: imageUrl || null,
      seen: false,
      createdAt: new Date(),
    });

    if (safeType === "text" && text?.trim()) {
      let autoReply = null;

      try {
        autoReply = await generateOpenAIReply({
          text: text.trim(),
          preferredLanguage,
        });
      } catch (openAiError) {
        console.error("OPENAI CHAT ERROR:", openAiError);
      }

      if (!autoReply) {
        autoReply = generateAutoReply(text, preferredLanguage);
      }

      if (autoReply) {
        await db.collection("live_chat_messages").insertOne({
          chatId,
          senderRole: "assistant",
          type: "text",
          text: autoReply,
          imageUrl: null,
          seen: true,
          automated: true,
          createdAt: new Date(),
        });

        await db.collection("live_chats").updateOne(
          { chatId, userId: decoded.uid },
          {
            $set: {
              lastMessage: autoReply,
              lastSender: "assistant",
              updatedAt: new Date(),
              status: "open",
            },
          }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("CHAT SEND ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
