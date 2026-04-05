import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { ensureWritableUser } from "@/lib/userAccess";


export async function POST(req) {
  try {
    const decoded = await verifyToken(req);

    if (!decoded) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { db } = await getDB();
    const access = await ensureWritableUser(db, decoded.uid);
    if (!access.ok) {
      return access.response;
    }
    await db.collection("adAccountRequests").insertOne({
      ...body,
      userEmail: decoded.email,
      userUid: decoded.uid,
      MetaAccountID: "",
      status: "pending",
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, message: "Request submitted successfully" });
  } catch (err) {
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
