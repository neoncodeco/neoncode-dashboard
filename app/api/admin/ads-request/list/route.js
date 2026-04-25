
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req) {
  try {
    /* ================= AUTH ================= */
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { db } = await getDB();

    /* ================= ROLE CHECK ================= */
    const admin = await db.collection("users").findOne({
      userId: decoded.uid,
    });

    if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
      return NextResponse.json(
        { ok: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    /* ================= FETCH DATA ================= */
    const requests = await db
      .collection("adAccountRequests")
      .find({})
      .sort({ createdAt: -1 }) // newest first
      .toArray();

    return NextResponse.json(
      {
        ok: true,
        data: requests,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
