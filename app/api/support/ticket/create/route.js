import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { parseJsonBody, requireAuth } from "@/lib/apiGuard";
import { getSupportDepartmentById, supportPriorityOptions } from "@/lib/supportDepartments";
import { ensureWritableUser } from "@/lib/userAccess";
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
    const { subject, message, screenshots = [], departmentId = "", priority = "Medium" } = body;
    const normalizedSubject = sanitizeText(subject, 180);
    const normalizedMessage = sanitizeText(message, 5000);
    const normalizedScreenshots = normalizeScreenshots(screenshots);
    if (screenshots.length && normalizedScreenshots.length !== screenshots.length) {
      return NextResponse.json({ error: "Only ImgBB image URLs are allowed" }, { status: 400 });
    }
    if (!normalizedSubject || !normalizedMessage) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const selectedDepartment = getSupportDepartmentById(departmentId);
    const normalizedPriority = supportPriorityOptions.includes(priority) ? priority : "Medium";
    const { db } = await getDB();
    const access = await ensureWritableUser(db, auth.decoded.uid);
    if (!access.ok) {
      return access.response;
    }

    const user = await db.collection("users").findOne({ userId: auth.decoded.uid });

    // ১. টিকেটের মূল অবজেক্ট তৈরি
    const ticket = {
      ticketId: "TKT-" + Date.now(),
      userId: auth.decoded.uid,
      subject: normalizedSubject,
      departmentId: selectedDepartment.id,
      departmentName: selectedDepartment.name,
      priority: normalizedPriority,
      status: "open",
      messages: [
        {
          senderType: "user",
          senderId: auth.decoded.uid,
          senderName: user?.name || "User",
          senderRole: "user",
          senderPhoto: user?.photo || "",
          text: normalizedMessage,
          screenshots: normalizedScreenshots,
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };


    const res = await db.collection("tickets").insertOne(ticket);

    const historyData = {
      userUid: auth.decoded.uid,
      type: "SUPPORT_TICKET", 
      title: normalizedSubject,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("otherCollection").insertOne(historyData);

    void notifyUserDashboardActivity(
      db,
      auth.decoded.uid,
      `NeonCode: Support ticket opened — ${ticket.ticketId}. Subject: ${normalizedSubject}`
    );

    return NextResponse.json({ 
      ok: true, 
      message: "Ticket created and history recorded",
      ticketId: String(res.insertedId)
    });

  } catch (err) {
    console.error("Ticket Error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
