import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { parseJsonBody, requireAuth, requireRoles } from "@/lib/apiGuard";
import { ObjectId } from "mongodb";
import { sanitizeText } from "@/lib/security";
import { notifyUserDashboardActivity } from "@/lib/whatsappActivityNotify";

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
    const { ticketId, text = "", screenshots = [] } = body;
    const normalizedText = sanitizeText(text, 5000);
    const normalizedScreenshots = normalizeScreenshots(screenshots);
    if (screenshots.length && normalizedScreenshots.length !== screenshots.length) {
      return NextResponse.json(
        { error: "Only ImgBB image URLs are allowed" },
        { status: 400 }
      );
    }

    if (!ticketId || !ObjectId.isValid(String(ticketId))) {
      return NextResponse.json(
        { error: "ticketId required" },
        { status: 400 }
      );
    }

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;
    const staff = access.user;

    const ticket = await db.collection("tickets").findOne({ _id: new ObjectId(String(ticketId)) });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // 5️⃣ Push reply message
    await db.collection("tickets").updateOne(
      { _id: new ObjectId(String(ticketId)) },
      {
        $push: {
          messages: {
            senderType: "staff",
            senderId: auth.decoded.uid,
            senderName: sanitizeText(staff.name, 80) || "Staff",
            senderRole: staff.role,     // admin / manager
            senderPhoto: staff.photo,
            text: normalizedText,
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

    const ref = ticket.ticketId || String(ticketId);
    const preview = normalizedText
      ? ` "${normalizedText.slice(0, 140)}${normalizedText.length > 140 ? "…" : ""}"`
      : " (Open Support in your dashboard to read the full reply.)";
    if (ticket.userId) {
      void notifyUserDashboardActivity(
        db,
        ticket.userId,
        `NeonCode: Support replied on ${ref}.${preview}`
      );
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("ADMIN REPLY ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
