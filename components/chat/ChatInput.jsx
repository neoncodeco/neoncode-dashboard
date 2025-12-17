"use client";

import { useState } from "react";
import {
  addDoc,
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import ImageUploader from "../ImageUploader";
import { SendHorizontal, Paperclip, X, Loader2 } from "lucide-react";

export default function ChatInput({ chatId, user }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if ((!text.trim() && !image) || sending) return;

    try {
      setSending(true);

      await setDoc(
        doc(db, "chats", chatId),
        {
          userId: user.uid,
          status: "open",
          lastMessage: text.trim() || "📷 Image",
          lastSender: "user",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (text.trim()) {
        await addDoc(collection(db, "chats", chatId, "messages"), {
          senderRole: "user",
          type: "text",
          text: text.trim(),
          createdAt: serverTimestamp(),
        });
      }

      if (image?.url) {
        await addDoc(collection(db, "chats", chatId, "messages"), {
          senderRole: "user",
          type: "image",
          imageUrl: image.url,
          createdAt: serverTimestamp(),
        });
      }

      setText("");
      setImage(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="bg-[#214311] ">
      
      {/* 🖼 Image Preview */}
      {image && (
        <div className="mb-3">
          <div className="relative w-24 h-24 rounded-xl overflow-hidden shadow-lg ring-1 ring-black/10">
            <img
              src={image.url}
              alt="preview"
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setImage(null)}
              className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-black"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 💬 Input Box */}
      <div className="relative flex items-end gap-2 rounded-2xl border p-2 ">

        {/* 📎 Upload */}
        <div className="flex items-center text-gray-300 hover:text-blue-600 transition">
          <ImageUploader
            onUploadSuccess={setImage}
            customIcon={<Paperclip size={18} />}
          />
        </div>

        {/* ✍️ Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type your message..."
          className="flex-1 resize-none  text-sm text-white placeholder:text-gray-400 focus:outline-none px-2 py-2 max-h-32"
        />

        {/* 🚀 Send Button */}
        <button
          onClick={send}
          disabled={(!text.trim() && !image) || sending}
          className={`h-10 w-10 flex items-center justify-center rounded-full transition-all
            ${
              text.trim() || image
                ? "bg-gradient-to-tr from-blue-500 to-blue-600 text-white shadow-md hover:scale-105 active:scale-95"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          {sending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <SendHorizontal size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
