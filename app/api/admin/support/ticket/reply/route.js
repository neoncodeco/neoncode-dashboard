import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { ObjectId } from "mongodb";

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
    // 1️⃣ Verify Firebase token
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ Parse body (NOW includes screenshots)
    const { ticketId, text = "", screenshots = [] } = await req.json();
    const normalizedScreenshots = normalizeScreenshots(screenshots);
    if (screenshots.length && normalizedScreenshots.length !== screenshots.length) {
      return NextResponse.json(
        { error: "Only ImgBB image URLs are allowed" },
        { status: 400 }
      );
    }

    if (!ticketId) {
      return NextResponse.json(
        { error: "ticketId required" },
        { status: 400 }
      );
    }

    const { db } = await getDB();

    // 3️⃣ Load staff from DB
    const staff = await db.collection("users").findOne({
      userId: decoded.uid,
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 404 }
      );
    }

    // 4️⃣ Role check
    if (!["admin", "manager"].includes(staff.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 5️⃣ Push reply message
    await db.collection("tickets").updateOne(
      { _id: new ObjectId(ticketId) },
      {
        $push: {
          messages: {
            senderType: "staff",
            senderId: decoded.uid,
            senderName: staff.name,
            senderRole: staff.role,     // admin / manager
            senderPhoto: staff.photo,
            text: text || "",
            screenshots: normalizedScreenshots,
            createdAt: new Date(),
          },
        },
        $set: {
          status: "answered",
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("ADMIN REPLY ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
