import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

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
    const decoded = await verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subject, message, screenshots = [] } = await req.json();
    const normalizedScreenshots = normalizeScreenshots(screenshots);
    if (screenshots.length && normalizedScreenshots.length !== screenshots.length) {
      return NextResponse.json({ error: "Only ImgBB image URLs are allowed" }, { status: 400 });
    }
    const { db } = await getDB();

    const user = await db.collection("users").findOne({ userId: decoded.uid });

    // ১. টিকেটের মূল অবজেক্ট তৈরি
    const ticket = {
      ticketId: "TKT-" + Date.now(),
      userId: decoded.uid,
      subject,
      status: "open",
      messages: [
        {
          senderType: "user",
          senderId: decoded.uid,
          senderName: user?.name || "User",
          senderRole: "user",
          senderPhoto: user?.photo || "",
          text: message,
          screenshots: normalizedScreenshots,
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };


    const res = await db.collection("tickets").insertOne(ticket);

    const historyData = {
      userUid: decoded.uid,
      type: "SUPPORT_TICKET", 
      title: subject,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("otherCollection").insertOne(historyData);

    return NextResponse.json({ 
      ok: true, 
      message: "Ticket created and history recorded",
      ticketId: res.insertedId 
    });

  } catch (err) {
    console.error("Ticket Error:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
