
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { parseJsonBody, requireAuth } from "@/lib/apiGuard";
import { ObjectId } from "mongodb";
import { ensureWritableUser } from "@/lib/userAccess";
import { sanitizeText } from "@/lib/security";

const normalizeScreenshots = (screenshots = []) => {
  const isValidImgBb = (url) =>
    typeof url === "string" && /^https?:\/\/(i\.ibb\.co|ibb\.co)\//i.test(url);

  return screenshots
    .filter((item) => item && isValidImgBb(item.url))
    .map((item) => ({
      url: item.url,
      ...(typeof item.deleteUrl === "string" ? { deleteUrl: item.deleteUrl } : {}),
    }));
};

export async function POST(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const body = await parseJsonBody(req);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const { ticketId, text, screenshots = [] } = body;
    const normalizedText = sanitizeText(text, 5000);
    const normalizedScreenshots = normalizeScreenshots(screenshots);
    if (screenshots.length && normalizedScreenshots.length !== screenshots.length) {
      return NextResponse.json({ error: "Only ImgBB image URLs are allowed" }, { status: 400 });
    }
    if (!ticketId || !normalizedText) {
      return NextResponse.json({ ok: false, error: "ticketId and message are required" }, { status: 400 });
    }

    const { db } = await getDB();
    const access = await ensureWritableUser(db, auth.decoded.uid);
    if (!access.ok) return access.response;

    const user = await db.collection("users").findOne({ userId: auth.decoded.uid });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const updateResult = await db.collection("tickets").updateOne(
      { _id: new ObjectId(String(ticketId)), status: { $ne: "closed" } },
      {
        $push: {
          messages: {
            senderType: "user",
            senderId: auth.decoded.uid,
            senderName: sanitizeText(user.name, 80) || "User",
            senderRole: "user",
            senderPhoto: user.photo,
            text: normalizedText,
            screenshots: normalizedScreenshots,
            createdAt: new Date(),
          },
        },
        $set: { updatedAt: new Date() },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ ok: false, error: "Ticket not found or closed" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Support ticket message error:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
