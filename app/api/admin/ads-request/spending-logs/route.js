
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req) {
  try {
    // 🔐 Verify auth
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { db } = await getDB();

    // 🔍 Check admin role
    const admin = await db.collection("users").findOne({
      userId: decoded.uid,
    });

    if (!admin || admin.role !== "admin" && admin.role !== "manager") {
      return NextResponse.json(
        { error: "Forbidden: Admin only" },
        { status: 403 }
      );
    }

    // 📌 Pagination (optional but professional)
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // 📊 Fetch logs
    const logs = await db
      .collection("ads_spending_limit_logs")
      .find({})
      .sort({ timestamp: -1 }) // latest first
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db
      .collection("ads_spending_limit_logs")
      .countDocuments();

    return NextResponse.json({
      success: true,
      page,
      limit,
      total,
      data: logs,
    });
  } catch (err) {
    console.error("Admin Spending Logs Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
