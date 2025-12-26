
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

// টোকেনটি গেট (GET) করার জন্য
export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await getDB();
    const admin = await db.collection("users").findOne({ userId: decoded.uid });

    if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // settings কালেকশন থেকে টোকেনটি খুঁজে বের করা
    const settings = await db.collection("settings").findOne({ key: "FB_SYS_TOKEN" });

    return NextResponse.json({ ok: true, token: settings?.value || "" });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await getDB();
    const admin = await db.collection("users").findOne({ userId: decoded.uid });

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Only Admin can change settings." }, { status: 403 });
    }

    const { newToken } = await req.json();

    // টোকেন আপডেট বা ইনসার্ট করা
    await db.collection("settings").updateOne(
      { key: "FB_SYS_TOKEN" },
      { $set: { value: newToken, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, message: "Token updated successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}