import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

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

    // Fetch all submitted requests (latest first)
    const requests = await db
      .collection("adAccountRequests")
      .find({ userUid: decoded.uid })
      .sort({ createdAt: -1 })
      .toArray();

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
