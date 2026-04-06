import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

const normalizeMatchValue = (value) => String(value || "").trim().toLowerCase();

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);

    if (!decoded) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const { db } = await getDB();
    const currentUser = await db.collection("users").findOne(
      { userId: decoded.uid },
      { projection: { userId: 1, email: 1 } }
    );

    const normalizedUid = normalizeMatchValue(decoded.uid);
    const normalizedEmail = normalizeMatchValue(currentUser?.email || decoded.email);

    const allRequests = await db
      .collection("adAccountRequests")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const requests = allRequests.filter((item) => {
      const itemUserUid = normalizeMatchValue(item.userUid);
      const itemUserId = normalizeMatchValue(item.userId);
      const itemUserEmail = normalizeMatchValue(item.userEmail);

      return (
        (normalizedUid && itemUserUid === normalizedUid) ||
        (normalizedUid && itemUserId === normalizedUid) ||
        (normalizedEmail && itemUserEmail === normalizedEmail)
      );
    });

    return NextResponse.json({
      ok: true,
      count: requests.length,
      data: requests,
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
